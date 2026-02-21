export interface GameState {
    status: 'waiting' | 'playing' | 'ended';
    baseline: string | null;
    history: string[];
    scores: { A: number; B: number };
    streaks: { A_losses: number; B_losses: number; ties: number };
    jolly: { A_typed_turns: number; B_typed_turns: number };
    round: { timer_ms: number; A_label: any; B_label: any; ready: { A: boolean; B: boolean } };
    players: { A: string | null; B: string | null };
    names: { A: string | null; B: string | null };
}

export interface RoundResult {
    A_label: string;
    B_label: string;
    winner: 'A' | 'B' | 'tie';
    reason: string;
    new_baseline: string;
}

export interface MatchEndResult {
    winner: 'A' | 'B' | 'tie';
    finalScores: { A: number; B: number };
}
