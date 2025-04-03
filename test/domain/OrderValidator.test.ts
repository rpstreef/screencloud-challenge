import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { OrderValidator } from '../../src/domain/services/OrderValidator';
import { Money } from '../../src/domain/value-objects/Money';

// Test suite for OrderValidator focusing on the 15% shipping cost rule.
describe('OrderValidator', () => {
    const validator = new OrderValidator(); // Uses default 15% max shipping cost

    // Test case: Validate success when shipping cost is safely below the threshold.
    it('should return true if shipping cost is less than 15% of discounted price', () => {
        const price = Money.fromDollars(100);
        const shippingCost = Money.fromDollars(10); // 10% < 15%
        expect(validator.isOrderValid(price, shippingCost)).toBe(true);
    });

    // Test case: Validate the boundary condition where shipping cost is exactly the threshold.
    it('should return true if shipping cost is exactly 15% of discounted price', () => {
        const price = Money.fromDollars(100);
        const shippingCost = Money.fromDollars(15); // 15% === 15%
        expect(validator.isOrderValid(price, shippingCost)).toBe(true);
    });

    // Test case: Validate failure when shipping cost exceeds the threshold.
    it('should return false if shipping cost is greater than 15% of discounted price', () => {
        const price = Money.fromDollars(100);
        const shippingCost = Money.fromDollars(15.01); // 15.01% > 15%
        expect(validator.isOrderValid(price, shippingCost)).toBe(false);
    });

    // Edge case: Test behavior with zero order price. The validator logic currently treats this as invalid.
    it('should handle zero price correctly (assuming invalid)', () => {
        const price = Money.fromDollars(0);
        const shippingCost = Money.fromDollars(0);
        expect(validator.isOrderValid(price, shippingCost)).toBe(false);
    });

    // Edge case: Test behavior with zero order price but non-zero shipping cost (should be invalid).
    it('should handle non-zero shipping cost with zero price (invalid)', () => {
        const price = Money.fromDollars(0);
        const shippingCost = Money.fromDollars(1);
        expect(validator.isOrderValid(price, shippingCost)).toBe(false);
    });

    // Test case: Validate the percentage calculation with larger, more realistic values.
    it('should calculate correctly with different amounts', () => {
        const price = Money.fromDollars(2000);
        // 15% of 2000 is 300
        const shippingCostOk = Money.fromDollars(300);
        const shippingCostTooHigh = Money.fromDollars(300.01);
        expect(validator.isOrderValid(price, shippingCostOk)).toBe(true);
        expect(validator.isOrderValid(price, shippingCostTooHigh)).toBe(false);
    });
}); 