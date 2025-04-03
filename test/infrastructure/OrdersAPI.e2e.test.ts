import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest'; // Import supertest
import prisma from '../../src/infrastructure/persistence/prismaClient'; // Import prisma client for cleanup/seeding

// --- Test Setup ---
// Remove server variable
// let server: Server; 
// Use `any` type for supertest agent to avoid complex type issues when targeting URL
let app: any;

beforeAll(async () => {
    // Seeding is now done via a separate npm script
    // runSeed(); 

    // Target the application server running inside the container
    const port = process.env.PORT || 3000;
    // Use localhost as the tests run inside the same container as the server
    const baseURL = `http://localhost:${port}`;
    console.log(`E2E tests targeting running app at: ${baseURL}`);

    // Create supertest agent targeting the base URL
    app = request(baseURL);
});

afterAll(async () => {
    // No server to close here
    // Disconnect Prisma client if it was used directly in tests
    await prisma.$disconnect();
    console.log('E2E Test Run Finished.');
});

// Optional: Reset DB between tests if needed
// beforeEach(async () => {
//     runSeed(); 
// });

// --- Test Suite (remains the same) ---
describe('Orders API (E2E)', () => {

    // --- /orders/verify --- 
    it('POST /orders/verify - should return 200 OK and valid details for a valid order', async () => {
        const payload = { quantity: 10, shippingLatitude: 34.0522, shippingLongitude: -118.2437 }; // LA coords
        const response = await app
            .post('/orders/verify')
            .send(payload)
            .expect(200)
            .expect('Content-Type', /json/);
        
        expect(response.body.isValid).toBe(true);
        expect(response.body.totalPrice).toBeDefined();
        expect(response.body.shippingCost).toBeDefined();
        expect(response.body.discountPercentage).toBeDefined();
    });

    it('POST /orders/verify - should return 200 OK and isValid: false for insufficient stock', async () => {
        const payload = { quantity: 5000, shippingLatitude: 0, shippingLongitude: 0 }; // Exceeds total stock
        const response = await app
            .post('/orders/verify')
            .send(payload)
            .expect(200);
            
        expect(response.body.isValid).toBe(false);
    });

    it('POST /orders/verify - should return 400 Bad Request for invalid input (missing quantity)', async () => {
        const payload = { shippingLatitude: 0, shippingLongitude: 0 };
        await app
            .post('/orders/verify')
            .send(payload)
            .expect(400);
    });

    // --- /orders/submit --- 
    it('POST /orders/submit - should return 201 Created for a valid order and update stock', async () => {
        // Include latitude and longitude in the select
        const initialStock = await prisma.warehouse.findMany({ 
            select: { id: true, stock: true, latitude: true, longitude: true } 
        });
        const warehouseAInitial = initialStock.find(w => w.id === 'wh-la'); // Assuming seeded ID
        expect(warehouseAInitial).toBeDefined();
        const initialStockA = warehouseAInitial!.stock;

        const payload = { quantity: 5, shippingLatitude: warehouseAInitial!.latitude, shippingLongitude: warehouseAInitial!.longitude }; // Ship close to LA warehouse
        const response = await app
            .post('/orders/submit')
            .send(payload)
            .expect(201)
            .expect('Content-Type', /json/);

        expect(response.body.orderNumber).toBeDefined();
        expect(response.body.totalPrice).toBeDefined();
        
        // Verify stock was updated in DB (This now runs inside container context)
        const finalStockA = await prisma.warehouse.findUnique({ 
            where: { id: 'wh-la' }, 
            select: { stock: true }
        });
        expect(finalStockA).toBeDefined();
        expect(finalStockA!.stock).toBe(initialStockA - payload.quantity);
    });

     it('POST /orders/submit - should return 409 Conflict for insufficient stock', async () => {
        const payload = { quantity: 5000, shippingLatitude: 0, shippingLongitude: 0 }; // Exceeds total stock
        await app
            .post('/orders/submit')
            .send(payload)
            .expect(409); // Expecting 409 Conflict based on ApplicationError mapping
    });

    it('POST /orders/submit - should return 400 Bad Request for invalid order (e.g., high shipping cost)', async () => {
         // Use coordinates very far from any warehouse to trigger high shipping cost
        const payload = { quantity: 10, shippingLatitude: -80, shippingLongitude: 170 }; 
        await app
            .post('/orders/submit')
            .send(payload)
            .expect(400); // Expecting 400 based on ApplicationError mapping
    });

    it('POST /orders/submit - should return 400 Bad Request for invalid input (string quantity)', async () => {
        const payload = { quantity: "ten", shippingLatitude: 0, shippingLongitude: 0 };
        await app
            .post('/orders/submit')
            .send(payload)
            .expect(400);
    });

}); 