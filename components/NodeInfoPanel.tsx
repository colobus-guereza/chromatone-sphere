import { EmotionData } from '@/data/dataset';
import { X } from 'lucide-react';

interface NodeInfoPanelProps {
    node: EmotionData | null;
    onClose: () => void;
}

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

export function NodeInfoPanel({ node, onClose }: NodeInfoPanelProps) {
    if (!node) return null;

    const colorName = getColorName(node.colorHex);

    return (
        <div 
            data-panel
            className="absolute top-[176px] right-8 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl transition-[opacity,transform] duration-300 ease-in-out z-20 overflow-hidden w-[320px] p-4"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                aria-label="Close panel"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="space-y-3">
                {/* Header */}
                <div className="pr-6">
                    <h2 className="text-xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        {node.label}
                    </h2>
                    <p className="text-xs text-gray-400">{node.description}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                        <div className="text-xs text-gray-400 mb-0.5">Note</div>
                        <div className="text-base font-bold text-white font-mono">{node.note}</div>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                        <div className="text-xs text-gray-400 mb-0.5">Frequency</div>
                        <div className="text-base font-bold text-white font-mono">{node.hz.toFixed(2)} Hz</div>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                        <div className="text-xs text-gray-400 mb-0.5">BPM</div>
                        <div className="text-base font-bold text-white font-mono">{node.bpm}</div>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                        <div className="text-xs text-gray-400 mb-0.5">Angle</div>
                        <div className="text-base font-bold text-white font-mono">{node.angle}°</div>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 col-span-2">
                        <div className="text-xs text-gray-400 mb-1.5">Color</div>
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                                style={{ backgroundColor: node.colorHex }}
                            />
                            <div className="flex items-center gap-2 flex-1">
                                <div className="text-sm font-bold text-white">{colorName}</div>
                                <div className="text-xs font-mono text-gray-400">{node.colorHex}</div>
                            </div>
                        </div>
                    </div>
                    {node.radiusScale && (
                        <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 col-span-2">
                            <div className="text-xs text-gray-400 mb-0.5">Radius Scale</div>
                            <div className="text-base font-bold text-white font-mono">{node.radiusScale}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

