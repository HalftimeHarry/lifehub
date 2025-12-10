<script lang="ts">
	import { pb } from '$lib/pb';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { goto } from '$app/navigation';
	import { Upload, AlertCircle, CheckCircle } from 'lucide-svelte';

	let tsvData = $state('');
	let importing = $state(false);
	let skipDuplicates = $state(true);
	let results = $state<{
		success: number;
		failed: number;
		skipped: number;
		errors: string[];
	} | null>(null);

	const DUSTIN_PERSON_ID = 'iaijggsc0lruk0g';

	// Map category to service type (all online services for now)
	const TYPE_MAPPING: Record<string, 'online' | 'off_line' | 'other'> = {
		'e-mail': 'online',
		'email': 'online',
		'Fligolf': 'online',
		'fligolf': 'online',
		'Graphics': 'online',
		'graphics': 'online',
		'streaming': 'online',
		'messenger': 'online',
		'': 'other'
	};

	function parseCost(costStr: string): number | null {
		if (!costStr || costStr.trim() === '') return null;
		const match = costStr.match(/\$?([\d.]+)/);
		return match ? parseFloat(match[1]) : null;
	}

	function cleanURL(url: string): string | null {
		if (!url || url.trim() === '') return null;
		url = url.trim();
		
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			url = 'https://' + url;
		}
		
		try {
			new URL(url);
			return url;
		} catch {
			return null;
		}
	}

	function parseData(data: string) {
		const lines = data.trim().split('\n');
		if (lines.length < 2) return [];

		// Auto-detect delimiter: check if first line has tabs or commas
		const firstLine = lines[0];
		const delimiter = firstLine.includes('\t') ? '\t' : ',';

		// Parse CSV properly handling quoted fields with newlines
		const rows: string[][] = [];
		let currentRow: string[] = [];
		let currentField = '';
		let inQuotes = false;
		
		for (let i = 0; i < data.length; i++) {
			const char = data[i];
			const nextChar = data[i + 1];
			
			if (char === '"') {
				if (inQuotes && nextChar === '"') {
					// Escaped quote
					currentField += '"';
					i++; // Skip next quote
				} else {
					// Toggle quote state
					inQuotes = !inQuotes;
				}
			} else if (char === delimiter && !inQuotes) {
				// End of field
				currentRow.push(currentField.trim());
				currentField = '';
			} else if (char === '\n' && !inQuotes) {
				// End of row
				currentRow.push(currentField.trim());
				if (currentRow.some(f => f.length > 0)) {
					rows.push(currentRow);
				}
				currentRow = [];
				currentField = '';
			} else {
				currentField += char;
			}
		}
		
		// Add last field and row
		if (currentField || currentRow.length > 0) {
			currentRow.push(currentField.trim());
			if (currentRow.some(f => f.length > 0)) {
				rows.push(currentRow);
			}
		}

		if (rows.length < 2) return [];

		const headers = rows[0];
		const services = [];

		for (let i = 1; i < rows.length; i++) {
			const values = rows[i];
			const row: Record<string, string> = {};
			
			headers.forEach((header, index) => {
				row[header] = values[index] || '';
			});

			// Transform to service object - handle both column name formats
			const category = row['category'] || row['Category'] || '';
			const cost = parseCost(row['monthly_cost'] || row['Cost per month']);
			const baseNotes = row['notes'] || row['Notes'] || '';
			
			// Combine category and cost into notes if present
			let notesArray = [];
			if (category) notesArray.push(`Category: ${category}`);
			if (cost) notesArray.push(`Cost: $${cost}/month`);
			if (baseNotes) notesArray.push(baseNotes);
			
			const service = {
				name: row['name'] || row['Account'] || row['User name'] || 'Unnamed Service',
				type: TYPE_MAPPING[category] || 'online',
				site: cleanURL(row['login_page'] || row['Login page']),
				login: row['username'] || row['User name'] || null,
				pass: row['password'] || row['Password'] || null,
				notes: notesArray.length > 0 ? notesArray.join(' | ') : null,
				person: DUSTIN_PERSON_ID
			};

			// Skip if no login and generic name
			if (!service.login && service.name === 'Unnamed Service') {
				continue;
			}

			services.push(service);
		}

		return services;
	}

	async function handleImport() {
		if (!tsvData.trim()) {
			alert('Please paste your data first');
			return;
		}

		importing = true;
		results = null;

		try {
			const services = parseData(tsvData);
			
			if (services.length === 0) {
				alert('No valid services found in the data');
				importing = false;
				return;
			}

			// Get existing services if checking for duplicates
			let existingServices: any[] = [];
			if (skipDuplicates) {
				existingServices = await pb.collection('srevice_details').getFullList({
					fields: 'id,name,login,person'
				});
			}

			const success: string[] = [];
			const errors: string[] = [];
			const skipped: string[] = [];

			for (const service of services) {
				// Check for duplicates
				if (skipDuplicates) {
					const isDuplicate = existingServices.some(existing => 
						existing.person === service.person &&
						existing.login === service.login &&
						existing.name === service.name
					);
					
					if (isDuplicate) {
						skipped.push(service.name);
						continue;
					}
				}

				try {
					await pb.collection('srevice_details').create(service);
					success.push(service.name);
				} catch (error: any) {
					// Extract more detailed error info
					let errorMsg = error.message;
					if (error.data?.data) {
						const fieldErrors = Object.entries(error.data.data)
							.map(([field, err]: [string, any]) => `${field}: ${err.message || err}`)
							.join(', ');
						errorMsg = fieldErrors || errorMsg;
					}
					errors.push(`${service.name}: ${errorMsg}`);
				}
			}

			results = {
				success: success.length,
				failed: errors.length,
				skipped: skipped.length,
				errors
			};

		} catch (error: any) {
			alert(`Import failed: ${error.message}`);
		} finally {
			importing = false;
		}
	}

	function handleClear() {
		tsvData = '';
		results = null;
	}

	function handleGoToServices() {
		goto('/dashboard/services');
	}
