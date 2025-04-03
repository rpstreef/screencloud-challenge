import { PrismaClient, Order as PrismaOrder } from "@prisma/client";

import { IOrderRepository } from "@domain/repositories/IOrderRepository";
import { Order } from "@domain/entities/Order";
import { Coordinates } from "@domain/value-objects/Coordinates";
import { Money } from "@domain/value-objects/Money";

import prisma from "./prismaClient";
import { injectable } from "tsyringe";
import { Prisma } from "@prisma/client"; // Import Prisma namespace for input types

// Mapper function to convert Prisma model to Domain entity
function toDomain(prismaOrder: PrismaOrder): Order {
    // Reconstruct the Order entity using its constructor
    // Note: Prisma schema stores DateTimes, Order constructor creates a new Date
    // We need to pass the stored values, not generate new ones here.
    const order = new Order(
        prismaOrder.orderNumber,
        prismaOrder.productId,
        prismaOrder.quantity,
        new Coordinates(prismaOrder.shippingLatitude, prismaOrder.shippingLongitude),
        new Money(prismaOrder.totalPriceCents),
        prismaOrder.discountAppliedPercentage,
        new Money(prismaOrder.shippingCostCents)
    );
    // Manually set the submittedAt from the retrieved data
    (order as any).submittedAt = prismaOrder.submittedAt;
    return order;
}

// Mapper function to convert Domain entity to Prisma input type for creation
function fromDomain(order: Order): Prisma.OrderCreateInput {
    const state = order.getState(); // Use the getState method we defined earlier
    return {
        orderNumber: state.orderNumber,
        productId: state.productId,
        quantity: state.quantity,
        shippingLatitude: state.shippingAddress.latitude,
        shippingLongitude: state.shippingAddress.longitude,
        totalPriceCents: state.totalPriceCents,
        discountAppliedPercentage: state.discountAppliedPercentage,
        shippingCostCents: state.shippingCostCents,
        submittedAt: new Date(state.submittedAt) // Convert ISO string back to Date object for Prisma
    };
}

@injectable()
export class PrismaOrderRepository implements IOrderRepository {
    private readonly client: PrismaClient;

    constructor() {
        this.client = prisma;
    }

    async save(order: Order): Promise<void> {
        const orderData = fromDomain(order);
        try {
            await this.client.order.create({ data: orderData });
        } catch (error: any) {
            // Handle potential errors, like unique constraint violation (duplicate orderNumber)
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                // Example: Handle duplicate order number error
                throw new Error(`Order with number ${order.orderNumber} already exists.`);
            }
            console.error("Error saving order:", error);
            throw new Error(`Failed to save order: ${error.message}`);
        }
    }

    async findByOrderNumber(orderNumber: string): Promise<Order | null> {
        const prismaOrder = await this.client.order.findUnique({
            where: { orderNumber: orderNumber },
        });
        return prismaOrder ? toDomain(prismaOrder) : null;
    }
} 