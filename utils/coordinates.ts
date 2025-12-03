export type CylindricalCoord = {
    angle: number; // Degrees
    radius: number;
    height: number;
};

export type CartesianCoord = [number, number, number];

export const toCartesian = (angle: number, radius: number, height: number): CartesianCoord => {
    // Adjust angle to match unit circle if needed, but standard 0 = +x is fine.
    // User spec: C=0, E=120, G=240.
    const rad = (angle * Math.PI) / 180;
    const x = radius * Math.cos(rad);
    const z = radius * Math.sin(rad); // Using Z for depth
    return [x, height, z];
};
