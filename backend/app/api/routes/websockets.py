from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps activity_id to a list of connected WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, activity_id: str):
        await websocket.accept()
        if activity_id not in self.active_connections:
            self.active_connections[activity_id] = []
        self.active_connections[activity_id].append(websocket)
        logger.info(f"Client connected to activity {activity_id}. Total clients: {len(self.active_connections[activity_id])}")

    def disconnect(self, websocket: WebSocket, activity_id: str):
        if activity_id in self.active_connections:
            if websocket in self.active_connections[activity_id]:
                self.active_connections[activity_id].remove(websocket)
            if len(self.active_connections[activity_id]) == 0:
                del self.active_connections[activity_id]

    async def broadcast(self, message: dict, activity_id: str):
        if activity_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[activity_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {activity_id}: {e}")
                    dead_connections.append(connection)
            
            for dead in dead_connections:
                self.disconnect(dead, activity_id)

manager = ConnectionManager()

@router.websocket("/session/{activity_id}")
async def websocket_endpoint(websocket: WebSocket, activity_id: str):
    await manager.connect(websocket, activity_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                # We expect JSON messages like {"type": "STATE_CHANGE", "payload": "logging"}
                message = json.loads(data)
                # Broadcast the message to everyone else in this activity session
                await manager.broadcast(message, activity_id)
            except json.JSONDecodeError:
                logger.error(f"Received non-JSON message on WS: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, activity_id)
        logger.info(f"Client disconnected from activity {activity_id}")
