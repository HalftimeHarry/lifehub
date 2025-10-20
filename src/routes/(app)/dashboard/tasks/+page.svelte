<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Checkbox } from '$lib/components/ui/checkbox';
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
	import { Plus } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import type { Task } from '$lib/types';

	let tasks = $state<Task[]>([]);
	let loading = $state(true);
	let dialogOpen = $state(false);
	let saving = $state(false);

	// Form fields
	let title = $state('');
	let due = $state('');
	let priority = $state<'low' | 'med' | 'high'>('med');
	let notes = $state('');

	onMount(async () => {
		try {
			// TODO: Fetch tasks from PocketBase
			// tasks = await pb.collection('tasks').getFullList();
			loading = false;
		} catch (error) {
			console.error('Error fetching tasks:', error);
			loading = false;
		}
	});

	async function handleSubmit() {
		saving = true;
		try {
			// Convert datetime-local format to ISO 8601 if due date is set
			const dueDate = due ? new Date(due) : null;

			const data = {
				title,
				due: dueDate ? dueDate.toISOString() : undefined,
				priority,
				notes: notes || undefined,
				done: false,
				notify_offset_minutes: 30
			};

			console.log('[TASKS] Creating task with data:', data);
			const record = await pb.collection('tasks').create(data);
			
			// Add to local list
			tasks = [...tasks, record as Task];
			
			// Reset form
			title = '';
			due = '';
			priority = 'med';
			notes = '';
			
			dialogOpen = false;
		} catch (error) {
			console.error('Error creating task:', error);
			alert('Failed to create task');
		} finally {
			saving = false;
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
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold">Tasks</h1>
			<p class="text-muted-foreground">To-do items and reminders</p>
		</div>
		
		<Dialog bind:open={dialogOpen}>
			<DialogTrigger asChild>
				{#snippet child({ props })}
					<Button {...props}>
						<Plus class="mr-2 h-4 w-4" />
						Add Task
					</Button>
				{/snippet}
			</DialogTrigger>
			<DialogContent class="max-w-md">
				<DialogHeader>
					<DialogTitle>Create Task</DialogTitle>
					<DialogDescription>Add a new to-do item</DialogDescription>
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
							{saving ? 'Creating...' : 'Create Task'}
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
				<Card>
					<CardContent class="pt-6">
						<div class="flex items-start gap-3">
							<Checkbox checked={task.done} />
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h3 class="font-medium" class:line-through={task.done}>{task.title}</h3>
									<Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
								</div>
								{#if task.due}
									<p class="text-sm text-muted-foreground mt-1">{task.due}</p>
								{/if}
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
