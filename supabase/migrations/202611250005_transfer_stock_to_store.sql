-- Record and apply an administrator initiated warehouse-to-store transfer atomically.
do $$
declare
  v_definition text;
  v_expression text;
begin
  select pg_get_constraintdef(oid)
    into v_definition
  from pg_constraint
  where conrelid = 'public.inventory_transactions'::regclass
    and conname = 'inventory_transactions_transaction_type_check'
    and contype = 'c';

  if v_definition is not null and position('transfer_to_store' in lower(v_definition)) = 0 then
    v_expression := substring(v_definition from 8 for char_length(v_definition) - 8);
    alter table public.inventory_transactions
      drop constraint inventory_transactions_transaction_type_check;
    execute format(
      'alter table public.inventory_transactions add constraint inventory_transactions_transaction_type_check check ((%s) or transaction_type = %L)',
      v_expression,
      'transfer_to_store'
    );
  end if;
end;
$$;

create or replace function public.transfer_inventory_to_store(
  p_product_id bigint,
  p_quantity integer,
  p_remarks text,
  p_created_by uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_warehouse_id bigint;
  v_warehouse_location bigint;
  v_warehouse_quantity integer;
  v_store_id bigint;
  v_store_quantity integer;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Transfer quantity must be a positive whole number';
  end if;
  if p_created_by is null then
    raise exception 'An administrator is required to transfer stock';
  end if;
  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Product % does not exist', p_product_id;
  end if;

  perform 1 from public.products where id = p_product_id for update;
  perform pg_advisory_xact_lock(hashtextextended(p_product_id::text, 1));

  select id, warehouse_id, quantity
    into v_warehouse_id, v_warehouse_location, v_warehouse_quantity
  from public.inventory
  where product_id = p_product_id and location_type = 'warehouse'
  order by id
  limit 1
  for update;

  if not found or coalesce(v_warehouse_quantity, 0) < p_quantity then
    raise exception 'Not enough warehouse stock to transfer this quantity';
  end if;

  select id, quantity
    into v_store_id, v_store_quantity
  from public.inventory
  where product_id = p_product_id
    and location_type = 'store'
    and warehouse_id = v_warehouse_location
  order by id
  limit 1
  for update;

  update public.inventory
  set quantity = quantity - p_quantity
  where id = v_warehouse_id;

  if found then
    if v_store_id is null then
      insert into public.inventory (product_id, warehouse_id, location_type, quantity)
      values (p_product_id, v_warehouse_location, 'store', p_quantity);
      v_store_quantity := p_quantity;
    else
      update public.inventory
      set quantity = coalesce(v_store_quantity, 0) + p_quantity
      where id = v_store_id;
      v_store_quantity := coalesce(v_store_quantity, 0) + p_quantity;
    end if;
  end if;

  update public.products set stock = coalesce(v_store_quantity, 0) where id = p_product_id;

  insert into public.inventory_transactions
    (product_id, warehouse_id, transaction_type, quantity, remarks, created_by)
  values
    (p_product_id, v_warehouse_location, 'transfer_to_store', p_quantity,
     coalesce(nullif(trim(p_remarks), ''), 'Warehouse to store transfer'), p_created_by);
end;
$$;

revoke all on function public.transfer_inventory_to_store(bigint, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.transfer_inventory_to_store(bigint, integer, text, uuid) to service_role;

notify pgrst, 'reload schema';
