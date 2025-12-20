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
	import { Plus, Receipt, TrendingUp, TrendingDown, DollarSign, Image, Camera, Upload, Link, Filter, Tag, User, Calendar, List, BarChart3, Pencil, ChevronDown, ChevronRight } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import { currentUser } from '$lib/auth';
	import type { ExpenseExpanded, Appointment, Trip, Shift, ShiftExpanded, Person, ServiceDetail, ServiceDetailExpanded } from '$lib/types';
	import { onMount } from 'svelte';
	import BankAccountsSummaryCard from '$lib/components/BankAccountsSummaryCard.svelte';
	import BankAccountsModal from '$lib/components/BankAccountsModal.svelte';
	import BudgetsSummaryCard from '$lib/components/BudgetsSummaryCard.svelte';
	import BudgetsModal from '$lib/components/BudgetsModal.svelte';
	import BudgetCard from '$lib/components/BudgetCard.svelte';

	let dialogOpen = $state(false);
	let saving = $state(false);
	let loading = $state(false);
	let loadingEdit = $state(false);
	let receiptModalOpen = $state(false);
	let selectedReceipt = $state<{ url: string; filename: string } | null>(null);
	let editingExpense = $state<ExpenseExpanded | null>(null);
	let deleteModalOpen = $state(false);
	let expenseToDelete = $state<ExpenseExpanded | null>(null);
	let summaryModalOpen = $state(false);
	let summaryModalType = $state<'income' | 'expense' | 'net'>('income');
	let summaryViewMode = $state<'list' | 'chart'>('list');
	let expandedCategory = $state<string | null>(null);
	let expandedPerson = $state<string | null>(null);
	let expandedStatus = $state<string | null>(null);

	// Form fields
	let title = $state('');
	let amount = $state('');
	let expenseType = $state<'income' | 'expense'>('expense');
	let category = $state<string>('retail');
	let store = $state('');
	let service = $state('');
	let serviceDetailId = $state('');
	let showNewServiceForm = $state(false);
	let newServiceLogin = $state('');
	let newServicePass = $state('');
	let newServiceType = $state<'online' | 'off_line' | 'other'>('online');
	let newServiceNotes = $state('');
	let date = $state(getDefaultDateTime());
	let notes = $state('');
	let receiptFile: File | null = $state(null);
	let status = $state<'upcoming' | 'paid' | 'canceled' | 'approved' | 'rejected'>('paid');
	let subcategory = $state('');
	let vendor = $state('');
	let recurring = $state(false);
	let budgetId = $state('');

	// Subcategory options based on category
	const subcategoryOptions: Record<string, string[]> = {
		lodging: ['mortgage', 'rent', 'hoa_fees', 'property_tax', 'home_insurance', 'hotel', 'airbnb'],
		utilities: ['electric', 'gas', 'water', 'internet', 'phone', 'trash', 'sewer', 'hoa_fees'],
		transportation: ['car_payment', 'gas_fuel', 'car_insurance', 'maintenance', 'parking', 'tolls', 'public_transit'],
		food: ['groceries', 'dining_out', 'fast_food', 'coffee'],
		medical: ['doctor', 'pharmacy', 'hospital', 'dental', 'vision', 'therapy'],
		subscription: ['streaming', 'software', 'membership', 'gym'],
		insurance: ['car_insurance', 'home_insurance', 'health_insurance', 'life_insurance'],
		travel: ['plane', 'nfl_store'],
		other: ['other']
	};

	// Get filtered subcategories based on selected category
	let filteredSubcategories = $derived(() => {
		return subcategoryOptions[category] || ['other'];
	});

	// Update category default when type changes
	$effect(() => {
		if (expenseType === 'income' && !['salary', 'business_income', 'investment', 'refund', 'gift', 'bank_transfer', 'rental_income', 'freelance', 'bank', 'savings', 'business', 'apple_transfer', 'alexis', 'ona', 'other_income'].includes(category)) {
			category = 'salary';
			budgetId = ''; // Clear budget when switching to income
		} else if (expenseType === 'expense' && !['medical', 'travel', 'food', 'transportation', 'lodging', 'entertainment', 'retail', 'subscription', 'utilities', 'insurance', 'bank', 'savings', 'business', 'apple_transfer', 'alexis', 'ona', 'other'].includes(category)) {
			category = 'retail';
		}
	});
	
	// Required: Who is this expense for
	let personId = $state('');
	
	// Optional: Related to appointment/trip/shift/service
	let relatedType = $state<'' | 'appointment' | 'trip' | 'shift' | 'service'>('');
	let appointmentId = $state('');
	let tripId = $state('');
	let shiftId = $state('');
	let relatedServiceId = $state('');
	
	// Reference data
	let appointments = $state<Appointment[]>([]);
	let trips = $state<Trip[]>([]);
	let shifts = $state<ShiftExpanded[]>([]);
	let people = $state<Person[]>([]);
	let serviceDetails = $state<ServiceDetailExpanded[]>([]);

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
		console.log('[EXPENSES] Component mounted');
		console.log('[EXPENSES] PocketBase URL:', import.meta.env.VITE_POCKETBASE_URL);
		await loadReferenceData();
		await loadExpenses();
		
		// Auto-select current user as the person for form and filter
		if ($currentUser && $currentUser.email) {
			const userPerson = people.find(p => p.email === $currentUser.email);
			if (userPerson) {
				personId = userPerson.id;
				filterPerson = userPerson.id;
				console.log('[EXPENSES] Auto-selected person:', userPerson.name);
			}
		}
		
		// Check for edit parameter in URL
		const urlParams = new URLSearchParams(window.location.search);
		const editId = urlParams.get('edit');
		if (editId) {
			console.log('[EXPENSES] Edit parameter found:', editId);
			loadingEdit = true;
			const expenseToEdit = expenses.find(e => e.id === editId);
			if (expenseToEdit) {
				console.log('[EXPENSES] Opening edit dialog for expense:', expenseToEdit.title);
				// Use setTimeout to ensure DOM is ready
				setTimeout(() => {
					editExpense(expenseToEdit);
					loadingEdit = false;
					console.log('[EXPENSES] Dialog opened, dialogOpen =', dialogOpen);
				}, 100);
				// Remove the edit parameter from URL
				window.history.replaceState({}, '', window.location.pathname);
			} else {
				console.warn('[EXPENSES] Expense not found with ID:', editId);
				loadingEdit = false;
			}
		}
	});

	async function loadReferenceData() {
		loading = true;
		try {
			console.log('[EXPENSES] Starting to load reference data...');
			console.log('[EXPENSES] PocketBase instance:', pb);
			console.log('[EXPENSES] PocketBase baseUrl:', pb.baseUrl);
			
			const results = await Promise.all([
				pb.collection('appointments').getFullList<Appointment>({ sort: '-start' }),
				pb.collection('trips').getFullList<Trip>({ sort: '-depart_at' }),
				pb.collection('shifts').getFullList<ShiftExpanded>({ sort: '-@rowid', expand: 'job' }),
				pb.collection('people').getFullList<Person>({ sort: 'name' }),
				pb.collection('srevice_details').getFullList<ServiceDetailExpanded>({ 
					sort: '-created',
					expand: 'person'
				}).catch(err => {
					console.error('[EXPENSES] Error loading service details:', err);
					return [];
				}),
				pb.collection('bank_accounts').getFullList({ sort: 'name' }).catch(err => {
					console.error('[EXPENSES] Error loading bank accounts:', err);
					console.error('[EXPENSES] Bank accounts error details:', err.message, err.status);
					return [];
				}),
				pb.collection('budgets').getFullList({ sort: 'name' }).catch(err => {
					console.error('[EXPENSES] Error loading budgets:', err);
					console.error('[EXPENSES] Budgets error details:', err.message, err.status);
					return [];
				})
			]);
			
			[appointments, trips, shifts, people, serviceDetails, bankAccounts, budgets] = results;
			
			console.log('[EXPENSES] Loaded appointments:', appointments.length);
			console.log('[EXPENSES] Loaded trips:', trips.length);
			console.log('[EXPENSES] Loaded shifts:', shifts.length);
			console.log('[EXPENSES] Loaded people:', people.length);
			console.log('[EXPENSES] Loaded service details:', serviceDetails.length);
			console.log('[EXPENSES] Loaded bank accounts:', bankAccounts.length, bankAccounts);
			console.log('[EXPENSES] Loaded budgets:', budgets.length, budgets);
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
				expand: 'appointment,trip,shift,for,service_detail'
			});
			
			// Auto-update status for expenses older than 30 days
			await autoUpdateExpenseStatus();
			
			// Calculate budget totals from expenses
			await updateBudgetTotals();
		} catch (error) {
			console.error('[EXPENSES] Error loading expenses:', error);
		} finally {
			loading = false;
		}
	}

	async function updateBudgetTotals() {
		// Calculate spent amount and days left for each budget from linked expenses
		for (const budget of budgets) {
			const budgetExpenses = expenses.filter(e => 
				e.budget === budget.id && 
				e.type === 'expense' &&
				e.status !== 'canceled' &&
				e.status !== 'rejected'
			);
			
			const totalSpent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
			
			// Initialize spent to 0 if null/undefined
			const currentSpent = budget.spent ?? 0;
			
			// Calculate days left (assume monthly budget, reset on 1st of month)
			const now = new Date();
			const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
			const daysLeft = Math.max(0, Math.ceil((lastDayOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
			
			// Update budget if spent amount or days_left changed
			const updates: any = {};
			if (currentSpent !== totalSpent) {
				updates.spent = totalSpent;
			}
			if (budget.days_left !== daysLeft) {
				updates.days_left = daysLeft;
			}
			
			if (Object.keys(updates).length > 0) {
				try {
					await pb.collection('budgets').update(budget.id, updates);
					if (updates.spent !== undefined) budget.spent = updates.spent;
					if (updates.days_left !== undefined) budget.days_left = updates.days_left;
					console.log(`[EXPENSES] Updated budget ${budget.name}: $${totalSpent}, ${daysLeft} days left`);
				} catch (error) {
					console.error(`[EXPENSES] Error updating budget ${budget.name}:`, error);
				}
			}
		}
	}

	async function autoUpdateExpenseStatus() {
		const now = new Date();
		const thirtyDaysAgo = new Date(now);
		thirtyDaysAgo.setDate(now.getDate() - 30);

		const expensesToUpdate = expenses.filter((e) => {
			const expenseDate = new Date(e.date);
			// Only update if expense is older than 30 days and status is not already 'approved'
			return expenseDate < thirtyDaysAgo && e.status !== 'approved' && e.status !== 'canceled' && e.status !== 'rejected';
		});

		if (expensesToUpdate.length > 0) {
			console.log(`[EXPENSES] Auto-updating ${expensesToUpdate.length} expenses to 'approved' status`);
			
			// Update each expense
			for (const expense of expensesToUpdate) {
				try {
					await pb.collection('expenses').update(expense.id, { status: 'approved' });
					expense.status = 'approved'; // Update local state
				} catch (error) {
					console.error(`[EXPENSES] Failed to auto-update expense ${expense.id}:`, error);
				}
			}
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
		
		// Extract only user notes (everything after "Additional Notes:")
		if (expense.notes) {
			const additionalNotesMatch = expense.notes.match(/Additional Notes:\n(.+)/s);
			notes = additionalNotesMatch ? additionalNotesMatch[1].trim() : '';
		} else {
			notes = '';
		}
		
		status = expense.status || 'paid';
		subcategory = expense.subcategory || '';
		vendor = expense.vendor || '';
		recurring = expense.recurring || false;
		budgetId = expense.budget || '';
		
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
		
		// Set service detail if present
		serviceDetailId = expense.service_detail || '';
		
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

	async function createServiceDetail(): Promise<string | null> {
		if (!service || !newServiceLogin) {
			alert('Please provide service name and login');
			return null;
		}
		
		if (!personId) {
			alert('Please select who this service is for');
			return null;
		}
		
		try {
			const serviceData = {
				type: newServiceType,
				login: newServiceLogin,
				pass: newServicePass,
				notes: newServiceNotes || `Service: ${service}`,
				person: personId
			};
			
			const created = await pb.collection('srevice_details').create<ServiceDetail>(serviceData);
			console.log('[EXPENSES] Created service detail:', created.id);
			
			// Reload service details
			await loadReferenceData();
			
			// Reset form
			newServiceLogin = '';
			newServicePass = '';
			newServiceType = 'online';
			newServiceNotes = '';
			showNewServiceForm = false;
			
			return created.id;
		} catch (error) {
			console.error('[EXPENSES] Error creating service detail:', error);
			alert('Failed to create service detail. Please try again.');
			return null;
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
				case 'service': {
					const service = serviceDetails.find(s => s.id === id);
					if (service) {
						// Auto-populate title with service name if empty
						if (!title && service.name) {
							title = service.name;
						}
						// Set category to subscription if not already set
						if (category === 'retail') {
							category = 'subscription';
						}
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
	let bankAccounts: any[] = $state([]);
	let budgets: any[] = $state([]);
	let bankAccountsModalOpen = $state(false);
	let budgetsModalOpen = $state(false);
	let budgetDetailModalOpen = $state(false);
	let selectedBudget = $state<any | null>(null);

	// Filters
	let filterType = $state<'all' | 'income' | 'expense'>('all');
	let filterPerson = $state<string>('all');
	let filterDateRange = $state<'60day' | 'all' | 'past30' | 'future30'>('60day');
	let filterStatus = $state<'all' | 'paid' | 'upcoming' | 'approved'>('upcoming');

	const categoryColors: Record<string, string> = {
		// Income categories
		salary: 'bg-emerald-100 text-emerald-800',
		business_income: 'bg-teal-100 text-teal-800',
		investment: 'bg-lime-100 text-lime-800',
		refund: 'bg-green-100 text-green-800',
		gift: 'bg-rose-100 text-rose-800',
		bank_transfer: 'bg-sky-100 text-sky-800',
		rental_income: 'bg-violet-100 text-violet-800',
		freelance: 'bg-fuchsia-100 text-fuchsia-800',
		bank: 'bg-blue-100 text-blue-800',
		savings: 'bg-green-100 text-green-800',
		business: 'bg-indigo-100 text-indigo-800',
		other_income: 'bg-slate-100 text-slate-800',
		// Expense categories
		medical: 'bg-red-100 text-red-800',
		travel: 'bg-blue-100 text-blue-800',
		food: 'bg-orange-100 text-orange-800',
		transportation: 'bg-purple-100 text-purple-800',
		lodging: 'bg-indigo-100 text-indigo-800',
		entertainment: 'bg-pink-100 text-pink-800',
		retail: 'bg-green-100 text-green-800',
		subscription: 'bg-cyan-100 text-cyan-800',
		utilities: 'bg-amber-100 text-amber-800',
		insurance: 'bg-yellow-100 text-yellow-800',
		other: 'bg-gray-100 text-gray-800'
	};

	// Helper function to check if expense is within date range
	function isWithinDateRange(expenseDate: string, range: string): boolean {
		const now = new Date();
		const expense = new Date(expenseDate);
		const thirtyDaysAgo = new Date(now);
		thirtyDaysAgo.setDate(now.getDate() - 30);
		const thirtyDaysFromNow = new Date(now);
		thirtyDaysFromNow.setDate(now.getDate() + 30);

		switch (range) {
			case '60day':
				return expense >= thirtyDaysAgo && expense <= thirtyDaysFromNow;
			case 'past30':
				return expense >= thirtyDaysAgo && expense <= now;
			case 'future30':
				return expense >= now && expense <= thirtyDaysFromNow;
			case 'all':
			default:
				return true;
		}
	}

	// Filtered expenses
	let filteredExpenses = $derived(
		expenses.filter((e) => {
			if (filterType !== 'all' && e.type !== filterType) return false;
			if (filterPerson !== 'all' && e.for !== filterPerson) return false;
			if (filterDateRange !== 'all' && !isWithinDateRange(e.date, filterDateRange)) return false;
			if (filterStatus !== 'all' && e.status !== filterStatus) return false;
			return true;
		})
	);

	// Calculate totals using $derived (based on filtered expenses)
	let totalIncome = $derived(
		filteredExpenses
			.filter((e) => e.type === 'income')
			.reduce((sum, e) => sum + e.amount, 0)
	);
	
	let totalExpenses = $derived(
		filteredExpenses
			.filter((e) => e.type === 'expense')
			.reduce((sum, e) => sum + e.amount, 0)
	);
	
	let netTotal = $derived(totalIncome - totalExpenses);

	// Calculate bank accounts total
	let bankAccountsTotal = $derived(
		bankAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)
	);

	// Calculate result amount (bank accounts + net total)
	let resultAmount = $derived(bankAccountsTotal + netTotal);

	// Get expenses for summary modal
	let summaryExpenses = $derived(() => {
		if (summaryModalType === 'income') {
			return filteredExpenses.filter(e => e.type === 'income');
		} else if (summaryModalType === 'expense') {
			return filteredExpenses.filter(e => e.type === 'expense');
		} else {
			return filteredExpenses;
		}
	});

	// Helper to get category breakdown
	function getCategoryBreakdown(expenses: ExpenseExpanded[]) {
		return Object.entries(
			expenses.reduce((acc, e) => {
				const cat = e.category || 'uncategorized';
				if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
				acc[cat].count++;
				acc[cat].total += e.amount;
				return acc;
			}, {} as Record<string, { count: number; total: number }>)
		).sort((a, b) => b[1].total - a[1].total);
	}

	// Helper to get person breakdown
	function getPersonBreakdown(expenses: ExpenseExpanded[]) {
		return Object.entries(
			expenses.reduce((acc, e) => {
				const personName = e.expand?.for?.name || 'Unknown';
				if (!acc[personName]) acc[personName] = { count: 0, total: 0 };
				acc[personName].count++;
				acc[personName].total += e.amount;
				return acc;
			}, {} as Record<string, { count: number; total: number }>)
		).sort((a, b) => b[1].total - a[1].total);
	}

	// Helper to get status breakdown
	function getStatusBreakdown(expenses: ExpenseExpanded[]) {
		return Object.entries(
			expenses.reduce((acc, e) => {
				const stat = e.status || 'no status';
				if (!acc[stat]) acc[stat] = { count: 0, total: 0 };
				acc[stat].count++;
				acc[stat].total += e.amount;
				return acc;
			}, {} as Record<string, { count: number; total: number }>)
		).sort((a, b) => b[1].total - a[1].total);
	}

	// Get max amounts for charts
	let maxCategoryAmount = $derived(() => {
		const breakdown = getCategoryBreakdown(summaryExpenses());
		return breakdown.length > 0 ? Math.max(...breakdown.map(([_, v]) => v.total)) : 1;
	});

	let maxPersonAmount = $derived(() => {
		const breakdown = getPersonBreakdown(summaryExpenses());
		return breakdown.length > 0 ? Math.max(...breakdown.map(([_, v]) => v.total)) : 1;
	});

	let maxStatusAmount = $derived(() => {
		const breakdown = getStatusBreakdown(summaryExpenses());
		return breakdown.length > 0 ? Math.max(...breakdown.map(([_, v]) => v.total)) : 1;
	});

	function formatCurrency(amount: number): string{
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

	function openBudgetDetail(budget: any) {
		selectedBudget = budget;
		budgetDetailModalOpen = true;
	}

	// Get expenses for selected budget
	let budgetExpenses = $derived(() => {
		if (!selectedBudget) return [];
		return expenses.filter(e => 
			e.budget === selectedBudget.id && 
			e.type === 'expense' &&
			e.status !== 'canceled' &&
			e.status !== 'rejected'
		).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	});

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
			
			// Create service detail if new service form is filled
			if (category === 'subscription' && showNewServiceForm && newServiceLogin) {
				const createdId = await createServiceDetail();
				if (createdId) {
					serviceDetailId = createdId;
				} else {
					return; // Stop if service detail creation failed
				}
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
			formData.append('status', status);
			
			// Optional fields
			if (category) formData.append('category', category);
			if (subcategory) formData.append('subcategory', subcategory);
			if (vendor) formData.append('vendor', vendor);
			if (budgetId) formData.append('budget', budgetId);
			formData.append('recurring', recurring.toString());
			
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
			
			// Add service detail relation if selected
			if (serviceDetailId) {
				formData.append('service_detail', serviceDetailId);
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
			
			// Reload budgets to show updated totals
			try {
				budgets = await pb.collection('budgets').getFullList({ sort: 'name' });
			} catch (error) {
				console.error('[EXPENSES] Error reloading budgets:', error);
			}
			
			// Reset form
			editingExpense = null;
			title = '';
			amount = '';
			expenseType = 'expense';
			category = 'retail';
			store = '';
			service = '';
			serviceDetailId = '';
			showNewServiceForm = false;
			newServiceLogin = '';
			newServicePass = '';
			newServiceType = 'online';
			newServiceNotes = '';
			date = getDefaultDateTime();
			notes = '';
			receiptFile = null;
			personId = '';
			relatedType = '';
			appointmentId = '';
			tripId = '';
			shiftId = '';
			relatedServiceId = '';
			status = 'paid';
			subcategory = '';
			vendor = '';
			recurring = false;
			budgetId = '';
			
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

<!-- Loading Edit Spinner -->
{#if loadingEdit}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
		<div class="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl flex flex-col items-center gap-4">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			<p class="text-lg font-medium text-gray-900 dark:text-gray-100">Loading expense...</p>
		</div>
	</div>
{/if}

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Expenses</h1>
			<p class="text-muted-foreground">Track income and expenses with receipts</p>
		</div>
		
		<Dialog bind:open={dialogOpen}>
			<DialogTrigger>
				<Button onclick={() => editingExpense = null}>
					<Plus class="mr-2 h-4 w-4" />
					Add Expense
				</Button>
			</DialogTrigger>
			<DialogContent class="max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{editingExpense ? 'Edit' : 'Add'} Transaction</DialogTitle>
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
							<option value="service">Service</option>
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
					{:else if relatedType === 'service'}
						<div class="space-y-2">
							<Label>Select Service</Label>
							<select
								bind:value={relatedServiceId}
								onchange={() => handleRelatedChange('service', relatedServiceId)}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Choose a service...</option>
								{#each serviceDetails as service}
									<option value={service.id}>
										{service.name || service.login || 'Unnamed Service'} 
										{#if service.expand?.person}
											- {service.expand.person.name}
										{/if}
									</option>
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
				{#if expenseType === 'income'}
					<option value="salary">Salary/Wages</option>
					<option value="business_income">Business Income</option>
					<option value="investment">Investment/Dividends</option>
					<option value="refund">Refund/Reimbursement</option>
					<option value="gift">Gift/Donation Received</option>
					<option value="bank_transfer">Bank Transfer In</option>
					<option value="rental_income">Rental Income</option>
					<option value="freelance">Freelance/Contract Work</option>
					<option value="bank">Bank Account</option>
					<option value="savings">Savings Account</option>
					<option value="business">Business Account</option>
					<option value="apple_transfer">Apple Transfer</option>
					<option value="alexis">Alexis</option>
					<option value="ona">Ona</option>
					<option value="other_income">Other Income</option>
				{:else}
					<option value="medical">Medical</option>
					<option value="travel">Travel</option>
					<option value="food">Food</option>
					<option value="transportation">Transportation</option>
					<option value="lodging">Lodging</option>
					<option value="entertainment">Entertainment</option>
					<option value="retail">Retail</option>
					<option value="subscription">Subscription</option>
					<option value="utilities">Utilities</option>
					<option value="insurance">Insurance</option>
					<option value="bank">Bank</option>
					<option value="savings">Savings</option>
					<option value="business">Business</option>
					<option value="apple_transfer">Apple Transfer</option>
					<option value="alexis">Alexis</option>
					<option value="ona">Ona</option>
					<option value="other">Other</option>
				{/if}
						</select>
					</div>


					<!-- Budget Selection (only for expenses) -->
					{#if expenseType === 'expense'}
						<div class="space-y-2">
							<Label for="budget">Budget (Optional)</Label>
							<select
								id="budget"
								bind:value={budgetId}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">No budget</option>
								{#each budgets as budget}
									<option value={budget.id}>
										{budget.name} - ${budget.spent ?? 0}/${budget.amount}
									</option>
								{/each}
							</select>
							<p class="text-xs text-muted-foreground">Link this expense to a budget to track spending</p>
						</div>
					{/if}

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
								<option value="NFL Store">NFL Store</option>
								<option value="Alexis">Alexis</option>
								<option value="Other">Other</option>
								<option value="Att">Att</option>
							</select>
						</div>

						<!-- Service Details Section -->
						<div class="space-y-2 border-t pt-4">
							<div class="flex items-center justify-between">
								<Label>Service Details (Login/Password)</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onclick={() => showNewServiceForm = !showNewServiceForm}
								>
									{showNewServiceForm ? 'Cancel' : '+ Add New'}
								</Button>
							</div>

							{#if !showNewServiceForm}
								<!-- Select existing service detail -->
								<select
									bind:value={serviceDetailId}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								>
									<option value="">No service details</option>
									{#each serviceDetails as detail}
										<option value={detail.id}>
											{detail.login} - {detail.expand?.person?.name || 'Unknown'} ({detail.type || 'online'})
										</option>
									{/each}
								</select>
								{#if serviceDetailId}
									{@const selectedDetail = serviceDetails.find(d => d.id === serviceDetailId)}
									{#if selectedDetail}
										<div class="text-xs space-y-1 p-2 bg-muted rounded-md">
											<div><strong>Login:</strong> {selectedDetail.login}</div>
											{#if selectedDetail.pass}
												<div><strong>Password:</strong> {selectedDetail.pass}</div>
											{/if}
											{#if selectedDetail.notes}
												<div><strong>Notes:</strong> {selectedDetail.notes}</div>
											{/if}
										</div>
									{/if}
								{/if}
							{:else}
								<!-- Create new service detail form -->
								<div class="space-y-3 p-3 border rounded-md bg-muted/50">
									<div class="space-y-2">
										<Label for="newServiceType">Type</Label>
										<select
											id="newServiceType"
											bind:value={newServiceType}
											class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
										>
											<option value="online">Online</option>
											<option value="off_line">Offline</option>
											<option value="other">Other</option>
										</select>
									</div>
									<div class="space-y-2">
										<Label for="newServiceLogin">Login/Username *</Label>
										<Input
											id="newServiceLogin"
											bind:value={newServiceLogin}
											placeholder="username or email"
											required
										/>
									</div>
									<div class="space-y-2">
										<Label for="newServicePass">Password</Label>
										<Input
											id="newServicePass"
											type="password"
											bind:value={newServicePass}
											placeholder="password"
										/>
									</div>
									<div class="space-y-2">
										<Label for="newServiceNotes">Notes</Label>
										<Textarea
											id="newServiceNotes"
											bind:value={newServiceNotes}
											placeholder="Additional notes about this service"
											rows={2}
										/>
									</div>
									<p class="text-xs text-muted-foreground">
										Service details will be linked to {people.find(p => p.id === personId)?.name || 'the selected person'} and created when you save the expense
									</p>
								</div>
							{/if}
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

				<div class="space-y-2">
					<Label for="status">Status</Label>
					<select
						id="status"
						bind:value={status}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value="paid">Paid</option>
						<option value="upcoming">Upcoming</option>
						<option value="approved">Approved</option>
						<option value="rejected">Rejected</option>
						<option value="canceled">Canceled</option>
					</select>
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
		<div class="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
			<span>Expenses older than 30 days are automatically marked as "approved"</span>
		</div>
		<div class="flex flex-col md:flex-row gap-4">
			<div class="flex-1">
				<Label class="text-xs text-muted-foreground mb-1 flex items-center gap-1">
				<Filter class="h-3 w-3" />
				Type
			</Label>
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
				<Label class="text-xs text-muted-foreground mb-1 flex items-center gap-1">
				<User class="h-3 w-3" />
				Person
			</Label>
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

		<div class="flex-1">
			<Label class="text-xs text-muted-foreground mb-1 flex items-center gap-1">
				<Calendar class="h-3 w-3" />
				Date Range
			</Label>
			<select
				bind:value={filterDateRange}
				class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			>
				<option value="60day">60-Day Window (±30 days)</option>
				<option value="past30">Past 30 Days</option>
				<option value="future30">Next 30 Days</option>
				<option value="all">All Time</option>
			</select>
		</div>
		<div class="flex-1">
			<Label class="text-xs text-muted-foreground mb-1 flex items-center gap-1">
				<List class="h-3 w-3" />
				Status
			</Label>
			<select
				bind:value={filterStatus}
				class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			>
				<option value="all">All Status</option>
				<option value="paid">Paid</option>
				<option value="upcoming">Upcoming</option>
				<option value="approved">Approved</option>
			</select>
		</div>
			{#if filterType !== 'all' || filterPerson !== 'all' || filterDateRange !== '60day' || filterStatus !== 'upcoming'}
				<div class="flex items-end">
					<Button
						variant="outline"
						size="sm"
						onclick={() => {
							filterType = 'all';
							filterDateRange = '60day';
							filterStatus = 'upcoming';
							// Reset filterPerson to current user
							if ($currentUser && $currentUser.email) {
								const userPerson = people.find(p => p.email === $currentUser.email);
								if (userPerson) {
									filterPerson = userPerson.id;
								} else {
									filterPerson = 'all';
								}
							} else {
								filterPerson = 'all';
							}
						}}
					>
						Clear Filters
					</Button>
				</div>
			{/if}
		</div>
	</Card>

	<!-- Summary Cards -->
	<div class="grid gap-4 md:grid-cols-4">
		<Card class="p-4 cursor-pointer hover:bg-accent transition-colors" onclick={() => { summaryModalType = 'income'; summaryModalOpen = true; }}>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Total Income</p>
					<p class="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
				</div>
				<TrendingUp class="h-8 w-8 text-green-600" />
			</div>
		</Card>

		<Card class="p-4 cursor-pointer hover:bg-accent transition-colors" onclick={() => { summaryModalType = 'expense'; summaryModalOpen = true; }}>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Total Expenses</p>
					<p class="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
				</div>
				<TrendingDown class="h-8 w-8 text-red-600" />
			</div>
		</Card>

		<Card class="p-4 cursor-pointer hover:bg-accent transition-colors" onclick={() => { summaryModalType = 'net'; summaryModalOpen = true; }}>
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

		<Card class="p-4 border-2 border-primary bg-primary/5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-semibold text-primary">Result Amount</p>
					<p class="text-xs text-muted-foreground mb-1">Assets + Net</p>
					<p class="text-2xl font-bold" class:text-green-600={resultAmount >= 0} class:text-red-600={resultAmount < 0}>
						{formatCurrency(resultAmount)}
					</p>
				</div>
				<div class="text-right">
					<p class="text-xs text-muted-foreground">Assets</p>
					<p class="text-sm font-semibold">{formatCurrency(bankAccountsTotal)}</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Bank Accounts Section -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold">Bank Accounts</h2>
		{#if bankAccounts.length > 0}
			<BankAccountsSummaryCard 
				accounts={bankAccounts}
				onclick={() => bankAccountsModalOpen = true}
			/>
		{:else}
			<Card class="p-8 text-center">
				<p class="text-muted-foreground">No bank accounts found. Loading: {loading}</p>
				<p class="text-xs text-muted-foreground mt-2">Check browser console for errors</p>
			</Card>
		{/if}
	</div>

	<!-- Bank Accounts Modal -->
	<BankAccountsModal 
		bind:open={bankAccountsModalOpen}
		accounts={bankAccounts}
		onOpenChange={(open) => bankAccountsModalOpen = open}
		onUpdate={async () => {
			// Reload bank accounts after update
			try {
				bankAccounts = await pb.collection('bank_accounts').getFullList({ sort: 'name' });
			} catch (error) {
				console.error('[EXPENSES] Error reloading bank accounts:', error);
			}
		}}
	/>

	<!-- Budgets Section -->
	{#if budgets.length > 0}
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Budgets</h2>
			<BudgetsSummaryCard 
				budgets={budgets}
				onclick={() => budgetsModalOpen = true}
			/>
		</div>
	{/if}

	<!-- Budgets Modal -->
	<BudgetsModal 
		bind:open={budgetsModalOpen}
		budgets={budgets}
		onOpenChange={(open) => budgetsModalOpen = open}
		onUpdate={async () => {
			// Reload budgets after creating new one
			try {
				budgets = await pb.collection('budgets').getFullList({ sort: 'name' });
			} catch (error) {
				console.error('[EXPENSES] Error reloading budgets:', error);
			}
		}}
		onBudgetClick={(budget) => {
			budgetsModalOpen = false;
			openBudgetDetail(budget);
		}}
	/>

	<!-- Budget Detail Modal -->
	<Dialog open={budgetDetailModalOpen} onOpenChange={(open) => budgetDetailModalOpen = open}>
		<DialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle class="text-2xl flex items-center justify-between">
					<div>
						<div>{selectedBudget?.name}</div>
						<div class="text-sm font-normal text-muted-foreground mt-1">
							{formatCurrency(selectedBudget?.spent ?? 0)} / {formatCurrency(selectedBudget?.amount ?? 0)}
						</div>
					</div>
				</DialogTitle>
			</DialogHeader>

			<div class="space-y-4">
				<!-- Budget Summary -->
				<Card class="p-4">
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm text-muted-foreground">Spent</p>
								<p class="text-2xl font-bold">{formatCurrency(selectedBudget?.spent ?? 0)}</p>
							</div>
							<div class="text-right">
								<p class="text-sm text-muted-foreground">Budget</p>
								<p class="text-xl font-semibold">{formatCurrency(selectedBudget?.amount ?? 0)}</p>
							</div>
						</div>
						
						{#if selectedBudget}
							{@const percent = selectedBudget.amount > 0 ? (selectedBudget.spent / selectedBudget.amount) * 100 : 0}
							{@const remaining = selectedBudget.amount - selectedBudget.spent}
							<div class="space-y-1">
								<div class="h-3 bg-accent rounded-full overflow-hidden">
									<div 
										class="h-full transition-all duration-300"
										class:bg-green-500={percent < 75}
										class:bg-yellow-500={percent >= 75 && percent < 90}
										class:bg-orange-500={percent >= 90 && percent < 100}
										class:bg-red-500={percent >= 100}
										style="width: {Math.min(percent, 100)}%"
									></div>
								</div>
								<div class="flex items-center justify-between text-sm text-muted-foreground">
									<span>{Math.round(percent)}% used</span>
									<span>{formatCurrency(remaining)} remaining</span>
								</div>
								{#if selectedBudget.days_left !== undefined}
									<p class="text-xs text-muted-foreground text-center">{selectedBudget.days_left} days left</p>
								{/if}
							</div>
						{/if}
					</div>
				</Card>

				<!-- Expenses List -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold text-lg">Expenses ({budgetExpenses().length})</h3>
						<Button 
							size="sm"
							onclick={() => {
								if (selectedBudget) {
									// Pre-fill form with budget data
									category = selectedBudget.category || 'other';
									subcategory = '';
									vendor = '';
									store = '';
									service = '';
									expenseType = 'expense';
									status = 'paid';
									// Reset other fields
									title = '';
									amount = '';
									date = getDefaultDateTime();
									notes = `Budget: ${selectedBudget.name}`;
									receiptFile = null;
									editingExpense = null;
									// Close budget modal and open expense form
									budgetDetailModalOpen = false;
									dialogOpen = true;
								}
							}}
						>
							<Plus class="h-4 w-4 mr-1" />
							Add {selectedBudget?.name} Expense
						</Button>
					</div>
					
					{#if budgetExpenses().length === 0}
						<Card class="p-8 text-center">
							<p class="text-muted-foreground">No expenses linked to this budget yet</p>
						</Card>
					{:else}
						<div class="space-y-2">
							{#each budgetExpenses() as expense}
								<Card class="p-4 hover:bg-accent/50 transition-colors">
									<div class="flex items-start justify-between gap-3">
										<div class="flex-1">
											<div class="flex items-center gap-2">
												<h4 class="font-medium">{expense.title || expense.category}</h4>
												{#if expense.status === 'paid'}
													<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Paid</span>
												{:else if expense.status === 'upcoming'}
													<span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Upcoming</span>
												{:else if expense.status === 'approved'}
													<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Approved</span>
												{/if}
											</div>
											<div class="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
												<span>{formatDate(expense.date)}</span>
												{#if expense.expand?.for}
													<span>• {expense.expand.for.name}</span>
												{/if}
												{#if expense.category}
													<span>• {expense.category}</span>
												{/if}
												{#if expense.vendor}
													<span>• {expense.vendor}</span>
												{/if}
											</div>
											{#if expense.notes}
												<p class="text-sm text-muted-foreground mt-1">{expense.notes}</p>
											{/if}
										</div>
										<div class="flex items-center gap-2">
											<div class="text-right">
												<p class="text-lg font-semibold">{formatCurrency(expense.amount)}</p>
											</div>
											<Button 
												variant="ghost" 
												size="icon"
												class="h-8 w-8 shrink-0"
												onclick={() => {
													editExpense(expense);
													budgetDetailModalOpen = false;
												}}
												title="Edit expense"
											>
												<Pencil class="h-4 w-4" />
											</Button>
										</div>
									</div>
								</Card>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</DialogContent>
	</Dialog>

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
							{#if expense.status}
								<span 
									class="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
									class:bg-green-100={expense.status === 'paid'}
									class:text-green-800={expense.status === 'paid'}
									class:bg-blue-100={expense.status === 'upcoming'}
									class:text-blue-800={expense.status === 'upcoming'}
									class:bg-purple-100={expense.status === 'approved'}
									class:text-purple-800={expense.status === 'approved'}
									class:bg-red-100={expense.status === 'rejected'}
									class:text-red-800={expense.status === 'rejected'}
									class:bg-gray-100={expense.status === 'canceled'}
									class:text-gray-800={expense.status === 'canceled'}
								>
									{expense.status}
								</span>
							{/if}
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

<!-- Summary Breakdown Modal -->
<Dialog bind:open={summaryModalOpen}>
	<DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<div class="flex items-start justify-between">
				<div>
					<DialogTitle>
						{#if summaryModalType === 'income'}
							Income Breakdown - {formatCurrency(totalIncome)}
						{:else if summaryModalType === 'expense'}
							Expense Breakdown - {formatCurrency(totalExpenses)}
						{:else}
							Net Total Breakdown - {formatCurrency(netTotal)}
						{/if}
					</DialogTitle>
					<DialogDescription>
						Detailed breakdown of {summaryModalType === 'income' ? 'income' : summaryModalType === 'expense' ? 'expenses' : 'all transactions'} based on current filters
					</DialogDescription>
				</div>
				<div class="flex gap-1 bg-muted rounded-lg p-1">
					<button
						type="button"
						class="px-3 py-1.5 rounded transition-colors {summaryViewMode === 'list' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}"
						onclick={() => summaryViewMode = 'list'}
					>
						<List class="h-4 w-4" />
					</button>
					<button
						type="button"
						class="px-3 py-1.5 rounded transition-colors {summaryViewMode === 'chart' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}"
						onclick={() => summaryViewMode = 'chart'}
					>
						<BarChart3 class="h-4 w-4" />
					</button>
				</div>
			</div>
		</DialogHeader>

		<div class="space-y-4">
			<!-- Summary by Category -->
			<div>
				<h3 class="font-semibold mb-3">By Category</h3>
				{#if summaryViewMode === 'list'}
					<div class="grid gap-2">
						{#each Object.entries(
							summaryExpenses().reduce((acc, e) => {
								const cat = e.category || 'uncategorized';
								if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
								acc[cat].count++;
								acc[cat].total += e.amount;
								return acc;
							}, {} as Record<string, { count: number; total: number }>)
						).sort((a, b) => b[1].total - a[1].total) as category}
							<div class="space-y-2">
								<button 
									class="w-full flex items-center justify-between p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
									onclick={() => expandedCategory = expandedCategory === category[0] ? null : category[0]}
								>
									<div class="flex items-center gap-2">
										{#if expandedCategory === category[0]}
											<ChevronDown class="h-4 w-4" />
										{:else}
											<ChevronRight class="h-4 w-4" />
										{/if}
										<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {categoryColors[category[0]] || 'bg-gray-100 text-gray-800'}">
											{category[0]}
										</span>
										<span class="text-sm text-muted-foreground">({category[1].count} items)</span>
									</div>
									<span class="font-semibold">{formatCurrency(category[1].total)}</span>
								</button>
								
								{#if expandedCategory === category[0]}
									<div class="ml-6 space-y-2">
										{#each summaryExpenses().filter(e => (e.category || 'uncategorized') === category[0]) as expense}
											<Card class="p-3 hover:bg-accent/50 transition-colors">
												<div class="flex items-start justify-between gap-2">
													<div class="flex-1">
														<div class="font-medium text-sm">{expense.title}</div>
														<div class="text-xs text-muted-foreground">{formatDate(expense.date)}</div>
														{#if expense.notes}
															<p class="text-xs text-muted-foreground mt-1 line-clamp-1">{expense.notes}</p>
														{/if}
													</div>
													<div class="flex items-center gap-2">
														<span class="font-semibold text-sm">{formatCurrency(expense.amount)}</span>
														<Button 
															variant="ghost" 
															size="icon"
															class="h-6 w-6 shrink-0"
															onclick={(e) => {
																e.stopPropagation();
																editExpense(expense);
																summaryModalOpen = false;
															}}
															title="Edit expense"
														>
															<Pencil class="h-3 w-3" />
														</Button>
													</div>
												</div>
											</Card>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="space-y-2">
						{#each Object.entries(
							summaryExpenses().reduce((acc, e) => {
								const cat = e.category || 'uncategorized';
								if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
								acc[cat].count++;
								acc[cat].total += e.amount;
								return acc;
							}, {} as Record<string, { count: number; total: number }>)
						).sort((a, b) => b[1].total - a[1].total) as category}
							<div class="space-y-1">
								<div class="flex items-center justify-between text-sm">
									<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {categoryColors[category[0]] || 'bg-gray-100 text-gray-800'}">
										{category[0]}
									</span>
									<span class="font-semibold">{formatCurrency(category[1].total)}</span>
								</div>
								<div class="h-8 bg-accent rounded-lg overflow-hidden">
									<div 
										class="h-full bg-primary transition-all duration-300"
										style="width: {(category[1].total / maxCategoryAmount()) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Summary by Person -->
			<div>
				<h3 class="font-semibold mb-3">By Person</h3>
				{#if summaryViewMode === 'list'}
					<div class="grid gap-2">
						{#each Object.entries(
							summaryExpenses().reduce((acc, e) => {
								const personName = e.expand?.for?.name || 'Unknown';
								if (!acc[personName]) acc[personName] = { count: 0, total: 0 };
								acc[personName].count++;
								acc[personName].total += e.amount;
								return acc;
							}, {} as Record<string, { count: number; total: number }>)
						).sort((a, b) => b[1].total - a[1].total) as person}
							<div class="space-y-2">
								<button 
									class="w-full flex items-center justify-between p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
									onclick={() => expandedPerson = expandedPerson === person[0] ? null : person[0]}
								>
									<div class="flex items-center gap-2">
										{#if expandedPerson === person[0]}
											<ChevronDown class="h-4 w-4" />
										{:else}
											<ChevronRight class="h-4 w-4" />
										{/if}
										<span class="font-medium">{person[0]}</span>
										<span class="text-sm text-muted-foreground">({person[1].count} items)</span>
									</div>
									<span class="font-semibold">{formatCurrency(person[1].total)}</span>
								</button>
								
								{#if expandedPerson === person[0]}
									<div class="ml-6 space-y-2">
										{#each summaryExpenses().filter(e => (e.expand?.for?.name || 'Unknown') === person[0]) as expense}
											<Card class="p-3 hover:bg-accent/50 transition-colors">
												<div class="flex items-start justify-between gap-2">
													<div class="flex-1">
														<div class="font-medium text-sm">{expense.title}</div>
														<div class="text-xs text-muted-foreground">{formatDate(expense.date)}</div>
														{#if expense.notes}
															<p class="text-xs text-muted-foreground mt-1 line-clamp-1">{expense.notes}</p>
														{/if}
													</div>
													<div class="flex items-center gap-2">
														<span class="font-semibold text-sm">{formatCurrency(expense.amount)}</span>
														<Button 
															variant="ghost" 
															size="icon"
															class="h-6 w-6 shrink-0"
															onclick={(e) => {
																e.stopPropagation();
																editExpense(expense);
																summaryModalOpen = false;
															}}
															title="Edit expense"
														>
															<Pencil class="h-3 w-3" />
														</Button>
													</div>
												</div>
											</Card>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="space-y-2">
						{#each Object.entries(
							summaryExpenses().reduce((acc, e) => {
								const personName = e.expand?.for?.name || 'Unknown';
								if (!acc[personName]) acc[personName] = { count: 0, total: 0 };
								acc[personName].count++;
								acc[personName].total += e.amount;
								return acc;
							}, {} as Record<string, { count: number; total: number }>)
						).sort((a, b) => b[1].total - a[1].total) as person}
							<div class="space-y-1">
								<div class="flex items-center justify-between text-sm">
									<span class="font-medium">{person[0]}</span>
									<span class="font-semibold">{formatCurrency(person[1].total)}</span>
								</div>
								<div class="h-8 bg-accent rounded-lg overflow-hidden">
									<div 
										class="h-full bg-blue-500 transition-all duration-300"
										style="width: {(person[1].total / maxPersonAmount()) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Summary by Status -->
			<div>
				<h3 class="font-semibold mb-3">By Status</h3>
				{#if summaryViewMode === 'list'}
					<div class="grid gap-2">
						{#each Object.entries(
							summaryExpenses().reduce((acc, e) => {
								const stat = e.status || 'no status';
								if (!acc[stat]) acc[stat] = { count: 0, total: 0 };
								acc[stat].count++;
								acc[stat].total += e.amount;
								return acc;
							}, {} as Record<string, { count: number; total: number }>)
						).sort((a, b) => b[1].total - a[1].total) as status}
							<div class="space-y-2">
								<button 
									class="w-full flex items-center justify-between p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
									onclick={() => expandedStatus = expandedStatus === status[0] ? null : status[0]}
								>
									<div class="flex items-center gap-2">
										{#if expandedStatus === status[0]}
											<ChevronDown class="h-4 w-4" />
										{:else}
											<ChevronRight class="h-4 w-4" />
										{/if}
										<span 
											class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
											class:bg-green-100={status[0] === 'paid'}
											class:text-green-800={status[0] === 'paid'}
											class:bg-blue-100={status[0] === 'upcoming'}
											class:text-blue-800={status[0] === 'upcoming'}
											class:bg-purple-100={status[0] === 'approved'}
											class:text-purple-800={status[0] === 'approved'}
											class:bg-red-100={status[0] === 'rejected'}
											class:text-red-800={status[0] === 'rejected'}
											class:bg-gray-100={status[0] === 'canceled' || status[0] === 'no status'}
											class:text-gray-800={status[0] === 'canceled' || status[0] === 'no status'}
										>
											{status[0]}
										</span>
										<span class="text-sm text-muted-foreground">({status[1].count} items)</span>
									</div>
									<span class="font-semibold">{formatCurrency(status[1].total)}</span>
								</button>
								
								{#if expandedStatus === status[0]}
									<div class="ml-6 space-y-2">
										{#each summaryExpenses().filter(e => (e.status || 'no status') === status[0]) as expense}
											<Card class="p-3 hover:bg-accent/50 transition-colors">
												<div class="flex items-start justify-between gap-2">
													<div class="flex-1">
														<div class="font-medium text-sm">{expense.title}</div>
														<div class="text-xs text-muted-foreground">{formatDate(expense.date)}</div>
														{#if expense.notes}
															<p class="text-xs text-muted-foreground mt-1 line-clamp-1">{expense.notes}</p>
														{/if}
													</div>
													<div class="flex items-center gap-2">
														<span class="font-semibold text-sm">{formatCurrency(expense.amount)}</span>
														<Button 
															variant="ghost" 
															size="icon"
															class="h-6 w-6 shrink-0"
															onclick={(e) => {
																e.stopPropagation();
																editExpense(expense);
																summaryModalOpen = false;
															}}
															title="Edit expense"
														>
															<Pencil class="h-3 w-3" />
														</Button>
													</div>
												</div>
											</Card>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="space-y-2">
						{#each Object.entries(
							summaryExpenses().reduce((acc, e) => {
								const stat = e.status || 'no status';
								if (!acc[stat]) acc[stat] = { count: 0, total: 0 };
								acc[stat].count++;
								acc[stat].total += e.amount;
								return acc;
							}, {} as Record<string, { count: number; total: number }>)
						).sort((a, b) => b[1].total - a[1].total) as status}
							<div class="space-y-1">
								<div class="flex items-center justify-between text-sm">
									<span 
										class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
										class:bg-green-100={status[0] === 'paid'}
										class:text-green-800={status[0] === 'paid'}
										class:bg-blue-100={status[0] === 'upcoming'}
										class:text-blue-800={status[0] === 'upcoming'}
										class:bg-purple-100={status[0] === 'approved'}
										class:text-purple-800={status[0] === 'approved'}
										class:bg-red-100={status[0] === 'rejected'}
										class:text-red-800={status[0] === 'rejected'}
										class:bg-gray-100={status[0] === 'canceled' || status[0] === 'no status'}
										class:text-gray-800={status[0] === 'canceled' || status[0] === 'no status'}
									>
										{status[0]}
									</span>
									<span class="font-semibold">{formatCurrency(status[1].total)}</span>
								</div>
								<div class="h-8 bg-accent rounded-lg overflow-hidden">
									<div 
										class="h-full transition-all duration-300"
										class:bg-green-500={status[0] === 'paid'}
										class:bg-blue-500={status[0] === 'upcoming'}
										class:bg-purple-500={status[0] === 'approved'}
										class:bg-red-500={status[0] === 'rejected'}
										class:bg-gray-500={status[0] === 'canceled' || status[0] === 'no status'}
										style="width: {(status[1].total / maxStatusAmount()) * 100}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Total -->
			<div class="pt-4 border-t">
				<div class="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
					<span class="text-lg font-bold">Total</span>
					<span class="text-2xl font-bold">
						{formatCurrency(summaryExpenses().reduce((sum, e) => sum + e.amount, 0))}
					</span>
				</div>
			</div>
		</div>

		<div class="flex justify-end gap-2 pt-4">
			<Button variant="outline" onclick={() => summaryModalOpen = false}>
				Close
			</Button>
		</div>
	</DialogContent>
</Dialog>
