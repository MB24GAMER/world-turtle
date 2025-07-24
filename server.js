const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory leaderboard
let leaderboard = [];

// Submit a score: { username, score }
app.post('/api/submit', (req, res) => {
  const { username, score } = req.body;
  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid data' });
  }
  // Check if user exists
  const existing = leaderboard.find(u => u.username === username);
  if (existing) {
    if (score > existing.score) existing.score = score;
  } else {
    leaderboard.push({ username, score });
  }
  // Sort descending
  leaderboard.sort((a, b) => b.score - a.score);
  // Keep top 20
  leaderboard = leaderboard.slice(0, 20);
  res.json({ success: true });
});

// Get top scores
app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard);
});

app.listen(PORT, () => {
  console.log(`Leaderboard server running on http://localhost:${PORT}`);
}); 