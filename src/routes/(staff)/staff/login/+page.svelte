<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
	let { form } = $props();
</script>

<svelte:head>
	<title>Staff Login | QCU Coop Store</title>
</svelte:head>

<main class="login-page">
	<LoginForm mode="staff" errorMessage={form?.message ?? ''} />
</main>

<style>
	.login-page { display: grid; min-height: 100vh; place-items: center; padding: 2rem 1rem; background: #eaf0f7; }
</style>