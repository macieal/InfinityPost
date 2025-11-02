-- Tabela de posts
create table if not exists public.posts (
  id bigint generated always as identity primary key,
  nick text not null,
  topic text not null,
  text text not null
);

-- Tabela de comentários
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id bigint references public.posts(id) on delete cascade,
  nick text not null,
  text text not null
);

-- Ativar RLS
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- Policies simples
create policy "Anon select posts" on public.posts for select using (true);
create policy "Anon insert posts" on public.posts for insert with check (true);

create policy "Anon select comments" on public.comments for select using (true);
create policy "Anon insert comments" on public.comments for insert with check (true);