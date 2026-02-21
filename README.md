# Draw-kenpon

Draw-kenpon is a fast-paced, strategic twist on the traditional game of Rock, Paper, Scissors. Instead of choosing from a predefined set of three options, players must draw an object they believe will defeat their opponent's choice. A drawing recognition system powered by Gemini detects the hand-drawn images, and Gemini acts as the ultimate judge to determine which object is stronger.

## Tech Stack
- Frontend: Vanilla HTML, CSS, and JavaScript.
- Backend: Python FastAPI and WebSockets.
- AI: Google Generative AI (Gemini Flash).

## How to Play / Run Locally

1. Ensure you have Python 3 installed.
2. Initialize your virtual environment and install dependencies:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install fastapi uvicorn websockets google-genai pydantic pillow
   ```
3. Set your Gemini API key in the environment:
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```
4. Start the backend server:
   ```bash
   python3 -m uvicorn main:app
   ```
5. Open your browser and navigate to `http://localhost:8000`. To play against someone else on your network, use the host machine's IP address.
6. Open two separate windows/tabs to simulate two players joining the game. Matchmaking is done automatically.