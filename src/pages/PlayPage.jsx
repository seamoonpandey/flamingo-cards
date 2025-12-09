import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPackById } from '../data/questionPacks';
import Card from '../components/Card';
import './PlayPage.css';

function PlayPage() {
  const { packId } = useParams();
  const navigate = useNavigate();
  const pack = getPackById(packId);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  useEffect(() => {
    if (pack) {
      const shuffled = [...pack.questions].sort(() => Math.random() - 0.5);
      setShuffledQuestions(shuffled);
    }
  }, [pack]);

  const goToNext = useCallback(() => {
    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, shuffledQuestions.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleShuffle = () => {
    const shuffled = [...pack.questions].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    setCurrentIndex(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, navigate]);

  if (!pack) {
    return (
      <div className="play-page">
        <div className="play-error">
          <h2>Pack not found</h2>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / shuffledQuestions.length) * 100;

  return (
    <div className="play-page">
      {/* Background */}
      <div className="play-bg" style={{ background: pack.gradient }}></div>
      
      {/* Header */}
      <header className="play-header">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
        
        <div className="play-title">
          <span className="play-icon">{pack.icon}</span>
          <span className="play-name">{pack.name}</span>
        </div>

        <button className="icon-btn" onClick={handleShuffle} aria-label="Shuffle">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </header>

      {/* Progress */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Card Area */}
      <main className="play-main">
        {shuffledQuestions.length > 0 && (
          <Card 
            key={currentIndex}
            question={shuffledQuestions[currentIndex]} 
            packGradient={pack.gradient}
            packIcon={pack.icon}
            packName={pack.name}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <footer className="play-footer">
        <button 
          className="nav-btn"
          onClick={goToPrev}
          disabled={currentIndex === 0}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="card-counter">
          <span className="current">{currentIndex + 1}</span>
          <span className="divider">/</span>
          <span className="total">{shuffledQuestions.length}</span>
        </div>

        <button 
          className="nav-btn primary"
          onClick={goToNext}
          disabled={currentIndex === shuffledQuestions.length - 1}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </footer>
    </div>
  );
}

export default PlayPage;
