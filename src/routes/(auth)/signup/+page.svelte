<script lang="ts">
	import { goto } from '$app/navigation';
	import { signup } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import LifeHubLogo from '$lib/components/LifeHubLogo.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleSignup() {
		loading = true;
		error = '';

		if (password !== passwordConfirm) {
			error = 'Passwords do not match';
			loading = false;
			return;
		}

		console.log('[SIGNUP PAGE] Starting signup...');
		const result = await signup(email, password, passwordConfirm, name);
		console.log('[SIGNUP PAGE] Signup result:', result);

		if (result.success) {
			console.log('[SIGNUP PAGE] Signup successful, redirecting to /dashboard');
			goto('/dashboard');
		} else {
			console.error('[SIGNUP PAGE] Signup failed:', result.error);
			error = result.error || 'Signup failed';
		}

		loading = false;
	}
</script>

<div class="w-full max-w-md space-y-6">
	<div class="text-center space-y-4">
		<div class="flex justify-center">
			<LifeHubLogo size={60} class="text-primary" />
		</div>
		<div class="space-y-2">
			<h1 class="text-3xl font-bold">Create Account</h1>
			<p class="text-muted-foreground">Join LifeHub today</p>
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Sign up for an account</CardTitle>
			<CardDescription>Enter your details to get started</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSignup();
				}}
				class="space-y-4"
			>
				{#if error}
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}

				<div class="space-y-2">
					<label for="name" class="text-sm font-medium">Name</label>
					<Input
						id="name"
						type="text"
						placeholder="Your name"
						bind:value={name}
						disabled={loading}
					/>
				</div>

				<div class="space-y-2">
					<label for="email" class="text-sm font-medium">Email</label>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						bind:value={email}
						required
						disabled={loading}
					/>
				</div>

				<div class="space-y-2">
					<label for="password" class="text-sm font-medium">Password</label>
					<Input
						id="password"
						type="password"
						placeholder="••••••••"
						bind:value={password}
						required
						disabled={loading}
					/>
				</div>

				<div class="space-y-2">
					<label for="passwordConfirm" class="text-sm font-medium">Confirm Password</label>
					<Input
						id="passwordConfirm"
						type="password"
						placeholder="••••••••"
						bind:value={passwordConfirm}
						required
						disabled={loading}
					/>
				</div>

				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Creating account...' : 'Create Account'}
				</Button>
			</form>

			<div class="mt-4 text-center text-sm">
				<span class="text-muted-foreground">Already have an account?</span>
				<Button variant="link" class="p-0 h-auto ml-1" onclick={() => goto('/login')}>
					Sign in
				</Button>
			</div>
		</CardContent>
	</Card>

	<div class="text-center">
		<Button variant="ghost" onclick={() => goto('/')}>← Back to home</Button>
	</div>
</div>
