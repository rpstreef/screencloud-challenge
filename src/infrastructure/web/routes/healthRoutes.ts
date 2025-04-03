import { Server, Request, Response, Next } from 'restify';

export function setupHealthRoutes(server: Server): void {
    /**
     * @openapi
     * /health:
     *   get:
     *     tags:
     *       - Health
     *     summary: Service Health Check
     *     description: Returns the operational status of the service.
     *     responses:
     *       200:
     *         description: Service is operational.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: OK
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     */
    server.get('/health', (req: Request, res: Response, next: Next) => {
        res.send(200, { status: 'OK', timestamp: new Date().toISOString() });
        return next();
    });
    console.log('Health routes registered: GET /health');
} 