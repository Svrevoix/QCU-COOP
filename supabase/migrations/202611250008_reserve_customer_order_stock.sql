alter table public.qr_orders
  add column if not exists stock_reserved boolean not null default false;

alter table public.sales
  add column if not exists qr_order_id uuid references public.qr_orders(id);

create unique index if not exists sales_qr_order_id_key
  on public.sales (qr_order_id)
  where qr_order_id is not null;

create or replace function public.reserve_store_stock_for_customer_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_order_status text;
  v_store_id bigint;
  v_store_warehouse_id bigint;
  v_store_quantity integer;
  v_warehouse_id bigint;
  v_warehouse_quantity integer := 0;
  v_after_reservation integer;
  v_transfer integer := 0;
begin
  select status into v_order_status
  from public.qr_orders
  where id = new.qr_order_id
  for update;
  if not found or lower(coalesce(v_order_status, '')) <> 'pending' then
    raise exception 'Customer order is not pending';
  end if;

  select * into v_product
  from public.products
  where id = new.product_id
  for update;
  if not found then
    raise exception 'Product % does not exist', new.product_id;
  end if;

  select id, warehouse_id, quantity
  into v_store_id, v_store_warehouse_id, v_store_quantity
  from public.inventory
  where product_id = new.product_id and location_type = 'store'
  order by id
  limit 1
  for update;

  if not found then
    select id, warehouse_id, quantity
    into v_warehouse_id, v_store_warehouse_id, v_warehouse_quantity
    from public.inventory
    where product_id = new.product_id and location_type = 'warehouse'
    order by id
    limit 1
    for update;

    if not found then
      raise exception 'No store or warehouse inventory location exists for product %', new.product_id;
    end if;

    v_store_quantity := greatest(coalesce(v_product.stock, 0), 0);
    insert into public.inventory (product_id, warehouse_id, location_type, quantity)
    values (new.product_id, v_store_warehouse_id, 'store', v_store_quantity)
    returning id into v_store_id;
  end if;

  if coalesce(new.quantity, 0) < 1 or v_store_quantity < new.quantity then
    raise exception 'Not enough in-store stock for product %. Available: %, requested: %',
      new.product_id, v_store_quantity, new.quantity;
  end if;

  v_after_reservation := v_store_quantity - new.quantity;
  update public.inventory set quantity = v_after_reservation where id = v_store_id;

  if v_after_reservation <= greatest(coalesce(v_product.refill_level, 0), 0)
     and coalesce(v_product.refill_quantity, 0) > 0 then
    select id, quantity into v_warehouse_id, v_warehouse_quantity
    from public.inventory
    where product_id = new.product_id
      and location_type = 'warehouse'
      and warehouse_id = v_store_warehouse_id
    order by id
    limit 1
    for update;

    if found then
      v_transfer := least(v_product.refill_quantity, v_warehouse_quantity);
      if v_transfer > 0 then
        update public.inventory set quantity = quantity - v_transfer where id = v_warehouse_id;
        update public.inventory set quantity = quantity + v_transfer where id = v_store_id;
        v_after_reservation := v_after_reservation + v_transfer;
      end if;
    end if;

    insert into public.stock_alerts (product_id, warehouse_stock, store_stock, alert_type, resolved)
    values (
      new.product_id,
      greatest(coalesce(v_warehouse_quantity, 0) - v_transfer, 0),
      v_after_reservation,
      case when v_transfer >= v_product.refill_quantity then 'auto_refill' else 'warehouse_restock_required' end,
      v_transfer >= v_product.refill_quantity
    );
  end if;

  update public.products set stock = v_after_reservation where id = new.product_id;
  update public.qr_orders set stock_reserved = true where id = new.qr_order_id;
  return new;
end;
$$;

drop trigger if exists qr_order_items_reserve_store_stock on public.qr_order_items;
create trigger qr_order_items_reserve_store_stock
after insert on public.qr_order_items
for each row execute function public.reserve_store_stock_for_customer_order();

create or replace function public.release_customer_order_stock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_product public.products%rowtype;
  v_store_id bigint;
  v_store_quantity integer;
