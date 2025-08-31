import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { z } from 'zod';
import Papa from 'papaparse';
import { db } from '$lib/server/db';

// 1. Define a schema for a single row using Zod
// This ensures every row from the CSV has the correct data types before we process it.
const tradeRowSchema = z.object({
	Asset: z.string().min(1, { message: 'Asset cannot be empty' }),
	// `z.coerce.date()` is powerful: it takes a string and tries to convert it into a valid Date object.
	EntryTimestamp: z.coerce.date({ invalid_type_error: 'Invalid entry date format' }),
	ExitTimestamp: z.coerce.date({ invalid_type_error: 'Invalid exit date format' }),
	// `z.coerce.number()` converts a string from the CSV into a number.
	PositionSize: z.coerce.number({ invalid_type_error: 'Position size must be a number' }),
	Pnl: z.coerce.number({ invalid_type_error: 'Pnl must be a number' })
});

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const file = formData.get('trades-csv') as File;

		if (!file || file.size === 0) {
			return fail(400, { success: false, message: 'No file was uploaded.' });
		}

		const csvText = await file.text();

		// 2. Parse the CSV text into JSON using Papa Parse
		const parseResult = Papa.parse(csvText, {
			header: true, // Treat the first row as headers
			skipEmptyLines: true
		});

		const tradesToCreate = [];
		const validationErrors: { row: number; errors: string[] }[] = [];

		// 3. Validate each row against our Zod schema
		for (let i = 0; i < parseResult.data.length; i++) {
			const row = parseResult.data[i];
			const result = tradeRowSchema.safeParse(row);

			if (result.success) {
				// For now, let's assume a single user and strategy for simplicity
				// In a real app, you'd get these from the logged-in user or a form select
				tradesToCreate.push({
					asset: result.data.Asset,
					entryTimestamp: result.data.EntryTimestamp,
					exitTimestamp: result.data.ExitTimestamp,
					positionSize: result.data.PositionSize,
					pnl: result.data.Pnl,
					userId: 1, // HARDCODED: Replace with actual logged-in user ID
					strategyId: 1 // HARDCODED: Replace with actual strategy ID
				});
			} else {
				// Collate validation errors to show the user
				validationErrors.push({
					row: i + 2, // +2 because of 0-indexing and the header row
					errors: result.error.issues.map((issue) => `${issue.path[0]}: ${issue.message}`)
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
            return fail(400, { success: false, message: 'CSV file was empty or contained no valid trades.' });
        }

		// 4. Insert the valid trades into the database
		try {
			const result = await db.trade.createMany({
				data: tradesToCreate
			});
			return {
				success: true,
				message: `Successfully imported ${result.count} trades.`
			};
		} catch (error) {
			console.error('Database import error:', error);
			return fail(500, {
				success: false,
				message: 'A database error occurred. Could not import trades.'
			});
		}
	}
};