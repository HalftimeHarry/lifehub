<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
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
	import { Plus, MapPin, Phone, Building2 } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import type { Location } from '$lib/types';

	let dialogOpen = $state(false);
	let saving = $state(false);

	// Form fields
	let name = $state('');
	let address = $state('');
	let phone = $state('');
	let locationType = $state<'medical' | 'hotel' | 'restaurant' | 'office' | 'home' | 'other'>('medical');
	let notes = $state('');

	// Mock data - will be replaced with PocketBase fetch
	let locations: Location[] = [
		{
			id: '1',
			name: 'Downtown Medical Center',
			address: '123 Main St, Suite 200, Springfield, IL 62701',
			phone: '+15555551234',
			type: 'medical',
			notes: 'Parking in rear lot',
			created: new Date().toISOString(),
			updated: new Date().toISOString()
		},
		{
			id: '2',
			name: 'Hilton Garden Inn',
			address: '456 Hotel Blvd, Chicago, IL 60601',
			phone: '+15555555678',
			type: 'hotel',
			notes: 'Ask for room with view',
			created: new Date().toISOString(),
			updated: new Date().toISOString()
		}
	];

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
		saving = true;
		try {
			const data = {
				name,
				address: address || undefined,
				phone: phone || undefined,
				type: locationType,
				notes: notes || undefined
			};

			const record = await pb.collection('locations').create(data);
			
			// Add to local list
			locations = [...locations, record as Location];
			
			// Reset form
			name = '';
			address = '';
			phone = '';
			locationType = 'medical';
			notes = '';
			
			dialogOpen = false;
		} catch (error) {
			console.error('Error creating location:', error);
			alert('Failed to create location');
		} finally {
			saving = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Locations</h1>
			<p class="text-muted-foreground">Manage places for appointments</p>
		</div>
		
		<Dialog bind:open={dialogOpen}>
			<DialogTrigger asChild>
				{#snippet child({ props })}
					<Button {...props}>
						<Plus class="mr-2 h-4 w-4" />
						Add Location
					</Button>
				{/snippet}
			</DialogTrigger>
			<DialogContent class="max-w-md">
				<DialogHeader>
					<DialogTitle>Add Location</DialogTitle>
					<DialogDescription>Add a new place for appointments</DialogDescription>
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
						<Label for="address">Address (Optional)</Label>
						<Input
							id="address"
							bind:value={address}
							placeholder="123 Main St, City, State ZIP"
						/>
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
						<Select bind:value={locationType}>
							<SelectTrigger>
								{locationType || 'Select type'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="medical">Medical</SelectItem>
								<SelectItem value="hotel">Hotel</SelectItem>
								<SelectItem value="restaurant">Restaurant</SelectItem>
								<SelectItem value="office">Office</SelectItem>
								<SelectItem value="home">Home</SelectItem>
								<SelectItem value="other">Other</SelectItem>
							</SelectContent>
						</Select>
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

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each locations as location}
			<Card class="p-4">
				<div class="space-y-3">
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
							{/if}
						</div>
					</div>

					{#if location.address}
						<div class="flex items-start gap-2 text-sm text-muted-foreground">
							<MapPin class="mt-0.5 h-4 w-4 flex-shrink-0" />
							<span>{location.address}</span>
						</div>
					{/if}

					{#if location.phone}
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Phone class="h-4 w-4 flex-shrink-0" />
							<span>{location.phone}</span>
						</div>
					{/if}

					{#if location.notes}
						<p class="text-sm text-muted-foreground">{location.notes}</p>
					{/if}

					<div class="flex gap-2 pt-2">
						<Button variant="outline" size="sm" class="flex-1">Edit</Button>
						<Button variant="outline" size="sm" class="flex-1">Delete</Button>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	{#if locations.length === 0}
		<Card class="p-12">
			<div class="text-center">
				<MapPin class="mx-auto h-12 w-12 text-muted-foreground" />
				<h3 class="mt-4 text-lg font-semibold">No locations yet</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Add your first location to track appointment places
				</p>
				<Button class="mt-4">
					<Plus class="mr-2 h-4 w-4" />
					Add Location
				</Button>
			</div>
		</Card>
	{/if}
</div>
