# Game Design Document: Doodle Duel — The Escalation Game (Node.js Stack)

| **Project Name** | Doodle Duel |
|------------------|------------|
| **Genre** | Competitive party / strategy / mind game |
| **Players** | 2 human players only |
| **Platform** | Web (desktop-first; tablet optional) |
| **Session Length** | 3–8 minutes |
| **Input** | Mouse / trackpad / touchscreen drawing canvas |
| **Core Tech** | Node.js backend + Gemini API (Vision + LLM adjudication) |
| **Round Time** | 30 seconds per round |
| **Dev Scope** | Hackathon-ready (~5h MVP feasible) |

---

## 1. Game Summary

**Doodle Duel** reinvents rock–paper–scissors as an escalating creative arms race.

Each round:
- Both players **draw any object**.
- **Gemini Vision** classifies each drawing.
- A **Gemini LLM referee** decides which object is stronger.
- The strongest object becomes the new **baseline**.

The twist: winning too hard makes future rounds harder.

---

## 2. Core Gameplay Loop

### 2.1 Round Flow

1. Display current **Baseline Object**
2. Start **30-second timer**
3. Both players draw simultaneously
4. On submit:
   - Canvas → PNG (client-side)
   - Send base64 PNG to Node backend
   - Gemini classifies each image (Vision)
   - Validate rules (text / repeats / baseline)
5. Gemini referee decides winner
6. Update:
   - Scores
   - Baseline
   - History
   - Streak counters
7. Auto-start next round

---

## 3. Win Conditions

The match ends when:
- **3 ties in a row**, OR
- Optional: max round cap (e.g., 10 rounds)

Winner = player with most round wins.

---

## 4. Core Rules

### 4.1 Escalation Baseline
- Track a single **Baseline Object**.
- The strongest object that has appeared becomes the new baseline.
- Future entries must be **stronger than baseline** to compete.

Starting baseline:
- `rock`, or `null` (first round sets it)

---

### 4.2 Must Beat Baseline
- If one entry beats baseline and the other does not → valid one wins.
- If both fail baseline → tie.

---

### 4.3 No Repeats
- Maintain a match history of normalized object labels.
- If a player submits an object already used (by either player) → they lose the round.
- If both repeat → tie.

---

### 4.4 No Text Rule
- If text is detected in a drawing → that player loses the round.
- If both contain text → tie.

> Implementation note: text detection is ideally returned by Gemini classifier as `contains_text`.

---

### 4.5 Tie Streak
- 3 ties in a row ends the match immediately.

---

### 4.6 Jolly Comeback Mechanic
If a player loses **3 rounds in a row**:
- They unlock **2 turns** where they may **type** the object instead of drawing.
- Typed entries must still:
  - Beat baseline
  - Not repeat history

---

## 5. Tech Stack (Node.js-first)

### 5.1 Backend (Must-Have)
- **Node.js** (v18+ recommended)
- **Express** for HTTP endpoints
- **WebSocket** (Socket.IO recommended) for real-time round state sync
- Gemini API calls made server-side (API key protected)
- In-memory state store for hackathon MVP (upgradeable to Redis)

Suggested packages:
- `express`
- `socket.io`
- `dotenv`
- `zod` (or `ajv`) for strict JSON validation of Gemini outputs
- `nanoid` for match codes

### 5.2 Frontend (Quick Testing)
- Minimal: **Vite + Vanilla JS**
- Or: **Next.js** (Node-friendly, but heavier)
- Canvas drawing library optional:
  - Bare HTML canvas is fine
  - Or `perfect-freehand` for nice strokes

### 5.3 Deployment (Optional)
- Local only for demo, or:
  - Render / Fly.io / Railway (quick Node deploy)

---

## 6. System Architecture

### 6.1 Overview

Client (browser):
- Draw on canvas
- Submit drawing (base64 PNG)
- Receive round results and state via WebSocket

Server (Node):
- Owns match state and rule enforcement
- Calls Gemini:
  1) classify doodles → labels + text flag
  2) adjudicate strength → winner + strongest object
