import { useState } from 'react';
import { Play, Users, Sparkles, Sword } from 'lucide-react';

interface LobbyProps {
    onJoin: (code: string, slot: 'A' | 'B', name: string) => void;
}

export default function Lobby({ onJoin }: LobbyProps) {
    const [playerName, setPlayerName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    const handleCreate = async () => {
        if (!playerName.trim()) {
            setError('Please enter your name first.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${backendUrl}/api/match/create`, { method: 'POST' });
            const data = await res.json();

            // Auto join the created room
            const joinRes = await fetch(`${backendUrl}/api/match/${data.code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: playerName.trim() })
            });
            const joinData = await joinRes.json();
            if (joinData.success) {
                onJoin(data.code, joinData.slot, playerName.trim());
            } else {
                setError(joinData.error || 'Failed to join created room.');
            }
        } catch (e) {
            setError('Failed to create match. Is the server running?');
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!playerName.trim()) {
            setError('Please enter your name first.');
            return;
        }
        if (!joinCode.trim()) return;

        setLoading(true);
        setError('');
        const code = joinCode.trim().toUpperCase();
        try {
            const res = await fetch(`${backendUrl}/api/match/${code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: playerName.trim() })
            });
            const data = await res.json();

            if (data.success) {
                onJoin(code, data.slot, playerName.trim());
            } else {
                setError(data.error || 'Match not found.');
            }
        } catch (e) {
            setError('Failed to join match.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] relative overflow-hidden">
            {/* Dynamic Background Effects */}
            <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

            <div className="glass-panel max-w-md w-full p-8 relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                    <Sword className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight text-center">
                    Doodle <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Duel</span>
                </h1>
                <p className="text-slate-400 mb-8 text-center text-sm">
                    The escalating creative arms race powered by AI.
                </p>

                {error && (
                    <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="w-full flex-col flex gap-4">
                    <div className="flex flex-col gap-1.5 mb-2">
                        <label htmlFor="playerName" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Your Name</label>
                        <input
                            type="text"
                            id="playerName"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                            placeholder="Enter your name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            maxLength={15}
                        />
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] disabled:opacity-50"
                    >
                        <Sparkles className="w-5 h-5 mr-2 -ml-1 group-hover:animate-pulse" />
                        Create New Match
                    </button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700/50" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-[#151b2b] px-2 text-slate-500">Or join an existing</span>
                        </div>
                    </div>

                    <div className="flex rounded-xl shadow-sm ring-1 ring-inset ring-slate-700/50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 overflow-hidden bg-slate-800/50 backdrop-blur-sm">
                        <span className="flex select-none items-center pl-4 text-slate-400 sm:text-sm">
                            <Users className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            name="joincode"
                            id="joincode"
                            className="block flex-1 border-0 bg-transparent py-3.5 pl-3 text-white placeholder:text-slate-500 focus:ring-0 sm:text-sm font-mono tracking-widest outline-none uppercase"
                            placeholder="ENTER CODE"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            maxLength={6}
                        />
                        <button
                            onClick={handleJoin}
                            disabled={loading || joinCode.length < 2}
                            className="bg-slate-700/50 hover:bg-purple-600 px-6 font-semibold text-white transition-colors disabled:opacity-50 disabled:hover:bg-slate-700/50"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
