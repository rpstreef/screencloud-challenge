import { Warehouse } from "@domain/entities/Warehouse";

// Represents the update needed for a single warehouse's stock
export interface WarehouseStockUpdate {
    warehouseId: string;
    quantityChange: number; // Positive to increase, negative to decrease
}

export interface IWarehouseRepository {
    /**
     * Retrieves all warehouses.
     * @returns A promise that resolves to an array of Warehouse entities.
     */
    findAll(): Promise<Warehouse[]>;

    /**
     * Finds a specific warehouse by its ID.
     * @param warehouseId The ID of the warehouse to find.
     * @returns A promise that resolves to the Warehouse entity or null if not found.
     */
    findById(warehouseId: string): Promise<Warehouse | null>;

    /**
     * Updates the stock levels for multiple warehouses atomically.
     * This is crucial for processing orders that span multiple warehouses.
     * Implementations should ensure this happens within a transaction.
     * @param updates An array of stock updates.
     * @returns A promise that resolves when the update is complete.
     * @throws Error if any update fails (e.g., stock goes negative if not allowed by implementation).
     */
    updateStockLevels(updates: WarehouseStockUpdate[]): Promise<void>;

    // Optional: Add methods like save() or create() if warehouses can be added/modified dynamically
    // save(warehouse: Warehouse): Promise<void>;
} 