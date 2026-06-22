# PES 6 / Football Life - Web Ecosystem Infrastructure

Este documento detalla la arquitectura desacoplada, el modelo de datos y el plan de implementación para el ecosistema web (Panel de Administración, Perfil de Jugador y Ranking) del servidor de Pro Evolution Soccer, utilizando una infraestructura Serverless y Server-demanding independiente para salvaguardar el rendimiento del servidor de juego (`fiveserver`).

---

## 1. Arquitectura del Sistema

Para garantizar que el tráfico web, las consultas complejas de bases de datos y la administración no afecten el ping o el rendimiento de la máquina virtual en **Google Cloud Platform (Free Tier)**, se ha diseñado una arquitectura completamente desacoplada:

* **Game Server (GCP - Compute Engine `e2-micro`):** Dedicado exclusivamente a la ejecución del contenedor Docker de `fiveserver` y al tráfico de red del juego.
* **Database (Supabase - PostgreSQL):** Base de datos centralizada y externa. Ambos entornos (GCP y el ecosistema web) se conectan de forma remota a esta instancia.
* **Backend API (Render - Node.js / Express):** Capa de lógica de negocio, autenticación de administradores, procesamiento de historiales y caché de rankings.
* **Frontend (Vercel - Jamstack / Static Hosting):** Interfaz de usuario de alta velocidad para el panel de administración, perfiles y rankings.

---

## 2. Modelo de Datos Mínimo (Supabase / PostgreSQL)

Estructura de tablas optimizada para indexación y consultas rápidas desde la API de Node.js sin sobrecargar las escrituras del servidor de juego.

```sql
-- Tabla de Usuarios/Jugadores (Espejo o nativa de fiveserver)
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, banned, suspended
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historial de Partidos
CREATE TABLE match_history (
    id SERIAL PRIMARY KEY,
    home_player_id INT REFERENCES players(id),
    away_player_id INT REFERENCES players(id),
    home_score INT NOT NULL,
    away_score INT NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Caché de Ranking (Para evitar cálculos en tiempo real en cada consulta)
CREATE TABLE ranking_cache (
    player_id INT PRIMARY KEY REFERENCES players(id),
    username VARCHAR(50) NOT NULL,
    matches_played INT DEFAULT 0,
    matches_won INT DEFAULT 0,
    points INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_match_history_players ON match_history(home_player_id, away_player_id);

---

## 3. Especificación del Backend API (Node.js + Express)

El backend alojado en **Render** expondrá los siguientes endpoints públicos y privados (protegidos mediante JWT para administración).

### Endpoints Públicos (Jugadores y Comunidad)
* `GET /api/ranking` - Devuelve el Top de jugadores ordenados por puntos desde `ranking_cache`.
* `GET /api/players/:username` - Retorna los datos públicos del perfil del jugador.
* `GET /api/players/:username/history` - Paginación del historial de partidos del jugador.

### Endpoints Privados (Administración)
* `POST /api/auth/login` - Autenticación de administradores (retorna JWT).
* `PUT /api/admin/players/:id/status` - Modifica el estado del jugador (`active` / `banned`).
* `POST /api/admin/cron/refresh-ranking` - Endpoint protegido (ejecutado por un CRON externo) para recalcular la tabla `ranking_cache`.

---

## 4. Cronograma y Plan de Ruta (Roadmap)

### Fase 1: Centralización de Datos e Integración de Red
* [x] Creación del proyecto en Supabase y ejecución del script de migración DDL.
* [x] Reconfiguración de las variables de entorno de `fiveserver` en la VM de GCP para apuntar a la base de datos externa de Supabase.
* [x] Pruebas de estrés de conectividad y latencia entre GCP y Supabase.

### Fase 2: Desarrollo del Backend en Node.js
* [x] Inicialización del repositorio de Node.js con Express y configuración de `pg` / `Sequelize` / `Prisma` para la conexión a Supabase.
* [x] Desarrollo de la lógica del script de actualización del ranking de manera asíncrona.
* [x] Implementación de autenticación JWT para rutas administrativas.
* [ ] Despliegue continuo en Render enlazado a la rama `main` de GitHub.

### Fase 3: Frontend y Panel de Control en Vercel
* [ ] Diseño de la interfaz de usuario UI/UX (Módulos: Tabla de Posiciones, Buscador de Perfiles, Login Admin, Panel de Gestión).
* [ ] Integración del Frontend con los endpoints de la API en Render.
* [ ] Despliegue en Vercel y configuración de producción.

### Fase 4: Automatización y Mantenimiento
* [ ] Configuración de un monitor CRON (ej. GitHub Actions o Cron-Job.org) para disparar la actualización de rankings cada 30 minutos.
* [ ] Configuración de logs y alertas básicas ante caídas del servicio web.