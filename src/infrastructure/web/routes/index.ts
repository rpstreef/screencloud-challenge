import { Server } from 'restify';
import { setupHealthRoutes } from './healthRoutes';
import { setupSwaggerRoutes } from './swaggerRoutes';
import { setupOrderRoutes } from './orderRoutes';

export function registerRoutes(server: Server): void {
    console.log('Registering all application routes...');
    
    // Register base/utility routes first
    setupHealthRoutes(server);
    setupSwaggerRoutes(server);

    // Register application-specific routes
    setupOrderRoutes(server);

    console.log('All routes registered.');
} 