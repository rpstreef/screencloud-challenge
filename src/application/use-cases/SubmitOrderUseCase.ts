import { OrderInputDTO, SubmitOrderOutputDTO } from "@app/dtos/OrderDTOs";
import { ApplicationError } from "@app/errors/ApplicationError";

import { IWarehouseRepository, WarehouseStockUpdate } from "@domain/repositories/IWarehouseRepository";
import { IOrderRepository } from "@domain/repositories/IOrderRepository";
import { WarehouseSelector } from "@domain/services/WarehouseSelector";
import { OrderValidator } from "@domain/services/OrderValidator";
import { Coordinates } from "@domain/value-objects/Coordinates";
import { scosProduct } from "@domain/entities/Product";
import { Order } from "@domain/entities/Order";

import { randomUUID } from 'crypto'; // For generating order numbers
import { inject, injectable } from 'tsyringe';

// Interface for a potential transaction manager (to be implemented in infrastructure)
// This ensures order saving and stock updates are atomic.
export interface ITransactionManager {
    runInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}

@injectable()
export class SubmitOrderUseCase {
    constructor(
        @inject('IWarehouseRepository') private warehouseRepository: IWarehouseRepository,
        @inject('IOrderRepository') private orderRepository: IOrderRepository,
        @inject(WarehouseSelector) private warehouseSelector: WarehouseSelector,
        @inject(OrderValidator) private orderValidator: OrderValidator,
        @inject('ITransactionManager') private transactionManager: ITransactionManager // Inject transaction manager
    ) {}

    async execute(input: OrderInputDTO): Promise<SubmitOrderOutputDTO> {
        // Wrap the entire core logic in a transaction
        return this.transactionManager.runInTransaction(async () => {
            try {
                const quantity = input.quantity;
                if (!Number.isInteger(quantity) || quantity <= 0) {
                    throw new ApplicationError('Invalid input: Quantity must be a positive integer.', 'INVALID_INPUT', 400);
                }

                const destination = new Coordinates(input.shippingLatitude, input.shippingLongitude);
                const product = scosProduct;

                // 1. Calculate price and discount
                const totalPrice = product.calculateTotalPrice(quantity);
                const discountPercentage = product.calculateDiscountPercentage(quantity);

                // 2. Find optimal shipping (needs latest stock within transaction)
                // Note: Depending on transaction isolation level, a re-read might be needed
                // if stock could change between initial read and update. Assuming serializable or similar.
                const availableWarehouses = await this.warehouseRepository.findAll();
                const selection = this.warehouseSelector.findOptimalWarehouses(
                    quantity,
                    product,
                    destination,
                    availableWarehouses
                );

                // 3. CRITICAL: Check fulfillment *before* validation
                if (!selection.isFulfilled) {
                    throw new ApplicationError(
                        `Order cannot be fulfilled. Required: ${quantity}, Available: ${quantity - selection.remainingQuantity}.`,
                        'INSUFFICIENT_STOCK',
                        409 // Conflict
                    );
                }

                const shippingCost = selection.totalShippingCost;

                // 4. CRITICAL: Validate order rules
                const isValid = this.orderValidator.isOrderValid(totalPrice, shippingCost);
                if (!isValid) {
                    throw new ApplicationError(
                        `Order invalid: Shipping cost (${shippingCost.toString()}) exceeds 15% of discounted price (${totalPrice.toString()}).`,
                        'SHIPPING_COST_EXCEEDED',
                        400 // Bad Request
                    );
                }

                // 5. Generate Order Number
                const orderNumber = randomUUID(); // Simple unique ID generation

                // 6. Create Order Entity
                const order = new Order(
                    orderNumber,
                    product.id,
                    quantity,
                    destination,
                    totalPrice,
                    discountPercentage,
                    shippingCost
                );

                // 7. Prepare Stock Updates
                const stockUpdates: WarehouseStockUpdate[] = selection.legs.map(leg => ({
                    warehouseId: leg.warehouse.id,
                    quantityChange: -leg.quantity // Decrease stock
                }));

                // 8. Persist Order and Update Stock (atomically via Transaction Manager)
                // The transaction manager ensures these run together or fail together.
                await this.orderRepository.save(order);
                await this.warehouseRepository.updateStockLevels(stockUpdates);

                // 9. Format Output DTO
                return {
                    orderNumber: order.orderNumber,
                    totalPrice: order.totalPrice.toDollars(),
                    discountPercentage: order.discountAppliedPercentage,
                    shippingCost: order.shippingCost.toDollars(),
                    submittedAt: order.submittedAt.toISOString(),
                };

            } catch (error: any) {
                console.error("Error during order submission:", error);
                // Re-throw specific application errors or a generic one
                if (error instanceof ApplicationError || error instanceof Error) {
                    throw error; // Re-throw known error types
                }
                throw new ApplicationError('An unexpected error occurred during submission.', 'SUBMISSION_FAILED', 500);
            }
        });
    }
}
