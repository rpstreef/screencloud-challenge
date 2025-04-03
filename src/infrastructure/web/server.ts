import restify, { Request, Response, Next } from 'restify';
import { ApplicationError } from '@app/errors/ApplicationError'; // Use path alias

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

    // Centralized Error Handling
    server.on('restifyError', (req: Request, res: Response, err: any, callback: () => void) => {
        console.error(`--- Restify Error Handler Start ---`);
        console.error(`Error on ${req.method} ${req.url}:`, err?.message);
        console.error(`Error Constructor Name:`, err?.constructor?.name);
        // console.error('Full Error Object:', err); // Uncomment for detailed structure

        let statusCode: number;
        // Define Problem Details structure
        let problemDetails: {
            type?: string;
            title: string;
            status: number;
            detail: string;
            instance?: string;
            code?: string; // Extension member for our codes
        };

        // Check if it's our custom ApplicationError first
        if (err instanceof ApplicationError) {
            console.log('Handling as ApplicationError...');
            statusCode = err.httpStatusCode || 400;
            problemDetails = {
                title: err.name || 'Application Error',
                status: statusCode,
                detail: err.message,
                code: err.code || 'ApplicationError',
                // type: 'uri-for-your-app-errors/' + (err.code || 'ApplicationError'), // Optional type URI
                instance: req.url // Optional instance URI
            };
        } 
        // Check if it looks like a standard Restify/restify-errors error (robust check)
        else if (err && typeof err.statusCode === 'number' && typeof err.body === 'object' && err.body?.code && err.body?.message) {
            console.log('Handling as RestError (duck-typing)...');
            statusCode = err.statusCode;
            problemDetails = {
                title: err.body.code, // Use code as title
                status: statusCode,
                detail: err.body.message,
                code: err.body.code,
                instance: req.url
            };
        } 
        // Fallback for other potential errors
        else {
            console.log('Handling as Unexpected Error...');
            statusCode = err?.statusCode && typeof err.statusCode === 'number' ? err.statusCode : 500;
            problemDetails = {
                title: 'Internal Server Error',
                status: statusCode,
                detail: err?.message || 'An unexpected internal server error occurred.',
                code: err?.code || err?.constructor?.name || 'InternalServerError',
                instance: req.url
            };
            console.error('Unexpected Error Details Stack:', err?.stack);
        }
        
        if (!res.headersSent) {
            console.log(`Sending Problem Details Response: ${statusCode}`);
            // Set Content-Type header for Problem Details
            res.setHeader('Content-Type', 'application/problem+json');
            res.send(statusCode, problemDetails);
        } else {
            console.error('Headers already sent, cannot send error response.');
        }
        console.error(`--- Restify Error Handler End ---`);
        // return callback(); 
    });
    
    // Event listener for uncaught exceptions
    server.on('uncaughtException', (req: Request, res: Response, route: any, err: Error) => {
        console.error('--- Uncaught Exception Handler --- ');
        console.error('Error caught by uncaughtException:', err);
        if (!res.headersSent) {
            const statusCode = 500;
            const problemDetails = {
                title: 'Internal Server Error',
                status: statusCode,
                detail: 'An unexpected internal server error occurred due to an uncaught exception.',
                code: 'UncaughtException',
                instance: req?.url
            };
            res.setHeader('Content-Type', 'application/problem+json');
            res.send(statusCode, problemDetails);
        }
    });

    // Simple health check route
    server.get('/health', (req: Request, res: Response, next: Next) => {
        res.send(200, { status: 'OK' });
        return next();
    });

    console.log('Restify server created.');
    return server;
} 