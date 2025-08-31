<script lang="ts">
	import KellyChart from '$lib/components/KellyChart.svelte';
	import type { PageData } from './$types';

	// This 'data' prop is automatically populated by your `+page.server.ts` load function!
	export let data: PageData;
</script>

<svelte:head>
	<title>Dashboard | Kelly Journal</title>
</svelte:head>

<main class="dashboard">
	<h1>Dashboard</h1>

	<!-- KPI Cards -->
	<div class="kpi-grid">
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
	</div>

	<!-- The Chart -->
	{#if data.stats.totalTrades > 0}
		<div class="chart-wrapper">
			<KellyChart data={data.chartData} />
		</div>
	{:else}
		<div class="no-trades-message">
			<p>No trades logged yet.</p>
			<a href="/log-trade">Log your first trade</a> to see your analysis.
		</div>
	{/if}
</main>

<style>
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
</style>