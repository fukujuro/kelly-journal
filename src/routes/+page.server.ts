// src/routes/+page.server.ts

import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { Decimal } from '@prisma/client/runtime/library';

// This 'load' function runs on the server before the page is rendered.
export const load: PageServerLoad = async () => {
	// 1. Fetch all trades, sorted chronologically. This order is CRITICAL.
	const trades = await db.trade.findMany({
		orderBy: { entryTimestamp: 'asc' }
	});

	// --- Handle the case with no trades ---
	if (trades.length === 0) {
		return {
			stats: {
				winRate: 0,
				winLossRatio: 0,
				kellyPercentage: 0,
				totalTrades: 0,
				totalPnl: 0
			},
			chartData: {
				labels: [],
				actualEquity: [],
				optimalKelly: [],
				halfKelly: []
			},
			betSizeData: {
				labels: [],
				actual: [],
				recommended: []
			}
		};
	}

	// --- 2. Calculate Key Performance Indicators (KPIs) ---
	let winCount = 0;
	let totalWinsValue = new Decimal(0);
	let lossCount = 0;
	let totalLossesValue = new Decimal(0);

	for (const trade of trades) {
		if (trade.pnl.greaterThan(0)) {
			winCount++;
			totalWinsValue = totalWinsValue.add(trade.pnl);
		} else {
			lossCount++;
			totalLossesValue = totalLossesValue.add(trade.pnl.abs());
		}
	}

	const totalTrades = trades.length;
	const winRate = totalTrades > 0 ? winCount / totalTrades : 0;
	const avgWin = winCount > 0 ? totalWinsValue.div(winCount) : new Decimal(0);
	const avgLoss = lossCount > 0 ? totalLossesValue.div(lossCount) : new Decimal(0);
	const winLossRatio = avgLoss.isZero() ? 0 : avgWin.div(avgLoss).toNumber();

	const kellyPercentage = winRate - (1 - winRate) / (winLossRatio || 1); // Avoid division by zero

	// --- 3. Calculate the Equity Curves for Charting ---
	const startingCapital = 10000; // Let's assume a starting capital
	const labels: string[] = [];
	const actualEquity: number[] = [startingCapital];
	const optimalKelly: number[] = [startingCapital];
	const halfKelly: number[] = [startingCapital];

	// We need the OVERALL Win/Loss Ratio for the simulation
	// This was already calculated above, but we'll reference it here for clarity.
	// const winLossRatio = ...

	for (let i = 0; i < trades.length; i++) {
		const trade = trades[i];
		labels.push(`Trade ${i + 1}`);

		// Update actual equity curve (this is correct)
		const lastActualEquity = actualEquity[actualEquity.length - 1];
		actualEquity.push(lastActualEquity + trade.pnl.toNumber());

		// --- Recalculate RUNNING stats to simulate what a trader would know at the time ---
    	const historicalTrades = trades.slice(0, i + 1);
    	const runningWins = historicalTrades.filter((t) => t.pnl.greaterThan(0));

		// Avoid division by zero for initial trades
		if (historicalTrades.length < 2 || runningWins.length === 0 || runningWins.length === historicalTrades.length) {
			// Not enough data to calculate Kelly, so we don't bet. Equity stays flat.
			optimalKelly.push(optimalKelly[optimalKelly.length - 1]);
			halfKelly.push(halfKelly[halfKelly.length - 1]);
			continue; // Skip to the next trade
		}
		// To simulate Kelly, we must recalculate W and R at each step in time!
		// This simulates what you would have known at that point.
		// const historicalTrades = trades.slice(0, i + 1);
		// const runningWins = historicalTrades.filter((t) => t.pnl.greaterThan(0));
		const runningLosses = historicalTrades.filter((t) => t.pnl.lessThanOrEqualTo(0));
		
		const runningWinRate = runningWins.length / historicalTrades.length;
		const runningAvgWin = runningWins.reduce((sum, t) => sum.add(t.pnl), new Decimal(0)).div(runningWins.length || 1);
		const runningAvgLoss = runningLosses.reduce((sum, t) => sum.add(t.pnl.abs()), 
	new Decimal(0)).div(runningLosses.length || 1);
		const runningWinLossRatio = runningAvgLoss.isZero() ? 0 : runningAvgWin.div(runningAvgLoss).toNumber();

		let runningKelly = runningWinRate - (1 - runningWinRate) / (runningWinLossRatio || 1);
		
		// If Kelly is negative or invalid, we don't bet.
		const kellyFractionToBet = Math.max(0, runningKelly);

		// Simulate the P&L for the Kelly strategies
		const lastKellyEquity = optimalKelly[optimalKelly.length - 1];
		const lastHalfKellyEquity = halfKelly[halfKelly.length - 1];

		let optimalKellyPnl = 0;
		let halfKellyPnl = 0;
		
		 // Determine the outcome of the current trade
    	const wasWin = trade.pnl.greaterThan(0);

		// Calculate capital to risk for each strategy
		const optimalKellyCapitalToRisk = lastKellyEquity * kellyFractionToBet;
		const halfKellyCapitalToRisk = lastHalfKellyEquity * (kellyFractionToBet * 0.5);

		if (wasWin) {
			// If we win, we make R times our risked capital
			optimalKellyPnl = optimalKellyCapitalToRisk * runningWinLossRatio;
			halfKellyPnl = halfKellyCapitalToRisk * runningWinLossRatio;
		} else {
			// If we lose, we lose the risked capital
			optimalKellyPnl = -optimalKellyCapitalToRisk;
			halfKellyPnl = -halfKellyCapitalToRisk;
		}
		/*
		const riskPerTrade = trade.pnl.greaterThan(0) ? trade.pnl.div(winLossRatio || 1) : trade.pnl.abs();

		const optimalKellyPnl = riskPerTrade.mul(kellyFractionToBet).mul(trade.pnl.isPositive() ? winLossRatio : -1);
		const halfKellyPnl = riskPerTrade.mul(kellyFractionToBet * 0.5).mul(trade.pnl.isPositive() ? winLossRatio : -1);

		optimalKelly.push(lastKellyEquity + optimalKellyPnl.toNumber());
		halfKelly.push(lastHalfKellyEquity + halfKellyPnl.toNumber()); */
		optimalKelly.push(lastKellyEquity + optimalKellyPnl);
    	halfKelly.push(lastHalfKellyEquity + halfKellyPnl);
	}

	// 4. Return all the calculated data to the frontend.
	// --- 4. Calculate Bet Size Comparison Data ---
	const actualBetSizePercent: (number | null)[] = [];
	const kellyBetSizePercent: (number | null)[] = [];

	// Re-use the same loop structure
	for (let i = 0; i < trades.length; i++) {
		const trade = trades[i];

		// We need the equity *before* this trade
		const equityBeforeTrade = actualEquity[i]; // From our previous loop

		// Estimate the capital at risk for this specific trade
		let capitalAtRisk: number;
		if (trade.pnl.lessThan(0)) {
			// For a loss, the risk is the absolute P&L
			capitalAtRisk = trade.pnl.abs().toNumber();
		} else {
			// For a win, estimate risk based on the overall Win/Loss Ratio
			// Risk = Profit / R. If R is 0, we can't estimate, so we use PNL as a fallback.
			capitalAtRisk = winLossRatio > 0 ? trade.pnl.toNumber() / winLossRatio : trade.pnl.toNumber();
		}

		// Calculate the actual bet size as a percentage of equity
		const actualPercent = (capitalAtRisk / equityBeforeTrade) * 100;
		actualBetSizePercent.push(actualPercent);

		// --- Get the Kelly % that was recommended at that time ---
		// (this is a slightly simplified re-calculation from the previous loop)
		const historicalTrades = trades.slice(0, i + 1);
		const runningWins = historicalTrades.filter((t) => t.pnl.greaterThan(0));
		const runningLosses = historicalTrades.filter((t) => t.pnl.lessThanOrEqualTo(0));

		if (runningWins.length === 0 || runningLosses.length === 0) {
			kellyBetSizePercent.push(null); // Not enough data to calculate
        	continue;
		}

		const runningWinRate = runningWins.length / historicalTrades.length;
		const runningAvgWin = runningWins.reduce((sum, t) => sum.add(t.pnl), new Decimal(0)).div(runningWins.length);
		const runningAvgLoss = runningLosses.reduce((sum, t) => sum.add(t.pnl.abs()), new Decimal(0)).div(runningLosses.length);
		const runningWinLossRatio = runningAvgLoss.isZero() ? 1 : runningAvgWin.div(runningAvgLoss).toNumber();
		
		let runningKelly = runningWinRate - (1 - runningWinRate) / (runningWinLossRatio  || 1);
	
		// We use Half-Kelly for the recommendation as it's safer
		const recommendedPercent = Math.max(0, runningKelly * 0.5) * 100;
		kellyBetSizePercent.push(recommendedPercent);
	}

	// --- 5. Add the new bet size data to the return object ---
	return {
		stats: {
			winRate,
			winLossRatio,
			kellyPercentage: isFinite(kellyPercentage) ? kellyPercentage : 0,
			totalTrades,
			totalPnl: totalWinsValue.sub(totalLossesValue).toNumber()
		},
		chartData: {
			labels,
			actualEquity,
			optimalKelly,
			halfKelly
		},
		// NEW data for the bet size chart
		betSizeData: {
			labels, // We can reuse the same labels (Trade 1, Trade 2, ...)
			actual: actualBetSizePercent,
			recommended: kellyBetSizePercent
		}
	};
};