<script lang="ts">
	import { Chart, registerables } from 'chart.js';
	import type { ChartConfiguration, ChartDataset, ScaleOptionsByType } from 'chart.js';
	import { onMount, onDestroy } from 'svelte';
	// --- IMPORT THE ZOOM PLUGIN ---
	// DO NOT import the zoom plugin here anymore. We will do it dynamically.
	// import zoomPlugin from 'chartjs-plugin-zoom';
	// Dynamic import will be handled in onMount

	Chart.register(...registerables);

	// --- NEW PROPS to control which lines are shown ---
	export let showActual = false;
	export let showOptimal = false;
	export let showHalf = false;
	export let chartTitle = 'Chart'; // A prop for the title

	// Add a 'yAxisType' prop to control the scale.
	// It can be either 'linear' or 'logarithmic'.
	export let yAxisType: 'linear' | 'logarithmic' = 'linear';

	export let data: {
		labels: string[];
		actualEquity: number[];
		optimalKelly: number[];
		halfKelly: number[];
	};

	let canvasElement: HTMLCanvasElement;
	let chart: Chart;

	// This function will build the chart's options configuration.
	// We make it a function so we can call it anytime we need to rebuild the options.
	function getChartOptions(): ChartConfiguration['options'] {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				zoom: {
					pan: {
						enabled: true, // Allows panning (click and drag)
						mode: 'xy' // Pan on both x and y axes
					},
					zoom: {
						wheel: {
							enabled: true // Allows zooming with the mouse wheel
						},
						pinch: {
							enabled: true // Allows zooming with pinch gesture on touch devices
						},
						mode: 'xy' // Zoom on both x and y axes
					}
				},
				legend: { position: 'top' },
				title: {
					display: true,
					text: chartTitle // Use the new prop for the title
				}
			},
			scales: {
				y: {
					// --- DYNAMIC SCALE TYPE ---
					// The type of the y-axis is now determined by our new prop.
					type: yAxisType,
					ticks: {
						callback: (value: any) =>
							// Log scale can have many small ticks, so we simplify formatting for it
							yAxisType === 'logarithmic'
								? Number(value).toLocaleString()
								: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
										value
								  )
					}
				}
			}
		};
	}

	function buildDatasets(): ChartDataset<'line'>[] {
		const datasets: ChartDataset<'line'>[] = [];

		if (showActual) {
			datasets.push({
				label: 'Your Actual Equity',
				data: data.actualEquity,
				borderColor: 'rgb(54, 162, 235)',
				backgroundColor: 'rgba(54, 162, 235, 0.5)',
				tension: 0.1
			});
		}
		if (showOptimal) {
			datasets.push({
				label: 'Optimal Kelly',
				data: data.optimalKelly,
				borderColor: 'rgb(75, 192, 192)',
				backgroundColor: 'rgba(75, 192, 192, 0.5)',
				tension: 0.1
			});
		}
		if (showHalf) {
			datasets.push({
				label: 'Half Kelly',
				data: data.halfKelly,
				borderColor: 'rgb(255, 159, 64)',
				backgroundColor: 'rgba(255, 159, 64, 0.5)',
				tension: 0.1
			});
		}
		return datasets;
	}
	
	// --- ADD A FUNCTION TO RESET THE ZOOM ---
	export function resetZoom() {
		if (chart) {
			chart.resetZoom();
		}
	}


	onMount(async () => {
		// --- THIS IS THE FIX ---
		// 1. Dynamically import the plugin ONLY on the client-side.
		const zoomPlugin = (await import('chartjs-plugin-zoom')).default;

		// 2. Register the plugin just before creating the chart.
		Chart.register(zoomPlugin);

		const config: ChartConfiguration = {
			type: 'line',
			data: {
				labels: data.labels,
				datasets: buildDatasets() // Build initial datasets
				/* [
					{
						label: 'Your Actual Equity',
						data: data.actualEquity,
						borderColor: 'rgb(54, 162, 235)',
						backgroundColor: 'rgba(54, 162, 235, 0.5)',
						tension: 0.1
					},
					{
						label: 'Optimal Kelly',
						data: data.optimalKelly,
						borderColor: 'rgb(75, 192, 192)',
						backgroundColor: 'rgba(75, 192, 192, 0.5)',
						tension: 0.1
					},
					{
						label: 'Half Kelly',
						data: data.halfKelly,
						borderColor: 'rgb(255, 159, 64)',
						backgroundColor: 'rgba(255, 159, 64, 0.5)',
						tension: 0.1
					}
				] */
			},
			options: getChartOptions() // Get the initial options
		};

		chart = new Chart(canvasElement, config);
	});

	onDestroy(() => {
		if (chart) chart.destroy();
		
	});

	// Reactive update for DATA (no changes needed here)
	$: if (chart && data) {
		chart.data.labels = data.labels;
		chart.data.datasets = buildDatasets(); // Rebuild datasets if data or show flags change
		/*	 = data.actualEquity;
		chart.data.datasets[1].data = data.optimalKelly;
		chart.data.datasets[2].data = data.halfKelly; */
		chart.update();
	}

	// --- NEW REACTIVE BLOCK for OPTIONS changes ---
	// This will run whenever the 'yAxisType' prop changes.
	$: if (chart && (yAxisType || chartTitle)) {
		const newOptions = getChartOptions();
		// chart.options = getChartOptions()!; // Get the new options
		if (newOptions) {
			chart.options = newOptions;
			chart.update();
		}
			// chart.update(); // Redraw the chart with the new scale
	}
</script>

<div class="chart-container">
	<canvas bind:this={canvasElement} ></canvas>
</div>

<style>
	.chart-container {
		position: relative;
		/* We'll control height from the parent, but ensure it's at least a certain size */
		min-height: 400px;
		height: 100%;
		width: 100%;
		/* Add a cursor to indicate the chart is interactive */
		cursor: grab;
	}
	.chart-container:active {
		cursor: grabbing;
	}
</style>