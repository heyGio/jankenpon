# Draw-kenpon — Game Abstract

**Draw-kenpon** is a real-time, two-player competitive web game that reimagines rock–paper–scissors as an **escalating creative arms race**. Instead of choosing from three fixed options, players **draw any object they can think of** on a shared canvas. Google's **Gemini Vision** AI identifies what each player drew, and a **Gemini LLM referee** judges which object is stronger. The strongest object becomes the new **baseline** that both players must beat in the next round — creating an ever-escalating chain of increasingly powerful concepts.

The twist: **winning too hard makes future rounds harder.** If you draw a black hole and win, the next baseline becomes "black hole" — and now *both* players need to think of something even stronger. This creates a fascinating **strategy-meets-creativity** loop where players must balance winning the current round against setting an impossible baseline for themselves.

Sessions are short (3–8 minutes), fast-paced (30 seconds per round), and designed for the energy of a party game with the depth of a mind game.

---

## 📜 Main Rules

| # | Rule | Description |
|---|------|-------------|
| 1 | **Escalation Baseline** | The strongest object seen so far becomes the baseline. All future submissions must be **stronger than the baseline** to be valid. |
| 2 | **Must Beat Baseline** | If only one player's object beats the baseline, they win. If both fail, it's a **tie**. |
| 3 | **No Repeats** | A match-wide history tracks all objects used. Submitting a previously used object (by either player) is an **automatic loss**. |
| 4 | **No Text** | If the AI detects written words/text in a drawing, that player **automatically loses** the round. Drawings must be visual, not labels. |
| 5 | **Tie Streak End** | **3 consecutive ties** immediately ends the match. The player with the most round wins takes the game. |
| 6 | **Jolly Comeback** | If a player loses **3 rounds in a row**, they unlock **2 turns** where they can **type** an object instead of drawing it — a lifeline for less artistic players. Typed entries must still follow all other rules. |

---

## ⚡ Round Flow (30 seconds)

1. The current baseline is displayed (e.g. *"Must Beat: Sword"*)
2. Both players draw simultaneously on side-by-side canvases
3. On submit, Gemini Vision classifies each drawing
4. The Gemini LLM referee validates rules and determines the winner
5. Scores, baseline, and history are updated
6. Next round auto-starts

The match winner is the player with the **most round wins** when the game ends.
