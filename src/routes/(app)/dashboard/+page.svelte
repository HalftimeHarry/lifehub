<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { currentUser } from '$lib/auth';
	import { pb } from '$lib/pb';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Calendar, Briefcase, Plane, CheckSquare, Users, Plus, MapPin, Receipt, Clock, Bell, BellOff, Car } from 'lucide-svelte';
	import type { AppointmentExpanded, Task, TripExpanded, ShiftExpanded, Person } from '$lib/types';

	const quickActions = [
		{ href: '/dashboard/appointments', label: 'Appointments', icon: Calendar, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950' },
		{ href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase, color: 'text-indigo-500', bgColor: 'bg-indigo-50 dark:bg-indigo-950' },
		{ href: '/dashboard/shifts', label: 'Shifts', icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950' },
		{ href: '/dashboard/people', label: 'People', icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-950' },
		{ href: '/dashboard/locations', label: 'Locations', icon: MapPin, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950' },
		{ href: '/dashboard/trips', label: 'Trips', icon: Plane, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-950' },
		{ href: '/dashboard/expenses', label: 'Expenses', icon: Receipt, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-950' },
		{ href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950' }
	];

	let appointments = $state<AppointmentExpanded[]>([]);
	let tasks = $state<Task[]>([]);
	let trips = $state<TripExpanded[]>([]);
	let shifts = $state<ShiftExpanded[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	
	// Filter state
	let showAppointments = $state(true);
	let showTasks = $state(false);
	let showTrips = $state(false);
	let showShifts = $state(false);
	let showOnlyWithReminders = $state(false);
	let showCompleted = $state(false); // Toggle between active and completed
	
	// Phone number dialog state
	let phoneDialogOpen = $state(false);
	let phoneNumber = $state('');
	let phoneError = $state('');
	let pendingReminderItem: { collection: string; id: string } | null = $state(null);

	onMount(async () => {
		console.log('[Dashboard] Component mounted, browser:', browser);
		if (browser) {
			console.log('[Dashboard] Loading data...');
			await loadUpcoming();
			console.log('[Dashboard] Data loading complete');
		} else {
			console.log('[Dashboard] Skipping data load (SSR)');
		}
	});

	async function loadUpcoming() {
		try {
			loading = true;
			error = null;
			// Show items from 24 hours ago to future
			const yesterday = new Date();
			yesterday.setHours(yesterday.getHours() - 24);
			const cutoffDate = yesterday.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '.000Z');
			
			console.log('[Dashboard] Loading items from past 24 hours:', cutoffDate);
			console.log('[Dashboard] Current date:', new Date().toString());
			
			// Fetch appointments (all if showing completed, otherwise active only from past 24 hours)
			try {
				const appointmentFilter = showCompleted 
					? `active = false`
					: `start >= "${cutoffDate}"`;
				appointments = await pb.collection('appointments').getFullList<AppointmentExpanded>({
					filter: appointmentFilter,
					sort: '-start',
					expand: 'location,for,driver'
				});
				console.log('[Dashboard] Loaded appointments:', appointments.length);
			} catch (err) {
				console.error('[Dashboard] Error loading appointments:', err);
				appointments = [];
			}

			// Fetch tasks
			try {
				const taskFilter = showCompleted 
					? `active = false`
					: `due >= "${cutoffDate}" && done = false`;
				tasks = await pb.collection('tasks').getFullList<Task>({
					filter: taskFilter,
					sort: '-due'
				});
				console.log('[Dashboard] Loaded tasks:', tasks.length);
			} catch (err) {
				console.error('[Dashboard] Error loading tasks:', err);
				tasks = [];
			}

			// Fetch upcoming trips (from past 24 hours)
			try {
				trips = await pb.collection('trips').getFullList<TripExpanded>({
					filter: `depart_at >= "${cutoffDate}"`,
					sort: 'depart_at',
					expand: 'assigned_to'
				});
				console.log('[Dashboard] Loaded trips (past 24h + future):', trips.length);
			} catch (err) {
				console.error('[Dashboard] Error loading trips:', err);
				trips = [];
			}

			// Fetch shifts
			try {
				const shiftFilter = showCompleted 
					? `active = false`
					: `start >= "${cutoffDate}"`;
				shifts = await pb.collection('shifts').getFullList<ShiftExpanded>({
					filter: shiftFilter,
					sort: '-start',
					expand: 'job,assigned_to'
				});
				console.log('[Dashboard] Loaded shifts (past 24h + future):', shifts.length);
			} catch (err) {
				console.error('[Dashboard] Error loading shifts:', err);
				shifts = [];
			}
			
			console.log('[Dashboard] All data loaded successfully');
		} catch (err) {
			console.error('[Dashboard] Error loading upcoming items:', err);
			error = err instanceof Error ? err.message : 'Failed to load upcoming items';
		} finally {
			loading = false;
			console.log('[Dashboard] Loading complete, loading state:', loading);
		}
	}

	async function toggleSMSReminder(collection: string, id: string, currentPhone: string | null) {
		try {
			console.log('[Dashboard] Toggle SMS - Current phone:', currentPhone);
			console.log('[Dashboard] User phone:', $currentUser?.phone);
			
			// If disabling reminder
			if (currentPhone) {
				console.log('[Dashboard] Disabling SMS reminder');
				await pb.collection(collection).update(id, { phone: null });
				console.log('[Dashboard] SMS reminder disabled');
				await loadUpcoming();
				return;
			}
			
			// If enabling reminder, use user's phone or ask for one
			if ($currentUser?.phone) {
				console.log('[Dashboard] Using user phone:', $currentUser.phone);
				await pb.collection(collection).update(id, { phone: $currentUser.phone });
				console.log('[Dashboard] SMS reminder enabled');
				await loadUpcoming();
			} else {
				// Show dialog to get phone number
				console.log('[Dashboard] No user phone, showing dialog');
				pendingReminderItem = { collection, id };
				phoneNumber = '';
				phoneError = '';
				phoneDialogOpen = true;
			}
		} catch (err) {
			console.error('[Dashboard] Error toggling SMS reminder:', err);
			error = err instanceof Error ? err.message : 'Failed to toggle SMS reminder';
			// Reload to refresh the list in case the item was deleted
			await loadUpcoming();
		}
	}
	
	async function savePhoneNumber() {
		if (!pendingReminderItem) return;
		
		// Clear previous error
		phoneError = '';
		
		// Trim whitespace
		const trimmedPhone = phoneNumber.trim();
		console.log('[Dashboard] Validating phone:', trimmedPhone, 'Length:', trimmedPhone.length);
		
		// Validate E.164 format
		if (!trimmedPhone.match(/^\+[1-9]\d{1,14}$/)) {
			phoneError = 'Invalid phone number format. Please use E.164 format: +1234567890';
			console.log('[Dashboard] Phone validation failed');
			return;
		}
		
		try {
			console.log('[Dashboard] Saving phone number:', trimmedPhone);
			await pb.collection(pendingReminderItem.collection).update(pendingReminderItem.id, { 
				phone: trimmedPhone 
			});
			console.log('[Dashboard] SMS reminder enabled with phone:', phoneNumber);
			phoneDialogOpen = false;
			pendingReminderItem = null;
			phoneNumber = '';
			phoneError = '';
			await loadUpcoming();
		} catch (error) {
			console.error('[Dashboard] Error saving phone number:', error);
			phoneError = error instanceof Error ? error.message : 'Failed to save phone number';
		}
	}

	function formatDateTime(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function getPersonImageUrl(person: Person) {
		if (!person.image) return '';
		return pb.files.getUrl(person, person.image, { thumb: '100x100' });
	}

	function getPersonInitials(name: string) {
		return name
			.split(' ')
			.map(n => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function getFilteredUpcoming() {
		const items = [];
		if (showAppointments) {
			items.push(...appointments.map(a => ({ ...a, type: 'appointment', time: a.start, icon: Calendar, color: 'text-blue-500' })));
		}
		if (showTasks) {
			items.push(...tasks.map(t => ({ ...t, type: 'task', time: t.due, icon: CheckSquare, color: 'text-orange-500' })));
		}
		if (showTrips) {
			items.push(...trips.map(t => ({ ...t, type: 'trip', time: t.depart_at, icon: Plane, color: 'text-cyan-500' })));
		}
		if (showShifts) {
			items.push(...shifts.map(s => ({ ...s, type: 'shift', time: s.start, icon: Clock, color: 'text-amber-500' })));
		}
		
		let filtered = items;
		
		// Filter by active/completed status
		filtered = filtered.filter(item => {
			const isActive = item.active !== false; // Default to active if field doesn't exist
			return showCompleted ? !isActive : isActive;
		});
		
		// Filter by reminders
		if (showOnlyWithReminders) {
			filtered = filtered.filter(item => item.phone && item.notify_offset_minutes);
		}
		
		return filtered.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
	}
	
	function toggleFilter(type: 'appointments' | 'tasks' | 'trips' | 'shifts') {
		switch(type) {
			case 'appointments': showAppointments = !showAppointments; break;
			case 'tasks': showTasks = !showTasks; break;
			case 'trips': showTrips = !showTrips; break;
			case 'shifts': showShifts = !showShifts; break;
		}
	}
</script>

<div class="space-y-6 pb-20">
	<div>
		<h1 class="text-2xl font-bold">Welcome back!</h1>
		<p class="text-muted-foreground">{$currentUser?.name || $currentUser?.email}</p>
	</div>

	<!-- Upcoming Section -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div class="flex-1">
					<div class="flex items-center gap-3 mb-2">
						<CardTitle>Upcoming</CardTitle>
						<div class="flex gap-1">
							<Button 
								variant={!showCompleted ? "default" : "outline"} 
								size="sm"
								onclick={() => showCompleted = false}
							>
								Active
							</Button>
							<Button 
								variant={showCompleted ? "default" : "outline"} 
								size="sm"
								onclick={() => showCompleted = true}
							>
								Completed
							</Button>
						</div>
					</div>
					<CardDescription>
						{showCompleted ? 'Completed and inactive items' : 'Recent and upcoming events (past 24 hours)'}
						<br />
						<span class="text-xs">Click badges below to filter by type. "With Reminders Only" shows items with WhatsApp notifications enabled.</span>
					</CardDescription>
				</div>
				<Button variant="outline" size="sm" onclick={loadUpcoming} disabled={loading}>
					{loading ? 'Loading...' : 'Refresh'}
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			{#if loading}
				<p class="text-sm text-muted-foreground text-center py-4">Loading...</p>
			{:else if error}
				<div class="text-center py-4">
					<p class="text-sm text-destructive mb-2">Error: {error}</p>
					<Button size="sm" onclick={loadUpcoming}>Retry</Button>
				</div>
			{:else}
				<!-- Filter Badges -->
				<div class="flex flex-wrap gap-2 mb-4">
					<Badge 
						variant={showAppointments ? "default" : "outline"}
						class="cursor-pointer"
						onclick={() => toggleFilter('appointments')}
						title="Click to show/hide appointments"
					>
						<Calendar class="h-3 w-3 mr-1" />
						Appointments ({appointments.length})
					</Badge>
					<Badge 
						variant={showTasks ? "default" : "outline"}
						class="cursor-pointer"
						onclick={() => toggleFilter('tasks')}
						title="Click to show/hide tasks"
					>
						<CheckSquare class="h-3 w-3 mr-1" />
						Tasks ({tasks.length})
					</Badge>
					<Badge 
						variant={showTrips ? "default" : "outline"}
						class="cursor-pointer"
						onclick={() => toggleFilter('trips')}
						title="Click to show/hide trips"
					>
						<Plane class="h-3 w-3 mr-1" />
						Trips ({trips.length})
					</Badge>
					<Badge 
						variant={showShifts ? "default" : "outline"}
						class="cursor-pointer"
						onclick={() => toggleFilter('shifts')}
						title="Click to show/hide shifts"
					>
						<Clock class="h-3 w-3 mr-1" />
						Shifts ({shifts.length})
					</Badge>
					<Badge 
						variant={showOnlyWithReminders ? "default" : "outline"}
						class="cursor-pointer"
						onclick={() => showOnlyWithReminders = !showOnlyWithReminders}
						title="Show only items with WhatsApp reminders enabled. Reminders are sent to +16262223107 for manual forwarding."
					>
						<Bell class="h-3 w-3 mr-1" />
						With Reminders Only
					</Badge>
				</div>

				<!-- Filtered Items List -->
				<div class="space-y-3">
					{#if getFilteredUpcoming().length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">
							No upcoming items. Add your first event or adjust filters!
						</p>
					{:else}
						{#each getFilteredUpcoming() as item}
							{@const ItemIcon = item.icon}
							<Card class="hover:shadow-md transition-shadow">
								<CardContent class="p-4">
									<div class="flex items-start justify-between gap-3">
										<div class="flex items-start gap-3 flex-1">
											<div class="mt-1">
												<ItemIcon class="h-6 w-6 {item.color}" />
											</div>
											<div class="flex-1 space-y-1.5">
												<div class="flex items-center gap-2 flex-wrap">
													<h4 class="font-semibold text-base">{item.title}</h4>
													<Badge variant="secondary" class="text-xs">{item.type}</Badge>
												</div>
												<p class="text-sm text-muted-foreground font-medium">{formatDateTime(item.time)}</p>
												
												{#if item.type === 'appointment'}
													{#if item.expand?.for}
														{@const people = Array.isArray(item.expand.for) ? item.expand.for : [item.expand.for]}
														<div class="flex items-center gap-2 flex-wrap">
															{#each people as person}
																<div class="flex items-center gap-1.5">
																	<Avatar class="h-6 w-6">
																		<AvatarImage src={getPersonImageUrl(person)} alt={person.name} />
																		<AvatarFallback class="text-xs">{getPersonInitials(person.name)}</AvatarFallback>
																	</Avatar>
																	<span class="text-sm text-muted-foreground">{person.name}</span>
																</div>
															{/each}
														</div>
													{/if}
													{#if item.expand?.driver}
														<div class="flex items-center gap-1.5">
															<Car class="h-3.5 w-3.5 text-muted-foreground" />
															<Avatar class="h-5 w-5">
																<AvatarImage src={getPersonImageUrl(item.expand.driver)} alt={item.expand.driver.name} />
																<AvatarFallback class="text-[10px]">{getPersonInitials(item.expand.driver.name)}</AvatarFallback>
															</Avatar>
															<span class="text-sm text-muted-foreground">Driver: {item.expand.driver.name}</span>
														</div>
													{/if}
													{#if item.expand?.location}
														<p class="text-sm text-muted-foreground flex items-center gap-1">
															<MapPin class="h-3.5 w-3.5" />
															{item.expand.location.name}
														</p>
													{/if}
													{#if item.end}
														<p class="text-xs text-muted-foreground">
															Ends: {formatDateTime(item.end)}
														</p>
													{/if}
												{:else if item.type === 'task'}
													{#if item.priority}
														<Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'med' ? 'default' : 'outline'} class="text-xs w-fit">
															Priority: {item.priority.toUpperCase()}
														</Badge>
													{/if}
													{#if item.done}
														<Badge variant="outline" class="text-xs w-fit text-green-600">
															✓ Completed
														</Badge>
													{/if}
												{:else if item.type === 'trip'}
													{#if item.origin || item.destination}
														<p class="text-sm text-muted-foreground flex items-center gap-1">
															<MapPin class="h-3.5 w-3.5" />
															{item.origin || '?'} → {item.destination || '?'}
														</p>
													{/if}
													{#if item.transport_type}
														<Badge variant="outline" class="text-xs w-fit">
															{item.transport_type}
														</Badge>
													{/if}
													{#if item.arrive_at}
														<p class="text-xs text-muted-foreground">
															Arrives: {formatDateTime(item.arrive_at)}
														</p>
													{/if}
												{:else if item.type === 'shift'}
													{#if item.expand?.job}
														<p class="text-sm text-muted-foreground flex items-center gap-1">
															<Briefcase class="h-3.5 w-3.5" />
															{item.expand.job.name}
														</p>
													{/if}
													{#if item.end}
														<p class="text-xs text-muted-foreground">
															Ends: {formatDateTime(item.end)}
														</p>
													{/if}
												{/if}
												
												{#if item.notes}
													<p class="text-xs text-muted-foreground italic line-clamp-2">
														{item.notes}
													</p>
												{/if}
												
												{#if item.phone && item.notify_offset_minutes}
													{@const reminderTime = new Date(new Date(item.time).getTime() - item.notify_offset_minutes * 60000)}
													<p class="text-sm text-green-600 flex items-center gap-1 font-medium">
														<Bell class="h-3.5 w-3.5" />
														Reminder {item.notify_offset_minutes} min before
													</p>
												{/if}
											</div>
										</div>
										<Button
										variant="ghost"
										size="icon"
										onclick={() => toggleSMSReminder(item.type + 's', item.id, item.phone)}
										title={item.phone ? `WhatsApp reminder enabled (${item.notify_offset_minutes || 60} min before)` : 'Click to enable WhatsApp reminder'}
										class="shrink-0"
										>
											{#if item.phone}
												<Bell class="h-5 w-5 text-green-500" />
											{:else}
												<BellOff class="h-5 w-5 text-muted-foreground" />
											{/if}
										</Button>
									</div>
								</CardContent>
							</Card>
						{/each}
					{/if}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Quick Actions -->
	<div class="grid grid-cols-2 gap-3">
		{#each quickActions as action}
			{@const Icon = action.icon}
			<a href={action.href}>
				<Card class="hover:opacity-90 transition-all cursor-pointer {action.bgColor}">
					<CardContent class="p-4">
						<div class="flex flex-col items-center text-center gap-2">
							<Icon class="h-8 w-8 {action.color}" />
							<span class="text-sm font-medium">{action.label}</span>
						</div>
					</CardContent>
				</Card>
			</a>
		{/each}
	</div>

	<!-- Phone Number Dialog -->
	<Dialog bind:open={phoneDialogOpen}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Enable SMS Reminder</DialogTitle>
				<DialogDescription>
					Enter your phone number to receive SMS reminders. Use E.164 format (e.g., +1234567890).
				</DialogDescription>
			</DialogHeader>
			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<Label for="phone">Phone Number</Label>
					<Input
						id="phone"
						type="tel"
						placeholder="+6262223107"
						bind:value={phoneNumber}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								savePhoneNumber();
							}
						}}
					/>
					{#if phoneError}
						<p class="text-xs text-destructive">{phoneError}</p>
					{:else}
						<p class="text-xs text-muted-foreground">
							Format: +[country code][number] (e.g., +16262223107 for US)
						</p>
					{/if}
				</div>
			</div>
			<div class="flex justify-end gap-2">
				<Button variant="outline" onclick={() => { phoneDialogOpen = false; }}>
					Cancel
				</Button>
				<Button onclick={savePhoneNumber}>
					Enable Reminder
				</Button>
			</div>
		</DialogContent>
	</Dialog>
</div>
