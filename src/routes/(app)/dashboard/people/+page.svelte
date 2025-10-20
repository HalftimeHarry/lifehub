<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Users, Plus, Phone, Mail } from 'lucide-svelte';
	import type { Person } from '$lib/types';

	let people = $state<Person[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			// TODO: Fetch people from PocketBase
			// people = await pb.collection('people').getFullList();
			loading = false;
		} catch (error) {
			console.error('Error fetching people:', error);
			loading = false;
		}
	});
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold">People</h1>
			<p class="text-sm text-muted-foreground">Manage contacts for appointments</p>
		</div>
		<Button size="sm">
			<Plus class="h-4 w-4 mr-2" />
			Add Person
		</Button>
	</div>

	{#if loading}
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-muted-foreground">Loading...</p>
			</CardContent>
		</Card>
	{:else if people.length === 0}
		<Card>
			<CardContent class="pt-6 text-center space-y-4">
				<Users class="h-12 w-12 mx-auto text-muted-foreground" />
				<div>
					<p class="font-medium">No people added yet</p>
					<p class="text-sm text-muted-foreground mt-1">
						Add people you care for to create appointments for them
					</p>
				</div>
				<Button>
					<Plus class="h-4 w-4 mr-2" />
					Add Your First Person
				</Button>
			</CardContent>
		</Card>
	{:else}
		<div class="space-y-3">
			{#each people as person (person.id)}
				<Card class="hover:bg-accent/50 transition-colors">
					<CardContent class="p-4">
						<div class="flex items-start justify-between">
							<div class="flex-1 space-y-2">
								<div class="flex items-center gap-2">
									<h3 class="font-semibold">{person.name}</h3>
									{#if person.relationship}
										<Badge variant="secondary" class="text-xs">
											{person.relationship}
										</Badge>
									{/if}
								</div>

								<div class="space-y-1 text-sm text-muted-foreground">
									{#if person.phone}
										<div class="flex items-center gap-2">
											<Phone class="h-3 w-3" />
											<span>{person.phone}</span>
										</div>
									{/if}
									{#if person.email}
										<div class="flex items-center gap-2">
											<Mail class="h-3 w-3" />
											<span>{person.email}</span>
										</div>
									{/if}
									{#if person.notes}
										<p class="text-xs mt-2">{person.notes}</p>
									{/if}
								</div>
							</div>

							<Button variant="ghost" size="sm">Edit</Button>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
