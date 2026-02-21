import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { socket } from '../socket';
import type { GameState, RoundResult } from '../types';
import { Timer, Send, Edit3, AlertCircle, TrendingUp, RefreshCcw, Sparkles } from 'lucide-react';
import ResultOverlay from './ResultOverlay';

interface GameProps {
    gameState: GameState;
    playerSlot: 'A' | 'B';
    matchCode: string;
    roundResult: RoundResult | null;
}

export default function Game({ gameState, playerSlot, matchCode, roundResult }: GameProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [submitted, setSubmitted] = useState(false);
    const [jollyText, setJollyText] = useState('');

    const opponentSlot = playerSlot === 'A' ? 'B' : 'A';
    const matchJolly = playerSlot === 'A' ? gameState.jolly.A_typed_turns : gameState.jolly.B_typed_turns;
    const isJollyMode = matchJolly > 0;

    // Track timer
    useEffect(() => {
        if (roundResult) return; // Stop timer if result is showing

        // Reset state for new round
        setSubmitted(false);
        setTimeLeft(30);
        sigCanvas.current?.clear();
        setJollyText('');

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState.round.roundId, roundResult]);

    const handleTimeUp = () => {
        if (!submitted) {
            if (isJollyMode && jollyText.trim()) {
                handleSubmitText(new Event('submit') as any);
            } else if (!isJollyMode) {
                handleSubmitDoodle();
            } else {
                // Fallback: Submit empty/unknown if nothing typed
                submit('text', 'unknown');
            }
        }
    };

    const clearCanvas = () => {
        sigCanvas.current?.clear();
    };

    const handleSubmitDoodle = () => {
        if (!sigCanvas.current || submitted) return;

        let dataUrl = '';
        if (sigCanvas.current.isEmpty()) {
            // Create a blank 512x512 png
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            dataUrl = canvas.toDataURL();
        } else {
            dataUrl = sigCanvas.current.getCanvas().toDataURL('image/png');
        }

        submit('doodle', dataUrl);
    };

    const handleSubmitText = (e: React.FormEvent) => {
        e.preventDefault();
        if (submitted) return;
        submit('text', jollyText.trim() || 'unknown');
    };

    const submit = (type: 'doodle' | 'text', content: string) => {
        setSubmitted(true);
        socket.emit('round:submit', {
            code: matchCode,
            playerId: playerSlot,
            type,
            content
        });
    };

    const myScore = gameState.scores[playerSlot];
    const opScore = gameState.scores[opponentSlot];
    const hasOpponentSubmitted = !!gameState.round[`${opponentSlot}_label`];

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">

            {/* HUD Bar */}
            <div className="glass-panel p-4 flex justify-between items-center px-8">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">{gameState.names[playerSlot]} (You)</span>
                    <span className="text-3xl font-black text-white">{myScore}</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                    {gameState.baseline ? (
                        <div className="flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-500/30">
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm text-indigo-200">Must beat:</span>
                            <span className="font-bold text-white capitalize">{gameState.baseline}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/30">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-200">First round! Set the baseline.</span>
                        </div>
                    )}
                    <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                        <Timer className="w-6 h-6" /> {timeLeft}s
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">{gameState.names[opponentSlot]} (Opponent)</span>
                    <span className="text-3xl font-black text-white">{opScore}</span>
                </div>
            </div>

            {/* Main Play Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* My Zone */}
                <div className="glass-panel flex flex-col relative overflow-hidden border-2 border-indigo-500/30 transition-all hover:border-indigo-500/50">
                    <div className="p-3 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                            </span>
                            <span className="font-semibold text-indigo-200">Your Canvas</span>
                        </div>
                        {isJollyMode && (
                            <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2 py-1 rounded">
                                JOLLY COMEBACK ({matchJolly} left)
                            </span>
                        )}
                    </div>

                    <div className="flex-1 bg-white relative min-h-[400px]">
                        {/* Container for canvas so it doesn't disappear */}
                        <div className={`absolute inset-0 ${submitted ? 'pointer-events-none opacity-50' : ''}`}>
                            {isJollyMode ? (
                                <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center p-8">
                                    <Edit3 className="w-12 h-12 text-pink-400 mb-6 opacity-80" />
                                    <h3 className="text-xl font-bold text-white mb-4 text-center">Type your object instead!</h3>
                                    <form onSubmit={handleSubmitText} className="w-full max-w-sm flex gap-2">
                                        <input
                                            type="text"
                                            value={jollyText}
                                            onChange={e => setJollyText(e.target.value)}
                                            placeholder="e.g. black hole"
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                            autoFocus
                                            disabled={submitted}
                                        />
                                        <button type="submit" disabled={submitted} className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-3 rounded-lg font-bold transition disabled:opacity-50">
                                            Submit
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor="black"
                                    backgroundColor="white"
                                    minWidth={2}
                                    maxWidth={8}
                                    canvasProps={{ className: "w-full h-full cursor-crosshair" }}
                                />
                            )}
                        </div>

                        {/* Overlay when submitted */}
                        {submitted && (
                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 transition-all duration-300">
                                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                                    <Send className="w-8 h-8 text-indigo-400 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 tracking-wide text-shadow-sm">Waiting for opponent and Judge</h3>
                                <p className="text-indigo-200/80 font-medium">Please stand by while the AI evaluates...</p>
                            </div>
                        )}
                    </div>

                    {!submitted && !isJollyMode && (
                        <div className="p-3 bg-slate-900/50 border-t border-white/5 flex gap-2 justify-between">
                            <button onClick={clearCanvas} className="flex items-center gap-1 px-4 py-2 hover:bg-slate-800 rounded-lg text-sm text-slate-300 transition">
                                <RefreshCcw className="w-4 h-4" /> Clear
                            </button>
                            <button onClick={handleSubmitDoodle} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-lg text-sm font-bold text-white transition shadow-lg shadow-indigo-600/20">
                                <Send className="w-4 h-4" /> Submit
                            </button>
                        </div>
                    )}
                </div>

                {/* Opponent Zone */}
                <div className="glass-panel flex flex-col relative overflow-hidden">
                    <div className="p-3 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <span className="font-semibold text-slate-400">Opponent's Canvas</span>
                    </div>

                    <div className="flex-1 bg-[#1e293b]/50 relative min-h-[400px] flex items-center justify-center border-dashed border-2 border-slate-700/50 m-4 rounded-xl">
                        {hasOpponentSubmitted ? (
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                                    <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse" />
                                </div>
                                <span className="text-emerald-400 font-medium">Ready</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-slate-500">
                                <Edit3 className="w-8 h-8 opacity-50 mb-2 animate-bounce" />
                                <span className="font-medium">Drawing...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History Ribbon */}
            {gameState.history.length > 0 && (
                <div className="glass-panel p-4 flex gap-2 items-center overflow-x-auto">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold whitespace-nowrap">History:</span>
                    {gameState.history.map((h, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300 whitespace-nowrap border border-slate-700">
                            {h}
                        </span>
                    ))}
                </div>
            )}

            {/* Rules Notice */}
            <div className="text-center text-xs text-slate-500 flex justify-center items-center gap-4">
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> No repeating words</span>
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> No writing text in drawings</span>
                {gameState.streaks.ties > 0 && <span className="text-amber-400 font-bold">Ties: {gameState.streaks.ties}/3</span>}
            </div>

            {roundResult && (
                <ResultOverlay
                    result={roundResult}
                    playerSlot={playerSlot}
                    baseline={gameState.baseline}
                    isReady={gameState.round.ready[playerSlot]}
                    opReady={gameState.round.ready[opponentSlot]}
                    onReady={() => socket.emit('player_ready', { code: matchCode, playerId: playerSlot })}
                    onStartNext={() => socket.emit('start_next_round', { code: matchCode })}
                    onEndMatch={() => socket.emit('end_match', { code: matchCode })}
                    playerAName={gameState.names.A || 'Player A'}
                    playerBName={gameState.names.B || 'Player B'}
                />
            )}
        </div>
    );
}
