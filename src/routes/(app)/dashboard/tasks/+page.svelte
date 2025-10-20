<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import type { Task } from '$lib/types';

	let tasks = $state<Task[]>([]);
	let loading = $state(true);

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
		<Button>Add Task</Button>
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
