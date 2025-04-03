import { Server, Request, Response, Next } from 'restify';
import restify from 'restify'; // Import the main restify package for plugins
import * as fs from 'fs';
import * as path from 'path';
import errors from 'restify-errors';
import { swaggerSpec } from '@config/swagger'; // Import the pre-generated spec
import swaggerUi from 'swagger-ui-dist';

export function setupSwaggerRoutes(server: Server): void {
    // --- Manual Swagger Setup --- 

    // 1. Serve the generated Swagger spec JSON
    server.get('/api-docs', (req: Request, res: Response, next: Next) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
        return next();
    });
    console.log(`Swagger Spec JSON available at /api-docs`);

    // 2. Serve the Swagger UI static files
    const swaggerUiPath = swaggerUi.getAbsoluteFSPath();
    if (!swaggerUiPath) {
        console.error("Could not get absolute path for swagger-ui-dist. Swagger UI will not be available.");
        return; // Exit setup if path not found
    }

    // --- Serve Swagger UI files --- 
    // Order matters: most specific routes first.

    // 1. Serve the main index.html for the /docs route
    server.get('/docs', (req: Request, res: Response, next: Next) => {
        const indexPath = path.join(swaggerUiPath, 'index.html');
        fs.readFile(indexPath, 'utf8', (err, file) => {
            if (err) {
                console.error("Error reading Swagger UI index.html:", err);
                return next(new errors.NotFoundError('Swagger UI index.html not found'));
            }
            res.setHeader('Content-Type', 'text/html');
            res.write(file);
            res.end();
            return next();
        });
    });
    
    // 2. Serve swagger-initializer.js separately to configure the UI
    server.get('/docs/swagger-initializer.js', (req: Request, res: Response, next: Next) => {
        const initializerJs = `
            window.onload = function() {
              window.ui = SwaggerUIBundle({
                url: "/api-docs",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
              });
            };
        `;
        res.setHeader('Content-Type', 'application/javascript');
        res.sendRaw(initializerJs);
        return next();
    });

    // 3. Serve the rest of the Swagger UI static files (must be last)
    server.get(
        '/docs/*', // Use string wildcard path instead of regex
        restify.plugins.serveStaticFiles(swaggerUiPath, {})
    );

    console.log(`Swagger UI available at /docs`);
} 