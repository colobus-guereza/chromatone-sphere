'use client';

import { Stars, Sparkles } from '@react-three/drei';

export default function CosmicBackground() {
    return (
        <>
            {/* Deep dark background color - almost black */}
            <color attach="background" args={['#050505']} />

            {/* Atmospheric Fog for Soft Focus and Depth */}
            <fog attach="fog" args={['#050505', 10, 400]} />

            {/* 1. Background Starfield - Reduced Density for Deep Space */}
            <Stars
                radius={300}    // Expanded universe boundaries
                depth={100}     // Massive distance between stars
                count={800}     // Drastically reduced count (Less is more)
                factor={6}      // Larger, distant suns
                saturation={0}  // Pure white/grey
                fade            // Essential for depth
            />

            {/* 2. Floating Particles - Ethereal Dust */}
            <Sparkles
                count={40}      // Very few
                scale={10}      // Spread out
                size={2}        // Soft, large particles
                speed={0.3}     // Very slow, drifting
                opacity={0.4}   // Barely visible
                color="#ffffff"
            />
        </>
    );
}
