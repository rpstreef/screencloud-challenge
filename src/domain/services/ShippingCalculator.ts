import { Warehouse } from "@domain/entities/Warehouse";
import { Coordinates } from "@domain/value-objects/Coordinates";
import { Distance } from "@domain/value-objects/Distance";
import { Money } from "@domain/value-objects/Money";
import { Weight } from "@domain/value-objects/Weight";

import { calculateDistance } from "@infra/utils/Geolocation";
import { injectable } from 'tsyringe';

// Shipping rate constant: $0.01 per kg per km
const SHIPPING_RATE_PER_KG_PER_KM = 0.01;

// Represents a single shipment leg from one warehouse
export interface ShipmentLeg {
    warehouse: Warehouse;
    quantity: number;
    distance: Distance;
    weight: Weight;
    cost: Money;
}

@injectable()
export class ShippingCalculator {
    private readonly ratePerKgPerKm: number = SHIPPING_RATE_PER_KG_PER_KM;

    constructor() {}

    /**
     * Calculates the shipping cost for a single leg of a shipment.
     * @param warehouse The source warehouse.
     * @param destination The destination coordinates.
     * @param weight The total weight of the goods shipped from this warehouse.
     * @returns The calculated distance and shipping cost for this leg.
     */
    public calculateLegCost(warehouse: Warehouse, destination: Coordinates, weight: Weight): { distance: Distance, cost: Money } {
        const distanceKm = calculateDistance(warehouse.location, destination);
        const weightKg = weight.toKilograms();

        if (distanceKm === 0 || weightKg === 0) {
            return { distance: new Distance(0), cost: Money.fromDollars(0) };
        }

        const costDollars = weightKg * distanceKm * this.ratePerKgPerKm;
        return {
            distance: new Distance(distanceKm),
            cost: Money.fromDollars(costDollars)
        };
    }

    /**
     * Calculates the total shipping cost for a shipment potentially composed of multiple legs.
     * @param legs An array of ShipmentLeg objects representing the parts of the shipment.
     * @returns The total shipping cost for all legs combined.
     */
    public calculateTotalCost(legs: ShipmentLeg[]): Money {
        return legs.reduce((total, leg) => total.add(leg.cost), Money.fromDollars(0));
    }

} 