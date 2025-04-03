import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { VerifyOrderUseCase } from '../../src/application/use-cases/VerifyOrderUseCase';
import { IWarehouseRepository } from '../../src/domain/repositories/IWarehouseRepository';
import { WarehouseSelector } from '../../src/domain/services/WarehouseSelector';
import { OrderValidator } from '../../src/domain/services/OrderValidator';
import { ShippingCalculator } from '../../src/domain/services/ShippingCalculator';
import { Warehouse } from '../../src/domain/entities/Warehouse';
import { Coordinates } from '../../src/domain/value-objects/Coordinates';
import { ApplicationError } from '../../src/application/errors/ApplicationError';

// Mock the repository interface to isolate the use case from database interactions.
const mockWarehouseRepository: Mocked<IWarehouseRepository> = {
    findAll: vi.fn(),
    findById: vi.fn(),
    updateStockLevels: vi.fn(),
};

// Use real domain services (Calculator, Selector, Validator) for integration testing of the core logic.
// This ensures the use case correctly orchestrates these services.
const shippingCalculator = new ShippingCalculator();
const orderValidator = new OrderValidator();
const warehouseSelector = new WarehouseSelector(shippingCalculator); // Inject real calculator

// Test suite for VerifyOrderUseCase, focusing on validating the orchestration of domain services and handling input/output.
describe('VerifyOrderUseCase', () => {
    let verifyOrderUseCase: VerifyOrderUseCase;

    // Define mock warehouse data returned by the mocked repository.
    const warehouseA_Data = new Warehouse('wh-a', 'Warehouse A', new Coordinates(10, 10), 100);
    const warehouseB_Data = new Warehouse('wh-b', 'Warehouse B', new Coordinates(80, -100), 50);
    const mockWarehouses = [warehouseA_Data, warehouseB_Data];

    beforeEach(() => {
        // Reset mocks between tests.
        vi.resetAllMocks();

        // Setup mock repository to return predefined warehouse data.
        mockWarehouseRepository.findAll.mockResolvedValue(mockWarehouses);

        // Create a new use case instance before each test with mocked repo and real services.
        verifyOrderUseCase = new VerifyOrderUseCase(
            mockWarehouseRepository,
            warehouseSelector,
            orderValidator
        );
    });

    // Happy path: Test a standard valid order that can be fulfilled and meets cost constraints.
    it('should return valid verification details for a valid, fulfillable order', async () => {
        const input = { quantity: 50, shippingLatitude: 0, shippingLongitude: 0 }; // Request 50 units, total stock is 150.
        const result = await verifyOrderUseCase.execute(input);

        expect(mockWarehouseRepository.findAll).toHaveBeenCalledTimes(1); // Ensure repo was called.
        expect(result.isValid).toBe(true); // Expect overall validity.
        // Verify all expected output fields are present.
        expect(result.totalPrice).toBeDefined();
        expect(result.discountPercentage).toBeDefined();
        expect(result.shippingCost).toBeDefined();
    });

    // Test case: Verify that if the WarehouseSelector determines the order isn't fulfillable, isValid is false.
    it('should return isValid: false if the order quantity cannot be fulfilled', async () => {
        const input = { quantity: 200, shippingLatitude: 0, shippingLongitude: 0 }; // Request 200, total stock is 150.
        const result = await verifyOrderUseCase.execute(input);

        expect(mockWarehouseRepository.findAll).toHaveBeenCalledTimes(1);
        expect(result.isValid).toBe(false); // Expect invalid due to insufficient stock.
    });

    // Test case: Verify that if the OrderValidator determines the shipping cost is too high, isValid is false.
    // This test relies on the real ShippingCalculator and OrderValidator working correctly with the mock data.
    it('should return isValid: false if shipping cost exceeds 15% limit', async () => {
        // Use a high quantity (fulfillable) and a very distant destination to force high shipping cost.
        const highCostInput = { quantity: 100, shippingLatitude: 80, shippingLongitude: 170 }; // Far North-East

        // We rely on the real services calculating a high cost relative to the order price.
        const result = await verifyOrderUseCase.execute(highCostInput);

        expect(mockWarehouseRepository.findAll).toHaveBeenCalledTimes(1);
        // This assertion assumes the geometry and cost rules lead to >15% shipping.
        // It primarily tests that the validator's result is correctly reflected in the output.
        expect(result.isValid).toBe(false);
    });

    // Input validation edge case: Test rejection of zero quantity.
    it('should throw ApplicationError for invalid quantity (zero)', async () => {
        const input = { quantity: 0, shippingLatitude: 0, shippingLongitude: 0 };
        await expect(verifyOrderUseCase.execute(input))
            .rejects.toThrowError(ApplicationError); // Expect specific error type.
         await expect(verifyOrderUseCase.execute(input))
            .rejects.toHaveProperty('code', 'INVALID_INPUT'); // Expect specific error code.
    });

    // Input validation edge case: Test rejection of negative quantity.
    it('should throw ApplicationError for invalid quantity (negative)', async () => {
        const input = { quantity: -10, shippingLatitude: 0, shippingLongitude: 0 };
         await expect(verifyOrderUseCase.execute(input))
            .rejects.toThrowError(ApplicationError);
         await expect(verifyOrderUseCase.execute(input))
            .rejects.toHaveProperty('code', 'INVALID_INPUT');
    });

    // Input validation edge case: Test rejection of invalid coordinates (handled by domain Value Object).
    it('should throw error for invalid coordinates (handled by Coordinates constructor)', async () => {
        const input = { quantity: 10, shippingLatitude: 91, shippingLongitude: 0 }; // Invalid latitude > 90.
        // The error originates from the Coordinates value object constructor and should bubble up.
        await expect(verifyOrderUseCase.execute(input))
            .rejects.toThrowError('Invalid latitude: 91. Must be between -90 and 90.');
    });
}); 