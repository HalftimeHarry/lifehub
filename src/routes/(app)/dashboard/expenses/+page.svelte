<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Plus, Receipt, TrendingUp, TrendingDown, DollarSign, Image } from 'lucide-svelte';
	import type { ExpenseExpanded } from '$lib/types';

	// Mock data - will be replaced with PocketBase fetch
	let expenses: ExpenseExpanded[] = [
		{
			id: '1',
			title: "Carol's Doctor Visit Copay",
			amount: -35.0,
			category: 'medical',
			date: '2024-01-15T14:00:00Z',
			notes: 'Copay for annual checkup',
			created: new Date().toISOString(),
			updated: new Date().toISOString()
		},
		{
			id: '2',
			title: 'Hotel Stay - Chicago',
			amount: -250.0,
			category: 'lodging',
			date: '2024-01-20T00:00:00Z',
			receipt: 'receipt_12345.jpg',
			created: new Date().toISOString(),
			updated: new Date().toISOString()
		},
		{
			id: '3',
			title: 'Freelance Payment',
			amount: 1500.0,
			category: 'other',
			date: '2024-01-10T00:00:00Z',
			notes: 'Client project completed',
			created: new Date().toISOString(),
			updated: new Date().toISOString()
		}
	];

	const categoryColors: Record<string, string> = {
		medical: 'bg-red-100 text-red-800',
		travel: 'bg-blue-100 text-blue-800',
		food: 'bg-orange-100 text-orange-800',
		transportation: 'bg-purple-100 text-purple-800',
		lodging: 'bg-indigo-100 text-indigo-800',
		entertainment: 'bg-pink-100 text-pink-800',
		other: 'bg-gray-100 text-gray-800'
	};

	// Calculate totals
	$: totalIncome = expenses
		.filter((e) => e.amount > 0)
		.reduce((sum, e) => sum + e.amount, 0);
	$: totalExpenses = expenses
		.filter((e) => e.amount < 0)
		.reduce((sum, e) => sum + Math.abs(e.amount), 0);
	$: netTotal = totalIncome - totalExpenses;

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(Math.abs(amount));
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Expenses</h1>
			<p class="text-muted-foreground">Track income and expenses with receipts</p>
		</div>
		<Button>
			<Plus class="mr-2 h-4 w-4" />
			Add Expense
		</Button>
	</div>

	<!-- Summary Cards -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Total Income</p>
					<p class="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
				</div>
				<TrendingUp class="h-8 w-8 text-green-600" />
			</div>
		</Card>

		<Card class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Total Expenses</p>
					<p class="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
				</div>
				<TrendingDown class="h-8 w-8 text-red-600" />
			</div>
		</Card>

		<Card class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Net Total</p>
					<p class="text-2xl font-bold" class:text-green-600={netTotal >= 0} class:text-red-600={netTotal < 0}>
						{formatCurrency(netTotal)}
					</p>
				</div>
				<DollarSign class="h-8 w-8" class:text-green-600={netTotal >= 0} class:text-red-600={netTotal < 0} />
			</div>
		</Card>
	</div>

	<!-- Expenses List -->
	<div class="space-y-3">
		{#each expenses as expense}
			<Card class="p-4">
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1 space-y-2">
						<div class="flex items-start justify-between">
							<div>
								<h3 class="font-semibold">{expense.title}</h3>
								<p class="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
							</div>
							<div class="text-right">
								<p
									class="text-lg font-bold"
									class:text-green-600={expense.amount > 0}
									class:text-red-600={expense.amount < 0}
								>
									{expense.amount > 0 ? '+' : '-'}{formatCurrency(expense.amount)}
								</p>
								{#if expense.category}
									<span class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium {categoryColors[expense.category]}">
										{expense.category}
									</span>
								{/if}
							</div>
						</div>

						{#if expense.notes}
							<p class="text-sm text-muted-foreground">{expense.notes}</p>
						{/if}

						<div class="flex items-center gap-4 text-sm text-muted-foreground">
							{#if expense.receipt}
								<div class="flex items-center gap-1">
									<Image class="h-4 w-4" />
									<span>Receipt attached</span>
								</div>
							{/if}
							{#if expense.expand?.for}
								<span>For: {expense.expand.for.name}</span>
							{/if}
							{#if expense.expand?.appointment}
								<span>Appointment: {expense.expand.appointment.title}</span>
							{/if}
							{#if expense.expand?.trip}
								<span>Trip: {expense.expand.trip.title}</span>
							{/if}
						</div>
					</div>

					<div class="flex gap-2">
						<Button variant="outline" size="sm">Edit</Button>
						<Button variant="outline" size="sm">Delete</Button>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	{#if expenses.length === 0}
		<Card class="p-12">
			<div class="text-center">
				<Receipt class="mx-auto h-12 w-12 text-muted-foreground" />
				<h3 class="mt-4 text-lg font-semibold">No expenses yet</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Start tracking your income and expenses with receipt images
				</p>
				<Button class="mt-4">
					<Plus class="mr-2 h-4 w-4" />
					Add Expense
				</Button>
			</div>
		</Card>
	{/if}
</div>
