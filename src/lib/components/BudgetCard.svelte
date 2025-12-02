<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Home, Zap, ShoppingCart, Car, DollarSign, TrendingUp } from 'lucide-svelte';

	interface Props {
		name: string;
		category: string;
		spent: number;
		budget: number;
		daysLeft?: number;
	}

	let { name, category, spent, budget, daysLeft = 15 }: Props = $props();

	const categoryIcons: Record<string, any> = {
		lodging: Home,
		utilities: Zap,
		food: ShoppingCart,
		transportation: Car,
		all: DollarSign,
		income: TrendingUp
	};

	const Icon = categoryIcons[category] || DollarSign;

	// Handle null/undefined spent values
	const safeSpent = $derived(spent ?? 0);
	const percent = $derived((safeSpent / budget) * 100);
	const remaining = $derived(budget - safeSpent);
	
	const status = $derived(() => {
		if (percent >= 100) return 'over';
		if (percent >= 90) return 'warning';
		if (percent >= 75) return 'caution';
		return 'good';
	});

	const statusColors = {
		good: 'bg-green-500',
		caution: 'bg-yellow-500',
		warning: 'bg-orange-500',
		over: 'bg-red-500'
	};

	const statusEmoji = {
		good: '✅',
		caution: '⚠️',
		warning: '⚠️',
		over: '❌'
	};

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(Math.abs(amount));
	}
</script>

<Card class="p-4 hover:shadow-md transition-shadow cursor-pointer">
	<div class="space-y-3">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Icon class="h-5 w-5 text-muted-foreground" />
				<h3 class="font-semibold">{name}</h3>
			</div>
			<span class="text-2xl">{statusEmoji[status()]}</span>
		</div>

		<!-- Amount -->
		<div class="space-y-1">
			<div class="flex items-baseline justify-between">
				<span class="text-2xl font-bold">{formatCurrency(safeSpent)}</span>
				<span class="text-sm text-muted-foreground">/ {formatCurrency(budget)}</span>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="space-y-1">
			<div class="h-2 bg-accent rounded-full overflow-hidden">
				<div 
					class="h-full {statusColors[status()]} transition-all duration-300"
					style="width: {Math.min(percent, 100)}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>{Math.round(percent)}% used</span>
				<span>{daysLeft} days left</span>
			</div>
		</div>

		<!-- Remaining -->
		<div class="pt-2 border-t">
			<p class="text-sm">
				{#if remaining >= 0}
					<span class="text-green-600 font-medium">{formatCurrency(remaining)} remaining</span>
				{:else}
					<span class="text-red-600 font-medium">{formatCurrency(remaining)} over budget</span>
				{/if}
			</p>
		</div>
	</div>
</Card>
