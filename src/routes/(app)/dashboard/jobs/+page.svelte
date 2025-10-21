<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Plus, Briefcase } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import type { Job } from '$lib/types';

	let dialogOpen = $state(false);
	let saving = $state(false);
	let loading = $state(true);

	// Form fields
	let name = $state('');
	let color = $state('#3b82f6');

	let jobs = $state<Job[]>([]);
	let editingJob: Job | null = null;

	onMount(async () => {
		await loadJobs();
	});

	async function loadJobs() {
		try {
			loading = true;
			jobs = await pb.collection('jobs').getFullList<Job>({
				sort: '-@rowid'
			});
			console.log('[JOBS] Loaded jobs:', jobs);
		} catch (error) {
			console.error('[JOBS] Error loading jobs:', error);
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		editingJob = null;
		name = '';
		color = '#3b82f6';
	}

	function openEditDialog(job: Job) {
		editingJob = job;
		name = job.name;
		color = job.color || '#3b82f6';
		dialogOpen = true;
	}

	async function handleSubmit() {
		console.log('[JOBS] handleSubmit called');
		saving = true;
		try {
			const data = {
				name,
				color: color || undefined,
				created_by: pb.authStore.model?.id
			};

			if (editingJob) {
				console.log('[JOBS] Updating job with data:', data);
				const record = await pb.collection('jobs').update(editingJob.id, data);
				console.log('[JOBS] Job updated:', record);
				jobs = jobs.map((j) => (j.id === editingJob.id ? (record as Job) : j));
			} else {
				console.log('[JOBS] Creating job with data:', data);
				const record = await pb.collection('jobs').create(data);
				console.log('[JOBS] Job created:', record);
				jobs = [...jobs, record as Job];
			}

			// Reset form
			resetForm();
			dialogOpen = false;
		} catch (error) {
			console.error('Error saving job:', error);
			alert('Failed to save job');
		} finally {
			saving = false;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this job?')) return;
		try {
			await pb.collection('jobs').delete(id);
			jobs = jobs.filter((j) => j.id !== id);
		} catch (error) {
			console.error('Error deleting job:', error);
			alert('Failed to delete job');
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Jobs</h1>
			<p class="text-muted-foreground">Manage your work positions</p>
		</div>

		<Dialog bind:open={dialogOpen} onOpenChange={(open) => { if (open && !editingJob) resetForm(); }}>
			<DialogTrigger asChild>
				{#snippet child({ props })}
					<Button {...props}>
						<Plus class="mr-2 h-4 w-4" />
						Add Job
					</Button>
				{/snippet}
			</DialogTrigger>
			<DialogContent class="max-w-md">
				<DialogHeader>
					<DialogTitle>{editingJob ? 'Edit Job' : 'Add Job'}</DialogTitle>
					<DialogDescription>
						{editingJob ? 'Update job details' : 'Add a new job position'}
					</DialogDescription>
				</DialogHeader>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
					class="space-y-4"
				>
					<div class="space-y-2">
						<Label for="name">Job Name</Label>
						<Input id="name" bind:value={name} placeholder="Software Engineer" required />
					</div>

					<div class="space-y-2">
						<Label for="color">Color</Label>
						<div class="flex gap-2">
							<Input id="color" type="color" bind:value={color} class="w-20 h-10" />
							<Input bind:value={color} placeholder="#3b82f6" class="flex-1" />
						</div>
					</div>

					<div class="flex gap-2 pt-2">
						<Button type="button" variant="outline" class="flex-1" onclick={() => (dialogOpen = false)}>
							Cancel
						</Button>
						<Button type="submit" class="flex-1" disabled={saving}>
							{saving ? 'Saving...' : editingJob ? 'Update' : 'Add Job'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	{#if loading}
		<Card class="p-6">
			<p class="text-center text-muted-foreground">Loading jobs...</p>
		</Card>
	{:else if jobs.length === 0}
		<Card class="p-6">
			<div class="text-center space-y-2">
				<Briefcase class="h-12 w-12 mx-auto text-muted-foreground" />
				<h3 class="font-semibold">No jobs yet</h3>
				<p class="text-sm text-muted-foreground">Add your first job to start tracking shifts</p>
			</div>
		</Card>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each jobs as job}
				<Card class="overflow-hidden">
					<div class="h-2" style="background-color: {job.color || '#3b82f6'}"></div>
					<div class="p-4 space-y-3">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h3 class="font-semibold">{job.name}</h3>
							</div>
						</div>

						<div class="flex gap-2 pt-2">
							<Button
								variant="outline"
								size="sm"
								class="flex-1"
								onclick={() => openEditDialog(job)}
							>
								Edit
							</Button>
							<Button
								variant="outline"
								size="sm"
								class="flex-1"
								onclick={() => handleDelete(job.id)}
							>
								Delete
							</Button>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
