import { Coordinates } from "@domain/value-objects/Coordinates";

// Implementation of the Haversine formula to calculate the distance between two points on a sphere

/**
 * Calculates the great-circle distance between two points
 * on the Earth (specified in decimal degrees).
 *
 * @param coords1 First set of coordinates.
 * @param coords2 Second set of coordinates.
 * @returns The distance in kilometers.
 */
export function calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
    const R = 6371; // Radius of the Earth in kilometers
    const lat1 = coords1.latitude;
    const lon1 = coords1.longitude;
    const lat2 = coords2.latitude;
    const lon2 = coords2.longitude;

    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
} 