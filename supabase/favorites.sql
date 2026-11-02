-- Supabase > SQL Editor 에 붙여넣고 Run 하세요. (북마크 테이블 + 로그인한 본인 것만 보이게 설정)
-- 회원가입·로그인은 Supabase 가 기본으로 제공하는 Auth 를 쓰므로 따로 만들 테이블은 없어요.
-- 코드(src/store/useAppStore.js)가 쓰는 컬럼: user_id, nickname, source, item_id, title, created_at

create table if not exists public.favorites (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nickname   text not null default '익명',
  source     text not null,          -- 예: 'tea' (찻집)
  item_id    text not null,          -- 카카오 장소 id
  title      text not null,          -- 찻집 이름
  created_at timestamptz not null default now()
);

-- 예전에 로그인 없는 버전으로 만들어 둔 테이블이면 user_id 칸만 덧붙여요 (이미 있으면 그대로 둬요)
alter table public.favorites
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;

-- 같은 사람이 같은 찻집을 두 번 북마크하지 못하게
create unique index if not exists favorites_user_item on public.favorites (user_id, source, item_id);

-- 본인 북마크만 읽고, 저장하고, 지울 수 있게 (로그인하지 않으면 아무것도 못 해요)
alter table public.favorites enable row level security;

drop policy if exists "favorites read"   on public.favorites;
drop policy if exists "favorites insert" on public.favorites;
drop policy if exists "favorites own read"   on public.favorites;
drop policy if exists "favorites own insert" on public.favorites;
drop policy if exists "favorites own delete" on public.favorites;

create policy "favorites own read"   on public.favorites for select to authenticated using (auth.uid() = user_id);
create policy "favorites own insert" on public.favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "favorites own delete" on public.favorites for delete to authenticated using (auth.uid() = user_id);
