# Game Design Document: Missile Command

| **Project Name** | Missile Command |
| --- | --- |
| **Genre** | Arcade Shoot 'em up / Defense |
| **Perspective** | 2D Fixed Screen (Side View) |
| **Players** | 1 or 2 (Alternating turns) |
| **Platform** | Arcade Cabinet (CRT Monitor) |
| **Input** | Optical Trackball + 3 Action Buttons |

---

## 1. Summary

Missile Command is a real-time tactical arcade shooter designed to simulate the high-stakes tension of ballistic missile defense. Capitalizing on the current Cold War zeitgeist, the game challenges players to protect six cities from relentless waves of nuclear attacks using three limited-ammo missile batteries.

The game differentiates itself from standard shooters through a unique trackball interface that allows for rapid, fluid targeting across the entire screen, and a resource-management mechanic that forces players to conserve ammunition. It is designed as an endurance challenge—there is no victory condition, only the goal of surviving as long as possible against increasing odds. This "inevitable defeat" loop drives intense emotional engagement and replayability (coin-drop) via high-score competition.

## 2. Gameplay Overview

**Missile Command** is a single-screen arcade game where the player assumes the role of a military commander in charge of defending six cities from incoming enemy nuclear attacks. The player controls a crosshair on the screen and launches defensive missiles from three ground-based batteries to intercept enemy warheads before they impact the cities or the batteries themselves.

### 2.1 Core Loop

1. **Wave Start:** A wave of enemy missiles descends from the top of the screen toward the player's cities and batteries.
2. **Defense:** The player moves the crosshair and fires defensive missiles to create explosions in the path of enemy fire.
3. **Survival:** If a city is hit, it is destroyed. If a battery is hit, it is disabled for the remainder of the level and all its ammo is lost.
4. **Wave End:** The wave ends when all enemy missiles are destroyed or have impacted.
5. **Score & Progression:** Bonus points are awarded for surviving cities and unused ammunition. The next wave begins with increased difficulty (speed, number of enemies).
6. **Game Over:** The game ends when all six cities are destroyed.

## 3. Game Mechanics

### 3.1 Controls

* **Trackball:** Controls the movement of the on-screen crosshair. Allows for fluid, analog positioning anywhere in the sky.
* **Fire Buttons (3):** Three distinct buttons, each corresponding to one of the three missile batteries (Alpha, Delta, Omega).
* **Left Button:** Fires from the Left Battery.
* **Center Button:** Fires from the Center Battery (Often faster travel time).
* **Right Button:** Fires from the Right Battery.

### 3.2 The Player's Arsenal (Anti-Ballistic Missiles)

* **Batteries:** There are three batteries: Left, Center, and Right.
* **Ammunition:** Each battery holds a limited number of missiles per wave (typically 10).
* **Firing Mechanism:** When a button is pressed, a missile launches from the corresponding battery toward the current crosshair position.
* **Explosion Radius:** Upon reaching the target coordinates, the missile detonates, creating a large, expanding circular fireball.
* **Duration:** The explosion lingers for a few seconds.
* **Effect:** Any enemy object touching the explosion (or the expanding ring) is destroyed.
* **Chain Reactions:** Explosions can destroy multiple enemies.

### 3.3 Enemy Units

* **Ballistic Missiles:** The primary threat. Lines descending from the top of the screen targeting cities or batteries. They can split into multiple warheads (MIRVs).
* **Bombers:** Planes that fly horizontally across the screen, dropping additional missiles.
* **Satellites:** Objects that traverse the upper sky, also dropping missiles.
* **Smart Bombs:** Special enemies that can evade explosions (they dodge defensive fire) and must be hit directly or caught in a fresh explosion.

### 3.4 Scoring System

Points are awarded for destroying enemies and efficient resource management. A multiplier typically applies (1x to 6x) based on the wave number.

| Action | Base Points |
| --- | --- |
| Destroy Enemy Missile | 25 |
| Destroy Bomber/Satellite | 100 |
| Destroy Smart Bomb | 125 |
| Unused Ammo (End of Wave) | 5 points per missile |
| Saved City (End of Wave) | 100 points per city |

* **Bonus City:** A destroyed city is rebuilt periodically upon reaching specific score thresholds (e.g., every 10,000 or 12,000 points, customizable by operator).

## 4. Level Design & Progression

### 4.1 The "World"

* **Single Screen:** The game takes place on a static screen.
* **Layout:**
* **Top:** Enemy spawn area (Sky).
* **Bottom:** Ground terrain.
* **Structures:** * **Left Battery** (Far Left)
* **City 1, City 2, City 3**
* **Center Battery** (Middle)
* **City 4, City 5, City 6**
* **Right Battery** (Far Right)

### 4.2 Difficulty Curve

The game is an endurance test; there is no "winning," only surviving longer. Difficulty increases via:

* **Speed:** Enemy missiles move faster.
* **Density:** More missiles appear on screen simultaneously.
* **Variety:** Introduction of planes, satellites, and smart bombs in later waves.
* **Color Palette:** The background color of the sky changes every few levels to indicate progression (e.g., Red, Blue, Yellow).

## 5. Audio & Visuals

### 5.1 Visual Style

* **Vector-like Raster Graphics:** Simple geometric lines and shapes.
* **Explosions:** Expanding solid circles of color.
* **Colors:** High contrast. Bright missile trails against a dark background (or colored sky).
* **Animation:** Smooth movement of trails. Flashing text for "GAME OVER" or "THE END".

### 5.2 Sound Effects

* **Launch:** A high-pitched "whoosh" or rising tone.
* **Explosion:** A deep, rumbling "boom" (often synthesized noise).
* **Siren/Alarm:** A distinctive klaxon sounds when ammo is low or a level starts.
* **Bonus Tally:** High-speed beeping as bonus points are counted.

## 6. Technical Specifications (Original Hardware)

* **CPU:** MOS Technology 6502 (approx 1 MHz)
* **Sound:** Pokey Chip (for sound generation and input handling)
* **Display:** Raster standard resolution (approx 256x231)
* **Input:** Optical Trackball

## 7. Unique Selling Points (USPs)

* **Trackball Precision:** Unlike joysticks, the trackball allows for rapid, precise targeting across the entire screen.
* **Resource Management:** Players must balance ammo usage; spamming fire leads to being defenseless at the end of a wave.
* **Defensive Gameplay:** Unlike most shooters where you invade or attack, here you are strictly defending a static position.
* **Cold War Anxiety:** The theme tapped directly into the zeitgeist of the era—the fear of Mutually Assured Destruction. The game ends with a bright flash and "THE END," symbolizing nuclear holocaust.