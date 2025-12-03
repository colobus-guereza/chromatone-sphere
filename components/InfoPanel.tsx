import { useState } from 'react';

interface InfoPanelProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function InfoPanel({ isOpen: controlledIsOpen, onOpenChange }: InfoPanelProps = {}) {
    const [internalIsExpanded, setInternalIsExpanded] = useState(false);
    
    // Controlled 또는 uncontrolled 모드 지원
    const isExpanded = controlledIsOpen !== undefined ? controlledIsOpen : internalIsExpanded;
    const setIsExpanded = (value: boolean) => {
        if (controlledIsOpen !== undefined) {
            onOpenChange?.(value);
        } else {
            setInternalIsExpanded(value);
        }
    };

    return (
        <div
            data-panel
            className={`absolute top-[176px] right-8 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl transition-[opacity,transform,background-color] duration-300 ease-in-out z-20 overflow-hidden ${isExpanded ? 'w-[420px] p-6 max-h-[90vh] overflow-y-auto' : 'w-[60px] h-[60px] p-0 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10'
                }`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Toggle Button (Visible when expanded) */}
            {isExpanded && (
                <button
                    onClick={() => setIsExpanded(false)}
                    className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                    aria-label="Close panel"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>
            )}

            {/* Collapsed State Icon */}
            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full h-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
                    aria-label="Open panel"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="16" y2="12" />
                        <line x1="12" x2="12.01" y1="8" y2="8" />
                    </svg>
                </button>
            )}

            {/* Content (Only visible when expanded) */}
            <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 pr-8">
                    공감각적 관계
                </h2>
                <p className="text-gray-400 text-sm mb-6">Synesthetic Relations</p>

                <div className="space-y-5 text-base font-sans">
                    <p className="text-gray-300 leading-relaxed">
                        이 인터페이스는 감정을 5가지 물리적 차원으로 변환하여 3D 공간에 시각화합니다. 이 모든 연결은 자연의 진동 비율을 따릅니다.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-2">
                            <h3 className="text-white font-bold text-lg">1. 화성 비율 (Harmonic Ratio: 1 : 4/5 : 2/3)</h3>
                            <p className="text-gray-300 leading-relaxed mb-2">
                                이 모델의 핵심 알고리즘입니다.
                            </p>
                            <div className="space-y-2 text-gray-300">
                                <p className="leading-relaxed">
                                    <span className="font-semibold">소리</span>: 도(C), 미(E), 솔(G)의 3화음은 현의 길이가 1 : 4/5 : 2/3로 줄어들 때 발생하는 완벽한 물리적 공명입니다.
                                </p>
                                <p className="leading-relaxed">
                                    <span className="font-semibold">색상</span>: 이 비율은 시각적 3원색인 <span className="text-red-400 font-semibold">빨강(C/환희)</span>, <span className="text-green-400 font-semibold">초록(E/평온)</span>, <span className="text-blue-400 font-semibold">파랑(G/슬픔)</span>의 좌표 배치 기준이 되어, 소리의 질서가 빛의 파장으로 변환됨을 증명합니다.
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-2">
                            <h3 className="text-white font-bold text-lg">2. 원형 좌표 (Cycle)</h3>
                            <p className="text-gray-300 leading-relaxed">
                                감정의 위치를 나타냅니다. 12개의 감정은 비율에 맞춰 원 둘레에 배치되어 끊임없이 순환하는 마음의 흐름을 보여줍니다.
                            </p>
                        </div>
                        
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-2">
                            <h3 className="text-white font-bold text-lg">3. 음높이 (Hz = Mass)</h3>
                            <p className="text-gray-300 leading-relaxed">
                                감정의 무게와 존재감을 결정합니다.
                            </p>
                            <ul className="text-gray-300 space-y-1 ml-4 list-disc">
                                <li><span className="font-semibold">낮은 주파수 (Low Hz)</span>: 파장이 길고 묵직하여 거대한 행성으로 시각화됩니다. (C4 환희는 가장 거대한 근원)</li>
                                <li><span className="font-semibold">높은 주파수 (High Hz)</span>: 파장이 짧고 날카로워 작고 단단한 위성으로 나타납니다.</li>
                            </ul>
                        </div>
                        
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-2">
                            <h3 className="text-white font-bold text-lg">4. 심박수 (BPM = Energy)</h3>
                            <p className="text-gray-300 leading-relaxed">
                                감정의 높이와 속도를 결정합니다.
                            </p>
                            <ul className="text-gray-300 space-y-1 ml-4 list-disc">
                                <li><span className="font-semibold">고도 (Altitude)</span>: BPM이 높을수록 에너지가 넘쳐 하늘 높이 떠오릅니다.</li>
                                <li><span className="font-semibold">속도 (Pulse)</span>: BPM에 맞춰 구체가 실제로 두근거립니다. 150 BPM은 심장이 터질 듯 빠르게, 50 BPM은 호흡하듯 느리게 진동합니다.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
