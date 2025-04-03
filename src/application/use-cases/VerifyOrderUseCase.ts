import { OrderInputDTO, VerifyOrderOutputDTO } from "@app/dtos/OrderDTOs";
import { ApplicationError } from "@app/errors/ApplicationError"; // Simple custom error base class (to be created)

import { IWarehouseRepository } from "@domain/repositories/IWarehouseRepository";
import { WarehouseSelector } from "@domain/services/WarehouseSelector";
import { OrderValidator } from "@domain/services/OrderValidator";
import { Coordinates } from "@domain/value-objects/Coordinates";
import { scosProduct } from "@domain/entities/Product"; // Assuming the single product

import { inject, injectable } from 'tsyringe';

@injectable()
export class VerifyOrderUseCase {
    constructor(
        @inject('IWarehouseRepository') private warehouseRepository: IWarehouseRepository,
        @inject(WarehouseSelector) private warehouseSelector: WarehouseSelector,
        @inject(OrderValidator) private orderValidator: OrderValidator
    ) {}

    async execute(input: OrderInputDTO): Promise<VerifyOrderOutputDTO> {
        try {
            const quantity = input.quantity;
            if (!Number.isInteger(quantity) || quantity <= 0) {
                throw new ApplicationError('Invalid input: Quantity must be a positive integer.', 'INVALID_INPUT');
            }

            const destination = new Coordinates(input.shippingLatitude, input.shippingLongitude);
            const product = scosProduct; // Use the defined product

            // 1. Calculate base price and discount
            const totalPrice = product.calculateTotalPrice(quantity);
            const discountPercentage = product.calculateDiscountPercentage(quantity);

            // 2. Find optimal shipping
            const availableWarehouses = await this.warehouseRepository.findAll();
            const selection = this.warehouseSelector.findOptimalWarehouses(
                quantity,
                product,
                destination,
                availableWarehouses
            );

            // Check if the order *can* be fulfilled (optional for verify, but good info)
            if (!selection.isFulfilled) {
                // Handle unfulfillable order during verification - maybe return specific status or throw
                // For now, let's proceed to calculate potential cost but note it
                console.warn(`Order quantity ${quantity} cannot be fully satisfied with current stock.`);
                // Depending on requirements, might return isValid: false here or a specific message.
            }

            const shippingCost = selection.totalShippingCost;

            // 3. Validate order rules (shipping cost vs price)
            const isValid = this.orderValidator.isOrderValid(totalPrice, shippingCost);

            // 4. Format output DTO
            return {
                totalPrice: totalPrice.toDollars(),
                discountPercentage: discountPercentage,
                shippingCost: shippingCost.toDollars(),
                isValid: isValid && selection.isFulfilled // Consider valid only if fulfillable and cost is okay
                // could add: canBeFulfilled: selection.isFulfilled
            };

        } catch (error: any) {
            console.error("Error during order verification:", error);
            // Rethrow specific application errors or a generic one
            if (error instanceof ApplicationError || error instanceof Error) {
                // potentially map domain errors (like invalid coords) to ApplicationError
                 throw error; // Re-throw known error types
            }
            throw new ApplicationError('An unexpected error occurred during verification.', 'VERIFICATION_FAILED');
        }
    }
}

// Simple base class for application-level errors (can be placed in src/application/errors/)
// export class ApplicationError extends Error {
//     constructor(message: string, public code: string) {
//         super(message);
//         this.name = 'ApplicationError';
//     }
// } 