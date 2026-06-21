# Solución al Error de Red PES 6: "No pudo transmitir usando el puerto UDP 5730"

## Resumen del Error
Durante la fase de **"Comprobando entorno de red..."** al intentar conectarse al servidor de Pro Evolution Soccer 6 (PES 6), el juego muestra el siguiente mensaje de error y no permite avanzar:

> **"No pudo transmitir usando el puerto UDP 5730. Puede que necesites conectarte directamente a Internet o ajustar los parámetros de tu router (dispositivo de red)."**

---

## Causa Raíz
Este error ocurre cuando el cliente de PES 6 intenta determinar su tipo de NAT utilizando el protocolo **STUN (Session Traversal Utilities for NAT)**. 

Para que la detección de NAT funcione de acuerdo con las especificaciones requeridas por PES 6 (que utiliza un protocolo STUN antiguo para detectar si tiene una NAT simétrica o cónica), **el servidor STUN obligatoriamente debe contar con 2 direcciones IP públicas configuradas**.

1. **Procedimiento del Cliente**: El juego envía una solicitud al servidor STUN a su IP primaria y puerto primario.
2. **Prueba de IP Alternativa (Alternate IP)**: Luego solicita al servidor STUN que le responda desde una dirección IP diferente (IP secundaria) o un puerto diferente para comprobar si el firewall del usuario permite el tráfico entrante desde orígenes no solicitados directamente.
3. **El Fallo**: Si el servidor STUN no tiene dos direcciones IP públicas asociadas, no puede responder desde la dirección IP secundaria. El juego detecta esto como un fallo de red/bloqueo de puertos en el cliente y aborta la conexión con el mensaje del puerto 5730.

---

## Intentos Fallidos Comunes (Qué NO hacer)

### 1. Levantar un servicio `stund` local en la misma Máquina Virtual (VM) de GCP
* **Por qué falla**: La VM de GCP solo tiene **una única dirección IP pública**. Aunque configures un software de STUN local (`stund`), este no podrá responder desde una IP alternativa, por lo que el cliente de PES 6 seguirá fallando en la comprobación.

### 2. Redirigir el tráfico DNS de STUN a servidores públicos genéricos (como Google STUN: `74.125.250.129`)
* **Por qué falla**: Muchos servidores STUN modernos (incluido el de Google) ya no soportan o tienen deshabilitada la funcionalidad de responder desde una dirección IP alternativa (Alternate IP), ya que las especificaciones modernas de STUN (RFC 5389 y posteriores) eliminaron o cambiaron este comportamiento. PES 6 requiere estrictamente el comportamiento antiguo del estándar STUN original (RFC 3489).

---

## Solución Definitiva y Robusta

La solución consiste en configurar el script de resolución de DNS (`pes6_dns.py`) para que las consultas relacionadas con STUN sean redirigidas a un servidor STUN público que sí cuente con el setup de **doble IP pública** y sea compatible con las peticiones de PES 6.

### 1. Dirección del STUN Correcto
El servidor STUN de la comunidad de **pes6.es** está configurado correctamente con múltiples IPs públicas y responde de forma compatible:
* **IP del STUN funcional**: `46.101.172.11`

### 2. Configuración en `pes6_dns.py`
En el servidor DNS local (`pes6_dns.py`), se deben interceptar las peticiones DNS que contengan subdominio stun y resolverlas apuntando a la IP `46.101.172.11`, mientras que las peticiones del lobby del juego siguen apuntando a la IP local de nuestra VM.

Ejemplo de lógica en la resolución de DNS:

```python
# Dentro de la función de resolución DNS en pes6_dns.py
query_name = str(request.q.qname).lower()

if "stun" in query_name:
    # Redirigir peticiones STUN (ej. we9stun.konami.net, stun.pes6.es) al servidor funcional con doble IP
    ip_destino = "46.101.172.11"
else:
    # Resolver los servidores de lobby, perfiles y cuentas a nuestra propia máquina virtual
    ip_destino = VM_PUBLIC_IP
```

Con este redireccionamiento en el DNS, el juego pasará la comprobación del entorno de red inmediatamente y permitirá acceder a la pantalla de ingreso de contraseña y selección de salas de juego.
