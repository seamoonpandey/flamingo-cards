import { useState } from 'react';
import './Card.css';

function Card({ question, packGradient, packIcon, packName }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className={`card-wrapper ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
      <div className="card-3d">
        {/* Front - Card Back (shows first) */}
        <div className="card-face front" style={{ background: packGradient }}>
          <div className="card-pattern">
            <div className="pattern-circle"></div>
            <div className="pattern-circle secondary"></div>
          </div>
          <div className="front-content">
            <span className="front-icon">🦩</span>
            <span className="front-brand">Flamingo</span>
            <span className="front-hint">Tap to reveal</span>
          </div>
        </div>
        
        {/* Back - Question (shows on flip) */}
        <div className="card-face back" style={{ background: packGradient }}>
          <div className="back-content">
            <div className="question-header">
              <span className="q-icon">{packIcon}</span>
              <span className="q-pack">{packName}</span>
            </div>
            <p className="question-text">{question}</p>
            <span className="back-hint">Tap to flip</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Card;
