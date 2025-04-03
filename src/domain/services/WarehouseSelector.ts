import { Product } from "@domain/entities/Product";
import { Warehouse } from "@domain/entities/Warehouse";
import { Coordinates } from "@domain/value-objects/Coordinates";
import { Money } from "@domain/value-objects/Money";
import { ShippingCalculator, ShipmentLeg } from "@domain/services/ShippingCalculator";

import { injectable } from 'tsyringe';

// Result structure for the warehouse selection
export interface OptimalWarehouseSelection {
    legs: ShipmentLeg[];         // The list of shipments from each selected warehouse
    totalShippingCost: Money;  // The total calculated shipping cost
    isFulfilled: boolean;        // Whether the total required quantity could be fulfilled
    remainingQuantity: number; // Quantity that could not be fulfilled (0 if isFulfilled is true)
}

@injectable()
export class WarehouseSelector {
    private readonly shippingCalculator: ShippingCalculator;

    // Inject the ShippingCalculator
    constructor(shippingCalculator: ShippingCalculator) {
        this.shippingCalculator = shippingCalculator;
    }

    /**
     * Selects the optimal warehouses to fulfill an order quantity with minimum shipping cost.
     *
     * @param requiredQuantity The total number of product units required.
     * @param product The product being ordered (to get unit weight).
     * @param destination The shipping destination coordinates.
     * @param availableWarehouses An array of all available warehouses with their current stock.
     * @returns An OptimalWarehouseSelection object detailing the shipment plan.
     */
    public findOptimalWarehouses(
        requiredQuantity: number,
        product: Product, // Use the specific product
        destination: Coordinates,
        availableWarehouses: Warehouse[]
    ): OptimalWarehouseSelection {

        if (requiredQuantity <= 0) {
            return { legs: [], totalShippingCost: Money.fromDollars(0), isFulfilled: true, remainingQuantity: 0 };
        }

        const unitWeight = product.unitWeight;
        if (unitWeight.valueInGrams <= 0) {
            // Cannot ship weightless items, handle as edge case or error
            console.warn("Product has zero or negative weight, cannot calculate shipping cost per unit.");
            return { legs: [], totalShippingCost: Money.fromDollars(0), isFulfilled: false, remainingQuantity: requiredQuantity };
        }

        // 1. Calculate cost per unit for each warehouse with stock
        const warehousesWithCost = availableWarehouses
            .filter(wh => wh.stock > 0) // Only consider warehouses with stock
            .map(wh => {
                // Calculate cost to ship ONE unit from this warehouse
                const { distance, cost: costPerUnit } = this.shippingCalculator.calculateLegCost(wh, destination, unitWeight);
                return {
                    warehouse: wh,
                    distance,
                    costPerUnit,
                    // Calculate cost per unit in cents for precise sorting
                    costPerUnitCents: costPerUnit.amountInCents
                };
            })
            .filter(wh => wh.costPerUnitCents >= 0); // Ensure cost is not negative

        // 2. Sort warehouses by lowest cost per unit
        warehousesWithCost.sort((a, b) => a.costPerUnitCents - b.costPerUnitCents);

        // 3. Greedily fulfill the order from the cheapest warehouses
        const selectedLegs: ShipmentLeg[] = [];
        let quantityToFulfill = requiredQuantity;
        let totalCost = Money.fromDollars(0);

        for (const { warehouse, distance, costPerUnit } of warehousesWithCost) {
            if (quantityToFulfill <= 0) break; // Order fulfilled

            const quantityFromThisWarehouse = Math.min(quantityToFulfill, warehouse.stock);

            if (quantityFromThisWarehouse > 0) {
                const legWeight = unitWeight.multiply(quantityFromThisWarehouse);
                // Recalculate cost for the actual quantity (or multiply costPerUnit, should be equivalent if rate is linear)
                const legCost = costPerUnit.multiply(quantityFromThisWarehouse);

                selectedLegs.push({
                    warehouse,
                    quantity: quantityFromThisWarehouse,
                    distance,
                    weight: legWeight,
                    cost: legCost,
                });

                totalCost = totalCost.add(legCost);
                quantityToFulfill -= quantityFromThisWarehouse;
            }
        }

        // 4. Determine final state
        const isFulfilled = quantityToFulfill <= 0;

        return {
            legs: selectedLegs,
            totalShippingCost: totalCost,
            isFulfilled: isFulfilled,
            remainingQuantity: quantityToFulfill > 0 ? quantityToFulfill : 0,
        };
    }
} 