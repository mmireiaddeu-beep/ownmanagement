-- Agenda — esquema de base de datos (Supabase / Postgres)
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.

create table if not exists public.tasks (
  id           text primary key,
  title        text not null default '',
  date         text,                       -- 'YYYY-MM-DD' o null
  time         text,                       -- 'HH:mm' o null
  notes        text not null default '',
  status       text not null default 'inbox',
  priority     text,                       -- 'high' | 'medium' | 'low' | null
  tags         jsonb not null default '[]'::jsonb,
  checklist    jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  due_date     text,
  recurrence   jsonb,
  completed_at timestamptz,
  sort_order   bigint not null default 0
);

-- Índices útiles para las vistas por fecha / estado.
create index if not exists tasks_date_idx on public.tasks (date);
create index if not exists tasks_status_idx on public.tasks (status);

-- Realtime: emite cambios a los clientes conectados (sincronización entre dispositivos).
alter table public.tasks replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end $$;

-- Row Level Security.
-- NOTA: esta app usa acceso ABIERTO por URL (sin login), según lo solicitado.
-- Cualquiera que conozca la URL de la app y la anon key (pública) puede leer/escribir.
-- Si más adelante quieres privacidad real, añade Supabase Auth y cambia estas
-- políticas para filtrar por auth.uid().
alter table public.tasks enable row level security;

drop policy if exists "open_select" on public.tasks;
drop policy if exists "open_insert" on public.tasks;
drop policy if exists "open_update" on public.tasks;
drop policy if exists "open_delete" on public.tasks;

create policy "open_select" on public.tasks for select using (true);
create policy "open_insert" on public.tasks for insert with check (true);
create policy "open_update" on public.tasks for update using (true) with check (true);
create policy "open_delete" on public.tasks for delete using (true);
