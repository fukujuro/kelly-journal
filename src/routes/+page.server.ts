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

	// This is the most complex part. We simulate the equity growth trade-by-trade.
	for (let i = 0; i < trades.length; i++) {
		const trade = trades[i];
		labels.push(`Trade ${i + 1}`);

		// Update actual equity curve
		const lastActualEquity = actualEquity[actualEquity.length - 1];
		actualEquity.push(lastActualEquity + trade.pnl.toNumber());

		// To simulate Kelly, we must recalculate W and R at each step in time!
		// This simulates what you would have known at that point.
		const historicalTrades = trades.slice(0, i + 1);
		const runningWins = historicalTrades.filter((t) => t.pnl.greaterThan(0));
		const runningLosses = historicalTrades.filter((t) => t.pnl.lessThanOrEqualTo(0));
		
		const runningWinRate = runningWins.length / historicalTrades.length;
		const runningAvgWin = runningWins.reduce((sum, t) => sum.add(t.pnl), new Decimal(0)).div(runningWins.length || 1);
		const runningAvgLoss = runningLosses.reduce((sum, t) => sum.add(t.pnl.abs()), new Decimal(0)).div(runningLosses.length || 1);
		const runningWinLossRatio = runningAvgLoss.isZero() ? 0 : runningAvgWin.div(runningAvgLoss).toNumber();

		const runningKelly = runningWinRate - (1 - runningWinRate) / (runningWinLossRatio || 1);
		
		// If Kelly is negative or invalid, we don't bet.
		const kellyFractionToBet = Math.max(0, runningKelly);

		// Simulate the P&L for the Kelly strategies
		const lastKellyEquity = optimalKelly[optimalKelly.length - 1];
		const lastHalfKellyEquity = halfKelly[halfKelly.length - 1];
		
		const riskPerTrade = trade.pnl.greaterThan(0) ? trade.pnl.div(winLossRatio || 1) : trade.pnl.abs();

		const optimalKellyPnl = riskPerTrade.mul(kellyFractionToBet).mul(trade.pnl.isPositive() ? winLossRatio : -1);
		const halfKellyPnl = riskPerTrade.mul(kellyFractionToBet * 0.5).mul(trade.pnl.isPositive() ? winLossRatio : -1);

		optimalKelly.push(lastKellyEquity + optimalKellyPnl.toNumber());
		halfKelly.push(lastHalfKellyEquity + halfKellyPnl.toNumber());
	}

	// 4. Return all the calculated data to the frontend.
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
		}
	};
};