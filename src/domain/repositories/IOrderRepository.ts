import { Order } from "@domain/entities/Order";

export interface IOrderRepository {
    /**
     * Saves a new order to the persistent storage.
     * @param order The Order entity to save.
     * @returns A promise that resolves when the order is saved successfully.
     * @throws Error if saving fails (e.g., database error, duplicate order number).
     */
    save(order: Order): Promise<void>;

    /**
     * Finds an order by its unique order number.
     * @param orderNumber The order number to search for.
     * @returns A promise that resolves to the Order entity or null if not found.
     */
    findByOrderNumber(orderNumber: string): Promise<Order | null>;

    // Optional: Add methods like findAll(), findByCustomerId(), etc., if needed later
    // findAll(): Promise<Order[]>;
} 