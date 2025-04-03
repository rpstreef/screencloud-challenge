// Reflect-metadata is required for tsyringe
import 'reflect-metadata'; 
import { container } from 'tsyringe';

// Import Interfaces (Injection Tokens)
import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import { IWarehouseRepository } from '@domain/repositories/IWarehouseRepository';
import { ITransactionManager } from '@app/use-cases/SubmitOrderUseCase'; // Use path alias

// Import Concrete Implementations
// Domain Services (might not need explicit registration if used directly via `new` or if they don't have dependencies)
import { ShippingCalculator } from '@domain/services/ShippingCalculator';
import { OrderValidator } from '@domain/services/OrderValidator';
import { WarehouseSelector } from '@domain/services/WarehouseSelector';
// Repositories
import { PrismaOrderRepository } from '@infra/persistence/PrismaOrderRepository';
import { PrismaWarehouseRepository } from '@infra/persistence/PrismaWarehouseRepository';
import { PrismaTransactionManager } from '@infra/persistence/PrismaTransactionManager';
// Use Cases (usually registered as themselves)
import { VerifyOrderUseCase } from '@app/use-cases/VerifyOrderUseCase'; // Use path alias
import { SubmitOrderUseCase } from '@app/use-cases/SubmitOrderUseCase'; // Use path alias
// Controllers (registered as themselves)
import { OrderController } from '@infra/web/controllers/OrderController';


// --- Register Dependencies --- 

// Persistence Layer
container.register<IOrderRepository>('IOrderRepository', {
    useClass: PrismaOrderRepository
});
container.register<IWarehouseRepository>('IWarehouseRepository', {
    useClass: PrismaWarehouseRepository
});
container.register<ITransactionManager>('ITransactionManager', {
    useClass: PrismaTransactionManager
});

// Domain Services (Register if they have dependencies or need to be injected)
// If they are simple classes without dependencies, they might be instantiated directly where needed.
// Registering them promotes consistency if they gain dependencies later.
container.register<ShippingCalculator>(ShippingCalculator, { useClass: ShippingCalculator });
container.register<OrderValidator>(OrderValidator, { useClass: OrderValidator });
container.register<WarehouseSelector>(WarehouseSelector, { useClass: WarehouseSelector });

// Application Layer (Use Cases)
// Typically registered as self, tsyringe automatically resolves their dependencies
container.register<VerifyOrderUseCase>(VerifyOrderUseCase, { useClass: VerifyOrderUseCase });
container.register<SubmitOrderUseCase>(SubmitOrderUseCase, { useClass: SubmitOrderUseCase });

// Infrastructure Layer (Controllers)
container.register<OrderController>(OrderController, { useClass: OrderController });

console.log('Dependency container configured.');

// Export the container for use in the main application entry point
export default container; 