<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="app">
	<Header />

	<main>
		{@render children()}
	</main>

	<footer>
		<p>
			visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to learn about SvelteKit
		</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		/* This is the key change */
		width: 100%;
		max-width: 1600px; /* A generous max-width for very large monitors */
		margin: 0 auto; /* Center the content */
		padding: 1.5rem 2rem; /* Add some padding on the sides */
		box-sizing: border-box; /* Ensures padding is included in the width 
		flex: 1;
		display: flex;
		flex-direction: column; 
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box; */
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}

	/* Use a global selector to set a clean base font and background */
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif,
			'Apple Color Emoji', 'Segoe UI Emoji';
		margin: 0;
		background-color: #f8f9fa; /* A very light grey background */
		color: #212529; /* A dark, readable text color */
	}
</style>
