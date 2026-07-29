# Smart Scout 3.0 — Sistema Inteligente de Scouting y Análisis Táctico

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Storage-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel)](https://vercel.com/)

---

## 📌 Contexto del Proyecto (TFM)

**Smart Scout 3.0** es una plataforma web avanzada desarrollada como prototipo interactivo para el **Trabajo Fin de Máster (TFM)** en la **INEFC Lleida – Universitat de Lleida (UdL)**.

El proyecto aborda la digitalización y automatización del scouting deportivo mediante la integración de:
1. **Etiquetado de Vídeo en Tiempo Real**: Herramienta de vídeo análisis para registrar acciones técnicas y tácticas de jugadores con sello temporal y mapas de zona.
2. **Motor de Scoring Cuantitativo v2**: Sistema de ponderación táctica basado en el algoritmo **Rank-Sum**, que calcula el score de idoneidad (0–100) de cada jugador respecto a modelos de juego configurables (Posesión, Presión Alta, Transición Rápida, etc.).
3. **Pizarra Táctica Interactiva (Campograma)**: Herramienta de alineación táctica con drag & drop táctil, sugerencias automáticas por puesto y persistencia de sistemas tácticos.
4. **Informes e Inteligencia de Scouting**: Fichas técnicas completas estilo Wyscout con gráficos radar, percentiles comparativos y exportación en formato informe de imprenta/PDF.

---

## 🏗️ Arquitectura del Sistema

La arquitectura está concebida siguiendo los estándares de diseño de software moderno:

```
Smart Scout 3.0
├── app/                        --> App Router de Next.js 15 (Layout, Global CSS, Routing)
├── components/                 --> Componentes React de UI y Secciones
│   ├── campograma/             --> Pizarra Táctica (DndKit, SVG, Alineaciones)
│   ├── comparador/             --> Comparador Cabeza a Cabeza de Jugadores
│   ├── dashboard/              --> Vista General, Métricas KPI y Gráficos
│   ├── directorio/             --> Gestión de Jugadores, Clubes y Ficha Técnica
│   ├── layout/                 --> Sidebar, Header, MobileNav
│   ├── modelos/                --> Configurador de Modelos de Juego y Pesos Rank-Sum
│   ├── ui/                     --> Componentes base de UI (Button, Modal, Card, ConfirmModal...)
│   └── video/                  --> Reproductor de Vídeo, Botonera N2 y PitchMap
├── lib/
│   ├── constants/              --> Etiquetas, Posiciones y Parámetros Tácticos
│   ├── formations/             --> Definición de Sistemas Tácticos (4-3-3, 4-4-2...)
│   ├── scoring/                --> Motor de Scoring (calcularScore, Rank-Sum, Percentiles)
│   └── supabase/               --> Servicios de comunicación con la API de Supabase
├── public/                     --> Recursos estáticos
├── supabase/                   --> Migraciones y Scripts SQL de Base de Datos
└── types/                      --> Definición de Tipos TypeScript y Tablas Supabase
```

### Tecnologías Clave
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS (Estilo Oscuro Glassmorphism), Lucide Icons.
- **Backend / BaaS**: Supabase (PostgreSQL con Políticas RLS, Storage para fotos/vídeos).
- **Librerías Tácticas y Gráficas**: `@dnd-kit/core` (Drag & drop táctil), `recharts` (Gráficos radar e histogramas).

---

## 🗄️ Esquema de la Base de Datos (Supabase)

El modelo relacional está compuesto por las siguientes tablas principales:

1. **`clubes`**: Registro de equipos y clubes deportivos.
2. **`jugadores`**: Ficha biográfica, posición, categoría, `foto_url`, `score_global` y partidos analizados.
3. **`metricas_nivel1`**: Categorías tácticas de nivel superior (Ataque, Defensa, Transición...).
4. **`metricas_nivel2`**: Métricas técnicas específicas (Pase Filtrado, Presión Tras Pérdida, Intercepción...).
5. **`metricas_posicion`**: Mapeo de métricas Relevantes por posición por defecto.
6. **`modelos_juego`**: Modelos de juego tácticos (Predefinidos y Personalizados).
7. **`ponderaciones_modelo`**: Pesos **Rank-Sum** asignados a cada métrica N2 por posición en un modelo de juego.
8. **`partidos_video`**: Gestión de clips y partidos etiquetados en vídeo.
9. **`acciones_etiquetadas`**: Eventos registrados (jugador, minuto, segundo, resultado efectividad, zona del campo).
10. **`jugador_metricas_n2`**: Valores crudos, percentiles y muestras acumuladas por jugador y métrica.
11. **`valoraciones_scout`**: Observaciones e informes de ojeadores.
12. **`alineaciones_guardadas`**: Esquemas tácticos guardados en la pizarra de alineación.

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
   Crea un archivo `.env.local` en la raíz del proyecto con las claves de tu proyecto en Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
   ```

4. **Ejecutar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 📦 Despliegue en Vercel

Para desplegar este proyecto en producción en **Vercel**:

1. **Subir el código a GitHub**:
   Asegúrate de haber guardado y pusheado todos los cambios a la rama principal de GitHub (`main`).

2. **Importar Proyecto en Vercel**:
   - Inicia sesión en [Vercel](https://vercel.com/).
   - Haz clic en **Add New...** -> **Project**.
   - Importa el repositorio `smart-scout` desde GitHub.

3. **Configurar Variables de Entorno en Vercel**:
   En el apartado **Environment Variables** añade:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu Anon Key pública de Supabase.

4. **Desplegar**:
   - Haz clic en **Deploy**.
   - Vercel ejecutará la compilación de producción con Next.js 15 y generará la URL pública de producción.

---

## 📄 Licencia

Este proyecto ha sido desarrollado con fines académicos en el marco del Máster en Dirección Táctica de Fútbol (INEFC Lleida – UdL).
