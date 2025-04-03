import restify, { Request, Response, Next } from 'restify';

import { setupErrorHandlers } from '@infra/web/middleware/errorHandler';
import { registerRoutes } from '@infra/web/routes';

export function createServer(): restify.Server {
    const server = restify.createServer({
        name: 'ScreenCloud OMS API',
        version: '1.0.0',
    });

    // Middleware
    server.use(restify.plugins.acceptParser(server.acceptable));
    server.use(restify.plugins.queryParser());
    server.use(restify.plugins.bodyParser()); // Parses JSON body

    // Basic CORS handling - adjust as needed for production
    server.use((req: Request, res: Response, next: Next) => {
        res.header('Access-Control-Allow-Origin', '*'); // Allow all origins (restrict in production!)
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        if (req.method === 'OPTIONS') {
            return res.send(204);
        }
        return next();
    });

    // --- Setup Error Handling --- 
    setupErrorHandlers(server);

    // --- Register All Routes --- 
    registerRoutes(server);

    console.log('Restify server created and configured.');
    return server;
} 