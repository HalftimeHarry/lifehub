<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pb';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	let appointments = $state<any[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			// TODO: Fetch appointments from PocketBase
			// appointments = await pb.collection('appointments').getFullList();
			loading = false;
		} catch (error) {
			console.error('Error fetching appointments:', error);
			loading = false;
		}
	});
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Appointments</h1>
			<p class="text-muted-foreground">Medical, meetings, and personal events</p>
		</div>
		<Button>Add Appointment</Button>
	</div>

	{#if loading}
		<p>Loading...</p>
	{:else if appointments.length === 0}
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-muted-foreground">
					No appointments yet. Click "Add Appointment" to create one.
				</p>
			</CardContent>
		</Card>
	{:else}
		<div class="space-y-4">
			{#each appointments as appointment}
				<Card>
					<CardHeader>
						<CardTitle>{appointment.title}</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-sm text-muted-foreground">{appointment.start}</p>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