begin
  if old.status = 'cancelled' or new.status <> 'cancelled' or not old.stock_reserved then
    return new;
  end if;

  for v_item in
    select product_id, quantity
    from public.qr_order_items
    where qr_order_id = new.id
    order by product_id
  loop
    select * into v_product
    from public.products
    where id = v_item.product_id
    for update;
    if not found then
      raise exception 'Product % does not exist while releasing order stock', v_item.product_id;
    end if;

    select id, quantity into v_store_id, v_store_quantity
    from public.inventory
    where product_id = v_item.product_id and location_type = 'store'
    order by id
    limit 1
    for update;
    if not found then
      raise exception 'Reserved store inventory is missing for product %', v_item.product_id;
    end if;

    v_store_quantity := v_store_quantity + v_item.quantity;
    update public.inventory set quantity = v_store_quantity where id = v_store_id;
    update public.products set stock = v_store_quantity where id = v_item.product_id;

    if v_store_quantity > greatest(coalesce(v_product.refill_level, 0), 0) then
      update public.stock_alerts
      set resolved = true
      where product_id = v_item.product_id
        and alert_type = 'warehouse_restock_required'
        and resolved is false;
    end if;
  end loop;

  update public.qr_orders set stock_reserved = false where id = new.id;
  return new;
end;
$$;

drop trigger if exists qr_orders_release_stock_on_cancel on public.qr_orders;
create trigger qr_orders_release_stock_on_cancel
after update of status on public.qr_orders
for each row execute function public.release_customer_order_stock_on_cancel();

create or replace function public.replenish_store_stock_after_sale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_store_id bigint;
  v_store_warehouse_id bigint;
  v_store_quantity integer;
  v_warehouse_id bigint;
  v_seed_warehouse_id bigint;
  v_warehouse_quantity integer;
  v_after_sale integer;
  v_transfer integer := 0;
begin
  if exists (
    select 1
    from public.sales s
    join public.qr_orders o on o.id = s.qr_order_id
    where s.id = new.sale_id and o.stock_reserved is true
  ) then
    return new;
  end if;

  select * into v_product
  from public.products
  where id = new.product_id
  for update;

  if not found then
    raise exception 'Product % does not exist', new.product_id;
  end if;

  select id, warehouse_id, quantity
  into v_store_id, v_store_warehouse_id, v_store_quantity
  from public.inventory
  where product_id = new.product_id and location_type = 'store'
  order by id
  limit 1
  for update;

  if not found then
    select id, warehouse_id, quantity
    into v_warehouse_id, v_seed_warehouse_id, v_warehouse_quantity
    from public.inventory
    where product_id = new.product_id and location_type = 'warehouse'
    order by id
    limit 1
    for update;

    if not found then
      raise exception 'No store or warehouse inventory location exists for product %', new.product_id;
    end if;

    v_store_warehouse_id := v_seed_warehouse_id;
    v_store_quantity := greatest(coalesce(v_product.stock, 0), 0);
    insert into public.inventory (product_id, warehouse_id, location_type, quantity)
    values (new.product_id, v_store_warehouse_id, 'store', v_store_quantity)
    returning id into v_store_id;
  end if;

  if coalesce(new.quantity, 0) < 1 or v_store_quantity < new.quantity then
    raise exception 'Insufficient store stock for product %', new.product_id;
  end if;

  v_after_sale := v_store_quantity - new.quantity;
  update public.inventory set quantity = v_after_sale where id = v_store_id;

  if v_after_sale <= greatest(coalesce(v_product.refill_level, 0), 0)
     and coalesce(v_product.refill_quantity, 0) > 0 then
    select id, quantity into v_warehouse_id, v_warehouse_quantity
    from public.inventory
    where product_id = new.product_id
      and location_type = 'warehouse'
      and warehouse_id = v_store_warehouse_id
    order by id
    limit 1
    for update;

    if found then
      v_transfer := least(v_product.refill_quantity, v_warehouse_quantity);
      if v_transfer > 0 then
        update public.inventory set quantity = quantity - v_transfer where id = v_warehouse_id;
        update public.inventory set quantity = quantity + v_transfer where id = v_store_id;
        v_after_sale := v_after_sale + v_transfer;
      end if;
    end if;

    insert into public.stock_alerts (product_id, warehouse_stock, store_stock, alert_type, resolved)
    values (
      new.product_id,
      greatest(coalesce(v_warehouse_quantity, 0) - v_transfer, 0),
      v_after_sale,
      case when v_transfer >= v_product.refill_quantity then 'auto_refill' else 'warehouse_restock_required' end,
      v_transfer >= v_product.refill_quantity
    );
  end if;

  update public.products set stock = v_after_sale where id = new.product_id;
  return new;
