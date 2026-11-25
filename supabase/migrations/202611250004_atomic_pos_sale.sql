-- Save a cashier sale and all of its stock movements as one transaction.
create or replace function public.complete_pos_sale(
  p_cashier_id uuid,
  p_customer_id uuid,
  p_cash_received numeric,
  p_items jsonb
)
returns table (
  sale_id bigint,
  receipt_number text,
  total_amount numeric,
  discount_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id bigint;
  v_receipt_number text;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_cash_received numeric(12,2);
  v_customer_role text;
  v_customer_status text;
  v_customer_id_number text;
  v_product record;
  v_item record;
  v_unit_price numeric(12,2);
begin
  if p_cashier_id is null then
    raise exception 'A cashier profile is required.';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item to the order.';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = p_cashier_id and lower(coalesce(p.role, '')) in ('cashier', 'staff')
  ) then
    raise exception 'The signed-in profile is not an active cashier.';
  end if;

  if p_customer_id is not null then
    select lower(coalesce(p.role, '')), lower(coalesce(p.account_status, '')),
           regexp_replace(coalesce(p.school_id, p.employee_no, ''), '[^0-9]', '', 'g')
    into v_customer_role, v_customer_status, v_customer_id_number
    from public.profiles p
    where p.id = p_customer_id;
    if not found or not (
         v_customer_role in ('student', 'teacher', 'faculty')
         or (v_customer_role in ('customer', 'user', 'member') and
             (v_customer_id_number like '23%' or v_customer_id_number like '10%'))
       )
       or v_customer_status ~ '(pending|inactive|suspend|disabled|blocked|locked|rejected|archived)' then
      raise exception 'Choose an active student or teacher member.';
    end if;
  end if;

  for v_item in
    select (item->>'productId')::bigint as product_id,
           sum((item->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as items(item)
    group by 1
    order by 1
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity < 1 then
      raise exception 'Each sale item needs a valid product and positive quantity.';
    end if;
    select p.id, p.selling_price, p.status
    into v_product
    from public.products p
    where p.id = v_item.product_id
    for update;
    if not found or lower(coalesce(v_product.status, '')) <> 'active' then
      raise exception 'A selected product is unavailable.';
    end if;
    if v_product.selling_price is null or v_product.selling_price <= 0 then
      raise exception 'A selected product does not have a valid selling price.';
    end if;
    v_subtotal := v_subtotal + (v_product.selling_price * v_item.quantity);
  end loop;

  if p_customer_id is not null then
    v_discount := round(v_subtotal * 0.05, 2);
  end if;
  v_total := round(v_subtotal - v_discount, 2);
  v_cash_received := round(coalesce(p_cash_received, 0), 2);
  if v_cash_received < v_total then
    raise exception 'Cash received is less than the amount due.';
  end if;

  v_receipt_number := 'POS-' || to_char(clock_timestamp() at time zone 'Asia/Manila', 'YYYYMMDD')
    || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.sales (
    receipt_number, cashier_id, customer_id, total_amount,
    cash_received, change_amount, discount_amount
  ) values (
    v_receipt_number, p_cashier_id, p_customer_id, v_total,
    v_cash_received, round(v_cash_received - v_total, 2), v_discount
  ) returning id into v_sale_id;

  for v_item in
    select (item->>'productId')::bigint as product_id,
           sum((item->>'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as items(item)
    group by 1
    order by 1
  loop
    select p.selling_price into v_unit_price
    from public.products p where p.id = v_item.product_id;
    insert into public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    values (v_sale_id, v_item.product_id, v_item.quantity, v_unit_price,
            round(v_unit_price * v_item.quantity, 2));
  end loop;

  update public.cashier_sessions
  set total_transactions = coalesce(total_transactions, 0) + 1,
      total_sales = coalesce(total_sales, 0) + v_total
  where cashier_id = p_cashier_id and shift_end is null;

  return query select v_sale_id, v_receipt_number, v_total, v_discount;
end;
$$;

revoke all on function public.complete_pos_sale(uuid, uuid, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.complete_pos_sale(uuid, uuid, numeric, jsonb) to service_role;

notify pgrst, 'reload schema';
