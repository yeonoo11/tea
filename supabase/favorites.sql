-- Supabase > SQL Editor 에 붙여넣고 Run 하세요. (즐겨찾기 테이블 만들기)
-- 코드(src/store/useAppStore.js)가 쓰는 컬럼: nickname, source, item_id, title, created_at

create table if not exists public.favorites (
  id         bigint generated always as identity primary key,
  nickname   text not null default '익명',
  source     text not null,          -- 예: 'tea' (찻집)
  item_id    text not null,          -- 카카오 장소 id
  title      text not null,          -- 찻집 이름
  created_at timestamptz not null default now()
);

-- 로그인 없이 닉네임으로만 구분하는 수업용 설정:
-- 누구나 읽고 쓸 수 있게 열어 둡니다. (실제 서비스라면 로그인과 본인 것만 허용하도록 바꿔야 해요)
alter table public.favorites enable row level security;

create policy "favorites read"   on public.favorites for select using (true);
create policy "favorites insert" on public.favorites for insert with check (true);
