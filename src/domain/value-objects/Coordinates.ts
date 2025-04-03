export class Coordinates {
    readonly latitude: number;
    readonly longitude: number;

    constructor(latitude: number, longitude: number) {
        if (!Coordinates.isValidLatitude(latitude)) {
            throw new Error(`Invalid latitude: ${latitude}. Must be between -90 and 90.`);
        }
        if (!Coordinates.isValidLongitude(longitude)) {
            throw new Error(`Invalid longitude: ${longitude}. Must be between -180 and 180.`);
        }
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public static isValidLatitude(latitude: number): boolean {
        return latitude >= -90 && latitude <= 90;
    }

    public static isValidLongitude(longitude: number): boolean {
        return longitude >= -180 && longitude <= 180;
    }

    // Optionally, add methods for equality checks or other coordinate-related logic if needed later
    public equals(other: Coordinates): boolean {
        return this.latitude === other.latitude && this.longitude === other.longitude;
    }
} 