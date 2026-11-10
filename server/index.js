import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mock response for Phase 1 testing
const MOCK_ITINERARY = {
  title: "4 Days in Kyoto: Temples & Culinary Delights",
  summary: "A curated journey through Kyoto's historic shrines, traditional markets, and serene bamboo groves.",
  days: [
    {
      label: "Day 1: Arrival & Historic Higashiyama",
      startTime: "09:00",
      stops: [
        {
          name: "Kiyomizu-dera Temple",
          type: "sight",
          durationMin: 120,
          description: "Iconic hilltop wooden temple offering panoramic vistas over Kyoto.",
          costEstimate: "¥400",
          tip: "Visit early morning to beat the peak crowds on the wooden stage."
        },
        {
          name: "Ninenzaka & Sannenzaka Stroll",
          type: "activity",
          durationMin: 75,
          description: "Preserved stone-paved pedestrian lanes lined with teahouses and craft shops.",
          costEstimate: "Free",
          tip: "Great place to sample fresh yatsuhashi cinnamon treats."
        },
        {
          name: "Nishiki Market Food Walk",
          type: "food",
          durationMin: 90,
          description: "Kyoto's lively 400-year-old food market bursting with local specialties.",
          costEstimate: "¥2,000",
          tip: "Eat at vendor stalls rather than walking while eating."
        }
      ]
    },
    {
      label: "Day 2: Arashiyama & Bamboo Groves",
      startTime: "09:00",
      stops: [
        {
          name: "Sagano Bamboo Forest",
          type: "sight",
          durationMin: 60,
          description: "Towering bamboo stalks with the sound of rustling wind.",
          costEstimate: "Free",
          tip: "Morning light provides the most dramatic photography."
        },
        {
          name: "Tenryu-ji Zen Temple & Garden",
          type: "sight",
          durationMin: 90,
          description: "UNESCO World Heritage temple featuring a 14th-century landscape garden.",
          costEstimate: "¥500",
          tip: "Sit quietly on the veranda facing Sogenchi pond."
        }
      ]
    }
  ]
};

// Phase 1: Hardcoded response on /api/plan
app.post('/api/plan', (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({
      error: {
        code: 'EMPTY',
        message: 'Trip description cannot be empty.'
      }
    });
  }

  // Return the mock itinerary
  res.json({
    itinerary: MOCK_ITINERARY,
    warnings: []
  });
});

app.listen(PORT, () => {
  console.log(`[Trip Planner Server] Running on http://localhost:${PORT}`);
});

