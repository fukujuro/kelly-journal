import { PrismaClient } from '@prisma/client';

// We need to declare a global variable to hold the prisma client.
// This is necessary because in development, SvelteKit's hot-reloading
// can create new instances of PrismaClient on every file change,
// quickly exhausting database connections.
// In production, this is not an issue.
declare global {
    var prisma: PrismaClient | undefined;
  }

// If 'prisma' is not already on the global object, create a new instance.
// Otherwise, use the existing instance. This ensures we only have one
// connection pool.
export const db = globalThis.prisma || new PrismaClient();

// This prevents Prisma from creating a new connection pool every time
// your code is hot-reloaded in development.
// const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = db;
}

// export const db = prisma;