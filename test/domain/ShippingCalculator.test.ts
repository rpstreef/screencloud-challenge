import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { ShippingCalculator } from '../../src/domain/services/ShippingCalculator';
import { Warehouse } from '../../src/domain/entities/Warehouse';
import { Coordinates } from '../../src/domain/value-objects/Coordinates';
import { Weight } from '../../src/domain/value-objects/Weight';
import { Money } from '../../src/domain/value-objects/Money';
import { Distance } from '../../src/domain/value-objects/Distance';

// Test suite for ShippingCalculator, verifying cost calculation based on distance, weight, and rate.
describe('ShippingCalculator', () => {
    const calculator = new ShippingCalculator(); // Uses default rate $0.01 /kg /km

    // Mock Warehouses and Destinations for consistent test inputs
    const warehouseA = new Warehouse('wh-a', 'Warehouse A', new Coordinates(0, 0), 100);
    const destinationNear = new Coordinates(0.1, 0); // Approx 11.1 km
    const destinationFar = new Coordinates(10, 0); // Approx 1111.9 km

    // Edge case: Test that zero weight results in zero shipping cost, regardless of distance.
    it('should calculate zero cost for zero weight', () => {
        const weight = Weight.zero();
        const result = calculator.calculateLegCost(warehouseA, destinationNear, weight);
        expect(result.cost.amountInCents).toBe(0);
        // Note: Distance calculation itself might not be zero, but cost should be.
    });

    // Edge case: Test that zero distance (shipping from/to same location) results in zero cost.
    it('should calculate zero cost for zero distance (same location)', () => {
        const weight = new Weight(1000); // 1 kg
        const result = calculator.calculateLegCost(warehouseA, warehouseA.location, weight);
        expect(result.cost.amountInCents).toBe(0);
        expect(result.distance.valueInKilometers).toBe(0);
    });

    // Core logic test: Verify the cost calculation formula (weight * distance * rate) is applied correctly.
    it('should calculate correct cost based on weight and distance', () => {
        const weight = new Weight(5000); // 5 kg
        const destination1Deg = new Coordinates(0, 1);
        const weightKg = 5;
        const rate = 0.01;

        // Calculate cost using the *actual* distance calculated by the service
        const { distance, cost } = calculator.calculateLegCost(warehouseA, destination1Deg, weight);

        // Optional: Verify distance is roughly correct (shows geo calculation is working)
        expect(distance.valueInKilometers).toBeCloseTo(111.2, 0); // Approx distance for 1 degree longitude at equator

        // Verify cost based on the *calculated* distance and known weight/rate
        const expectedCostDollars = weightKg * distance.valueInKilometers * rate;
        const expectedCostCents = Math.round(expectedCostDollars * 100);

        expect(cost.amountInCents).toBe(expectedCostCents);
    });

    // Test multi-leg aggregation: Ensure total cost correctly sums costs from individual legs.
    it('should calculate total cost for multiple legs', () => {
         // Using simplified mock leg data with pre-defined costs for clarity
         const legs = [
            { warehouse: warehouseA, quantity: 2, distance: new Distance(100), weight: new Weight(730), cost: Money.fromDollars(10) },
            { warehouse: warehouseA, quantity: 3, distance: new Distance(200), weight: new Weight(1095), cost: Money.fromDollars(30) },
        ];
        const totalCost = calculator.calculateTotalCost(legs);
        expect(totalCost.amountInCents).toBe(4000); // $10 + $30 = $40
    });

    // Edge case: Ensure calculating total cost for an empty list of legs results in zero.
    it('should calculate total cost correctly for an empty list of legs', () => {
        const legs: any[] = [];
        const totalCost = calculator.calculateTotalCost(legs);
        expect(totalCost.amountInCents).toBe(0);
    });
}); 