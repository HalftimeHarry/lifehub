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
	import { toast } from 'svelte-sonner';

	let appointments = $state<AppointmentExpanded[]>([]);
	let users = $state<User[]>([]);
	let people = $state<Person[]>([]);
	let locations = $state<any[]>([]);
	let loading = $state(true);
	let dialogOpen = $state(false);
	let saving = $state(false);
	let editingAppointment: AppointmentExpanded | null = $state(null);
	let deleteDialogOpen = $state(false);
	let appointmentToDelete: AppointmentExpanded | null = $state(null);

	// Form fields
	let title = $state('');
	let appointmentType = $state('doctor'); // New: appointment type dropdown
	let location = $state('');
	let customLocation = $state(''); // Separate field for custom location text
	let autoGenerateTitle = $state(true); // Control whether to auto-generate title
	let start = $state(new Date().toISOString().slice(0, 16)); // Default to now
	let end = $state('');
	let customDuration = $state(false); // Toggle for custom end time
	let notes = $state('');
	let email = $state(''); // Email for notifications
	let notifyMinutes = $state(60); // Default to 60 minutes before
	let forPeople = $state<string[]>([]); // People this appointment is for (multiple)
	let driver = $state(''); // Person who is driving
	let assignToSelf = $state(true); // Default to assigning to current user
	let selectedUsers = $state<string[]>([]); // Additional users to assign

	// Appointment type options
	const appointmentTypes = [
		{ value: 'doctor', label: 'Doctor', icon: '🏥' },
		{ value: 'dentist', label: 'Dentist', icon: '🦷' },
		{ value: 'lawyer', label: 'Lawyer', icon: '⚖️' },
		{ value: 'cpa', label: 'CPA/Accountant', icon: '💼' },
		{ value: 'school', label: 'School', icon: '🎓' },
		{ value: 'office', label: 'Office Visit', icon: '🏢' },
		{ value: 'other', label: 'Other', icon: '📅' }
	];

	// Auto-generate title when appointment type, people, or location changes
	$effect(() => {
		// Only auto-generate if enabled (disabled when editing existing appointments)
		if (!autoGenerateTitle) return;
		
		const typeLabel = appointmentTypes.find(t => t.value === appointmentType)?.label || appointmentType;
		
		// Get people names
		let peopleNames = '';
		if (forPeople.length > 0) {
			const names = forPeople
				.map(personId => people.find(p => p.id === personId)?.name)
				.filter(Boolean)
				.join(', ');
			peopleNames = names;
		}
		
		// Determine which location to use
		let locationName = '';
		if (customLocation) {
			// Use custom typed location
			locationName = customLocation;
		} else if (location) {
			// Use selected location from dropdown
			locationName = locations.find(l => l.id === location)?.name || '';
		}
		
		console.log('[TITLE] appointmentType:', appointmentType);
		console.log('[TITLE] peopleNames:', peopleNames);
		console.log('[TITLE] location:', location);
		console.log('[TITLE] customLocation:', customLocation);
		console.log('[TITLE] locationName:', locationName);
		console.log('[TITLE] locations:', locations);
		
		// Build title: "Type (Person1, Person2 at Location)"
		if (peopleNames && locationName) {
			title = `${typeLabel} (${peopleNames} at ${locationName})`;
		} else if (peopleNames) {
			title = `${typeLabel} (${peopleNames})`;
		} else if (locationName) {
			title = `${typeLabel} at ${locationName}`;
		} else {
			title = typeLabel;
		}
		
		console.log('[TITLE] Generated title:', title);
	});

	// Auto-calculate end time (1 hour after start) unless custom duration is enabled
	$effect(() => {
		if (start && !customDuration) {
			const startDate = new Date(start);
			if (!isNaN(startDate.getTime())) {
				const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
				end = endDate.toISOString().slice(0, 16);
			}
		}
	});

	async function loadAppointments() {
		try {
			appointments = await pb.collection('appointments').getFullList<AppointmentExpanded>({
				sort: '-start',
				expand: 'for,assigned_to,created_by,driver,location'
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
		autoGenerateTitle = false; // Don't auto-generate when editing
		title = appointment.title;
		appointmentType = 'other'; // Default to other when editing
		
		// Check if location is an ID or custom text
		const locationObj = locations.find(l => l.id === appointment.location);
		if (locationObj) {
			location = appointment.location || '';
			customLocation = '';
		} else {
			location = '';
			customLocation = appointment.location || '';
		}
		
		start = toLocalDateTimeString(appointment.start);
		end = appointment.end ? toLocalDateTimeString(appointment.end) : '';
		customDuration = !!appointment.end; // Enable custom duration if end time exists
		notes = appointment.notes || '';
		email = appointment.phone || ''; // 'phone' field stores email now
		notifyMinutes = appointment.notify_offset_minutes || 60;
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
		autoGenerateTitle = true; // Re-enable auto-generation for new appointments
		title = '';
		appointmentType = 'doctor';
		location = '';
		customLocation = '';
		start = new Date().toISOString().slice(0, 16); // Reset to current time
		end = '';
		customDuration = false; // Reset to auto-calculate
		notes = '';
		email = ''; // Reset to empty
		notifyMinutes = 60;
		forPeople = [];
		driver = '';
		assignToSelf = true;
		selectedUsers = [];
	}

	function openDeleteDialog(appointment: AppointmentExpanded) {
		appointmentToDelete = appointment;
		deleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (!appointmentToDelete) return;
		
		try {
			await pb.collection('appointments').delete(appointmentToDelete.id);
			appointments = appointments.filter(a => a.id !== appointmentToDelete.id);
			toast.success('Appointment deleted successfully');
			deleteDialogOpen = false;
			appointmentToDelete = null;
		} catch (error) {
			console.error('[APPOINTMENTS] Error deleting appointment:', error);
			toast.error('Failed to delete appointment');
			await loadAppointments();
		}
	}

	async function toggleCompleted(appointment: AppointmentExpanded) {
		try {
			const newActiveState = appointment.active === false ? true : false;
			
			await pb.collection('appointments').update(appointment.id, {
				active: newActiveState
			});
			
			toast.success(newActiveState ? 'Appointment marked as active' : 'Appointment marked as completed');
			await loadAppointments();
		} catch (error) {
			console.error('[APPOINTMENTS] Error toggling completion:', error);
			toast.error('Failed to update appointment status');
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
			// Validate required fields first
			if (!title || !start) {
				toast.error('Please fill in the title and start date/time');
				saving = false;
				return;
			}

			if (forPeople.length === 0) {
				console.error('[APPOINTMENTS] "For" field is required - please select at least one person');
				toast.error('Please select at least one person for this appointment');
				saving = false;
				return;
			}

			// Convert datetime-local format to ISO 8601
			const startDate = new Date(start);
			const endDate = end ? new Date(end) : null;

			// Validate dates
			if (isNaN(startDate.getTime())) {
				toast.error('Invalid start date/time');
				saving = false;
				return;
			}

			if (endDate && isNaN(endDate.getTime())) {
				toast.error('Invalid end date/time');
				saving = false;
				return;
			}

			// Build assigned users list
			const assignedUsers = [...selectedUsers];
			if (assignToSelf && pb.authStore.model?.id && !assignedUsers.includes(pb.authStore.model.id)) {
				assignedUsers.push(pb.authStore.model.id);
			}

			// Determine final location value (prefer custom location over dropdown)
			const finalLocation = customLocation || location || undefined;

			const data = {
				title,
				location: finalLocation ? String(finalLocation) : undefined,
				start: startDate.toISOString(),
				end: endDate ? endDate.toISOString() : undefined,
				notes: notes || undefined,
				phone: email || undefined, // Store email in 'phone' field for backward compatibility
				notify_offset_minutes: notifyMinutes,
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
				toast.success('Appointment updated successfully');
			} else {
				// Create new appointment
				await pb.collection('appointments').create(data);
				toast.success('Appointment created successfully');
			}
			
			resetForm();
			dialogOpen = false;
			
			// Refresh appointments list
			await loadAppointments();
		} catch (error) {
			console.error('Error creating appointment:', error);
			console.error('Form values:', { title, start, end, forPeople, location });
			toast.error(`Failed to create appointment: ${error.message || error}`);
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
					<div class="space-y-3">
						<Label>Appointment Type</Label>
						<div class="grid grid-cols-2 gap-3">
							{#each appointmentTypes as type}
								<label 
									class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent {appointmentType === type.value ? 'border-primary bg-primary/5' : 'border-input'}"
								>
									<input
										type="radio"
										name="appointmentType"
										value={type.value}
										bind:group={appointmentType}
										class="sr-only"
									/>
									<span class="text-xl">{type.icon}</span>
									<span class="text-sm font-medium">{type.label}</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="space-y-3">
						<Label>Location (Optional)</Label>
						<div class="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
							<label 
								class="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors hover:bg-accent {!location && !customLocation ? 'bg-primary/5 border border-primary' : ''}"
							>
								<input
									type="radio"
									name="location"
									value=""
									bind:group={location}
									onchange={() => customLocation = ''}
									class="sr-only"
								/>
								<span class="text-sm font-medium text-muted-foreground">None</span>
							</label>
							{#each locations as loc}
								<label 
									class="flex flex-col gap-1 p-2 rounded cursor-pointer transition-colors hover:bg-accent {location === loc.id ? 'bg-primary/5 border border-primary' : ''}"
								>
									<input
										type="radio"
										name="location"
										value={loc.id}
										bind:group={location}
										onchange={() => customLocation = ''}
										class="sr-only"
									/>
									<span class="text-sm font-medium">{loc.name}</span>
									{#if loc.address}
										<span class="text-xs text-muted-foreground">{loc.address}</span>
									{/if}
								</label>
							{/each}
						</div>
						<div class="space-y-1">
							<Label for="customLocation" class="text-xs text-muted-foreground">Or type custom location</Label>
							<Input
								id="customLocation"
								bind:value={customLocation}
								placeholder="Custom location name"
								class="text-sm"
								oninput={() => { if (customLocation) location = ''; }}
							/>
						</div>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label for="title">Title</Label>
							{#if !autoGenerateTitle}
								<Button 
									type="button" 
									variant="ghost" 
									size="sm" 
									class="h-7 text-xs"
									onclick={() => autoGenerateTitle = true}
								>
									Regenerate
								</Button>
							{/if}
						</div>
						<Input
							id="title"
							bind:value={title}
							placeholder="Will be generated from type and location"
							class={autoGenerateTitle ? 'bg-muted' : ''}
							readonly={autoGenerateTitle}
						/>
						<p class="text-xs text-muted-foreground">
							{autoGenerateTitle ? 'Title is automatically generated from type, people, and location.' : 'Click Regenerate to auto-generate the title.'}
						</p>
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
						<div class="flex items-center justify-between">
							<Label for="end">End Date & Time</Label>
							<div class="flex items-center gap-2">
								<Checkbox 
									id="customDuration" 
									bind:checked={customDuration}
								/>
								<Label for="customDuration" class="text-sm font-normal cursor-pointer">Custom duration</Label>
							</div>
						</div>
						<Input
							id="end"
							type="datetime-local"
							bind:value={end}
							disabled={!customDuration}
							class={!customDuration ? 'bg-muted' : ''}
						/>
						{#if !customDuration}
							<p class="text-xs text-muted-foreground">Automatically set to 1 hour after start time</p>
						{/if}
					</div>

					<div class="space-y-3">
						<Label>For (Required)</Label>
						<div class="space-y-2 border rounded-lg p-3">
							{#each people as person}
								<label 
									class="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors hover:bg-accent"
								>
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
									<span class="text-sm font-medium">{person.name}</span>
								</label>
							{/each}
							{#if people.length === 0}
								<p class="text-sm text-muted-foreground">No people added yet. Add people first.</p>
							{/if}
						</div>
					</div>

		<div class="space-y-3">
			<Label>Driver (Optional)</Label>
			<div class="space-y-2 border rounded-lg p-3">
				{#each people as person}
					<label 
						class="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors hover:bg-accent"
					>
						<Checkbox
							id={`driver-${person.id}`}
							checked={driver === person.id}
							onCheckedChange={(checked) => {
								if (checked) {
									driver = person.id;
								} else {
									driver = '';
								}
							}}
						/>
						<span class="text-sm font-medium">{person.name}</span>
					</label>
				{/each}
			</div>
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

				<div class="space-y-2">
					<Label for="email">Email for Reminders (Optional)</Label>
					<Input
						id="email"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
					/>
					<p class="text-xs text-muted-foreground">
						Leave empty to skip email reminders
					</p>
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
								<th class="text-left p-2 md:p-3 text-xs md:text-sm font-medium">People</th>
								<th class="text-left p-2 md:p-3 text-xs md:text-sm font-medium">Title</th>
								<th class="text-left p-2 md:p-3 text-xs md:text-sm font-medium">Date & Time</th>
								<th class="text-left p-2 md:p-3 text-xs md:text-sm font-medium hidden md:table-cell">Location</th>
								<th class="text-left p-2 md:p-3 text-xs md:text-sm font-medium hidden md:table-cell">Driver</th>
								<th class="text-left p-2 md:p-3 text-xs md:text-sm font-medium hidden md:table-cell">Status</th>
								<th class="text-right p-2 md:p-3 text-xs md:text-sm font-medium">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each appointments as appointment, index (appointment.id)}
								<tr class="{index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-accent/50 transition-colors">
									<!-- People -->
									<td class="p-2 md:p-3">
										{#if appointment.expand?.for}
											<div class="flex -space-x-2">
												{#each Array.isArray(appointment.expand.for) ? appointment.expand.for : [appointment.expand.for] as person}
													{#if person.image}
														<img 
															src={`${pb.baseUrl}/api/files/people/${person.id}/${person.image}`}
															alt={person.name}
															class="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover border-2 border-background"
															title={person.name}
														/>
													{:else}
														<div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background" title={person.name}>
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
									<td class="p-2 md:p-3">
										<div class="font-medium text-sm md:text-base">{appointment.title}</div>
										{#if appointment.notes}
											<div class="text-xs text-muted-foreground line-clamp-1">{appointment.notes}</div>
										{/if}
									</td>
									
							<!-- Date & Time -->
									<td class="p-2 md:p-3">
										<div class="text-xs md:text-sm">{new Date(appointment.start).toLocaleDateString()}</div>
										<div class="text-xs text-muted-foreground">{new Date(appointment.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
										{#if appointment.end}
											<div class="text-xs text-muted-foreground">to {new Date(appointment.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
										{/if}
									</td>
									
									<!-- Location (hidden on mobile) -->
									<td class="p-2 md:p-3 hidden md:table-cell">
										{#if appointment.expand?.location}
											<div class="text-sm">{appointment.expand.location.name}</div>
										{:else if appointment.location}
											{@const locationObj = locations.find(l => l.id === appointment.location)}
											{#if locationObj}
												<div class="text-sm">{locationObj.name}</div>
											{:else}
												<div class="text-sm">{appointment.location}</div>
											{/if}
										{:else}
											<span class="text-xs text-muted-foreground">-</span>
										{/if}
									</td>
									
									<!-- Driver (hidden on mobile) -->
									<td class="p-2 md:p-3 hidden md:table-cell">
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
									
									<!-- Status (hidden on mobile) -->
									<td class="p-2 md:p-3 hidden md:table-cell">
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
									<td class="p-2 md:p-3">
										<div class="flex gap-1 justify-end">
											<Button 
												variant="ghost" 
												size="icon"
												class="h-7 w-7 md:h-8 md:w-8"
												onclick={() => openEditDialog(appointment)}
												title="Edit"
											>
												<Edit class="h-3.5 w-3.5 md:h-4 md:w-4" />
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
												class="h-7 w-7 md:h-8 md:w-8 text-red-500 hover:text-red-600"
												onclick={() => openDeleteDialog(appointment)}
												title="Delete"
											>
												<Trash2 class="h-3.5 w-3.5 md:h-4 md:w-4" />
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

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Appointment</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete "{appointmentToDelete?.title}"? This action cannot be undone.
			</DialogDescription>
		</DialogHeader>
		<div class="flex justify-end gap-2 mt-4">
			<Button variant="outline" onclick={() => { deleteDialogOpen = false; appointmentToDelete = null; }}>
				Cancel
			</Button>
			<Button variant="destructive" onclick={confirmDelete}>
				Delete
			</Button>
		</div>
	</DialogContent>
</Dialog>
