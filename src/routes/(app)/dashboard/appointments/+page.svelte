<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { Appointment } from '$lib/types';

	let appointments = $state<Appointment[]>([]);
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
		<div class="space-y-3">
			{#each appointments as appointment (appointment.id)}
				<Card class="hover:bg-accent/50 transition-colors">
					<CardContent class="p-4">
						<div class="space-y-2">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<h3 class="font-semibold">{appointment.title}</h3>
									{#if appointment.person}
										<p class="text-xs text-muted-foreground">For: {appointment.person}</p>
									{/if}
								</div>
								{#if appointment.type}
									<span class="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
										{appointment.type}
									</span>
								{/if}
							</div>
							<div class="text-sm text-muted-foreground space-y-1">
								<p>📅 {appointment.start}</p>
								{#if appointment.location}
									<p>📍 {appointment.location}</p>
								{/if}
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
