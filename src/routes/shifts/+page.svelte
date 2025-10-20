<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { Shift } from '$lib/types';

	let shifts = $state<Shift[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			// TODO: Fetch shifts from PocketBase
			// shifts = await pb.collection('shifts').getFullList();
			loading = false;
		} catch (error) {
			console.error('Error fetching shifts:', error);
			loading = false;
		}
	});
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Shifts</h1>
			<p class="text-muted-foreground">Work schedules and shifts</p>
		</div>
		<Button>Add Shift</Button>
	</div>

	{#if loading}
		<p>Loading...</p>
	{:else if shifts.length === 0}
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-muted-foreground">
					No shifts yet. Click "Add Shift" to create one.
				</p>
			</CardContent>
		</Card>
	{:else}
		<div class="space-y-4">
			{#each shifts as shift (shift.id)}
				<Card>
					<CardHeader>
						<CardTitle>{shift.job}</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-sm text-muted-foreground">{shift.start} - {shift.end}</p>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
