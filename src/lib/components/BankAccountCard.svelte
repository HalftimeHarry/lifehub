<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Building2, Wallet, Briefcase, CreditCard, TrendingUp, Banknote } from 'lucide-svelte';

	interface Props {
		name: string;
		type: string;
		balance: number;
		institution?: string;
		lastFour?: string;
	}

	let { name, type, balance, institution, lastFour }: Props = $props();

	const typeIcons: Record<string, any> = {
		checking: Wallet,
		savings: TrendingUp,
		business: Briefcase,
		credit_card: CreditCard,
		investment: TrendingUp,
		cash: Banknote
	};

	const typeColors: Record<string, string> = {
		checking: 'text-blue-600',
		savings: 'text-green-600',
		business: 'text-purple-600',
		credit_card: 'text-orange-600',
		investment: 'text-indigo-600',
		cash: 'text-gray-600'
	};

	const Icon = typeIcons[type] || Building2;
	const colorClass = typeColors[type] || 'text-gray-600';

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}
</script>

<Card class="p-4 hover:shadow-md transition-shadow">
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<div class="flex items-center gap-2 mb-1">
				<Icon class="h-4 w-4 {colorClass}" />
				<h3 class="font-semibold text-sm">{name}</h3>
			</div>
			{#if institution || lastFour}
				<p class="text-xs text-muted-foreground">
					{#if institution}{institution}{/if}
					{#if lastFour}
						{#if institution} • {/if}••{lastFour}
					{/if}
				</p>
			{/if}
		</div>
	</div>
	<div class="mt-3">
		<p class="text-2xl font-bold {balance >= 0 ? 'text-green-600' : 'text-red-600'}">
			{formatCurrency(balance)}
		</p>
		<p class="text-xs text-muted-foreground capitalize mt-1">
			{type.replace('_', ' ')}
		</p>
	</div>
</Card>
