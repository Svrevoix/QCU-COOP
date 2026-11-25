-- Automatically transfer stock from warehouse to the shop after a saved sale.
-- A sale is rejected if the shop does not have enough stock to fulfill it.

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
      case when v_transfer > 0 then 'auto_refill' else 'warehouse_restock_required' end,
      v_transfer > 0
    );
  end if;

  update public.products set stock = v_after_sale where id = new.product_id;
  return new;
end;
$$;

drop trigger if exists sale_items_auto_replenish_store on public.sale_items;
create trigger sale_items_auto_replenish_store
after insert on public.sale_items
for each row execute function public.replenish_store_stock_after_sale();
