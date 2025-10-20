<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { Plus, Receipt, TrendingUp, TrendingDown, DollarSign, Image } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import type { ExpenseExpanded } from '$lib/types';

	let dialogOpen = $state(false);
	let saving = $state(false);

	// Form fields
	let title = $state('');
	let amount = $state('');
	let category = $state<'medical' | 'travel' | 'food' | 'transportation' | 'lodging' | 'entertainment' | 'other'>('medical');
	let date = $state('');
	let notes = $state('');
	let receiptFile: File | null = $state(null);

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

	// Calculate totals using $derived
	let totalIncome = $derived(
		expenses
			.filter((e) => e.amount > 0)
			.reduce((sum, e) => sum + e.amount, 0)
	);
	
	let totalExpenses = $derived(
		expenses
			.filter((e) => e.amount < 0)
			.reduce((sum, e) => sum + Math.abs(e.amount), 0)
	);
	
	let netTotal = $derived(totalIncome - totalExpenses);

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

	async function handleSubmit() {
		saving = true;
		try {
			// Convert datetime-local format to ISO 8601
			const expenseDate = new Date(date);

			const formData = new FormData();
			formData.append('title', title);
			formData.append('amount', amount);
			formData.append('category', category);
			formData.append('date', expenseDate.toISOString());
			if (notes) formData.append('notes', notes);
			if (receiptFile) formData.append('receipt', receiptFile);

			console.log('[EXPENSES] Creating expense with date:', expenseDate.toISOString());
			const record = await pb.collection('expenses').create(formData);
			
			// Add to local list
			expenses = [...expenses, record as ExpenseExpanded];
			
			// Reset form
			title = '';
			amount = '';
			category = 'medical';
			date = '';
			notes = '';
			receiptFile = null;
			
			dialogOpen = false;
		} catch (error) {
			console.error('Error creating expense:', error);
			alert('Failed to create expense');
		} finally {
			saving = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Expenses</h1>
			<p class="text-muted-foreground">Track income and expenses with receipts</p>
		</div>
		
		<Dialog bind:open={dialogOpen}>
			<DialogTrigger asChild>
				{#snippet child({ props })}
					<Button {...props}>
						<Plus class="mr-2 h-4 w-4" />
						Add Expense
					</Button>
				{/snippet}
			</DialogTrigger>
			<DialogContent class="max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add Expense/Income</DialogTitle>
					<DialogDescription>Track spending or income with optional receipt</DialogDescription>
				</DialogHeader>
				
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
					<div class="space-y-2">
						<Label for="title">Description</Label>
						<Input
							id="title"
							bind:value={title}
							placeholder="Doctor visit copay"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="amount">Amount</Label>
						<Input
							id="amount"
							type="number"
							step="0.01"
							bind:value={amount}
							placeholder="-35.00 (negative for expense, positive for income)"
							required
						/>
						<p class="text-xs text-muted-foreground">Use negative for expenses, positive for income</p>
					</div>

					<div class="space-y-2">
						<Label for="date">Date</Label>
						<Input
							id="date"
							type="datetime-local"
							bind:value={date}
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="category">Category</Label>
						<Select bind:value={category}>
							<SelectTrigger>
								{category || 'Select category'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="medical">Medical</SelectItem>
								<SelectItem value="travel">Travel</SelectItem>
								<SelectItem value="food">Food</SelectItem>
								<SelectItem value="transportation">Transportation</SelectItem>
								<SelectItem value="lodging">Lodging</SelectItem>
								<SelectItem value="entertainment">Entertainment</SelectItem>
								<SelectItem value="other">Other</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div class="space-y-2">
						<Label for="receipt">Receipt (Optional)</Label>
						<Input
							id="receipt"
							type="file"
							accept="image/*,.pdf"
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								receiptFile = target.files?.[0] || null;
							}}
						/>
						<p class="text-xs text-muted-foreground">Upload image or PDF (max 5MB)</p>
					</div>

					<div class="space-y-2">
						<Label for="notes">Notes (Optional)</Label>
						<Textarea
							id="notes"
							bind:value={notes}
							placeholder="Additional details..."
							rows={3}
						/>
					</div>

					<div class="flex gap-2 justify-end">
						<Button type="button" variant="outline" onclick={() => dialogOpen = false}>
							Cancel
						</Button>
						<Button type="submit" disabled={saving}>
							{saving ? 'Saving...' : 'Save Expense'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
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
