import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from game_logic import GameManager

app = FastAPI()

# Make sure public directory exists
os.makedirs("public", exist_ok=True)

app.mount("/static", StaticFiles(directory="public"), name="static")

game_manager = GameManager()

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

    async def broadcast_to_room(self, message: dict, room):
        for player_id in room.players:
            if player_id in self.active_connections:
                await self.active_connections[player_id].send_json(message)

manager = ConnectionManager()
player_rooms = {} # Maps player_id -> room_id

@app.get("/")
async def get_index():
    return FileResponse("public/index.html")

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data_str = await websocket.receive_text()
            try:
                data = json.loads(data_str)
            except json.JSONDecodeError:
                continue

            action = data.get("action")

            if action == "find_match":
                if game_manager.waiting_players:
                    opponent_id = game_manager.waiting_players.pop(0)
                    room = game_manager.create_room()
                    
                    room.add_player(opponent_id)
                    room.add_player(client_id)
                    
                    player_rooms[opponent_id] = room.room_id
                    player_rooms[client_id] = room.room_id
                    
                    # Notify both players game is starting
                    await manager.send_personal_message({"type": "match_found", "opponent": "Player 2", "player_num": 1}, opponent_id)
                    await manager.send_personal_message({"type": "match_found", "opponent": "Player 1", "player_num": 2}, client_id)
                    
                    # Start round shortly
                    await asyncio.sleep(1)
                    round_data = room.start_round()
                    await manager.broadcast_to_room(round_data, room)
                    
                    # Start 30s timer
                    asyncio.create_task(round_timer(room))
                    
                else:
                    game_manager.waiting_players.append(client_id)
                    await manager.send_personal_message({"type": "waiting_for_match"}, client_id)
            
            elif action == "submit":
                room_id = player_rooms.get(client_id)
                if room_id:
                    room = game_manager.get_room(room_id)
                    if room:
                        sub_type = data.get("type") # "draw" or "type" (Jolly)
                        payload = data.get("data")
                        
                        success = room.submit_action(client_id, sub_type, payload)
                        if success:
                            await manager.send_personal_message({"type": "submission_accepted"}, client_id)
                            
                            # If both submitted, end timer early
                            if room.all_submitted():
                                if room.round_timer_task:
                                    room.round_timer_task.cancel()
                                await resolve_round(room)

    except WebSocketDisconnect:
        manager.disconnect(client_id)
        if client_id in game_manager.waiting_players:
            game_manager.waiting_players.remove(client_id)
            
        room_id = player_rooms.get(client_id)
        if room_id:
            room = game_manager.get_room(room_id)
            if room:
                room.remove_player(client_id)
                opponent_id = room.get_opponent_id(client_id)
                if opponent_id:
                    await manager.send_personal_message({"type": "opponent_disconnected"}, opponent_id)
                game_manager.remove_room(room_id)
            del player_rooms[client_id]

async def round_timer(room):
    try:
        room.round_timer_task = asyncio.current_task()
        # 30 seconds for drawing
        for i in range(30, -1, -1):
            await asyncio.sleep(1)
            await manager.broadcast_to_room({"type": "tick", "time_left": i}, room)
            
        # Time's up
        await resolve_round(room)
    except asyncio.CancelledError:
        pass # Timer cancelled because both players submitted early

async def resolve_round(room):
    if room.state != "drawing":
        return
        
    await manager.broadcast_to_room({"type": "judging_started"}, room)
    
    # Evaluate
    result = await room.evaluate_round()
    
    # Send results
    await asyncio.sleep(1) # Dramatic pause
    await manager.broadcast_to_room(result, room)
    
    if not result.get("game_over"):
        # Next round starts after a delay
        await asyncio.sleep(5)
        new_round_data = room.start_round()
        await manager.broadcast_to_room(new_round_data, room)
        asyncio.create_task(round_timer(room))
    else:
        game_manager.remove_room(room.room_id)
