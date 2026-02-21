import type { RoundResult } from '../types';
import { Trophy, Frown, Scale, Sparkles } from 'lucide-react';

interface Props {
    result: RoundResult;
    playerSlot: 'A' | 'B';
    baseline: string | null;
    isReady: boolean;
    opReady: boolean;
    onReady: () => void;
    onStartNext: () => void;
    onEndMatch: () => void;
    onLeaveMatch: () => void;
    playerAName: string;
    playerBName: string;
}

export default function ResultOverlay({ result, playerSlot, baseline, isReady, opReady, onReady, onStartNext, onEndMatch, onLeaveMatch, playerAName, playerBName }: Props) {
    const isWinner = result.winner === playerSlot;
    const isTie = result.winner === 'tie';

    const myLabel = playerSlot === 'A' ? result.A_label : result.B_label;
    const opLabel = playerSlot === 'A' ? result.B_label : result.A_label;
    const myImage = playerSlot === 'A' ? result.A_image : result.B_image;
    const opImage = playerSlot === 'A' ? result.B_image : result.A_image;

    let title = '';
    let icon = null;
    let bgClass = '';

    let formattedReason = result.reason || '';
    formattedReason = formattedReason
        .replace(/Player A's/ig, `${playerAName}'s`)
        .replace(/Player A/ig, playerAName)
        .replace(/Player B's/ig, `${playerBName}'s`)
        .replace(/Player B/ig, playerBName);

    if (isTie) {
        title = "It's a Tie!";
        icon = <Scale className="w-16 h-16 text-amber-400 mb-4 animate-pulse" />;
        bgClass = "from-amber-900/90 to-amber-800/90 border-amber-500/50";
    } else if (isWinner) {
        title = "You Win!";
        icon = <Trophy className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />;
        bgClass = "from-emerald-900/90 to-emerald-800/90 border-emerald-500/50";
    } else {
        title = "You Lost!";
        icon = <Frown className="w-16 h-16 text-rose-400 mb-4" />;
        bgClass = "from-rose-900/90 to-rose-800/90 border-rose-500/50";
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`max-w-xl w-full p-8 rounded-3xl border-2 bg-gradient-to-br ${bgClass} shadow-2xl flex flex-col items-center text-center scale-in-center shadow-black/50`}>
                {icon}
                <h2 className="text-5xl font-black text-white mb-6 tracking-tight drop-shadow-md">{title}</h2>

                <p className="text-xl text-white/90 font-medium mb-8 max-w-md mx-auto leading-relaxed bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                    {formattedReason}
                </p>

                <div className="flex w-full mb-8 items-center justify-between gap-4">
                    <div className="flex-1 bg-black/30 p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative">
                        <span className="text-[10px] text-indigo-300/80 uppercase tracking-widest font-bold mb-3 z-10">You DREW</span>
                        {myImage && <img src={myImage} alt="Your drawing" className="w-full max-w-[140px] aspect-square object-contain bg-white rounded-xl mb-3 border-4 border-indigo-500/50 shadow-lg" />}
                        <span className="text-lg font-bold text-white capitalize z-10 text-center leading-tight">{myLabel || '?'}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-1">
                        <span className="text-3xl font-black text-slate-500/50 italic">VS</span>
                    </div>

                    <div className="flex-1 bg-black/30 p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative">
                        <span className="text-[10px] text-rose-300/80 uppercase tracking-widest font-bold mb-3 z-10">Opponent DREW</span>
                        {opImage && <img src={opImage} alt="Opponent drawing" className="w-full max-w-[140px] aspect-square object-contain bg-slate-200 rounded-xl mb-3 border-4 border-rose-500/50 shadow-lg" />}
                        <span className="text-lg font-bold text-white capitalize z-10 text-center leading-tight">{opLabel || '?'}</span>
                    </div>
                </div>

                <div className="bg-black/40 backdrop-blur-md w-full p-4 rounded-2xl flex items-center justify-center gap-3 border border-indigo-500/30">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                    <div className="flex flex-col text-left">
                        <span className="text-xs text-indigo-300 uppercase font-bold tracking-widest">New Baseline</span>
                        <span className="text-xl font-bold text-white capitalize">{result.new_baseline || baseline || 'None'}</span>
                    </div>
                </div>

                <div className="w-full flex flex-col gap-3 mt-8">
                    {!isReady ? (
                        <button
                            onClick={onReady}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold tracking-wide shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all font-mono"
                        >
                            Ready for Next Round
                        </button>
                    ) : playerSlot === 'A' ? (
                        <div className="flex flex-col gap-2 w-full">
                            <button
                                onClick={onStartNext}
                                disabled={!opReady}
                                className={`w-full py-4 rounded-xl text-white font-bold tracking-wide shadow-lg transition-all font-mono ${opReady
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
                                    : 'bg-slate-700 opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                {opReady ? "Start Next Round" : "Waiting for Opponent..."}
                            </button>
                            <button
                                onClick={onEndMatch}
                                className="w-full py-3 rounded-xl text-rose-400 font-bold bg-rose-500/10 hover:bg-rose-500/20 transition-all font-mono border border-rose-500/30 text-sm"
                            >
                                End Match Now
                            </button>
                        </div>
                    ) : (
                        <div className="bg-black/40 p-4 rounded-xl text-white/60 font-medium tracking-wide text-sm text-center border border-white/5">
                            Waiting for Host to start...
                        </div>
                    )}

                    {opReady && !isReady && (
                        <div className="text-emerald-400 font-bold text-sm text-center animate-pulse mt-2">
                            Opponent is ready!
                        </div>
                    )}

                    <button
                        onClick={onLeaveMatch}
                        className="w-full py-3 mt-2 rounded-xl text-slate-400 font-bold bg-slate-800/50 hover:bg-slate-700/80 transition-all font-mono border border-slate-700 text-sm"
                    >
                        Leave Match
                    </button>
                </div>
            </div>
        </div>
    );
}
