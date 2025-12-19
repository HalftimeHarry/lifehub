<script lang="ts">
	type CategoryGroup = 'fixed' | 'variable' | 'travel' | 'business' | 'personal';
	
	interface Props {
		group: CategoryGroup;
		size?: 'sm' | 'md' | 'lg';
	}
	
	let { group, size = 'sm' }: Props = $props();
	
	const colorClasses: Record<CategoryGroup, string> = {
		fixed: 'bg-blue-100 text-blue-800 border-blue-200',
		variable: 'bg-orange-100 text-orange-800 border-orange-200',
		travel: 'bg-purple-100 text-purple-800 border-purple-200',
		business: 'bg-green-100 text-green-800 border-green-200',
		personal: 'bg-gray-100 text-gray-800 border-gray-200'
	};
	
	const sizeClasses = {
		sm: 'text-xs px-2 py-0.5',
		md: 'text-sm px-3 py-1',
		lg: 'text-base px-4 py-1.5'
	};
	
	const labels: Record<CategoryGroup, string> = {
		fixed: 'Fixed',
		variable: 'Variable',
		travel: 'Travel',
		business: 'Business',
		personal: 'Personal'
	};
</script>

<span 
	class="inline-flex items-center rounded-full border font-medium {colorClasses[group]} {sizeClasses[size]}"
	title="{labels[group]} expense"
>
	{labels[group]}
</span>
