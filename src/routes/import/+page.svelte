<script lang="ts">
	import type { ActionData } from './$types';

	// 'form' will be populated with the return data from our server action
	export let form: ActionData;
</script>

<svelte:head>
	<title>Import Trades | Kelly Journal</title>
</svelte:head>

<main class="import-page">
	<h1>Import Trades from CSV</h1>

	<div class="instructions">
		<p>
			Upload a CSV file with your trade history. The file must contain the following headers:
			<code>Asset,EntryTimestamp,ExitTimestamp,PositionSize,Pnl</code>
		</p>
		<a href="/template.csv" download>Download Template CSV</a>
	</div>

	<!-- The form that will post to our server action -->
	<form method="POST" enctype="multipart/form-data">
		<label for="trades-csv">Trade History CSV File</label>
		<input name="trades-csv" id="trades-csv" type="file" accept=".csv" required />
		<button type="submit">Import Trades</button>
	</form>

	<!-- Display feedback from the server action -->
	{#if form}
		<div class="feedback" class:success={form.success} class:error={!form.success}>
			<p>{form.message}</p>

			<!-- If there are validation errors, list them -->
			{#if form.errors}
				<ul>
					{#each form.errors as validationError}
						<li>
							<strong>Row {validationError.row}:</strong>
							{validationError.errors.join(', ')}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</main>

<style>
	.import-page {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
	}
	.instructions {
		background-color: #f3f4f6;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}
	code {
		background-color: #e5e7eb;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	input[type='file'] {
		border: 1px solid #ccc;
		padding: 0.5rem;
		border-radius: 4px;
	}
	button {
		padding: 0.75rem;
		background-color: #2a9d8f;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}
	.feedback {
		margin-top: 2rem;
		padding: 1rem;
		border-radius: 8px;
	}
	.feedback.success {
		background-color: #d1fae5;
		color: #065f46;
	}
	.feedback.error {
		background-color: #fee2e2;
		color: #991b1b;
	}
	.feedback ul {
		list-style-type: none;
		padding: 0;
	}
	.feedback li {
		margin-top: 0.5rem;
	}
</style>