- Broadcasts results to both players

---

## 7. Gemini Integration

### 7.1 Recognition (Gemini Vision)

#### Input
- 512×512 PNG (base64)
- Classification prompt

#### Output JSON (strict)
```json
{
  "label": "nuclear bomb",
  "confidence": 0.87,
  "alternatives": ["missile", "explosion"],
  "contains_text": false
}
```

#### Classification Prompt (JSON-only)
System instruction:
> You are a doodle classifier for a competitive party game. Return ONLY valid JSON.

User instruction:
> Identify the single most likely object drawn in this image.
> Use 1–3 words. Prefer common nouns.
> No adjectives unless essential.
> If unclear, return "unknown".
> Also indicate whether written text appears in the drawing.

---

### 7.2 Referee (Gemini LLM)

#### Input
- baseline_object
- playerA_object, playerB_object
- history_objects
- short rules

#### Output JSON (strict)
```json
{
  "winner": "A",
  "reason": "A black hole overwhelms a nuclear bomb.",
  "strongest_object": "black hole"
}
```

Referee must enforce:
1. Text violation
2. Repeat violation
3. Baseline rule
4. Strength comparison

Responses must be short and deterministic.

---

## 8. Normalization

After receiving label:
- Lowercase
- Trim whitespace
- Strip punctuation
- Singularize simple plurals
- Alias map (handwritten table)

Examples:
- `nuke` → `nuclear bomb`
- `blackhole` → `black hole`
- `bombs` → `bomb`

---

## 9. Server Rule Engine (Source of Truth)

The Node server decides outcomes; clients are “dumb terminals”.

### 9.1 Validation Order
1. Text violation
2. Repeat violation
3. Baseline check
4. Strength comparison (Gemini referee)

If both fail the same rule → tie.

---

## 10. Data Structures

```ts
baseline: string | null
history: string[]
scores: { A: number, B: number }
streaks: { A_losses: number, B_losses: number, ties: number }
jolly: { A_typed_turns: number, B_typed_turns: number }
round: { timer_ms: number, A_label: string, B_label: string }
```

---

## 11. API / Events (MVP)

### 11.1 HTTP Endpoints
- `POST /api/match/create` → returns match code
- `POST /api/match/:code/join` → returns player slot (A/B)
- `POST /api/match/:code/submit` → submit doodle or typed object

### 11.2 WebSocket Events (Socket.IO)
Server → clients:
- `state:update` (baseline, score, history, timer, jolly)
- `round:result` (A_label, B_label, winner, reason, new_baseline)

Clients → server:
- `round:submit` (playerId, pngBase64 OR typedText)

---

## 12. UI Requirements

Main screen:
- Two canvases side-by-side
- Timer
- Baseline (“Must beat: ___”)
- Scoreboard
- Tie streak
- History chips

Result overlay (≤3 seconds):
- Both labels
- Winner
- One-line reason
- Baseline update
- Auto-advance

---

## 13. Error Handling

### Gemini Failure
If:
- Rate limit
- Timeout
- Invalid JSON
- Low confidence

Fallback:
- Use `"unknown"` label
- If both unknown → tie
- If one unknown and the other valid → unknown generally loses (unless baseline rule forces tie)

---

## 14. MVP Scope (5-Hour Crunch)

Must ship:
- Node + Express + Socket.IO server
- Two-player room creation/join
- Drawing canvas + submit
- Gemini classification
- Gemini referee decision
- Baseline + no repeats + tie streak + scoring
- Jolly typed turns

Optional:
- Better stroke smoothing
- Animations + sounds
- Appeal once per match (choose from top-3 alternatives)

---

## 15. Design Philosophy

This is:
- A strategy game
- A mind game
- A creativity arms race

Players must:
- Win without escalating too fast
- Predict opponent psychology
- Avoid impossible baselines

AI opponent is intentionally disallowed.

---

# End of Requirements Document
