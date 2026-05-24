-- ══════════════════════════════════════════════════════════════
-- COLE ESTE CÓDIGO NO SUPABASE → SQL EDITOR → NEW QUERY
-- Adiciona suporte a login com email e senha
-- ══════════════════════════════════════════════════════════════

-- Adiciona coluna auth_id na tabela users (se ainda não existir)
alter table users add column if not exists auth_id uuid;

-- Cria índice para busca rápida por auth_id
create index if not exists users_auth_id_idx on users(auth_id);

-- Atualiza políticas para permitir que usuário veja só seus dados
-- (mantém acesso público por enquanto para facilitar o desenvolvimento)
drop policy if exists "Acesso público a users" on users;
drop policy if exists "Acesso público a logs" on session_logs;

create policy "Acesso público a users" on users for all using (true) with check (true);
create policy "Acesso público a logs" on session_logs for all using (true) with check (true);
