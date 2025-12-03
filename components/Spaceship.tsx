'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Spaceship() {
    const groupRef = useRef<THREE.Group>(null);
    const engineRef = useRef<THREE.Mesh>(null);

    // Random offset for orbit start
    const offset = useRef(Math.random() * 100);

    useFrame(({ clock }) => {
        if (groupRef.current) {
            const t = clock.getElapsedTime() * 0.2 + offset.current; // Slow orbit speed

            // Lissajous-like orbit for organic "drifting" feel
            // Radius ~12-15 (outside the main ring which is ~6)
            const x = Math.sin(t) * 14;
            const z = Math.cos(t * 0.8) * 14;
            const y = Math.sin(t * 0.5) * 4; // Vertical drift

            // Update position
            groupRef.current.position.set(x, y, z);

            // Make spaceship look at the center (0,0,0) - or slightly ahead
            // Calculate tangent for forward direction
            const tx = Math.cos(t) * 14; // Derivative of x
            const tz = -Math.sin(t * 0.8) * 14 * 0.8; // Derivative of z
            const ty = Math.cos(t * 0.5) * 4 * 0.5;

            const target = new THREE.Vector3(x + tx, y + ty, z + tz);
            groupRef.current.lookAt(target);

            // Add some local rotation for "stabilizing" effect
            groupRef.current.rotateZ(Math.sin(t * 2) * 0.1);
        }

        // Engine pulse
        if (engineRef.current) {
            const pulse = 1 + Math.sin(clock.getElapsedTime() * 10) * 0.2;
            engineRef.current.scale.set(1, 1, pulse);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Main Body */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.2, 1, 4, 8]} />
                <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Wings / Solar Panels */}
            <group position={[0, 0, 0]}>
                <mesh position={[0.4, 0, 0]} rotation={[0, 0, 0.2]}>
                    <boxGeometry args={[0.6, 0.05, 0.4]} />
                    <meshStandardMaterial color="#333" roughness={0.2} metalness={0.9} />
                </mesh>
                <mesh position={[-0.4, 0, 0]} rotation={[0, 0, -0.2]}>
                    <boxGeometry args={[0.6, 0.05, 0.4]} />
                    <meshStandardMaterial color="#333" roughness={0.2} metalness={0.9} />
                </mesh>
            </group>

            {/* Engine Glow */}
            <mesh ref={engineRef} position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.15, 0.4, 8]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
            </mesh>
            <pointLight position={[0, 0, -0.6]} color="#00ffff" intensity={2} distance={3} decay={2} />

            {/* Cockpit Light */}
            <mesh position={[0, 0.2, 0.3]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={1} />
            </mesh>
        </group>
    );
}
