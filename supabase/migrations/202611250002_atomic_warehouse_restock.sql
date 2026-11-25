-- Keep warehouse quantities and their movement history in the same transaction.
create or replace function public.receive_inventory_stock(
  p_product_id bigint,
  p_warehouse_id bigint,
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
  v_inventory_id bigint;
  v_current_quantity integer;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Received quantity must be a positive whole number';
  end if;
  if p_created_by is null then
    raise exception 'A receiving administrator is required';
  end if;
  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Product % does not exist', p_product_id;
  end if;
  if not exists (select 1 from public.warehouses where id = p_warehouse_id) then
    raise exception 'Warehouse % does not exist', p_warehouse_id;
  end if;

  -- Serialize concurrent receipts of the same product at the same warehouse.
  perform pg_advisory_xact_lock(hashtextextended(p_product_id::text || ':' || p_warehouse_id::text, 0));

  select id, quantity
  into v_inventory_id, v_current_quantity
  from public.inventory
  where product_id = p_product_id
    and warehouse_id = p_warehouse_id
    and location_type = 'warehouse'
  order by id
  limit 1
  for update;

  if found then
    update public.inventory
    set quantity = v_current_quantity + p_quantity
    where id = v_inventory_id;
  else
    insert into public.inventory (product_id, warehouse_id, location_type, quantity)
    values (p_product_id, p_warehouse_id, 'warehouse', p_quantity);
  end if;

  insert into public.inventory_transactions
    (product_id, warehouse_id, transaction_type, quantity, remarks, created_by)
  values
    (p_product_id, p_warehouse_id, 'restock', p_quantity, coalesce(nullif(trim(p_remarks), ''), 'Warehouse restock'), p_created_by);
end;
$$;

revoke all on function public.receive_inventory_stock(bigint, bigint, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.receive_inventory_stock(bigint, bigint, integer, text, uuid) to service_role;
