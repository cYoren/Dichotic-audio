import React, { useRef, useEffect } from 'react';
import type { DATState } from './types';

interface DATSessionSummaryProps {
    state: DATState;
    onRetry: () => void;
    onClose: () => void;
}

export const DATSessionSummary: React.FC<DATSessionSummaryProps> = ({
    state,
    onRetry,
    onClose
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const accuracy = state.totalRounds > 0 
        ? Math.round((state.correctCount / state.totalRounds) * 100) 
        : 0;
    
    const avgReaction = state.reactionTimes.length > 0
        ? (state.reactionTimes.reduce((a, b) => a + b, 0) / state.reactionTimes.length).toFixed(2)
        : "N/A";

    const leftAcc = state.leftEarStats.total > 0
        ? Math.round((state.leftEarStats.correct / state.leftEarStats.total) * 100)
        : 0;
        
    const rightAcc = state.rightEarStats.total > 0
        ? Math.round((state.rightEarStats.correct / state.rightEarStats.total) * 100)
        : 0;

    const bestEar = leftAcc > rightAcc ? 'Left' : rightAcc > leftAcc ? 'Right' : 'Balanced';
    const bestEarColor = leftAcc > rightAcc ? 'text-blue-600' : rightAcc > leftAcc ? 'text-red-600' : 'text-purple-600';

    // Draw Simple Chart
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx || !canvasRef.current) return;

        const w = canvasRef.current.width;
        const h = canvasRef.current.height;
        const barW = 60;
        const maxH = h - 40; // Margin for text

        ctx.clearRect(0, 0, w, h);

        // Left Bar
        const leftH = (leftAcc / 100) * maxH;
        ctx.fillStyle = '#3b82f6'; // Blue
        ctx.fillRect(w/3 - barW/2, h - 20 - leftH, barW, leftH);
        ctx.fillStyle = '#1e3a8a';
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${leftAcc}%`, w/3, h - 25 - leftH);
        ctx.fillStyle = '#6b7280';
        ctx.fillText("Left Ear", w/3, h - 5);

        // Right Bar
        const rightH = (rightAcc / 100) * maxH;
        ctx.fillStyle = '#ef4444'; // Red
        ctx.fillRect(2*w/3 - barW/2, h - 20 - rightH, barW, rightH);
        ctx.fillStyle = '#991b1b';
        ctx.fillText(`${rightAcc}%`, 2*w/3, h - 25 - rightH);
        ctx.fillStyle = '#6b7280';
        ctx.fillText("Right Ear", 2*w/3, h - 5);

    }, [leftAcc, rightAcc]);

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
            <div className="bg-indigo-600 p-6 text-white text-center">
                <h2 className="text-2xl font-bold mb-1">Session Complete!</h2>
                <p className="text-indigo-100 text-sm">Here is how you performed.</p>
            </div>

            <div className="p-8">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Accuracy</p>
                        <p className="text-3xl font-bold text-gray-900">{accuracy}<span className="text-lg text-gray-400">%</span></p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Avg Reaction</p>
                        <p className="text-3xl font-bold text-gray-900">{avgReaction}<span className="text-lg text-gray-400">s</span></p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Best Ear</p>
                        <p className={`text-2xl font-bold ${bestEarColor}`}>{bestEar}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Correct</p>
                        <p className="text-3xl font-bold text-gray-900">{state.correctCount}<span className="text-lg text-gray-400">/{state.totalRounds}</span></p>
                    </div>
                </div>

                {/* Chart */}
                <div className="mb-8 flex flex-col items-center">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Ear Advantage Comparison</h3>
                    <canvas ref={canvasRef} width={300} height={200} className="w-full max-w-xs" />
                    <div className="mt-4 text-xs text-gray-500 grid grid-cols-2 gap-x-8 gap-y-1">
                        <span className="text-right">Left Avg Time: <span className="font-mono font-bold text-gray-800">{state.leftEarStats.avgTime.toFixed(2)}s</span></span>
                        <span className="text-left">Right Avg Time: <span className="font-mono font-bold text-gray-800">{state.rightEarStats.avgTime.toFixed(2)}s</span></span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:text-gray-800 transition-colors"
                    >
                        Back to Menu
                    </button>
                    <button
                        onClick={onRetry}
                        className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        Start New Session
                    </button>
                </div>
            </div>
        </div>
    );
};

