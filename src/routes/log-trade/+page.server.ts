import { db } from '$lib/server/db';
import type { Actions } from './$types';

export const actions: Actions = {
    // This 'default' function runs when the form is submitted
    default: async () => {
        console.log('Action: Creating a test trade...');

        // For this test, we need a user and a strategy to exist first.
        // Let's create them if they don't exist.
        let user = await db.user.findUnique({ where: { email: 'test@example.com' } });
        if (!user) {
            user = await db.user.create({ data: { email: 'test@example.com' } });
        }

        let strategy = await db.strategy.findFirst({ where: { name: 'Test Strategy' } });
        if (!strategy) {
            strategy = await db.strategy.create({
                data: {
                    name: 'Test Strategy',
                    userId: user.id
                }
            });
        }

        // Now, create the trade!
        await db.trade.create({
            data: {
                asset: 'AAPL',
                entryTimestamp: new Date(),
                positionSize: 10,
                pnl: -100,
                userId: user.id,
                strategyId: strategy.id
            }
        });

        console.log('Test trade created successfully!');

        return { success: true };
    }
};