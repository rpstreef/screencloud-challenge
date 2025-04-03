// main.ts
import 'reflect-metadata';

import { createServer } from '@infra/web/server';

async function startApp() {
    try {
        // --- Server Setup --- 
        // Creates server and sets up middleware, error handling, and ALL routes
        const server = createServer();

        // --- Start Server --- 
        const port = process.env.PORT || 3000; // Use port from .env or default
        server.listen(port, () => {
            console.log(`%s listening at %s`, server.name, server.url);
            console.log(`API available at http://localhost:${port}`);
            console.log(`Health check available at http://localhost:${port}/health`);
        });

        // Optional: Graceful shutdown handling
        process.on('SIGTERM', async () => {
            console.log('SIGTERM signal received: closing HTTP server');
            await new Promise<void>(resolve => server.close(() => resolve()));
            console.log('HTTP server closed');
            // Add any other cleanup (like DB disconnect if needed, though Prisma handles pool implicitly)
            process.exit(0);
        });

    } catch (error) {
        console.error("Failed to start application:", error);
        process.exit(1);
    }
}

startApp();