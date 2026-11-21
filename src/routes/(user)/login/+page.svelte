<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
	let { form } = $props();
</script>

<svelte:head>
	<title>Login | QCU Coop Store</title>
</svelte:head>

<main class="login-page">
	<LoginForm
		mode="user"
		initialMode={form?.mode ?? 'login'}
		errorMessage={form?.message ?? ''}
		successMessage={form?.success ?? ''}
	/>
</main>

<style>
	.login-page {
		min-height: 100vh;
		width: 100%;
	}
</style>
