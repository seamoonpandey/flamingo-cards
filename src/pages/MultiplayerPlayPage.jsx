import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameSync } from '../hooks/useGameSync';
import { getPackById } from '../data/questionPacks';
import Card from '../components/Card';
import './PlayPage.css';

function MultiplayerPlayPage() {
  const { packId, gameCode } = useParams();
  const navigate = useNavigate();
  const pack = getPackById(packId);

  // Get player info from sessionStorage
  const nickname = sessionStorage.getItem('playerNickname') || 'Player';
  const avatar = sessionStorage.getItem('playerAvatar') || '🦩';

  const {
    gameState,
    isConnected,
    isHost,
    canControl,
    me,
    nextCard,
    prevCard,
    shuffleCards,
    endGame,
  } = useGameSync({
    gameCode: gameCode || '',
    nickname,
    avatar,
    onKicked: () => {
      alert('You were removed from the game');
      navigate('/');
    },
  });

  // Redirect if no nickname
  useEffect(() => {
    if (!sessionStorage.getItem('playerNickname')) {
      navigate('/create');
    }
  }, [navigate]);

  // Handle game ending
  useEffect(() => {
    if (gameState?.status === 'finished') {
      navigate(`/lobby/${gameCode}`);
    }
  }, [gameState?.status, gameCode, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!canControl) return;
      
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextCard();
      } else if (e.key === 'ArrowLeft') {
        prevCard();
      } else if (e.key === 'Escape') {
        if (isHost) {
          endGame();
        } else {
          navigate('/');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canControl, nextCard, prevCard, isHost, endGame, navigate]);

  if (!pack || !gameState) {
    return (
      <div className="play-page">
        <div className="play-error">
          <div className="loading-spinner"></div>
          <h2>{!pack ? 'Pack not found' : 'Connecting...'}</h2>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = gameState.shuffledQuestions[gameState.currentCardIndex];
  const progress = ((gameState.currentCardIndex + 1) / gameState.shuffledQuestions.length) * 100;
  const connectedPlayers = gameState.players.filter(p => p.isConnected);

  return (
    <div className="play-page multiplayer">
      {/* Background */}
      <div className="play-bg" style={{ background: pack.gradient }}></div>
      
      {/* Header */}
      <header className="play-header">
        <button 
          className="icon-btn" 
          onClick={() => isHost ? endGame() : navigate('/')} 
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
        
        <div className="play-title">
          <span className="play-icon">{pack.icon}</span>
          <span className="play-name">{pack.name}</span>
        </div>

        <button 
          className="icon-btn" 
          onClick={shuffleCards} 
          aria-label="Shuffle"
          disabled={!canControl}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </header>

      {/* Players Bar */}
      <div className="players-bar">
        <div className="players-avatars">
          {connectedPlayers.slice(0, 8).map((player) => (
            <div 
              key={player.id} 
              className={`player-bubble ${player.id === me?.id ? 'is-me' : ''}`}
              title={player.nickname}
            >
              {player.avatar}
              {player.isHost && <span className="host-crown">👑</span>}
            </div>
          ))}
          {connectedPlayers.length > 8 && (
            <div className="player-bubble more">
              +{connectedPlayers.length - 8}
            </div>
          )}
        </div>
        <div className="connection-indicator">
          <div className={`status-dot ${isConnected ? 'online' : 'offline'}`}></div>
          <span>{connectedPlayers.length} playing</span>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Card Area */}
      <main className="play-main">
        {currentQuestion && (
          <Card 
            key={gameState.currentCardIndex}
            question={currentQuestion} 
            packGradient={pack.gradient}
            packIcon={pack.icon}
            packName={pack.name}
          />
        )}
      </main>

      {/* Control hint for non-hosts */}
      {!canControl && (
        <div className="control-hint">
          <span>🎮 Host is controlling the cards</span>
        </div>
      )}

      {/* Bottom Navigation */}
      <footer className="play-footer">
        <button 
          className="nav-btn"
          onClick={prevCard}
          disabled={!canControl || gameState.currentCardIndex === 0}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="card-counter">
          <span className="current">{gameState.currentCardIndex + 1}</span>
          <span className="divider">/</span>
          <span className="total">{gameState.shuffledQuestions.length}</span>
        </div>

        <button 
          className="nav-btn primary"
          onClick={nextCard}
          disabled={!canControl || gameState.currentCardIndex === gameState.shuffledQuestions.length - 1}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </footer>
    </div>
  );
}

export default MultiplayerPlayPage;
