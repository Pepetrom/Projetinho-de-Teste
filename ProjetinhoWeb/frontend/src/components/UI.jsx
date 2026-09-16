import React, { useState, useEffect, useRef } from 'react';
import { login, getLeaderboard } from '../services/api';
import { socket } from '../services/socket';

export const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(username);
      if (data.success) {
        onLogin(data.username);
      }
    } catch (err) {
      setError('Falha ao conectar. Tente novamente.');
    }
  };

  return (
    <div className="login-screen">
      <h1>Jungle Arena</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Seu Nickname" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit">Entrar na Arena</button>
        {error && <p style={{color: '#ff4444', fontSize: '0.9rem'}}>{error}</p>}
      </form>
    </div>
  );
};

export const Leaderboard = ({ players }) => {
  const [highscores, setHighscores] = useState([]);

  useEffect(() => {
    // Fetch all-time highscores on mount
    getLeaderboard().then(setHighscores).catch(console.error);
  }, []);

  // Combine current players' scores with highscores (simple demo logic)
  const currentPlayers = Object.values(players).map(p => ({
    username: p.username,
    score: p.score
  }));

  // Create a mixed list and sort
  const combined = [...highscores];
  currentPlayers.forEach(cp => {
    const existingIndex = combined.findIndex(h => h.username === cp.username);
    if (existingIndex >= 0) {
      if (cp.score > combined[existingIndex].score) {
        combined[existingIndex].score = cp.score;
      }
    } else {
      combined.push(cp);
    }
  });
  
  const top5 = combined.sort((a,b) => b.score - a.score).slice(0, 5);

  return (
    <div className="leaderboard">
      <h3>Placar de Líderes</h3>
      <ul>
        {top5.map((entry, index) => (
          <li key={index}>
            <span>{entry.username}</span>
            <span style={{ fontWeight: 'bold', color: '#4facfe' }}>{entry.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
