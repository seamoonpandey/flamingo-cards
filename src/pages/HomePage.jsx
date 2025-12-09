import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionPacks, categories, getPacksByCategory, getTotalQuestions } from '../data/questionPacks';
import CardPack from '../components/CardPack';
import './HomePage.css';

function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const filteredPacks = getPacksByCategory(activeCategory);
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🦩</span>
            <span className="logo-text">Flamingo</span>
          </div>
          <button className="play-together-btn" onClick={() => navigate('/create')}>
            🎮 Play Together
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">
          Pick a deck,<br />
          <span className="highlight">spark a conversation</span>
        </h1>
        <p className="hero-subtitle">
          {getTotalQuestions()}+ questions to connect deeper
        </p>
      </section>

      {/* Categories */}
      <nav className="categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="cat-icon">{cat.icon}</span>
            <span className="cat-name">{cat.name}</span>
          </button>
        ))}
      </nav>

      {/* Packs Grid */}
      <section className="packs">
        <div className="packs-grid">
          {filteredPacks.map((pack, index) => (
            <CardPack key={pack.id} pack={pack} index={index} />
          ))}
        </div>
      </section>

      {/* Bottom Spacer */}
      <div className="bottom-spacer"></div>
    </div>
  );
}

export default HomePage;
