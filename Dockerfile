FROM python:3.10-slim

# Optimizar comportamiento de Python en Docker
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias necesarias para compilar librerías clásicas de C
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libmariadb-dev \
    make \
    python3-dev \
    python3-venv \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copiar el código fuente de juce/fiveserver (a través del build context)
COPY . .

# Ejecutar el Makefile nativo del repositorio que crea el entorno virtual (.venv)
# e instala las dependencias de Python de forma nativa para ARM64 / Apple Silicon
RUN make install

# Comando oficial de ejecución para el módulo de PES 6 (sixserver)
CMD ["./service.sh", "sixserver", "run"]
