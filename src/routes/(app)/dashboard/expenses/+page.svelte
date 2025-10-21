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
	import { Plus, Receipt, TrendingUp, TrendingDown, DollarSign, Image, Camera, Upload, Link } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import type { ExpenseExpanded, Appointment, Trip, Shift, ShiftExpanded, Person } from '$lib/types';
	import { onMount } from 'svelte';

	let dialogOpen = $state(false);
	let saving = $state(false);
	let loading = $state(false);

	// Form fields
	let title = $state('');
	let amount = $state('');
	let expenseType = $state<'income' | 'expense'>('expense');
	let category = $state<'medical' | 'travel' | 'food' | 'transportation' | 'lodging' | 'entertainment' | 'other'>('medical');
	let date = $state(getDefaultDateTime());
	let notes = $state('');
	let receiptFile: File | null = $state(null);
	
	// Reference fields
	let referenceType = $state<'none' | 'appointment' | 'trip' | 'shift' | 'person'>('none');
	let appointmentId = $state('');
	let tripId = $state('');
	let shiftId = $state('');
	let personId = $state('');
	
	// Reference data
	let appointments = $state<Appointment[]>([]);
	let trips = $state<Trip[]>([]);
	let shifts = $state<ShiftExpanded[]>([]);
	let people = $state<Person[]>([]);

	function getDefaultDateTime(): string {
		// Get current date/time in local timezone formatted for datetime-local input
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	onMount(async () => {
		await loadReferenceData();
	});

	async function loadReferenceData() {
		loading = true;
		try {
			[appointments, trips, shifts, people] = await Promise.all([
				pb.collection('appointments').getFullList<Appointment>({ sort: '-start' }),
				pb.collection('trips').getFullList<Trip>({ sort: '-depart_at' }),
				pb.collection('shifts').getFullList<ShiftExpanded>({ sort: '-@rowid', expand: 'job' }),
				pb.collection('people').getFullList<Person>({ sort: 'name' })
			]);
		} catch (error) {
			console.error('[EXPENSES] Error loading reference data:', error);
		} finally {
			loading = false;
		}
	}

	async function handleReferenceChange(type: string, id: string) {
		if (!id) return;

		try {
			switch (type) {
				case 'appointment': {
					const apt = appointments.find(a => a.id === id);
					if (apt) {
						if (!title) title = apt.title;
						if (apt.start) date = apt.start.slice(0, 16);
						category = apt.type === 'medical' ? 'medical' : 'other';
					}
					break;
				}
				case 'trip': {
					const trip = trips.find(t => t.id === id);
					if (trip) {
						if (!title) title = trip.title;
						if (trip.depart_at) date = trip.depart_at.slice(0, 16);
						category = 'travel';
					}
					break;
				}
				case 'shift': {
					const shift = shifts.find(s => s.id === id);
					if (shift) {
						if (!title) title = shift.expand?.job?.name || 'Shift';
						if (shift.start) date = shift.start.slice(0, 16);
						expenseType = 'income';
					}
					break;
				}
				case 'person': {
					const person = people.find(p => p.id === id);
					if (person && !title) {
						title = `Expense for ${person.name}`;
					}
					break;
				}
			}
		} catch (error) {
			console.error('[EXPENSES] Error auto-populating from reference:', error);
		}
	}

	// Mock data - will be replaced with PocketBase fetch
	let expenses: ExpenseExpanded[] = [
		{
			id: '1',
			title: "Carol's Doctor Visit Copay",
			amount: 35.0,
			type: 'expense',
			category: 'medical',
			date: '2024-01-15T14:00:00Z',
			notes: 'Copay for annual checkup',
			created: new Date().toISOString(),
			updated: new Date().toISOString()
		},
		{
			id: '2',
			title: 'Hotel Stay - Chicago',
			amount: 250.0,
			type: 'expense',
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
			type: 'income',
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
			.filter((e) => e.type === 'income')
			.reduce((sum, e) => sum + e.amount, 0)
	);
	
	let totalExpenses = $derived(
		expenses
			.filter((e) => e.type === 'expense')
			.reduce((sum, e) => sum + e.amount, 0)
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
			// Validate required fields
			if (!title || !amount || !date) {
				alert('Please fill in all required fields');
				return;
			}

			// Convert datetime-local format to ISO 8601
			const expenseDate = new Date(date);
			if (isNaN(expenseDate.getTime())) {
				alert('Invalid date format');
				return;
			}

			const formData = new FormData();
			formData.append('title', title);
			formData.append('amount', amount.toString());
			formData.append('type', expenseType);
			formData.append('date', expenseDate.toISOString());
			
			// Optional fields
			if (category) formData.append('category', category);
			if (notes) formData.append('notes', notes);
			if (receiptFile) formData.append('receipt', receiptFile);
			
			// Add reference fields
			if (referenceType === 'appointment' && appointmentId) {
				formData.append('appointment', appointmentId);
			} else if (referenceType === 'trip' && tripId) {
				formData.append('trip', tripId);
			} else if (referenceType === 'shift' && shiftId) {
				formData.append('shift', shiftId);
			} else if (referenceType === 'person' && personId) {
				formData.append('for', personId);
			}

			console.log('[EXPENSES] Creating expense with data:', Object.fromEntries(formData));
			const record = await pb.collection('expenses').create(formData);
			
			// Add to local list
			expenses = [...expenses, record as ExpenseExpanded];
			
			// Reset form
			title = '';
			amount = '';
			expenseType = 'expense';
			category = 'medical';
			date = getDefaultDateTime();
			notes = '';
			receiptFile = null;
			referenceType = 'none';
			appointmentId = '';
			tripId = '';
			shiftId = '';
			personId = '';
			
			dialogOpen = false;
		} catch (error: any) {
			console.error('Error creating expense:', error);
			console.error('Error details:', error.response);
			alert(`Failed to create expense: ${error.message || 'Unknown error'}`);
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
						<Label>Link to (Optional)</Label>
						<select
							bind:value={referenceType}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							<option value="none">None</option>
							<option value="appointment">Appointment</option>
							<option value="trip">Trip</option>
							<option value="shift">Shift</option>
							<option value="person">Person</option>
						</select>
					</div>

					{#if referenceType === 'appointment'}
						<div class="space-y-2">
							<Label>Select Appointment</Label>
							<select
								bind:value={appointmentId}
								onchange={() => handleReferenceChange('appointment', appointmentId)}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Choose an appointment...</option>
								{#each appointments as apt}
									<option value={apt.id}>{apt.title} - {new Date(apt.start).toLocaleDateString()}</option>
								{/each}
							</select>
						</div>
					{:else if referenceType === 'trip'}
						<div class="space-y-2">
							<Label>Select Trip</Label>
							<select
								bind:value={tripId}
								onchange={() => handleReferenceChange('trip', tripId)}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Choose a trip...</option>
								{#each trips as trip}
									<option value={trip.id}>{trip.title} - {new Date(trip.depart_at).toLocaleDateString()}</option>
								{/each}
							</select>
						</div>
					{:else if referenceType === 'shift'}
						<div class="space-y-2">
							<Label>Select Shift</Label>
							<select
								bind:value={shiftId}
								onchange={() => handleReferenceChange('shift', shiftId)}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Choose a shift...</option>
								{#each shifts as shift}
									<option value={shift.id}>{shift.expand?.job?.name || 'Shift'} - {new Date(shift.start).toLocaleDateString()}</option>
								{/each}
							</select>
						</div>
					{:else if referenceType === 'person'}
						<div class="space-y-2">
							<Label>Select Person</Label>
							<select
								bind:value={personId}
								onchange={() => handleReferenceChange('person', personId)}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Choose a person...</option>
								{#each people as person}
									<option value={person.id}>{person.name}</option>
								{/each}
							</select>
						</div>
					{/if}

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
						<Label>Type</Label>
						<div class="flex gap-2">
							<button
								type="button"
								class="flex-1 px-4 py-2 rounded-md border transition-colors {expenseType === 'expense' ? 'bg-red-50 border-red-500 text-red-700' : 'border-input hover:bg-accent'}"
								onclick={() => expenseType = 'expense'}
							>
								<TrendingDown class="inline h-4 w-4 mr-2" />
								Expense
							</button>
							<button
								type="button"
								class="flex-1 px-4 py-2 rounded-md border transition-colors {expenseType === 'income' ? 'bg-green-50 border-green-500 text-green-700' : 'border-input hover:bg-accent'}"
								onclick={() => expenseType = 'income'}
							>
								<TrendingUp class="inline h-4 w-4 mr-2" />
								Income
							</button>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="amount">Amount</Label>
						<div class="relative">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
							<Input
								id="amount"
								type="number"
								step="0.01"
								bind:value={amount}
								placeholder="35.00"
								class="pl-7"
								required
							/>
						</div>
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
						<Label>Receipt (Optional)</Label>
						<div class="flex gap-2">
							<button
								type="button"
								class="flex-1 px-4 py-2 rounded-md border border-input hover:bg-accent transition-colors flex items-center justify-center gap-2"
								onclick={() => document.getElementById('receipt-upload')?.click()}
							>
								<Upload class="h-4 w-4" />
								Upload File
							</button>
							<button
								type="button"
								class="flex-1 px-4 py-2 rounded-md border border-input hover:bg-accent transition-colors flex items-center justify-center gap-2"
								onclick={() => document.getElementById('receipt-camera')?.click()}
							>
								<Camera class="h-4 w-4" />
								Take Photo
							</button>
						</div>
						<input
							id="receipt-upload"
							type="file"
							accept="image/*,.pdf"
							class="hidden"
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								receiptFile = target.files?.[0] || null;
							}}
						/>
						<input
							id="receipt-camera"
							type="file"
							accept="image/*"
							capture="environment"
							class="hidden"
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								receiptFile = target.files?.[0] || null;
							}}
						/>
						{#if receiptFile}
							<div class="flex items-center gap-2 p-2 bg-accent rounded-md">
								<Image class="h-4 w-4 text-muted-foreground" />
								<span class="text-sm flex-1 truncate">{receiptFile.name}</span>
								<button
									type="button"
									class="text-xs text-red-600 hover:underline"
									onclick={() => {
										receiptFile = null;
										const uploadInput = document.getElementById('receipt-upload') as HTMLInputElement;
										const cameraInput = document.getElementById('receipt-camera') as HTMLInputElement;
										if (uploadInput) uploadInput.value = '';
										if (cameraInput) cameraInput.value = '';
									}}
								>
									Remove
								</button>
							</div>
						{:else}
							<p class="text-xs text-muted-foreground">Upload image/PDF or take a photo (max 5MB)</p>
						{/if}
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
				<DollarSign class={`h-8 w-8 ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`} />
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
								<div class="flex items-center justify-end gap-1 mb-1">
									{#if expense.type === 'income'}
										<TrendingUp class="h-4 w-4 text-green-600" />
										<span class="text-xs text-green-600 font-medium">Income</span>
									{:else}
										<TrendingDown class="h-4 w-4 text-red-600" />
										<span class="text-xs text-red-600 font-medium">Expense</span>
									{/if}
								</div>
								<p
									class="text-lg font-bold"
									class:text-green-600={expense.type === 'income'}
									class:text-red-600={expense.type === 'expense'}
								>
									{expense.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(expense.amount))}
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
