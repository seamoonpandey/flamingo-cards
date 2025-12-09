import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateGameCode } from '../hooks/useGameSync';
import './CreateGamePage.css';

// Avatar options
const AVATARS = ['🦩', '🦜', '🦚', '🦢', '🐧', '🦆', '🦅', '🦉', '🐦', '🐤', '🦋', '🐝', '🌸', '🌺', '🌻', '🌼', '🍀', '🌈', '⭐', '🌙'];

function CreateGamePage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState('create'); // 'create' or 'join'
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    const gameCode = generateGameCode();
    // Store nickname and avatar in sessionStorage for the lobby
    sessionStorage.setItem('playerNickname', nickname.trim());
    sessionStorage.setItem('playerAvatar', avatar);
    navigate(`/lobby/${gameCode}`);
  };

  const handleJoin = () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    if (!joinCode.trim() || joinCode.trim().length < 4) {
      setError('Please enter a valid game code');
      return;
    }
    sessionStorage.setItem('playerNickname', nickname.trim());
    sessionStorage.setItem('playerAvatar', avatar);
    navigate(`/lobby/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="create-page">
      <div className="create-bg"></div>
      
      <header className="create-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1>Play Together</h1>
        <div style={{ width: 40 }}></div>
      </header>

      <main className="create-main">
        {/* Avatar Selection */}
        <div className="avatar-section">
          <div className="selected-avatar">{avatar}</div>
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <button
                key={a}
                className={`avatar-option ${avatar === a ? 'selected' : ''}`}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Nickname Input */}
        <div className="input-group">
          <label htmlFor="nickname">Your Nickname</label>
          <input
            type="text"
            id="nickname"
            placeholder="Enter your name..."
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError('');
            }}
            maxLength={20}
          />
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button 
            className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
          >
            Create Game
          </button>
          <button 
            className={`mode-btn ${mode === 'join' ? 'active' : ''}`}
            onClick={() => setMode('join')}
          >
            Join Game
          </button>
        </div>

        {/* Join Code Input (only for join mode) */}
        {mode === 'join' && (
          <div className="input-group">
            <label htmlFor="joinCode">Game Code</label>
            <input
              type="text"
              id="joinCode"
              placeholder="Enter code (e.g., ABC123)"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError('');
              }}
              maxLength={8}
              style={{ textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center' }}
            />
          </div>
        )}

        {/* Error Message */}
        {error && <p className="error-message">{error}</p>}

        {/* Action Button */}
        <button 
          className="action-btn"
          onClick={mode === 'create' ? handleCreate : handleJoin}
        >
          {mode === 'create' ? '🎉 Create Game' : '🚀 Join Game'}
        </button>
      </main>
    </div>
  );
}

export default CreateGamePage;
