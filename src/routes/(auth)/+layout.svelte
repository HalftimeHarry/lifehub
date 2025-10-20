<script lang="ts">
	import '../../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-background">
	{@render children?.()}
</div>
