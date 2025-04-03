export class Money {
    // Store amount in smallest currency unit (e.g., cents for USD)
    readonly amountInCents: number;
    // Optionally add currency code if needed, assuming USD for now
    // readonly currency: string = 'USD';

    constructor(amountInCents: number) {
        if (!Number.isInteger(amountInCents)) {
            throw new Error('Amount must be an integer (in cents).');
        }
        this.amountInCents = amountInCents;
    }

    // Factory method to create from dollars (or main unit)
    public static fromDollars(amount: number): Money {
        // Handle potential floating point inaccuracies by rounding
        return new Money(Math.round(amount * 100));
    }

    public toDollars(): number {
        return this.amountInCents / 100;
    }

    public add(other: Money): Money {
        // Add currency check here if supporting multiple currencies
        return new Money(this.amountInCents + other.amountInCents);
    }

    public subtract(other: Money): Money {
        return new Money(this.amountInCents - other.amountInCents);
    }

    // Multiply by a scalar (e.g., for quantity)
    public multiply(factor: number): Money {
        if (!Number.isFinite(factor)) {
            throw new Error('Factor must be a finite number.');
        }
        // Round the result to handle potential floating point results
        return new Money(Math.round(this.amountInCents * factor));
    }

    // Divide by a scalar
    public divide(divisor: number): Money {
        if (divisor === 0) {
            throw new Error('Cannot divide by zero.');
        }
        if (!Number.isFinite(divisor)) {
            throw new Error('Divisor must be a finite number.');
        }
        return new Money(Math.round(this.amountInCents / divisor));
    }

    // Apply a percentage discount (e.g., 10% discount is percentage = 10)
    public applyDiscountPercentage(percentage: number): Money {
        if (percentage < 0 || percentage > 100) {
            throw new Error('Percentage must be between 0 and 100.');
        }
        const discountFactor = (100 - percentage) / 100;
        return this.multiply(discountFactor);
    }


    public equals(other: Money): boolean {
        return this.amountInCents === other.amountInCents; // Add currency check if needed
    }

    public greaterThan(other: Money): boolean {
        return this.amountInCents > other.amountInCents;
    }

    public greaterThanOrEqual(other: Money): boolean {
        return this.amountInCents >= other.amountInCents;
    }

    public lessThan(other: Money): boolean {
        return this.amountInCents < other.amountInCents;
    }

    public lessThanOrEqual(other: Money): boolean {
        return this.amountInCents <= other.amountInCents;
    }

    public toString(): string {
        // Basic formatting, can be enhanced
        return `$${this.toDollars().toFixed(2)}`;
    }
} 