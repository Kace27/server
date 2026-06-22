# Reporte de Investigación: Discrepancia de Autenticación Hash (PES6 / Fiveserver)

Este documento detalla la investigación técnica realizada sobre la discrepancia de hashes entre el cliente de juego (PES6 en PS2, ejecutándose en PCSX2) y el servidor de registro web (`Fiveserver`).

---

## 1. Resumen del Problema

Se detectó que las cuentas creadas a través de la interfaz web de registro en el puerto `8190` no podían iniciar sesión desde el cliente de juego PES6, arrojando errores de credenciales incorrectas. De igual manera, las cuentas creadas directamente en la base de datos para funcionar con el cliente no coincidían con la estructura del flujo de registro web.

- **Síntoma:** El hash enviado por el juego y el almacenado por la web en la base de datos (DB) diferían drásticamente para un mismo par de usuario/contraseña.
- **Restricción:** No realizar modificaciones en el servidor ni en el cliente durante la fase de investigación.

---

## 2. Datos de Prueba y Comportamiento de Hashes

Durante las pruebas se utilizaron dos credenciales específicas para aislar el comportamiento de encriptación:

### Credenciales: `prueba` / `prueba`
* **Hash enviado por el juego (encriptado):** `b46b7bd96ee956d1959bddc6a3122644`
* **Hash registrado en la DB por el sitio web:** `b7fd9e0b53ad49820e556686548169df`
* **Hash interno desencriptado (Juego):** `c16b2ab61f3031d8831d568902d719d0`
* **Hash interno desencriptado (DB Web):** `44404f40155980b28990ef8c47138625`

### Credenciales: `abcde` / `abcde`
* **Hash enviado por el juego (encriptado):** `bc0af850c0e58b6226eb05da47ce3c8d`
* **Hash interno desencriptado (Juego):** `3411df1832936b662c93b6e1ee62e29b`

---

## 3. Metodología y Análisis de Archivos del Cliente

Se analizó la estructura del ISO montado de PES6 (`SLES-54362`). Los archivos críticos inspeccionados fueron:
1. `SLES_543.62` (Ejecutable principal de PS2)
2. `ntgui2eu.elf` (Módulo de red)
3. `OVER.AFS` (Archivo de recursos y configuraciones de red)

### Descubrimiento en `OVER.AFS`
Al inspeccionar `OVER.AFS` a nivel binario, se identificaron los siguientes parámetros de seguridad:
* **Clave de cifrado Blowfish** (ubicada en el offset `0xa17910`):
  ```text
  27501fd04e6b82c831024dac5c6305221974deb9388a21901d576cbbe2f377ef23d75486010f37819afe6c321a0146d21544ec365bf7289a
  ```
* **Coincidencia:** La clave del cliente es **idéntica** a la configurada en el servidor Fiveserver (`config.py`). Esto confirmó que el algoritmo de cifrado Blowfish base no tiene discrepancias; el problema reside en el cálculo previo del hash MD5.

---

## 4. Diagnóstico del Algoritmo (Causa Raíz)

La diferencia fundamental reside en cómo se construye la cadena de entrada para el algoritmo de hash MD5 antes de aplicar el cifrado Blowfish.

```mermaid
graph TD
    subgraph Registro Web
        A[Serial Padded 36 bytes] --> D[Concatenar]
        B[Username] --> D
        C[Dash -] --> D
        E[Password] --> D
        D --> F[MD5]
        F --> G[Blowfish Encrypt]
        G --> H[(Database Hash)]
    end

    subgraph Cliente de Juego (Patcheado)
        I[Username] --> L[Concatenar]
        J[16 Bytes Nulos \x00] --> L
        K[Password] --> L
        L --> M[MD5]
        M --> N[Blowfish Encrypt]
        N --> O[Red / Login Packet]
    end
```

### A. Algoritmo del Registro Web (Original)
El formulario de registro genera la cadena concatenando el número de serie de la consola/juego (rellenado con espacios hasta 36 caracteres), el nombre de usuario, un guion `-`, y la contraseña:
$$\text{Input}_{MD5} = \text{Serial (padded a 36)} + \text{username} + \text{"-"} + \text{password}$$
$$\text{Hash} = \text{Blowfish}(\text{MD5}(\text{Input}_{MD5}))$$

### B. Algoritmo del Cliente de Juego (Modificado/Parcheado)
El cliente de juego parcheado omite por completo el uso de la serie del disco (Serial) y en su lugar utiliza 16 bytes nulos (`\x00`) como separador entre el usuario y la contraseña:
$$\text{Input}_{MD5} = \text{username} + \text{bytes\_nulos}(16) + \text{password}$$
$$\text{Hash} = \text{Blowfish}(\text{MD5}(\text{Input}_{MD5}))$$

---

## 5. Validación Matemática (Prueba de Concepto)

Utilizando el script `/Users/kace/.gemini/antigravity-ide/scratch/decrypt_hash.py`, validamos las dos fórmulas con los datos capturados:

### Caso 1: `prueba` / `prueba`
1. **Entrada MD5 del Juego:** `b"prueba" + b"\x00"*16 + b"prueba"`
2. **MD5 calculado:** `c16b2ab61f3031d8831d568902d719d0`
3. **Cifrado Blowfish** del MD5 resultante con la clave compartida da como resultado:
   `b46b7bd96ee956d1959bddc6a3122644` (Coincidencia exacta con el paquete de red del juego).

### Caso 2: `abcde` / `abcde`
1. **Entrada MD5 del Juego:** `b"abcde" + b"\x00"*16 + b"abcde"`
2. **MD5 calculado:** `3411df1832936b662c93b6e1ee62e29b`
3. **Cifrado Blowfish** del MD5 resultante con la clave compartida da como resultado:
   `bc0af850c0e58b6226eb05da47ce3c8d` (Coincidencia exacta con el paquete de red del juego).

---

## 6. Recomendaciones y Próximos Pasos

Para resolver el problema sin alterar la compatibilidad del cliente de juego, se sugieren las siguientes acciones en el servidor:

### Acción 1: Modificar la Generación de Hashes del Registro Web
Actualizar el script de frontend del formulario de registro web (`web6/form-sample.html`) para emular la fórmula del cliente de juego:
```javascript
// Reemplazar la fórmula anterior basada en serial por:
var user = document.getElementById('user').value;
var pass = document.getElementById('pass').value;

// Generar la secuencia equivalente a: user + 16 null bytes + pass
// y luego calcular el hash hexadecimal MD5 correspondiente.
```

### Acción 2: Actualizar el Backend del Servidor (`register.py`)
Asegurar que el validador del backend de registro de Fiveserver no dependa de un serial obligatorio de longitud fija (o manejar seriales vacíos/genéricos en el backend) ya que el cliente de juego parcheado envía hashes basados en la estructura sin serial.

---
*Reporte elaborado de manera autónoma y verificado mediante descifrado criptográfico inverso.*
