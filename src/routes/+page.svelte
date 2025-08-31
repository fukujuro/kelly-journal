<script lang="ts">
	import KellyChart from '$lib/components/KellyChart.svelte';
	import type { PageData } from './$types';
	import BetSizeChart from '$lib/components/BetSizeChart.svelte';
	import RangeSlider from '$lib/components/RangeSlider.svelte';
	// import type { ScaleOptionsByType } from 'chart.js'; // Import the type for safety

	// This 'data' prop is automatically populated by your `+page.server.ts` load function!
	export let data: PageData;
	// export let data: PageData;
	let betSizeChartComponent: BetSizeChart;
	// --- Component Instances ---
	// we need separate references for each chart to reset their zoom individually
	let actualChartComponent: KellyChart;
	let kellyChartComponent: KellyChart;

	// --- UI State ---
	// We can have separate scale toggles for each chart
	//let useLogScaleActual = false;
	let yAxisTypeActual: 'linear' | 'logarithmic'; // <-- Explicitly typed
	$: yAxisTypeActual = useLogScaleActual ? 'logarithmic' : 'linear';

	//let useLogScaleKelly = false;
	let yAxisTypeKelly: 'linear' | 'logarithmic'; // <-- Explicitly typed
	$: yAxisTypeKelly = useLogScaleKelly ? 'logarithmic' : 'linear';

	
	// Declare the variable with the correct, strict type
	let rangeValues: [number, number];

	// Reactively assign its value when 'data' is available.
	// This ensures it always has two elements.
	$: rangeValues = [1, data.stats.totalTrades || 1];

	// --- Reactive Filtering Logic (The core of the feature) ---
	// This will re-run whenever `rangeValues` from the slider changes.
	$: filteredData = (() => {
		if (!data.chartData || data.chartData.labels.length === 0) {
			return { chartData: {}, betSizeData: {} }; // Return empty objects
		}

		// Convert 1-based slider values to 0-based array indices
		const startIndex = rangeValues[0] - 1;
		const endIndex = rangeValues[1]; // .slice() is exclusive

		return {
			chartData: {
				labels: data.chartData.labels.slice(startIndex, endIndex),
				actualEquity: data.chartData.actualEquity.slice(startIndex, endIndex),
				optimalKelly: data.chartData.optimalKelly.slice(startIndex, endIndex),
				halfKelly: data.chartData.halfKelly.slice(startIndex, endIndex)
			},
			betSizeData: {
				labels: data.betSizeData.labels.slice(startIndex, endIndex),
				actual: data.betSizeData.actual.slice(startIndex, endIndex),
				recommended: data.betSizeData.recommended.slice(startIndex, endIndex)
			}
		};
	})();
	
	// --- State for the Y-Axis Toggles ---
	let useLogScaleActual = false;
	$: yAxisTypeActual = useLogScaleActual ? 'logarithmic' : 'linear';

	let useLogScaleKelly = false;
	$: yAxisTypeKelly = useLogScaleKelly ? 'logarithmic' : 'linear';

	// Declare the variable with the explicit union type that matches the component's prop
	// let yAxisType: 'linear' | 'logarithmic';

	// --- Function to reset everything ---
	function resetAll() {
		// Reset the slider to the full range
		rangeValues = [1, data.stats.totalTrades || 1];
		// Reset the zoomm on all charts
		if (actualChartComponent) actualChartComponent.resetZoom();
		//if (kellyChartComponent) kellyChartComponent.resetZoom();
		if (betSizeChartComponent) betSizeChartComponent.resetZoom();
	}
	// $: yAxisType = useLogScale ? 'logarithmic' : 'linear';
	
	// --- REACTIVE FILTERING LOGIC ---
	// This is the core of the feature. This reactive block ($:) will re-run
	// AUTOMATICALLY whenever 'rangeValues' (from the slider) or 'data' (from the server) changes.
	$: filteredChartData = (() => {
		// If there's no data, return an empty structure
		if (!data.chartData || data.chartData.labels.length === 0) {
			return {
				labels: [],
				actualEquity: [],
				optimalKelly: [],
				halfKelly: []
			};
		}

		// The slider gives us trade numbers (1-based), but arrays are 0-based.
		const startIndex = rangeValues[0] - 1;
		const endIndex = rangeValues[1]; // .slice() is exclusive of the end index

		// We slice the original, complete data arrays to create a new, filtered dataset.
		return {
			labels: data.chartData.labels.slice(startIndex, endIndex),
			actualEquity: data.chartData.actualEquity.slice(startIndex, endIndex),
			optimalKelly: data.chartData.optimalKelly.slice(startIndex, endIndex),
			halfKelly: data.chartData.halfKelly.slice(startIndex, endIndex)
		};
	})();
