<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

	let { 
		latitude = $bindable(0),
		longitude = $bindable(0),
		editable = false,
		height = '400px'
	}: {
		latitude?: number;
		longitude?: number;
		editable?: boolean;
		height?: string;
	} = $props();

	let mapContainer: HTMLDivElement;
	let map: LeafletMap | null = null;
	let marker: LeafletMarker | null = null;
	let mounted = false;

	onMount(async () => {
		if (!browser) return;
		
		// Wait a tick to ensure DOM is ready
		await new Promise(resolve => setTimeout(resolve, 100));
		
		try {
			// Dynamically import Leaflet to avoid SSR issues
			const L = await import('leaflet');
			
			// Fix for default marker icons in Vite
			delete (L.Icon.Default.prototype as any)._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
				iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
				shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
			});

			// Default to center of US if no coordinates
			const defaultLat = latitude || 39.8283;
			const defaultLng = longitude || -98.5795;
			const defaultZoom = (latitude && longitude) ? 13 : 4;

			// Initialize map with unique container
			if (!mapContainer) return;
			
			map = L.map(mapContainer, {
				scrollWheelZoom: !editable, // Disable scroll zoom for thumbnails
				dragging: editable,
				zoomControl: editable,
				doubleClickZoom: editable,
				boxZoom: editable,
				keyboard: editable,
				tap: editable,
				touchZoom: editable
			}).setView([defaultLat, defaultLng], defaultZoom);

			// Add OpenStreetMap tiles
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© OpenStreetMap',
				maxZoom: 19
			}).addTo(map);

			// Add marker if coordinates exist
			if (latitude && longitude) {
				marker = L.marker([latitude, longitude]).addTo(map);
			}

			// If editable, allow clicking to set location
			if (editable) {
				map.on('click', (e) => {
					latitude = e.latlng.lat;
					longitude = e.latlng.lng;

					// Update or create marker
					if (marker) {
						marker.setLatLng(e.latlng);
					} else {
						marker = L.marker(e.latlng).addTo(map!);
					}
				});
			}

			mounted = true;

			// Force resize after mount
			setTimeout(() => {
				if (map) {
					map.invalidateSize();
				}
			}, 200);
		} catch (error) {
			console.error('[MAP] Error initializing map:', error);
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
	});
</script>

<div bind:this={mapContainer} style="height: {height}; width: 100%;" class="rounded-lg border bg-muted"></div>

<style>
	@import 'leaflet/dist/leaflet.css';
</style>
