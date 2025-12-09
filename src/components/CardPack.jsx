import { Link } from 'react-router-dom';
import './CardPack.css';

function CardPack({ pack, index }) {
  return (
    <Link 
      to={`/play/${pack.id}`} 
      className="pack-card"
      style={{ 
        '--pack-bg': pack.gradient,
        '--delay': `${index * 0.05}s`
      }}
    >
      <div className="pack-bg" style={{ background: pack.gradient }}></div>
      
      <div className="pack-inner">
        <div className="pack-icon-wrap">
          <span className="pack-icon">{pack.icon}</span>
        </div>
        
        <div className="pack-info">
          <h3 className="pack-title">{pack.name}</h3>
          <p className="pack-desc">{pack.description}</p>
        </div>

        <div className="pack-meta">
          <span className="pack-count">{pack.questions.length} cards</span>
          <span className="pack-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default CardPack;
