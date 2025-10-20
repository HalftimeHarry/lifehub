<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-dvh bg-background text-foreground">
	<nav class="p-4 flex gap-3 border-b">
		<a href="/" class="font-semibold">LifeHub</a>
		<a href="/appointments" class="hover:underline">Appointments</a>
		<a href="/shifts" class="hover:underline">Shifts</a>
		<a href="/trips" class="hover:underline">Travel</a>
		<a href="/tasks" class="hover:underline">Tasks</a>
	</nav>
	<main class="container mx-auto p-4">
		{@render children?.()}
	</main>
</div>
