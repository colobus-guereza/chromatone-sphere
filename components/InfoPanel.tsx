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
            className={`absolute top-[104px] right-8 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl transition-[opacity,transform,background-color] duration-300 ease-in-out z-20 overflow-hidden ${isExpanded ? 'w-[360px] p-6' : 'w-[60px] h-[60px] p-0 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10'
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

                <div className="space-y-4 text-sm font-sans">
                    <div className="space-y-3">
                        <p className="text-gray-300 text-xs leading-relaxed">
                            이 도표는 <span className="text-white font-semibold">감정</span>을 다섯 가지 요소로 표현합니다.
                        </p>
                        
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-2">
                            <p className="text-gray-300 text-xs leading-relaxed">
                                <span className="text-white font-semibold">원형 좌표</span>는 감정의 위치를 나타냅니다. 
                                각 감정은 원 둘레의 특정 각도에 배치되어, 마치 시계처럼 감정의 순환을 보여줍니다.
                            </p>
                            
                            <p className="text-gray-300 text-xs leading-relaxed">
                                <span className="text-white font-semibold">색상</span>은 감정의 온도를 표현합니다. 
                                빨강(환희)은 뜨거운 열정을, 초록(평온)은 차분한 안정을, 파랑(슬픔)은 차가운 깊이를 나타냅니다. 
                                마치 무지개처럼 감정의 스펙트럼을 보여줍니다.
                            </p>
                            
                            <p className="text-gray-300 text-xs leading-relaxed">
                                <span className="text-white font-semibold">음높이(Hz)</span>는 감정의 톤을 결정합니다. 
                                높은 음은 밝고 경쾌한 감정을, 낮은 음은 깊고 무거운 감정을 나타냅니다. 
                                마치 피아노 건반처럼 각 감정이 고유한 음을 가집니다.
                            </p>
                            
                            <p className="text-gray-300 text-xs leading-relaxed">
                                <span className="text-white font-semibold">심박수(BPM)</span>는 감정의 높이를 결정합니다. 
                                빠른 심박은 높은 곳에, 느린 심박은 낮은 곳에 배치되어, 
                                마치 산을 오르듯 감정의 강도에 따라 위아래로 움직입니다.
                            </p>
                        </div>
                        
                        <p className="text-gray-400 text-xs leading-relaxed italic">
                            이 다섯 요소가 함께 어우러져, 감정을 3차원 공간에서 시각적으로 경험할 수 있게 합니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
