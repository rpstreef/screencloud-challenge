import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WarehouseSelector, OptimalWarehouseSelection } from '../../src/domain/services/WarehouseSelector';
import { ShippingCalculator } from '../../src/domain/services/ShippingCalculator';
import { Warehouse } from '../../src/domain/entities/Warehouse';
import { Coordinates } from '../../src/domain/value-objects/Coordinates';
import { Money } from '../../src/domain/value-objects/Money';
import { Weight } from '../../src/domain/value-objects/Weight';
import { Distance } from '../../src/domain/value-objects/Distance';
import { scosProduct } from '../../src/domain/entities/Product'; // Use the actual product

// Mock the ShippingCalculator dependency to isolate WarehouseSelector logic
vi.mock('../../src/domain/services/ShippingCalculator');

// Test suite for WarehouseSelector, focusing on optimal (cost-based) warehouse selection and stock management.
describe('WarehouseSelector', () => {
    let mockShippingCalculator: ShippingCalculator;
    let warehouseSelector: WarehouseSelector;

    // Define test warehouses with varying stock levels
    const warehouseA = new Warehouse('wh-a', 'Warehouse A', new Coordinates(10, 10), 50);
    const warehouseB = new Warehouse('wh-b', 'Warehouse B', new Coordinates(20, 20), 100);
    const warehouseC = new Warehouse('wh-c', 'Warehouse C', new Coordinates(30, 30), 20);
    const warehouseD = new Warehouse('wh-d', 'Warehouse D (Empty)', new Coordinates(40, 40), 0);
    const allWarehouses = [warehouseA, warehouseB, warehouseC, warehouseD];

    const destination = new Coordinates(0, 0);

    beforeEach(() => {
        // Reset mocks before each test for isolation
        vi.clearAllMocks();

        // Create a mock instance of ShippingCalculator
        mockShippingCalculator = new ShippingCalculator();
        // Mock calculateLegCost to return predictable costs per unit for testing selection logic.
        // The costs are set up to test the sorting and selection: A=cheap, C=medium, B=expensive, D=cheapest (but no stock).
        mockShippingCalculator.calculateLegCost = vi.fn()
            .mockImplementation((warehouse: Warehouse, dest: Coordinates, weight: Weight) => {
                let costPerUnit = 0;
                if (warehouse.id === 'wh-a') costPerUnit = 100; // $1.00 / unit
                if (warehouse.id === 'wh-c') costPerUnit = 150; // $1.50 / unit
                if (warehouse.id === 'wh-b') costPerUnit = 200; // $2.00 / unit
                if (warehouse.id === 'wh-d') costPerUnit = 50;  // $0.50 / unit (but warehouse D has 0 stock)
                // Distance is mocked but not critical for selection logic itself, only for cost calculation
                return { distance: new Distance(100), cost: new Money(costPerUnit) };
            });

        warehouseSelector = new WarehouseSelector(mockShippingCalculator);
    });

    // Edge case: Test behavior when zero quantity is requested.
    it('should return empty selection for zero quantity', () => {
        const result = warehouseSelector.findOptimalWarehouses(0, scosProduct, destination, allWarehouses);
        expect(result.legs).toHaveLength(0);
        expect(result.totalShippingCost.amountInCents).toBe(0);
        expect(result.isFulfilled).toBe(true);
        expect(result.remainingQuantity).toBe(0);
    });

    // Test case: Verify selection of the single cheapest warehouse when it has sufficient stock.
    it('should select the cheapest warehouse if it has enough stock', () => {
        const quantity = 30; // Warehouse A (cheapest with stock @ $1.00/unit) has 50.
        const result = warehouseSelector.findOptimalWarehouses(quantity, scosProduct, destination, allWarehouses);

        expect(result.isFulfilled).toBe(true);
        expect(result.remainingQuantity).toBe(0);
        expect(result.legs).toHaveLength(1);
        expect(result.legs[0].warehouse.id).toBe('wh-a'); // Should pick Warehouse A
        expect(result.legs[0].quantity).toBe(quantity);
        // Expected cost: 30 units * $1.00/unit = $30.00
        expect(result.totalShippingCost.amountInCents).toBe(30 * 100);
    });

    // Test case: Verify selection logic correctly splits the order across multiple warehouses, prioritizing the cheapest ones first.
    it('should select multiple warehouses, ordered by cost, to fulfill the quantity', () => {
        const quantity = 60; // Needs A (50 @ $1.00) + C (10 @ $1.50)
        const result = warehouseSelector.findOptimalWarehouses(quantity, scosProduct, destination, allWarehouses);

        expect(result.isFulfilled).toBe(true);
        expect(result.remainingQuantity).toBe(0);
        expect(result.legs).toHaveLength(2);

        // Leg 1: Cheapest available (A)
        expect(result.legs[0].warehouse.id).toBe('wh-a');
        expect(result.legs[0].quantity).toBe(50); // Takes all stock from A
        // Leg 2: Next cheapest available (C)
        expect(result.legs[1].warehouse.id).toBe('wh-c');
        expect(result.legs[1].quantity).toBe(10); // Takes remaining needed quantity (60 - 50)

        // Expected cost: (50 units * $1.00/unit) + (10 units * $1.50/unit) = $50 + $15 = $65.00
        const expectedCost = (50 * 100) + (10 * 150);
        expect(result.totalShippingCost.amountInCents).toBe(expectedCost);
    });

    // Test case: Verify the selector uses all available stock from multiple warehouses if needed to fulfill a large order.
    it('should fulfill using all available stock if necessary', () => {
         const quantity = 165; // Needs A (50 @ $1.00) + C (20 @ $1.50) + B (95 @ $2.00)
        const result = warehouseSelector.findOptimalWarehouses(quantity, scosProduct, destination, allWarehouses);

        expect(result.isFulfilled).toBe(true);
        expect(result.remainingQuantity).toBe(0);
        expect(result.legs).toHaveLength(3); // Uses all warehouses with stock

        // Verify order and quantities (A -> C -> B based on cost)
        expect(result.legs[0].warehouse.id).toBe('wh-a');
        expect(result.legs[0].quantity).toBe(50);
        expect(result.legs[1].warehouse.id).toBe('wh-c');
        expect(result.legs[1].quantity).toBe(20);
        expect(result.legs[2].warehouse.id).toBe('wh-b');
        expect(result.legs[2].quantity).toBe(95); // Remaining (165 - 50 - 20)

        // Expected cost: (50 * $1.00) + (20 * $1.50) + (95 * $2.00) = $50 + $30 + $190 = $270.00
        const expectedCost = (50 * 100) + (20 * 150) + (95 * 200);
        expect(result.totalShippingCost.amountInCents).toBe(expectedCost);
    });

    // Test case: Verify behavior when the total available stock across all warehouses is less than the required quantity.
    it('should return unfulfilled if total stock is insufficient', () => {
        const quantity = 200; // Total stock is 50(A) + 100(B) + 20(C) = 170
        const result = warehouseSelector.findOptimalWarehouses(quantity, scosProduct, destination, allWarehouses);

        expect(result.isFulfilled).toBe(false);
        expect(result.remainingQuantity).toBe(30); // 200 required - 170 available
        expect(result.legs).toHaveLength(3); // Should have selected all available stock from A, B, C

        // Verify quantities from all warehouses were used according to cost order (A, C, B)
        expect(result.legs.find(l => l.warehouse.id === 'wh-a')?.quantity).toBe(50);
        expect(result.legs.find(l => l.warehouse.id === 'wh-c')?.quantity).toBe(20);
        expect(result.legs.find(l => l.warehouse.id === 'wh-b')?.quantity).toBe(100);

        // Cost should be calculated based on the stock that *was* selected, even if unfulfilled
        const expectedCost = (50 * 100) + (20 * 150) + (100 * 200); // $50 + $30 + $200 = $280.00
        expect(result.totalShippingCost.amountInCents).toBe(expectedCost);
    });

     // Edge case: Ensure warehouses with zero stock are ignored, even if they have a potentially low shipping cost.
     it('should ignore warehouses with zero stock', () => {
        const quantity = 10;
        // Warehouse D has mock cost $0.50/unit but 0 stock. Warehouse A has stock and cost $1.00/unit.
        const result = warehouseSelector.findOptimalWarehouses(quantity, scosProduct, destination, allWarehouses);

        expect(result.isFulfilled).toBe(true);
        expect(result.legs).toHaveLength(1);
        expect(result.legs[0].warehouse.id).toBe('wh-a'); // Should pick A (cost 100), not D (cost 50)
        expect(result.legs[0].quantity).toBe(quantity);
        expect(result.totalShippingCost.amountInCents).toBe(10 * 100); // 10 units * $1.00/unit
    });

     // Edge case: Test behavior with zero product weight. Should indicate unfulfilled.
     it('should return unfulfilled for zero weight product', () => {
        const zeroWeightProduct = { ...scosProduct, unitWeight: Weight.zero() };
        const quantity = 10;
        const result = warehouseSelector.findOptimalWarehouses(quantity, zeroWeightProduct, destination, allWarehouses);
        expect(result.isFulfilled).toBe(false);
        expect(result.remainingQuantity).toBe(quantity);
        expect(result.legs).toHaveLength(0);
        expect(result.totalShippingCost.amountInCents).toBe(0);
    });
}); 