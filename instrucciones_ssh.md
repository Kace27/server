# Conexión SSH a la Máquina Virtual de Google Cloud

Este documento contiene las instrucciones y configuraciones necesarias para que cualquier agente o usuario pueda conectarse mediante SSH a la máquina virtual de Google Cloud.

## Información de la VM
* **Instancia:** `instance-20260621-060418`
* **Proyecto de GCP:** `sticker-factory-464504`
* **Zona:** `us-central1-c`
* **Sistema Operativo:** Ubuntu 24.04 LTS

---

## Instrucciones de Conexión

Si ejecutas comandos en un entorno donde `gcloud` no está instalado en el PATH global o el instalador de Homebrew falla debido a conflictos con Python 3.14, sigue estos pasos:

### 1. Ubicación del SDK e Intérprete de Python
El SDK de Google Cloud fue instalado manualmente en el directorio del proyecto para evitar problemas de compatibilidad:
* **SDK de gcloud:** `/Volumes/FootballLife/server/google-cloud-sdk/bin/gcloud`
* **Python compatible del sistema:** `/Library/Frameworks/Python.framework/Versions/3.12/bin/python3` (requiere `virtualenv` instalado vía `pip`).

### 2. Comando para Establecer la Conexión SSH
Para iniciar una sesión interactiva SSH en la máquina virtual, debes forzar el uso del binario de Python adecuado en la variable de entorno `CLOUDSDK_PYTHON`:

```bash
export CLOUDSDK_PYTHON="/Library/Frameworks/Python.framework/Versions/3.12/bin/python3"
/Volumes/FootballLife/server/google-cloud-sdk/bin/gcloud compute ssh instance-20260621-060418 --zone=us-central1-c --project=sticker-factory-464504
```

### 3. Autenticación y Configuración de Proyecto (Si es necesario)
Si el agente no tiene credenciales activas o no está posicionado en el proyecto correcto, debe ejecutar lo siguiente antes de la conexión:

* **Iniciar sesión en Google Cloud:**
  ```bash
  export CLOUDSDK_PYTHON="/Library/Frameworks/Python.framework/Versions/3.12/bin/python3"
  /Volumes/FootballLife/server/google-cloud-sdk/bin/gcloud auth login
  ```

* **Establecer el Proyecto Activo:**
  ```bash
  export CLOUDSDK_PYTHON="/Library/Frameworks/Python.framework/Versions/3.12/bin/python3"
  /Volumes/FootballLife/server/google-cloud-sdk/bin/gcloud config set project sticker-factory-464504
  ```
