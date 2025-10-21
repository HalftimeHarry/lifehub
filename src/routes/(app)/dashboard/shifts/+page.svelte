<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Plus, Clock, MapPin, Phone } from 'lucide-svelte';
	import { pb } from '$lib/pb';
	import type { Shift, ShiftExpanded, Job } from '$lib/types';

	let dialogOpen = $state(false);
	let saving = $state(false);
	let loading = $state(true);

	// Form fields
	let jobId = $state('');
	let start = $state('');
	let end = $state('');
	let location = $state('');
	let phone = $state('');
	let notes = $state('');

	let shifts = $state<ShiftExpanded[]>([]);
	let jobs = $state<Job[]>([]);
	let editingShift: Shift | null = null;

	onMount(async () => {
		await Promise.all([loadShifts(), loadJobs()]);
	});

	async function loadShifts() {
		try {
			loading = true;
			shifts = await pb.collection('shifts').getFullList<ShiftExpanded>({
				sort: '-@rowid',
				expand: 'job'
			});
			console.log('[SHIFTS] Loaded shifts:', shifts);
		} catch (error) {
			console.error('[SHIFTS] Error loading shifts:', error);
		} finally {
			loading = false;
		}
	}

	async function loadJobs() {
		try {
			jobs = await pb.collection('jobs').getFullList<Job>({
				sort: 'name'
			});
			console.log('[SHIFTS] Loaded jobs:', jobs);
		} catch (error) {
			console.error('[SHIFTS] Error loading jobs:', error);
		}
	}

	function resetForm() {
		editingShift = null;
		jobId = '';
		start = '';
		end = '';
		location = '';
		phone = '';
		notes = '';
	}

	function openEditDialog(shift: Shift) {
		editingShift = shift;
		jobId = shift.job;
		// Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
		start = shift.start.slice(0, 16);
		end = shift.end.slice(0, 16);
		location = shift.location || '';
		phone = shift.phone || '';
		notes = shift.notes || '';
		dialogOpen = true;
	}

	async function handleSubmit() {
		console.log('[SHIFTS] handleSubmit called');
		saving = true;
		try {
			// Convert datetime-local format to ISO 8601
			const startISO = new Date(start).toISOString();
			const endISO = new Date(end).toISOString();

			const data = {
				job: jobId,
				start: startISO,
				end: endISO,
				location: location || undefined,
				phone: phone || undefined,
				notes: notes || undefined
			};

			if (editingShift) {
				console.log('[SHIFTS] Updating shift with data:', data);
				const record = await pb.collection('shifts').update(editingShift.id, data);
				console.log('[SHIFTS] Shift updated:', record);
				await loadShifts();
			} else {
				console.log('[SHIFTS] Creating shift with data:', data);
				const record = await pb.collection('shifts').create(data);
				console.log('[SHIFTS] Shift created:', record);
				await loadShifts();
			}

			// Reset form
			resetForm();
			dialogOpen = false;
		} catch (error) {
			console.error('Error saving shift:', error);
			alert('Failed to save shift');
		} finally {
			saving = false;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this shift?')) return;
		try {
			await pb.collection('shifts').delete(id);
			shifts = shifts.filter((s) => s.id !== id);
		} catch (error) {
			console.error('Error deleting shift:', error);
			alert('Failed to delete shift');
		}
	}

	function formatDateTime(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Shifts</h1>
			<p class="text-muted-foreground">Work schedules and shifts</p>
		</div>

		<Dialog bind:open={dialogOpen} onOpenChange={(open) => { if (open && !editingShift) resetForm(); }}>
			<DialogTrigger asChild>
				{#snippet child({ props })}
					<Button {...props}>
						<Plus class="mr-2 h-4 w-4" />
						Add Shift
					</Button>
				{/snippet}
			</DialogTrigger>
			<DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{editingShift ? 'Edit Shift' : 'Add Shift'}</DialogTitle>
					<DialogDescription>
						{editingShift ? 'Update shift details' : 'Add a new work shift'}
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
						<Label for="job">Job</Label>
						{#if jobs.length === 0}
							<p class="text-sm text-muted-foreground">
								No jobs available. <a href="/dashboard/jobs" class="text-blue-600 hover:underline">Create a job first</a>.
							</p>
						{:else}
							<select
								id="job"
								bind:value={jobId}
								required
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<option value="">Select a job</option>
								{#each jobs as job}
									<option value={job.id}>{job.name}</option>
								{/each}
							</select>
						{/if}
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="start">Start Date & Time</Label>
							<Input id="start" type="datetime-local" bind:value={start} required />
						</div>

						<div class="space-y-2">
							<Label for="end">End Date & Time</Label>
							<Input id="end" type="datetime-local" bind:value={end} required />
						</div>
					</div>

					<div class="space-y-2">
						<Label for="location">Location (Optional)</Label>
						<Input id="location" bind:value={location} placeholder="123 Main St, City, State" />
					</div>

					<div class="space-y-2">
						<Label for="phone">Phone (Optional)</Label>
						<Input id="phone" type="tel" bind:value={phone} placeholder="+1 555 123 4567" />
					</div>

					<div class="space-y-2">
						<Label for="notes">Notes (Optional)</Label>
						<Textarea
							id="notes"
							bind:value={notes}
							placeholder="Shift details, instructions..."
							rows={3}
						/>
					</div>

					<div class="flex gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							class="flex-1"
							onclick={() => (dialogOpen = false)}
						>
							Cancel
						</Button>
						<Button type="submit" class="flex-1" disabled={saving || jobs.length === 0}>
							{saving ? 'Saving...' : editingShift ? 'Update' : 'Add Shift'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	{#if loading}
		<Card class="p-6">
			<p class="text-center text-muted-foreground">Loading shifts...</p>
		</Card>
	{:else if shifts.length === 0}
		<Card class="p-6">
			<div class="text-center space-y-2">
				<Clock class="h-12 w-12 mx-auto text-muted-foreground" />
				<h3 class="font-semibold">No shifts yet</h3>
				<p class="text-sm text-muted-foreground">
					{jobs.length === 0
						? 'Create a job first, then add your work shifts'
						: 'Add your first shift to start tracking your work schedule'}
				</p>
				{#if jobs.length === 0}
					<Button variant="outline" onclick={() => (window.location.href = '/dashboard/jobs')}>
						Go to Jobs
					</Button>
				{/if}
			</div>
		</Card>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each shifts as shift}
				<Card class="overflow-hidden">
					{#if shift.expand?.job}
						<div class="h-2" style="background-color: {shift.expand.job.color || '#3b82f6'}"></div>
					{/if}
					<div class="p-4 space-y-3">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h3 class="font-semibold">{shift.expand?.job?.name || 'Unknown Job'}</h3>
								<div class="mt-2 space-y-1 text-sm text-muted-foreground">
									<div class="flex items-center gap-2">
										<Clock class="h-4 w-4 flex-shrink-0" />
										<span>{formatDateTime(shift.start)}</span>
									</div>
									<div class="flex items-center gap-2">
										<Clock class="h-4 w-4 flex-shrink-0" />
										<span>{formatDateTime(shift.end)}</span>
									</div>
								</div>
							</div>
						</div>

						{#if shift.location}
							<div class="flex items-start gap-2 text-sm text-muted-foreground">
								<MapPin class="mt-0.5 h-4 w-4 flex-shrink-0" />
								<span>{shift.location}</span>
							</div>
						{/if}

						{#if shift.phone}
							<div class="flex items-center gap-2 text-sm text-muted-foreground">
								<Phone class="h-4 w-4 flex-shrink-0" />
								<span>{shift.phone}</span>
							</div>
						{/if}

						{#if shift.notes}
							<p class="text-sm text-muted-foreground">{shift.notes}</p>
						{/if}

						<div class="flex gap-2 pt-2">
							<Button
								variant="outline"
								size="sm"
								class="flex-1"
								onclick={() => openEditDialog(shift)}
							>
								Edit
							</Button>
							<Button
								variant="outline"
								size="sm"
								class="flex-1"
								onclick={() => handleDelete(shift.id)}
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
