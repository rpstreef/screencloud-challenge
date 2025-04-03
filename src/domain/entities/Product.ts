import { Money } from "@domain/value-objects/Money";
import { Weight } from "@domain/value-objects/Weight";

// Define the discount tiers
interface DiscountTier {
    minQuantity: number;
    discountPercentage: number; // e.g., 5 for 5%
}

// Constants from CHALLENGE.md
const SCOS_PRODUCT_NAME = 'SCOS Station P1 Pro';
const SCOS_PRICE_USD = 150;
const SCOS_WEIGHT_G = 365;
const SCOS_DISCOUNT_TIERS: DiscountTier[] = [
    { minQuantity: 250, discountPercentage: 20 },
    { minQuantity: 100, discountPercentage: 15 },
    { minQuantity: 50, discountPercentage: 10 },
    { minQuantity: 25, discountPercentage: 5 },
    { minQuantity: 0, discountPercentage: 0 } // Base tier
];

// Sort tiers descending by quantity to easily find the correct one
SCOS_DISCOUNT_TIERS.sort((a, b) => b.minQuantity - a.minQuantity);

export class Product {
    // Using a fixed ID for simplicity as there's only one product
    // In a real system, this might be a UUID or database ID
    readonly id: string = 'SCOS_P1_PRO';
    readonly name: string;
    readonly unitPrice: Money;
    readonly unitWeight: Weight;
    private readonly discountTiers: DiscountTier[];

    constructor(name: string, unitPrice: Money, unitWeight: Weight, discountTiers: DiscountTier[]) {
        this.name = name;
        this.unitPrice = unitPrice;
        this.unitWeight = unitWeight;
        // Ensure tiers are sorted descending for correct lookup
        this.discountTiers = [...discountTiers].sort((a, b) => b.minQuantity - a.minQuantity);
    }

    public calculateDiscountPercentage(quantity: number): number {
        if (quantity <= 0) {
            return 0;
        }
        // Find the first tier where the quantity meets the minimum requirement
        const applicableTier = this.discountTiers.find(tier => quantity >= tier.minQuantity);
        return applicableTier ? applicableTier.discountPercentage : 0;
    }

    public calculateTotalPrice(quantity: number): Money {
        const basePrice = this.unitPrice.multiply(quantity);
        const discountPercentage = this.calculateDiscountPercentage(quantity);
        return basePrice.applyDiscountPercentage(discountPercentage);
    }

    public calculateTotalWeight(quantity: number): Weight {
        return this.unitWeight.multiply(quantity);
    }

}

// Create a singleton instance for the SCOS product
export const scosProduct = new Product(
    SCOS_PRODUCT_NAME,
    Money.fromDollars(SCOS_PRICE_USD),
    new Weight(SCOS_WEIGHT_G),
    SCOS_DISCOUNT_TIERS
);
