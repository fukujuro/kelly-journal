<script lang="ts">
	import { Chart, registerables } from 'chart.js';
	import type { ChartConfiguration } from 'chart.js';
	import { onMount, onDestroy } from 'svelte';

	// Register all the chart.js components (axes, lines, tooltips, etc.)
	Chart.register(...registerables);

	// The component will receive its data as a 'prop'
	export let data: {
		labels: string[];
		actualEquity: number[];
		optimalKelly: number[];
		halfKelly: number[];
	};

	let canvasElement: HTMLCanvasElement;
	let chart: Chart;

	// 'onMount' runs after the component is first rendered in the browser.
	// This is the perfect place to create the chart because the <canvas> element exists.
	onMount(() => {
		const config: ChartConfiguration = {
			type: 'line',
			data: {
				labels: data.labels,
				datasets: [
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
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top'
					},
					title: {
						display: true,
						text: 'Equity Curve Analysis'
					}
				},
				scales: {
					y: {
						ticks: {
							callback: (value: any) =>
								new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
						}
					}
				}
			}
		};

		// Create the new chart instance
		chart = new Chart(canvasElement, config);
	});

	// 'onDestroy' runs just before the component is removed.
	// We must destroy the chart instance to prevent memory leaks.
	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});

	// This is a reactive statement. It will run whenever the 'data' prop changes.
	// This makes the chart update when new data is passed in.
	$: if (chart && data) {
		chart.data.labels = data.labels;
		chart.data.datasets[0].data = data.actualEquity;
		chart.data.datasets[1].data = data.optimalKelly;
		chart.data.datasets[2].data = data.halfKelly;
		chart.update(); // Redraw the chart with the new data
	}
</script>

<div class="chart-container">
	<!-- We use `bind:this` to get a direct reference to the HTML canvas element -->
	<canvas bind:this={canvasElement} ></canvas>
</div>

<style>
	.chart-container {
		position: relative;
		height: 60vh;
		width: 100%;
	}
</style>