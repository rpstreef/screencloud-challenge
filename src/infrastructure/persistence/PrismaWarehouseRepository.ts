import { PrismaClient, Warehouse as PrismaWarehouse } from "@prisma/client";
import { IWarehouseRepository, WarehouseStockUpdate } from "@domain/repositories/IWarehouseRepository";
import { Warehouse } from "@domain/entities/Warehouse";
import { Coordinates } from "@domain/value-objects/Coordinates";
import prisma from "./prismaClient"; // Import the shared client instance
import { injectable } from "tsyringe"; // For DI

// Mapper function to convert Prisma model to Domain entity
function toDomain(prismaWarehouse: PrismaWarehouse): Warehouse {
    return new Warehouse(
        prismaWarehouse.id,
        prismaWarehouse.name,
        new Coordinates(prismaWarehouse.latitude, prismaWarehouse.longitude),
        prismaWarehouse.stock
    );
}

// Optional mapper if saving/creating warehouses (not strictly needed for this implementation)
// function fromDomain(warehouse: Warehouse): Prisma.WarehouseCreateInput {
//     return {
//         id: warehouse.id,
//         name: warehouse.name,
//         latitude: warehouse.location.latitude,
//         longitude: warehouse.location.longitude,
//         stock: warehouse.stock
//     };
// }

@injectable() // Decorator for dependency injection
export class PrismaWarehouseRepository implements IWarehouseRepository {
    private readonly client: PrismaClient;

    // Inject the PrismaClient instance (could also directly use the imported `prisma`)
    constructor() {
        this.client = prisma;
    }

    async findAll(): Promise<Warehouse[]> {
        const prismaWarehouses = await this.client.warehouse.findMany();
        return prismaWarehouses.map(toDomain);
    }

    async findById(warehouseId: string): Promise<Warehouse | null> {
        const prismaWarehouse = await this.client.warehouse.findUnique({
            where: { id: warehouseId },
        });
        return prismaWarehouse ? toDomain(prismaWarehouse) : null;
    }

    async updateStockLevels(updates: WarehouseStockUpdate[]): Promise<void> {
        // Prisma recommends using $transaction for atomic updates
        const updatePromises = updates.map(update => {
            return this.client.warehouse.update({
                where: { id: update.warehouseId },
                data: {
                    stock: {
                        // Use increment/decrement for atomic operations
                        increment: update.quantityChange > 0 ? update.quantityChange : undefined,
                        decrement: update.quantityChange < 0 ? -update.quantityChange : undefined,
                    },
                },
            });
        });

        // Execute all updates within a transaction
        try {
            // Note: This executes updates sequentially. For true parallel execution
            // within a transaction, consider interactive transactions if performance is critical
            // and if your DB supports it well.
            await this.client.$transaction(updatePromises);
        } catch (error: any) {
            // Handle potential errors, e.g., stock going below zero if constraints are set
            // Prisma might throw P2025 if trying to update a non-existent record
            console.error("Transaction failed during stock update:", error);
            // Consider mapping to a specific ApplicationError
            throw new Error(`Failed to update stock levels: ${error.message}`);
        }
    }
} 