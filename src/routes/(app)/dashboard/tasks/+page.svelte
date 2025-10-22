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
	import { Plus, Filter, Users, ArrowUpDown, X, Pencil, Trash2 } from 'lucide-svelte';
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

	// Filter states
	let showCompleted = $state(true);
	let priorityFilter = $state<'all' | 'low' | 'med' | 'high'>('all');
	let assignedToFilter = $state('all');
	let sortBy = $state<'due' | 'priority' | 'title'>('due');

	// Form fields
	let title = $state('');
	let due = $state('');
	let priority = $state<'low' | 'med' | 'high'>('med');
	let notes = $state('');
	let color = $state('#f59e0b');
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

		// Filter by completion status
		if (!showCompleted) {
			filtered = filtered.filter(task => !task.done);
		}

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
		showCompleted = true;
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
				done: editingTask ? editingTask.done : false,
				notify_offset_minutes: 30,
				assigned_to: selectedPeople.length > 0 ? selectedPeople : undefined,
				created_by: createdBy || undefined
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
		selectedPeople = task.assigned_to || [];
		createdBy = task.created_by || '';
		dialogOpen = true;
	}

	function openDeleteDialog(task: TaskExpanded) {
		taskToDelete = task;
		deleteDialogOpen = true;
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
		
		<div class="flex flex-wrap items-center gap-2">
			<!-- Filters -->
			<label class="flex items-center gap-2 text-sm border border-input rounded-md px-3 py-1.5 cursor-pointer hover:bg-accent">
				<input
					type="checkbox"
					bind:checked={showCompleted}
					class="rounded"
				/>
				<Filter class="h-3.5 w-3.5" />
				<span>Show completed</span>
			</label>

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
			<DialogContent class="max-w-md">
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
		<div class="space-y-4">
			{#each tasks as task (task.id)}
				<Card class="overflow-hidden">
					{#if task.color}
						<div class="h-2" style="background-color: {task.color}"></div>
					{/if}
					<CardContent class="pt-6">
						<div class="flex items-start justify-between gap-3">
							<div class="flex-1">
								<div class="flex items-center gap-2 flex-wrap">
									<h3 class="font-medium" class:line-through={task.done}>{task.title}</h3>
									<Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
									{#if task.done}
										<Badge variant="secondary">Completed</Badge>
									{/if}
								</div>
								{#if task.due}
									<p class="text-sm text-muted-foreground mt-1">Due: {new Date(task.due).toLocaleString()}</p>
								{/if}
				
				{#if task.notes}
					<p class="text-sm text-muted-foreground mt-2 italic">{task.notes}</p>
				{/if}
				
				{#if task.phone}
					<p class="text-sm text-muted-foreground mt-1">
						<span class="font-medium">📞 Phone:</span> {task.phone}
					</p>
				{/if}
				
				{#if task.notify_offset_minutes}
					<p class="text-xs text-muted-foreground mt-1">
						<span class="font-medium">⏰ Reminder:</span> {task.notify_offset_minutes} minutes before
					</p>
				{/if}
				
				{#if task.expand?.created_by}
					<div class="flex items-center gap-2 mt-3 pt-3 border-t">
						{#if task.expand.created_by.image}
							<img 
								src={pb.files.getUrl(task.expand.created_by, task.expand.created_by.image, { thumb: '40x40' })} 
								alt={task.expand.created_by.name}
								class="w-6 h-6 rounded-full object-cover"
							/>
						{:else}
							<div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
								{task.expand.created_by.name.charAt(0).toUpperCase()}
							</div>
						{/if}
						<span class="text-xs text-muted-foreground">Created by {task.expand.created_by.name}</span>
					</div>
				{/if}
				
				{#if task.expand?.assigned_to && task.expand.assigned_to.length > 0}
					<div class="mt-3">
						<p class="text-xs text-muted-foreground mb-2">Assigned to:</p>
						<div class="flex flex-wrap gap-2">
							{#each task.expand.assigned_to as person}
								<div class="flex items-center gap-2 bg-secondary/50 rounded-full pl-1 pr-3 py-1">
									{#if person.image}
										<img 
											src={pb.files.getUrl(person, person.image, { thumb: '40x40' })} 
											alt={person.name}
											class="w-6 h-6 rounded-full object-cover"
										/>
									{:else}
										<div class="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
											{person.name.charAt(0).toUpperCase()}
										</div>
									{/if}
									<span class="text-xs font-medium">{person.name}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

							</div>
							
							<div class="flex gap-2">
								<Button variant="ghost" size="icon" onclick={() => openEditDialog(task)}>
									<Pencil class="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="icon" onclick={() => openDeleteDialog(task)}>
									<Trash2 class="h-4 w-4 text-destructive" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
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
