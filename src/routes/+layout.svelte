<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		// Force dark mode
		document.documentElement.classList.add('dark');
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<meta name="color-scheme" content="dark" />
	<title>LifeHub - Personal Life Management</title>
</svelte:head>

{@render children?.()}
