import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { z } from 'zod';
import Papa from 'papaparse';
import { db } from '$lib/server/db';

// 1. Define a NEW Zod schema that matches the HEADERS of the INPUT CSV.
// We are validating the raw data as it comes in.
const metatraderRowSchema = z.object({
	Symbol: z.string().min(1),
	'Open Time': z.string(), // We will validate the date format customly
	'Close Time': z.string(),
	Profit: z.coerce.number(),
	Lots: z.coerce.number(),
	Commission: z.coerce.number(),
	Swap: z.coerce.number()
	// We ignore all other columns like 'Ticket ID', 'SL', etc. for now
});

// Helper function to parse the tricky date formats from the CSV
function parseMetaTraderDate(dateString: string): Date | null {
	// The format could be 'YYYY.MM.DD HH:MM:SS' or 'YYYY-MM-DD HH:MM:SS'
	const normalizedString = dateString.replace('.', '-').replace('.', '-');
	const date = new Date(normalizedString);
	// Check if the date is valid. `new Date('invalid')` results in `NaN`.
	return isNaN(date.getTime()) ? null : date;
}

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const file = formData.get('trades-csv') as File;

		if (!file || file.size === 0) {
			return fail(400, { success: false, message: 'No file was uploaded.', errors: undefined });
		}

		const csvText = await file.text();

		// 2. Parse the CSV text using Papa Parse
		const parseResult = Papa.parse(csvText, {
			header: true,
			skipEmptyLines: true
		});

		const tradesToCreate = [];
		const validationErrors: { row: number; errors: string[] }[] = [];

		// 3. Loop through, validate, and TRANSFORM each row
		for (let i = 0; i < parseResult.data.length; i++) {
			const row: any = parseResult.data[i];
			const result = metatraderRowSchema.safeParse(row);

			if (result.success) {
				const { Symbol, 'Open Time': openTime, 'Close Time': closeTime, Profit, Lots, Commission, Swap } =
					result.data;

				// Custom validation for dates
				const entryTimestamp = parseMetaTraderDate(openTime);
				const exitTimestamp = parseMetaTraderDate(closeTime);
				let currentErrors: string[] = [];

				if (!entryTimestamp) {
					currentErrors.push('Open Time: Invalid date format');
				}
				if (!exitTimestamp) {
					currentErrors.push('Close Time: Invalid date format');
				}

				if (currentErrors.length > 0) {
					validationErrors.push({ row: i + 2, errors: currentErrors });
					continue; // Skip to the next row
				}

				// All good, let's map the validated data to our database schema
				tradesToCreate.push({
					asset: Symbol,
					entryTimestamp: entryTimestamp!, // We know it's not null here
					exitTimestamp: exitTimestamp!,
					positionSize: Lots,
					// Calculate Net P&L
					pnl: Profit + Commission + Swap,
					userId: 1, // HARDCODED: Replace with actual logged-in user ID
					strategyId: 1 // HARDCODED: Replace with actual strategy ID
				});
			} else {
				// Collate Zod validation errors
				validationErrors.push({
					row: i + 2, // +2 for 0-indexing and header
					errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
				});
			}
		}

		if (validationErrors.length > 0) {
			return fail(400, {
				success: false,
				message: `Found ${validationErrors.length} errors in your CSV file. No trades were imported.`,
				errors: validationErrors
			});
		}

		if (tradesToCreate.length === 0) {
			return fail(400, { success: false, message: 'CSV file was empty or contained no valid trades.', errors: undefined });
		}

		// 4. Insert the clean, mapped trades into the database
		try {
			// Prisma's `createMany` is highly efficient for bulk inserts
			const result = await db.trade.createMany({
				data: tradesToCreate
			});
			return {
				success: true,
				message: `Successfully imported ${result.count} trades.`,
		errors: undefined
			};
		} catch (error) {
			console.error('Database import error:', error);
			return fail(500, {
				success: false,
				message: 'A database error occurred. Could not import trades.',
		errors: undefined
			});
		}
	}
};
