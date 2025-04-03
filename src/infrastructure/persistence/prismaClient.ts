import { PrismaClient } from '@prisma/client';

// Instantiate Prisma Client
const prisma = new PrismaClient({
    // Optional: Add logging configuration
    // log: ['query', 'info', 'warn', 'error'],
});

export default prisma; 