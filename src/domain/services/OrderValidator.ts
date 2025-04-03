import { Money } from "@domain/value-objects/Money";

import { injectable } from 'tsyringe';

const MAX_SHIPPING_COST_PERCENTAGE = 15;

@injectable()
export class OrderValidator {
    private readonly maxShippingCostPercentage: number = MAX_SHIPPING_COST_PERCENTAGE;

    constructor() {}

    /**
     * Checks if the order is valid based on the shipping cost constraint.
     * An order is invalid if shipping cost > (maxPercentage / 100) * discountedOrderPrice.
     *
     * @param discountedOrderPrice The total price of the order *after* volume discounts.
     * @param shippingCost The calculated total shipping cost for the order.
     * @returns True if the order is valid, false otherwise.
     */
    public isOrderValid(discountedOrderPrice: Money, shippingCost: Money): boolean {
        if (discountedOrderPrice.amountInCents <= 0) {
            // Cannot calculate percentage of zero or negative price, assume invalid or handle as edge case
            // Or, if an order price of 0 is valid and shipping must also be 0:
            // return shippingCost.amountInCents === 0;
            return false; // Assuming orders must have a positive value
        }

        const maxAllowedShippingCost = discountedOrderPrice.multiply(this.maxShippingCostPercentage / 100);

        // Check if shippingCost <= maxAllowedShippingCost
        return shippingCost.lessThanOrEqual(maxAllowedShippingCost);
    }
} 