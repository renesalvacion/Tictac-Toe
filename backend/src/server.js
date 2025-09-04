require('dotenv').config();

console.log("🔍 Checking MONGO_URI:", process.env.MONGO_URI ? "✅ Found" : "❌ Not Found");

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "https://tictac-toe-ebon.vercel.app"
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  };
  
app.use(cors(corsOptions));
app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tictactoe';

mongoose
  .connect(mongoUri, { dbName: 'tictactoe' })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Models
const RoundSchema = new mongoose.Schema(
  {
    winner: { type: String, enum: ['player1', 'player2', 'draw'], required: true },
    board: { type: [[String]], default: [] },
  },
  { _id: false, timestamps: true }
);

const GameSchema = new mongoose.Schema(
  {
    player1: { type: String, required: true },
    player2: { type: String, required: true },
    rounds: { type: [RoundSchema], default: [] },
    status: { type: String, enum: ['active', 'stopped'], default: 'active' },
  },
  { timestamps: true }
);

const Game = mongoose.model('Game', GameSchema);

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// List games (most recent first)
app.get('/api/games', async (_req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Create a game
app.post('/api/games', async (req, res) => {
  try {
    const { player1, player2 } = req.body;
    if (!player1 || !player2) {
      return res.status(400).json({ error: 'player1 and player2 are required' });
    }
    const game = await Game.create({ player1, player2 });
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Get a game by id
app.get('/api/games/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Append a round result
app.post('/api/games/:id/rounds', async (req, res) => {
  try {
    const { winner, board } = req.body;
    if (!['player1', 'player2', 'draw'].includes(winner)) {
      return res.status(400).json({ error: 'winner must be player1, player2, or draw' });
    }
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (game.status !== 'active') return res.status(400).json({ error: 'Game already stopped' });
    game.rounds.push({ winner, board: board || [] });
    await game.save();
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add round' });
  }
});

// Stop a game
app.post('/api/games/:id/stop', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    game.status = 'stopped';
    await game.save();
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: 'Failed to stop game' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`🚀 API listening on port ${port}`);
});


