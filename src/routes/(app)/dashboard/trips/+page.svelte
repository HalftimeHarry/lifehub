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
	import { Plus, Plane, MapPin, Calendar, Car, Train, Bus, Ship, Bike, Footprints } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import { currentUser } from '$lib/auth';
	import type { Trip, TripExpanded, User } from '$lib/types';

	let trips = $state<TripExpanded[]>([]);
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
	let transport_type = $state<'plane' | 'car' | 'train' | 'bus' | 'uber' | 'lyft' | 'taxi' | 'boat' | 'bike' | 'walk' | 'free ride' | 'other'>('car');
	let notes = $state('');
	let color = $state('#06b6d4');
	let assignToSelf = $state(true); // Default to assigning to current user
	let selectedUsers = $state<string[]>([]); // Additional users to assign

	onMount(async () => {
		try {
			// Fetch users for assignment
			users = await pb.collection('users').getFullList<User>({
				sort: 'email'
			});
			console.log('[TRIPS] Loaded users:', users);
			
			// Fetch trips from PocketBase
			trips = await pb.collection('trips').getFullList<TripExpanded>({ expand: 'assigned_to,created_by' });
			loading = false;
		} catch (error) {
			console.error('Error fetching trips:', error);
			loading = false;
		}
	});

	function getTransportIcon(type?: string) {
		switch (type) {
			case 'plane': return Plane;
			case 'car': return Car;
			case 'train': return Train;
			case 'bus': return Bus;
			case 'uber':
			case 'lyft':
			case 'taxi': return Car;
			case 'boat': return Ship;
			case 'bike': return Bike;
			case 'walk': return Footprints;
			default: return MapPin;
		}
	}

	function getTransportLabel(type?: string) {
		switch (type) {
			case 'plane': return '✈️ Plane';
			case 'car': return '🚗 Car';
			case 'train': return '🚆 Train';
			case 'bus': return '🚌 Bus';
			case 'uber': return '🚕 Uber';
			case 'lyft': return '🚙 Lyft';
			case 'taxi': return '🚖 Taxi';
			case 'free ride': return '🚐 Free Ride';
			case 'boat': return '🚢 Boat';
			case 'bike': return '🚴 Bike';
			case 'walk': return '🚶 Walk';
			case 'other': return '🔹 Other';
			default: return '🔹 Transport';
		}
	}

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
				transport_type: transport_type || undefined,
				color: color || undefined,
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
			transport_type = 'car';
			color = '#06b6d4';
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

	function openEditDialog(trip: TripExpanded) {
		title = trip.title;
		depart_at = trip.depart_at.slice(0, 16);
		arrive_at = trip.arrive_at ? trip.arrive_at.slice(0, 16) : '';
		origin = trip.origin || '';
		destination = trip.destination || '';
		notes = trip.notes || '';
		selectedUsers = trip.assigned_to || [];
		dialogOpen = true;
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this trip?')) return;
		try {
			await pb.collection('trips').delete(id);
			trips = trips.filter(t => t.id !== id);
		} catch (error) {
			console.error('Error deleting trip:', error);
			if (error.status === 404) {
				trips = trips.filter(t => t.id !== id);
			} else {
				alert('Failed to delete trip');
			}
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
						<Label for="transport_type">Transportation</Label>
						<select
							id="transport_type"
							bind:value={transport_type}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							<option value="plane">✈️ Plane</option>
							<option value="car">🚗 Car</option>
							<option value="train">🚆 Train</option>
							<option value="bus">🚌 Bus</option>
							<option value="uber">🚕 Uber</option>
							<option value="lyft">🚙 Lyft</option>
							<option value="taxi">🚖 Taxi</option>
							<option value="free ride">🚐 Free Ride</option>
							<option value="boat">🚢 Boat</option>
							<option value="bike">🚴 Bike</option>
							<option value="walk">🚶 Walk</option>
							<option value="other">🔹 Other</option>
						</select>
					</div>

					<div class="space-y-2">
						<Label for="color">Color</Label>
						<div class="flex gap-2">
							<Input id="color" type="color" bind:value={color} class="w-20 h-10" />
							<Input bind:value={color} placeholder="#06b6d4" class="flex-1" />
						</div>
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
				<Card class="overflow-hidden">
					{#if trip.color}
						<div class="h-2" style="background-color: {trip.color}"></div>
					{/if}
					<div class="p-4 space-y-3">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h3 class="font-semibold flex items-center gap-2">
									{@const TransportIcon = getTransportIcon(trip.transport_type)}
									<TransportIcon class="h-4 w-4 text-cyan-500" />
									{trip.title}
								</h3>
								{#if trip.transport_type}
									<p class="text-xs text-muted-foreground mt-1">{getTransportLabel(trip.transport_type)}</p>
								{/if}
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
						
						{#if trip.phone}
							<p class="text-xs mt-1"><span class="font-medium">📞 Phone:</span> {trip.phone}</p>
						{/if}
					</div>

					{#if trip.expand?.assigned_to && trip.expand.assigned_to.length > 0}
						<div class="mt-3 pt-3 border-t">
							<p class="text-xs text-muted-foreground mb-2">Traveling:</p>
							<div class="flex flex-wrap gap-2">
								{#each trip.expand.assigned_to as person}
									<div class="flex items-center gap-2 bg-secondary/50 rounded-full pl-1 pr-3 py-1">
										{#if person.image}
											<img src={pb.files.getUrl(person, person.image, { thumb: '40x40' })} alt={person.name} class="w-6 h-6 rounded-full object-cover" />
										{:else}
											<div class="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
												{person.name.charAt(0).toUpperCase()}
											</div>
										{/if}
										<span class="text-xs font-medium">{person.name}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div class="flex gap-2">
						<Button variant="outline" size="sm" class="flex-1" onclick={() => openEditDialog(trip)}>Edit</Button>
									<Button variant="outline" size="sm" class="flex-1" onclick={() => handleDelete(trip.id)}>Delete</Button>
		</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
