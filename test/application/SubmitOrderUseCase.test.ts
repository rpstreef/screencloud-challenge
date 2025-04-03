// Required for tsyringe
import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { SubmitOrderUseCase, ITransactionManager } from '../../src/application/use-cases/SubmitOrderUseCase';
import { IWarehouseRepository } from '../../src/domain/repositories/IWarehouseRepository';
import { IOrderRepository } from '../../src/domain/repositories/IOrderRepository';
import { WarehouseSelector } from '../../src/domain/services/WarehouseSelector';
import { OrderValidator } from '../../src/domain/services/OrderValidator';
import { ShippingCalculator } from '../../src/domain/services/ShippingCalculator';
import { Warehouse } from '../../src/domain/entities/Warehouse';
import { Coordinates } from '../../src/domain/value-objects/Coordinates';
import { Order } from '../../src/domain/entities/Order';
import { ApplicationError } from '../../src/application/errors/ApplicationError';

// --- Mocks ---
// Mock repository interfaces to isolate the use case from specific database implementations.
const mockWarehouseRepository: Mocked<IWarehouseRepository> = {
    findAll: vi.fn(),
    findById: vi.fn(),
    updateStockLevels: vi.fn(),
};
const mockOrderRepository: Mocked<IOrderRepository> = {
    save: vi.fn(),
    findByOrderNumber: vi.fn(),
};

// Mock the transaction manager to simulate atomic operations without a real database.
// It simply executes the provided function immediately.
const mockTransactionManager: Mocked<ITransactionManager> = {
    runInTransaction: vi.fn().mockImplementation(async (fn) => {
        // In tests, just execute the function passed to it.
        // Pass a dummy object assuming the callback doesn't need real transaction client methods.
        return await fn({} as any);
    }),
};

// --- Real Domain Services ---
// Use real domain services (Calculator, Selector, Validator) to test their integration within the use case.
const shippingCalculator = new ShippingCalculator();
const orderValidator = new OrderValidator();
const warehouseSelector = new WarehouseSelector(shippingCalculator);

