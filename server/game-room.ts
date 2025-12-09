import type * as Party from "partykit/server";

// Game state interface
interface Player {
  id: string;           // Persistent player ID (from client)
  connectionId: string; // Current WebSocket connection ID
  nickname: string;
  avatar: string;
  isHost: boolean;
  isConnected: boolean;
  joinedAt: number;
}

interface GameSettings {
  timerSeconds: number | null;
  shuffleEnabled: boolean;
  allowSkip: boolean;
  hostOnlyControls: boolean;
}

interface GameState {
  gameCode: string;
  packId: string | null;
  packName: string | null;
  players: Map<string, Player>; // Keyed by persistent player ID
  connectionToPlayer: Map<string, string>; // connectionId -> playerId mapping
  currentCardIndex: number;
  shuffledQuestions: string[];
  settings: GameSettings;
  status: "lobby" | "playing" | "finished";
  hostId: string | null; // Persistent player ID of host
  createdAt: number;
}

// Message types
type ClientMessage =
  | { type: "join"; playerId: string; nickname: string; avatar?: string }
  | { type: "select-pack"; packId: string; packName: string; questions: string[] }
  | { type: "update-settings"; settings: Partial<GameSettings> }
  | { type: "start-game" }
  | { type: "next-card" }
  | { type: "prev-card" }
  | { type: "shuffle" }
  | { type: "end-game" }
  | { type: "kick-player"; playerId: string }
  | { type: "sync-request" };

type ServerMessage =
  | { type: "state-sync"; state: SerializedGameState; yourPlayerId: string }
  | { type: "player-joined"; player: Player }
  | { type: "player-left"; playerId: string }
  | { type: "game-started" }
  | { type: "card-changed"; index: number }
  | { type: "game-ended" }
  | { type: "error"; message: string }
  | { type: "you-were-kicked" };

// Serialized version of game state (Map -> Array for JSON)
interface SerializedGameState {
  gameCode: string;
  packId: string | null;
  packName: string | null;
  players: Player[];
  currentCardIndex: number;
  shuffledQuestions: string[];
  settings: GameSettings;
  status: "lobby" | "playing" | "finished";
  hostId: string | null;
  playerCount: number;
}

// Avatar emojis for random assignment
const AVATARS = ["🦩", "🦜", "🦚", "🦢", "🐧", "🦆", "🦅", "🦉", "🐦", "🐤", "🦋", "🐝", "🌸", "🌺", "🌻", "🌼", "🍀", "🌈", "⭐", "🌙"];

export default class GameRoom implements Party.Server {
  state: GameState;

  constructor(readonly room: Party.Room) {
    this.state = {
      gameCode: room.id,
      packId: null,
      packName: null,
      players: new Map(),
      connectionToPlayer: new Map(),
      currentCardIndex: 0,
      shuffledQuestions: [],
      settings: {
        timerSeconds: null,
        shuffleEnabled: true,
        allowSkip: true,
        hostOnlyControls: true,
      },
      status: "lobby",
      hostId: null,
      createdAt: Date.now(),
    };
  }

  // Get player ID from connection
  getPlayerId(connectionId: string): string | undefined {
    return this.state.connectionToPlayer.get(connectionId);
  }

  // Serialize state for sending to clients
  serializeState(): SerializedGameState {
    return {
      gameCode: this.state.gameCode,
      packId: this.state.packId,
      packName: this.state.packName,
      players: Array.from(this.state.players.values()),
      currentCardIndex: this.state.currentCardIndex,
      shuffledQuestions: this.state.shuffledQuestions,
      settings: this.state.settings,
      status: this.state.status,
      hostId: this.state.hostId,
      playerCount: this.state.players.size,
    };
  }

  // Broadcast to all connected clients
  broadcast(message: ServerMessage, excludePlayerIds?: string[]) {
    const data = JSON.stringify(message);
    for (const [playerId, player] of this.state.players) {
      if (player.isConnected && (!excludePlayerIds || !excludePlayerIds.includes(playerId))) {
        this.room.getConnection(player.connectionId)?.send(data);
      }
    }
  }

  // Send to a single player by player ID
  sendToPlayer(playerId: string, message: ServerMessage) {
    const player = this.state.players.get(playerId);
    if (player && player.isConnected) {
      this.room.getConnection(player.connectionId)?.send(JSON.stringify(message));
    }
  }

