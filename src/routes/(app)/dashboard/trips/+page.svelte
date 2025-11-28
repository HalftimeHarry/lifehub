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
	import type { Trip, TripExpanded, Person } from '$lib/types';

	let trips = $state<TripExpanded[]>([]);
	let people = $state<Person[]>([]);
	let loading = $state(true);
	let dialogOpen = $state(false);
	let saving = $state(false);
	let editingTripId = $state<string | null>(null); // Track if we're editing
	
	// Pagination
	let currentPage = $state(1);
	let itemsPerPage = 5;
	
	// Paginated trips
	let paginatedTrips = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return trips.slice(start, end);
	});
	
	let totalPages = $derived(Math.ceil(trips.length / itemsPerPage));

	// Form fields
	let title = $state('');
	let depart_at = $state('');
	let arrive_at = $state('');
	let origin = $state('');
	let destination = $state('');
	let transport_type = $state<'plane' | 'car' | 'train' | 'bus' | 'uber' | 'lyft' | 'taxi' | 'boat' | 'bike' | 'walk' | 'free ride' | 'other'>('car');
	let notes = $state('');
	let color = $state('#06b6d4');
	let selectedPeople = $state<string[]>([]); // People assigned to this trip
	let ticketImage = $state<File | null>(null); // Ticket/boarding pass image

	onMount(async () => {
		try {
			// Fetch people for assignment
			people = await pb.collection('people').getFullList<Person>({
				sort: 'name'
			});
			console.log('[TRIPS] Loaded people:', people);
			
			// Fetch trips from PocketBase
			trips = await pb.collection('trips').getFullList<TripExpanded>({ expand: 'people,created_by' });
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

			// Use FormData if there's an image, otherwise use plain object
			const formData = new FormData();
			formData.append('title', title);
			formData.append('depart_at', departDate.toISOString());
			if (arriveDate) formData.append('arrive_at', arriveDate.toISOString());
			if (origin) formData.append('origin', origin);
			if (destination) formData.append('destination', destination);
			if (transport_type) formData.append('transport_type', transport_type);
			if (color) formData.append('color', color);
			if (notes) formData.append('notes', notes);
			formData.append('notify_offset_minutes', '180');
			formData.append('active', 'true');
			if (pb.authStore.model?.id) formData.append('created_by', pb.authStore.model.id);
			
			// Add people as array
			selectedPeople.forEach(personId => {
				formData.append('people', personId);
			});
			
			// Add ticket image if provided
			if (ticketImage) {
				formData.append('ticket_image', ticketImage);
			}

			if (editingTripId) {
				// Update existing trip
				console.log('[TRIPS] Updating trip:', editingTripId);
				const record = await pb.collection('trips').update(editingTripId, formData);
				
				// Update in local list
				trips = trips.map(t => t.id === editingTripId ? record as TripExpanded : t);
			} else {
				// Create new trip
				console.log('[TRIPS] Creating trip');
				const record = await pb.collection('trips').create(formData);
				
				// Add to local list
				trips = [...trips, record as Trip];
			}
			
			// Reset form
			resetForm();
			dialogOpen = false;
		} catch (error) {
			console.error(`Error ${editingTripId ? 'updating' : 'creating'} trip:`, error);
			alert(`Failed to ${editingTripId ? 'update' : 'create'} trip`);
		} finally {
			saving = false;
		}
	}

	function resetForm() {
		title = '';
		depart_at = '';
		arrive_at = '';
		origin = '';
		destination = '';
		transport_type = 'car';
		color = '#06b6d4';
		notes = '';
		selectedPeople = [];
		ticketImage = null;
		editingTripId = null;
	}

	function openEditDialog(trip: TripExpanded) {
		editingTripId = trip.id;
		title = trip.title;
		depart_at = trip.depart_at.slice(0, 16);
		arrive_at = trip.arrive_at ? trip.arrive_at.slice(0, 16) : '';
		origin = trip.origin || '';
		destination = trip.destination || '';
		transport_type = trip.transport_type || 'car';
		color = trip.color || '#06b6d4';
		notes = trip.notes || '';
		selectedPeople = (trip as any).people || [];
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
		
		<Dialog bind:open={dialogOpen} onOpenChange={(open) => { if (open) resetForm(); }}>
			<DialogTrigger asChild>
				{#snippet child({ props })}
					<Button {...props}>
						<Plus class="mr-2 h-4 w-4" />
						Add Trip
					</Button>
				{/snippet}
			</DialogTrigger>
			<DialogContent class="max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0">
				<div class="px-6 pt-6 pb-4 border-b">
					<DialogHeader>
						<DialogTitle>{editingTripId ? 'Edit Trip' : 'Create Trip'}</DialogTitle>
						<DialogDescription>{editingTripId ? 'Update trip details' : 'Plan a new trip or travel'}</DialogDescription>
					</DialogHeader>
				</div>
				
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="flex flex-col flex-1 overflow-hidden min-h-0">
					<div class="space-y-4 overflow-y-auto px-6 py-4 max-h-[calc(90vh-180px)]" style="-webkit-overflow-scrolling: touch;">
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

					<div class="space-y-2">
						<Label for="ticket_image">Ticket/Boarding Pass (Optional)</Label>
						<Input
							id="ticket_image"
							type="file"
							accept="image/*"
							onchange={(e) => {
								const file = e.currentTarget.files?.[0];
								if (file) {
									ticketImage = file;
								}
							}}
						/>
						{#if ticketImage}
							<p class="text-xs text-muted-foreground">Selected: {ticketImage.name}</p>
						{/if}
					</div>

					<div class="space-y-3">
						<Label class="text-sm font-medium">Assign to People</Label>
						<div class="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
							{#if people.length === 0}
								<p class="text-sm text-muted-foreground">No people available. Add people first.</p>
							{:else}
								{#each people as person (person.id)}
									<div class="flex items-center space-x-2">
										<Checkbox 
											id="person-{person.id}" 
											checked={selectedPeople.includes(person.id)}
											onCheckedChange={(checked) => {
												if (checked) {
													selectedPeople = [...selectedPeople, person.id];
												} else {
													selectedPeople = selectedPeople.filter(id => id !== person.id);
												}
											}}
										/>
										<Label for="person-{person.id}" class="text-sm font-normal cursor-pointer flex items-center gap-2">
											{#if person.image}
												<img src={pb.files.getUrl(person, person.image, { thumb: '40x40' })} alt={person.name} class="w-5 h-5 rounded-full object-cover" />
											{:else}
												<div class="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
													{person.name.charAt(0).toUpperCase()}
												</div>
											{/if}
											{person.name}
										</Label>
									</div>
								{/each}
							{/if}
						</div>
					</div>
					</div>

					<div class="flex gap-2 justify-end px-6 py-4 border-t bg-background shrink-0">
						<Button type="button" variant="outline" onclick={() => { dialogOpen = false; resetForm(); }}>
							Cancel
						</Button>
						<Button type="submit" disabled={saving}>
							{#if saving}
								{editingTripId ? 'Updating...' : 'Creating...'}
							{:else}
								{editingTripId ? 'Update Trip' : 'Create Trip'}
							{/if}
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
		<Card>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="border-b bg-muted/50">
						<tr>
							<th class="p-3 text-left text-sm font-medium">Title</th>
							<th class="p-3 text-left text-sm font-medium">Transport</th>
							<th class="p-3 text-left text-sm font-medium">Route</th>
							<th class="p-3 text-left text-sm font-medium">Depart</th>
							<th class="p-3 text-left text-sm font-medium hidden md:table-cell">Arrive</th>
							<th class="p-3 text-left text-sm font-medium hidden lg:table-cell">People</th>
							<th class="p-3 text-left text-sm font-medium">Status</th>
							<th class="p-3 text-right text-sm font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
			{#each paginatedTrips as trip, index (trip.id)}
				{@const TransportIcon = getTransportIcon(trip.transport_type)}
				<tr class="{index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-accent/50 transition-colors">
				<!-- Title -->
				<td class="p-3">
					<div class="flex items-center gap-2">
						<TransportIcon class="h-4 w-4 text-cyan-500 flex-shrink-0" />
						<div>
							<div class="font-medium text-sm">{trip.title}</div>
							{#if trip.notes}
								<div class="text-xs text-muted-foreground line-clamp-1">{trip.notes}</div>
							{/if}
						</div>
					</div>
				</td>
				
				<!-- Transport -->
				<td class="p-3">
					{#if trip.transport_type}
						<span class="text-xs">{getTransportLabel(trip.transport_type)}</span>
					{:else}
						<span class="text-xs text-muted-foreground">-</span>
					{/if}
				</td>
				
				<!-- Route -->
				<td class="p-3">
					{#if trip.origin || trip.destination}
						<div class="text-sm">
							{#if trip.origin}{trip.origin}{/if}
							{#if trip.origin && trip.destination} → {/if}
							{#if trip.destination}{trip.destination}{/if}
						</div>
					{:else}
						<span class="text-xs text-muted-foreground">-</span>
					{/if}
				</td>
				
				<!-- Depart -->
				<td class="p-3">
					<div class="text-sm">{formatDate(trip.depart_at)}</div>
				</td>
				
				<!-- Arrive -->
				<td class="p-3 hidden md:table-cell">
					{#if trip.arrive_at}
						<div class="text-sm">{formatDate(trip.arrive_at)}</div>
					{:else}
						<span class="text-xs text-muted-foreground">-</span>
					{/if}
				</td>
				
				<!-- People -->
				<td class="p-3 hidden lg:table-cell">
					{#if trip.expand?.people && trip.expand.people.length > 0}
						<div class="flex flex-wrap gap-1">
							{#each trip.expand.people.slice(0, 3) as person}
								<span class="text-xs bg-secondary/50 rounded-full px-2 py-0.5">
									{person.name}
								</span>
							{/each}
							{#if trip.expand.people.length > 3}
								<span class="text-xs text-muted-foreground">+{trip.expand.people.length - 3}</span>
							{/if}
						</div>
					{:else}
						<span class="text-xs text-muted-foreground">-</span>
					{/if}
				</td>
				
				<!-- Status -->
				<td class="p-3">
					{#if trip.status}
						<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {trip.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
							{trip.status}
						</span>
					{:else}
						<span class="text-xs text-muted-foreground">-</span>
					{/if}
				</td>
				
				<!-- Actions -->
				<td class="p-3">
					<div class="flex gap-2 justify-end">
						<Button variant="outline" size="sm" onclick={() => openEditDialog(trip)}>Edit</Button>
						<Button variant="outline" size="sm" onclick={() => handleDelete(trip.id)}>Delete</Button>
					</div>
				</td>
			</tr>
			{/each}
					</tbody>
				</table>
			</div>
			
			<!-- Pagination Controls -->
			{#if totalPages > 1}
				<div class="flex items-center justify-between px-4 py-3 border-t">
					<div class="text-sm text-muted-foreground">
						Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, trips.length)} of {trips.length} trips
					</div>
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === 1}
							onclick={() => currentPage = 1}
						>
							First
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === 1}
							onclick={() => currentPage--}
						>
							Previous
						</Button>
						<div class="flex items-center gap-1">
							{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
								{#if page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)}
									<Button
										variant={page === currentPage ? 'default' : 'outline'}
										size="sm"
										onclick={() => currentPage = page}
									>
										{page}
									</Button>
								{:else if page === currentPage - 2 || page === currentPage + 2}
									<span class="px-2">...</span>
								{/if}
							{/each}
						</div>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === totalPages}
							onclick={() => currentPage++}
						>
							Next
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === totalPages}
							onclick={() => currentPage = totalPages}
						>
							Last
						</Button>
					</div>
				</div>
			{/if}
		</Card>
	{/if}
</div>
