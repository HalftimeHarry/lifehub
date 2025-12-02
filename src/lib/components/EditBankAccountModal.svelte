<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { pb } from '$lib/pb';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
		account: any | null;
		onOpenChange: (open: boolean) => void;
		onUpdate: () => void;
	}

	let { open = $bindable(), account, onOpenChange, onUpdate }: Props = $props();

	let balance = $state('');
	let saving = $state(false);
	let error = $state('');

	// Update balance when account changes
	$effect(() => {
		if (account) {
			balance = account.balance.toString();
			error = '';
		}
	});

	async function handleSave() {
		if (!account) return;

		const newBalance = parseFloat(balance);
		if (isNaN(newBalance)) {
			error = 'Please enter a valid number';
			return;
		}

		saving = true;
		error = '';

		try {
			await pb.collection('bank_accounts').update(account.id, {
				balance: newBalance
			});

			toast.success('Account balance updated successfully');
			onUpdate();
			onOpenChange(false);
		} catch (err: any) {
			console.error('Error updating account:', err);
			error = err.message || 'Failed to update account';
			toast.error('Failed to update account balance');
		} finally {
			saving = false;
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}
</script>

<Dialog {open} onOpenChange={onOpenChange}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Update Account Balance</DialogTitle>
		</DialogHeader>

		{#if account}
			<div class="space-y-4">
				<div>
					<p class="font-semibold text-lg">{account.name}</p>
					{#if account.institution || account.last_four}
						<p class="text-sm text-muted-foreground">
							{#if account.institution}{account.institution}{/if}
							{#if account.last_four}
								{#if account.institution} • {/if}•••{account.last_four}
							{/if}
						</p>
					{/if}
				</div>

				<div class="p-3 bg-accent rounded-lg">
					<p class="text-sm text-muted-foreground">Current Balance</p>
					<p class="text-2xl font-bold {account.balance >= 0 ? 'text-green-600' : 'text-red-600'}">
						{formatCurrency(account.balance)}
					</p>
				</div>

				<div class="space-y-2">
					<Label for="balance">New Balance</Label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
						<Input
							id="balance"
							type="number"
							step="0.01"
							bind:value={balance}
							placeholder="0.00"
							class="pl-7"
							disabled={saving}
						/>
					</div>
					{#if error}
						<p class="text-sm text-red-600">{error}</p>
					{/if}
				</div>
			</div>

			<DialogFooter>
				<Button
					variant="outline"
					onclick={() => onOpenChange(false)}
					disabled={saving}
				>
					Cancel
				</Button>
				<Button
					onclick={handleSave}
					disabled={saving}
				>
					{saving ? 'Saving...' : 'Save Changes'}
				</Button>
			</DialogFooter>
		{/if}
	</DialogContent>
</Dialog>
