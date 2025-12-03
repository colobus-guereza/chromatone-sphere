'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { RotateCcw, Eye, EyeOff } from 'lucide-react';
import EmotionScene from '@/components/EmotionScene';
import { InfoPanel } from '@/components/InfoPanel';
import { NodeInfoPanel } from '@/components/NodeInfoPanel';
import { emotionData } from '@/data/dataset';

export default function Home() {
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [focusTarget, setFocusTarget] = useState<THREE.Vector3 | null>(null);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showDropLines, setShowDropLines] = useState(true);
  const selectedNode = selectedNodeId !== null ? emotionData.find(d => d.id === selectedNodeId) || null : null;

  const handleNodeClick = (nodeId: number) => {
    setSelectedNodeId(nodeId);

    // 선택된 노드의 위치 계산
    const node = emotionData.find(d => d.id === nodeId);
    if (node) {
      const BASE_RADIUS = 6;
      const rad = (node.angle * Math.PI) / 180;
      const x = BASE_RADIUS * Math.cos(rad);
      const z = BASE_RADIUS * Math.sin(rad);
      const y = (node.bpm - 50) * 0.1;
      setFocusTarget(new THREE.Vector3(x, y, z));
    }
  };

  return (
    <main className="w-full h-screen bg-black relative overflow-hidden">
      <Canvas camera={{ position: [0, 12, 4], fov: 50 }}>
        <color attach="background" args={['#050505']} />
        <EmotionScene
          onNodeClick={handleNodeClick}
          focusTarget={focusTarget}
          resetTrigger={resetTrigger}
          showDropLines={showDropLines}
        />
      </Canvas>

      {/* Control Buttons Container */}
      <div className="absolute top-8 right-8 flex flex-col gap-3 z-30">
        {/* Toggle Drop Lines Button */}
        <button
          onClick={() => setShowDropLines(!showDropLines)}
          className="w-[60px] h-[60px] rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Toggle drop lines"
          title={showDropLines ? "UI 숨기기" : "UI 보이기"}
        >
          {showDropLines ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>

        {/* Reset Camera Button */}
        <button
          onClick={() => {
            // 카메라 초기화 트리거
            setResetTrigger(prev => prev + 1);

            // 선택된 노드와 타겟 해제
            setFocusTarget(null);
            setSelectedNodeId(null);
          }}
          className="w-[60px] h-[60px] rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Reset camera view"
          title="카메라 시점 초기화"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {showDropLines && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white pointer-events-none z-10 text-center max-w-2xl px-4">
          <div className="mb-3">
            <p className="text-lg font-mono text-gray-300 mb-2">
              1 : <span className="text-blue-400">4/5</span> : <span className="text-purple-400">2/3</span>
            </p>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
            Chromatone Sphere
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            크로마톤 스피어는 소리, 빛, 그리고 인간의 심장 박동을 관통하는 단 하나의 자연 법칙,<br />
            '화성 비율(Harmonic Ratio)'을 통해 감정을 통합적으로 시각화합니다.
          </p>
        </div>
      )}
      {/* Backdrop for closing panels */}
      {(isInfoPanelOpen || selectedNode) && (
        <div
          className="fixed inset-0 z-10"
          onClick={(e) => {
            // 패널 내부 클릭은 무시
            if ((e.target as HTMLElement).closest('[data-panel]')) {
              return;
            }
            // 패널 바깥 클릭 시 패널 닫기
            if (isInfoPanelOpen) {
              setIsInfoPanelOpen(false);
            }
            if (selectedNode) {
              setSelectedNodeId(null);
            }
          }}
        />
      )}

      <InfoPanel isOpen={isInfoPanelOpen} onOpenChange={setIsInfoPanelOpen} />
      {selectedNode && (
        <NodeInfoPanel
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </main>
  );
}
