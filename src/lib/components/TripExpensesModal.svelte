<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { List, Grid3x3, DollarSign, Calendar, Tag, Pencil } from 'lucide-svelte';
	import CategoryGroupBadge from './CategoryGroupBadge.svelte';
	
	interface Expense {
		id: string;
		title: string;
		amount: number;
		category: string;
		categoryGroup?: string;
		date: string;
		status: string;
		notes?: string;
	}
	
	interface TripSummary {
		totalExpenses: number;
		expenseCount: number;
		budgetRemaining: number;
		overBudget: boolean;
		percentUsed: number;
		categoryBreakdown: Record<string, number>;
	}
	
	interface Trip {
		id: string;
		title: string;
		origin: string;
		destination: string;
		budget: number;
	}
	
	interface Props {
		open: boolean;
		trip: Trip | null;
		summary: TripSummary | null;
		expenses: Expense[];
		onClose: () => void;
		onEditExpense?: (expenseId: string) => void;
	}
	
	let { open = $bindable(), trip, summary, expenses, onClose, onEditExpense }: Props = $props();
	
	let viewMode = $state<'list' | 'grid'>('list');
	
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric',
			year: 'numeric'
		});
	};
	
	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	};
	
	const statusColors: Record<string, string> = {
		upcoming: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
		approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
		paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
		rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
		canceled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
	};
</script>

<Dialog bind:open>
	<DialogContent class="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
		<DialogHeader>
			<DialogTitle class="text-xl font-bold">
				{trip?.title || 'Trip Expenses'}
			</DialogTitle>
			<DialogDescription>
				{#if trip}
					<div class="flex items-center gap-2 text-sm">
						<span>{trip.origin} → {trip.destination}</span>
						{#if summary}
							<span class="text-gray-400">•</span>
							<span class="font-medium">{summary.expenseCount} expenses</span>
							<span class="text-gray-400">•</span>
							<span class="font-medium">{formatAmount(summary.totalExpenses)}</span>
							{#if trip.budget > 0}
								<span class="text-gray-400">•</span>
								<span class:text-red-600={summary.overBudget} class:text-green-600={!summary.overBudget}>
									{summary.overBudget ? 'Over' : 'Under'} budget
								</span>
							{/if}
						{/if}
					</div>
				{/if}
			</DialogDescription>
		</DialogHeader>
		
		<!-- View Toggle -->
		<div class="flex justify-end gap-2 pb-4 border-b">
			<Button
				variant={viewMode === 'list' ? 'default' : 'outline'}
				size="sm"
				onclick={() => viewMode = 'list'}
			>
				<List class="w-4 h-4 mr-2" />
				List
			</Button>
			<Button
				variant={viewMode === 'grid' ? 'default' : 'outline'}
				size="sm"
				onclick={() => viewMode = 'grid'}
			>
				<Grid3x3 class="w-4 h-4 mr-2" />
				Grid
			</Button>
		</div>
		
		<!-- Expenses Content -->
		<div class="flex-1 overflow-y-auto">
			{#if expenses.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-gray-500">
					<DollarSign class="w-12 h-12 mb-2 opacity-50" />
					<p>No expenses for this trip yet</p>
				</div>
			{:else if viewMode === 'list'}
				<!-- List View -->
				<div class="space-y-2">
					{#each expenses as expense}
						<div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<h4 class="font-medium text-gray-900 dark:text-gray-100">
											{expense.title.split(' - ')[1] || expense.title}
										</h4>
										{#if expense.categoryGroup}
											<CategoryGroupBadge group={expense.categoryGroup} />
										{/if}
									</div>
									
									<div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
										<div class="flex items-center gap-1">
											<Tag class="w-3 h-3" />
											<span class="capitalize">{expense.category}</span>
										</div>
										<div class="flex items-center gap-1">
											<Calendar class="w-3 h-3" />
											<span>{formatDate(expense.date)}</span>
										</div>
										<span class="px-2 py-0.5 text-xs rounded-full {statusColors[expense.status] || statusColors.approved}">
											{expense.status}
										</span>
									</div>
									
									{#if expense.notes}
										<p class="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
											{expense.notes}
										</p>
									{/if}
								</div>
								
								<div class="flex flex-col items-end gap-2">
									<div class="text-lg font-bold text-gray-900 dark:text-gray-100">
										{formatAmount(expense.amount)}
									</div>
									{#if onEditExpense}
										<Button
											variant="outline"
											size="sm"
											onclick={() => onEditExpense?.(expense.id)}
											class="h-8 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-400 dark:hover:border-blue-700 transition-colors"
										>
											<Pencil class="w-3 h-3 mr-1" />
											Edit
										</Button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Grid View -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each expenses as expense}
						<div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
							<div class="space-y-3">
								<div class="flex items-start justify-between">
									<h4 class="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2 flex-1">
										{expense.title.split(' - ')[1] || expense.title}
									</h4>
								</div>
								
								<div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
									{formatAmount(expense.amount)}
								</div>
								
								<div class="flex items-center gap-2 flex-wrap">
									{#if expense.categoryGroup}
										<CategoryGroupBadge group={expense.categoryGroup} size="sm" />
									{/if}
									<span class="px-2 py-0.5 text-xs rounded-full {statusColors[expense.status] || statusColors.approved}">
										{expense.status}
									</span>
								</div>
								
								<div class="text-xs text-gray-600 dark:text-gray-400">
									<div class="capitalize">{expense.category}</div>
									<div>{formatDate(expense.date)}</div>
								</div>
								
								{#if onEditExpense}
									<Button
										variant="outline"
										size="sm"
										onclick={() => onEditExpense?.(expense.id)}
										class="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-400 dark:hover:border-blue-700 transition-colors"
									>
										<Pencil class="w-3 h-3 mr-1" />
										Edit
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</DialogContent>
</Dialog>
