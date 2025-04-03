import { Request, Response, Next, Server } from 'restify';
import { injectable, inject } from 'tsyringe';
import { VerifyOrderUseCase } from '@app/use-cases/VerifyOrderUseCase';
import { SubmitOrderUseCase } from '@app/use-cases/SubmitOrderUseCase';
import { orderInputSchema } from '@app/dtos/OrderDTOs';
import errors from 'restify-errors';
import { z } from 'zod';

@injectable()
export class OrderController {
    constructor(
        @inject(VerifyOrderUseCase) private verifyOrderUseCase: VerifyOrderUseCase,
        @inject(SubmitOrderUseCase) private submitOrderUseCase: SubmitOrderUseCase
    ) {}

    // Helper to format Zod errors
    private formatZodError(error: z.ZodError): string {
        return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    }

    // Handler for POST /orders/verify
    async verifyOrder(req: Request, res: Response): Promise<void> {
        try {
            // Validate input using Zod schema
            const validationResult = orderInputSchema.safeParse(req.body);
            if (!validationResult.success) {
                const errorMessage = this.formatZodError(validationResult.error);
                throw new errors.BadRequestError(`Invalid input: ${errorMessage}`);
            }
            const validatedInput = validationResult.data; // Use validated data

            const result = await this.verifyOrderUseCase.execute(validatedInput);
            res.send(200, result);
        } catch (error) {
            throw error;
        }
    }

    // Handler for POST /orders/submit
    async submitOrder(req: Request, res: Response): Promise<void> {
        try {
            // Validate input using Zod schema
            const validationResult = orderInputSchema.safeParse(req.body);
            if (!validationResult.success) {
                const errorMessage = this.formatZodError(validationResult.error);
                throw new errors.BadRequestError(`Invalid input: ${errorMessage}`);
            }
            const validatedInput = validationResult.data; // Use validated data

            const result = await this.submitOrderUseCase.execute(validatedInput);
            res.send(201, result); // 201 Created for successful submission
        } catch (error) {
            throw error;
        }
    }

    // Method to register routes with the server
    registerRoutes(server: Server): void {
        server.post('/orders/verify', this.verifyOrder.bind(this));
        server.post('/orders/submit', this.submitOrder.bind(this));
        console.log('Order routes registered: POST /orders/verify, POST /orders/submit');
    }
} 