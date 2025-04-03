import swaggerJsdoc from 'swagger-jsdoc';

// Export the options object so it can be used by restify-swagger-jsdoc
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
        // Adjust the URL based on your environment variables or actual deployment
        url: `http://localhost:${process.env.APP_PORT || 3000}`,
        description: 'Development server',
      },
    ],
  },
  // Path to the API docs files based on your project structure
  apis: [
    './src/infrastructure/web/routes/healthRoutes.ts',
    './src/infrastructure/web/routes/orderRoutes.ts',
    './src/application/dtos/OrderDTOs.ts'
  ],
};

// Export the generated spec for potential other uses (though not directly by createSwaggerPage)
export const swaggerSpec = swaggerJsdoc(swaggerOptions); 