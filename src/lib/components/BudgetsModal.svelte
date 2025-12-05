<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus, X } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import { toast } from 'svelte-sonner';
	import BudgetCard from './BudgetCard.svelte';

	interface Props {
		open: boolean;
		budgets: any[];
		onOpenChange: (open: boolean) => void;
		onUpdate: () => void;
		onBudgetClick?: (budget: any) => void;
	}

	let { open = $bindable(), budgets, onOpenChange, onUpdate, onBudgetClick }: Props = $props();

	let showAddForm = $state(false);
	let saving = $state(false);
	let newBudgetName = $state('');
	let newBudgetCategory = $state('food');
	let newBudgetAmount = $state('');

	function resetForm() {
		newBudgetName = '';
		newBudgetCategory = 'food';
		newBudgetAmount = '';
		showAddForm = false;
	}

	async function handleAddBudget() {
		if (!newBudgetName || !newBudgetAmount) {
			toast.error('Please fill in all required fields');
			return;
		}

		const amount = parseFloat(newBudgetAmount);
		if (isNaN(amount) || amount <= 0) {
			toast.error('Please enter a valid amount');
			return;
		}

		saving = true;
		try {
			await pb.collection('budgets').create({
				name: newBudgetName,
				category: newBudgetCategory,
				amount: amount,
				spent: 0
			});

			toast.success('Budget created successfully');
			resetForm();
			onUpdate();
		} catch (error: any) {
			console.error('Error creating budget:', error);
			toast.error('Failed to create budget');
		} finally {
			saving = false;
		}
	}

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

<Dialog {open} onOpenChange={onOpenChange}>
	<DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
		<DialogHeader>
			<div class="flex items-center justify-between">
				<DialogTitle class="text-2xl">Budgets</DialogTitle>
				{#if !showAddForm}
					<Button size="sm" onclick={() => showAddForm = true}>
						<Plus class="h-4 w-4 mr-2" />
						New Budget
					</Button>
				{/if}
			</div>
		</DialogHeader>

		<div class="space-y-4">
			<!-- Add Budget Form -->
			{#if showAddForm}
				<Card class="p-4 border-primary">
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3 class="font-semibold">Create New Budget</h3>
							<Button variant="ghost" size="icon" onclick={resetForm}>
								<X class="h-4 w-4" />
							</Button>
						</div>

						<div class="grid gap-4 md:grid-cols-3">
							<div class="space-y-2">
								<Label for="budget-name">Budget Name *</Label>
								<Input
									id="budget-name"
									bind:value={newBudgetName}
									placeholder="e.g., Monthly Groceries"
									disabled={saving}
								/>
							</div>

							<div class="space-y-2">
								<Label for="budget-category">Category *</Label>
								<select
									id="budget-category"
									bind:value={newBudgetCategory}
									disabled={saving}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<option value="lodging">Lodging</option>
									<option value="utilities">Utilities</option>
									<option value="food">Food</option>
									<option value="transportation">Transportation</option>
									<option value="all">All Categories</option>
								</select>
							</div>

							<div class="space-y-2">
								<Label for="budget-amount">Amount *</Label>
								<div class="relative">
									<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
									<Input
										id="budget-amount"
										type="number"
										step="0.01"
										bind:value={newBudgetAmount}
										placeholder="600"
										class="pl-7"
										disabled={saving}
									/>
								</div>
							</div>
						</div>

						<div class="flex gap-2 justify-end">
							<Button variant="outline" onclick={resetForm} disabled={saving}>
								Cancel
							</Button>
							<Button onclick={handleAddBudget} disabled={saving}>
								{saving ? 'Creating...' : 'Create Budget'}
							</Button>
						</div>
					</div>
				</Card>
			{/if}
			<!-- Overall Summary -->
			<Card class="p-4 bg-primary/5 border-primary/20">
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm text-muted-foreground">Total Spent</p>
							<p class="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
						</div>
						<div class="text-right">
							<p class="text-sm text-muted-foreground">Total Budget</p>
							<p class="text-2xl font-semibold">{formatCurrency(totalBudget)}</p>
						</div>
					</div>
					
					<div class="space-y-1">
						<div class="h-3 bg-accent rounded-full overflow-hidden">
							<div 
								class="h-full transition-all duration-300"
								class:bg-green-500={overallPercent < 75}
								class:bg-yellow-500={overallPercent >= 75 && overallPercent < 90}
								class:bg-orange-500={overallPercent >= 90 && overallPercent < 100}
								class:bg-red-500={overallPercent >= 100}
								style="width: {Math.min(overallPercent, 100)}%"
							></div>
						</div>
						<div class="flex items-center justify-between text-sm text-muted-foreground">
							<span>{Math.round(overallPercent)}% of total budget used</span>
							<span>{formatCurrency(totalBudget - totalSpent)} remaining</span>
						</div>
					</div>
				</div>
			</Card>

			<!-- Individual Budgets -->
			<div class="grid gap-4 md:grid-cols-2">
				{#each budgets as budget}
					<div 
						class="cursor-pointer transition-transform hover:scale-[1.02]"
						onclick={() => onBudgetClick?.(budget)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && onBudgetClick?.(budget)}
					>
						<BudgetCard 
							name={budget.name}
							category={budget.category}
							spent={budget.spent ?? 0}
							budget={budget.amount}
							daysLeft={budget.days_left}
						/>
					</div>
				{/each}
			</div>
		</div>
	</DialogContent>
</Dialog>
