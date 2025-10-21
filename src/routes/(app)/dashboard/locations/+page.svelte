<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import MapLibreMap from '$lib/components/MapLibreMap.svelte';
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
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { onMount } from 'svelte';
	import { Plus, MapPin, Phone, Building2 } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import type { Location } from '$lib/types';
	import LocationMap from '$lib/components/LocationMap.svelte';

	let dialogOpen = $state(false);
	let saving = $state(false);
	let loading = $state(true);
	let geocoding = $state(false);

	// Form fields
	let name = $state('');
	let address = $state('');
	let latitude = $state<number | undefined>(undefined);
	let longitude = $state<number | undefined>(undefined);
	let phone = $state('');
	let locationType = $state<'medical' | 'hotel' | 'restaurant' | 'office' | 'home' | 'other'>('medical');
	let notes = $state('');

	let locations = $state<Location[]>([]);

	onMount(async () => {
		await loadLocations();
	});

	async function loadLocations() {
		try {
			loading = true;
			locations = await pb.collection('locations').getFullList<Location>({
				sort: '-created'
			});
			console.log('[LOCATIONS] Loaded locations:', locations);
		} catch (error) {
			console.error('[LOCATIONS] Error loading locations:', error);
		} finally {
			loading = false;
		}
	}

	const typeColors: Record<string, string> = {
		medical: 'bg-red-100 text-red-800',
		hotel: 'bg-blue-100 text-blue-800',
		restaurant: 'bg-orange-100 text-orange-800',
		office: 'bg-gray-100 text-gray-800',
		home: 'bg-green-100 text-green-800',
		other: 'bg-purple-100 text-purple-800'
	};

	const typeIcons: Record<string, any> = {
		medical: Building2,
		hotel: Building2,
		restaurant: Building2,
		office: Building2,
		home: Building2,
		other: Building2
	};

	async function handleSubmit() {
		console.log('[LOCATIONS] handleSubmit called');
		saving = true;
		try {
			const data = {
				name,
				address: address || undefined,
				latitude: latitude || undefined,
				longitude: longitude || undefined,
				phone: phone || undefined,
				type: locationType,
				notes: notes || undefined
			};


			if (editingLocation) {
				console.log("[LOCATIONS] Updating location with data:", data);
				const record = await pb.collection("locations").update(editingLocation.id, data);
				console.log("[LOCATIONS] Location updated:", record);
				locations = locations.map(l => l.id === editingLocation.id ? record as Location : l);
			} else {
				console.log("[LOCATIONS] Creating location with data:", data);
				const record = await pb.collection("locations").create(data);
				console.log("[LOCATIONS] Location created:", record);
				locations = [...locations, record as Location];
			}





			
			// Reset form
			resetForm();
			dialogOpen = false;
		} catch (error) {
			console.error('Error creating location:', error);
			alert('Failed to create location');
		} finally {
			saving = false;
		}
	}

	let editingLocation: Location | null = null;

	function resetForm() {
		editingLocation = null;
		name = '';
		address = '';
		latitude = undefined;
		longitude = undefined;
		phone = '';
		locationType = 'medical';
		notes = '';
	}

	function openEditDialog(location: Location) {
		editingLocation = location;
		name = location.name;
		address = location.address || "";
		// Treat 0 as undefined (invalid coordinates)
		latitude = location.latitude && location.latitude !== 0 ? location.latitude : undefined;
		longitude = location.longitude && location.longitude !== 0 ? location.longitude : undefined;
		phone = location.phone || "";
		locationType = location.type || "medical";
		notes = location.notes || "";
		dialogOpen = true;
		
		// Auto-geocode if we have an address but no valid coordinates
		if (address && latitude === undefined && longitude === undefined) {
			setTimeout(() => geocodeAddress(), 100);
		}
	}

	async function geocodeAddress() {
		if (!address.trim()) {
			return;
		}

		// Don't geocode if we already have coordinates
		if (latitude !== undefined && longitude !== undefined) {
			console.log('[GEOCODING] Skipping - coordinates already exist:', { latitude, longitude });
			return;
		}

		geocoding = true;
		try {
			// Try the full address first
			let response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
				{
					headers: {
						'User-Agent': 'LifeHub App'
					}
				}
			);
			let data = await response.json();
			
			// If no results, try without suite/unit number
			if (!data || data.length === 0) {
				const simplifiedAddress = address.replace(/\s+(#|Suite|Ste|Unit|Apt|B)\s*[\w-]+/gi, '');
				if (simplifiedAddress !== address) {
					console.log('[GEOCODING] Retrying with simplified address:', simplifiedAddress);
					response = await fetch(
						`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(simplifiedAddress)}&limit=1`,
						{
							headers: {
								'User-Agent': 'LifeHub App'
							}
						}
					);
					data = await response.json();
				}
			}
			
			if (data && data.length > 0) {
				latitude = parseFloat(data[0].lat);
				longitude = parseFloat(data[0].lon);
				console.log('[GEOCODING] Found coordinates:', { latitude, longitude, display_name: data[0].display_name });
			} else {
				console.log('[GEOCODING] No results found for address:', address);
			}
		} catch (error) {
			console.error('[GEOCODING] Error:', error);
		} finally {
			geocoding = false;
		}
	}

	async function handleAddressBlur() {
		// Only auto-geocode if address changed and we don't have coordinates
		if (address.trim() && latitude === undefined && longitude === undefined) {
			await geocodeAddress();
		}
	}

	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this location?")) return;
		try {
			await pb.collection("locations").delete(id);
			locations = locations.filter(l => l.id !== id);
		} catch (error) {
			console.error("Error deleting location:", error);
			if (error.status === 404) {
				locations = locations.filter(l => l.id !== id);
			} else {
				alert("Failed to delete location");
			}
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Locations</h1>
			<p class="text-muted-foreground">Manage places for appointments</p>
		</div>
		
		<Dialog bind:open={dialogOpen} onOpenChange={(open) => { if (open && !editingLocation) resetForm(); }}>
			<DialogTrigger asChild>
				{#snippet child({ props })}
					<Button {...props}>
						<Plus class="mr-2 h-4 w-4" />
						Add Location
					</Button>
				{/snippet}
			</DialogTrigger>
			<DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{editingLocation ? 'Edit Location' : 'Add Location'}</DialogTitle>
					<DialogDescription>{editingLocation ? 'Update location details' : 'Add a new place for appointments'}</DialogDescription>
				</DialogHeader>
				
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
					<div class="space-y-2">
						<Label for="name">Name</Label>
						<Input
							id="name"
							bind:value={name}
							placeholder="Downtown Medical Center"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="address">Address</Label>
						<Input
							id="address"
							bind:value={address}
							placeholder="123 Main St, City, State ZIP"
							onblur={handleAddressBlur}
						/>
						{#if geocoding}
							<p class="text-xs text-muted-foreground">
								🔍 Finding coordinates...
							</p>
						{:else if address && latitude && longitude}
							<p class="text-xs text-green-600">
								✓ Coordinates found automatically
							</p>
						{:else if address}
							<p class="text-xs text-muted-foreground">
								Coordinates will be found automatically when you finish typing
							</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="phone">Phone (Optional)</Label>
						<Input
							id="phone"
							type="tel"
							bind:value={phone}
							placeholder="+1 555 123 4567"
						/>
					</div>

					<div class="space-y-2">
						<Label for="type">Type</Label>
						<select
							id="type"
							bind:value={locationType}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							<option value="medical">Medical</option>
							<option value="hotel">Hotel</option>
							<option value="restaurant">Restaurant</option>
							<option value="office">Office</option>
							<option value="home">Home</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div class="space-y-2">
						<Label>Coordinates (Optional)</Label>
						<div class="grid grid-cols-2 gap-2">
						<Input
							type="number"
							step="any"
							bind:value={latitude}
							placeholder="Latitude (e.g., 34.1478)"
						/>
						<Input
							type="number"
							step="any"
							bind:value={longitude}
							placeholder="Longitude (e.g., -118.1445)"
						/>
					</div>
						{#if latitude && longitude}
						<div class="flex items-center gap-2 text-xs text-muted-foreground">
							<MapPin class="h-3 w-3" />
							<a 
								href="https://www.openstreetmap.org/?mlat={latitude}&mlon={longitude}#map=15/{latitude}/{longitude}" 
								target="_blank" 
								class="text-blue-600 hover:underline"
							>
								OpenStreetMap
							</a>
							<span>|</span>
							<a 
								href="https://www.google.com/maps?q={latitude},{longitude}" 
								target="_blank" 
								class="text-blue-600 hover:underline"
							>
								Google Maps
							</a>
						</div>
					<p class="text-xs text-muted-foreground">
						Find coordinates on <a href="https://www.openstreetmap.org/" target="_blank" class="text-blue-600 hover:underline">OpenStreetMap</a> or <a href="https://www.google.com/maps" target="_blank" class="text-blue-600 hover:underline">Google Maps</a>
					</p>
				{/if}
					</div>

					<div class="space-y-2">
						<Label for="notes">Notes (Optional)</Label>
						<Textarea
							id="notes"
							bind:value={notes}
							placeholder="Parking info, special instructions..."
							rows={3}
						/>
					</div>

					<div class="flex gap-2 justify-end">
						<Button type="button" variant="outline" onclick={() => dialogOpen = false}>
							Cancel
						</Button>
						<Button type="submit" disabled={saving}>
							{saving ? 'Adding...' : 'Add Location'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<p class="text-muted-foreground">Loading locations...</p>
		</div>
	{:else if locations.length === 0}
		<Card class="p-12">
			<div class="text-center">
				<MapPin class="mx-auto h-12 w-12 text-muted-foreground" />
				<h3 class="mt-4 text-lg font-semibold">No locations yet</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Add your first location to track appointment places
				</p>
			</div>
		</Card>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each locations as location}
			<Card class="overflow-hidden">
				<!-- Map Thumbnail - Static Image from OpenStreetMap -->
			{#if location.latitude && location.longitude}
				<div class="relative h-48 w-full">
					<MapLibreMap 
						latitude={location.latitude} 
						longitude={location.longitude} 
						zoom={14}
						height="192px"
						interactive={false}
						showMarker={true}
					/>
					<div class="absolute bottom-2 right-2 flex gap-1">
						<a 
							href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=15/${location.latitude}/${location.longitude}`}
							target="_blank"
							rel="noopener noreferrer"
							class="bg-white/90 hover:bg-white px-2 py-1 rounded text-xs text-blue-600 font-medium shadow-sm"
						>
							OSM
						</a>
						<a 
							href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
							target="_blank"
							rel="noopener noreferrer"
							class="bg-white/90 hover:bg-white px-2 py-1 rounded text-xs text-blue-600 font-medium shadow-sm"
						>
							Google
						</a>
					</div>
				</div>
					<p class="text-xs text-muted-foreground">
						Find coordinates on <a href="https://www.openstreetmap.org/" target="_blank" class="text-blue-600 hover:underline">OpenStreetMap</a> or <a href="https://www.google.com/maps" target="_blank" class="text-blue-600 hover:underline">Google Maps</a>
					</p>
				{/if}

				<div class="p-4 space-y-3">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<h3 class="font-semibold">{location.name}</h3>
							{#if location.type}
								<span
									class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium {typeColors[
										location.type
									]}"
								>
									{location.type}
								</span>
							{:else}
					<p class="text-xs text-muted-foreground">
						Find coordinates on <a href="https://www.openstreetmap.org/" target="_blank" class="text-blue-600 hover:underline">OpenStreetMap</a> or <a href="https://www.google.com/maps" target="_blank" class="text-blue-600 hover:underline">Google Maps</a>
					</p>
				{/if}
						</div>
					</div>

					{#if location.address}
						<div class="flex items-start gap-2 text-sm text-muted-foreground">
							<MapPin class="mt-0.5 h-4 w-4 flex-shrink-0" />
							<span>{location.address}</span>
						</div>
					{:else}
					<p class="text-xs text-muted-foreground">
						Find coordinates on <a href="https://www.openstreetmap.org/" target="_blank" class="text-blue-600 hover:underline">OpenStreetMap</a> or <a href="https://www.google.com/maps" target="_blank" class="text-blue-600 hover:underline">Google Maps</a>
					</p>
				{/if}

					{#if location.phone}
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Phone class="h-4 w-4 flex-shrink-0" />
							<span>{location.phone}</span>
						</div>
					{:else}
					<p class="text-xs text-muted-foreground">
						Find coordinates on <a href="https://www.openstreetmap.org/" target="_blank" class="text-blue-600 hover:underline">OpenStreetMap</a> or <a href="https://www.google.com/maps" target="_blank" class="text-blue-600 hover:underline">Google Maps</a>
					</p>
				{/if}

					{#if location.notes}
						<p class="text-sm text-muted-foreground">{location.notes}</p>
					{:else}
					<p class="text-xs text-muted-foreground">
						Find coordinates on <a href="https://www.openstreetmap.org/" target="_blank" class="text-blue-600 hover:underline">OpenStreetMap</a> or <a href="https://www.google.com/maps" target="_blank" class="text-blue-600 hover:underline">Google Maps</a>
					</p>
				{/if}

					<div class="flex gap-2 pt-2">
						<Button variant="outline" size="sm" class="flex-1" onclick={() => openEditDialog(location)}>Edit</Button>
						<Button variant="outline" size="sm" class="flex-1" onclick={() => handleDelete(location.id)}>Delete</Button>
					</div>
				</div>
			</Card>
		{/each}
		</div>
	{/if}
</div>
