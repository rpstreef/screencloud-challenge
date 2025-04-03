export class Distance {
    // Store distance in kilometers
    readonly valueInKilometers: number;

    constructor(valueInKilometers: number) {
        if (valueInKilometers < 0) {
            throw new Error('Distance cannot be negative.');
        }
        this.valueInKilometers = valueInKilometers;
    }

    public add(other: Distance): Distance {
        return new Distance(this.valueInKilometers + other.valueInKilometers);
    }

    public equals(other: Distance): boolean {
        return this.valueInKilometers === other.valueInKilometers;
    }

    public static zero(): Distance {
        return new Distance(0);
    }

    public toString(): string {
        return `${this.valueInKilometers.toFixed(2)} km`; // Example formatting
    }
} 