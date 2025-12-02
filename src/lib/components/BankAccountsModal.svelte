<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Wallet, TrendingUp, Briefcase, CreditCard, Banknote, Building2, Pencil } from 'lucide-svelte';
	import EditBankAccountModal from './EditBankAccountModal.svelte';

	interface Props {
		open: boolean;
		accounts: any[];
		onOpenChange: (open: boolean) => void;
		onUpdate: () => void;
	}

	let { open = $bindable(), accounts, onOpenChange, onUpdate }: Props = $props();

	let editModalOpen = $state(false);
	let selectedAccount = $state<any | null>(null);

	function handleEdit(account: any) {
		selectedAccount = account;
		editModalOpen = true;
	}

	function handleUpdate() {
		onUpdate();
	}

	const typeIcons: Record<string, any> = {
		checking: Wallet,
		savings: TrendingUp,
		business: Briefcase,
		credit_card: CreditCard,
		investment: TrendingUp,
		cash: Banknote
	};

	const typeColors: Record<string, string> = {
		checking: 'text-blue-600 bg-blue-50',
		savings: 'text-green-600 bg-green-50',
		business: 'text-purple-600 bg-purple-50',
		credit_card: 'text-orange-600 bg-orange-50',
		investment: 'text-indigo-600 bg-indigo-50',
		cash: 'text-gray-600 bg-gray-50'
	};

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

	function getIcon(type: string) {
		return typeIcons[type] || Building2;
	}

	function getColorClass(type: string) {
		return typeColors[type] || 'text-gray-600 bg-gray-50';
	}

	function formatAccountType(type: string): string {
		return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
	}
</script>

<Dialog {open} onOpenChange={onOpenChange}>
	<DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle class="text-2xl">Bank Accounts</DialogTitle>
		</DialogHeader>

		<div class="space-y-4">
			<!-- Total Balance Summary -->
			<Card class="p-4 bg-primary/5 border-primary/20">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-muted-foreground">Total Balance</p>
						<p class="text-3xl font-bold {totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}">
							{formatCurrency(totalBalance)}
						</p>
					</div>
					<div class="text-right">
						<p class="text-sm text-muted-foreground">Accounts</p>
						<p class="text-2xl font-semibold">{accounts.length}</p>
					</div>
				</div>
			</Card>

			<!-- Individual Accounts -->
			<div class="space-y-3">
				{#each accounts as account}
					{@const Icon = getIcon(account.type)}
					{@const colorClass = getColorClass(account.type)}
					<Card class="p-4 hover:shadow-md transition-shadow">
						<div class="flex items-start justify-between gap-4">
							<div class="flex items-start gap-3 flex-1">
								<div class="p-2 rounded-lg {colorClass}">
									<Icon class="h-5 w-5" />
								</div>
								<div class="flex-1">
									<h3 class="font-semibold text-base">{account.name}</h3>
									{#if account.institution || account.last_four}
										<p class="text-sm text-muted-foreground mt-0.5">
											{#if account.institution}
												{account.institution}
											{/if}
											{#if account.last_four}
												{#if account.institution} • {/if}•••{account.last_four}
											{/if}
										</p>
									{/if}
									<p class="text-xs text-muted-foreground mt-1 capitalize">
										{formatAccountType(account.type)}
									</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<div class="text-right">
									<p class="text-xl font-bold {account.balance >= 0 ? 'text-green-600' : 'text-red-600'}">
										{formatCurrency(account.balance)}
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onclick={() => handleEdit(account)}
									class="h-8 w-8"
								>
									<Pencil class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</Card>
				{/each}
			</div>
		</div>
	</DialogContent>
</Dialog>

<!-- Edit Account Modal -->
<EditBankAccountModal
	bind:open={editModalOpen}
	account={selectedAccount}
	onOpenChange={(open) => editModalOpen = open}
	onUpdate={handleUpdate}
/>