// --- Test Suite ---
// Test suite for SubmitOrderUseCase, focusing on the successful submission flow, error handling, and transactional behavior.
describe('SubmitOrderUseCase', () => {
    let submitOrderUseCase: SubmitOrderUseCase;

    // Mock warehouse data returned by the repository.
    const warehouseA_Data = new Warehouse('wh-a', 'Warehouse A', new Coordinates(10, 10), 100);
    const warehouseB_Data = new Warehouse('wh-b', 'Warehouse B', new Coordinates(80, -100), 50);
    const mockWarehouses = [warehouseA_Data, warehouseB_Data];

    beforeEach(() => {
        // Reset all mocks before each test for isolation.
        vi.resetAllMocks();

        // Setup default mock return values.
        mockWarehouseRepository.findAll.mockResolvedValue([...mockWarehouses]); // Use copies
        mockOrderRepository.save.mockResolvedValue(undefined);
        mockWarehouseRepository.updateStockLevels.mockResolvedValue(undefined);
        mockTransactionManager.runInTransaction.mockImplementation(
            async (fn: (tx: any) => Promise<any>) => await fn(null as any)
        );

        // Instantiate the use case with mocks and real services.
        submitOrderUseCase = new SubmitOrderUseCase(
            mockWarehouseRepository,
            mockOrderRepository,
            warehouseSelector,
            orderValidator,
            mockTransactionManager
        );
    });

    // Happy path: Test successful submission of a valid order that is fulfillable and meets cost constraints.
    it('should successfully submit a valid, fulfillable order', async () => {
        const input = { quantity: 50, shippingLatitude: 0, shippingLongitude: 0 }; // Fulfillable quantity.
        const result = await submitOrderUseCase.execute(input);

        // Verify transaction boundary was used.
        expect(mockTransactionManager.runInTransaction).toHaveBeenCalledTimes(1);
        // Verify core steps within the transaction were called.
        expect(mockWarehouseRepository.findAll).toHaveBeenCalledTimes(1);
        expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
        expect(mockWarehouseRepository.updateStockLevels).toHaveBeenCalledTimes(1);

        // Verify the Order object passed to save is correct.
        const savedOrder = mockOrderRepository.save.mock.calls[0][0] as Order;
        expect(savedOrder.quantity).toBe(input.quantity);
        expect(savedOrder.shippingAddress.latitude).toBe(input.shippingLatitude);
        expect(savedOrder.orderNumber).toBeDefined(); // Check that an order number was generated.

        // Verify the stock update payload structure.
        const stockUpdates = mockWarehouseRepository.updateStockLevels.mock.calls[0][0];
        expect(stockUpdates).toBeInstanceOf(Array);
        // More specific checks on stock update content could be added here if needed.

        // Verify the structure and content of the returned DTO.
        expect(result.orderNumber).toBe(savedOrder.orderNumber);
        expect(result.totalPrice).toBeDefined();
        // Add checks for discount, shipping cost if precise values are predictable/important.
    });

    // Error case: Test rejection when the order quantity exceeds available stock.
    it('should throw ApplicationError if order is not fulfillable (insufficient stock)', async () => {
        const input = { quantity: 200, shippingLatitude: 0, shippingLongitude: 0 }; // Request 200, stock is 150.

        await expect(submitOrderUseCase.execute(input))
            .rejects.toThrowError(ApplicationError);
         await expect(submitOrderUseCase.execute(input))
            .rejects.toHaveProperty('code', 'INSUFFICIENT_STOCK'); // Check specific error code.

        // Crucially, ensure no data was persisted if fulfillment check fails.
        expect(mockOrderRepository.save).not.toHaveBeenCalled();
        expect(mockWarehouseRepository.updateStockLevels).not.toHaveBeenCalled();
    });

     // Error case: Test rejection when the calculated shipping cost exceeds the 15% validation limit.
     it('should throw ApplicationError if order is invalid (shipping cost too high)', async () => {
        // Use input designed to trigger high shipping costs via real domain services.
        const input = { quantity: 100, shippingLatitude: 80, shippingLongitude: 170 }; // Very distant destination.

        await expect(submitOrderUseCase.execute(input))
            .rejects.toThrowError(ApplicationError);
        await expect(submitOrderUseCase.execute(input))
            .rejects.toHaveProperty('code', 'SHIPPING_COST_EXCEEDED'); // Check specific error code.

        // Ensure no data was persisted if validation fails.
        expect(mockOrderRepository.save).not.toHaveBeenCalled();
        expect(mockWarehouseRepository.updateStockLevels).not.toHaveBeenCalled();
    });

    // Input validation edge case: Test rejection of zero quantity.
    it('should throw ApplicationError for invalid quantity (zero)', async () => {
        const input = { quantity: 0, shippingLatitude: 0, shippingLongitude: 0 };
        await expect(submitOrderUseCase.execute(input))
            .rejects.toThrowError(ApplicationError);
         await expect(submitOrderUseCase.execute(input))
            .rejects.toHaveProperty('code', 'INVALID_INPUT');
        // Verify no persistence actions attempted.
        expect(mockOrderRepository.save).not.toHaveBeenCalled();
        expect(mockWarehouseRepository.updateStockLevels).not.toHaveBeenCalled();
    });

     // Transaction rollback test: Simulate an error during the order save operation.
     it('should rollback transaction if saving order fails', async () => {
        const input = { quantity: 50, shippingLatitude: 0, shippingLongitude: 0 };
        const saveError = new Error("DB unique constraint failed");
        mockOrderRepository.save.mockRejectedValueOnce(saveError); // Simulate DB error on save call.

        // Expect the original database error to bubble up through the transaction.
        await expect(submitOrderUseCase.execute(input)).rejects.toThrow(saveError);

        // Verify the transaction boundary was still entered.
        expect(mockTransactionManager.runInTransaction).toHaveBeenCalledTimes(1);
        // Ensure the subsequent stock update was *not* called because the transaction failed.
        expect(mockWarehouseRepository.updateStockLevels).not.toHaveBeenCalled();
    });

    // Transaction rollback test: Simulate an error during the stock update operation.
    it('should rollback transaction if updating stock fails', async () => {
         const input = { quantity: 50, shippingLatitude: 0, shippingLongitude: 0 };
        const updateError = new Error("DB connection lost during update");
        // Simulate DB error on the stock update call, which happens after save.
        mockWarehouseRepository.updateStockLevels.mockRejectedValueOnce(updateError);

        // Expect the original database error to bubble up.
        await expect(submitOrderUseCase.execute(input)).rejects.toThrow(updateError);

        // Verify the transaction was entered.
        expect(mockTransactionManager.runInTransaction).toHaveBeenCalledTimes(1);
        // Verify save was attempted (it happens before update).
        expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
        // updateStockLevels was called but failed (this is implicit in the setup and rejection check).
    });
}); 