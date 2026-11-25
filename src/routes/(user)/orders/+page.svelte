<script lang="ts">
	import PurchaseHistoryView from '$lib/components/PurchaseHistoryView.svelte';

	let { data } = $props();
</script>

<PurchaseHistoryView {data} />
