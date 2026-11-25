<script lang="ts">
	import { page } from '$app/state';
	import { purchaseOrders } from '$lib/orders';
	import PurchaseHistoryView from '$lib/components/PurchaseHistoryView.svelte';

	const data = $derived({
		user: page.data.user ?? null,
		historyError: '',
		orders: $purchaseOrders.map((order) => ({
			id: order.id,
			qrReference: order.id,
			date: order.date.slice(0, 10),
			status: order.status,
			total: order.total ?? order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
			items: order.items.map((item) => ({
				productId: item.productId,
				sku: item.sku,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				name: item.name,
				variant: item.variant,
				image: item.image,
				category: item.category
			}))
		}))
	});
</script>

<PurchaseHistoryView {data} />
