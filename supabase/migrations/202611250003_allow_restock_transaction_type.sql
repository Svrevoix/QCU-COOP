-- Preserve the database's existing transaction types and allow warehouse restocks.
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

  if v_definition is not null and position('restock' in lower(v_definition)) = 0 then
    v_expression := substring(v_definition from 8 for char_length(v_definition) - 8);
    alter table public.inventory_transactions
      drop constraint inventory_transactions_transaction_type_check;
    execute format(
      'alter table public.inventory_transactions add constraint inventory_transactions_transaction_type_check check ((%s) or transaction_type = %L)',
      v_expression,
      'restock'
    );
  end if;
end;
$$;
