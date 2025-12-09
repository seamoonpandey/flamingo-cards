import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameSync } from '../hooks/useGameSync';
import { questionPacks } from '../data/questionPacks';
import './LobbyPage.css';

function LobbyPage() {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPackSelector, setShowPackSelector] = useState(false);

  // Memoize player info from sessionStorage to prevent re-renders
  const playerInfo = useMemo(() => ({
    nickname: sessionStorage.getItem('playerNickname') || 'Player',
    avatar: sessionStorage.getItem('playerAvatar') || '🦩',
  }), []);

  const handleKicked = useCallback(() => {
    alert('You were removed from the game');
    navigate('/');
  }, [navigate]);

  const {
    gameState,
    isConnected,
    isHost,
    me,
    selectPack,
    startGame,
    kickPlayer,
  } = useGameSync({
    gameCode: gameCode || '',
    nickname: playerInfo.nickname,
    avatar: playerInfo.avatar,
    onKicked: handleKicked,
  });


  // Redirect to play page when game starts
  useEffect(() => {
    if (gameState?.status === 'playing' && gameState.packId) {
      navigate(`/play/${gameState.packId}/${gameCode}`);
    }
  }, [gameState?.status, gameState?.packId, gameCode, navigate]);

  // Redirect if no nickname
  useEffect(() => {
    if (!sessionStorage.getItem('playerNickname')) {
      navigate('/create');
    }
  }, [navigate]);

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/lobby/${gameCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/lobby/${gameCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Flamingo game!',
          text: `Join my game with code: ${gameCode}`,
          url: link,
        });
      } catch (e) {
        if (e.name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleSelectPack = (pack) => {
    selectPack(pack.id, pack.name, pack.questions);
    setShowPackSelector(false);
  };

  const handleStartGame = () => {
    if (gameState?.packId) {
      startGame();
    } else {
      setShowPackSelector(true);
    }
  };

  const connectedPlayers = gameState?.players.filter(p => p.isConnected) || [];

  return (
    <div className="lobby-page">
      <div className="lobby-bg"></div>
      
      <header className="lobby-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="game-code-display">
          <span className="code-label">Game Code</span>
          <span className="code-value">{gameCode}</span>
        </div>
        <button className="share-btn" onClick={handleShare}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </header>

      <main className="lobby-main">
        {/* Connection Status */}
        <div className={`connection-status ${isConnected ? 'connected' : 'connecting'}`}>
          <div className="status-dot"></div>
          <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
        </div>

        {/* Player Count */}
        <div className="player-count">
          <span className="count-number">{connectedPlayers.length}</span>
          <span className="count-label">Player{connectedPlayers.length !== 1 ? 's' : ''} Ready</span>
        </div>

        {/* Players Grid */}
        <div className="players-section">
          <h2>Players</h2>
          <div className="players-grid">
            {gameState?.players.map((player) => (
              <div 
                key={player.id} 
                className={`player-card ${!player.isConnected ? 'disconnected' : ''} ${player.id === me?.id ? 'is-me' : ''}`}
              >
                <span className="player-avatar">{player.avatar}</span>
                <span className="player-name">
                  {player.nickname}
                  {player.isHost && <span className="host-badge">👑</span>}
                  {player.id === me?.id && <span className="you-badge">You</span>}
                </span>
                {!player.isConnected && <span className="offline-badge">Offline</span>}
                {isHost && player.id !== me?.id && (
                  <button 
                    className="kick-btn" 
                    onClick={() => kickPlayer(player.id)}
                    title="Remove player"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Pack */}
        {gameState?.packId && (
          <div className="selected-pack">
            <span className="pack-label">Selected Pack</span>
            <div className="pack-info">
              <span className="pack-name">{gameState.packName}</span>
              {isHost && (
                <button className="change-pack-btn" onClick={() => setShowPackSelector(true)}>
                  Change
                </button>
              )}
            </div>
          </div>
        )}

        {/* Host Controls */}
        {isHost && (
          <div className="host-controls">
            {!gameState?.packId && (
              <button className="select-pack-btn" onClick={() => setShowPackSelector(true)}>
                📦 Select a Pack
              </button>
            )}
            <button 
              className="start-btn"
              onClick={handleStartGame}
              disabled={!gameState?.packId || connectedPlayers.length < 1}
            >
              🎮 Start Game
            </button>
          </div>
        )}

        {/* Waiting for host message */}
        {!isHost && (
          <div className="waiting-message">
            <div className="waiting-dots">
              <span></span><span></span><span></span>
            </div>
            <p>Waiting for host to start the game...</p>
          </div>
        )}
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Share Game</h3>
            <div className="share-code">
              <span className="big-code">{gameCode}</span>
            </div>
            <p>Share this code with friends to join!</p>
            <button className="copy-btn" onClick={handleCopyLink}>
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </button>
            <button className="close-modal-btn" onClick={() => setShowShareModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Pack Selector Modal */}
      {showPackSelector && (
        <div className="modal-overlay" onClick={() => setShowPackSelector(false)}>
          <div className="modal-content pack-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Choose a Pack</h3>
            <div className="pack-list">
              {questionPacks.map((pack) => (
                <button
                  key={pack.id}
                  className="pack-option"
                  onClick={() => handleSelectPack(pack)}
                >
                  <span className="pack-icon">{pack.icon}</span>
                  <div className="pack-details">
                    <span className="pack-title">{pack.name}</span>
                    <span className="pack-count">{pack.questions.length} questions</span>
                  </div>
                </button>
              ))}
            </div>
            <button className="close-modal-btn" onClick={() => setShowPackSelector(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LobbyPage;
