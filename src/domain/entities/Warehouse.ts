import { Coordinates } from "@domain/value-objects/Coordinates";

export class Warehouse {
    readonly id: string; // Could be name, or a separate ID (e.g., UUID)
    readonly name: string;
    readonly location: Coordinates;
    private _stock: number; // Use a private field for stock management

    constructor(id: string, name: string, location: Coordinates, initialStock: number) {
        if (initialStock < 0 || !Number.isInteger(initialStock)) {
            throw new Error('Initial stock cannot be negative or fractional.');
        }
        this.id = id;
        this.name = name;
        this.location = location;
        this._stock = initialStock;
    }

    get stock(): number {
        return this._stock;
    }

    // Check if enough stock is available
    public hasStock(quantity: number): boolean {
        return this._stock >= quantity;
    }

    // Method to decrease stock. Returns the actual quantity decreased.
    // This prevents stock going below zero if requested quantity is too high.
    public decreaseStock(quantity: number): number {
        if (quantity <= 0 || !Number.isInteger(quantity)) {
            throw new Error('Quantity to decrease must be a positive integer.');
        }

        const quantityToRemove = Math.min(quantity, this._stock);
        this._stock -= quantityToRemove;
        return quantityToRemove;
    }

    // Method to increase stock (e.g., for restocking or order cancellations)
    public increaseStock(quantity: number): void {
        if (quantity <= 0 || !Number.isInteger(quantity)) {
            throw new Error('Quantity to increase must be a positive integer.');
        }
        this._stock += quantity;
    }

    // Method to represent the warehouse data, useful for persistence or logging
    public getState(): { id: string; name: string; location: Coordinates; stock: number } {
        return {
            id: this.id,
            name: this.name,
            location: this.location,
            stock: this._stock,
        };
    }
} 