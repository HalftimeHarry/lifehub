<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Plus, Plane, MapPin, Calendar } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import { currentUser } from '$lib/auth';
	import type { Trip, User } from '$lib/types';

	let trips = $state<Trip[]>([]);
	let users = $state<User[]>([]);
	let loading = $state(true);
	let dialogOpen = $state(false);
	let saving = $state(false);

	// Form fields
	let title = $state('');
	let depart_at = $state('');
	let arrive_at = $state('');
	let origin = $state('');
	let destination = $state('');
	let notes = $state('');
	let assignToSelf = $state(true); // Default to assigning to current user
	let selectedUsers = $state<string[]>([]); // Additional users to assign

	onMount(async () => {
		try {
			// Fetch users for assignment
			users = await pb.collection('users').getFullList<User>({
				sort: 'email'
			});
			console.log('[TRIPS] Loaded users:', users);
			
			// TODO: Fetch trips from PocketBase
			// trips = await pb.collection('trips').getFullList();
			loading = false;
		} catch (error) {
			console.error('Error fetching trips:', error);
			loading = false;
		}
	});

	async function handleSubmit() {
		saving = true;
		try {
			// Convert datetime-local format to ISO 8601
			const departDate = new Date(depart_at);
			const arriveDate = arrive_at ? new Date(arrive_at) : null;

			// Build assigned users list
			const assignedUsers = [...selectedUsers];
			if (assignToSelf && pb.authStore.model?.id && !assignedUsers.includes(pb.authStore.model.id)) {
				assignedUsers.push(pb.authStore.model.id);
			}

			const data = {
				title,
				depart_at: departDate.toISOString(),
				arrive_at: arriveDate ? arriveDate.toISOString() : undefined,
				origin: origin || undefined,
				destination: destination || undefined,
				notes: notes || undefined,
				assigned_to: assignedUsers,
				created_by: pb.authStore.model?.id,
				notify_offset_minutes: 180
			};

			console.log('[TRIPS] Creating trip with data:', data);
			const record = await pb.collection('trips').create(data);
			
			// Add to local list
			trips = [...trips, record as Trip];
			
			// Reset form
			title = '';
			depart_at = '';
			arrive_at = '';
			origin = '';
			destination = '';
			notes = '';
			assignToSelf = true;
			selectedUsers = [];
			
			dialogOpen = false;
		} catch (error) {
			console.error('Error creating trip:', error);
			alert('Failed to create trip');
		} finally {
			saving = false;
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Trips</h1>
			<p class="text-muted-foreground">Plan and track your travel</p>
		</div>
		
		<Dialog bind:open={dialogOpen}>
			<DialogTrigger asChild>
				{#snippet child({ props })}
					<Button {...props}>
						<Plus class="mr-2 h-4 w-4" />
						Add Trip
					</Button>
				{/snippet}
			</DialogTrigger>
			<DialogContent class="max-w-md">
				<DialogHeader>
					<DialogTitle>Create Trip</DialogTitle>
					<DialogDescription>Plan a new trip or travel</DialogDescription>
				</DialogHeader>
				
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
					<div class="space-y-2">
						<Label for="title">Trip Title</Label>
						<Input
							id="title"
							bind:value={title}
							placeholder="Weekend getaway to SF"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="depart_at">Departure Date & Time</Label>
						<Input
							id="depart_at"
							type="datetime-local"
							bind:value={depart_at}
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="arrive_at">Arrival Date & Time (Optional)</Label>
						<Input
							id="arrive_at"
							type="datetime-local"
							bind:value={arrive_at}
						/>
					</div>

					<div class="space-y-2">
						<Label for="origin">Origin (Optional)</Label>
						<Input
							id="origin"
							bind:value={origin}
							placeholder="Los Angeles, CA"
						/>
					</div>

					<div class="space-y-2">
						<Label for="destination">Destination (Optional)</Label>
						<Input
							id="destination"
							bind:value={destination}
							placeholder="San Francisco, CA"
						/>
					</div>

					<div class="space-y-2">
						<Label for="notes">Notes (Optional)</Label>
						<Textarea
							id="notes"
							bind:value={notes}
							placeholder="Pack warm clothes, book hotel..."
							rows={3}
						/>
					</div>

					<div class="space-y-3">
						<div class="flex items-center space-x-2">
							<Checkbox id="assign-trip" bind:checked={assignToSelf} />
							<Label for="assign-trip" class="text-sm font-normal cursor-pointer">
								Assign to me ({$currentUser?.email})
							</Label>
						</div>

						<div class="space-y-2">
							<Label class="text-sm">Also assign to (max 4 total):</Label>
							<div class="space-y-2">
								{#each users.filter(u => u.id !== pb.authStore.model?.id) as user}
									<div class="flex items-center space-x-2">
										<Checkbox 
											id={`user-${user.id}`}
											checked={selectedUsers.includes(user.id)}
											disabled={selectedUsers.length >= 4 && !selectedUsers.includes(user.id)}
											onCheckedChange={(checked) => {
												if (checked) {
													if (selectedUsers.length < 4) {
														selectedUsers = [...selectedUsers, user.id];
													}
												} else {
													selectedUsers = selectedUsers.filter(id => id !== user.id);
												}
											}}
										/>
										<Label for={`user-${user.id}`} class="text-sm font-normal cursor-pointer">
											{user.email}
										</Label>
									</div>
								{/each}
							</div>
							{#if selectedUsers.length >= 4}
								<p class="text-xs text-muted-foreground">Maximum 4 users reached</p>
							{/if}
						</div>
					</div>

					<div class="flex gap-2 justify-end">
						<Button type="button" variant="outline" onclick={() => dialogOpen = false}>
							Cancel
						</Button>
						<Button type="submit" disabled={saving}>
							{saving ? 'Creating...' : 'Create Trip'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
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
		<div class="space-y-3">
			{#each trips as trip (trip.id)}
				<Card class="p-4">
					<div class="space-y-3">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h3 class="font-semibold flex items-center gap-2">
									<Plane class="h-4 w-4 text-cyan-500" />
									{trip.title}
								</h3>
							</div>
						</div>

						<div class="space-y-2 text-sm text-muted-foreground">
							<div class="flex items-center gap-2">
								<Calendar class="h-4 w-4" />
								<span>Departs: {formatDate(trip.depart_at)}</span>
							</div>
							
							{#if trip.arrive_at}
								<div class="flex items-center gap-2">
									<Calendar class="h-4 w-4" />
									<span>Arrives: {formatDate(trip.arrive_at)}</span>
								</div>
							{/if}

							{#if trip.origin || trip.destination}
								<div class="flex items-center gap-2">
									<MapPin class="h-4 w-4" />
									<span>
										{#if trip.origin}{trip.origin}{/if}
										{#if trip.origin && trip.destination} → {/if}
										{#if trip.destination}{trip.destination}{/if}
									</span>
								</div>
							{/if}

							{#if trip.notes}
								<p class="text-xs mt-2">{trip.notes}</p>
							{/if}
						</div>

						<div class="flex gap-2">
							<Button variant="outline" size="sm" class="flex-1">Edit</Button>
							<Button variant="outline" size="sm" class="flex-1">Delete</Button>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
