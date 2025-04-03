import { Coordinates } from "@domain/value-objects/Coordinates";
import { Money } from "@domain/value-objects/Money";

export class Order {
    readonly orderNumber: string; // Unique identifier for the order
    readonly productId: string; // Reference to the product ordered (e.g., 'SCOS_P1_PRO')
    readonly quantity: number;
    readonly shippingAddress: Coordinates;
    readonly totalPrice: Money; // Total price *after* discount
    readonly discountAppliedPercentage: number; // The percentage discount applied (e.g., 10 for 10%)
    readonly shippingCost: Money; // The calculated shipping cost
    readonly submittedAt: Date; // Timestamp of submission

    constructor(
        orderNumber: string,
        productId: string,
        quantity: number,
        shippingAddress: Coordinates,
        totalPrice: Money,
        discountAppliedPercentage: number,
        shippingCost: Money,
    ) {
        if (!orderNumber) {
            throw new Error('Order number is required.');
        }
        if (quantity <= 0 || !Number.isInteger(quantity)) {
            throw new Error('Quantity must be a positive integer.');
        }
        if (discountAppliedPercentage < 0 || discountAppliedPercentage > 100) {
            throw new Error('Discount percentage must be between 0 and 100.');
        }

        this.orderNumber = orderNumber;
        this.productId = productId;
        this.quantity = quantity;
        this.shippingAddress = shippingAddress;
        this.totalPrice = totalPrice;
        this.discountAppliedPercentage = discountAppliedPercentage;
        this.shippingCost = shippingCost;
        this.submittedAt = new Date(); // Record submission time automatically
    }

    // Simple method to get order state, useful for persistence
    public getState() {
        return {
            orderNumber: this.orderNumber,
            productId: this.productId,
            quantity: this.quantity,
            shippingAddress: {
                latitude: this.shippingAddress.latitude,
                longitude: this.shippingAddress.longitude,
            },
            totalPriceCents: this.totalPrice.amountInCents,
            discountAppliedPercentage: this.discountAppliedPercentage,
            shippingCostCents: this.shippingCost.amountInCents,
            submittedAt: this.submittedAt.toISOString(),
        };
    }
} 