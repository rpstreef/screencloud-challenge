import swaggerJsdoc from 'swagger-jsdoc';

// Options for swagger-jsdoc
export const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ScreenCloud Order Management API',
      version: '1.0.0',
      description:
        'API for managing SCOS device orders, allowing verification and submission.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.APP_PORT || 3000}`,
        description: 'Development server',
      },
    ],
  },
  // Paths to files containing OpenAPI annotations
  apis: [
    './src/infrastructure/web/routes/healthRoutes.ts',
    './src/infrastructure/web/routes/orderRoutes.ts',
    './src/application/dtos/OrderDTOs.ts'
  ],
};

// Generated Swagger specification object
export const swaggerSpec = swaggerJsdoc(swaggerOptions); 