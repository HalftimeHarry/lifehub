<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { currentUser } from '$lib/auth';
	import { pb } from '$lib/pb';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Calendar, Briefcase, Plane, CheckSquare, Users, Plus, MapPin, Receipt, Clock, Bell, BellOff } from 'lucide-svelte';
	import type { AppointmentExpanded, Task, TripExpanded, ShiftExpanded } from '$lib/types';

	const quickActions = [
		{ href: '/dashboard/appointments', label: 'Appointments', icon: Calendar, color: 'text-blue-500' },
		{ href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase, color: 'text-indigo-500' },
		{ href: '/dashboard/shifts', label: 'Shifts', icon: Clock, color: 'text-amber-500' },
		{ href: '/dashboard/people', label: 'People', icon: Users, color: 'text-pink-500' },
		{ href: '/dashboard/locations', label: 'Locations', icon: MapPin, color: 'text-purple-500' },
		{ href: '/dashboard/trips', label: 'Trips', icon: Plane, color: 'text-cyan-500' },
		{ href: '/dashboard/expenses', label: 'Expenses', icon: Receipt, color: 'text-green-500' },
		{ href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare, color: 'text-orange-500' }
	];

	let appointments = $state<AppointmentExpanded[]>([]);
	let tasks = $state<Task[]>([]);
	let trips = $state<TripExpanded[]>([]);
	let shifts = $state<ShiftExpanded[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	
	// Filter state
	let showAppointments = $state(true);
	let showTasks = $state(true);
	let showTrips = $state(true);
	let showShifts = $state(true);

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
			
			// Fetch upcoming appointments (from past 24 hours)
			try {
				appointments = await pb.collection('appointments').getFullList<AppointmentExpanded>({
					filter: `start >= "${cutoffDate}"`,
					sort: 'start',
					expand: 'location'
				});
				console.log('[Dashboard] Loaded appointments (past 24h + future):', appointments.length);
			} catch (err) {
				console.error('[Dashboard] Error loading appointments:', err);
				appointments = [];
			}

			// Fetch upcoming tasks (from past 24 hours)
			try {
				tasks = await pb.collection('tasks').getFullList<Task>({
					filter: `due >= "${cutoffDate}" && done = false`,
					sort: 'due'
				});
				console.log('[Dashboard] Loaded tasks (past 24h + future):', tasks.length);
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

			// Fetch upcoming shifts (from past 24 hours)
			try {
				shifts = await pb.collection('shifts').getFullList<ShiftExpanded>({
					filter: `start >= "${cutoffDate}"`,
					sort: 'start',
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
			const newPhone = currentPhone ? null : $currentUser?.phone || '';
			await pb.collection(collection).update(id, { phone: newPhone });
			await loadUpcoming();
		} catch (error) {
			console.error('Error toggling SMS reminder:', error);
			alert('Failed to toggle SMS reminder');
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
		return items.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
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

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Welcome back!</h1>
		<p class="text-muted-foreground">{$currentUser?.name || $currentUser?.email}</p>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-2 gap-3">
		{#each quickActions as action}
			{@const Icon = action.icon}
			<a href={action.href}>
				<Card class="hover:bg-accent transition-colors cursor-pointer">
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

	<!-- Upcoming Section -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Upcoming</CardTitle>
					<CardDescription>Recent and upcoming events (past 24 hours)</CardDescription>
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
					>
						<Calendar class="h-3 w-3 mr-1" />
						Appointments ({appointments.length})
					</Badge>
					<Badge 
						variant={showTasks ? "default" : "outline"}
						class="cursor-pointer"
						onclick={() => toggleFilter('tasks')}
					>
						<CheckSquare class="h-3 w-3 mr-1" />
						Tasks ({tasks.length})
					</Badge>
					<Badge 
						variant={showTrips ? "default" : "outline"}
						class="cursor-pointer"
						onclick={() => toggleFilter('trips')}
					>
						<Plane class="h-3 w-3 mr-1" />
						Trips ({trips.length})
					</Badge>
					<Badge 
						variant={showShifts ? "default" : "outline"}
						class="cursor-pointer"
						onclick={() => toggleFilter('shifts')}
					>
						<Clock class="h-3 w-3 mr-1" />
						Shifts ({shifts.length})
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
							<div class="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
								<div class="flex items-center gap-3 flex-1">
									<ItemIcon class="h-5 w-5 {item.color}" />
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<h4 class="font-medium">{item.title}</h4>
											<Badge variant="outline" class="text-xs">{item.type}</Badge>
										</div>
										<p class="text-sm text-muted-foreground">{formatDateTime(item.time)}</p>
										{#if item.type === 'appointment' && item.expand?.location}
											<p class="text-xs text-muted-foreground">{item.expand.location.name}</p>
										{/if}
									</div>
								</div>
								<Button
								variant="ghost"
								size="icon"
								onclick={() => toggleSMSReminder(item.type + 's', item.id, item.phone)}
								>
									{#if item.phone}
										<Bell class="h-4 w-4 text-green-500" />
									{:else}
										<BellOff class="h-4 w-4 text-muted-foreground" />
									{/if}
								</Button>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