  // Send to a connection directly
  sendToConnection(connectionId: string, message: ServerMessage) {
    this.room.getConnection(connectionId)?.send(JSON.stringify(message));
  }

  // Check if player is host
  isHost(playerId: string): boolean {
    return this.state.hostId === playerId;
  }

  // Assign a new host if current host leaves
  reassignHost() {
    const connectedPlayers = Array.from(this.state.players.entries()).filter(
      ([_, p]) => p.isConnected
    );
    if (connectedPlayers.length > 0) {
      const [newHostId, newHost] = connectedPlayers[0];
      this.state.hostId = newHostId;
      newHost.isHost = true;
      // Update old host status
      for (const [id, player] of this.state.players) {
        if (id !== newHostId) {
          player.isHost = false;
        }
      }
    }
  }

  // Shuffle array
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Handle new connection
  onConnect(connection: Party.Connection) {
    console.log(`[${this.state.gameCode}] Connection: ${connection.id}`);
    // Don't add to players yet - wait for "join" message with playerId
  }

  // Handle disconnection
  onClose(connection: Party.Connection) {
    const playerId = this.getPlayerId(connection.id);
    if (!playerId) return;

    const player = this.state.players.get(playerId);
    if (player) {
      player.isConnected = false;
      this.state.connectionToPlayer.delete(connection.id);
      console.log(`[${this.state.gameCode}] Disconnected: ${player.nickname}`);

      // Notify others
      this.broadcast({ type: "player-left", playerId });

      // Reassign host if needed
      if (this.isHost(playerId)) {
        this.reassignHost();
        // Broadcast updated state with new host
        this.broadcast({ type: "state-sync", state: this.serializeState(), yourPlayerId: "" });
      }

      // Clean up player after timeout (allow reconnection)
      setTimeout(() => {
        const p = this.state.players.get(playerId);
        if (p && !p.isConnected) {
          this.state.players.delete(playerId);
          this.broadcast({ type: "state-sync", state: this.serializeState(), yourPlayerId: "" });
        }
      }, 60000); // 60 second grace period for navigation
    }
  }

