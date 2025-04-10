// server.js
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const Parser = require('rss-parser');
const cors = require('cors');
const app=express();
const path= require("path");
dotenv.config();



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files if needed
app.use(express.static("public"));

// const app = express();
const PORT = process.env.PORT || 5000;
const parser = new Parser({
  headers: { 'User-Agent': 'Mozilla/5.0 (AI-Relief-Agent)' },
});
// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Folder where your EJS files live

app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.render("index.ejs")
})


// app.post("/location", (req, res) => {
//     const { lat, lon } = req.body || {}; // fallback to empty object
//     if (!lat || !lon) {
//       return res.status(400).json({ error: "Latitude and longitude are required." });
//     }
  
//     console.log("📍 Received location from frontend:", lat, lon);
//     res.json({ status: "Location received", lat, lon });
//   });
  
  

// 📍 IP Location API
app.get('/location', async (req, res) => {
    try {
        const response = await axios.get('http://ip-api.com/json');
      
        const data = {
          city: response.data.city,
          region: response.data.regionName,
          country: response.data.country,
          lat: response.data.lat,
          lon: response.data.lon,
        };
      
        if(data.city){
            weather(data.city);
        }
        news('Pune', 'Flood');
        weather("satara");
        // gemini();
        // twitter();
        console.log("📍 Location Data:", data);
      
        // ✅ Return here to prevent further execution
        return res.render("requestHelp.ejs", { data });
      
      } catch (error) {
        console.error("❌ Error fetching location:", error);
      
        // Only send this if a response hasn’t already been sent
        if (!res.headersSent) {
          return res.status(500).send("Failed to fetch location.");
        }
      }
      
const { lat, lon } = req.body;
console.log("📍 Received location from frontend:", lat, lon);
res.json({ status: "Location received", lat, lon });
});

async function weather(city){
    try {
        // const city = city;
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
        // res.json(data);
      } catch (err) {
        console.error("❌ Weather API Error:", err.message);
        // res.status(500).json({ error: 'Weather API failed' });
      }
}



async function gemini(){
    try {
        // Collect location and weather data first
        const [locRes, weatherRes] = await Promise.all([
          axios.get('http://ip-api.com/json'),
          axios.get(`http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=Mumbai`),
        ]);
    
        const location = locRes.data.city || 'Mumbai';
        const tweets = "Heavy waterlogging at CST, Need food near Andheri";
        const news = "Water rising in low-lying areas";
        const weather = weatherRes.data.current;
    
        const prompt = `Analyze this data and suggest AI-based disaster relief actions:\n
    City: ${location}
    Disaster: Flood
    Tweets: ${tweets}
    Weather: Rainfall ${weather.precip_mm}mm, Wind ${weather.wind_kph}kph
    News: ${news}
    Latitude: ${locRes.data.lat}, Longitude: ${locRes.data.lon}`;
    
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
          }
        );
    
        const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No suggestions.";
        const data = { suggestions: text };
    
        console.log("🧠 Gemini AI Suggestions:", data);
        // res.json(data);
      } catch (err) {
        console.error("❌ Gemini API Error:", err.response?.data || err.message);
        // res.status(500).json({ error: 'Gemini Flash API failed' });
      }
}


