import { useState, useEffect } from 'react';
import { socket } from './socket';
import type { GameState, RoundResult } from './types';
import Lobby from './components/Lobby';
import Game from './components/Game';

import { Trophy, Home } from 'lucide-react';

function App() {
  const [matchCode, setMatchCode] = useState<string | null>(null);
  const [playerSlot, setPlayerSlot] = useState<'A' | 'B' | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [matchEndResult, setMatchEndResult] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState<string | null>(null);

  const resetToLobby = (reason?: string) => {
    socket.disconnect();
    setMatchCode(null);
    setPlayerSlot(null);
    setPlayerName(null);
    setGameState(null);
    setRoundResult(null);
    setMatchEndResult(null);
    if (reason) setCancelReason(reason);
  };

  useEffect(() => {
    socket.on('connect', () => console.log('Connected to server'));

    socket.on('state:update', (state: GameState) => {
      setGameState(state);
      // Only clear overlay on a completely new round (labels reset)
      if (!state.round.A_label && !state.round.B_label) {
        setRoundResult(null);
      }
    });

    socket.on('round:result', (result: RoundResult) => {
      setRoundResult(result);
    });

    socket.on('match:ended', (result: any) => {
      setMatchEndResult(result);
      setRoundResult(null); // clear overlay if any
    });

    socket.on('match:cancelled', (data: any) => {
      resetToLobby(data.reason || 'Match was cancelled.');
    });

    return () => {
      socket.off('connect');
      socket.off('state:update');
      socket.off('round:result');
      socket.off('match:ended');
      socket.off('match:cancelled');
    };
  }, []);

  const handleJoin = (code: string, slot: 'A' | 'B', name: string) => {
    setMatchCode(code);
    setPlayerSlot(slot);
    setPlayerName(name);
    socket.connect();
    socket.emit('join_room', { code, playerName: name });
  };

  const handleLeaveMatch = () => {
    if (matchCode) socket.emit('leave_match', { code: matchCode });
    resetToLobby();
  };

  if (!matchCode || !playerSlot || !playerName) {
    return (
      <div className="relative w-full h-full flex flex-col items-center">
        {cancelReason && (
          <div className="absolute top-4 z-50 bg-rose-500/90 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-rose-500/20 border border-rose-400 backdrop-blur-sm animate-in slide-in-from-top-4 fade-in duration-300 flex items-center gap-2">
            <span>⚠️</span> {cancelReason}
            <button onClick={() => setCancelReason(null)} className="ml-4 opacity-70 hover:opacity-100">×</button>
          </div>
        )}
        <Lobby onJoin={handleJoin} />
      </div>
    );
  }

  const isWaiting = gameState?.status === 'waiting';
  const opSlot = playerSlot === 'A' ? 'B' : 'A';
  const opJoined = !!gameState?.players[opSlot];

  const handleStartMatch = () => {
    socket.emit('start_match', { code: matchCode });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[100px] pointer-events-none" />

      <header className="w-full max-w-5xl flex justify-between items-center p-6 z-10">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-sm">
          Doodle Duel
        </h1>
        <div className="glass-panel px-4 py-2 flex items-center gap-3">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">Match</span>
          <span className="font-mono text-lg font-bold text-white">{matchCode}</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl px-6 pb-10 z-10 flex flex-col justify-center">
        {matchEndResult && gameState ? (
          <div className="flex flex-col items-center justify-center p-12 glass-panel max-w-2xl mx-auto w-full animate-in fade-in zoom-in duration-500">
            <Trophy className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            <h2 className="text-5xl font-black text-white mb-2 tracking-tight">Match Over!</h2>
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-8">
              {matchEndResult.winner === 'tie' ? "It's a Tie Match!" : `${gameState.names[matchEndResult.winner as 'A' | 'B']} Wins!`}
            </h3>

            <div className="grid grid-cols-2 gap-8 w-full mb-10 bg-black/20 p-6 rounded-2xl border border-white/5">
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-bold text-indigo-300 uppercase tracking-widest">{gameState.names.A}</span>
                <span className="text-5xl font-black text-white">{matchEndResult.finalScores.A}</span>
                <span className="text-xs text-slate-500 uppercase font-semibold">Wins</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-bold text-pink-300 uppercase tracking-widest">{gameState.names.B}</span>
                <span className="text-5xl font-black text-white">{matchEndResult.finalScores.B}</span>
                <span className="text-xs text-slate-500 uppercase font-semibold">Wins</span>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold tracking-wide transition-all border border-slate-600/50"
            >
              <Home className="w-5 h-5" /> Return to Lobby
            </button>
          </div>
        ) : gameState && !isWaiting ? (
          <Game
            gameState={gameState}
            playerSlot={playerSlot}
            matchCode={matchCode}
            roundResult={roundResult}
            onLeaveMatch={handleLeaveMatch}
          />
        ) : gameState && isWaiting ? (
          <div className="flex flex-col items-center justify-center p-12 glass-panel max-w-xl mx-auto w-full animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-white mb-6">Waiting Room</h2>

            <div className="grid grid-cols-2 gap-8 w-full mb-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-black text-indigo-400">A</span>
                </div>
                <span className="font-bold text-lg text-white">{gameState.names.A || 'Waiting...'}</span>
                {playerSlot === 'A' && <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded">You (Host)</span>}
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-pink-500/20 border border-pink-500/50 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-black text-pink-400">B</span>
                </div>
                <span className="font-bold text-lg text-white">{gameState.names.B || 'Waiting...'}</span>
                {playerSlot === 'B' && <span className="text-xs font-bold text-pink-400 uppercase tracking-widest bg-pink-500/10 px-2 py-1 rounded">You</span>}
              </div>
            </div>

            {playerSlot === 'A' ? (
              <button
                onClick={handleStartMatch}
                disabled={!opJoined}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold tracking-wide shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {opJoined ? 'Start Match' : 'Waiting for opponent...'}
              </button>
            ) : (
              <div className="text-center text-slate-400 font-medium">
                {opJoined ? 'Waiting for Host to start match...' : 'Waiting for opponent...'}
              </div>
            )}

            <button onClick={handleLeaveMatch} className="mt-8 text-slate-400 hover:text-rose-400 font-medium text-sm transition-colors underline decoration-slate-600 hover:decoration-rose-400">
              Leave Match
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 glass-panel max-w-sm mx-auto w-full">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-slate-300">Syncing with server...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
