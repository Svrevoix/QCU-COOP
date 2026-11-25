-- Create a pending pickup request and its line items as one atomic operation.
create or replace function public.create_customer_qr_order(
  p_customer_id uuid,
  p_items jsonb
)
returns table (
  order_id uuid,
  order_reference text,
  order_number text,
  total_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference text;
  v_order_id uuid;
  v_subtotal numeric(12,2) := 0;
  v_discount_rate numeric(5,4) := 0;
  v_total numeric(12,2) := 0;
  v_product record;
  v_item record;
  v_store_quantity integer;
  v_unit_price numeric(12,2);
begin
  if p_customer_id is null or not exists (
    select 1 from public.profiles
    where id = p_customer_id
      and lower(coalesce(role, '')) in ('student', 'teacher', 'faculty', 'customer', 'user', 'member')
      and lower(coalesce(account_status, '')) !~ '(pending|inactive|suspend|disabled|blocked|locked|rejected|archived)'
  ) then
    raise exception 'Sign in with an active student or teacher account to place an order';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item to the order';
  end if;

  if exists (
    select 1 from public.profiles p
    where p.id = p_customer_id and lower(coalesce(p.role, '')) in ('teacher', 'faculty')
  ) and exists (
    select 1 from public.teacher_memberships tm
    where tm.teacher_id = p_customer_id
      and tm.active_membership is true
      and coalesce(tm.is_archived, false) is false
      and tm.start_date <= current_date
      and (tm.end_date is null or tm.end_date >= current_date)
  ) then
    v_discount_rate := 0.20;
  end if;

  for v_item in
    select (item->>'productId')::bigint as product_id,
           sum((item->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as input(item)
    group by 1
    order by 1
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity < 1 then
      raise exception 'Each order line must have a valid product and positive quantity';
    end if;
    select id, selling_price, stock, status
      into v_product
    from public.products
    where id = v_item.product_id
    for update;
    if not found or lower(coalesce(v_product.status, '')) <> 'active' then
      raise exception 'A selected product is no longer available';
    end if;
    if v_product.selling_price is null or v_product.selling_price <= 0 then
      raise exception 'A selected product does not have a valid price';
    end if;

    v_store_quantity := 0;
    perform id from public.inventory
      where product_id = v_item.product_id and location_type = 'store'
      order by id for update;
    select coalesce(sum(quantity), 0)::integer into v_store_quantity
      from public.inventory where product_id = v_item.product_id and location_type = 'store';
    if not exists (select 1 from public.inventory where product_id = v_item.product_id and location_type = 'store') then
      v_store_quantity := greatest(coalesce(v_product.stock, 0), 0);
    end if;
    if v_store_quantity < v_item.quantity then
      raise exception 'Not enough in-store stock for product %. Available: %, requested: %', v_item.product_id, v_store_quantity, v_item.quantity;
    end if;
    v_unit_price := round(v_product.selling_price * (1 - v_discount_rate), 2);
    v_subtotal := v_subtotal + v_unit_price * v_item.quantity;
  end loop;

  v_total := round(v_subtotal, 2);
  v_reference := 'QCU-' || to_char(clock_timestamp() at time zone 'Asia/Manila', 'YYYYMMDD')
    || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.qr_orders (order_reference, order_number, customer_id, total_amount, status)
  values (v_reference, v_reference, p_customer_id, v_total, 'pending')
  returning id into v_order_id;

  for v_item in
    select (item->>'productId')::bigint as product_id,
           sum((item->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as input(item)
    group by 1
    order by 1
  loop
    select round(p.selling_price * (1 - v_discount_rate), 2)
      into v_unit_price from public.products p where p.id = v_item.product_id;
    insert into public.qr_order_items (qr_order_id, product_id, quantity, price)
    values (v_order_id, v_item.product_id, v_item.quantity, v_unit_price);
  end loop;

  return query select v_order_id, v_reference, v_reference, v_total;
end;
$$;

revoke all on function public.create_customer_qr_order(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_customer_qr_order(uuid, jsonb) to service_role;
notify pgrst, 'reload schema';