</script>

<svelte:head>
	<title>Dashboard | Kelly Journal</title>
</svelte:head>


<main class="dashboard">
	<h1>Dashboard</h1>

	<!-- KPI Cards (No changes) -->
	<div class="kpi-grid">
		<!-- ... your card ... -->
	</div>

	 {#if data.stats.totalTrades > 0}
	 	<!-- NEW: Master Control Bar --><!-- We now have a grid to hold our charts -->
		 <div class="master-controls">
			<div class="range-slider-wrapper">
				<label for="trade-range">
					Filter Trade Range: <strong>{rangeValues[0]}</strong> to <strong>
						{rangeValues[1]}</strong>
						</label>
						<RangeSlider
								id="trade-range"
								min={1}
								max={data.stats.totalTrades}
								step={1}
								bind:values={rangeValues}
						/>	
			</div>
			<button class="reset-button" on:click={resetAll}>Reset View</button>
		 </div>

		 <!-- Charts Grid -->
		<div class="charts-grid">
			<!-- Chart 1: Actual Equity -->
			<div class="chart-wrapper">
				<div class="chart-controls">
					<button class="reset-button" on:click={() => actualChartComponent.resetZoom()}>
						Reset Zoom
					</button>
					<label class="toggle-label">
						<input type="checkbox" bind:checked={useLogScaleActual} />
						Use Log Scale
					</label>
				</div>
				<div class="chart-render-area">
					<KellyChart
						bind:this={actualChartComponent}
						data={data.chartData}
						yAxisType={yAxisTypeActual}
						showActual={true}
						chartTitle="Your Actual Equity Growth"
					/>
				</div>
			</div>
			<!-- NEW Bet Size Chart -->
			<!-- Chart 2: Kelly Curves -->
			<div class="chart-wrapper bet-size-wrapper">
				<div class="chart-controls">
					<button class="reset-button" on:click={() => betSizeChartComponent.resetZoom()}>
						Reset Zoom
					</button><!--
					<label class="toggle-label">
						<input type="checkbox" bind:checked={useLogScaleKelly} />
						Use Log Scale
					</label>-->
				</div>
				<div class="chart-render-area">
					<BetSizeChart 
						bind:this={betSizeChartComponent}
						data={data.betSizeData}
					/><!--	yAxisType={yAxisTypeKelly}
						showOptimal={true}
						showHalf={true}
						chartTitle="Simulated Kelly Growth"
					/>-->
				</div>
			</div>
		</div>
		<!--
        <div class="card">
			<h2>Optimal Kelly %</h2>
			<p class="stat {data.stats.kellyPercentage > 0 ? 'positive' : 'negative'}">
				{(data.stats.kellyPercentage * 100).toFixed(2)}%
			</p>
			<small>Suggested risk per trade</small>
		</div>
		<div class="card">
			<h2>Win Rate</h2>
			<p class="stat">{(data.stats.winRate * 100).toFixed(1)}%</p>
			<small>({(data.stats.winRate * data.stats.totalTrades).toFixed(0)} W / {((1-data.stats.winRate) * data.stats.totalTrades).toFixed(0)} L)</small>
		</div>
		<div class="card">
			<h2>Win/Loss Ratio</h2>
			<p class="stat">{data.stats.winLossRatio.toFixed(2)}</p>
			<small>Average win / average loss</small>
		</div>
		<div class="card">
			<h2>Total P&L</h2>
			<p class="stat {data.stats.totalPnl > 0 ? 'positive' : 'negative'}">
				{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
					data.stats.totalPnl
				)}
			</p>
			<small>Over {data.stats.totalTrades} trades</small>
		</div>
	</div>-->

	<!-- The Chart and our NEW Filter Controls 
	{#if data.stats.totalTrades > 0}
		<div class="chart-wrapper">
			<div class="chart-controls">
				--- NEW TOGGLE SWITCH for the Y-Axis ---
				<label class="toggle-label">
					<input type="checkbox" bind:checked={useLogScale} />
					Use Logarithmic Scale
				</label>
			</div>
            
			!-- UPDATE: Pass the new yAxisType prop to the component
			<div class="chart-render-area">
				<KellyChart data={filteredChartData} {yAxisType} />
			</div>
			!-- UPDATE: The chart now gets its data from our *filtered* variable! 
			<KellyChart data={filteredChartData} />

			<div class="filter-controls">
				<label for="trade-range">
					Displaying trades <strong>{rangeValues[0]}</strong> to <strong>{rangeValues[1]}</strong>
				</label>
				!-- The Range Slider Component
				<RangeSlider
					id="trade-range"
					min={1}
					max={data.stats.totalTrades}
					step={1}
					bind:values={rangeValues}
				/>
			</div>
		</div>
		-->
	{:else}
		<div class="no-trades-message">
			<p>No trades logged yet.</p>
			<a href="/import">Import your trades</a> to see your analysis.
		</div>
	{/if}
</main>

<style>

	.bet-size-wrapper {
    margin-top: 2rem;
	}

	.dashboard {
		/* We no longer need max-width here, the layout handles it */
		width: 100%;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 2rem;
		color: #343a40;
	}

	.kpi-grid {
		display: grid;
		/* Allow columns to grow but not shrink below 220px. 
           This creates a responsive grid that looks great on all screen sizes. */
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2.5rem;
	}
/*
	.card {
		background-color: #ffffff; /* Change to pure white for a cleaner look *
		border-radius: 12px; /* Slightly more rounded corners *
		padding: 1.5rem;
		border: 1px solid #dee2e6; /* A subtle border *
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); /* A very subtle shadow *
		transition: transform 0.2s ease-in-out;
	}
	.card:hover {
		transform: translateY(-5px); /* Add a slight lift on hover *
	}

	.card h2 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		font-weight: 500;
		color: #6c757d;
	}

	.stat {
		font-size: 2.25rem;
		font-weight: 700;
		margin: 0;
		line-height: 1.2;
	}
	.stat.positive { color: #198754; } /* A darker, more accessible green *
	.stat.negative { color: #dc3545; } /* A standard bootstrap red *
	.card small { color: #6c757d; font-size: 0.875rem; }

	 NEW: Grid for the charts */
	.charts-grid {
		display: grid;
		/* Two columns of equal width */
		grid-template-columns: 1fr 1fr;
		gap: 2rem; /* Space between the charts */
		margin-top: 2rem;
	}

	.chart-wrapper {
		background-color: #ffffff;
		border: 1px solid #dee2e6;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
	}

	.chart-controls {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 1.5rem;
		padding-bottom: 1.5rem;
		flex-shrink: 0; /* Prevent controls from shrinking */
	}

	.chart-render-area {
		flex-grow: 1; /* Allow the chart area to fill available vertical space */
		height: 60vh; /* Give it a good default height */
		min-height: 400px;
	}
/*
	.chart-wrapper {
		margin-top: 2rem;
		background-color: #ffffff;
		border: 1px solid #dee2e6;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.chart-controls {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 1.5rem;
		padding: 0 0 1.5rem; /* Only add padding at the bottom	}
*/
	.reset-button {
		background-color: #f8f9fa;
		color: #495057;
		border: 1px solid #dee2e6;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}
	.reset-button:hover {
		background-color: #e9ecef;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		color: #495057;
	}
/*
	.chart-render-area {
		/* Let's use a dynamic aspect ratio for better responsiveness *
		height: auto;
		aspect-ratio: 16 / 7; /* A nice wide aspect ratio *
		max-height: 70vh; /* But don't let it get too tall on certain screens *
	}
		*/

	/* On smaller screens, stack the charts vertically */
	@media (max-width: 1200px) {
		.charts-grid {
			grid-template-columns: 1fr; /* Single column */
		}
	}

	.no-trades-message {
		text-align: center;
		padding: 4rem;
		background-color: #ffffff;
		border-radius: 12px;
	}
	/* ... all your previous styles ... 
	.dashboard {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}
	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	.card {
		background-color: #f9f9f9;
		border-radius: 8px;
		padding: 1.5rem;
		border: 1px solid #eee;
	}
	.card h2 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		color: #555;
	}
	.stat {
		font-size: 2rem;
		font-weight: bold;
		margin: 0;
	}
	.stat.positive { color: #2a9d8f; }
	.stat.negative { color: #e76f51; }
	.card small { color: #777; }
    .chart-wrapper {
		margin-top: 2rem;
		border: 1px solid #eee;
		border-radius: 8px;
		padding: 1rem;
	}
	.no-trades-message {
		text-align: center;
		padding: 4rem;
		background-color: #f9f9f9;
		border-radius: 8px;
	}
    
	/* --- NEW STYLES FOR THE FILTER --- 
	.filter-controls {
		margin-top: 2rem;
		padding: 1.5rem;
		background-color: #f9f9f9;
		border-radius: 8px;
	}
	.filter-controls label {
		display: block;
		margin-bottom: 1rem;
		text-align: center;
		font-size: 1.1rem;
	}
    /* This makes the slider look good 
    :global(.range-slider-pips) {
        --range-handle-size: 18px;
        --range-handle-color: #2a9d8f;
        --range-rail-color: #e5e7eb;
        --range-track-color: #2a9d8f;
    }*/
</style>