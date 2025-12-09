import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PlayPage from './pages/PlayPage';
import CreateGamePage from './pages/CreateGamePage';
import LobbyPage from './pages/LobbyPage';
import MultiplayerPlayPage from './pages/MultiplayerPlayPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play/:packId" element={<PlayPage />} />
        <Route path="/create" element={<CreateGamePage />} />
        <Route path="/lobby/:gameCode" element={<LobbyPage />} />
        <Route path="/play/:packId/:gameCode" element={<MultiplayerPlayPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
