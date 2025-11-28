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
	import { Plus, Receipt, TrendingUp, TrendingDown, DollarSign, Image, Camera, Upload, Link } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import type { ExpenseExpanded, Appointment, Trip, Shift, ShiftExpanded, Person } from '$lib/types';
	import { onMount } from 'svelte';

	let dialogOpen = $state(false);
	let saving = $state(false);
	let loading = $state(false);
	let receiptModalOpen = $state(false);
	let selectedReceipt = $state<{ url: string; filename: string } | null>(null);
	let editingExpense = $state<ExpenseExpanded | null>(null);
	let deleteModalOpen = $state(false);
	let expenseToDelete = $state<ExpenseExpanded | null>(null);

	// Form fields
	let title = $state('');
	let amount = $state('');
	let expenseType = $state<'income' | 'expense'>('expense');
	let category = $state<'medical' | 'travel' | 'food' | 'transportation' | 'lodging' | 'entertainment' | 'retail' | 'subscription' | 'other'>('medical');
	let store = $state('');
	let service = $state('');
	let date = $state(getDefaultDateTime());
	let notes = $state('');
	let receiptFile: File | null = $state(null);
	
	// Required: Who is this expense for
	let personId = $state('');
	
	// Optional: Related to appointment/trip/shift
	let relatedType = $state<'' | 'appointment' | 'trip' | 'shift'>('');
	let appointmentId = $state('');
	let tripId = $state('');
	let shiftId = $state('');
	
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
		await loadExpenses();
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

	async function loadExpenses() {
		loading = true;
		try {
			expenses = await pb.collection('expenses').getFullList<ExpenseExpanded>({ 
				sort: '-date',
				expand: 'appointment,trip,shift,for'
			});
		} catch (error) {
			console.error('[EXPENSES] Error loading expenses:', error);
		} finally {
			loading = false;
		}
	}

	function formatDateTime(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	// Auto-generate title based on form fields
	let autoTitle = $derived.by(() => {
		const currentDate = new Date(date);
		const formattedDate = formatDateTime(currentDate.toISOString());
		
		// Start with person if selected
		let titleParts: string[] = [];
		
		if (personId) {
			const person = people.find(p => p.id === personId);
			if (person) titleParts.push(person.name);
		}
		
		// Add category-specific metadata
		if (category === 'retail' && store) {
			titleParts.push(store);
		} else if (category === 'subscription' && service) {
			titleParts.push(service);
		} else if (relatedType === 'appointment' && appointmentId) {
			const apt = appointments.find(a => a.id === appointmentId);
			if (apt) titleParts.push(apt.title);
		} else if (relatedType === 'trip' && tripId) {
			const trip = trips.find(t => t.id === tripId);
			if (trip) titleParts.push(trip.title);
		} else if (relatedType === 'shift' && shiftId) {
			const shift = shifts.find(s => s.id === shiftId);
			if (shift) titleParts.push(shift.expand?.job?.name || 'Shift');
		}
		
		// Add category if no specific metadata
		if (titleParts.length === 0) {
			titleParts.push(category.charAt(0).toUpperCase() + category.slice(1));
		}
		
		// Add expense type
		titleParts.push(expenseType === 'income' ? 'Income' : 'Expense');
		
		// Add date
		titleParts.push(formattedDate);
		
		return titleParts.join(' - ');
	});

	function handlePersonChange(id: string) {
		if (!id) return;
		// Person is now just selected, no auto-population needed
		// Notes will be auto-generated on submit
	}

	async function openReceiptModal(expense: ExpenseExpanded) {
		if (!expense.receipt) return;
		const receiptUrl = pb.files.getURL(expense, expense.receipt);
		const filename = expense.receipt;
		
		try {
			// Fetch the file as a blob to bypass ad-blocker
			const response = await fetch(receiptUrl);
			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			
			selectedReceipt = {
				url: blobUrl,
				filename: filename
			};
			receiptModalOpen = true;
		} catch (error) {
			console.error('Error loading receipt:', error);
			alert('Failed to load receipt. Please try again.');
		}
	}

	function editExpense(expense: ExpenseExpanded) {
		editingExpense = expense;
		
		// Populate form with expense data
		title = expense.title;
		amount = expense.amount.toString();
		expenseType = expense.type || 'expense';
		category = expense.category || 'medical';
		date = expense.date ? new Date(expense.date).toISOString().slice(0, 16) : getDefaultDateTime();
		notes = expense.notes || '';
		
		// Set person (required)
		personId = expense.for || '';
		
		// Set related context
		if (expense.appointment) {
			relatedType = 'appointment';
			appointmentId = expense.appointment;
		} else if (expense.trip) {
			relatedType = 'trip';
			tripId = expense.trip;
		} else if (expense.shift) {
			relatedType = 'shift';
			shiftId = expense.shift;
		} else {
			relatedType = '';
		}
		
		// Parse store/service from notes if present
		if (expense.notes) {
			const storeMatch = expense.notes.match(/^Store: (.+)/m);
			const serviceMatch = expense.notes.match(/^Service: (.+)/m);
			if (storeMatch) store = storeMatch[1];
			if (serviceMatch) service = serviceMatch[1];
		}
		
		dialogOpen = true;
	}

	function confirmDelete(expense: ExpenseExpanded) {
		expenseToDelete = expense;
		deleteModalOpen = true;
	}

	async function deleteExpense() {
		if (!expenseToDelete) return;
		
		try {
			await pb.collection('expenses').delete(expenseToDelete.id);
			await loadExpenses();
			deleteModalOpen = false;
			expenseToDelete = null;
		} catch (error) {
			console.error('Error deleting expense:', error);
			alert('Failed to delete expense. Please try again.');
		}
	}

	async function handleRelatedChange(type: string, id: string) {
		if (!id) return;

		try {
			switch (type) {
				case 'appointment': {
					const apt = appointments.find(a => a.id === id);
					if (apt) {
						if (apt.start) {
							date = apt.start.slice(0, 16);
						}
						category = apt.type === 'medical' ? 'medical' : 'other';
					}
					break;
				}
				case 'trip': {
					const trip = trips.find(t => t.id === id);
					if (trip) {
						if (trip.depart_at) {
							date = trip.depart_at.slice(0, 16);
						}
						category = 'travel';
					}
					break;
				}
				case 'shift': {
					const shift = shifts.find(s => s.id === id);
					if (shift) {
						if (shift.start) {
							date = shift.start.slice(0, 16);
						}
						expenseType = 'income';
					}
					break;
				}
			}
		} catch (error) {
			console.error('[EXPENSES] Error auto-populating from related:', error);
		}
	}

	// Expenses loaded from PocketBase
	let expenses: ExpenseExpanded[] = $state([]);

	// Filters
	let filterType = $state<'all' | 'income' | 'expense'>('all');
	let filterCategory = $state<string>('all');
	let filterPerson = $state<string>('all');

	const categoryColors: Record<string, string> = {
		medical: 'bg-red-100 text-red-800',
		travel: 'bg-blue-100 text-blue-800',
		food: 'bg-orange-100 text-orange-800',
		transportation: 'bg-purple-100 text-purple-800',
		lodging: 'bg-indigo-100 text-indigo-800',
		entertainment: 'bg-pink-100 text-pink-800',
		retail: 'bg-green-100 text-green-800',
		subscription: 'bg-cyan-100 text-cyan-800',
		other: 'bg-gray-100 text-gray-800'
	};

	// Filtered expenses
	let filteredExpenses = $derived(
		expenses.filter((e) => {
			if (filterType !== 'all' && e.type !== filterType) return false;
			if (filterCategory !== 'all' && e.category !== filterCategory) return false;
			if (filterPerson !== 'all' && e.for !== filterPerson) return false;
			return true;
		})
	);

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
			if (!amount || !date) {
				alert('Please fill in all required fields');
				return;
			}
			
			// Validate person is selected (required)
			if (!personId) {
				alert('Please select who this expense is for');
				return;
			}
			
			// Validate related reference ID if type is selected
			if (relatedType === 'appointment' && !appointmentId) {
				alert('Please select an appointment');
				return;
			}
			if (relatedType === 'trip' && !tripId) {
				alert('Please select a trip');
				return;
			}
			if (relatedType === 'shift' && !shiftId) {
				alert('Please select a shift');
				return;
			}
			
			// Validate category-specific required fields
			if (category === 'retail' && !store) {
				alert('Please select a store for retail expenses');
				return;
			}
			if (category === 'subscription' && !service) {
				alert('Please select a service for subscription expenses');
				return;
			}

			// Convert datetime-local format to ISO 8601
			const expenseDate = new Date(date);
			if (isNaN(expenseDate.getTime())) {
				alert('Invalid date format');
				return;
			}

			const formData = new FormData();
			formData.append('title', autoTitle);
			formData.append('amount', amount.toString());
			formData.append('type', expenseType);
			formData.append('date', expenseDate.toISOString());
			formData.append('active', 'true');
			
			// Optional fields
			if (category) formData.append('category', category);
			
			// Auto-generate comprehensive notes
			let autoNotes: string[] = [];
			
			// Add type and amount
			autoNotes.push(`Type: ${expenseType === 'income' ? 'Income' : 'Expense'}`);
			autoNotes.push(`Amount: $${parseFloat(amount).toFixed(2)}`);
			
			// Add category
			autoNotes.push(`Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`);
			
			// Add category-specific metadata
			if (category === 'retail' && store) {
				autoNotes.push(`Store: ${store}`);
			} else if (category === 'subscription' && service) {
				autoNotes.push(`Service: ${service}`);
			}
			
			// Add date
			autoNotes.push(`Date: ${formatDateTime(expenseDate.toISOString())}`);
			
			// Add person details (required)
			if (personId) {
				const person = people.find(p => p.id === personId);
				if (person) {
					autoNotes.push('');
					autoNotes.push(`For: ${person.name}`);
					if (person.email) autoNotes.push(`Email: ${person.email}`);
					if (person.phone) autoNotes.push(`Phone: ${person.phone}`);
				}
			}
			
			// Add related context (optional)
			if (relatedType === 'appointment' && appointmentId) {
				const apt = appointments.find(a => a.id === appointmentId);
				if (apt) {
					autoNotes.push('');
					autoNotes.push(`Related Appointment: ${apt.title}`);
					if (apt.location) autoNotes.push(`Location: ${apt.location}`);
					if (apt.phone) autoNotes.push(`Phone: ${apt.phone}`);
				}
			} else if (relatedType === 'trip' && tripId) {
				const trip = trips.find(t => t.id === tripId);
				if (trip) {
					autoNotes.push('');
					autoNotes.push(`Related Trip: ${trip.title}`);
					if (trip.origin) autoNotes.push(`From: ${trip.origin}`);
					if (trip.destination) autoNotes.push(`To: ${trip.destination}`);
					if (trip.transport_type) autoNotes.push(`Transport: ${trip.transport_type}`);
				}
			} else if (relatedType === 'shift' && shiftId) {
				const shift = shifts.find(s => s.id === shiftId);
				if (shift) {
					autoNotes.push('');
					const jobName = shift.expand?.job?.name || 'Shift';
					autoNotes.push(`Related Shift: ${jobName}`);
					if (shift.location) autoNotes.push(`Location: ${shift.location}`);
					if (shift.phone) autoNotes.push(`Phone: ${shift.phone}`);
				}
			}
			
			// Add user notes if provided
			if (notes) {
				autoNotes.push('');
				autoNotes.push('Additional Notes:');
				autoNotes.push(notes);
			}
			
			const finalNotes = autoNotes.join('\n');
			if (finalNotes) formData.append('notes', finalNotes);
			
			if (receiptFile) formData.append('receipt', receiptFile);
			
			// Add person (required - always set)
			if (personId) {
				formData.append('for', personId);
			}
			
			// Add related reference fields (optional)
			if (relatedType === 'appointment' && appointmentId) {
				formData.append('appointment', appointmentId);
			} else if (relatedType === 'trip' && tripId) {
				formData.append('trip', tripId);
			} else if (relatedType === 'shift' && shiftId) {
				formData.append('shift', shiftId);
			}

			if (editingExpense) {
				console.log('[EXPENSES] Updating expense with data:', Object.fromEntries(formData));
				await pb.collection('expenses').update(editingExpense.id, formData);
			} else {
				console.log('[EXPENSES] Creating expense with data:', Object.fromEntries(formData));
				await pb.collection('expenses').create(formData);
			}
			
			// Reload expenses from database
			await loadExpenses();
			
			// Reset form
			editingExpense = null;
			title = '';
			amount = '';
			expenseType = 'expense';
			category = 'medical';
			store = '';
			service = '';
			date = getDefaultDateTime();
			notes = '';
			receiptFile = null;
			personId = '';
			relatedType = '';
			appointmentId = '';
			tripId = '';
			shiftId = '';
			
			dialogOpen = false;
		} catch (error: any) {
			console.error('Error creating expense:', error);
			console.error('Error response:', error.response);
			console.error('Error data:', error.response?.data);
			alert(`Failed to create expense: ${JSON.stringify(error.response?.data || error.message)}`);
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
					<Button {...props} onclick={() => editingExpense = null}>
						<Plus class="mr-2 h-4 w-4" />
						Add Expense
					</Button>
				{/snippet}
			</DialogTrigger>
			<DialogContent class="max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{editingExpense ? 'Edit' : 'Add'} Expense/Income</DialogTitle>
					<DialogDescription>Track spending or income with optional receipt</DialogDescription>
				</DialogHeader>
				
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
					<div class="space-y-2">
						<Label for="person">For (Required)</Label>
						<select
							id="person"
							bind:value={personId}
							onchange={() => handlePersonChange(personId)}
							required
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							<option value="">Select person...</option>
							{#each people as person}
								<option value={person.id}>{person.name}</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<Label>Related to (Optional)</Label>
						<select
							bind:value={relatedType}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							<option value="">None</option>
							<option value="appointment">Appointment</option>
							<option value="trip">Trip</option>
							<option value="shift">Shift</option>
						</select>
					</div>

					{#if relatedType === 'appointment'}
						<div class="space-y-2">
							<Label>Select Appointment</Label>
							<select
								bind:value={appointmentId}
								onchange={() => handleRelatedChange('appointment', appointmentId)}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Choose an appointment...</option>
								{#each appointments as apt}
									<option value={apt.id}>{apt.title} - {new Date(apt.start).toLocaleDateString()}</option>
								{/each}
							</select>
						</div>
					{:else if relatedType === 'trip'}
						<div class="space-y-2">
							<Label>Select Trip</Label>
							<select
								bind:value={tripId}
								onchange={() => handleRelatedChange('trip', tripId)}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Choose a trip...</option>
								{#each trips as trip}
									<option value={trip.id}>{trip.title} - {new Date(trip.depart_at).toLocaleDateString()}</option>
								{/each}
							</select>
						</div>
					{:else if relatedType === 'shift'}
						<div class="space-y-2">
							<Label>Select Shift</Label>
							<select
								bind:value={shiftId}
								onchange={() => handleRelatedChange('shift', shiftId)}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Choose a shift...</option>
								{#each shifts as shift}
									<option value={shift.id}>{shift.expand?.job?.name || 'Shift'} - {new Date(shift.start).toLocaleDateString()}</option>
								{/each}
							</select>
						</div>
					{:else if relatedType === 'person'}
						<div class="space-y-2">
							<Label>Select Person</Label>
							<select
								bind:value={personId}
								onchange={() => handleRelatedChange('person', personId)}
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
						<Label for="title">Title (Auto-generated)</Label>
						<Input
							id="title"
							value={autoTitle}
							readonly
							class="bg-muted cursor-not-allowed"
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
						<select
							id="category"
							bind:value={category}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							<option value="medical">Medical</option>
							<option value="travel">Travel</option>
							<option value="food">Food</option>
							<option value="transportation">Transportation</option>
							<option value="lodging">Lodging</option>
							<option value="entertainment">Entertainment</option>
							<option value="retail">Retail</option>
							<option value="subscription">Subscription</option>
							<option value="other">Other</option>
						</select>
					</div>

					{#if category === 'retail'}
						<div class="space-y-2">
							<Label for="store">Store/Vendor</Label>
							<select
								id="store"
								bind:value={store}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Select store...</option>
								<option value="Ross">Ross</option>
								<option value="Target">Target</option>
								<option value="Ralphs">Ralphs</option>
								<option value="Marshalls">Marshalls</option>
								<option value="Walmart">Walmart</option>
								<option value="Vons">Vons</option>
								<option value="Costco">Costco</option>
								<option value="Amazon">Amazon</option>
								<option value="CVS">CVS</option>
								<option value="Walgreens">Walgreens</option>
								<option value="Dollar Tree">Dollar Tree</option>
								<option value="99 Cents Only">99 Cents Only</option>
								<option value="TJ Maxx">TJ Maxx</option>
								<option value="HomeGoods">HomeGoods</option>
								<option value="Other">Other</option>
							</select>
						</div>
					{:else if category === 'subscription'}
						<div class="space-y-2">
							<Label for="service">Service</Label>
							<select id="service" bind:value={service} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
								<option value="">Select service...</option>
								<option value="Ona">Ona</option>
								<option value="Gitpod">Gitpod</option>
								<option value="GitHub">GitHub</option>
								<option value="Railway">Railway</option>
								<option value="Fly.io">Fly.io</option>
								<option value="Vercel">Vercel</option>
								<option value="Netlify">Netlify</option>
								<option value="AWS">AWS</option>
								<option value="Google Cloud">Google Cloud</option>
								<option value="Azure">Azure</option>
								<option value="Twilio">Twilio</option>
								<option value="SendGrid">SendGrid</option>
								<option value="Stripe">Stripe</option>
								<option value="OpenAI">OpenAI</option>
								<option value="Anthropic">Anthropic</option>
								<option value="Netflix">Netflix</option>
								<option value="Spotify">Spotify</option>
								<option value="YouTube Premium">YouTube Premium</option>
								<option value="Apple iCloud">Apple iCloud</option>
								<option value="Google One">Google One</option>
								<option value="Dropbox">Dropbox</option>
								<option value="Adobe Creative Cloud">Adobe Creative Cloud</option>
								<option value="Microsoft 365">Microsoft 365</option>
								<option value="Zoom">Zoom</option>
								<option value="Slack">Slack</option>
								<option value="Other">Other</option>
							</select>
						</div>
					{/if}



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

	<!-- Filters -->
	<Card class="p-4">
		<div class="flex flex-col md:flex-row gap-4">
			<div class="flex-1">
				<Label class="text-xs text-muted-foreground mb-1">Type</Label>
				<select
					bind:value={filterType}
					class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<option value="all">All Types</option>
					<option value="income">Income Only</option>
					<option value="expense">Expenses Only</option>
				</select>
			</div>
			
			<div class="flex-1">
				<Label class="text-xs text-muted-foreground mb-1">Category</Label>
				<select
					bind:value={filterCategory}
					class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<option value="all">All Categories</option>
					<option value="medical">Medical</option>
					<option value="travel">Travel</option>
					<option value="food">Food</option>
					<option value="transportation">Transportation</option>
					<option value="lodging">Lodging</option>
					<option value="entertainment">Entertainment</option>
					<option value="retail">Retail</option>
					<option value="subscription">Subscription</option>
					<option value="other">Other</option>
				</select>
			</div>
			
			<div class="flex-1">
				<Label class="text-xs text-muted-foreground mb-1">Person</Label>
				<select
					bind:value={filterPerson}
					class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<option value="all">All People</option>
					{#each people as person}
						<option value={person.id}>{person.name}</option>
					{/each}
				</select>
			</div>
			
			{#if filterType !== 'all' || filterCategory !== 'all' || filterPerson !== 'all'}
				<div class="flex items-end">
					<Button
						variant="outline"
						size="sm"
						onclick={() => {
							filterType = 'all';
							filterCategory = 'all';
							filterPerson = 'all';
						}}
					>
						Clear Filters
					</Button>
				</div>
			{/if}
		</div>
	</Card>

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
		{#if filteredExpenses.length === 0}
			<Card class="p-8 text-center">
				<p class="text-muted-foreground">No expenses found matching your filters.</p>
			</Card>
		{/if}
		{#each filteredExpenses as expense}
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
								<button
									type="button"
									onclick={() => openReceiptModal(expense)}
									class="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
								>
									<Image class="h-4 w-4" />
									<span>View Receipt</span>
								</button>
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
						<Button variant="outline" size="sm" onclick={() => editExpense(expense)}>Edit</Button>
						<Button variant="outline" size="sm" onclick={() => confirmDelete(expense)}>Delete</Button>
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

<!-- Delete Confirmation Modal -->
<Dialog bind:open={deleteModalOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Expense</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete this expense? This action cannot be undone.
			</DialogDescription>
		</DialogHeader>
		
		{#if expenseToDelete}
			<div class="py-4">
				<p class="font-semibold">{expenseToDelete.title}</p>
				<p class="text-sm text-muted-foreground">
					{expenseToDelete.type === 'income' ? '+' : '-'}${expenseToDelete.amount.toFixed(2)}
				</p>
			</div>
		{/if}
		
		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => deleteModalOpen = false}>
				Cancel
			</Button>
			<Button variant="destructive" onclick={deleteExpense}>
				Delete
			</Button>
		</div>
	</DialogContent>
</Dialog>

<!-- Receipt Modal -->
<Dialog bind:open={receiptModalOpen}>
	<DialogContent class="max-w-4xl max-h-[90vh]">
		<DialogHeader>
			<DialogTitle>Receipt</DialogTitle>
			<DialogDescription>
				{selectedReceipt?.filename || 'View receipt'}
			</DialogDescription>
		</DialogHeader>
		
		{#if selectedReceipt}
			<div class="overflow-auto max-h-[70vh] flex items-center justify-center bg-gray-50 rounded-lg p-4">
				{#if selectedReceipt.filename.toLowerCase().endsWith('.pdf')}
					<div class="text-center space-y-4">
						<Receipt class="mx-auto h-16 w-16 text-muted-foreground" />
						<div>
							<h3 class="text-lg font-semibold">PDF Receipt</h3>
							<p class="text-sm text-muted-foreground mt-2">{selectedReceipt.filename}</p>
							<p class="text-xs text-muted-foreground mt-1">
								PDF preview is not available in this environment
							</p>
						</div>
						<div class="flex gap-2 justify-center">
							<Button onclick={() => {
								const link = document.createElement('a');
								link.href = selectedReceipt?.url || '';
								link.download = selectedReceipt?.filename || 'receipt';
								link.click();
							}}>
								<Receipt class="mr-2 h-4 w-4" />
								Download PDF
							</Button>
							<Button variant="outline" onclick={() => window.open(selectedReceipt?.url, '_blank')}>
								Open in New Tab
							</Button>
						</div>
					</div>
				{:else}
					<img
						src={selectedReceipt.url}
						alt="Receipt"
						class="max-w-full max-h-[70vh] object-contain rounded-lg"
					/>
				{/if}
			</div>
			
			<div class="flex justify-end gap-2 mt-4">
				<Button variant="outline" onclick={() => {
					if (selectedReceipt?.url.startsWith('blob:')) {
						URL.revokeObjectURL(selectedReceipt.url);
					}
					receiptModalOpen = false;
				}}>
					Close
				</Button>
				{#if !selectedReceipt.filename.toLowerCase().endsWith('.pdf')}
					<Button onclick={() => {
						const link = document.createElement('a');
						link.href = selectedReceipt?.url || '';
						link.download = selectedReceipt?.filename || 'receipt';
						link.click();
					}}>
						Download
					</Button>
				{/if}
			</div>
		{/if}
	</DialogContent>
</Dialog>
