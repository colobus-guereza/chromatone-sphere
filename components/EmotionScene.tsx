'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { OrbitControls, Html, Line, Text, Billboard } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { emotionData } from '@/data/dataset';
import CosmicBackground from './CosmicBackground';
import Spaceship from './Spaceship';

// Hex 코드를 컬러 이름으로 변환
const getColorName = (hex: string): string => {
    const colorMap: Record<string, string> = {
        '#FF0000': 'Red',
        '#FF4000': 'Red Orange',
        '#FF8000': 'Orange',
        '#FFBF00': 'Yellow',
        '#00FF00': 'Green',
        '#00FF80': 'Spring Green',
        '#00FFFF': 'Cyan',
        '#0080FF': 'Sky Blue',
        '#0000FF': 'Blue',
        '#8000FF': 'Violet',
        '#BF00FF': 'Magenta',
        '#FF0080': 'Rose',
        '#888888': 'Gray',
    };
    return colorMap[hex] || 'Unknown';
};



interface EmotionSceneProps {
    onNodeClick?: (nodeId: number) => void;
    focusTarget?: THREE.Vector3 | null;
    showDropLines?: boolean;
}

// Helper to calculate scale from Hz (Inverse relationship)
// C4 (261.63) -> 2.5x (Massive Sun)
// B4 (493.88) -> ~0.7x (Small Satellite)
// Formula: Scale = Base * (MinHz / Hz)^Power
const getScaleFromHz = (hz: number) => {
    const minHz = 261.63;
    const baseScale = 2.5;
    const power = 2.0;

    return baseScale * Math.pow(minHz / hz, power);
};