async function twitter(keyword) {
    try {
        const response = await axios.get(
          `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(keyword)}&max_results=10&tweet.fields=created_at,author_id`,
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
    
        console.log("🕎 Tweets:", tweets);
        res.json({ keyword, tweets });
      } catch (err) {
        console.error('❌ Twitter API Error:', err.response?.data || err.message);
        // res.status(500).json({ error: 'Twitter API failed' });
      }
}



// const Parser = require('rss-parser');
// const parser = new Parser();

async function news(city, disaster) {
    const keyword = `${disaster} in ${city}`;  // Example: "Flood in Mumbai"
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-IN&gl=IN&ceid=IN:en`;
  
    try {
      const feed = await parser.parseURL(url);
  
      const articles = (feed.items || [])
        .slice(0, 10)
        .map((item, index) => ({
          title: item.title || 'No title',
          link: item.link || '#',
          date: item.pubDate || 'No date',
          summary: item.contentSnippet
            ? item.contentSnippet.length > 200
              ? item.contentSnippet.substring(0, 200) + "..."
              : item.contentSnippet
            : 'No summary available',
          source: 'Google News',
        }));
  
      console.log(`🗺️ Showing latest ${articles.length} news articles about "${disaster}" in "${city}"`);
      articles.forEach(article => {
        console.log(`\n📰 ${article.index}. ${article.title}`);
        console.log(`📅 ${article.date}`);
        console.log(`🔗 ${article.link}`);
        console.log(`📝 ${article.summary}\n`);
      });
  
      
      return articles;
    } catch (err) {
      console.error('❌ Error fetching city-specific news:', err.message);
      return [];
    }
  }
// 🏠 Root
app.get('/', (req, res) => {
  res.send('🌍 Welcome to the AI-Powered Disaster Relief API');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


// // ------------------------------------------------------===
// // 📰 News via RSS Feed
// app.get('/news/:keyword', async (req, res) => {
//     const keyword = req.params.keyword.toLowerCase();
//     const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}`;
  
//     try {
//       const feed = await parser.parseURL(url);
//       const articles = (feed.items || []).map(item => ({
//         title: item.title || '',
//         link: item.link || '',
//         date: item.pubDate || '',
//         summary: item.contentSnippet || '',
//         source: 'Google News',
//       }));
  
//       console.log(`📅 ${articles.length} articles found for: ${keyword}`);
//       res.json({
//         keyword,
//         articles: articles.slice(0, 10),
//       });
//     } catch (err) {
//       console.error('❌ News fetch error:', err.message);
//       res.status(500).json({ error: 'News search failed' });
//     }
//   });


  
// // 🕎 Twitter Feed (Recent Tweets)
// app.get('/twitter/:keyword', async (req, res) => {
//     const keyword = req.params.keyword;
//     try {
//       const response = await axios.get(
//         `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(keyword)}&max_results=10&tweet.fields=created_at,author_id`,
//         {
//           headers: {
//             Authorization: `Bearer ${process.env.TWITTER_BEARER}`,
//           },
//         }
//       );
  
//       const tweets = response.data.data?.map(tweet => ({
//         id: tweet.id,
//         text: tweet.text,
//         author: tweet.author_id,
//         date: tweet.created_at,
//       })) || [];
  
//       console.log("🕎 Tweets:", tweets);
//       res.json({ keyword, tweets });
//     } catch (err) {
//       console.error('❌ Twitter API Error:', err.response?.data || err.message);
//       res.status(500).json({ error: 'Twitter API failed' });
//     }
//   });


//   // 🧠 Gemini AI (Disaster Relief Suggestions)
// app.get('/gemini', async (req, res) => {
//     try {
//       // Collect location and weather data first
//       const [locRes, weatherRes] = await Promise.all([
//         axios.get('http://ip-api.com/json'),
//         axios.get(`http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=Mumbai`),
//       ]);
  
//       const location = locRes.data.city || 'Mumbai';
//       const tweets = "Heavy waterlogging at CST, Need food near Andheri";
//       const news = "Water rising in low-lying areas";
//       const weather = weatherRes.data.current;
  
//       const prompt = `Analyze this data and suggest AI-based disaster relief actions:\n
//   City: ${location}
//   Disaster: Flood
//   Tweets: ${tweets}
//   Weather: Rainfall ${weather.precip_mm}mm, Wind ${weather.wind_kph}kph
//   News: ${news}
//   Latitude: ${locRes.data.lat}, Longitude: ${locRes.data.lon}`;
  
//       const response = await axios.post(
//         `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//         {
//           contents: [
//             {
//               role: 'user',
//               parts: [{ text: prompt }],
//             },
//           ],
//         }
//       );
  
//       const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No suggestions.";
//       const data = { suggestions: text };
  
//       console.log("🧠 Gemini AI Suggestions:", data);
//       res.json(data);
//     } catch (err) {
//       console.error("❌ Gemini API Error:", err.response?.data || err.message);
//       res.status(500).json({ error: 'Gemini Flash API failed' });
//     }
//   });
  

// //   / 🗘️ Route Optimization using OpenRouteService
// app.get('/route', async (req, res) => {
//     try {
//       const {
//         startLon = 77.5946,
//         startLat = 12.9716,
//         endLon = 78.4867,
//         endLat = 17.3850,
//       } = req.query;
  
//       const coordinates = [
//         [parseFloat(startLon), parseFloat(startLat)],
//         [parseFloat(endLon), parseFloat(endLat)],
//       ];
  
//       console.log("🧬 Requested Route Coordinates:", coordinates);
  
//       const response = await axios.post(
//         'https://api.openrouteservice.org/v2/directions/driving-car',
//         { coordinates },
//         {
//           headers: {
//             Authorization: process.env.ORS_API_KEY,
//             'Content-Type': 'application/json',
//           },
//         }
//       );
  
//       const feature = response.data.features?.[0];
//       if (!feature) {
//         return res.status(404).json({ error: 'Route data not found.' });
//       }
  
//       const route = feature.properties.summary;
//       const data = {
//         distance_km: (route.distance / 1000).toFixed(2),
//         duration_min: (route.duration / 60).toFixed(2),
//       };
  
//       console.log("🗺️ Optimized Route:", data);
//       res.json(data);
//     } catch (err) {
//       console.error("❌ Routing API Error Details:", err.response?.data || err.message);
//       res.status(500).json({ error: 'Routing API failed' });
//     }
// });


// // 🌦️ Weather API
// app.get('/weather/:city', async (req, res) => {
//     try {
//       const city = req.params.city;
//       const response = await axios.get(
//         `http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}`
//       );
//       const data = {
//         location: response.data.location.name,
//         region: response.data.location.region,
//         temp_c: response.data.current.temp_c,
//         condition: response.data.current.condition.text,
//         wind_kph: response.data.current.wind_kph,
//       };
//       console.log("🌦️ Weather Data:", data);
//       res.json(data);
//     } catch (err) {
//       console.error("❌ Weather API Error:", err.message);
//       res.status(500).json({ error: 'Weather API failed' });
//     }
//   });
  