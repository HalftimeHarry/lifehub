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
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Plus, Plane, MapPin, Calendar, Car, Train, Bus, Ship, Bike, Footprints, Filter, ArrowUpDown, X, Users, Receipt } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import { currentUser } from '$lib/auth';
	import type { Trip, TripExpanded, Person } from '$lib/types';
	import TripSummaryCard from '$lib/components/TripSummaryCard.svelte';
	import TripExpensesModal from '$lib/components/TripExpensesModal.svelte';

	let trips = $state<TripExpanded[]>([]);
	let allTrips = $state<TripExpanded[]>([]); // Store all trips
	let people = $state<Person[]>([]);
	let loading = $state(true);
	let dialogOpen = $state(false);
	let saving = $state(false);
	let editingTripId = $state<string | null>(null); // Track if we're editing
	
	// Trip summaries from API
	let tripSummaries = $state<Record<string, any>>({});
	let loadingSummaries = $state(false);
	
	// Expenses modal state
	let expensesModalOpen = $state(false);
	let selectedTripForExpenses = $state<any>(null);
	let selectedTripExpenses = $state<any[]>([]);
	
	// Filter states
	let statusFilter = $state<'all' | 'pending' | 'completed' | 'canceled'>('all');
	let transportFilter = $state<'all' | 'plane' | 'car' | 'train' | 'bus' | 'uber' | 'lyft' | 'taxi' | 'boat' | 'bike' | 'walk' | 'free ride' | 'other'>('all');
	let personFilter = $state('all');
	let sortBy = $state<'depart_at' | 'title'>('depart_at');
	
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
	let status = $state<'pending' | 'canceled' | 'completed'>('pending');
	let selectedPeople = $state<string[]>([]); // People assigned to this trip
	let ticketImage = $state<File | null>(null); // Ticket/boarding pass image
	
	// Details modal state
	let detailsModalOpen = $state(false);
	let selectedTrip = $state<TripExpanded | null>(null);
	let relatedExpenses = $state<any[]>([]);
	let loadingRelated = $state(false);

	onMount(async () => {
		try {
			// Fetch people for assignment
			people = await pb.collection('people').getFullList<Person>({
				sort: 'name'
			});
			console.log('[TRIPS] Loaded people:', people);
			
			// Fetch trips from PocketBase
			allTrips = await pb.collection('trips').getFullList<TripExpanded>({ expand: 'people,created_by' });
			applyFilters();
			loading = false;
			
			// Fetch trip summaries
			await fetchTripSummaries();
		} catch (error) {
			console.error('Error fetching trips:', error);
			loading = false;
		}
	});
	
	async function fetchTripSummaries() {
		try {
			loadingSummaries = true;
			const response = await fetch('/api/trips?include=summary');
			const data = await response.json();
			
			// Build summaries map
			tripSummaries = {};
			data.trips.forEach((item: any) => {
				tripSummaries[item.trip.id] = item.summary;
			});
			
			console.log('[TRIPS] Loaded summaries:', tripSummaries);
		} catch (error) {
			console.error('Error fetching trip summaries:', error);
		} finally {
			loadingSummaries = false;
		}
	}
	
	async function openExpensesModal(trip: any) {
		try {
			selectedTripForExpenses = trip;
			
			// Fetch detailed trip summary with expenses
			const response = await fetch(`/api/trips/${trip.id}/summary`);
			const data = await response.json();
			
			selectedTripExpenses = data.expenses || [];
			expensesModalOpen = true;
		} catch (error) {
			console.error('Error fetching trip expenses:', error);
		}
	}
	
	function closeExpensesModal() {
		expensesModalOpen = false;
		selectedTripForExpenses = null;
		selectedTripExpenses = [];
	}

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

	function applyFilters() {
		let filtered = [...allTrips];

		// Filter by status
		if (statusFilter !== 'all') {
			filtered = filtered.filter(trip => trip.status === statusFilter);
		}

		// Filter by transport type
		if (transportFilter !== 'all') {
			filtered = filtered.filter(trip => trip.transport_type === transportFilter);
		}

		// Filter by person
		if (personFilter !== 'all') {
			filtered = filtered.filter(trip => 
				(trip as any).people?.includes(personFilter)
			);
		}

		// Sort trips
		filtered.sort((a, b) => {
			if (sortBy === 'depart_at') {
				return new Date(a.depart_at).getTime() - new Date(b.depart_at).getTime();
			} else if (sortBy === 'title') {
				return a.title.localeCompare(b.title);
			}
			return 0;
		});

		trips = filtered;
	}

	function clearFilters() {
		statusFilter = 'all';
		transportFilter = 'all';
		personFilter = 'all';
		sortBy = 'depart_at';
		applyFilters();
	}

	// Watch for filter changes
	$effect(() => {
		statusFilter;
		transportFilter;
		personFilter;
		sortBy;
		
		if (allTrips.length > 0) {
			applyFilters();
		}
	});

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
			if (status) formData.append('status', status);
			formData.append('notify_offset_minutes', '1440');
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
				
				// Update in all trips and reapply filters
				allTrips = allTrips.map(t => t.id === editingTripId ? record as TripExpanded : t);
				applyFilters();
			} else {
				// Create new trip
				console.log('[TRIPS] Creating trip');
				const record = await pb.collection('trips').create(formData);
				
				// Add to all trips and reapply filters
				allTrips = [...allTrips, record as TripExpanded];
				applyFilters();
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
		status = 'pending';
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
		status = trip.status || 'pending';
		selectedPeople = (trip as any).people || [];
		dialogOpen = true;
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this trip?')) return;
		try {
			await pb.collection('trips').delete(id);
			allTrips = allTrips.filter(t => t.id !== id);
			applyFilters();
		} catch (error) {
			console.error('Error deleting trip:', error);
			if (error.status === 404) {
				allTrips = allTrips.filter(t => t.id !== id);
				applyFilters();
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
	
	async function openDetailsModal(trip: TripExpanded) {
		selectedTrip = trip;
		detailsModalOpen = true;
		loadingRelated = true;
		
		try {
			// Fetch related expenses
			const expenses = await pb.collection('expenses').getFullList({
				filter: `trip = "${trip.id}"`,
				expand: 'for',
				sort: '-date'
			});
			relatedExpenses = expenses;
		} catch (error) {
			console.error('[TRIPS] Error loading related data:', error);
			relatedExpenses = [];
		} finally {
			loadingRelated = false;
		}
	}
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
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
						<Label for="status">Status</Label>
						<Select type="single" bind:value={status}>
							<SelectTrigger>
								{status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Select status'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="canceled">Canceled</SelectItem>
							</SelectContent>
						</Select>
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
												<img src={pb.files.getURL(person, person.image, { thumb: '40x40' })} alt={person.name} class="w-5 h-5 rounded-full object-cover" />
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

	<!-- Filters -->
	{#if !loading && allTrips.length > 0}
		<div class="flex flex-wrap gap-2 items-center">
			<div class="relative">
				<Filter class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
				<select bind:value={statusFilter} class="rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm appearance-none cursor-pointer">
					<option value="all">All Status</option>
					<option value="pending">Pending</option>
					<option value="completed">Completed</option>
					<option value="canceled">Canceled</option>
				</select>
			</div>

			<div class="relative">
				<Plane class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
				<select bind:value={transportFilter} class="rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm appearance-none cursor-pointer">
					<option value="all">All Transport</option>
					<option value="plane">Plane</option>
					<option value="car">Car</option>
					<option value="train">Train</option>
					<option value="bus">Bus</option>
					<option value="uber">Uber</option>
					<option value="lyft">Lyft</option>
					<option value="taxi">Taxi</option>
					<option value="boat">Boat</option>
					<option value="bike">Bike</option>
					<option value="walk">Walk</option>
					<option value="free ride">Free Ride</option>
					<option value="other">Other</option>
				</select>
			</div>

			<div class="relative">
				<Users class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
				<select bind:value={personFilter} class="rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm appearance-none cursor-pointer">
					<option value="all">All People</option>
					{#each people as person}
						<option value={person.id}>{person.name}</option>
					{/each}
				</select>
			</div>

			<div class="relative">
				<ArrowUpDown class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
				<select bind:value={sortBy} class="rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm appearance-none cursor-pointer">
					<option value="depart_at">Departure Date</option>
					<option value="title">Title</option>
				</select>
			</div>

			<Button variant="ghost" size="sm" onclick={clearFilters}>
				<X class="h-3.5 w-3.5 mr-1" />
				Clear
			</Button>
		</div>
	{/if}

	{#if loading}
		<p>Loading...</p>
	{:else if trips.length === 0 && allTrips.length === 0}
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-muted-foreground">
					{#if allTrips.length === 0}
						No trips yet. Click "Add Trip" to create one.
					{:else}
						No trips match the current filters.
					{/if}
				</p>
			</CardContent>
		</Card>
	{:else}
		<!-- Trip Summary Cards -->
		{#if !loadingSummaries && Object.keys(tripSummaries).length > 0}
			<div class="mb-6">
				<h2 class="text-lg font-semibold mb-4">Trip Summaries</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each paginatedTrips as trip}
						{#if tripSummaries[trip.id]}
							<TripSummaryCard 
								trip={trip} 
								summary={tripSummaries[trip.id]}
								onclick={() => openExpensesModal(trip)}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Expenses Modal -->
		<TripExpensesModal
			bind:open={expensesModalOpen}
			trip={selectedTripForExpenses}
			summary={selectedTripForExpenses ? tripSummaries[selectedTripForExpenses.id] : null}
			expenses={selectedTripExpenses}
			onClose={closeExpensesModal}
		/>
		
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
				<tr class="{index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-accent/50 transition-colors cursor-pointer" onclick={() => openDetailsModal(trip)}>
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
				<td class="p-3" onclick={(e) => e.stopPropagation()}>
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
	
	<!-- Trip Details Modal -->
	<Dialog bind:open={detailsModalOpen}>
		<DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>Trip Details</DialogTitle>
				<DialogDescription>View trip information and related expenses</DialogDescription>
			</DialogHeader>
			
			{#if selectedTrip}
				{@const TransportIcon = getTransportIcon(selectedTrip.transport_type)}
				<div class="space-y-6">
					<!-- Trip Info -->
					<div class="space-y-4">
						<div class="flex items-start gap-3">
							<TransportIcon class="h-6 w-6 text-cyan-500 mt-1" />
							<div class="flex-1">
								<h3 class="text-lg font-semibold">{selectedTrip.title}</h3>
								{#if selectedTrip.transport_type}
									<p class="text-sm text-muted-foreground">{getTransportLabel(selectedTrip.transport_type)}</p>
								{/if}
							</div>
							{#if selectedTrip.status}
								<span class="inline-block rounded-full px-3 py-1 text-xs font-medium {selectedTrip.status === 'completed' ? 'bg-green-100 text-green-800' : selectedTrip.status === 'canceled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
									{selectedTrip.status}
								</span>
							{/if}
						</div>
						
						<div class="grid grid-cols-2 gap-4">
							<div>
								<Label class="text-xs text-muted-foreground">Departure</Label>
								<p class="text-sm font-medium">{formatDate(selectedTrip.depart_at)}</p>
								{#if selectedTrip.origin}
									<p class="text-xs text-muted-foreground">{selectedTrip.origin}</p>
								{/if}
							</div>
							{#if selectedTrip.arrive_at}
								<div>
									<Label class="text-xs text-muted-foreground">Arrival</Label>
									<p class="text-sm font-medium">{formatDate(selectedTrip.arrive_at)}</p>
									{#if selectedTrip.destination}
										<p class="text-xs text-muted-foreground">{selectedTrip.destination}</p>
									{/if}
								</div>
							{/if}
						</div>
						
						{#if selectedTrip.notes}
							<div>
								<Label class="text-xs text-muted-foreground">Notes</Label>
								<p class="text-sm whitespace-pre-wrap">{selectedTrip.notes}</p>
							</div>
						{/if}
						
						{#if selectedTrip.expand?.people && selectedTrip.expand.people.length > 0}
							<div>
								<Label class="text-xs text-muted-foreground">People</Label>
								<div class="flex flex-wrap gap-2 mt-1">
									{#each selectedTrip.expand.people as person}
										<div class="flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1">
											{#if person.image}
												<img src={pb.files.getURL(person, person.image, { thumb: '40x40' })} alt={person.name} class="w-5 h-5 rounded-full object-cover" />
											{:else}
												<div class="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
													{person.name.charAt(0).toUpperCase()}
												</div>
											{/if}
											<span class="text-sm">{person.name}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
						
						{#if selectedTrip.ticket_image}
							<div>
								<Label class="text-xs text-muted-foreground">Ticket/Boarding Pass</Label>
								<img 
									src={pb.files.getURL(selectedTrip, selectedTrip.ticket_image)} 
									alt="Ticket" 
									class="mt-2 rounded-lg border max-w-full h-auto"
								/>
							</div>
						{/if}
					</div>
					
					<!-- Related Expenses -->
					<div class="border-t pt-4">
						<h4 class="font-semibold mb-3 flex items-center gap-2">
							<Receipt class="h-4 w-4" />
							Related Expenses
						</h4>
						
						{#if loadingRelated}
							<p class="text-sm text-muted-foreground">Loading expenses...</p>
						{:else if relatedExpenses.length === 0}
							<p class="text-sm text-muted-foreground">No expenses linked to this trip</p>
						{:else}
							<div class="space-y-2">
								{#each relatedExpenses as expense}
									<div class="flex items-center justify-between p-3 rounded-lg border bg-card">
										<div class="flex-1">
											<p class="text-sm font-medium">{expense.description || 'Expense'}</p>
											<div class="flex items-center gap-2 text-xs text-muted-foreground">
												<span>{new Date(expense.date).toLocaleDateString()}</span>
												{#if expense.category}
													<span>•</span>
													<span class="capitalize">{expense.category}</span>
												{/if}
												{#if expense.expand?.for}
													<span>•</span>
													<span>{expense.expand.for.name}</span>
												{/if}
											</div>
										</div>
										<div class="text-right">
											<p class="text-sm font-semibold {expense.type === 'income' ? 'text-green-600' : 'text-red-600'}">
												{expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
											</p>
											{#if expense.status}
												<span class="text-xs text-muted-foreground capitalize">{expense.status}</span>
											{/if}
										</div>
									</div>
								{/each}
								
								<div class="flex justify-between items-center pt-2 border-t font-semibold">
									<span class="text-sm">Total</span>
									<span class="text-sm">
										{formatCurrency(relatedExpenses.reduce((sum, e) => sum + (e.type === 'income' ? e.amount : -e.amount), 0))}
									</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</DialogContent>
	</Dialog>
</div>
