<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import BudgetProgressBar from './BudgetProgressBar.svelte';
	import { Plane, Car, MapPin, Calendar, DollarSign } from 'lucide-svelte';
	
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
		depart_at: string;
		arrive_at: string;
		status: string;
		budget: number;
		transport_type: string;
	}
	
	interface Props {
		trip: Trip;
		summary: TripSummary;
	}
	
	let { trip, summary }: Props = $props();
	
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	};
	
	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800',
		active: 'bg-blue-100 text-blue-800',
		completed: 'bg-green-100 text-green-800',
		cancelled: 'bg-gray-100 text-gray-800'
	};
</script>

<Card class="p-6 hover:shadow-lg transition-shadow">
	<div class="space-y-4">
		<!-- Header -->
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h3 class="text-lg font-semibold text-gray-900">{trip.title}</h3>
				<div class="flex items-center gap-2 mt-1 text-sm text-gray-600">
					<MapPin class="w-4 h-4" />
					<span>{trip.origin} → {trip.destination}</span>
				</div>
			</div>
			
			<span class="px-2 py-1 text-xs font-medium rounded-full {statusColors[trip.status] || statusColors.pending}">
				{trip.status}
			</span>
		</div>
		
		<!-- Dates and Transport -->
		<div class="flex items-center gap-4 text-sm text-gray-600">
			<div class="flex items-center gap-1">
				<Calendar class="w-4 h-4" />
				<span>{formatDate(trip.depart_at)} - {formatDate(trip.arrive_at)}</span>
			</div>
			
			<div class="flex items-center gap-1">
				{#if trip.transport_type === 'plane'}
					<Plane class="w-4 h-4" />
				{:else}
					<Car class="w-4 h-4" />
				{/if}
				<span class="capitalize">{trip.transport_type}</span>
			</div>
		</div>
		
		<!-- Expense Summary -->
		<div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
			<div>
				<div class="text-xs text-gray-600">Total Spent</div>
				<div class="text-2xl font-bold text-gray-900">
					${summary.totalExpenses.toLocaleString()}
				</div>
				<div class="text-xs text-gray-600 mt-1">
					{summary.expenseCount} {summary.expenseCount === 1 ? 'expense' : 'expenses'}
				</div>
			</div>
			
			{#if trip.budget > 0}
				<div>
					<div class="text-xs text-gray-600">Budget</div>
					<div class="text-2xl font-bold text-gray-900">
						${trip.budget.toLocaleString()}
					</div>
					<div class="text-xs mt-1" class:text-red-600={summary.overBudget} class:text-green-600={!summary.overBudget}>
						{summary.overBudget ? 'Over' : 'Under'} by ${Math.abs(summary.budgetRemaining).toLocaleString()}
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Budget Progress -->
		{#if trip.budget > 0}
			<BudgetProgressBar 
				spent={summary.totalExpenses} 
				budget={trip.budget}
				showRemaining={false}
			/>
		{/if}
		
		<!-- Category Breakdown -->
		{#if Object.keys(summary.categoryBreakdown).length > 0}
			<div>
				<div class="text-xs font-medium text-gray-700 mb-2">Category Breakdown</div>
				<div class="flex flex-wrap gap-2">
					{#each Object.entries(summary.categoryBreakdown) as [category, amount]}
						<span class="px-2 py-1 text-xs bg-white border border-gray-200 rounded-full">
							<span class="capitalize">{category}</span>: ${amount.toLocaleString()}
						</span>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</Card>
