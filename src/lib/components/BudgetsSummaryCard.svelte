<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Target } from 'lucide-svelte';

	interface Props {
		budgets: any[];
		onclick?: () => void;
	}

	let { budgets, onclick }: Props = $props();

	const totalBudget = $derived(
		budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0)
	);

	const totalSpent = $derived(
		budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0)
	);

	const overallPercent = $derived(
		totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
	);

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<Card 
	class="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary"
	{onclick}
>
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="p-3 bg-primary/10 rounded-full">
					<Target class="h-6 w-6 text-primary" />
				</div>
				<div>
					<h3 class="text-lg font-semibold">Budgets</h3>
					<p class="text-sm text-muted-foreground">{budgets.length} budget{budgets.length !== 1 ? 's' : ''}</p>
				</div>
			</div>
		</div>

		<div class="space-y-2">
			<div class="flex items-baseline justify-between">
				<span class="text-2xl font-bold">{formatCurrency(totalSpent)}</span>
				<span class="text-sm text-muted-foreground">/ {formatCurrency(totalBudget)}</span>
			</div>
			
			<div class="h-2 bg-accent rounded-full overflow-hidden">
				<div 
					class="h-full transition-all duration-300"
					class:bg-green-500={overallPercent < 75}
					class:bg-yellow-500={overallPercent >= 75 && overallPercent < 90}
					class:bg-orange-500={overallPercent >= 90 && overallPercent < 100}
					class:bg-red-500={overallPercent >= 100}
					style="width: {Math.min(overallPercent, 100)}%"
				></div>
			</div>
			
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>{Math.round(overallPercent)}% used</span>
				<span>{formatCurrency(totalBudget - totalSpent)} remaining</span>
			</div>
		</div>

		<div class="pt-2 text-sm text-muted-foreground">
			Click to view budget details →
		</div>
	</div>
</Card>
