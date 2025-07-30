const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();
const serviceAccount = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// In-memory users and referrals
let users = {};
let referrals = [];

// Register a new user and generate a unique ID and referral link
app.post('/api/register', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  try {
    // Check if username already exists
    const usersRef = db.collection('users');
    const existing = await usersRef.where('username', '==', username).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    const userId = uuidv4();
    const referralLink = `https://t.me/YourBot?start=ref_${userId}`;
    await usersRef.doc(userId).set({ userId, username, referralLink, referrals: [], level: 0, tasksDone: 0 });
    res.json({ userId, referralLink });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Add a referral (when a user is referred by another)
app.post('/api/refer', async (req, res) => {
  const { referrerId, referredId } = req.body;
  if (!referrerId || !referredId) {
    return res.status(400).json({ error: 'referrerId and referredId are required' });
  }
  try {
    const referrerRef = db.collection('users').doc(referrerId);
    const referrerDoc = await referrerRef.get();
    if (!referrerDoc.exists) {
      return res.status(404).json({ error: 'Referrer not found' });
    }
    // Add referredId to referrer's referrals array
    await referrerRef.update({
      referrals: admin.firestore.FieldValue.arrayUnion(referredId)
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add referral' });
  }
});

// Update user level and tasks done
app.post('/api/user-progress', async (req, res) => {
  const { userId, level, tasksDone } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  try {
    const userRef = db.collection('users').doc(userId);
    const updates = {};
    if (typeof level === 'number') updates.level = level;
    if (typeof tasksDone === 'number') updates.tasksDone = tasksDone;
    await userRef.update(updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user progress' });
  }
});

// Get user info (id, referrals, level, tasks done)
app.get('/api/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { username, referralLink, referrals = [], level = 0, tasksDone = 0 } = userDoc.data();
    res.json({ userId, username, referralLink, referrals, level, tasksDone });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// Submit a score: { userId, score }
app.post('/api/submit', async (req, res) => {
  const { userId, score } = req.body;
  if (!userId || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid data' });
  }
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const username = userDoc.data().username;
    const lbRef = db.collection('leaderboard').doc(userId);
    const lbDoc = await lbRef.get();
    if (lbDoc.exists) {
      const data = lbDoc.data();
      if (score > data.score) {
        await lbRef.set({ userId, username, score });
      }
    } else {
      await lbRef.set({ userId, username, score });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// Get top scores
app.get('/api/leaderboard', async (req, res) => {
  try {
    const snapshot = await db.collection('leaderboard').orderBy('score', 'desc').limit(20).get();
    const leaderboard = snapshot.docs.map(doc => doc.data());
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(__dirname + '/index.html');
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, () => {
  console.log(`Leaderboard server running on http://localhost:${PORT}`);
}); 