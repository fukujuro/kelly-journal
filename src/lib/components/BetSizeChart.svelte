<script lang="ts">
	// import { Bar } from 'svelte-chartjs';
	import { Chart, registerables } from 'chart.js';
	import type { ChartConfiguration } from 'chart.js';
	import { onMount, onDestroy } from 'svelte';
	// import zoomPlugin from 'chartjs-plugin-zoom';

	Chart.register(...registerables);

	export let data: {
		labels: string[];
		actual: (number | null)[];
		recommended: (number | null)[];
	};

	let canvasElement: HTMLCanvasElement;
	let chart: Chart;

	function getChartOptions(): ChartConfiguration['options'] {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				zoom: {
					pan: { enabled: true, mode: 'x' }, // Only pan horizontally
					zoom: { wheel: { enabled: true}, pinch: { enabled: true},
                mode: 'x' }
				},
				legend: { position: 'top' },
				title: {
					display: true,
					text: 'Actual Bet Size vs. Recommended (Half-Kelly)'
				},
				tooltip: {
					callbacks: {
						label: (context) => {
							let label = context.dataset.label || '';
							if (label) {
								label += ': ';
							}
							if (context.parsed.y !== null) {
								label += context.parsed.y.toFixed(2) + '%';
							}
							return label;
						}
					}
				}
			},
			scales: {
				y: {
					title: {
						display: true,
						text: 'Risk as % of Equity'
					},
					ticks: {
						callback: (value) => `${value}%` // Add a '%' sign to the y-axis
					}
				}
			}
		};
	}

	export function resetZoom() {
		if (chart) chart.resetZoom();
	}

	onMount(async () => {
        // Dynamically import and register the zoom plugin on the client-side
		const zoomPlugin = (await import('chartjs-plugin-zoom')).default;
		Chart.register(zoomPlugin);
        
        const config: ChartConfiguration = {
			type: 'bar', // This is a bar chart
			data: {
				labels: data.labels,
				datasets: [
					{
						label: 'Actual Risk %',
						data: data.actual,
						backgroundColor: 'rgba(54, 162, 235, 0.6)'
					},
					{
						label: 'Recommended Risk %',
						data: data.recommended,
						backgroundColor: 'rgba(255, 159, 64, 0.6)'
					}
				]
			},
			options: getChartOptions()!
		};

		chart = new Chart(canvasElement, config);
	});

	onDestroy(() => {
		if (chart) chart.destroy();
	});

	// Reactive update for data changes
	$: if (chart && data) {
		chart.data.labels = data.labels;
		chart.data.datasets[0].data = data.actual;
		chart.data.datasets[1].data = data.recommended;
		chart.update();
	}
</script>

<div class="chart-container">
	<canvas bind:this={canvasElement} ></canvas>
</div>

<style>
	.chart-container {
		position: relative;
		min-height: 400px;
		height: 100%;
		width: 100%;
		cursor: grab;
	}
	.chart-container:active {
		cursor: grabbing;
	}
</style>