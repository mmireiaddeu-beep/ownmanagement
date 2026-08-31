# Agenda

Herramienta web personal para gestionar el día a día — pensada para sentirse como una **agenda de papel**, no como un gestor de proyectos.

> "Cojo mi agenda, miro qué tengo que hacer hoy, esta semana o este mes, y sé exactamente qué tengo pendiente."

## Funcionalidades (MVP)

- **Hoy** — la pantalla principal: responde en 3 segundos a *¿qué tengo que hacer hoy?* Timeline de tareas con hora + tareas sin hora + atrasadas.
- **Semana** — agenda semanal de 7 columnas con **drag & drop** para mover tareas entre días.
- **Mes** — vista mensual sencilla; clic en un día para añadir, arrastrar para mover.
- **Inbox** — captura sin decidir todavía cuándo; agenda con un clic (Hoy / Mañana / Próx. semana / Fecha…).
- **Todas** — listado completo con búsqueda y filtros, agrupado por horizonte temporal.
- **Captura rápida** — botón *+ Nueva tarea* (o tecla `n`). Escribe en lenguaje natural en español:
  «Revisar pricing **mañana** **16:00**», «Preparar comité **18 septiembre**», «Planning **el viernes**», «Feedback **la semana que viene**» → asigna fecha y hora automáticamente.
- **Detalle de tarea** — panel lateral con notas, checklist/subtareas, prioridad, etiquetas y recurrencia.
- **Recurrencias** — diaria, semanal, cada 2 semanas, mensual. Al completar una tarea recurrente se genera automáticamente la siguiente.
- **Prioridad** — Alta 🔴 / Media 🟡 / Baja ⚪, discreta (nunca domina la interfaz).
- **Completar** — un clic en el checkbox, con micro-animación satisfactoria.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** para el diseño
- Sin librerías extra: drag & drop nativo (HTML5) y parser de fechas en español propio (`lib/nlp.ts`)

## Persistencia — Supabase (con fallback a localStorage)

La app usa **Supabase** (Postgres) como base de datos real, con **sincronización en tiempo real entre dispositivos**. Si las variables de entorno de Supabase no están definidas, funciona igualmente guardando en **`localStorage`** del navegador — así nunca se rompe.

Un punto verde/gris junto al logo indica el estado: **verde = sincronizado con Supabase**, gris = solo local.

> ⚠️ **Acceso abierto por URL (sin login)**, según lo solicitado. La `anon key` es pública y las políticas RLS permiten lectura/escritura a cualquiera. Quien conozca la URL de la app puede ver y editar las tareas. Para privacidad real más adelante, añadir Supabase Auth y filtrar las políticas por `auth.uid()`.

### Puesta en marcha de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql).
3. En **Project Settings → API**, copia el **Project URL** y la **anon public key**.
4. Añade estas variables en **Vercel** (Project Settings → Environment Variables) y en tu `.env.local` para desarrollo:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-public-key
   ```
5. Redeploy en Vercel. El punto junto al logo se pondrá verde.

El modelo de datos es una única entidad `Task` (`lib/types.ts` ↔ tabla `tasks`), preparada para evolucionar hacia categorías, proyectos, Google Calendar, notificaciones, IA o captura desde email.

## Estructura

```
app/            Rutas (Hoy /, Semana, Mes, Inbox, Todas) + layout
components/      AppShell, QuickAdd, TaskDrawer, TaskRow, vistas y primitivos de UI
lib/            types · dates · nlp · recurrence · store (localStorage)
```

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

Desplegado en Vercel.
