-- A product must be able to have separate store and warehouse balances at one site.
alter table public.inventory
  drop constraint if exists inventory_product_id_warehouse_id_key;

-- Merge any duplicate rows for the same product, warehouse, and location before
-- enforcing the location-aware key. Keep the oldest row so existing references
-- to its inventory ID remain valid.
with ranked as (
  select
    id,
    product_id,
    warehouse_id,
    location_type,
    sum(quantity) over (
      partition by product_id, warehouse_id, location_type
    ) as combined_quantity,
    row_number() over (
      partition by product_id, warehouse_id, location_type
      order by id
    ) as row_number
  from public.inventory
), keepers as (
  select id, combined_quantity
  from ranked
  where row_number = 1
)
update public.inventory as inventory
set quantity = keepers.combined_quantity
from keepers
where inventory.id = keepers.id;

with ranked as (
  select
    id,
    row_number() over (
      partition by product_id, warehouse_id, location_type
      order by id
    ) as row_number
  from public.inventory
)
delete from public.inventory as inventory
using ranked
where inventory.id = ranked.id
  and ranked.row_number > 1;

alter table public.inventory
  add constraint inventory_product_warehouse_location_key
  unique (product_id, warehouse_id, location_type);

notify pgrst, 'reload schema';
