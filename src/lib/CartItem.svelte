<script lang="ts">
	import type { CartItem as CartItemData } from '$lib/cart';
	import { handleImageError } from '$lib/imageFallback';

	let { item, selected, selectionMode, onSelectionChange, onQuantityChange }: {
		item: CartItemData;
		selected: boolean;
		selectionMode: 'checkout' | 'delete';
		onSelectionChange: (selected: boolean) => void;
		onQuantityChange: (amount: number) => void;
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
	<div class="product-icon">
		<img src={item.image || placeholderImage} alt={item.name} onerror={(event) => handleImageError(event, item.name)} />
		<span class="sr-only">Product image for {item.name}</span>
	</div>
	<div class="item-details">
		<h2>{item.name}</h2>
		<p>{item.variant}</p>
		<code>{item.sku}</code>
		<div class="quantity-control" aria-label={`Quantity for ${item.name}`}>
			<button type="button" onclick={() => onQuantityChange(-1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
			<span>{item.quantity}</span>
			<button type="button" onclick={() => onQuantityChange(1)} aria-label={`Increase ${item.name} quantity`}>+</button>
		</div>
	</div>
	<div class="item-price"><strong>{formatPrice(item.unitPrice * item.quantity)}</strong><span>{formatPrice(item.unitPrice)} ea.</span></div>
</article>

<style>
	.cart-item { display: grid; grid-template-columns: 1.25rem 5.25rem minmax(0, 1fr) 9rem; gap: 1.1rem; align-items: start; padding: 1.15rem 0; border-bottom: 1px solid #d9e0ea; }
	.item-select { display: grid; place-items: center; width: 1.25rem; height: 5.25rem; cursor: pointer; }
	.item-select input { position: absolute; width: 1px; height: 1px; opacity: 0; }
	.item-select span { width: 1.15rem; height: 1.15rem; border: 1.5px solid #aebdd0; border-radius: 0.3rem; background: white; transition: background 150ms ease, border-color 150ms ease; }
	.item-select input:checked + span { border-color: #155bd8; background: #155bd8; box-shadow: inset 0 0 0 3px white; }
	.item-select input:focus-visible + span { outline: 2px solid #155bd8; outline-offset: 2px; }
	.product-icon { display: grid; place-items: center; width: 5.25rem; aspect-ratio: 1; overflow: hidden; border: 1px solid #d7e0ec; border-radius: 0.7rem; background: #f5f8fc; color: #1860b5; }
	.product-icon img { display: block; width: 100%; height: 100%; max-width: 100%; max-height: 100%; padding: 0.45rem; box-sizing: border-box; object-fit: contain; object-position: center; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
	.item-details h2 { margin: 0; font-size: 0.98rem; font-weight: 800; line-height: 1.3; }
	.item-details p, .item-details code { display: block; margin: 0.25rem 0 0; color: #7890b6; font-size: 0.77rem; font-weight: 600; }
	.item-details code, .item-price { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
	.item-details code { font-size: 0.7rem; }
	.quantity-control { display: inline-grid; grid-template-columns: 2.25rem 2.25rem 2.25rem; height: 2.45rem; margin-top: 1rem; overflow: hidden; border: 1px solid #d1dae6; border-radius: 0.65rem; }
	.quantity-control button { border: 0; background: #fff; color: #135fd4; font-size: 1.1rem; font-weight: 700; cursor: pointer; }
	.quantity-control span { display: grid; place-items: center; border-right: 1px solid #d1dae6; border-left: 1px solid #d1dae6; color: #172b4d; font-size: 0.9rem; font-weight: 700; }
	.item-price { display: flex; flex-direction: column; align-items: flex-end; padding-top: 0.15rem; text-align: right; }
	.item-price strong { font-size: 0.95rem; }
	.item-price span { margin-top: 0.2rem; color: #7890b6; font-size: 0.7rem; font-weight: 600; }
	@media (max-width: 600px) {
		.cart-item { grid-template-columns: 1.1rem 4.25rem minmax(0, 1fr); gap: 0.7rem; }
		.item-select { width: 1.1rem; height: 4.25rem; }
		.product-icon { width: 4.25rem; height: 4.25rem; }
		.item-price { grid-column: 3; flex-direction: row; align-items: center; justify-content: flex-end; padding: 0; }
		.item-price span { display: none; }
	}
</style>