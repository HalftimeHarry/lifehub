<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	interface Props {
		latitude: number;
		longitude: number;
		zoom?: number;
		height?: string;
		interactive?: boolean;
		showMarker?: boolean;
	}

	let {
		latitude,
		longitude,
		zoom = 13,
		height = '200px',
		interactive = true,
		showMarker = true
	}: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let marker: maplibregl.Marker | null = null;

	onMount(() => {
		if (!mapContainer) return;

		// Initialize map with OpenStreetMap tiles
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				sources: {
					osm: {
						type: 'raster',
						tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution: '© OpenStreetMap contributors'
					}
				},
				layers: [
					{
						id: 'osm',
						type: 'raster',
						source: 'osm',
						minzoom: 0,
						maxzoom: 19
					}
				]
			},
			center: [longitude, latitude],
			zoom: zoom,
			interactive: interactive
		});

		// Add marker if enabled
		if (showMarker) {
			marker = new maplibregl.Marker({ color: '#3b82f6' })
				.setLngLat([longitude, latitude])
				.addTo(map);
		}

		// Add navigation controls if interactive
		if (interactive) {
			map.addControl(new maplibregl.NavigationControl(), 'top-right');
		}
	});

	onDestroy(() => {
		if (marker) marker.remove();
		if (map) map.remove();
	});

	// Update map when coordinates change
	$effect(() => {
		if (map && latitude && longitude) {
			map.setCenter([longitude, latitude]);
			if (marker) {
				marker.setLngLat([longitude, latitude]);
			}
		}
	});
</script>

<div bind:this={mapContainer} style="height: {height}; width: 100%;" class="rounded-lg overflow-hidden"></div>
