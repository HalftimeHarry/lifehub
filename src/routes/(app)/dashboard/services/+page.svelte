<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pb';
	import { currentUser } from '$lib/auth';
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
	import { Plus, Settings, Eye, EyeOff, Pencil, Trash2, User, Upload, Copy, Check, Search } from 'lucide-svelte';
	import type { ServiceDetailExpanded, Person } from '$lib/types';

	let serviceDetails = $state<ServiceDetailExpanded[]>([]);
	let people = $state<Person[]>([]);
	let loading = $state(false);
	let dialogOpen = $state(false);
	let editingService = $state<ServiceDetailExpanded | null>(null);
	let deleteModalOpen = $state(false);
	let serviceToDelete = $state<ServiceDetailExpanded | null>(null);
	let errorMessage = $state<string | null>(null);
	let viewModalOpen = $state(false);
	let viewingService = $state<ServiceDetailExpanded | null>(null);
	let copiedField = $state<string | null>(null);
	let searchQuery = $state('');

	// Form fields
	let name = $state('');
	let serviceType = $state<'online' | 'off_line' | 'other'>('online');
	let login = $state('');
	let password = $state('');
	let notes = $state('');
	let personId = $state('');
	let site = $state('');
	let showPassword = $state(false);
	let imageFiles = $state<FileList | null>(null);

	// Password visibility toggles for list
	let visiblePasswords = $state<Set<string>>(new Set());

	onMount(async () => {
		console.log('[SERVICES] Component mounted');
		console.log('[SERVICES] PocketBase URL:', pb.baseUrl);
		console.log('[SERVICES] Current user from store:', $currentUser);
		await loadData();
	});

	async function loadData() {
		loading = true;
		errorMessage = null;
		try {
			console.log('[SERVICES] Starting data load...');
			console.log('[SERVICES] PocketBase URL:', pb.baseUrl);
			console.log('[SERVICES] Auth token exists:', !!pb.authStore.token);
			console.log('[SERVICES] Current user:', pb.authStore.model?.email);
			
			const [servicesData, peopleData] = await Promise.all([
				pb.collection('srevice_details').getFullList<ServiceDetailExpanded>({
					sort: '-created',
					expand: 'person'
				}),
				pb.collection('people').getFullList<Person>({ sort: 'name' })
			]);
			serviceDetails = servicesData;
			people = peopleData;
			console.log('[SERVICES] Loaded services:', servicesData.length);
			console.log('[SERVICES] Services data:', servicesData);
			console.log('[SERVICES] Loaded people:', peopleData.length, peopleData);
			console.log('[SERVICES] Logged in user email:', pb.authStore.model?.email);
			console.log('[SERVICES] Logged in user ID:', pb.authStore.model?.id);
		} catch (error: any) {
			console.error('[SERVICES] Error loading data:', error);
			console.error('[SERVICES] Error status:', error.status);
			console.error('[SERVICES] Error response:', error.response);
			if (error.status === 403) {
				errorMessage = 'Access denied. Please update the collection rules in PocketBase Admin. See FIX_SERVICE_DETAILS_ACCESS.md for instructions.';
			} else {
				errorMessage = `Failed to load data: ${error.message || 'Unknown error'}`;
			}
		} finally {
			loading = false;
		}
	}

	function openDialog(service?: ServiceDetailExpanded) {
		if (service) {
			editingService = service;
			name = service.name || '';
			serviceType = service.type || 'online';
			login = service.login || '';
			password = service.pass || '';
			notes = service.notes || '';
			personId = service.person;
			site = service.site || '';
		} else {
			editingService = null;
			name = '';
			serviceType = 'online';
			login = '';
			password = '';
			notes = '';
			site = '';
			
			// Auto-select person based on current user's email
			if ($currentUser?.email) {
				const matchingPerson = people.find(p => p.email === $currentUser.email);
				personId = matchingPerson?.id || '';
				console.log('[SERVICES] Auto-selected person:', matchingPerson?.name || 'none');
			} else {
				personId = '';
			}
		}
		dialogOpen = true;
	}

	async function handleSubmit() {
		if (!login || !personId) {
			alert('Please fill in login and select a person');
			return;
		}

		try {
			const formData = new FormData();
			if (name) formData.append('name', name);
			formData.append('type', serviceType);
			formData.append('login', login);
			formData.append('pass', password);
			formData.append('notes', notes);
			formData.append('person', personId);
			if (site) formData.append('site', site);

			// Add image files if present
			if (imageFiles) {
				for (let i = 0; i < imageFiles.length; i++) {
					formData.append('image', imageFiles[i]);
				}
			}

			if (editingService) {
				await pb.collection('srevice_details').update(editingService.id, formData);
			} else {
				await pb.collection('srevice_details').create(formData);
			}

			await loadData();
			dialogOpen = false;
			resetForm();
		} catch (error) {
			console.error('Error saving service:', error);
			alert('Failed to save service. Please try again.');
		}
	}

	function resetForm() {
		editingService = null;
		name = '';
		serviceType = 'online';
		login = '';
		password = '';
		notes = '';
		personId = '';
		site = '';
		showPassword = false;
		imageFiles = null;
	}

	function confirmDelete(service: ServiceDetailExpanded) {
		serviceToDelete = service;
		deleteModalOpen = true;
	}

	async function deleteService() {
		if (!serviceToDelete) return;

		try {
			await pb.collection('srevice_details').delete(serviceToDelete.id);
			await loadData();
			deleteModalOpen = false;
			serviceToDelete = null;
		} catch (error) {
			console.error('Error deleting service:', error);
			alert('Failed to delete service. Please try again.');
		}
	}

	function togglePasswordVisibility(serviceId: string) {
		if (visiblePasswords.has(serviceId)) {
			visiblePasswords.delete(serviceId);
		} else {
			visiblePasswords.add(serviceId);
		}
		visiblePasswords = new Set(visiblePasswords);
	}

	function getServiceName(service: ServiceDetailExpanded): string {
		return service.name || service.login || 'Unnamed Service';
	}

	function truncateServiceName(name: string, maxLength: number = 18): string {
		if (name.length <= maxLength) return name;
		return name.substring(0, maxLength) + '...';
	}

	function openViewModal(service: ServiceDetailExpanded) {
		viewingService = service;
		viewModalOpen = true;
	}

	async function copyToClipboard(text: string, field: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedField = field;
			setTimeout(() => {
				copiedField = null;
			}, 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	}

	function formatServiceForSharing(service: ServiceDetailExpanded): string {
		const lines = [];
		lines.push(`Service: ${getServiceName(service)}`);
		if (service.site) lines.push(`Website: ${service.site}`);
		if (service.login) lines.push(`Login: ${service.login}`);
		if (service.pass) lines.push(`Password: ${service.pass}`);
		if (service.notes && !service.notes.startsWith('Service:')) lines.push(`Notes: ${service.notes}`);
		lines.push(`Person: ${service.expand?.person?.name || 'Unknown'}`);
		return lines.join('\n');
	}

	// Filter services based on search query
	$effect(() => {
		if (!searchQuery.trim()) return serviceDetails;
	});

	function getFilteredServices() {
		if (!searchQuery.trim()) return serviceDetails;
		
		const query = searchQuery.toLowerCase();
		return serviceDetails.filter(service => {
			const name = getServiceName(service).toLowerCase();
			const login = (service.login || '').toLowerCase();
			const person = (service.expand?.person?.name || '').toLowerCase();
			const notes = (service.notes || '').toLowerCase();
			
			return name.includes(query) || 
				   login.includes(query) || 
				   person.includes(query) ||
				   notes.includes(query);
		});
	}
</script>

<div class="container mx-auto p-4 max-w-6xl">
	<div class="mb-6 space-y-4">
		<div>
			<h1 class="text-3xl font-bold flex items-center gap-2">
				<Settings class="h-8 w-8" />
				Services
			</h1>
			<p class="text-muted-foreground mt-1">Manage service credentials and login details</p>
		</div>
		
		<!-- Search Bar -->
		<div class="relative w-full">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search services..."
				bind:value={searchQuery}
				class="pl-10"
			/>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-2">
			<Button href="/dashboard/services/import" variant="outline" class="w-full sm:w-auto">
				<Upload class="h-4 w-4 mr-2" />
				Import Services
			</Button>
			<Button href="/dashboard/services/cleanup" variant="outline" class="w-full sm:w-auto">
				<Trash2 class="h-4 w-4 mr-2" />
				Cleanup
			</Button>
			<Dialog bind:open={dialogOpen}>
				<DialogTrigger asChild>
					<Button onclick={() => openDialog()} class="w-full sm:w-auto">
						<Plus class="h-4 w-4 mr-2" />
						Add Service
					</Button>
				</DialogTrigger>
			<DialogContent class="max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
					<DialogDescription>
						Store login credentials for services and subscriptions
					</DialogDescription>
				</DialogHeader>

				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
					<div class="space-y-2">
						<Label for="name">Service Name</Label>
						<Input
							id="name"
							bind:value={name}
							placeholder="e.g., Railway, GitHub, Netflix"
						/>
					</div>

					<div class="space-y-2">
						<Label for="site">Website URL</Label>
						<Input
							id="site"
							type="url"
							bind:value={site}
							placeholder="https://example.com"
						/>
						<p class="text-xs text-muted-foreground">
							Link to the service website or login page
						</p>
					</div>

					<div class="space-y-2">
						<Label for="person">Person *</Label>
						<select
							id="person"
							bind:value={personId}
							required
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="">Select person...</option>
							{#each people as person}
								<option value={person.id}>{person.name}</option>
							{/each}
						</select>
						{#if people.length === 0}
							<p class="text-xs text-destructive">
								No people found. Please add people first in the People section.
							</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="type">Type</Label>
						<select
							id="type"
							bind:value={serviceType}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="online">Online</option>
							<option value="off_line">Offline</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div class="space-y-2">
						<Label for="login">Login/Username *</Label>
						<Input
							id="login"
							bind:value={login}
							placeholder="username or email"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="password">Password</Label>
						<div class="relative">
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								placeholder="password"
							/>
							<button
								type="button"
								onclick={() => showPassword = !showPassword}
								class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								{#if showPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="notes">Notes</Label>
						<Textarea
							id="notes"
							bind:value={notes}
							placeholder="Additional notes"
							rows={3}
						/>
					</div>

					<div class="space-y-2">
						<Label for="images">Images (Optional)</Label>
						<input
							id="images"
							type="file"
							accept="image/*"
							multiple
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								imageFiles = target.files;
							}}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						/>
						<p class="text-xs text-muted-foreground">
							Upload screenshots, QR codes, or other images related to this service
						</p>
					</div>

					<div class="flex gap-2 justify-end">
						<Button type="button" variant="outline" onclick={() => { dialogOpen = false; resetForm(); }}>
							Cancel
						</Button>
						<Button type="submit">
							{editingService ? 'Update' : 'Create'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	</div>
	</div>

	{#if errorMessage}
		<Card class="p-8 border-destructive">
			<div class="text-center">
				<h3 class="text-lg font-semibold text-destructive mb-2">⚠️ Access Error</h3>
				<p class="text-sm text-muted-foreground mb-4">{errorMessage}</p>
				<div class="space-y-2 text-left bg-muted p-4 rounded-md text-xs">
					<p class="font-semibold">Quick Fix:</p>
					<ol class="list-decimal list-inside space-y-1">
						<li>Go to PocketBase Admin: <a href="https://pocketbase-production-f733.up.railway.app/_/" target="_blank" class="text-primary underline">Open Admin</a></li>
						<li>Navigate to Collections → srevice_details → API Rules</li>
						<li>Set all rules to: <code class="bg-background px-1 py-0.5 rounded">@request.auth.id != ""</code></li>
						<li>Click Save and refresh this page</li>
					</ol>
				</div>
				<Button onclick={loadData} class="mt-4">
					Try Again
				</Button>
			</div>
		</Card>
	{:else if loading}
		<div class="text-center py-12">
			<p class="text-muted-foreground">Loading services...</p>
		</div>
	{:else if serviceDetails.length === 0}
		<Card class="p-12 text-center">
			<Settings class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
			<h3 class="text-lg font-semibold mb-2">No services yet</h3>
			<p class="text-muted-foreground mb-4">
				Add your first service to start tracking credentials
			</p>
			<Button onclick={() => openDialog()}>
				<Plus class="h-4 w-4 mr-2" />
				Add Service
			</Button>
		</Card>
	{:else}
		<!-- Mobile Card View -->
		<div class="lg:hidden space-y-4">
			{#each getFilteredServices() as service, index}
				<Card class={`p-4 ${index % 2 === 1 ? 'bg-muted' : ''}`}>
					<div class="space-y-3">
						<!-- Service Name & Person -->
						<div class="flex items-start justify-between gap-2">
							<div class="flex-1 min-w-0">
								<h3 class="font-semibold text-lg truncate" title={getServiceName(service)}>
									{getServiceName(service)}
								</h3>
								<p class="text-xs text-muted-foreground">
									{service.expand?.person?.name || 'Unknown'}
								</p>
							</div>
							<div class="flex gap-1 shrink-0">
								<Button 
									size="sm" 
									variant="outline" 
									onclick={() => openViewModal(service)} 
									title="View"
									class="h-8 w-8 p-0"
								>
									<Eye class="h-4 w-4" />
								</Button>
								<Button 
									size="sm" 
									variant="outline" 
									onclick={() => openDialog(service)} 
									title="Edit"
									class="h-8 w-8 p-0"
								>
									<Pencil class="h-4 w-4" />
								</Button>
								<Button 
									size="sm" 
									variant="outline" 
									onclick={() => confirmDelete(service)} 
									title="Delete"
									class="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</div>

						<!-- Login -->
						{#if service.login}
							<div>
								<label class="text-xs text-muted-foreground">Login</label>
								<div class="text-sm font-mono bg-muted px-2 py-1 rounded mt-1 break-all">
									{service.login}
								</div>
							</div>
						{/if}

						<!-- Password -->
						{#if service.pass}
							<div>
								<label class="text-xs text-muted-foreground">Password</label>
								<div class="text-sm font-mono bg-muted px-2 py-1 rounded mt-1 break-all">
									{service.pass}
								</div>
							</div>
						{/if}

						<!-- Website -->
						{#if service.site}
							<div>
								<label class="text-xs text-muted-foreground">Website</label>
								<a 
									href={service.site} 
									target="_blank" 
									rel="noopener noreferrer" 
									class="text-sm text-primary hover:underline block mt-1 break-all"
								>
									{service.site}
								</a>
							</div>
						{/if}

						<!-- Notes -->
						{#if service.notes && !service.notes.startsWith('Service:')}
							<div>
								<label class="text-xs text-muted-foreground">Notes</label>
								<div class="text-sm bg-muted px-2 py-1 rounded mt-1 break-words">
									{service.notes}
								</div>
							</div>
						{/if}
					</div>
				</Card>
			{/each}
		</div>

		<!-- Desktop Table View -->
		<div class="hidden lg:block border rounded-lg overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full min-w-max">
					<thead class="bg-muted">
						<tr>
							<th class="px-4 py-3 text-left text-sm font-semibold">Service</th>
							<th class="px-4 py-3 text-left text-sm font-semibold">Login</th>
							<th class="px-4 py-3 text-left text-sm font-semibold">Password</th>
							<th class="px-4 py-3 text-right text-sm font-semibold">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each getFilteredServices() as service, index}
							<tr class="{index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-accent/50 transition-colors">
								<!-- Service Name -->
								<td class="px-4 py-3 whitespace-nowrap">
									<div title={`${getServiceName(service)} (${service.expand?.person?.name || 'Unknown'})`}>
										<span class="font-medium">{truncateServiceName(getServiceName(service))}</span>
										<span class="text-xs text-muted-foreground ml-1">({service.expand?.person?.name || 'Unknown'})</span>
									</div>
								</td>

								<!-- Login -->
								<td class="px-4 py-3 whitespace-nowrap">
									<div class="text-sm font-mono" title={service.login}>{truncateServiceName(service.login || '', 18)}</div>
								</td>

								<!-- Password -->
								<td class="px-4 py-3 whitespace-nowrap">
									{#if service.pass}
										<div class="text-sm font-mono" title={service.pass}>
											{truncateServiceName(service.pass, 18)}
										</div>
									{:else}
										<span class="text-muted-foreground text-sm">-</span>
									{/if}
								</td>

							<!-- Actions -->
							<td class="px-4 py-3 whitespace-nowrap">
								<div class="flex flex-row gap-1 justify-end">
									<Button 
										size="sm" 
										variant="outline" 
										onclick={() => openViewModal(service)} 
										title="View details"
										class="h-8 w-8 p-0 shrink-0"
									>
										<Eye class="h-4 w-4" />
									</Button>
									<Button 
										size="sm" 
										variant="outline" 
										onclick={() => openDialog(service)} 
										title="Edit service"
										class="h-8 w-8 p-0 shrink-0"
									>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button 
										size="sm" 
										variant="outline" 
										onclick={() => confirmDelete(service)} 
										title="Delete service"
										class="h-8 w-8 p-0 shrink-0 hover:bg-destructive hover:text-destructive-foreground"
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
		</div>
	{/if}
</div>

<!-- View Service Dialog -->
<Dialog bind:open={viewModalOpen}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>Service Details</DialogTitle>
			<DialogDescription>
				View and copy service credentials
			</DialogDescription>
		</DialogHeader>
		{#if viewingService}
			<div class="space-y-4">
				<!-- Service Name -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<Label class="text-sm font-semibold">Service</Label>
						<button
							onclick={() => copyToClipboard(getServiceName(viewingService), 'name')}
							class="text-muted-foreground hover:text-foreground transition-colors"
							title="Copy"
						>
							{#if copiedField === 'name'}
								<Check class="h-4 w-4 text-green-500" />
							{:else}
								<Copy class="h-4 w-4" />
							{/if}
						</button>
					</div>
					<div class="text-sm font-medium">{getServiceName(viewingService)}</div>
				</div>

				<!-- Website -->
				{#if viewingService.site}
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label class="text-sm font-semibold">Website</Label>
							<button
								onclick={() => copyToClipboard(viewingService.site, 'site')}
								class="text-muted-foreground hover:text-foreground transition-colors"
								title="Copy"
							>
								{#if copiedField === 'site'}
									<Check class="h-4 w-4 text-green-500" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</button>
						</div>
						<a href={viewingService.site} target="_blank" rel="noopener noreferrer" class="text-sm text-primary hover:underline break-all">
							{viewingService.site}
						</a>
					</div>
				{/if}

				<!-- Login -->
				{#if viewingService.login}
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label class="text-sm font-semibold">Login/Username</Label>
							<button
								onclick={() => copyToClipboard(viewingService.login, 'login')}
								class="text-muted-foreground hover:text-foreground transition-colors"
								title="Copy"
							>
								{#if copiedField === 'login'}
									<Check class="h-4 w-4 text-green-500" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</button>
						</div>
						<div class="text-sm font-mono bg-muted p-2 rounded break-all">{viewingService.login}</div>
					</div>
				{/if}

				<!-- Password -->
				{#if viewingService.pass}
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label class="text-sm font-semibold">Password</Label>
							<button
								onclick={() => copyToClipboard(viewingService.pass, 'pass')}
								class="text-muted-foreground hover:text-foreground transition-colors"
								title="Copy"
							>
								{#if copiedField === 'pass'}
									<Check class="h-4 w-4 text-green-500" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</button>
						</div>
						<div class="text-sm font-mono bg-muted p-2 rounded break-all">{viewingService.pass}</div>
					</div>
				{/if}

				<!-- Notes -->
				{#if viewingService.notes && !viewingService.notes.startsWith('Service:')}
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label class="text-sm font-semibold">Notes</Label>
							<button
								onclick={() => copyToClipboard(viewingService.notes, 'notes')}
								class="text-muted-foreground hover:text-foreground transition-colors"
								title="Copy"
							>
								{#if copiedField === 'notes'}
									<Check class="h-4 w-4 text-green-500" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</button>
						</div>
						<div class="text-sm bg-muted p-2 rounded whitespace-pre-wrap break-words">{viewingService.notes}</div>
					</div>
				{/if}

				<!-- Person -->
				<div class="space-y-2">
					<Label class="text-sm font-semibold">Person</Label>
					<div class="text-sm flex items-center gap-2">
						<User class="h-4 w-4" />
						{viewingService.expand?.person?.name || 'Unknown'}
					</div>
				</div>

				<!-- Copy All Button -->
				<div class="pt-4 border-t">
					<Button
						variant="outline"
						class="w-full"
						onclick={() => copyToClipboard(formatServiceForSharing(viewingService), 'all')}
					>
						{#if copiedField === 'all'}
							<Check class="h-4 w-4 mr-2 text-green-500" />
							Copied!
						{:else}
							<Copy class="h-4 w-4 mr-2" />
							Copy All Details
						{/if}
					</Button>
				</div>
			</div>
		{/if}
		<div class="flex gap-2 justify-end pt-4">
			<Button variant="outline" onclick={() => { viewModalOpen = false; viewingService = null; copiedField = null; }}>
				Close
			</Button>
			<Button onclick={() => { viewModalOpen = false; openDialog(viewingService); }}>
				<Pencil class="h-4 w-4 mr-2" />
				Edit
			</Button>
		</div>
	</DialogContent>
</Dialog>

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={deleteModalOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Service</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete this service? This action cannot be undone.
			</DialogDescription>
		</DialogHeader>
		<div class="flex gap-2 justify-end">
			<Button variant="outline" onclick={() => { deleteModalOpen = false; serviceToDelete = null; }}>
				Cancel
			</Button>
			<Button variant="destructive" onclick={deleteService}>
				Delete
			</Button>
		</div>
	</DialogContent>
</Dialog>
