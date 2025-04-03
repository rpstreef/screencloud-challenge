import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Warehouse data from CHALLENGE.md
const warehouseData = [
    { name: 'Los Angeles', latitude: 33.9425, longitude: -118.408056, stock: 355, id: 'wh-la' }, // Added simple IDs
    { name: 'New York', latitude: 40.639722, longitude: -73.778889, stock: 578, id: 'wh-nyc' },
    { name: 'São Paulo', latitude: -23.435556, longitude: -46.473056, stock: 265, id: 'wh-gru' },
    { name: 'Paris', latitude: 49.009722, longitude: 2.547778, stock: 694, id: 'wh-cdg' },
    { name: 'Warsaw', latitude: 52.165833, longitude: 20.967222, stock: 245, id: 'wh-waw' },
    { name: 'Hong Kong', latitude: 22.308889, longitude: 113.914444, stock: 419, id: 'wh-hkg' },
];

async function main() {
    console.log(`Start seeding ...`);
    for (const wh of warehouseData) {
        const warehouse = await prisma.warehouse.upsert({
            where: { name: wh.name }, // Use name as unique identifier for upsert
            update: {
                // Update existing record fields if needed (latitude, longitude, stock)
                latitude: wh.latitude,
                longitude: wh.longitude,
                stock: wh.stock,
                // Do not update ID if record exists
            },
            create: {
                // Use provided ID for creation, or let Prisma generate UUID if id field removed from data
                id: wh.id, 
                name: wh.name,
                latitude: wh.latitude,
                longitude: wh.longitude,
                stock: wh.stock,
            },
        });
        console.log(`Created or updated warehouse with id: ${warehouse.id} (${warehouse.name})`);
    }
    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 