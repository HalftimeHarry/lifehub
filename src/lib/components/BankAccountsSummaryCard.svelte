<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Building2 } from 'lucide-svelte';

	interface Props {
		accounts: any[];
		onclick?: () => void;
	}

	let { accounts, onclick }: Props = $props();

	const totalBalance = $derived(
		accounts.reduce((sum, account) => sum + (account.balance || 0), 0)
	);

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
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
					<Building2 class="h-6 w-6 text-primary" />
				</div>
				<div>
					<h3 class="text-lg font-semibold">Bank Accounts</h3>
					<p class="text-sm text-muted-foreground">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
				</div>
			</div>
		</div>

		<div class="pt-2 border-t">
			<p class="text-sm text-muted-foreground mb-1">Total Balance</p>
			<p class="text-3xl font-bold {totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}">
				{formatCurrency(totalBalance)}
			</p>
		</div>

		<div class="pt-2 text-sm text-muted-foreground">
			Click to view account details →
		</div>
	</div>
</Card>