</script>

<div class="container mx-auto p-4 max-w-4xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold flex items-center gap-2">
			<Upload class="h-8 w-8" />
			Import Services
		</h1>
		<p class="text-muted-foreground mt-1">
			Paste your CSV or TSV data below and click Import
		</p>
	</div>

	{#if !results}
		<Card class="p-6">
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium mb-2">
						Paste Your Data (CSV or TSV)
					</label>
					<Textarea
						bind:value={tsvData}
						placeholder="Account	Category	Login page	User name	Password	Cost per month	Notes	Documents
Railway	Fligolf	https://railway.app	user@email.com	pass123	$20.00	Pro plan	"
						rows={15}
						class="font-mono text-xs"
					/>
					<p class="text-xs text-muted-foreground mt-2">
						💡 Copy from your spreadsheet and paste here. Include the header row.
					</p>
				</div>

				<div class="flex items-center gap-2">
					<input
						type="checkbox"
						id="skipDuplicates"
						bind:checked={skipDuplicates}
						class="rounded"
					/>
					<label for="skipDuplicates" class="text-sm">
						Skip duplicate entries (same name, login, and person)
					</label>
				</div>

				<div class="flex gap-2">
					<Button
						onclick={handleImport}
						disabled={importing || !tsvData.trim()}
						class="flex-1"
					>
						{#if importing}
							<span class="animate-spin mr-2">⏳</span>
							Importing...
						{:else}
							<Upload class="h-4 w-4 mr-2" />
							Import Services
						{/if}
					</Button>
					<Button
						variant="outline"
						onclick={handleClear}
						disabled={importing}
					>
						Clear
					</Button>
				</div>

				<div class="bg-muted p-4 rounded-md text-sm space-y-2">
					<p class="font-semibold">📋 Instructions:</p>
					<ol class="list-decimal list-inside space-y-1 text-muted-foreground">
						<li>Copy your data from the spreadsheet (including headers)</li>
						<li>Paste it into the text area above</li>
						<li>Click "Import Services"</li>
						<li>Wait for the import to complete</li>
						<li>Review the results</li>
					</ol>
				</div>

				<div class="bg-blue-50 dark:bg-blue-950 p-4 rounded-md text-sm">
					<p class="font-semibold text-blue-900 dark:text-blue-100 mb-2">
						ℹ️ What gets imported:
					</p>
					<ul class="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
						<li>Service name (Account column)</li>
						<li>Login/username</li>
						<li>Password</li>
						<li>Website URL</li>
						<li>Monthly cost (e.g., $18.99)</li>
						<li>Notes</li>
						<li>Category (mapped to type)</li>
					</ul>
					<p class="mt-2 text-blue-700 dark:text-blue-300">
						⚠️ Documents/files are NOT imported (add manually later)
					</p>
				</div>
			</div>
		</Card>
	{:else}
		<Card class="p-6">
			<div class="space-y-4">
				<div class="text-center">
					{#if results.failed === 0}
						<CheckCircle class="h-16 w-16 text-green-500 mx-auto mb-4" />
						<h2 class="text-2xl font-bold text-green-600 dark:text-green-400">
							Import Successful!
						</h2>
					{:else}
						<AlertCircle class="h-16 w-16 text-yellow-500 mx-auto mb-4" />
						<h2 class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
							Import Completed with Errors
						</h2>
					{/if}
				</div>

				<div class="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
					<div class="bg-green-50 dark:bg-green-950 p-4 rounded-md text-center">
						<div class="text-3xl font-bold text-green-600 dark:text-green-400">
							{results.success}
						</div>
						<div class="text-sm text-green-700 dark:text-green-300">
							Imported
						</div>
					</div>
					<div class="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-md text-center">
						<div class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
							{results.skipped}
						</div>
						<div class="text-sm text-yellow-700 dark:text-yellow-300">
							Skipped
						</div>
					</div>
					<div class="bg-red-50 dark:bg-red-950 p-4 rounded-md text-center">
						<div class="text-3xl font-bold text-red-600 dark:text-red-400">
							{results.failed}
						</div>
						<div class="text-sm text-red-700 dark:text-red-300">
							Failed
						</div>
					</div>
				</div>

				{#if results.errors.length > 0}
					<div class="bg-red-50 dark:bg-red-950 p-4 rounded-md">
						<p class="font-semibold text-red-900 dark:text-red-100 mb-2">
							❌ Errors:
						</p>
						<ul class="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-200">
							{#each results.errors as error}
								<li>{error}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<div class="flex gap-2">
					<Button onclick={handleGoToServices} class="flex-1">
						View Services
					</Button>
					<Button
						variant="outline"
						onclick={() => {
							results = null;
							tsvData = '';
						}}
					>
						Import More
					</Button>
				</div>
			</div>
		</Card>
	{/if}
</div>
