import React from 'react';
import './Dice.css';

const Dice = ({ value, rolling }) => {
  return (
    <div className="dice-container">
      <div className={`dice show-${value} ${rolling ? 'rolling' : ''}`}>
        <div className="dice-face face-1">
          <span className="dot"></span>
        </div>
        <div className="dice-face face-2">
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
        <div className="dice-face face-3">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
        <div className="dice-face face-4">
          <div className="column">
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <div className="column">
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
        <div className="dice-face face-5">
          <div className="column">
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <div className="column">
            <span className="dot"></span>
          </div>
          <div className="column">
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
        <div className="dice-face face-6">
          <div className="column">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <div className="column">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dice;
