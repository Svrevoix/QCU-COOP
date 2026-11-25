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
	.login-page { display: flex; min-height: 100vh; align-items: center; justify-content: center; padding: 1.5rem; background: linear-gradient(to bottom right, #eaf2fc, #e2eefa, #d8e7f8); }
	:global(html[data-theme='dark'] .login-page) { background: linear-gradient(to bottom right, #0b1120, #0f172a, #111c33); }
</style>
