<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
	let { form } = $props();
</script>

<svelte:head>
	<title>Login | QCU Coop Store</title>
</svelte:head>

<main class="login-page">
	<LoginForm mode="user" initialMode={form?.mode ?? 'login'} errorMessage={form?.message ?? ''} />
</main>

<style>
	.login-page { display: grid; min-height: calc(100vh - 4rem); place-items: center; padding: 2rem 1rem; background: #f2f6fb; }
</style>