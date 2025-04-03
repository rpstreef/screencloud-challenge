export class Weight {
    // Store weight in a base unit, e.g., grams
    readonly valueInGrams: number;

    constructor(valueInGrams: number) {
        if (valueInGrams < 0) {
            throw new Error('Weight cannot be negative.');
        }
        // Consider if we need integer weights or allow decimals
        this.valueInGrams = valueInGrams;
    }

    public static fromKilograms(value: number): Weight {
        if (value < 0) {
            throw new Error('Weight cannot be negative.');
        }
        return new Weight(value * 1000);
    }

    public toKilograms(): number {
        return this.valueInGrams / 1000;
    }

    public add(other: Weight): Weight {
        return new Weight(this.valueInGrams + other.valueInGrams);
    }

    public subtract(other: Weight): Weight {
        const result = this.valueInGrams - other.valueInGrams;
        if (result < 0) {
            // Depending on context, you might throw an error or return Weight.zero()
            throw new Error('Resulting weight cannot be negative.');
        }
        return new Weight(result);
    }

    public multiply(factor: number): Weight {
        if (factor < 0) {
            throw new Error('Cannot multiply weight by a negative factor.');
        }
        if (!Number.isFinite(factor)) {
            throw new Error('Factor must be a finite number.');
        }
        return new Weight(this.valueInGrams * factor);
    }

    public equals(other: Weight): boolean {
        return this.valueInGrams === other.valueInGrams;
    }

    public static zero(): Weight {
        return new Weight(0);
    }

    public toString(): string {
        return `${this.toKilograms().toFixed(3)} kg`; // Example formatting
    }
} 