// Generate a simple noise texture for planets to make rotation visible
const usePlanetTexture = () => {
    return useMemo(() => {
        if (typeof document === 'undefined') return null;

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 64, 64);

        // Add noise/craters
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const r = Math.random() * 5 + 2;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.2})`;
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }, []);
};

// Pulsing Sphere Component
const PulsingSphere = ({ data, isHovered, setHoveredNode, onClick, position }: {
    data: typeof emotionData[0],
    isHovered: boolean,
    setHoveredNode: (id: number | null) => void,
    onClick?: () => void,
    position: THREE.Vector3
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const baseScale = getScaleFromHz(data.hz);
    const planetTexture = usePlanetTexture();

    useFrame(({ clock }, delta) => {
        if (meshRef.current) {
            // Pulse animation based on BPM
            // Joy (150 BPM): Fast, Sharp, Low Amplitude
            // Calm (60 BPM): Slow, Deep, High Amplitude (Octave Drop)
            // Sadness (100 BPM): Medium, Smooth

            const time = clock.getElapsedTime();
            let pulse = 0;

            // Default Speed Calculation based on BPM
            // Map BPM [50, 150] -> Speed Multiplier [0.5, 3.0]
            const t = (data.bpm - 50) / 100;
            const speedMultiplier = 0.5 + (3.0 - 0.5) * t;
            const speed = speedMultiplier * Math.PI * 2;

            if (data.id === 5) { // Calm (E) - Deep Breath
                // Octave Drop: Slower speed, Double Amplitude
                const breathSpeed = speed * 0.8; // Even slower for deep breath
                const amplitude = 0.15; // 15% scale variation (3x of default)
                pulse = Math.sin(time * breathSpeed) * amplitude * baseScale;
            } else if (data.id === 1) { // Joy (C) - High Tension
                // Sharp, fast vibration
                const amplitude = 0.03; // 3% scale variation (Small but fast)
                // Use power to make sine wave "sharper"
                pulse = Math.pow(Math.sin(time * speed), 3) * amplitude * baseScale;
            } else {
                // Standard / Sadness
                const amplitude = 0.05; // 5% default
                pulse = Math.sin(time * speed) * amplitude * baseScale;
            }

            const currentScale = baseScale + pulse;
            meshRef.current.scale.set(currentScale, currentScale, currentScale);

            // Rotation Animation linked to BPM
            // Faster BPM = Faster Rotation
            const rotationSpeed = 0.2 + (2.0 - 0.2) * t;

            meshRef.current.rotation.y += delta * rotationSpeed;
            // Slight tilt rotation for realism
            meshRef.current.rotation.x += delta * rotationSpeed * 0.1;
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            onPointerOver={(e) => { e.stopPropagation(); setHoveredNode(data.id); }}
            onPointerOut={(e) => { e.stopPropagation(); setHoveredNode(null); }}
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        >
            <sphereGeometry args={[0.4, 32, 32]} />
            <meshStandardMaterial
                color={data.colorHex}
                map={planetTexture}
                emissive={data.colorHex}
                emissiveIntensity={isHovered ? 0.8 : 0.2}
                roughness={0.7} // Increased roughness to make texture more visible
                metalness={0.2} // Decreased metalness to reduce overpowering reflections
            />
        </mesh>
    );
};

export default function EmotionScene({ onNodeClick, focusTarget, resetTrigger, showDropLines = true }: EmotionSceneProps & { resetTrigger?: number }) {
    const [hoveredNode, setHoveredNode] = useState<number | null>(null);
    const controlsRef = useRef<any>(null);
    const { camera } = useThree();

    // 초기 카메라 위치와 타겟 저장 (약간 각도가 있는 탑뷰, 환희가 12시에 오도록)
    // 첫 번째 이미지처럼 약간 기울어진 탑뷰 시점
    const initialCameraPosition = useMemo(() => new THREE.Vector3(0, 12, 4), []); // 약간 각도가 있는 탑뷰
    const initialTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

    // 카메라 애니메이션을 위한 상태
    const [isAnimating, setIsAnimating] = useState(false);
    const animationTypeRef = useRef<'focus' | 'reset' | null>(null); // 애니메이션 타입 구분
    const targetPositionRef = useRef<THREE.Vector3 | null>(null);
    const targetLookAtRef = useRef<THREE.Vector3 | null>(null);
    const startPositionRef = useRef<THREE.Vector3 | null>(null);
    const startLookAtRef = useRef<THREE.Vector3 | null>(null);
    const animationProgressRef = useRef(0);

    // Reset trigger tracking
    const prevResetTriggerRef = useRef(resetTrigger);

    // Constants
    const BASE_RADIUS = 6;

    // Radius Interpolation Logic
    // Joy (0°) = 1.0
    // Calm (120°) = 0.8
    // Sadness (240°) = 0.66
    const getRadiusForAngle = (angle: number) => {
        // Normalize angle to 0-360
        let a = angle % 360;
        if (a < 0) a += 360;

        let t = 0;
        let r = 1.0;

        if (a >= 0 && a < 120) {
            // Sector 1: Joy (1.0) -> Calm (0.8)
            t = a / 120;
            r = 1.0 + (0.8 - 1.0) * t;
        } else if (a >= 120 && a < 240) {
            // Sector 2: Calm (0.8) -> Sadness (0.66)
            t = (a - 120) / 120;
            r = 0.8 + (0.66 - 0.8) * t;
        } else {
            // Sector 3: Sadness (0.66) -> Joy (1.0)
            t = (a - 240) / 120;
            r = 0.66 + (1.0 - 0.66) * t;
        }
        return BASE_RADIUS * r;
    };

    // Helper to calculate coordinates
    // 환희가 12시에 오도록 -90도 회전 (0도가 3시이므로 -90도 회전하여 12시로)
    const ANGLE_OFFSET = -90; // 도형 자체를 회전시켜 환희를 12시에 배치
    const getCoordinates = (angle: number, bpm: number) => {
        const r = BASE_RADIUS; // Constant radius for Tilted Orbit
        const adjustedAngle = angle + ANGLE_OFFSET; // 각도 오프셋 적용
        const rad = (adjustedAngle * Math.PI) / 180;
        const x = r * Math.cos(rad);
        const z = r * Math.sin(rad);

        // Tilted Orbit Logic: Height based on BPM
        // Joy (150) -> High
        // Calm (50) -> Low (0)
        const y = (bpm - 50) * 0.1;

        return new THREE.Vector3(x, y, z);
    };

    // 1. Tilted Ring (Smooth Wave Loop)
    const ringPoints = useMemo(() => {
        // Get all node positions
        const points = emotionData.map(d => getCoordinates(d.angle, d.bpm));

        // Create a closed smooth curve
        const curve = new THREE.CatmullRomCurve3(points, true); // true = closed

        // Sample points for the line
        return curve.getPoints(100);
    }, []);

    // 카메라 타겟만 변경 (카메라 위치는 유지)
    useEffect(() => {
        // 초기화 중이거나 초기화 애니메이션 중이면 이 애니메이션은 실행하지 않음
        if (isResettingRef.current || animationTypeRef.current === 'reset') {
            return;
        }

        if (focusTarget && controlsRef.current) {
            // 기존 애니메이션 중지
            animationTypeRef.current = null;
            setIsAnimating(false);
            animationProgressRef.current = 0;

            // 약간의 지연 후 애니메이션 시작
            const timeoutId = setTimeout(() => {
                if (controlsRef.current && focusTarget && !isResettingRef.current && animationTypeRef.current !== 'reset') {
                    animationTypeRef.current = 'focus';
                    setIsAnimating(true);
                    animationProgressRef.current = 0;

                    // 시작 타겟 저장
                    startLookAtRef.current = controlsRef.current.target.clone();

                    // 카메라 위치는 변경하지 않고 타겟만 변경
                    startPositionRef.current = camera.position.clone();
                    targetPositionRef.current = camera.position.clone(); // 위치는 그대로 유지
                    targetLookAtRef.current = focusTarget.clone(); // 타겟만 노드로 변경
                }
            }, 10);

            return () => clearTimeout(timeoutId);
        } else if (!focusTarget && !isResettingRef.current) {
            // focusTarget이 null이고 초기화 중이 아닐 때만 애니메이션 중지
            animationTypeRef.current = null;
            setIsAnimating(false);
        }
    }, [focusTarget, camera]);

    // 카메라 초기화 애니메이션
    const isResettingRef = useRef(false);

    useEffect(() => {
        // resetTrigger가 변경되었을 때만 실행 (초기 렌더링 제외, 값이 증가했을 때)
        if (resetTrigger !== undefined && resetTrigger !== prevResetTriggerRef.current) {
            prevResetTriggerRef.current = resetTrigger;

            if (controlsRef.current) {
                // 기존 애니메이션 완전히 중지
                animationTypeRef.current = null;
                setIsAnimating(false);
                animationProgressRef.current = 0;

                // 초기화 플래그 설정 (focusTarget useEffect가 실행되지 않도록)
                isResettingRef.current = true;

                // 즉시 초기화 애니메이션 시작
                animationTypeRef.current = 'reset';
                setIsAnimating(true);
                animationProgressRef.current = 0;

                // 시작 위치 저장 (현재 카메라 위치)
                startPositionRef.current = camera.position.clone();
                startLookAtRef.current = controlsRef.current.target.clone();

                // 목표 위치는 초기 위치 (약간 각도가 있는 탑뷰)
                targetPositionRef.current = initialCameraPosition.clone();
                targetLookAtRef.current = initialTarget.clone();
            }
        }
    }, [resetTrigger, camera, initialCameraPosition, initialTarget]);

    // 애니메이션 프레임 업데이트
    useFrame((state, delta) => {
        if (isAnimating && controlsRef.current && targetPositionRef.current && targetLookAtRef.current) {
            animationProgressRef.current = Math.min(animationProgressRef.current + delta * 1.5, 1);

            // Easing 함수 (ease-in-out)
            const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            const easedProgress = ease(animationProgressRef.current);

            if (startPositionRef.current && startLookAtRef.current) {
                // 카메라 위치 보간
                camera.position.lerpVectors(startPositionRef.current, targetPositionRef.current, easedProgress);

                // 타겟 위치 보간
                controlsRef.current.target.lerpVectors(startLookAtRef.current, targetLookAtRef.current, easedProgress);

                controlsRef.current.update();
            }

            if (animationProgressRef.current >= 1) {
                setIsAnimating(false);
                if (animationTypeRef.current === 'reset') {
                    isResettingRef.current = false;
                }
                animationTypeRef.current = null;
            }
        }
    });

    // 2. Triad Lines (Joy #1, Calm #5, Sadness #8)
    const triadData = useMemo(() => {
        const joy = emotionData.find(d => d.id === 1);
        const calm = emotionData.find(d => d.id === 5);
        const sadness = emotionData.find(d => d.id === 8);

        if (!joy || !calm || !sadness) return null;

        const p1 = getCoordinates(joy.angle, joy.bpm);
        const p2 = getCoordinates(calm.angle, calm.bpm);
        const p3 = getCoordinates(sadness.angle, sadness.bpm);

        // Calculate surface points
        // Radius = 0.4 * scale
        const getSurfacePoint = (center: THREE.Vector3, target: THREE.Vector3, hz: number) => {
            const scale = getScaleFromHz(hz);
            const radius = 0.4 * scale;
            const dir = new THREE.Vector3().subVectors(target, center).normalize();
            return center.clone().add(dir.multiplyScalar(radius));
        };

        const l1_start = getSurfacePoint(p1, p2, joy.hz);
        const l1_end = getSurfacePoint(p2, p1, calm.hz);

        const l2_start = getSurfacePoint(p2, p3, calm.hz);
        const l2_end = getSurfacePoint(p3, p2, sadness.hz);

        const l3_start = getSurfacePoint(p3, p1, sadness.hz);
        const l3_end = getSurfacePoint(p1, p3, joy.hz);

        // Calculate midpoints for labels (using original centers for simplicity)
        const mid1 = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const mid2 = new THREE.Vector3().addVectors(p2, p3).multiplyScalar(0.5);
        const mid3 = new THREE.Vector3().addVectors(p3, p1).multiplyScalar(0.5);

        return {
            lines: [
                [l1_start, l1_end],
                [l2_start, l2_end],
                [l3_start, l3_end]
            ],
            labels: [
                { pos: mid1, text: '1' },
                { pos: mid2, text: '4/5' },
                { pos: mid3, text: '2/3' }
            ]
        };
    }, []);

    // 전체 좌표계 자전 애니메이션을 위한 ref
    const rotationGroupRef = useRef<THREE.Group>(null);

    // 전체 좌표계를 아주 느리게 자전 (Y축 중심)
    useFrame((state, delta) => {
        if (rotationGroupRef.current) {
            // 매우 느린 회전 속도: 1회전에 약 5분 (0.02 rad/s)
            // 더 부드러운 회전을 위해 더 작은 값 사용
            rotationGroupRef.current.rotation.y += delta * 0.02;
        }
    });

    return (
        <>
            <CosmicBackground />
            <Spaceship />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <OrbitControls ref={controlsRef} />

            {/* 전체 좌표계 회전 그룹 */}
            <group ref={rotationGroupRef}>
                {/* Tilted Ring Line */}
                {showDropLines && (
                    <Line points={ringPoints} color="#888" opacity={0.5} transparent lineWidth={1} />
                )}

                {/* Triad Connection */}
                {showDropLines && triadData && (
                    <>
                        {triadData.lines.map((points, idx) => (
                            <Line key={idx} points={points} color="white" lineWidth={2} opacity={0.3} transparent />
                        ))}
                        {/* Ratio Labels on Triangle Edges */}
                        {triadData.labels.map((label, idx) => (
                            <Billboard key={idx} position={[label.pos.x, label.pos.y, label.pos.z]}>
                                <Text
                                    fontSize={0.25}
                                    color="white"
                                    anchorX="center"
                                    anchorY="middle"
                                    outlineWidth={0.03}
                                    outlineColor="black"
                                >
                                    {label.text}
                                </Text>
                            </Billboard>
                        ))}
                    </>
                )}

                {/* Emotion Nodes */}
                {emotionData.map((data) => {
                    const pos = getCoordinates(data.angle, data.bpm);
                    const dropLinePoints = [pos, new THREE.Vector3(pos.x, 0, pos.z)];
                    const isHovered = hoveredNode === data.id;

                    return (
                        <group key={data.id}>
                            {/* Drop Line */}
                            {showDropLines && (
                                <Line points={dropLinePoints} color="#666" opacity={0.2} transparent dashed={false} lineWidth={1} />
                            )}

                            <group position={pos}>
                                {/* Pulsing Sphere */}
                                <PulsingSphere
                                    data={data}
                                    isHovered={isHovered}
                                    setHoveredNode={setHoveredNode}
                                    onClick={() => onNodeClick?.(data.id)}
                                    position={new THREE.Vector3(0, 0, 0)} // Position is handled by parent group
                                />

                                {/* Text Labels (Billboard ensures they face camera) */}
                                {showDropLines && (
                                    <Billboard position={[0, 0.8 + (getScaleFromHz(data.hz) * 0.4), 0]}>
                                        <Text
                                            fontSize={0.3}
                                            color="white"
                                            anchorY="bottom"
                                            outlineWidth={0.02}
                                            outlineColor="black"
                                        >
                                            {data.label}
                                        </Text>
                                        <Text
                                            position={[0, -0.25, 0]}
                                            fontSize={0.15}
                                            color="#ccc"
                                            anchorY="top"
                                        >
                                            {data.note} | {data.hz} Hz
                                        </Text>
                                        <Text
                                            position={[0, -0.45, 0]}
                                            fontSize={0.15}
                                            color="#ccc"
                                            anchorY="top"
                                        >
                                            {data.bpm} BPM
                                        </Text>
                                        <Text
                                            position={[0, -0.65, 0]}
                                            fontSize={0.15}
                                            color="#ccc"
                                            anchorY="top"
                                        >
                                            {getColorName(data.colorHex)} | {typeof data.nm === 'number' ? `${data.nm}nm` : data.nm}
                                        </Text>
                                        {isHovered && (
                                            <Text
                                                position={[0, -0.7, 0]}
                                                fontSize={0.12}
                                                color="#aaa"
                                                anchorY="top"
                                                maxWidth={2}
                                                textAlign="center"
                                            >
                                                {data.description}
                                            </Text>
                                        )}
                                    </Billboard>
                                )}
                            </group>
                        </group>
                    );
                })}
            </group>

            {showDropLines && (
                <gridHelper args={[20, 20, 0x222222, 0x111111]} position={[0, 0, 0]} />
            )}
        </>
    );
}
