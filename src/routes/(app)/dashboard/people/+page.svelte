<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
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
	import { Users, Plus, Phone, Mail } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import type { Person } from '$lib/types';

	let people = $state<Person[]>([]);
	let loading = $state(true);
	let error = $state('');
	let dialogOpen = $state(false);
	let saving = $state(false);
	let editingPerson: Person | null = $state(null);

	// Form fields
	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let relationship = $state('');
	let notes = $state('');
	let imageFile: File | null = $state(null);

	onMount(async () => {
		await loadPeople();
	});

	async function loadPeople() {
		try {
			loading = true;
			error = '';
			console.log('[PEOPLE] Fetching people from PocketBase...');
			console.log('[PEOPLE] Auth valid:', pb.authStore.isValid);
			console.log('[PEOPLE] Current user:', pb.authStore.model);
			
			const records = await pb.collection('people').getFullList<Person>({
				sort: '-created'
			});
			
			console.log('[PEOPLE] Loaded people:', records);
			people = records;
		} catch (err) {
			console.error('[PEOPLE] Error fetching people:', err);
			error = err instanceof Error ? err.message : 'Failed to load people';
		} finally {
			loading = false;
		}
	}

	function openEditDialog(person: Person) {
		editingPerson = person;
		name = person.name;
		phone = person.phone || '';
		email = person.email || '';
		relationship = person.relationship || '';
		notes = person.notes || '';
		imageFile = null;
		dialogOpen = true;
	}

	function resetForm() {
		editingPerson = null;
		name = '';
		phone = '';
		email = '';
		relationship = '';
		notes = '';
		imageFile = null;
	}

	async function handleDelete(person: Person) {
		if (!confirm(`Delete ${person.name}?`)) return;
		
		try {
			await pb.collection('people').delete(person.id);
			people = people.filter(p => p.id !== person.id);
		} catch (error) {
			console.error('[PEOPLE] Error deleting person:', error);
			// Reload list in case record doesn't exist
			await loadPeople();
		}
	}

	async function handleSubmit() {
		saving = true;
		try {
			const formData = new FormData();
			formData.append('name', name);
			if (phone) formData.append('phone', phone);
			if (email) formData.append('email', email);
			if (relationship) formData.append('relationship', relationship);
			if (notes) formData.append('notes', notes);
			if (imageFile) formData.append('image', imageFile);
			if (!editingPerson && pb.authStore.model?.id) formData.append('created_by', pb.authStore.model.id);

			if (editingPerson) {
				// Update existing person - verify it exists first
				console.log('[PEOPLE] Updating person:', editingPerson.id);
				try {
					const record = await pb.collection('people').update(editingPerson.id, formData);
					people = people.map(p => p.id === record.id ? record as Person : p);
				} catch (err: any) {
					console.error('[PEOPLE] Update failed, record may not exist. Reloading list...');
					if (err?.status === 404) {
						// Record doesn't exist, remove from local list and reload
						people = people.filter(p => p.id !== editingPerson.id);
						await loadPeople();
						resetForm();
						dialogOpen = false;
						return; // Don't throw, just close the dialog
					}
					throw err;
				}
			} else {
				// Create new person
				console.log('[PEOPLE] Creating new person');
				const record = await pb.collection('people').create(formData);
				people = [...people, record as Person];
			}
			
			resetForm();
			dialogOpen = false;
		} catch (error) {
			console.error('[PEOPLE] Error saving person:', error);
			const errorMsg = error instanceof Error ? error.message : 'Failed to save person';
			// Can't use alert in sandboxed iframe, log to console instead
			console.error('[PEOPLE] Save failed:', errorMsg);
		} finally {
			saving = false;
		}
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold">People</h1>
			<p class="text-sm text-muted-foreground">Manage contacts for appointments</p>
		</div>
		
		<div class="flex gap-2">
			<Button variant="outline" size="sm" onclick={loadPeople} disabled={loading}>
				Refresh
			</Button>
				<Dialog bind:open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
				<DialogTrigger asChild>
					{#snippet child({ props })}
						<Button {...props} size="sm">
							<Plus class="h-4 w-4 mr-2" />
							Add Person
						</Button>
					{/snippet}
				</DialogTrigger>
			<DialogContent class="max-w-md">
				<DialogHeader>
					<DialogTitle>{editingPerson ? 'Edit Person' : 'Add Person'}</DialogTitle>
					<DialogDescription>
						{editingPerson ? 'Update person information' : 'Add a new person to manage appointments for'}
					</DialogDescription>
				</DialogHeader>
				
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
					<div class="space-y-2">
						<Label for="name">Name</Label>
						<Input
							id="name"
							bind:value={name}
							placeholder="Full name"
							required
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
						<Label for="email">Email (Optional)</Label>
						<Input
							id="email"
							type="email"
							bind:value={email}
							placeholder="email@example.com"
						/>
					</div>

					<div class="space-y-2">
						<Label for="relationship">Relationship (Optional)</Label>
						<Input
							id="relationship"
							bind:value={relationship}
							placeholder="Mother, Father, Friend, etc."
						/>
					</div>

					<div class="space-y-2">
						<Label for="image">Photo (Optional)</Label>
						<Input
							id="image"
							type="file"
							accept="image/*"
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								imageFile = target.files?.[0] || null;
							}}
						/>
						<p class="text-xs text-muted-foreground">Upload a profile photo (max 5MB)</p>
					</div>

					<div class="space-y-2">
						<Label for="notes">Notes (Optional)</Label>
						<Textarea
							id="notes"
							bind:value={notes}
							placeholder="Additional information..."
							rows={3}
						/>
					</div>

					<div class="flex gap-2 justify-end">
						<Button type="button" variant="outline" onclick={() => dialogOpen = false}>
							Cancel
						</Button>
						<Button type="submit" disabled={saving}>
							{saving ? (editingPerson ? 'Updating...' : 'Adding...') : (editingPerson ? 'Update Person' : 'Add Person')}
						</Button>
					</div>
				</form>
			</DialogContent>
			</Dialog>
		</div>
	</div>

	{#if error}
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-red-500">{error}</p>
				<Button class="mt-4 mx-auto block" onclick={loadPeople}>Retry</Button>
			</CardContent>
		</Card>
	{:else if loading}
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-muted-foreground">Loading...</p>
			</CardContent>
		</Card>
	{:else if people.length === 0}
		<Card>
			<CardContent class="pt-6 text-center space-y-4">
				<Users class="h-12 w-12 mx-auto text-muted-foreground" />
				<div>
					<p class="font-medium">No people added yet</p>
					<p class="text-sm text-muted-foreground mt-1">
						Add people you care for to create appointments for them
					</p>
				</div>
				<Button>
					<Plus class="h-4 w-4 mr-2" />
					Add Your First Person
				</Button>
			</CardContent>
		</Card>
	{:else}
		<div class="space-y-3">
			{#each people as person (person.id)}
				<Card class="hover:bg-accent/50 transition-colors">
					<CardContent class="p-4">
						<div class="flex items-start gap-4">
							{#if person.image}
								<img 
									src={`${pb.baseUrl}/api/files/people/${person.id}/${person.image}`}
									alt={person.name}
									class="w-16 h-16 rounded-full object-cover"
								/>
							{:else}
								<div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
									<Users class="h-8 w-8 text-muted-foreground" />
								</div>
							{/if}
							
							<div class="flex-1 space-y-2">
								<div class="flex items-center gap-2">
									<h3 class="font-semibold">{person.name}</h3>
									{#if person.relationship}
										<Badge variant="secondary" class="text-xs">
											{person.relationship}
										</Badge>
									{/if}
								</div>

								<div class="space-y-1 text-sm text-muted-foreground">
									{#if person.phone}
										<div class="flex items-center gap-2">
											<Phone class="h-3 w-3" />
											<span>{person.phone}</span>
										</div>
									{/if}
									{#if person.email}
										<div class="flex items-center gap-2">
											<Mail class="h-3 w-3" />
											<span>{person.email}</span>
										</div>
									{/if}
									{#if person.notes}
										<p class="text-xs mt-2">{person.notes}</p>
									{/if}
								</div>
								
								<div class="flex gap-2 mt-2">
								<Button variant="ghost" size="sm" onclick={() => openEditDialog(person)}>Edit</Button>
								<Button variant="ghost" size="sm" class="text-red-500 hover:text-red-600" onclick={() => handleDelete(person)}>Delete</Button>
							</div>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
