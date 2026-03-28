alter table public.profiles
add column if not exists theme text not null default 'dark';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_theme_check'
  ) then
    alter table public.profiles
    add constraint profiles_theme_check
    check (theme in ('dark', 'light', 'system'));
  end if;
end $$;
