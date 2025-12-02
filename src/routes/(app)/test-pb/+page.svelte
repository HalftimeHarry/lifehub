<script lang="ts">
	import { pb } from '$lib/pb';
	import { onMount } from 'svelte';
	import { Card } from '$lib/components/ui/card';

	let bankAccounts = $state<any[]>([]);
	let budgets = $state<any[]>([]);
	let error = $state<string>('');
	let loading = $state(true);

	onMount(async () => {
		try {
			console.log('PocketBase URL:', import.meta.env.VITE_POCKETBASE_URL);
			
			const accounts = await pb.collection('bank_accounts').getFullList();
			console.log('Bank accounts:', accounts);
			bankAccounts = accounts;

			const budgetsList = await pb.collection('budgets').getFullList();
			console.log('Budgets:', budgetsList);
			budgets = budgetsList;
		} catch (err: any) {
			console.error('Error:', err);
			error = err.message || String(err);
		} finally {
			loading = false;
		}
	});
</script>

<div class="container mx-auto p-6 space-y-6">
	<h1 class="text-3xl font-bold">PocketBase Connection Test</h1>

	<Card class="p-6">
		<h2 class="text-xl font-semibold mb-4">Connection Info</h2>
		<p><strong>URL:</strong> {import.meta.env.VITE_POCKETBASE_URL}</p>
		<p><strong>Loading:</strong> {loading}</p>
		{#if error}
			<p class="text-red-600"><strong>Error:</strong> {error}</p>
		{/if}
	</Card>

	<Card class="p-6">
		<h2 class="text-xl font-semibold mb-4">Bank Accounts ({bankAccounts.length})</h2>
		{#if bankAccounts.length > 0}
			<ul class="space-y-2">
				{#each bankAccounts as account}
					<li class="p-3 bg-accent rounded">
						<strong>{account.name}</strong> - ${account.balance} ({account.type})
						<br />
						<span class="text-sm text-muted-foreground">
							{account.institution} •••{account.last_four}
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-muted-foreground">No accounts loaded</p>
		{/if}
	</Card>

	<Card class="p-6">
		<h2 class="text-xl font-semibold mb-4">Budgets ({budgets.length})</h2>
		{#if budgets.length > 0}
			<ul class="space-y-2">
				{#each budgets as budget}
					<li class="p-3 bg-accent rounded">
						<strong>{budget.name}</strong> - ${budget.spent}/${budget.amount} ({budget.category})
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-muted-foreground">No budgets loaded</p>
		{/if}
	</Card>
</div>
