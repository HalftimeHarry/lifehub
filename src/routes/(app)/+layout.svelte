<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser, logout } from '$lib/auth';
	import { pb } from '$lib/pb';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Calendar, Briefcase, Plane, CheckSquare, Users, User, LogOut, Home, MapPin, Receipt } from 'lucide-svelte';
	import LifeHubLogo from '$lib/components/LifeHubLogo.svelte';
	import '../../app.css';

	let { children } = $props();
	let mobileMenuOpen = $state(false);

	// Reactive check for authentication
	$effect(() => {
		console.log('[APP LAYOUT] Current user:', $currentUser);
		console.log('[APP LAYOUT] Auth store valid:', pb.authStore.isValid);
		if (!$currentUser) {
			console.log('[APP LAYOUT] No user, redirecting to /login');
			goto('/login');
		} else {
			console.log('[APP LAYOUT] User authenticated:', $currentUser.email);
		}
	});

	function handleLogout() {
		logout();
		goto('/');
	}

	const navItems = [
		{ href: '/dashboard', label: 'Home', icon: Home },
		{ href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
		{ href: '/dashboard/people', label: 'People', icon: Users },
		{ href: '/dashboard/expenses', label: 'Expenses', icon: Receipt }
	];
</script>

<div class="min-h-screen bg-background">
	<!-- Mobile Header -->
	<header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="container flex h-14 items-center px-4">
			<a href="/dashboard" class="flex items-center gap-2 flex-1 hover:opacity-80 transition-opacity">
				<LifeHubLogo size={28} class="text-primary" />
				<h1 class="font-bold text-lg">LifeHub</h1>
			</a>

			<!-- User Menu -->
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					{#snippet child({ props })}
						<Button {...props} variant="ghost" size="icon">
							<User class="h-5 w-5" />
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>
						{$currentUser?.email || 'User'}
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem onclick={handleLogout}>
						<LogOut class="mr-2 h-4 w-4" />
						Logout
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container px-4 py-4 pb-20">
		{@render children?.()}
	</main>

	<!-- Bottom Navigation (Mobile) -->
	<nav class="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
		<div class="container flex items-center justify-around h-16 px-2">
			{#each navItems as item}
				{@const Icon = item.icon}
				<a
				href={item.href}
				class="flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs hover:text-primary transition-colors"
				>
					<Icon class="h-5 w-5" />
					<span class="text-[10px]">{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>
