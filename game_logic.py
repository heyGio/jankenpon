import asyncio
import json
import uuid
from typing import Dict, List
from ai_service import evaluate_drawings

class GameRoom:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.players: Dict[str, dict] = {} # socket_id -> player_info
        self.state = "waiting" # waiting, drawing, judging, game_over
        self.round = 1
        self.baseline = None
        self.p1_id = None
        self.p2_id = None
        self.submissions = {} # socket_id -> submission
        self.ties_in_a_row = 0
        self.round_timer_task = None

    def add_player(self, socket_id: str):
        if len(self.players) >= 2:
            return False
            
        is_p1 = len(self.players) == 0
        
        self.players[socket_id] = {
            "id": socket_id,
            "score": 0,
            "consecutive_losses": 0,
            "has_jolly": False,
            "jolly_turns_left": 0,
            "player_num": 1 if is_p1 else 2
        }
        
        if is_p1:
            self.p1_id = socket_id
        else:
            self.p2_id = socket_id
            
        return True

    def remove_player(self, socket_id: str):
        if socket_id in self.players:
            del self.players[socket_id]
            
    def get_opponent_id(self, socket_id: str):
        for pid in self.players:
            if pid != socket_id:
                return pid
        return None

    def start_round(self):
        self.state = "drawing"
        self.submissions = {}
        # Update jolly status
        for p in self.players.values():
            if p["jolly_turns_left"] > 0:
                p["jolly_turns_left"] -= 1
            if p["jolly_turns_left"] == 0:
                p["has_jolly"] = False
                
        return {
            "type": "round_start",
            "round": self.round,
            "baseline": self.baseline
        }

    def submit_action(self, socket_id: str, action_type: str, data: str):
        if self.state != "drawing":
            return False
            
        self.submissions[socket_id] = {
            "type": action_type,
            "data": data
        }
        return True

    def all_submitted(self):
        return len(self.submissions) == 2

    async def evaluate_round(self):
        self.state = "judging"
        
        # Determine who is who for the AI prompt
        p1_sub = self.submissions.get(self.p1_id, {"type": "draw", "data": ""})
        p2_sub = self.submissions.get(self.p2_id, {"type": "draw", "data": ""})
        
        # Call Gemini
        judgment = await evaluate_drawings(self.baseline, p1_sub, p2_sub)
        
        # Process results
        winner_num = judgment.get("winner") # "p1", "p2", or "tie"
        
        # Reset loss streaks for winner, increment for loser
        if winner_num == "p1":
            self.players[self.p1_id]["score"] += 1
            self.players[self.p1_id]["consecutive_losses"] = 0
            self.players[self.p2_id]["consecutive_losses"] += 1
            self.ties_in_a_row = 0
            self.baseline = judgment.get("new_baseline")
        elif winner_num == "p2":
            self.players[self.p2_id]["score"] += 1
            self.players[self.p2_id]["consecutive_losses"] = 0
            self.players[self.p1_id]["consecutive_losses"] += 1
            self.ties_in_a_row = 0
            self.baseline = judgment.get("new_baseline")
        else:
            self.ties_in_a_row += 1
            self.players[self.p1_id]["consecutive_losses"] = 0
            self.players[self.p2_id]["consecutive_losses"] = 0
            
        # Check Jolly mechanic (3 consecutive losses -> get 2 turns of Jolly)
        for pid, player in self.players.items():
            if player["consecutive_losses"] >= 3:
                player["has_jolly"] = True
                player["jolly_turns_left"] = 2
                player["consecutive_losses"] = 0 # reset tracking
                
        # Check game over conditions
        game_over = False
        winner_id = None
        
        if self.ties_in_a_row >= 3:
            game_over = True
            # Highest score wins, or true tie
            p1_score = self.players[self.p1_id]["score"]
            p2_score = self.players[self.p2_id]["score"]
            if p1_score > p2_score:
                winner_id = self.p1_id
            elif p2_score > p1_score:
                winner_id = self.p2_id
                
        elif self.players[self.p1_id]["score"] >= 3: # First to 3 wins for example? Game rules say "highest score wins or first to X"
            game_over = True
            winner_id = self.p1_id
        elif self.players[self.p2_id]["score"] >= 3:
            game_over = True
            winner_id = self.p2_id
            
        if game_over:
            self.state = "game_over"
            
        self.round += 1
        
        return {
            "type": "round_result",
            "judgment": judgment,
            "p1_score": self.players[self.p1_id]["score"],
            "p2_score": self.players[self.p2_id]["score"],
            "p1_jolly": self.players[self.p1_id]["has_jolly"],
            "p2_jolly": self.players[self.p2_id]["has_jolly"],
            "game_over": game_over,
            "winner_id": winner_id,
            "ties_in_a_row": self.ties_in_a_row
        }

class GameManager:
    def __init__(self):
        self.rooms: Dict[str, GameRoom] = {}
        self.waiting_players: List[str] = [] # list of socket ids

    def create_room(self) -> GameRoom:
        room_id = str(uuid.uuid4())
        room = GameRoom(room_id)
        self.rooms[room_id] = room
        return room

    def get_room(self, room_id: str) -> GameRoom:
        return self.rooms.get(room_id)

    def remove_room(self, room_id: str):
        if room_id in self.rooms:
            del self.rooms[room_id]
