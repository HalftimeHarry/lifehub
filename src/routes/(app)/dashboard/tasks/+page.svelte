<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
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
	import { Plus, Filter, Users, ArrowUpDown, X, Pencil, Trash2, Clock, CheckCircle, XCircle, List } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import type { Task, TaskExpanded, Person } from '$lib/types';

	let tasks = $state<TaskExpanded[]>([]);
	let allTasks = $state<TaskExpanded[]>([]); // Store all tasks
	let people = $state<Person[]>([]);
	let loading = $state(true);
	let dialogOpen = $state(false);
	let saving = $state(false);
	let editingTask = $state<TaskExpanded | null>(null);
	let deleteDialogOpen = $state(false);
	let taskToDelete = $state<TaskExpanded | null>(null);
	
	// Pagination
	let currentPage = $state(1);
	let itemsPerPage = 5;
	
	// Paginated tasks
	let paginatedTasks = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return tasks.slice(start, end);
	});
	
	let totalPages = $derived(Math.ceil(tasks.length / itemsPerPage));

	// Filter states
	let statusFilter = $state<'all' | 'pending' | 'completed' | 'canceled'>('pending');
	let priorityFilter = $state<'all' | 'low' | 'med' | 'high'>('all');
	let assignedToFilter = $state('all');
	let sortBy = $state<'due' | 'priority' | 'title'>('due');

	// Form fields
	let title = $state('');
	let due = $state('');
	let priority = $state<'low' | 'med' | 'high'>('med');
	let notes = $state('');
	let color = $state('#f59e0b');
	let status = $state<'pending' | 'canceled' | 'completed'>('pending');
	let selectedPeople = $state<string[]>([]);
	let createdBy = $state('');

	onMount(async () => {
		await loadTasks();
		await loadPeople();
	});

	async function loadTasks() {
		try {
			loading = true;
			const records = await pb.collection('tasks').getFullList<TaskExpanded>({
				expand: 'assigned_to,created_by'
			});
			allTasks = records;
			applyFilters();
		} catch (error) {
			console.error('Error fetching tasks:', error);
		} finally {
			loading = false;
		}
	}

	function applyFilters() {
		let filtered = [...allTasks];

		// Filter by status
		if (statusFilter === 'pending') {
			filtered = filtered.filter(task => task.status === 'pending');
		} else if (statusFilter === 'completed') {
			filtered = filtered.filter(task => task.status === 'completed');
		} else if (statusFilter === 'canceled') {
			filtered = filtered.filter(task => task.status === 'canceled');
		}
		// 'all' shows everything

		// Filter by priority
		if (priorityFilter !== 'all') {
			filtered = filtered.filter(task => task.priority === priorityFilter);
		}

		// Filter by assigned person
		if (assignedToFilter !== 'all') {
			filtered = filtered.filter(task => 
				task.assigned_to?.includes(assignedToFilter)
			);
		}

		// Sort tasks
		filtered.sort((a, b) => {
			if (sortBy === 'due') {
				if (!a.due && !b.due) return 0;
				if (!a.due) return 1;
				if (!b.due) return -1;
				return new Date(a.due).getTime() - new Date(b.due).getTime();
			} else if (sortBy === 'priority') {
				const priorityOrder = { high: 0, med: 1, low: 2 };
				return priorityOrder[a.priority] - priorityOrder[b.priority];
			} else if (sortBy === 'title') {
				return a.title.localeCompare(b.title);
			}
			return 0;
		});

		tasks = filtered;
	}

	function clearFilters() {
		statusFilter = 'pending';
		priorityFilter = 'all';
		assignedToFilter = 'all';
		sortBy = 'due';
		applyFilters();
	}

	// Watch for filter changes
	$effect(() => {
		// Trigger when any filter changes
		showCompleted;
		priorityFilter;
		assignedToFilter;
		sortBy;
		
		if (allTasks.length > 0) {
			applyFilters();
		}
	});

	async function loadPeople() {
		try {
			const records = await pb.collection('people').getFullList<Person>({
				sort: 'name'
			});
			people = records;
		} catch (error) {
			console.error('Error fetching people:', error);
		}
	}

	async function handleSubmit() {
		if (!title.trim()) {
			alert('Please enter a task title');
			return;
		}

		saving = true;
		try {
			// Convert datetime-local format to ISO 8601 if due date is set
			const dueDate = due ? new Date(due) : null;

			const data = {
				title,
				due: dueDate ? dueDate.toISOString() : undefined,
				priority,
				color: color || undefined,
				notes: notes || undefined,
				status,
				done: editingTask ? editingTask.done : false,
				notify_offset_minutes: 1440,
				assigned_to: selectedPeople.length > 0 ? selectedPeople : undefined,
				created_by: createdBy || undefined,
				active: true
			};

			if (editingTask) {
				// Update existing task
				console.log('[TASKS] Updating task with data:', data);
				const record = await pb.collection('tasks').update<TaskExpanded>(editingTask.id, data, {
					expand: 'assigned_to,created_by'
				});
				
				// Update in all tasks and reapply filters
				allTasks = allTasks.map(t => t.id === editingTask.id ? record : t);
				applyFilters();
			} else {
				// Create new task
				console.log('[TASKS] Creating task with data:', data);
				const record = await pb.collection('tasks').create<TaskExpanded>(data, {
					expand: 'assigned_to,created_by'
				});
				
				// Add to all tasks and reapply filters
				allTasks = [record, ...allTasks];
				applyFilters();
			}
			
			// Reset form
			resetForm();
			dialogOpen = false;
		} catch (error) {
			console.error('Error saving task:', error);
			alert('Failed to save task');
		} finally {
			saving = false;
		}
	}

	function resetForm() {
		title = '';
		due = '';
		priority = 'med';
		color = '#f59e0b';
		notes = '';
		status = 'pending';
		selectedPeople = [];
		createdBy = '';
		editingTask = null;
	}

	function openEditDialog(task: TaskExpanded) {
		editingTask = task;
		title = task.title;
		due = task.due ? new Date(task.due).toISOString().slice(0, 16) : '';
		priority = task.priority;
		color = task.color || '#f59e0b';
		notes = task.notes || '';
		status = task.status || 'pending';
		selectedPeople = task.assigned_to || [];
		createdBy = task.created_by || '';
		dialogOpen = true;
	}

	function openDeleteDialog(task: TaskExpanded) {
		taskToDelete = task;
		deleteDialogOpen = true;
	}

	async function changeTaskStatus(task: TaskExpanded, newStatus: 'pending' | 'completed' | 'canceled') {
		try {
			await pb.collection('tasks').update(task.id, {
				status: newStatus
			});
			await loadTasks();
		} catch (error) {
			console.error('Error updating task status:', error);
			alert('Failed to update task status');
		}
	}

	async function toggleTaskCompletion(task: TaskExpanded) {
		try {
			const newCompletedStatus = !task.completed;
			const newStatus = newCompletedStatus ? 'completed' : 'pending';
			
			// Update in PocketBase
			await pb.collection('tasks').update(task.id, {
				completed: newCompletedStatus,
				status: newStatus
			});
			
			// Update local state
			task.completed = newCompletedStatus;
			task.status = newStatus;
			
			// Update in allTasks array
			const index = allTasks.findIndex(t => t.id === task.id);
			if (index !== -1) {
				allTasks[index] = { ...task };
			}
			
			// Reapply filters to update the view
			applyFilters();
		} catch (error) {
			console.error('Error toggling task completion:', error);
			alert('Failed to update task');
		}
	}

	async function confirmDelete() {
		if (!taskToDelete) return;
		
		try {
			await pb.collection('tasks').delete(taskToDelete.id);
			
			// Remove from all tasks and reapply filters
			allTasks = allTasks.filter(t => t.id !== taskToDelete.id);
			applyFilters();
			
			deleteDialogOpen = false;
			taskToDelete = null;
		} catch (error) {
			console.error('Error deleting task:', error);
			alert('Failed to delete task');
		}
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'high':
				return 'destructive';
			case 'med':
				return 'default';
			case 'low':
				return 'secondary';
			default:
				return 'default';
		}
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold">Tasks</h1>
			<p class="text-muted-foreground">To-do items and reminders</p>
		</div>
	</div>

	<!-- Status Tabs -->
	<div class="border-b-2 border-gray-200 dark:border-gray-700">
		<nav class="-mb-0.5 flex space-x-2">
			<button
				onclick={() => { statusFilter = 'pending'; applyFilters(); }}
				class="border-b-4 py-3 px-4 text-sm font-semibold transition-all flex items-center gap-2 rounded-t-lg
					{statusFilter === 'pending' 
						? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950' 
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800'}"
			>
				<Clock class="w-4 h-4" />
				Pending
			</button>
			<button
				onclick={() => { statusFilter = 'completed'; applyFilters(); }}
				class="border-b-4 py-3 px-4 text-sm font-semibold transition-all flex items-center gap-2 rounded-t-lg
					{statusFilter === 'completed' 
						? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950' 
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800'}"
			>
				<CheckCircle class="w-4 h-4" />
				Completed
			</button>
			<button
				onclick={() => { statusFilter = 'canceled'; applyFilters(); }}
				class="border-b-4 py-3 px-4 text-sm font-semibold transition-all flex items-center gap-2 rounded-t-lg
					{statusFilter === 'canceled' 
						? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950' 
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800'}"
			>
				<XCircle class="w-4 h-4" />
				Canceled
			</button>
			<button
				onclick={() => { statusFilter = 'all'; applyFilters(); }}
				class="border-b-4 py-3 px-4 text-sm font-semibold transition-all flex items-center gap-2 rounded-t-lg
					{statusFilter === 'all' 
						? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950' 
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800'}"
			>
				<List class="w-4 h-4" />
				All
			</button>
		</nav>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-2">

			<div class="relative">
				<Filter class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
				<select bind:value={priorityFilter} class="rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm appearance-none cursor-pointer">
					<option value="all">All Priorities</option>
					<option value="high">High</option>
					<option value="med">Medium</option>
					<option value="low">Low</option>
				</select>
			</div>

			<div class="relative">
				<Users class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
				<select bind:value={assignedToFilter} class="rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm appearance-none cursor-pointer">
					<option value="all">All People</option>
					{#each people as person}
						<option value={person.id}>{person.name}</option>
					{/each}
				</select>
			</div>

			<div class="relative">
				<ArrowUpDown class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
				<select bind:value={sortBy} class="rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm appearance-none cursor-pointer">
					<option value="due">Due Date</option>
					<option value="priority">Priority</option>
					<option value="title">Title</option>
				</select>
			</div>

			<Button variant="ghost" size="sm" onclick={clearFilters}>
				<X class="h-3.5 w-3.5 mr-1" />
				Clear
			</Button>
		</div>

		<Dialog bind:open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
			<DialogTrigger>
				<Button>
					<Plus class="mr-2 h-4 w-4" />
					Add Task
				</Button>
			</DialogTrigger>
			<DialogContent class="max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
					<DialogDescription>{editingTask ? 'Update task details' : 'Add a new to-do item'}</DialogDescription>
				</DialogHeader>
				
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
					<div class="space-y-2">
						<Label for="title">Task Title</Label>
						<Input
							id="title"
							bind:value={title}
							placeholder="Submit report"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="due">Due Date & Time (Optional)</Label>
						<Input
							id="due"
							type="datetime-local"
							bind:value={due}
						/>
					</div>

					<div class="space-y-2">
						<Label for="priority">Priority</Label>
						<Select bind:value={priority}>
							<SelectTrigger>
								{priority || 'Select priority'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="low">Low</SelectItem>
								<SelectItem value="med">Medium</SelectItem>
								<SelectItem value="high">High</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div class="space-y-2">
						<Label for="status">Status</Label>
						<Select bind:value={status}>
							<SelectTrigger>
								{status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Select status'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="canceled">Canceled</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div class="space-y-2">
						<Label for="color">Color</Label>
						<div class="flex gap-2">
							<Input id="color" type="color" bind:value={color} class="w-20 h-10" />
							<Input bind:value={color} placeholder="#f59e0b" class="flex-1" />
						</div>
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
						<Button type="button" variant="outline" onclick={() => { dialogOpen = false; resetForm(); }}>
							Cancel
						</Button>
						<Button type="submit" disabled={saving}>
							{saving ? (editingTask ? 'Updating...' : 'Creating...') : (editingTask ? 'Update Task' : 'Create Task')}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	</div>


	{#if loading}
		<p>Loading...</p>
	{:else if tasks.length === 0}
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-muted-foreground">
					No tasks yet. Click "Add Task" to create one.
				</p>
			</CardContent>
		</Card>
	{:else}
		<Card>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="border-b bg-muted/50">
						<tr>
							<th class="p-3 text-left text-sm font-medium">Task</th>
							<th class="p-3 text-left text-sm font-medium">Priority</th>
							<th class="p-3 text-left text-sm font-medium">Due Date</th>
							<th class="p-3 text-left text-sm font-medium hidden md:table-cell">Assigned To</th>
							<th class="p-3 text-left text-sm font-medium">Status</th>
							<th class="p-3 text-right text-sm font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
			{#each paginatedTasks as task, index (task.id)}
				{@const dueDate = task.due_date ? new Date(task.due_date) : null}
				{@const now = new Date()}
				{@const isOverdue = dueDate && !task.completed && dueDate < now}
				<tr class="{index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} {isOverdue ? 'border-l-4 border-destructive bg-destructive/5' : ''} hover:bg-accent/50 transition-colors">
					<!-- Task -->
					<td class="p-3">
						<div class="flex items-start gap-2">
							<input
								type="checkbox"
								checked={task.completed}
								onchange={() => toggleTaskCompletion(task)}
								class="mt-1 h-4 w-4 rounded border-gray-300"
							/>
							<div class="flex-1">
								<div class="font-medium text-sm {task.completed ? 'line-through text-muted-foreground' : ''}">{task.title}</div>
								{#if task.description}
									<div class="text-xs text-muted-foreground line-clamp-1">{task.description}</div>
								{/if}
							</div>
						</div>
					</td>
					
					<!-- Priority -->
					<td class="p-3">
						{#if task.priority}
							<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {
								task.priority === 'high' ? 'bg-red-100 text-red-800' :
								task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
								'bg-blue-100 text-blue-800'
							}">
								{task.priority}
							</span>
						{:else}
							<span class="text-xs text-muted-foreground">-</span>
						{/if}
					</td>
					
					<!-- Due Date -->
					<td class="p-3">
						{#if task.due_date}
							{@const dueDate = new Date(task.due_date)}
							{@const now = new Date()}
							{@const isOverdue = !task.completed && dueDate < now}
							<div class="text-sm {isOverdue ? 'text-destructive font-semibold' : ''}">
								{formatDate(task.due_date)}
								{#if isOverdue}
									<span class="text-xs ml-1">(Overdue!)</span>
								{/if}
							</div>
						{:else}
							<span class="text-xs text-muted-foreground">-</span>
						{/if}
					</td>
					
					<!-- Assigned To -->
					<td class="p-3 hidden md:table-cell">
						{#if task.expand?.assigned_to && task.expand.assigned_to.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each task.expand.assigned_to.slice(0, 2) as person}
									<span class="text-xs bg-secondary/50 rounded-full px-2 py-0.5">
										{person.name}
									</span>
								{/each}
								{#if task.expand.assigned_to.length > 2}
									<span class="text-xs text-muted-foreground">+{task.expand.assigned_to.length - 2}</span>
								{/if}
							</div>
						{:else}
							<span class="text-xs text-muted-foreground">-</span>
						{/if}
					</td>
					
					<!-- Status -->
					<td class="p-3">
						<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {task.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
							{task.completed ? 'Completed' : 'Pending'}
						</span>
					</td>
					
					<!-- Actions -->
					<td class="p-3">
						<div class="flex gap-1 justify-end items-center">
							<!-- Status Change Buttons -->
							{#if task.status !== 'pending'}
								<Button 
									variant="ghost" 
									size="icon"
									class="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
									onclick={() => changeTaskStatus(task, 'pending')}
									title="Mark as Pending"
								>
									<Clock class="h-4 w-4" />
								</Button>
							{/if}
							{#if task.status !== 'completed'}
								<Button 
									variant="ghost" 
									size="icon"
									class="h-8 w-8 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950"
									onclick={() => changeTaskStatus(task, 'completed')}
									title="Mark as Completed"
								>
									<CheckCircle class="h-4 w-4" />
								</Button>
							{/if}
							{#if task.status !== 'canceled'}
								<Button 
									variant="ghost" 
									size="icon"
									class="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
									onclick={() => changeTaskStatus(task, 'canceled')}
									title="Mark as Canceled"
								>
									<XCircle class="h-4 w-4" />
								</Button>
							{/if}
							
							<!-- Edit/Delete -->
							<Button 
								variant="ghost" 
								size="icon"
								class="h-8 w-8"
								onclick={() => openEditDialog(task)}
								title="Edit Task"
							>
								<Pencil class="h-4 w-4" />
							</Button>
							<Button 
								variant="ghost" 
								size="icon"
								class="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
								onclick={() => confirmDelete(task)}
								title="Delete Task"
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
					</td>
				</tr>
			{/each}
					</tbody>
				</table>
			</div>
			
			<!-- Pagination Controls -->
			{#if totalPages > 1}
				<div class="flex items-center justify-between px-4 py-3 border-t">
					<div class="text-sm text-muted-foreground">
						Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, tasks.length)} of {tasks.length} tasks
					</div>
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === 1}
							onclick={() => currentPage = 1}
						>
							First
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === 1}
							onclick={() => currentPage--}
						>
							Previous
						</Button>
						<div class="flex items-center gap-1">
							{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
								{#if page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)}
									<Button
										variant={page === currentPage ? 'default' : 'outline'}
										size="sm"
										onclick={() => currentPage = page}
									>
										{page}
									</Button>
								{:else if page === currentPage - 2 || page === currentPage + 2}
									<span class="px-2">...</span>
								{/if}
							{/each}
						</div>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === totalPages}
							onclick={() => currentPage++}
						>
							Next
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === totalPages}
							onclick={() => currentPage = totalPages}
						>
							Last
						</Button>
					</div>
				</div>
			{/if}
		</Card>
	{/if}
</div>

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Delete Task</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
			</DialogDescription>
		</DialogHeader>
		<div class="flex gap-2 justify-end">
			<Button variant="outline" onclick={() => { deleteDialogOpen = false; taskToDelete = null; }}>
				Cancel
			</Button>
			<Button variant="destructive" onclick={confirmDelete}>
				Delete
			</Button>
		</div>
	</DialogContent>
</Dialog>
