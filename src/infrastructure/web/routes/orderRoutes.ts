import { Server } from 'restify';
import { OrderController } from '../controllers/OrderController';
import container from '../../../container'; // Use relative path to container assuming it's at project_root/src/container.ts

export function setupOrderRoutes(server: Server): void {
    // Resolve the controller from the DI container
    const orderController = container.resolve(OrderController);

    /**
     * @openapi
     * /orders/verify:
     *   post:
     *     tags: [Orders]
     *     summary: Verify a potential order
     *     description: Calculates price, discount, shipping, and validity for a potential order.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: { $ref: '#/components/schemas/OrderInput' }
     *     responses:
     *       200:
     *         description: Order verification results.
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/VerifyOrderOutput' }
     *       400:
     *         description: Invalid input.
     *         content:
     *           application/problem+json:
     *             schema: { $ref: '#/components/schemas/ProblemDetails' }
     */
    server.post('/orders/verify', orderController.verifyOrder.bind(orderController));

    /**
     * @openapi
     * /orders/submit:
     *   post:
     *     tags: [Orders]
     *     summary: Submit a new order
     *     description: Creates a new order if valid, updating inventory.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: { $ref: '#/components/schemas/OrderInput' }
     *     responses:
     *       201:
     *         description: Order successfully submitted.
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/SubmitOrderOutput' }
     *       400:
     *         description: Invalid input.
     *         content:
     *           application/problem+json:
     *             schema: { $ref: '#/components/schemas/ProblemDetails' }
     *       409:
     *         description: Order invalid (e.g., stock, shipping cost).
     *         content:
     *           application/problem+json:
     *             schema: { $ref: '#/components/schemas/ProblemDetails' }
     *       500:
     *         description: Internal server error.
     *         content:
     *           application/problem+json:
     *             schema: { $ref: '#/components/schemas/ProblemDetails' }
     */
    server.post('/orders/submit', orderController.submitOrder.bind(orderController));

    console.log('Order routes registered: POST /orders/verify, POST /orders/submit');
} 