  // Handle incoming messages
  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message) as ClientMessage;
      const playerId = data.type === "join" ? data.playerId : this.getPlayerId(sender.id);

      switch (data.type) {
        case "join":
          this.handleJoin(sender, data.playerId, data.nickname, data.avatar);
          break;

        case "select-pack":
          console.log(`[${this.state.gameCode}] Received select-pack from ${playerId}. Is host? ${playerId && this.isHost(playerId)}`);
          if (playerId && this.isHost(playerId) && (this.state.status === "lobby" || this.state.status === "finished")) {
            this.state.packId = data.packId;
            this.state.packName = data.packName;
            this.state.shuffledQuestions = this.state.settings.shuffleEnabled
              ? this.shuffleArray(data.questions)
              : data.questions;
            // Reset to lobby status so we can see the "Start Game" button again if we were finished
            this.state.status = "lobby";
            this.broadcast({ type: "state-sync", state: this.serializeState(), yourPlayerId: "" });
          } else {
            console.log(`[${this.state.gameCode}] Rejected select-pack: playerId=${playerId}, isHost=${playerId && this.isHost(playerId)}, status=${this.state.status}`);
          }
          break;

        case "update-settings":
          if (playerId && this.isHost(playerId) && (this.state.status === "lobby" || this.state.status === "finished")) {
            this.state.settings = { ...this.state.settings, ...data.settings };
            // Reset to lobby status if we were finished
            this.state.status = "lobby";
            this.broadcast({ type: "state-sync", state: this.serializeState(), yourPlayerId: "" });
          }
          break;

        case "start-game":
          if (playerId && this.isHost(playerId) && (this.state.status === "lobby" || this.state.status === "finished") && this.state.packId) {
            this.state.status = "playing";
            this.state.currentCardIndex = 0;
            // Reshuffle if needed when restarting
            if (this.state.settings.shuffleEnabled) {
               this.state.shuffledQuestions = this.shuffleArray(this.state.shuffledQuestions);
            }
            this.broadcast({ type: "game-started" });
            this.broadcast({ type: "state-sync", state: this.serializeState(), yourPlayerId: "" });
          }
          break;

        case "next-card":
          if (playerId && this.canControl(playerId) && this.state.status === "playing") {
            if (this.state.currentCardIndex < this.state.shuffledQuestions.length - 1) {
              this.state.currentCardIndex++;
              this.broadcast({ type: "card-changed", index: this.state.currentCardIndex });
            }
          }
          break;

        case "prev-card":
          if (playerId && this.canControl(playerId) && this.state.status === "playing") {
            if (this.state.currentCardIndex > 0) {
              this.state.currentCardIndex--;
              this.broadcast({ type: "card-changed", index: this.state.currentCardIndex });
            }
          }
          break;

        case "shuffle":
          if (playerId && this.canControl(playerId) && this.state.status === "playing") {
            this.state.shuffledQuestions = this.shuffleArray(this.state.shuffledQuestions);
            this.state.currentCardIndex = 0;
            this.broadcast({ type: "state-sync", state: this.serializeState(), yourPlayerId: "" });
          }
          break;

        case "end-game":
          if (playerId && this.isHost(playerId)) {
            this.state.status = "finished";
            this.broadcast({ type: "game-ended" });
            this.broadcast({ type: "state-sync", state: this.serializeState(), yourPlayerId: "" });
          }
          break;

        case "kick-player":
          if (playerId && this.isHost(playerId) && data.playerId !== playerId) {
            const kickedPlayer = this.state.players.get(data.playerId);
            if (kickedPlayer) {
              this.sendToPlayer(data.playerId, { type: "you-were-kicked" });
              this.state.players.delete(data.playerId);
              if (kickedPlayer.isConnected) {
                this.state.connectionToPlayer.delete(kickedPlayer.connectionId);
                this.room.getConnection(kickedPlayer.connectionId)?.close();
              }
              this.broadcast({ type: "state-sync", state: this.serializeState(), yourPlayerId: "" });
            }
          }
          break;

        case "sync-request":
          if (playerId) {
            this.sendToConnection(sender.id, { type: "state-sync", state: this.serializeState(), yourPlayerId: playerId });
          }
          break;
      }
    } catch (e) {
      console.error(`[${this.state.gameCode}] Message error:`, e);
      this.sendToConnection(sender.id, { type: "error", message: "Invalid message format" });
    }
  }

  // Check if player can control the game
  canControl(playerId: string): boolean {
    if (!this.state.settings.hostOnlyControls) return true;
    return this.isHost(playerId);
  }

  // Handle player joining
  handleJoin(connection: Party.Connection, playerId: string, nickname: string, avatar?: string) {
    // Check if reconnecting (same playerId, new connectionId)
    const existingPlayer = this.state.players.get(playerId);
    if (existingPlayer) {
      // Reconnecting - update connection mapping
      if (existingPlayer.connectionId !== connection.id) {
        this.state.connectionToPlayer.delete(existingPlayer.connectionId);
      }
      existingPlayer.connectionId = connection.id;
      existingPlayer.isConnected = true;
      existingPlayer.nickname = nickname || existingPlayer.nickname;
      if (avatar) existingPlayer.avatar = avatar;
      
      this.state.connectionToPlayer.set(connection.id, playerId);
      
      console.log(`[${this.state.gameCode}] Reconnected: ${existingPlayer.nickname}`);
      this.broadcast({ type: "player-joined", player: existingPlayer }, [playerId]);
      this.sendToConnection(connection.id, { type: "state-sync", state: this.serializeState(), yourPlayerId: playerId });
      return;
    }

    // Create new player
    const isFirstPlayer = this.state.players.size === 0;
    const player: Player = {
      id: playerId,
      connectionId: connection.id,
      nickname: nickname || `Player ${this.state.players.size + 1}`,
      avatar: avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)],
      isHost: isFirstPlayer,
      isConnected: true,
      joinedAt: Date.now(),
    };

    this.state.players.set(playerId, player);
    this.state.connectionToPlayer.set(connection.id, playerId);

    if (isFirstPlayer) {
      this.state.hostId = playerId;
    }

    console.log(`[${this.state.gameCode}] Joined: ${player.nickname} (${this.state.players.size} players)`);

    // Notify everyone about new player
    this.broadcast({ type: "player-joined", player }, [playerId]);

    // Ensure there is an active host
    const currentHost = this.state.hostId ? this.state.players.get(this.state.hostId) : null;
    if (!currentHost || !currentHost.isConnected) {
      this.reassignHost();
    }

    // Send current state to new player
    this.sendToConnection(connection.id, { type: "state-sync", state: this.serializeState(), yourPlayerId: playerId });
  }
}
