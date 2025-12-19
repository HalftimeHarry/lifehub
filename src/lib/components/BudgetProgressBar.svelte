<script lang="ts">
	interface Props {
		spent: number;
		budget: number;
		label?: string;
		showPercent?: boolean;
		showRemaining?: boolean;
	}
	
	let { 
		spent, 
		budget, 
		label = '', 
		showPercent = true,
		showRemaining = true 
	}: Props = $props();
	
	const percentUsed = $derived(budget > 0 ? (spent / budget) * 100 : 0);
	const remaining = $derived(budget - spent);
	const overBudget = $derived(remaining < 0);
	
	const colorClass = $derived(
		percentUsed < 80 ? 'bg-green-500' :
		percentUsed < 100 ? 'bg-yellow-500' :
		'bg-red-500'
	);
	
	const textColorClass = $derived(
		percentUsed < 80 ? 'text-green-600' :
		percentUsed < 100 ? 'text-yellow-600' :
		'text-red-600'
	);
</script>

<div class="space-y-2">
	{#if label}
		<div class="text-sm font-medium text-gray-700">{label}</div>
	{/if}
	
	<div class="flex justify-between text-sm">
		<span class="text-gray-600">
			${spent.toLocaleString()} / ${budget.toLocaleString()}
		</span>
		{#if showRemaining}
			<span class:text-red-600={overBudget} class:text-green-600={!overBudget}>
				{overBudget ? 'Over' : 'Remaining'}: ${Math.abs(remaining).toLocaleString()}
			</span>
		{/if}
	</div>
	
	<div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
		<div 
			class="h-full transition-all duration-300 {colorClass}"
			style="width: {Math.min(percentUsed, 100)}%"
		></div>
	</div>
	
	{#if showPercent}
		<div class="text-xs text-right {textColorClass}">
			{percentUsed.toFixed(1)}% used
		</div>
	{/if}
</div>
