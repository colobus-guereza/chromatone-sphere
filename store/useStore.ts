import { create } from 'zustand';

export type EmotionAnchor = {
    id: string;
    name: string;
    note: string;
    angle: number;
    color: string;
    bpm: number;
    radius: number;
    height: number;
};

interface AppState {
    anchors: EmotionAnchor[];
    hoveredNode: string | null;
    setHoveredNode: (id: string | null) => void;
}

const BASE_RADIUS = 5;

// BPM > 100 is +y, < 100 is -y. Let's say 100 is 0.
// Scale factor: (BPM - 100) / 10.
const calculateHeight = (bpm: number) => (bpm - 100) / 10;

export const useStore = create<AppState>((set) => ({
    anchors: [
        {
            id: 'joy',
            name: 'Joy (환희)',
            note: 'C',
            angle: 0,
            color: '#ff0000', // Red
            bpm: 150,
            radius: BASE_RADIUS,
            height: calculateHeight(150),
        },
        {
            id: 'calm',
            name: 'Calm (평온)',
            note: 'E',
            angle: 120,
            color: '#00ff00', // Green
            bpm: 50,
            radius: BASE_RADIUS * (4 / 5), // Ratio 4/5
            height: calculateHeight(50),
        },
        {
            id: 'sadness',
            name: 'Sadness (슬픔)',
            note: 'G',
            angle: 240,
            color: '#0000ff', // Blue
            bpm: 88,
            radius: BASE_RADIUS * (2 / 3), // Ratio 2/3
            height: calculateHeight(88),
        },
    ],
    hoveredNode: null,
    setHoveredNode: (id) => set({ hoveredNode: id }),
}));
