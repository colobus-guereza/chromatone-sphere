'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { OrbitControls, Html, Line, Text, Billboard } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { emotionData } from '@/data/dataset';

interface EmotionSceneProps {
    onNodeClick?: (nodeId: number) => void;
    focusTarget?: THREE.Vector3 | null;
    onResetCamera?: () => void;
}

// Helper to calculate scale from Hz (Inverse relationship)
// C4 (261.63) -> 1.8x (Increased contrast)
// B4 (493.88) -> 0.8x
const getScaleFromHz = (hz: number) => {
    const minHz = 261.63;
    const maxHz = 493.88;
    const minScale = 1.8; // Increased from 1.5
    const maxScale = 0.8;

    const t = Math.max(0, Math.min(1, (hz - minHz) / (maxHz - minHz)));
    return minScale + (maxScale - minScale) * t;
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

    useFrame(({ clock }) => {
        if (meshRef.current) {
            // Pulse animation based on BPM
            // Speed: BPM / 60 * 2PI (1 beat per second = 1Hz pulse)
            const speed = (data.bpm / 60) * Math.PI * 2;
            const time = clock.getElapsedTime();
            const pulse = Math.sin(time * speed) * 0.05 * baseScale; // 5% pulse

            const currentScale = baseScale + pulse;
            meshRef.current.scale.set(currentScale, currentScale, currentScale);
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
                emissive={data.colorHex}
                emissiveIntensity={isHovered ? 0.8 : 0.2}
                roughness={0.2}
                metalness={0.8}
            />
        </mesh>
    );
};

export default function EmotionScene({ onNodeClick, focusTarget, onResetCamera }: EmotionSceneProps) {
    const [hoveredNode, setHoveredNode] = useState<number | null>(null);
    const controlsRef = useRef<any>(null);
    const { camera } = useThree();

    // 초기 카메라 위치와 타겟 저장 (약간 각도가 있는 탑뷰, 환희가 12시에 오도록)
    // 첫 번째 이미지처럼 약간 기울어진 탑뷰 시점
    const initialCameraPosition = useMemo(() => new THREE.Vector3(0, 12, 4), []); // 약간 각도가 있는 탑뷰
    const initialTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

    // 카메라 애니메이션을 위한 상태
    const [isAnimating, setIsAnimating] = useState(false);
    const [resetCamera, setResetCamera] = useState(false);
    const animationTypeRef = useRef<'focus' | 'reset' | null>(null); // 애니메이션 타입 구분
    const targetPositionRef = useRef<THREE.Vector3 | null>(null);
    const targetLookAtRef = useRef<THREE.Vector3 | null>(null);
    const startPositionRef = useRef<THREE.Vector3 | null>(null);
    const startLookAtRef = useRef<THREE.Vector3 | null>(null);
    const animationProgressRef = useRef(0);

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
    const getCoordinates = (angle: number, bpm: number) => {
        const r = BASE_RADIUS; // Constant radius for Tilted Orbit
        const rad = (angle * Math.PI) / 180;
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
        } else if (!focusTarget && !isResettingRef.current && animationTypeRef.current !== 'reset') {
            // focusTarget이 null이고 초기화 중이 아닐 때만 애니메이션 중지
            animationTypeRef.current = null;
            setIsAnimating(false);
        }
    }, [focusTarget, camera]);

    // 카메라 초기화 애니메이션
    const isResettingRef = useRef(false);
    const startAzimuthRef = useRef(0);
    useEffect(() => {
        if (resetCamera && controlsRef.current) {
            // 기존 애니메이션 완전히 중지
            animationTypeRef.current = null;
            setIsAnimating(false);
            animationProgressRef.current = 0;

            // 초기화 플래그 설정 (focusTarget useEffect가 실행되지 않도록)
            isResettingRef.current = true;

            // 즉시 초기화 애니메이션 시작 (지연 제거)
            animationTypeRef.current = 'reset';
            setIsAnimating(true);
            animationProgressRef.current = 0;

            // 시작 위치 저장 (현재 카메라 위치)
            startPositionRef.current = camera.position.clone();
            startLookAtRef.current = controlsRef.current.target.clone();

            // 시작 azimuth 저장 (현재 azimuth 가져오기)
            if (controlsRef.current.getAzimuthalAngle) {
                startAzimuthRef.current = controlsRef.current.getAzimuthalAngle();
            } else {
                startAzimuthRef.current = 0;
            }

            // 목표 위치는 초기 위치 (약간 각도가 있는 탑뷰)
            targetPositionRef.current = initialCameraPosition.clone();
            targetLookAtRef.current = initialTarget.clone();

            // 즉시 false로 설정하여 중복 실행 방지
            setResetCamera(false);
        }
    }, [resetCamera, camera, initialCameraPosition, initialTarget]);

    // 초기화 함수를 부모에 노출
    useEffect(() => {
        if (onResetCamera) {
            // 부모 컴포넌트에서 호출할 수 있도록 함수 전달
            (window as any).resetCameraView = () => {
                setResetCamera(true);
            };
        }
        return () => {
            delete (window as any).resetCameraView;
        };
    }, [onResetCamera]);

    // 애니메이션 프레임 업데이트
    useFrame((state, delta) => {
        if (isAnimating && controlsRef.current && targetPositionRef.current && targetLookAtRef.current) {
            animationProgressRef.current = Math.min(animationProgressRef.current + delta * 1.5, 1);

            // Easing 함수 (ease-in-out)
            const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            const easedProgress = ease(animationProgressRef.current);

            if (startPositionRef.current && startLookAtRef.current) {
                // 초기화 애니메이션 중일 때 azimuth를 먼저 설정 (카메라 위치에 영향을 주지 않도록)
                if (animationTypeRef.current === 'reset' && controlsRef.current.setAzimuthalAngle) {
                    const targetAzimuth = -Math.PI / 2; // -90도 (환희를 12시로)
                    const currentAzimuth = startAzimuthRef.current + (targetAzimuth - startAzimuthRef.current) * easedProgress;
                    controlsRef.current.setAzimuthalAngle(currentAzimuth);
                }

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

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <OrbitControls ref={controlsRef} />

            {/* Tilted Ring Line */}
            <Line points={ringPoints} color="#888" opacity={0.5} transparent lineWidth={1} />

            {/* Triad Connection */}
            {triadData && (
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
                        <Line points={dropLinePoints} color="#666" opacity={0.2} transparent dashed={false} lineWidth={1} />

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
                        </group>
                    </group>
                );
            })}

            <gridHelper args={[20, 20, 0x222222, 0x111111]} position={[0, 0, 0]} />
        </>
    );
}
