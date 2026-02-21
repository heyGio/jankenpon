# Doodle Duel
> The escalating creative arms race powered by AI.

A real-time multiplayer drawing game powered by Google's Gemini Vision and LLM models. Draw an object, beat the baseline, and don't escalate too fast!

## Prerequisites
- **Node.js**: v18 or newer
- **Gemini API Key**: Grab one from [Google AI Studio](https://aistudio.google.com/)

---

## 🚀 How to Run Locally

You'll need to run both the Backend (Node + Socket.IO) and the Frontend (Vite + React) at the same time.

### 1. Setup the Backend
Open a terminal and:
```bash
# Move into the backend folder
cd backend

# Install dependencies
npm install

# Create an env file and add your Gemini key
echo "GEMINI_API_KEY=your_actual_key_here" > .env

# Start the server (runs on http://localhost:3001)
npm start
```

### 2. Setup the Frontend
Open a **new** terminal window and:
```bash
# Move into the frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server (runs on http://localhost:5173)
npm run dev
```

### 3. Play the Game
- Open `http://localhost:5173` in two different browser windows or incognito tabs.
- On the first window, click **Create New Match**.
- Copy the Match Code from the top right.
- On the second window, paste the Code and click the Join button.
- Start drawing!

## Tech Stack
- **Backend:** Node.js, Express, Socket.IO, `@google/genai`
- **Frontend:** React, TypeScript, Vite, TailwindCSS v4, `react-signature-canvas`