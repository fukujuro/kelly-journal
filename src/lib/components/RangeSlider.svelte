<script lang="ts">
	// These are the properties the component will accept
	export let min = 0;
	export let max = 100;
	export let step = 1;
	// `values` is the key part. It's a two-way binding.
	export let values: [number, number];

	// Internal state to prevent sliders from crossing over each other
	$: minVal = Math.min(values[0], values[1]);
	$: maxVal = Math.max(values[0], values[1]);
</script>

<div class="range-slider-container" {...$$restProps}>
	<input
		type="range"
		{min}
		{max}
		{step}
		bind:value={values[0]}
		aria-label="Minimum value"
	/>
	<input
		type="range"
		{min}
		{max}
		{step}
		bind:value={values[1]}
		aria-label="Maximum value"
	/>
	<div
		class="slider-track"
		style="--min: {minVal}; --max: {maxVal}; --abs-min: {min}; --abs-max: {max}"
	></div>
</div>

<style>
	.range-slider-container {
		position: relative;
		height: 20px;
		display: flex;
		align-items: center;
	}

	input[type='range'] {
		position: absolute;
		width: 100%;
		/* Make the default track invisible */
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		pointer-events: none; /* Let clicks pass through to the container/other slider */
		z-index: 3;
	}

	/* Style the slider thumb */
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		background-color: #2a9d8f;
		border-radius: 50%;
		cursor: pointer;
		pointer-events: auto; /* Thumbs are clickable */
		margin-top: -8px; /* Center thumb on track */
	}

	input[type='range']::-moz-range-thumb {
		width: 18px;
		height: 18px;
		background-color: #2a9d8f;
		border-radius: 50%;
		cursor: pointer;
		pointer-events: auto;
	}

	/* Custom track that shows the selected range */
	.slider-track {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 4px;
		transform: translateY(-50%);
		background-color: #e5e7eb;
		border-radius: 4px;
		z-index: 1;
	}
	/* The 'filled' part of the track */
	.slider-track::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		background-color: #2a9d8f;
		border-radius: 4px;
		/* Magic happens here with CSS Custom Properties */
		left: calc(100% * (var(--min) - var(--abs-min)) / (var(--abs-max) - var(--abs-min)));
		right: calc(100% - 100% * (var(--max) - var(--abs-min)) / (var(--abs-max) - var(--abs-min)));
	}
</style>