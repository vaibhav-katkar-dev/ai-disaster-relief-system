const express = require('express');
const axios = require('axios');
const router = express.Router();

// 🌍 IP Location API
router.get('/location', async (req, res) => {
  try {
    const response = await axios.get('http://ip-api.com/json');
    const data = {
      city: response.data.city,
      region: response.data.regionName,
      country: response.data.country,
      lat: response.data.lat,
      lon: response.data.lon,
    };
    console.log("📍 Location Data:", data);
    res.json(data);
  } catch (err) {
    console.error("❌ Location API Error:", err.message);
    res.status(500).json({ error: 'Location API failed' });
  }
});

// 🌦️ Weather API
router.get('/weather/:city', async (req, res) => {
  try {
    const city = req.params.city;
    const response = await axios.get(
      `http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}`
    );
    const data = {
      location: response.data.location.name,
      region: response.data.location.region,
      temp_c: response.data.current.temp_c,
      condition: response.data.current.condition.text,
      wind_kph: response.data.current.wind_kph,
    };
    console.log("🌦️ Weather Data:", data);
    res.json(data);
  } catch (err) {
    console.error("❌ Weather API Error:", err.message);
    res.status(500).json({ error: 'Weather API failed' });
  }
});

// 🗺️ OpenRouteService Routing API
router.get('/route', async (req, res) => {
  try {
    const body = {
      coordinates: [
        [77.5946, 12.9716], // Bangalore
        [78.4867, 17.3850], // Hyderabad
      ],
    };
    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      body,
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    
    const feature = response.data.features?.[0];
if (!feature) {
  return res.status(404).json({ error: 'Route data not found.' });
}
const route = feature.properties.summary;

    
    // const route = response.data.features?.[0]?.properties?.summary;
    // if (!route) throw new Error("Route data not found.");

    const data = {
      distance_km: (route.distance / 1000).toFixed(2),
      duration_min: (route.duration / 60).toFixed(2),
    };

    console.log("🗺️ Route Data:", data);
    res.json(data);
  } catch (err) {
    console.error("❌ Routing API Error:", err.message);
    res.status(500).json({ error: 'Routing API failed' });
  }
});

// 🧠 Gemini AI (Free version)
router.get('/gemini', async (req, res) => {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Suggest AI-based disaster relief actions for Mumbai.',
                },
              ],
            },
          ],
        }
      );
  
      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No suggestions.";
      const data = { suggestions: text };
  
      console.log("🧠 Gemini Flash AI Response:", data);
      res.json(data);
    } catch (err) {
      console.error("❌ Gemini API Error:", err.response?.data || err.message);
      res.status(500).json({ error: 'Gemini Flash API failed' });
    }
  });
  

// 🐦 Twitter (X) API - Search Tweets
router.get('/twitter/:keyword', async (req, res) => {
  const keyword = req.params.keyword;

  try {
    const response = await axios.get(
      `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(keyword)}&max_results=5&tweet.fields=created_at,author_id`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER}`,
        },
      }
    );

    const tweets = response.data.data?.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      author: tweet.author_id,
      date: tweet.created_at,
    })) || [];

    console.log("🐦 Tweets Found:", tweets);
    res.json({ keyword, tweets });
    
  } catch (err) {
      
    if (err.response?.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      }
      
    console.error('❌ Twitter API Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Twitter API failed' });
  }
});

module.exports = router;
