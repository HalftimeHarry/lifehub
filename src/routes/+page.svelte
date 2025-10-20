<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pb';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	let pbConnected = $state(false);
	let pbUrl = $state('');

	onMount(async () => {
		pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'Not configured';
		try {
			await pb.health.check();
			pbConnected = true;
		} catch (error) {
			console.error('PocketBase connection error:', error);
			pbConnected = false;
		}
	});
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold">Welcome to LifeHub</h1>
		<p class="text-muted-foreground">Your personal life management dashboard</p>
		<div class="mt-2 flex items-center gap-2">
			<span class="text-sm text-muted-foreground">PocketBase:</span>
			{#if pbConnected}
				<Badge variant="default">Connected</Badge>
			{:else}
				<Badge variant="destructive">Disconnected</Badge>
			{/if}
			<span class="text-xs text-muted-foreground">{pbUrl}</span>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<Card>
			<CardHeader>
				<CardTitle>Appointments</CardTitle>
				<CardDescription>Medical, meetings, and events</CardDescription>
			</CardHeader>
			<CardContent>
				<a href="/appointments" class="text-sm text-primary hover:underline">View all →</a>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Shifts</CardTitle>
				<CardDescription>Work schedules and shifts</CardDescription>
			</CardHeader>
			<CardContent>
				<a href="/shifts" class="text-sm text-primary hover:underline">View all →</a>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Travel</CardTitle>
				<CardDescription>Trips and travel plans</CardDescription>
			</CardHeader>
			<CardContent>
				<a href="/trips" class="text-sm text-primary hover:underline">View all →</a>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Tasks</CardTitle>
				<CardDescription>To-do items and reminders</CardDescription>
			</CardHeader>
			<CardContent>
				<a href="/tasks" class="text-sm text-primary hover:underline">View all →</a>
			</CardContent>
		</Card>
	</div>
</div>