end;
$$;

create or replace function public.complete_customer_qr_order(
  p_qr_order_id uuid,
  p_cashier_id uuid,
  p_cash_received numeric
)
returns table (sale_id bigint, receipt_number text, total_amount numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.qr_orders%rowtype;
  v_sale_id bigint;
  v_receipt_number text;
  v_cash_received numeric(12,2);
begin
  if p_cashier_id is null or not exists (
    select 1 from public.profiles
    where id = p_cashier_id and lower(coalesce(role, '')) in ('cashier', 'staff')
  ) then
    raise exception 'The signed-in profile is not an active cashier.';
  end if;

  select * into v_order
  from public.qr_orders
  where id = p_qr_order_id
  for update;
  if not found then
    raise exception 'Customer pickup order was not found.';
  end if;
  if lower(coalesce(v_order.status, '')) not in ('pending', 'ready', 'ready_for_pickup') then
    raise exception 'This pickup order has already been completed or cancelled.';
  end if;

  v_cash_received := round(coalesce(p_cash_received, 0), 2);
  if v_cash_received < v_order.total_amount then
    raise exception 'Cash received is less than the amount due.';
  end if;

  v_receipt_number := 'POS-' || to_char(clock_timestamp() at time zone 'Asia/Manila', 'YYYYMMDD')
    || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.sales (
    receipt_number, cashier_id, customer_id, total_amount,
    cash_received, change_amount, discount_amount, qr_order_id
  ) values (
    v_receipt_number, p_cashier_id, v_order.customer_id, v_order.total_amount,
    v_cash_received, round(v_cash_received - v_order.total_amount, 2), 0, v_order.id
  ) returning id into v_sale_id;

  insert into public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
  select v_sale_id, product_id, quantity, price, round(price * quantity, 2)
  from public.qr_order_items
  where qr_order_id = v_order.id
  order by product_id;

  update public.qr_orders set status = 'claimed' where id = v_order.id;

  update public.cashier_sessions
  set total_transactions = coalesce(total_transactions, 0) + 1,
      total_sales = coalesce(total_sales, 0) + v_order.total_amount
  where cashier_id = p_cashier_id and shift_end is null;

  return query select v_sale_id, v_receipt_number, v_order.total_amount;
end;
$$;

create or replace function public.cancel_customer_qr_order(
  p_qr_order_id uuid,
  p_staff_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if p_staff_id is null or not exists (
    select 1 from public.profiles
    where id = p_staff_id and lower(coalesce(role, '')) in ('cashier', 'staff', 'admin')
  ) then
    raise exception 'Staff access is required to cancel a pickup order.';
  end if;

  select status into v_status
  from public.qr_orders
  where id = p_qr_order_id
  for update;
  if not found then
    raise exception 'Customer pickup order was not found.';
  end if;
  if lower(coalesce(v_status, '')) not in ('pending', 'ready', 'ready_for_pickup') then
    raise exception 'Only open pickup orders can be cancelled.';
  end if;

  update public.qr_orders set status = 'cancelled' where id = p_qr_order_id;
end;
$$;

revoke all on function public.complete_customer_qr_order(uuid, uuid, numeric) from public, anon, authenticated;
grant execute on function public.complete_customer_qr_order(uuid, uuid, numeric) to service_role;
revoke all on function public.cancel_customer_qr_order(uuid, uuid) from public, anon, authenticated;
grant execute on function public.cancel_customer_qr_order(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
