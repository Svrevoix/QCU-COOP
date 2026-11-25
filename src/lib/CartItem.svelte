<script lang="ts">
	import type { CartItem as CartItemData } from '$lib/cart';
	import { handleImageError } from '$lib/imageFallback';

	let { item, selected, selectionMode, onSelectionChange, onQuantityChange, onRemove }: {
		item: CartItemData;
		selected: boolean;
		selectionMode: 'checkout' | 'delete';
		onSelectionChange: (selected: boolean) => void;
		onQuantityChange: (amount: number) => void;
		onRemove: () => void;
	} = $props();

	const formatPrice = (value: number) =>
		new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(value);

	const placeholderImage = 'images/attires/placeholder-shirt.png';
</script>

<article class="cart-item">
	<label class="item-select" aria-label={`Select ${item.name} for ${selectionMode === 'delete' ? 'deletion' : 'checkout'}`}>
		<input type="checkbox" checked={selected} onchange={(event) => onSelectionChange(event.currentTarget.checked)} />
		<span aria-hidden="true"></span>
	</label>
	<div class="cart-item-image">
		<img src={item.image || placeholderImage} alt={item.name} onerror={(event) => handleImageError(event, item.name)} />
		<span class="sr-only">Product image for {item.name}</span>
	</div>
	<div class="item-details">
		<h2>{item.name}</h2>
		<p>{item.variant}</p>
		<code>{item.sku}</code>
		<div class="cart-quantity-control" aria-label={`Quantity for ${item.name}`}>
			<button type="button" onclick={() => onQuantityChange(-1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
			<span>{item.quantity}</span>
			<button type="button" onclick={() => onQuantityChange(1)} aria-label={`Increase ${item.name} quantity`}>+</button>
		</div>
	</div>
	<div class="item-actions">
		<div class="item-price"><strong>{formatPrice(item.unitPrice * item.quantity)}</strong><span>{formatPrice(item.unitPrice)} ea.</span></div>
		<button type="button" class="item-remove" onclick={onRemove} aria-label={`Remove ${item.name} from cart`}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
			</svg>
		</button>
	</div>
</article>

<style>
	.cart-item { display: grid; grid-template-columns: 1.25rem 5.25rem minmax(0, 1fr) auto; gap: 1rem; align-items: center; padding: 1rem; border: 1px solid rgba(186, 230, 253, 0.7); border-radius: 1rem; background: #f4f9ff; color: #0c2340; }
	.item-select { display: grid; place-items: center; width: 1.25rem; height: 5.25rem; cursor: pointer; }
	.item-select input { position: absolute; width: 1px; height: 1px; opacity: 0; }
	.item-select span { width: 1.15rem; height: 1.15rem; border: 1.5px solid #aebdd0; border-radius: 0.3rem; background: #e6f0fa; transition: background 150ms ease, border-color 150ms ease; }
	.item-select input:checked + span { border-color: #2563eb; background: #2563eb; box-shadow: inset 0 0 0 3px #f4f9ff; }
	.item-select input:focus-visible + span { outline: 2px solid #155bd8; outline-offset: 2px; }
	.cart-item-image { display: grid; place-items: center; width: 5.25rem; aspect-ratio: 1; overflow: hidden; border: 1px solid rgba(186, 230, 253, 0.6); border-radius: 0.75rem; background: rgba(224, 242, 254, 0.8); color: #64748b; }
	.cart-item-image img { display: block; width: 100%; height: 100%; max-width: 100%; max-height: 100%; box-sizing: border-box; padding: 0.5rem; object-fit: contain; object-position: center; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
	.item-details { min-width: 0; }
	.item-details h2 { overflow: hidden; margin: 0; font-size: 0.98rem; font-weight: 800; line-height: 1.3; text-overflow: ellipsis; white-space: nowrap; }
	.item-details p, .item-details code { display: block; margin: 0.25rem 0 0; color: #7890b6; font-size: 0.77rem; font-weight: 600; }
	.item-details code, .item-price { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
	.item-details code { font-size: 0.7rem; }
	.cart-quantity-control { display: inline-grid; grid-template-columns: 2.25rem 2.25rem 2.25rem; height: 2.45rem; margin-top: 0.85rem; overflow: hidden; border: 1px solid rgba(186, 230, 253, 0.7); border-radius: 0.75rem; background: rgba(224, 242, 254, 0.7); }
	.cart-quantity-control button { border: 0; background: transparent; color: #2563eb; font-size: 1.1rem; font-weight: 700; cursor: pointer; }
	.cart-quantity-control button:hover { background: rgba(186, 230, 253, 0.45); }
	.cart-quantity-control span { display: grid; place-items: center; border-right: 1px solid rgba(186, 230, 253, 0.7); border-left: 1px solid rgba(186, 230, 253, 0.7); color: #0c2340; font-size: 0.9rem; font-weight: 700; }
	.item-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 0.65rem; }
	.item-price { display: flex; flex-direction: column; align-items: flex-end; padding-top: 0.15rem; text-align: right; }
	.item-price strong { font-size: 0.95rem; }
	.item-price span { margin-top: 0.2rem; color: #7890b6; font-size: 0.7rem; font-weight: 600; }
	.item-remove { display: grid; width: 2rem; height: 2rem; place-items: center; border: 1px solid transparent; border-radius: 0.625rem; background: transparent; color: #64748b; cursor: pointer; transition: color 150ms ease, background 150ms ease; }
	.item-remove svg { width: 1rem; height: 1rem; }
	.item-remove:hover { background: #fee2e2; color: #b91c1c; }
	:global(html[data-theme='dark'] .cart-item) { border-color: rgba(255, 255, 255, 0.1); background: #162038; color: #f1f5f9; }
	:global(html[data-theme='dark'] .cart-item-image) { border-color: rgba(255, 255, 255, 0.1); background: rgba(30, 41, 59, 0.8); }
	:global(html[data-theme='dark'] .item-select span) { border-color: #475569; background: #1e293b; }
	:global(html[data-theme='dark'] .item-select input:checked + span) { border-color: #2563eb; background: #2563eb; box-shadow: inset 0 0 0 3px #162038; }
	:global(html[data-theme='dark'] .cart-quantity-control) { border-color: rgba(255, 255, 255, 0.1); background: rgba(30, 41, 59, 0.9); }
	:global(html[data-theme='dark'] .cart-quantity-control button) { color: #7dd3fc; }
	:global(html[data-theme='dark'] .cart-quantity-control button:hover) { background: rgba(71, 85, 105, 0.6); }
	:global(html[data-theme='dark'] .cart-quantity-control span) { border-color: rgba(255, 255, 255, 0.1); color: #f1f5f9; }
	:global(html[data-theme='dark'] .item-details h2), :global(html[data-theme='dark'] .item-price strong) { color: #f1f5f9; }
	:global(html[data-theme='dark'] .item-details p), :global(html[data-theme='dark'] .item-details code), :global(html[data-theme='dark'] .item-price span) { color: #94a3b8; }
	:global(html[data-theme='dark'] .item-remove) { color: #94a3b8; }
	:global(html[data-theme='dark'] .item-remove:hover) { background: rgba(127, 29, 29, 0.35); color: #fca5a5; }
	@media (max-width: 700px) {
		.cart-item { grid-template-columns: 1.1rem 4.25rem minmax(0, 1fr); gap: 0.7rem; padding: 0.75rem; }
		.item-select { width: 1.1rem; height: 4.25rem; }
		.cart-item-image { width: 4.25rem; height: 4.25rem; }
		.item-actions { grid-column: 3; flex-direction: row; align-items: center; justify-content: space-between; }
		.item-price { align-items: flex-start; padding: 0; text-align: left; }
	}
</style>