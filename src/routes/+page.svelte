

<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { currentUser } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import LifeHubLogo from '$lib/components/LifeHubLogo.svelte';

	onMount(() => {
		// Redirect to dashboard if already logged in
		if ($currentUser) {
			goto('/dashboard');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center space-y-4">
			<div class="flex justify-center">
				<LifeHubLogo size={80} class="text-primary" />
			</div>
			<div class="space-y-2">
				<h1 class="text-4xl font-bold tracking-tight">LifeHub</h1>
				<p class="text-muted-foreground">Your personal life management dashboard</p>
			</div>
		</div>

		<Card>
			<CardHeader>
				<CardTitle>Welcome</CardTitle>
				<CardDescription>Sign in to manage your schedule, tasks, and more</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<Button class="w-full" size="lg" onclick={() => goto('/login')}>Sign In</Button>
				<Button class="w-full" variant="outline" size="lg" onclick={() => goto('/signup')}>
					Create Account
				</Button>
			</CardContent>
		</Card>

		<div class="text-center text-sm text-muted-foreground space-y-1">
			<p>✓ Manage appointments, shifts, trips, and tasks</p>
			<p>✓ Get SMS reminders for upcoming events</p>
			<p>✓ Collaborate with multiple users</p>
		</div>
	</div>
</div>
