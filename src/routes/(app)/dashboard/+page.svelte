<script lang="ts">
	import { currentUser } from '$lib/auth';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Calendar, Briefcase, Plane, CheckSquare, Users, Plus, MapPin, Receipt } from 'lucide-svelte';

	const quickActions = [
		{ href: '/dashboard/appointments', label: 'Appointments', icon: Calendar, color: 'text-blue-500' },
		{ href: '/dashboard/people', label: 'People', icon: Users, color: 'text-pink-500' },
		{ href: '/dashboard/locations', label: 'Locations', icon: MapPin, color: 'text-purple-500' },
		{ href: '/dashboard/trips', label: 'Trips', icon: Plane, color: 'text-cyan-500' },
		{ href: '/dashboard/expenses', label: 'Expenses', icon: Receipt, color: 'text-green-500' },
		{ href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare, color: 'text-orange-500' }
	];
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
			<CardTitle>Upcoming</CardTitle>
			<CardDescription>Your next events and tasks</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="text-sm text-muted-foreground text-center py-4">
				No upcoming items. Add your first event!
			</p>
		</CardContent>
	</Card>

	<!-- Recent Activity -->
	<Card>
		<CardHeader>
			<CardTitle>Recent Activity</CardTitle>
			<CardDescription>Latest updates</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="text-sm text-muted-foreground text-center py-4">
				No recent activity yet.
			</p>
		</CardContent>
	</Card>
</div>
