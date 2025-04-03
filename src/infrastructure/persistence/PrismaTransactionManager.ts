import { PrismaClient, Prisma } from "@prisma/client";
import { ITransactionManager } from "@app/use-cases/SubmitOrderUseCase"; // Use path alias
import prisma from "./prismaClient";
import { injectable } from "tsyringe";

@injectable()
export class PrismaTransactionManager implements ITransactionManager {
    private readonly client: PrismaClient;

    constructor() {
        this.client = prisma;
    }

    /**
     * Executes a function within a database transaction.
     * Uses Prisma's interactive transactions for potentially complex operations.
     * @param fn The async function to execute within the transaction.
     * The function receives the transaction client (`tx`) as an argument.
     */
    async runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
        try {
            const result = await this.client.$transaction(async (tx: Prisma.TransactionClient) => {
                console.warn('PrismaTransactionManager: runInTransaction requires the provided function to use the transaction client (tx).');
                return await fn(tx); // Pass the transactional client to the callback
            }, {
                maxWait: 15000, // default 2000ms
                timeout: 30000, // default 5000ms
            });
            return result;
        } catch (error: any) {
            console.error("Transaction failed:", error);
            // Re-throw the original error to preserve its type (e.g., ApplicationError)
            throw error;
        }
    }
}
