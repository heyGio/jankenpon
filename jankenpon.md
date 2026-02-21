# Game Design Document: Draw-kenpon (Working Title)

| **Project Name** | Draw-kenpon |
| --- | --- |
| **Genre** | Strategy / Party / Drawing Game |
| **Perspective** | 2D UI / Separate Devices (Hidden Canvas) |
| **Players** | 1 or 2 (Against AI or Human) |
| **Platform** | Web / Mobile (Touchscreen or Mouse) |
| **Input** | Drawing (Touch/Mouse) + Keyboard (for Jolly mechanic) |

---

## 1. Summary

Draw-kenpon is a fast-paced, strategic twist on the traditional game of Rock, Paper, Scissors. Instead of choosing from a predefined set of three options, players must draw an object they believe will defeat their opponent's choice. A drawing recognition system powered by the Gemini Developer API detects the hand-drawn images (and optionally uses Google's state-of-the-art models like Imagen and Veo to render a polished version or animation of them). An LLM (Large Language Model) acts as the ultimate judge, determining which of the two objects is stronger and declaring the winner of the round. 

It is a mind game of escalation—players must draw something strong enough to win, but must be careful not to draw something so powerful that they cannot surpass it in future rounds. The strongest object played sets a new baseline power level for the rest of the match.

## 2. Gameplay Overview

The game can be played either 1vs1 against another human, or 1vsBOT against an AI opponent. In both modes, players face off in a series of rapid-fire drawing rounds, trying to outsmart their opponent.

### 2.1 Core Loop

1. **Draw Phase:** Both players have exactly 30 seconds to draw an object on their respective digital canvases.
2. **Recognition:** A drawing recognition system utilizing the Gemini Developer API recognizes what was drawn by both players and detects if any text was written.
3. **Reveal & Judging Phase:** Both screens update to reveal the two recognized objects simultaneously to both players. An LLM evaluates them, announces which of the two is stronger, and provides a brief explanation for its judgment.
4. **New Baseline:** The winning (strongest) object becomes the new "baseline" power level for both players in all subsequent rounds. 
5. **Next Round:** Players must now draw something stronger than the newly established baseline.
6. **Match End:** The game ends either after a set number of rounds or early due to a stalemate. The player who won the most rounds is declared the overall winner.

## 3. Game Mechanics

### 3.1 The Escalation Rule (The Baseline)
* The strongest object played in any round sets the baseline power level for the entire match going forward.
* *Example:* If Player A draws a sword and Player B draws a tank, the tank wins the round. The tank is now the new baseline. In the next round, both players must draw something that could defeat a tank. If someone draws a Black Hole, all future drawings must surpass a Black Hole.

### 3.2 Constraints & Penalties
* **No Repeats:** A player cannot draw an object that has already been played in the current match. If a player draws a duplicate object, they automatically lose that round.
* **No Text Allowed:** If a player writes words or text on their drawing to explicitly state what it is, they are penalized and automatically lose that round.
* **Time Pressure:** The 30-second time limit per round is strict to force players into quick, high-pressure decisions.

### 3.3 Ties & Game Over
* If both players fail to come up with an object that is stronger than the current baseline (either by drawing something weaker or failing to draw something recognizable), the round is declared a tie.
* If there are **3 ties in a row**, the match ends immediately.

### 3.4 The Jolly Mechanic (Comeback System)
* If a player is struggling and loses **3 rounds in a row**, they are granted a "Jolly".
* **Jolly:** For the next 2 turns, the losing player gets to *type* the name of their object instead of having to draw it. This ensures perfect recognition and allows them to execute complex or abstract concepts to get back into the game without the risk of drawing failure.

## 4. Strategy & Metagame

Draw-kenpon is as much about resource management and psychology as it is about drawing skills.
* **Pacing Power:** If you draw a Universe-destroying entity in Round 1, neither you nor your opponent will be able to top it in Round 2, leading to consecutive ties and an early game over. Players must play objects that are *just strong enough* to beat their opponent's likely draw, saving their most powerful ideas for later rounds.
* **Mind Games:** Deducing what your opponent will draw based on the current baseline, and drawing the absolute weakest thing that can still counter it.

## 5. Audio & Visuals

* **UI/UX:** Players play on separate devices (e.g., two smartphones or two browser windows on different computers). They cannot see each other's canvas during the drawing phase to preserve the element of surprise and mind games. A highly visible ticking timer is centralized on both screens to build tension.
* **Visuals:** Fast, competitive arcade aesthetics. When the objects are recognized, Google's state-of-the-art models like Imagen and Veo could generate a cool high-quality image or short animation of the recognized object clashing with the opponent's.
* **Audio:** Fast-paced, ticking-clock music during the 30-second draw phase. A dramatic impact sound during the LLM judging phase, followed by a clear announcement of the winner.

## 6. Technical Specifications

* **Drawing Canvas:** HTML5 Canvas or similar technology for fluid, responsive drawing.
* **Drawing Recognition AI:** The Gemini Developer API is used to classify the sketches and detect any written text in real-time.
* **Generative Visuals:** Google's state-of-the-art models like Imagen and Veo are used to render high-quality images or animations of the drawn concepts.
* **Judge LLM:** A prompt-engineered LLM acting as an impartial judge to compare two concepts and evaluate them against the match baseline.
* **Multiplayer Sync:** WebSockets for real-time matchmaking and syncing the 30-second global timer.

## 7. Unique Selling Points (USPs)

* **LLM as Game Mechanic:** Using an LLM not as a chatbot, but as a core physics/logic engine and referee.
* **The Escalation Problem:** A strategic layer where winning too hard punishes you in the long run.
* **Time Pressure:** The strict 30-second limit forces panicked drawings and snap strategic judgments.
