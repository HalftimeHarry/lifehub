<script lang="ts">
	let { class: className = '', size = 32 } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 100 100"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<!-- Outer circle representing life/wholeness -->
	<circle cx="50" cy="50" r="45" stroke="currentColor" stroke-width="3" fill="none" />
	
	<!-- Hub center - hexagon -->
	<path
		d="M 50 20 L 65 30 L 65 50 L 50 60 L 35 50 L 35 30 Z"
		fill="currentColor"
		opacity="0.2"
	/>
	
	<!-- Connection lines from hub to outer circle (4 main directions) -->
	<line x1="50" y1="20" x2="50" y2="5" stroke="currentColor" stroke-width="2.5" />
	<line x1="65" y1="40" x2="80" y2="30" stroke="currentColor" stroke-width="2.5" />
	<line x1="65" y1="40" x2="80" y2="70" stroke="currentColor" stroke-width="2.5" />
	<line x1="35" y1="40" x2="20" y2="30" stroke="currentColor" stroke-width="2.5" />
	<line x1="35" y1="40" x2="20" y2="70" stroke="currentColor" stroke-width="2.5" />
	<line x1="50" y1="60" x2="50" y2="95" stroke="currentColor" stroke-width="2.5" />
	
	<!-- Icons at connection points -->
	<!-- Top: Calendar/Appointments -->
	<circle cx="50" cy="5" r="4" fill="currentColor" />
	
	<!-- Top Right: Briefcase/Work -->
	<circle cx="80" cy="30" r="4" fill="currentColor" />
	
	<!-- Bottom Right: Plane/Travel -->
	<circle cx="80" cy="70" r="4" fill="currentColor" />
	
	<!-- Top Left: Tasks -->
	<circle cx="20" cy="30" r="4" fill="currentColor" />
	
	<!-- Bottom Left: Additional -->
	<circle cx="20" cy="70" r="4" fill="currentColor" />
	
	<!-- Bottom: Time/Schedule -->
	<circle cx="50" cy="95" r="4" fill="currentColor" />
	
	<!-- Center hub dot -->
	<circle cx="50" cy="40" r="6" fill="currentColor" />
</svg>
