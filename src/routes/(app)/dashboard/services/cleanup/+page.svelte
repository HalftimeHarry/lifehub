<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pb';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Trash2, AlertCircle } from 'lucide-svelte';
	import type { ServiceDetailExpanded } from '$lib/types';

	let services = $state<ServiceDetailExpanded[]>([]);
	let loading = $state(false);
	let selectedIds = $state<Set<string>>(new Set());
	let deleting = $state(false);

	onMount(async () => {
		await loadServices();
	});

	async function loadServices() {
		loading = true;
		try {
			const data = await pb.collection('srevice_details').getFullList<ServiceDetailExpanded>({
				sort: '-created',
				expand: 'person'
			});
			services = data;
			
			// Auto-select problematic entries
			autoSelectProblematic();
		} catch (error) {
			console.error('Error loading services:', error);
		} finally {
			loading = false;
		}
	}

	function autoSelectProblematic() {
		const problematic = services.filter(s => {
			// Select entries that look like fragments
			const name = s.name || '';
			
			// Check for certificate fragments
			if (name.includes('-----') || name.includes('CERTIFICATE')) return true;
			
			// Check for base64/JWT fragments
			if (name.match(/^[A-Za-z0-9+/=]{50,}$/)) return true;
			
			// Check for URL fragments without proper context
			if (name.startsWith('http') && name.length < 20 && !s.login) return true;
			
			// Check for single words that are clearly fragments
			if (name.length < 30 && name.match(/^(eyJ|VITE_|<https|​|Category:|Cost:)/)) return true;
			
			// Check for entries with no login and suspicious names
			if (!s.login && name.match(/^[A-Z0-9]{10,}$/)) return true;
			
			return false;
		});

		selectedIds = new Set(problematic.map(s => s.id));
	}

	function toggleSelection(id: string) {
		if (selectedIds.has(id)) {
			selectedIds.delete(id);
		} else {
			selectedIds.add(id);
		}
		selectedIds = new Set(selectedIds);
	}

	function selectAll() {
		selectedIds = new Set(services.map(s => s.id));
	}

	function deselectAll() {
		selectedIds = new Set();
	}

	async function deleteSelected() {
		if (selectedIds.size === 0) return;
		
		if (!confirm(`Delete ${selectedIds.size} selected services? This cannot be undone.`)) {
			return;
		}

		deleting = true;
		let deleted = 0;
		let failed = 0;

		for (const id of selectedIds) {
			try {
				await pb.collection('srevice_details').delete(id);
				deleted++;
			} catch (error) {
				console.error(`Failed to delete ${id}:`, error);
				failed++;
			}
		}

		alert(`Deleted ${deleted} services. ${failed > 0 ? `Failed: ${failed}` : ''}`);
		
		selectedIds = new Set();
		await loadServices();
		deleting = false;
	}

	function getServiceName(service: ServiceDetailExpanded): string {
		return service.name || service.login || 'Unnamed Service';
	}
</script>

<div class="container mx-auto p-4 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold flex items-center gap-2">
			<AlertCircle class="h-8 w-8" />
			Service Cleanup
		</h1>
		<p class="text-muted-foreground mt-1">
			Remove duplicate or malformed service entries
		</p>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<p class="text-muted-foreground">Loading services...</p>
		</div>
	{:else}
		<Card class="p-6 mb-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium">
						{selectedIds.size} of {services.length} services selected
					</p>
					<p class="text-xs text-muted-foreground mt-1">
						Problematic entries are auto-selected
					</p>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" size="sm" onclick={deselectAll}>
						Deselect All
					</Button>
					<Button variant="outline" size="sm" onclick={selectAll}>
						Select All
					</Button>
					<Button variant="outline" size="sm" onclick={autoSelectProblematic}>
						Auto-Select Problematic
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onclick={deleteSelected}
						disabled={selectedIds.size === 0 || deleting}
					>
						<Trash2 class="h-4 w-4 mr-2" />
						Delete Selected ({selectedIds.size})
					</Button>
				</div>
			</div>
		</Card>

		<div class="border rounded-lg overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-muted">
						<tr>
							<th class="px-4 py-3 text-left text-sm font-semibold w-12">
								<input
									type="checkbox"
									checked={selectedIds.size === services.length}
									onchange={(e) => {
										if ((e.target as HTMLInputElement).checked) {
											selectAll();
										} else {
											deselectAll();
										}
									}}
									class="rounded"
								/>
							</th>
							<th class="px-4 py-3 text-left text-sm font-semibold">Service</th>
							<th class="px-4 py-3 text-left text-sm font-semibold">Login</th>
							<th class="px-4 py-3 text-left text-sm font-semibold">Password</th>
							<th class="px-4 py-3 text-left text-sm font-semibold">Website</th>
							<th class="px-4 py-3 text-left text-sm font-semibold">Notes</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each services as service}
							<tr
								class="hover:bg-muted/50 transition-colors"
								class:bg-red-50={selectedIds.has(service.id)}
								class:dark:bg-red-950={selectedIds.has(service.id)}
							>
								<td class="px-4 py-3">
									<input
										type="checkbox"
										checked={selectedIds.has(service.id)}
										onchange={() => toggleSelection(service.id)}
										class="rounded"
									/>
								</td>
								<td class="px-4 py-3">
									<div class="font-medium max-w-xs truncate" title={getServiceName(service)}>
										{getServiceName(service)}
									</div>
								</td>
								<td class="px-4 py-3">
									<span class="text-sm font-mono">{service.login || '-'}</span>
								</td>
								<td class="px-4 py-3">
									<span class="text-sm font-mono">
										{service.pass ? '•'.repeat(Math.min(service.pass.length, 12)) : '-'}
									</span>
								</td>
								<td class="px-4 py-3">
									{#if service.site}
										<a href={service.site} target="_blank" rel="noopener noreferrer" class="text-sm text-primary hover:underline">
											{new URL(service.site).hostname}
										</a>
									{:else}
										<span class="text-muted-foreground text-sm">-</span>
									{/if}
								</td>
								<td class="px-4 py-3 max-w-xs">
									{#if service.notes}
										<div class="text-sm truncate" title={service.notes}>{service.notes}</div>
									{:else}
										<span class="text-muted-foreground text-sm">-</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
