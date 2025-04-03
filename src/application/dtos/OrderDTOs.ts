import { z } from 'zod';

// Input DTO for both Verify and Submit operations
export interface OrderInputDTO {
    quantity: number;
    shippingLatitude: number;
    shippingLongitude: number;
}

// Zod schema for validating the OrderInputDTO
export const orderInputSchema = z.object({
    quantity: z.number().int().positive({ message: "Quantity must be a positive integer." }),
    shippingLatitude: z.number().min(-90, { message: "Latitude must be between -90 and 90." })
                         .max(90, { message: "Latitude must be between -90 and 90." }),
    shippingLongitude: z.number().min(-180, { message: "Longitude must be between -180 and 180." })
                          .max(180, { message: "Longitude must be between -180 and 180." }),
}).strict(); // Use strict() to fail if extra properties are present

// Output DTO for the Verify operation
export interface VerifyOrderOutputDTO {
    totalPrice: number; // In dollars
    discountPercentage: number;
    shippingCost: number; // In dollars
    isValid: boolean;
}

// Output DTO for the Submit operation (on success)
export interface SubmitOrderOutputDTO {
    orderNumber: string;
    totalPrice: number; // In dollars
    discountPercentage: number;
    shippingCost: number; // In dollars
    submittedAt: string; // ISO 8601 timestamp
}