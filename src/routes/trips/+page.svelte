<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { Trip } from '$lib/types';

	let trips = $state<Trip[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			// TODO: Fetch trips from PocketBase
			// trips = await pb.collection('trips').getFullList();
			loading = false;
		} catch (error) {
			console.error('Error fetching trips:', error);
			loading = false;
		}
	});
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Travel</h1>
			<p class="text-muted-foreground">Trips and travel plans</p>
		</div>
		<Button>Add Trip</Button>
	</div>

	{#if loading}
		<p>Loading...</p>
	{:else if trips.length === 0}
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-muted-foreground">
					No trips yet. Click "Add Trip" to create one.
				</p>
			</CardContent>
		</Card>
	{:else}
		<div class="space-y-4">
			{#each trips as trip (trip.id)}
				<Card>
					<CardHeader>
						<CardTitle>{trip.title}</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-sm text-muted-foreground">
							{trip.origin} → {trip.destination}
						</p>
						<p class="text-sm text-muted-foreground">{trip.depart_at}</p>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
