const express = require('express');
const router = express.Router();

// Simple in-memory leaderboard for demonstration
const leaderboard = [
  { username: 'JungleKing', score: 1500 },
  { username: 'Tarzan', score: 1200 },
  { username: 'Mowgli', score: 950 }
];

router.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  // In a real app, you'd check credentials and return a JWT.
  // Here we just return success.
  res.json({ success: true, username });
});

router.get('/leaderboard', (req, res) => {
  // Sort descending by score
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
  res.json(sorted);
});

module.exports = router;
