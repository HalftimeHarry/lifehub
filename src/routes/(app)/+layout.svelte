<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { currentUser, logout } from '$lib/auth';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Calendar, Briefcase, Plane, CheckSquare, Users, User, LogOut } from 'lucide-svelte';
	import LifeHubLogo from '$lib/components/LifeHubLogo.svelte';
	import '../../app.css';

	let { children } = $props();
	let mobileMenuOpen = $state(false);

	onMount(() => {
		// Redirect to login if not authenticated
		if (!$currentUser) {
			goto('/login');
		}
	});

	function handleLogout() {
		logout();
		goto('/');
	}

	const navItems = [
		{ href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
		{ href: '/dashboard/people', label: 'People', icon: Users },
		{ href: '/dashboard/shifts', label: 'Shifts', icon: Briefcase },
		{ href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare }
	];
</script>

<div class="min-h-screen bg-background">
	<!-- Mobile Header -->
	<header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="container flex h-14 items-center px-4">
			<div class="flex items-center gap-2 flex-1">
				<LifeHubLogo size={28} class="text-primary" />
				<h1 class="font-bold text-lg">LifeHub</h1>
			</div>

			<!-- User Menu -->
			<DropdownMenu>
				<DropdownMenuTrigger asChild let:builder>
					<Button builders={[builder]} variant="ghost" size="icon">
						<User class="h-5 w-5" />
					</Button>
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
				<a
					href={item.href}
					class="flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs hover:text-primary transition-colors"
				>
					<svelte:component this={item.icon} class="h-5 w-5" />
					<span class="text-[10px]">{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>
