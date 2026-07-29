# Smart Scout 3.0 — Plataforma Inteligente de Scouting y Análisis Táctico

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Storage-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel)](https://vercel.com/)

---

## 📌 Contexto del Proyecto (TFM)

**Smart Scout 3.0** es una plataforma web desarrollada como prototipo funcional para el **Trabajo Fin de Máster (TFM)** en la **INEFC Lleida – Universitat de Lleida (UdL)**.

El proyecto digitaliza y automatiza el proceso de scouting deportivo en fútbol profesional mediante la integración de:
1. **Etiquetado de Vídeo y Auto-Clips (Fases 1–6)**: Herramienta de vídeo análisis para registrar acciones técnicas N2 con sello temporal, mapa de 18 zonas del campo y generación automática de referencias de clips de vídeo.
2. **Registro en Directo y Pipeline YOLO (Fase 8)**: Captura de eventos en tiempo real durante partidos en directo con cronómetro interactivo e importación de datos de seguimiento y telemetría de jugadores procesados mediante modelo YOLO.
3. **Motor de Scoring Cuantitativo v2 (Algoritmo Rank-Sum - Fase 5)**: Motor estadístico que calcula la tasa de acierto y frecuencia normalizada por 90 minutos de cada métrica N2, la posiciona en percentil respecto a la población de jugadores del mismo puesto y aplica ponderaciones matemáticas de **Rank-Sum** acordes al modelo de juego activo.
4. **Configurador Dinámico de Modelos de Juego**: Interfaz interactiva que permite definir modelos tácticos personalizados (ej. *Posesión 4-3-3*, *Presión Alta*, *Transición Rápida*) reordenando la jerarquía de métricas por posición.
5. **Pizarra Táctica (Campograma - Fase 7)**: Alineador táctico interactivo con soportes drag & drop táctiles, sugerencias inteligentes por compatibilidad de score y persistencia de esquemas tácticos.
6. **Ficha Técnica e Informes de Imprenta**: Visualizaciones avanzadas estilo Wyscout con gráficos radar, desglose de percentiles, notas cualitativas de scouting y modo exportación de informe para imprimir/PDF.

---

## 🏗️ Arquitectura del Sistema

La arquitectura está construida con el framework Next.js 15 App Router y arquitectura serverless acoplada a Supabase BaaS:

```
smart-scout/
├── app/                        --> App Router de Next.js 15 (Layout, Global CSS, Page principal)
├── components/                 --> Componentes React modularizados por módulo funcional
│   ├── campograma/             --> Pizarra Táctica (DndKit, SVG, Alineaciones)
│   ├── comparador/             --> Comparador Cabeza a Cabeza de Jugadores
│   ├── dashboard/              --> Vista General, Métricas KPI y Gráficos Recharts
│   ├── directorio/             --> Directorio de Jugadores, Clubes y Ficha Técnica Modal
│   ├── endirecto/              --> Registro de acciones en vivo, cronómetro y vinculación de vídeo
│   ├── layout/                 --> Sidebar, Header con selector de modelo activo, MobileNav
│   ├── modelos/                --> Configurador de Modelos de Juego y Pesos Rank-Sum
│   ├── ui/                     --> Componentes base UI (Button, Modal, ConfirmModal, Select, Input, Card, Badge)
│   └── video/                  --> Reproductor de vídeo, Botonera N2, PitchMap y Telemetría YOLO
├── lib/
│   ├── constants/              --> Mapeo de métricas N1/N2, 18 zonas de campo, rangos Rank-Sum y posiciones
│   ├── formations/             --> Definición de esquemas tácticos (4-3-3, 4-4-2, 4-2-3-1...)
│   ├── scoring/                --> Motor de Scoring v2 (calcularScore.ts, rankSum.ts)
│   └── supabase/               --> Clientes de consulta Supabase (jugadores, partidos, modelos, acciones...)
├── supabase/
│   └── migrations/             --> Scripts de migración SQL ordenados y script maestro unificado
├── types/                      --> Definiciones TypeScript de entidades y tablas Supabase
└── README.md
```

### Componentes y Tecnologías Clave
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS (Estilo Oscuro Glassmorphic), Lucide Icons.
- **Base de Datos & Storage**: Supabase (PostgreSQL con Row Level Security, Storage buckets para `videos`, `clips` y `jugadores`).
- **Pipeline de Telemetría YOLO**: Procesamiento offline de vídeo para detección de tracking de jugadores y cálculo automático de posesión de balón.
- **Gráficos e Interacción**: `@dnd-kit/core` (Drag & drop táctil) y `recharts` (Radares e histogramas).

---

## 🗄️ Esquema de Tablas en Supabase

1. **`clubes`**: Registro de clubes deportivos (id, nombre, ciudad, escudo_url).
2. **`jugadores`**: Datos biográficos de futbolistas (id, nombre, apellidos, posicion, dorsal, foto_url, score_global, partidos_analizados, minutos_jugados).
3. **`metricas_nivel1`**: Categorías macro tácticas (Ataque, Defensa, Transición, etc.).
4. **`metricas_nivel2`**: Métricas técnicas específicas N2 (Pase Filtrado, Presión Tras Pérdida, Intercepción, Centro al Área, etc.).
5. **`metricas_posicion`**: Mapeo y ponderación por defecto de métricas N2 relevantes para cada posición.
6. **`modelos_juego`**: Modelos de juego predefinidos y personalizados por el usuario.
7. **`ponderaciones_modelo`**: Tabla de pesos Rank-Sum asignados a cada métrica N2 por posición para un modelo de juego específico.
8. **`partidos`**: Registro de partidos etiquetados o en directo (id, rival, fecha, video_url, telemetria_url, posesion_local, posesion_visitante).
9. **`acciones_etiquetadas`**: Eventos registrados (jugador_id, partido_id, video_id, metrica_n2_id, minuto, segundo, resultado, zona, clip_url, valor_accion, metadata).
10. **`jugador_metricas_n2`**: Cache de percentiles, muestra acumulada y valores reales calculados por el motor de scoring.
11. **`valoraciones_scout`**: Informes y notas cualitativas de ojeadores asociadas a cada jugador.
12. **`alineaciones_guardadas`**: Esquemas tácticos y alineaciones almacenadas desde la pizarra interactiva.

---

## 🚀 Instalación y Configuración Local

### Prerrequisitos
- **Node.js**: v18.0.0 o superior.
- **npm** o **yarn**.

### Pasos

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/TU_USUARIO/smart-scout.git
   cd smart-scout
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar las Variables de Entorno**:
   Crea un archivo `.env.local` en la raíz del proyecto `smart-scout/` con las credenciales de tu proyecto Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
   ```

4. **Ejecutar la Migración SQL en Supabase**:
   Copia el contenido del archivo `supabase/migrations/20260729_master_migrations_combined.sql` y ejecútalo en el **SQL Editor** de tu Dashboard de Supabase.

5. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📦 Pasos para Despliegue en Vercel

1. **Subir cambios a GitHub**:
   Asegúrate de que todos los cambios estén pusheados a la rama principal de GitHub (`main`).

2. **Crear Proyecto en Vercel**:
   - Accede a [Vercel Dashboard](https://vercel.com/dashboard).
   - Haz clic en **Add New...** -> **Project**.
   - Selecciona e importa el repositorio `smart-scout`.

3. **Configurar Variables de Entorno en Vercel**:
   En el paso de configuración **Environment Variables**, añade:
   - `NEXT_PUBLIC_SUPABASE_URL`: La URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: La Anon Key pública de Supabase.

4. **Desplegar**:
   - Haz clic en **Deploy**.
   - Vercel compilará la aplicación con Next.js 15 y ofrecerá la URL pública de producción.

---

## 📄 Licencia

Desarrollado con fines académicos en el marco del Máster en Dirección Táctica de Fútbol (INEFC Lleida – UdL).
