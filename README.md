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

## Persistencia

Los datos se guardan en **`localStorage`** del navegador (clave `agenda.tasks.v1`). Sobreviven a los refrescos y sincronizan entre pestañas del mismo navegador.

El modelo de datos (`lib/types.ts`) es una única entidad `Task` diseñada para migrar sin fricción a una base de datos real (Vercel Postgres, Supabase…) más adelante: bastará con sustituir la capa de `lib/store.tsx` por llamadas a una API, sin tocar la UI. Esto habilitará sincronización entre dispositivos, y en el futuro categorías, proyectos, Google Calendar, notificaciones, IA o captura desde email.

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
