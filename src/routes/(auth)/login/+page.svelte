<script lang="ts">
	import { goto } from '$app/navigation';
	import { login } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import LifeHubLogo from '$lib/components/LifeHubLogo.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin() {
		loading = true;
		error = '';

		const result = await login(email, password);

		if (result.success) {
			goto('/dashboard');
		} else {
			error = result.error || 'Login failed';
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
			<h1 class="text-3xl font-bold">Sign In</h1>
			<p class="text-muted-foreground">Welcome back to LifeHub</p>
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Login to your account</CardTitle>
			<CardDescription>Enter your credentials to continue</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleLogin();
				}}
				class="space-y-4"
			>
				{#if error}
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}

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

				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Signing in...' : 'Sign In'}
				</Button>
			</form>

			<div class="mt-4 text-center text-sm">
				<span class="text-muted-foreground">Don't have an account?</span>
				<Button variant="link" class="p-0 h-auto ml-1" onclick={() => goto('/signup')}>
					Sign up
				</Button>
			</div>
		</CardContent>
	</Card>

	<div class="text-center">
		<Button variant="ghost" onclick={() => goto('/')}>← Back to home</Button>
	</div>
</div>
