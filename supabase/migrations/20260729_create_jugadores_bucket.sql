insert into storage.buckets (id, name, public)
values ('jugadores', 'jugadores', true)
on conflict (id) do update set public = true;

create policy "Fotos de jugadores publicas" on storage.objects for select using ( bucket_id = 'jugadores' );
create policy "Cualquiera puede subir fotos" on storage.objects for insert with check ( bucket_id = 'jugadores' );
create policy "Cualquiera puede actualizar fotos" on storage.objects for update using ( bucket_id = 'jugadores' );
create policy "Cualquiera puede borrar fotos" on storage.objects for delete using ( bucket_id = 'jugadores' );
