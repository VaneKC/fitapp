-- ══════════════════════════════════════════════════════════════
-- COLE ESTE CÓDIGO NO SUPABASE → SQL EDITOR → NEW QUERY
-- Cria todas as tabelas que o app precisa
-- ══════════════════════════════════════════════════════════════

-- 1. Tabela de usuários (perfil + plano gerado)
create table if not exists users (
  id              uuid default gen_random_uuid() primary key,
  nome            text,
  email           text unique,
  nascimento      text,
  sexo            text,
  cidade          text,
  peso            float,
  altura          float,
  gordura         float,
  peso_meta       float,
  prazo_meses     int,
  primary_goal    text,
  secondary_goals jsonb default '[]',
  experience_level text,
  injuries        jsonb default '[]',
  health_conditions jsonb default '[]',
  equipment       jsonb default '[]',
  location        jsonb default '[]',
  days_per_week   int,
  plan            jsonb,
  created_at      timestamptz default now()
);

-- 2. Tabela de logs de treino
create table if not exists session_logs (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references users(id) on delete cascade,
  session_label text,
  ratings       jsonb default '{}',
  duration_sec  int,
  completed     boolean default true,
  created_at    timestamptz default now()
);

-- 3. Permissões (permite o app ler e escrever sem autenticação por enquanto)
alter table users enable row level security;
alter table session_logs enable row level security;

create policy "Acesso público a users" on users for all using (true) with check (true);
create policy "Acesso público a logs"  on session_logs for all using (true) with check (true);
