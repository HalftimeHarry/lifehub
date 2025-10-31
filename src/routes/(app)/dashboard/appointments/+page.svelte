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
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { pb } from '$lib/pb';
	import { currentUser } from '$lib/auth';
	import type { AppointmentExpanded, User, Person } from '$lib/types';
	import { Edit, Trash2, CheckCircle, XCircle } from 'lucide-svelte';

	let appointments = $state<AppointmentExpanded[]>([]);
	let users = $state<User[]>([]);
	let people = $state<Person[]>([]);
	let locations = $state<any[]>([]);
	let loading = $state(true);
	let dialogOpen = $state(false);
	let saving = $state(false);
	let editingAppointment: AppointmentExpanded | null = $state(null);

	// Form fields
	let title = $state('');
	let location = $state('');
	let start = $state(new Date().toISOString().slice(0, 16)); // Default to now
	let end = $state('');
	let notes = $state('');
	let phone = $state('+16262223107'); // Default to your WhatsApp number
	let notifyMinutes = $state(60); // Default to 60 minutes before
	let type = $state<'medical' | 'meeting' | 'personal' | 'other'>('medical');
	let forPeople = $state<string[]>([]); // People this appointment is for (multiple)
	let driver = $state(''); // Person who is driving
	let assignToSelf = $state(true); // Default to assigning to current user
	let selectedUsers = $state<string[]>([]); // Additional users to assign

	async function loadAppointments() {
		try {
			appointments = await pb.collection('appointments').getFullList<AppointmentExpanded>({
				sort: '-start',
				expand: 'for,assigned_to,created_by,driver'
			});
			console.log('[APPOINTMENTS] Loaded appointments:', appointments);
		} catch (error) {
			console.error('[APPOINTMENTS] Error fetching appointments:', error);
		}
	}

	function toLocalDateTimeString(dateStr: string) {
		const date = new Date(dateStr);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	function openEditDialog(appointment: AppointmentExpanded) {
		editingAppointment = appointment;
		title = appointment.title;
		location = appointment.location || '';
		start = toLocalDateTimeString(appointment.start);
		end = appointment.end ? toLocalDateTimeString(appointment.end) : '';
		notes = appointment.notes || '';
		phone = appointment.phone || '+16262223107';
		notifyMinutes = appointment.notify_offset_minutes || 60;
		type = appointment.type || 'medical';
		forPeople = Array.isArray(appointment.for) ? appointment.for : [];
		driver = appointment.driver || '';
		assignToSelf = Array.isArray(appointment.assigned_to) && appointment.assigned_to.includes(pb.authStore.model?.id || '');
		selectedUsers = Array.isArray(appointment.assigned_to) 
			? appointment.assigned_to.filter(id => id !== pb.authStore.model?.id)
			: [];
		dialogOpen = true;
	}

	function resetForm() {
		editingAppointment = null;
		title = '';
		location = '';
		start = new Date().toISOString().slice(0, 16); // Reset to current time
		end = '';
		notes = '';
		phone = '+16262223107'; // Reset to default
		notifyMinutes = 60;
		type = 'medical';
		forPeople = [];
		driver = '';
		assignToSelf = true;
		selectedUsers = [];
	}

	async function handleDelete(appointment: AppointmentExpanded) {
		if (!confirm(`Delete appointment "${appointment.title}"?`)) return;
		
		try {
			await pb.collection('appointments').delete(appointment.id);
			appointments = appointments.filter(a => a.id !== appointment.id);
		} catch (error) {
			console.error('[APPOINTMENTS] Error deleting appointment:', error);
			await loadAppointments();
		}
	}

	async function toggleCompleted(appointment: AppointmentExpanded) {
		try {
			const newActiveState = appointment.active === false ? true : false;
			
			await pb.collection('appointments').update(appointment.id, {
				active: newActiveState
			});
			
			await loadAppointments();
		} catch (error) {
			console.error('[APPOINTMENTS] Error toggling completion:', error);
			alert('Failed to update appointment status');
		}
	}

	onMount(async () => {
		try {
			// Fetch users for assignment
			console.log('[APPOINTMENTS] Current user ID:', pb.authStore.model?.id);
			console.log('[APPOINTMENTS] Current user email:', pb.authStore.model?.email);
			
			try {
				users = await pb.collection('users').getFullList<User>({
					sort: 'email'
				});
				console.log('[APPOINTMENTS] Successfully fetched users via getFullList');
			} catch (error) {
				console.log('[APPOINTMENTS] getFullList failed, using hardcoded fallback:', error);
				// Fallback: hardcode users if API rules prevent fetching
				const currentUserId = pb.authStore.model?.id;
				// Fetch both users individually
				try {
					console.log('[APPOINTMENTS] Fetching user 1: lxja8peujhev9cf');
					const user1 = await pb.collection('users').getOne<User>('lxja8peujhev9cf');
					console.log('[APPOINTMENTS] User 1:', user1);
					
					console.log('[APPOINTMENTS] Fetching user 2: 6pn9nvvt8phxvq6');
					const user2 = await pb.collection('users').getOne<User>('6pn9nvvt8phxvq6');
					console.log('[APPOINTMENTS] User 2:', user2);
					
					users = [user1, user2];
				} catch (e) {
					console.error('[APPOINTMENTS] Failed to fetch hardcoded users:', e);
					users = [];
				}
			}
			console.log('[APPOINTMENTS] Final users array:', users);
			console.log('[APPOINTMENTS] Users length:', users.length);

			// Fetch people for "For" field
			try {
				people = await pb.collection('people').getFullList<Person>({
					sort: 'name'
				});
				console.log('[APPOINTMENTS] Loaded people:', people);
				console.log('[APPOINTMENTS] People count:', people.length);
			} catch (error) {
				console.error('[APPOINTMENTS] Failed to fetch people:', error);
				people = [];
			}

			// Fetch locations
			try {
				locations = await pb.collection('locations').getFullList({
					sort: 'name'
				});
				console.log('[APPOINTMENTS] Loaded locations:', locations);
			} catch (error) {
				console.error('[APPOINTMENTS] Failed to fetch locations:', error);
				locations = [];
			}
			
			// Fetch appointments from PocketBase with expanded relations
			await loadAppointments();
			loading = false;
		} catch (error) {
			console.error('Error fetching appointments:', error);
			loading = false;
		}
	});

	async function handleSubmit() {
		saving = true;
		try {
			// Convert datetime-local format to ISO 8601
			const startDate = new Date(start);
			const endDate = end ? new Date(end) : null;

			// Build assigned users list
			const assignedUsers = [...selectedUsers];
			if (assignToSelf && pb.authStore.model?.id && !assignedUsers.includes(pb.authStore.model.id)) {
				assignedUsers.push(pb.authStore.model.id);
			}

			// Validate required fields
			if (forPeople.length === 0) {
				console.error('[APPOINTMENTS] "For" field is required - please select at least one person');
				alert('Please select at least one person for this appointment');
				return;
			}

			const data = {
				title,
				location: location ? String(location) : undefined,
				start: startDate.toISOString(),
				end: endDate ? endDate.toISOString() : undefined,
				notes: notes || undefined,
				phone: phone || undefined,
				notify_offset_minutes: notifyMinutes,
				type,
				for: forPeople,
				driver: driver ? String(driver) : undefined,
				assigned_to: assignedUsers,
				created_by: pb.authStore.model?.id,
				active: true
			};

			console.log('[APPOINTMENTS] Creating/updating appointment with data:', data);
			console.log('[APPOINTMENTS] Location value:', location);
			console.log('[APPOINTMENTS] Location type:', typeof location);
			console.log('[APPOINTMENTS] ForPeople value:', forPeople);
			console.log('[APPOINTMENTS] ForPeople type:', typeof forPeople);
			
			if (editingAppointment) {
				// Update existing appointment
				await pb.collection('appointments').update(editingAppointment.id, data);
			} else {
				// Create new appointment
				await pb.collection('appointments').create(data);
			}
			
			resetForm();
			dialogOpen = false;
			
			// Refresh appointments list
			await loadAppointments();
		} catch (error) {
			console.error('Error creating appointment:', error);
			alert('Failed to create appointment');
		} finally {
			saving = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Appointments</h1>
			<p class="text-muted-foreground">Medical, meetings, and personal events</p>
		</div>
		
		<Dialog bind:open={dialogOpen} onOpenChange={(open) => { if (open) resetForm(); }}>
			<DialogTrigger asChild>
				{#snippet child({ props })}
					<Button {...props}>Add Appointment</Button>
				{/snippet}
			</DialogTrigger>
			<DialogContent class="max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0">
				<div class="px-6 pt-6 pb-4 border-b">
					<DialogHeader>
						<DialogTitle>{editingAppointment ? 'Edit Appointment' : 'Create Appointment'}</DialogTitle>
						<DialogDescription>{editingAppointment ? 'Update appointment details' : 'Add a new appointment to your calendar'}</DialogDescription>
					</DialogHeader>
				</div>
				
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="flex flex-col flex-1 overflow-hidden min-h-0">
					<div class="space-y-4 overflow-y-auto px-6 py-4 max-h-[calc(90vh-180px)]" style="-webkit-overflow-scrolling: touch;">
					<div class="space-y-2">
						<Label for="title">Title</Label>
						<Input
							id="title"
							bind:value={title}
							placeholder="Doctor's appointment"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="location">Location (Optional)</Label>
						<Select bind:value={location}>
							<SelectTrigger>
								{#if location}
									{locations.find(l => l.id === location)?.name || location}
								{:else}
									Select location
								{/if}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">None</SelectItem>
								{#each locations as loc}
									<SelectItem value={loc.id}>{loc.name}{#if loc.address} - {loc.address}{/if}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
						<Input
							bind:value={location}
							placeholder="Or type custom location"
							class="mt-2 text-sm"
						/>
					</div>

					<div class="space-y-2">
						<Label for="start">Start Date & Time</Label>
						<Input
							id="start"
							type="datetime-local"
							bind:value={start}
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="end">End Date & Time (Optional)</Label>
						<Input
							id="end"
							type="datetime-local"
							bind:value={end}
						/>
					</div>

					<div class="space-y-2">
						<Label for="type">Type</Label>
						<Select bind:value={type}>
							<SelectTrigger>
								{type || 'Select type'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="medical">Medical</SelectItem>
								<SelectItem value="meeting">Meeting</SelectItem>
								<SelectItem value="personal">Personal</SelectItem>
								<SelectItem value="other">Other</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div class="space-y-2">
						<Label for="for">For (Required)</Label>
			<div class="space-y-2">
				{#each people as person}
					<div class="flex items-center space-x-2">
						<Checkbox
							id={`for-${person.id}`}
							checked={forPeople.includes(person.id)}
							onCheckedChange={(checked) => {
								if (checked) {
									forPeople = [...forPeople, person.id];
								} else {
									forPeople = forPeople.filter(id => id !== person.id);
								}
							}}
						/>
						<Label for={`for-${person.id}`} class="text-sm font-normal cursor-pointer">
							{person.name}
						</Label>
					</div>
				{/each}
				{#if people.length === 0}
					<p class="text-sm text-muted-foreground">No people added yet. Add people first.</p>
				{/if}
			</div>
		</div>

		<div class="space-y-2">
			<Label for="driver">Driver (Optional)</Label>
			<Select bind:value={driver}>
				<SelectTrigger>
					{driver ? people.find(p => p.id === driver)?.name : 'Select driver'}
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">None</SelectItem>
					{#each people as person}
						<SelectItem value={person.id}>{person.name}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
		</div>

		<div class="space-y-2">
			<Label for="notes">Notes (Optional)</Label>
						<Textarea
							id="notes"
							bind:value={notes}
							placeholder="Additional details..."
							rows={3}
						/>
					</div>


				<div class="space-y-2">
					<Label for="notifyMinutes">Remind Me</Label>
					<div class="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="icon"
							onclick={() => {
								if (notifyMinutes > 5) notifyMinutes = Math.max(5, notifyMinutes - 15);
							}}
						>
							-
						</Button>
						<Input
							id="notifyMinutes"
							type="number"
							bind:value={notifyMinutes}
							min="5"
							max="10080"
							class="text-center"
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onclick={() => {
								notifyMinutes = Math.min(10080, notifyMinutes + 15);
							}}
						>
							+
						</Button>
						<span class="text-sm text-muted-foreground whitespace-nowrap">minutes before</span>
					</div>
				</div>




					<div class="space-y-3">
						<div class="flex items-center space-x-2">
							<Checkbox id="assign" bind:checked={assignToSelf} />
							<Label for="assign" class="text-sm font-normal cursor-pointer">
								Assign to me ({$currentUser?.email})
							</Label>
						</div>

						<div class="flex items-center space-x-2">
							<Checkbox 
								id="assign-others" 
								checked={selectedUsers.length > 0}
								onCheckedChange={(checked) => {
									if (checked) {
										// Add all other users
										selectedUsers = users
											.filter(u => u.id !== pb.authStore.model?.id)
											.map(u => u.id);
									} else {
										// Clear all other users
										selectedUsers = [];
									}
								}}
							/>
							<Label for="assign-others" class="text-sm font-normal cursor-pointer">
								Also assign to Dustin
							</Label>
						</div>
					</div>
					</div>

					<div class="flex gap-2 justify-end px-6 py-4 border-t bg-background shrink-0">
						<Button type="button" variant="outline" onclick={() => { dialogOpen = false; resetForm(); }}>
							Cancel
						</Button>
						<Button type="submit" disabled={saving}>
							{#if saving}
								{editingAppointment ? 'Updating...' : 'Creating...'}
							{:else}
								{editingAppointment ? 'Update Appointment' : 'Create Appointment'}
							{/if}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
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
		<Card>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-muted/50 border-b">
							<tr>
								<th class="text-left p-3 text-sm font-medium">People</th>
								<th class="text-left p-3 text-sm font-medium">Title</th>
								<th class="text-left p-3 text-sm font-medium">Type</th>
								<th class="text-left p-3 text-sm font-medium">Date & Time</th>
								<th class="text-left p-3 text-sm font-medium">Location</th>
								<th class="text-left p-3 text-sm font-medium">Driver</th>
								<th class="text-left p-3 text-sm font-medium">Status</th>
								<th class="text-right p-3 text-sm font-medium">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each appointments as appointment, index (appointment.id)}
								<tr class="{index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-accent/50 transition-colors">
									<!-- People -->
									<td class="p-3">
										{#if appointment.expand?.for}
											<div class="flex -space-x-2">
												{#each Array.isArray(appointment.expand.for) ? appointment.expand.for : [appointment.expand.for] as person}
													{#if person.image}
														<img 
															src={`${pb.baseUrl}/api/files/people/${person.id}/${person.image}`}
															alt={person.name}
															class="w-8 h-8 rounded-full object-cover border-2 border-background"
															title={person.name}
														/>
													{:else}
														<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background" title={person.name}>
															<span class="text-xs font-medium">{person.name.charAt(0)}</span>
														</div>
													{/if}
												{/each}
											</div>
										{:else}
											<span class="text-xs text-muted-foreground">-</span>
										{/if}
									</td>
									
									<!-- Title -->
									<td class="p-3">
										<div class="font-medium">{appointment.title}</div>
										{#if appointment.notes}
											<div class="text-xs text-muted-foreground line-clamp-1">{appointment.notes}</div>
										{/if}
									</td>
									
									<!-- Type -->
									<td class="p-3">
										{#if appointment.type}
											<span class="text-xs px-2 py-1 rounded bg-primary/10 text-primary capitalize">
												{appointment.type}
											</span>
										{:else}
											<span class="text-xs text-muted-foreground">-</span>
										{/if}
									</td>
									
									<!-- Date & Time -->
									<td class="p-3">
										<div class="text-sm">{new Date(appointment.start).toLocaleDateString()}</div>
										<div class="text-xs text-muted-foreground">{new Date(appointment.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
										{#if appointment.end}
											<div class="text-xs text-muted-foreground">to {new Date(appointment.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
										{/if}
									</td>
									
									<!-- Location -->
									<td class="p-3">
										{#if appointment.expand?.location}
											<div class="text-sm">{appointment.expand.location.name}</div>
										{:else if appointment.location}
											<div class="text-sm">{appointment.location}</div>
										{:else}
											<span class="text-xs text-muted-foreground">-</span>
										{/if}
									</td>
									
									<!-- Driver -->
									<td class="p-3">
										{#if appointment.expand?.driver}
											<div class="flex items-center gap-2">
												{#if appointment.expand.driver.image}
													<img 
														src={`${pb.baseUrl}/api/files/people/${appointment.expand.driver.id}/${appointment.expand.driver.image}`}
														alt={appointment.expand.driver.name}
														class="w-6 h-6 rounded-full object-cover"
													/>
												{/if}
												<span class="text-sm">{appointment.expand.driver.name}</span>
											</div>
										{:else}
											<span class="text-xs text-muted-foreground">-</span>
										{/if}
									</td>
									
									<!-- Status -->
									<td class="p-3">
										{#if appointment.active === false}
											<span class="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
												Completed
											</span>
										{:else}
											<span class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
												Active
											</span>
										{/if}
									</td>
									
									<!-- Actions -->
									<td class="p-3">
										<div class="flex gap-1 justify-end">
											<Button 
												variant="ghost" 
												size="icon"
												class="h-8 w-8"
												onclick={() => openEditDialog(appointment)}
												title="Edit"
											>
												<Edit class="h-4 w-4" />
											</Button>
											<Button 
												variant="ghost" 
												size="icon"
												class="h-8 w-8 {appointment.active === false ? 'text-green-500 hover:text-green-600' : 'text-blue-500 hover:text-blue-600'}"
												onclick={() => toggleCompleted(appointment)}
												title={appointment.active === false ? 'Mark Active' : 'Mark Completed'}
											>
												{#if appointment.active === false}
													<XCircle class="h-4 w-4" />
												{:else}
													<CheckCircle class="h-4 w-4" />
												{/if}
											</Button>
											<Button 
												variant="ghost" 
												size="icon"
												class="h-8 w-8 text-red-500 hover:text-red-600"
												onclick={() => handleDelete(appointment)}
												title="Delete"
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
