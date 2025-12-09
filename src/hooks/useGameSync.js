import { useEffect, useState, useCallback, useRef } from 'react';
import PartySocket from 'partysocket';

// PartyKit host - use localhost for dev, production URL for deployed
const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999';

/**
 * Generate a persistent player ID for this session
 */
function getOrCreatePlayerId() {
  let playerId = sessionStorage.getItem('playerId');
  if (!playerId) {
    // Generate a random ID
    playerId = 'p_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    sessionStorage.setItem('playerId', playerId);
  }
  return playerId;
}

/**
 * Custom hook for real-time game synchronization with PartyKit
 * @param {Object} options
 * @param {string} options.gameCode - The game room code
 * @param {string} options.nickname - Player's nickname
 * @param {string} [options.avatar] - Player's avatar emoji
 * @param {Function} [options.onKicked] - Callback when player is kicked
 * @param {Function} [options.onError] - Callback on error
 */
export function useGameSync({
  gameCode,
  nickname,
  avatar,
  onKicked,
  onError,
}) {
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [myId, setMyId] = useState(null); // Persistent player ID
  const socketRef = useRef(null);
  const playerIdRef = useRef(getOrCreatePlayerId());
  
  // Use refs for callbacks to avoid re-creating the effect
  const onKickedRef = useRef(onKicked);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onKickedRef.current = onKicked;
    onErrorRef.current = onError;
  }, [onKicked, onError]);

  // Connect to game room - only reconnect when gameCode or nickname changes
  useEffect(() => {
    console.log('[useGameSync] Effect triggered with:', { gameCode, nickname, avatar });
    
    if (!gameCode || !nickname) {
      console.log('[useGameSync] Missing gameCode or nickname:', { gameCode, nickname });
      return;
    }

    const playerId = playerIdRef.current;
    console.log('[useGameSync] Connecting to room:', gameCode, 'as:', nickname, 'playerId:', playerId);

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: gameCode,
    });

    socketRef.current = socket;

    socket.addEventListener('open', () => {
      console.log('[useGameSync] Socket opened, joining with playerId:', playerId);
      setIsConnected(true);
      // Send join message with persistent player ID
      socket.send(JSON.stringify({
        type: 'join',
        playerId,
        nickname,
        avatar,
      }));
    });

    socket.addEventListener('close', () => {
      console.log('[useGameSync] Socket closed');
      setIsConnected(false);
    });

    socket.addEventListener('error', (e) => {
      console.error('[useGameSync] Socket error:', e);
    });

    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[useGameSync] Received message:', message.type);
        
        switch (message.type) {
          case 'state-sync':
            setGameState(message.state);
            // Set myId from the server response
            if (message.yourPlayerId) {
              setMyId(message.yourPlayerId);
            }
            break;
          case 'player-joined':
            setGameState(prev => prev ? {
              ...prev,
              players: [...prev.players.filter(p => p.id !== message.player.id), message.player],
              playerCount: prev.playerCount + 1,
            } : null);
            break;
          case 'player-left':
            setGameState(prev => prev ? {
              ...prev,
              players: prev.players.map(p => 
                p.id === message.playerId ? { ...p, isConnected: false } : p
              ),
            } : null);
            break;
          case 'card-changed':
            setGameState(prev => prev ? {
              ...prev,
              currentCardIndex: message.index,
            } : null);
            break;
          case 'game-started':
          case 'game-ended':
            // State sync will follow
            break;
          case 'you-were-kicked':
            onKickedRef.current?.();
            socket.close();
            break;
          case 'error':
            onErrorRef.current?.(message.message);
            break;
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });

    return () => {
      // Delay close to allow pending messages to flush during re-renders
      const timeoutId = setTimeout(() => {
        console.log('[useGameSync] Cleanup - closing socket');
        socket.close();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    };
  }, [gameCode, nickname, avatar]); // Removed onKicked, onError from deps

  // Send message helper
  const send = useCallback((message) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Game actions
  const selectPack = useCallback((packId, packName, questions) => {
    send({ type: 'select-pack', packId, packName, questions });
  }, [send]);

  const updateSettings = useCallback((settings) => {
    send({ type: 'update-settings', settings });
  }, [send]);

  const startGame = useCallback(() => {
    send({ type: 'start-game' });
  }, [send]);

  const nextCard = useCallback(() => {
    send({ type: 'next-card' });
  }, [send]);

  const prevCard = useCallback(() => {
    send({ type: 'prev-card' });
  }, [send]);

  const shuffleCards = useCallback(() => {
    send({ type: 'shuffle' });
  }, [send]);

  const endGame = useCallback(() => {
    send({ type: 'end-game' });
  }, [send]);

  const kickPlayer = useCallback((playerId) => {
    send({ type: 'kick-player', playerId });
  }, [send]);

  const requestSync = useCallback(() => {
    send({ type: 'sync-request' });
  }, [send]);

  // Use the persistent player ID for derived state
  const persistentId = playerIdRef.current;
  const isHost = persistentId !== null && gameState?.hostId === persistentId;
  const canControl = !gameState?.settings?.hostOnlyControls || isHost;
  const me = gameState?.players?.find(p => p.id === persistentId);

  return {
    // State
    gameState,
    isConnected,
    myId: persistentId,
    isHost,
    canControl,
    me,
    
    // Actions
    selectPack,
    updateSettings,
    startGame,
    nextCard,
    prevCard,
    shuffleCards,
    endGame,
    kickPlayer,
    requestSync,
  };
}

/**
 * Generate a short game code
 * @returns {string} 6-character alphanumeric code
 */
export function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
