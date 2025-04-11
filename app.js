
// server.js
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const Parser = require('rss-parser');
const cors = require('cors');
const app=express();
const path= require("path");
dotenv.config();
const nodemailer = require("nodemailer");

// server.js
// // const express = require('express');
// const axios = require('axios');
// const dotenv = require('dotenv');
// const Parser = require('rss-parser');
// const cors = require('cors');
// // const app=express();
// const path= require("path");
// dotenv.config();


const mongoose = require('mongoose');
// const volunteerRoutes = require('./routes/volunteer'); // <-- ✅ your route file



// DB Setup
mongoose.connect("mongodb://127.0.0.1:27017/disasterHelp2", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schema & Model
const volunteerSchema = new mongoose.Schema({
  isOrganization: Boolean,
  firstName: String,
  lastName: String,
  location: String,
  phone: String,
  email: String,
  assistance: String,
  availability: String,
  skills: String,
  travelRange: String
});

const Volunteer = mongoose.model("Volunteer", volunteerSchema);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files if needed
app.use(express.static("public"));
const HelpRequest = require("./models/HelpRequest");




const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: "maheshs.thombare@gmail.com",
    pass: "gqpf efvj lgpn sova",
  },
  tls: {
    rejectUnauthorized: false, // Ignore self-signed certificate error
  },
});
// async..await is not allowed in global scope, must use a wrapper
async function sendemail(to,helpType,fullName,distance,location,peopleCount,phone,description) {
  try {
    const info = await transporter.sendMail({
      from: '"Mahesh👻" <maheshs.thombare@gmail.com>',
      to,
      subject: "For verification",
      text: "gqpf efvj lgpn sova",
      html: "<b>Hello Volunteer,</b><br><br>You have been <b>assigned a new help request</b> in your area. Here are the details:<br><br><b>Requester Name:</b>"+fullName+" <br><b>Location:</b>"+location+"<br><b>Phone:</b> "+phone+"<br><b>Type of Help Needed:</b> "+helpType+"<br><b>Number of People:</b> "+peopleCount+"<br><b>Description:</b> "+description+"<br><br>Please reach out to the requester as soon as possible and confirm their safety.<br><br>Thank you for your continued support and compassion! 💪<br><br>Warm regards,<br><b>Disaster Relief Team</b>",
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Email sending failed:", error.message);
  }
}

app.get("/email", (req, res) => {
  const recipient = "learnwithmst07@gmail.com";
  sendemail(recipient); // don't await
  res.render("index.ejs");
});




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
// app.use('/api', volunteerRoutes); // now all routes inside volunteer.js will be prefixed with /api
app.get("/",(req,res)=>{
  res.render("index.ejs")
})
app.get("/map",(req,res)=>{
  res.render("home.ejs");
});
// Routes
const riskModelRoutes = require('./routes/riskModel');
app.use('/api/risk', riskModelRoutes);

// app.get("/dashboard",async(req,res)=>{
//   const reqdata = await HelpRequest.find();
//   console.log(reqdata);
//   res.render("dashboard.ejs",{reqdata});
// })



const reverseGeocode = require("./utils/reverseGeocode");

app.get("/dashboard", async (req, res) => {
  const reqdata = await HelpRequest.find();

  // Add location names
  const enrichedData = await Promise.all(reqdata.map(async (item) => {
    const [lat, lon] = item.location.match(/[-+]?[0-9]*\.?[0-9]+/g); // Extract lat & lon
    const locationName = await reverseGeocode(lat, lon);
    return {
      ...item.toObject(), // convert mongoose document to plain JS object
      locationName
    };
  }));
  const count = await HelpRequest.countDocuments();
  res.render("dashboard.ejs", { reqdata: enrichedData ,count});
});



app.get("/dashboard/login",(req,res)=>{
  res.render("admin_login.ejs")
})




app.get("/reqhelp",(req,res)=>{
  res.render("reqHelp")
})


function getLatLon(locationStr) {
  if (typeof locationStr !== "string") return null; // 🛡️ Safe check added
  const match = locationStr.match(/Lat:\s*([-.\d]+),\s*Lon:\s*([-.\d]+)/);
  return match ? { lat: parseFloat(match[1]), lon: parseFloat(match[2]) } : null;
}


function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.post("/reqhelp", async (req, res) => {
  try {
    const {
      fullName,
      location,
      phone,
      helpType,
      peopleCount,
      description
    } = req.body;

    const newRequest = new HelpRequest({
      fullName,
      location,
      phone,
      helpType,
      peopleCount,
      description
    });

    await newRequest.save();
    console.log("✅ Help request saved:", newRequest);

    const requestLoc = getLatLon(location);
    if (!requestLoc) {
      console.log("❌ Invalid request location format:", location);
      return res.status(400).send("❌ Invalid location format. Use: 'Lat: 18.5204, Lon: 73.8567'");
    }

    const volunteers = await Volunteer.find();
    let matched = false;

    for (const volunteer of volunteers) {
      const volunteerLoc = getLatLon(volunteer.location);
      if (!volunteerLoc) {
        console.log(`⚠️ Skipped volunteer with invalid location: ${volunteer.location}`);
        continue;
      }
      
      const distance = calculateDistanceKm(
        volunteerLoc.lat, volunteerLoc.lon,
        requestLoc.lat, requestLoc.lon
      );

      const canTravel = parseFloat(volunteer.travelRange || "0");
      const isHelpTypeMatch = (volunteer.assistance || "").toLowerCase() === helpType.toLowerCase();

      if (distance <= canTravel && isHelpTypeMatch) {
        const updatedDoc = await HelpRequest.findByIdAndUpdate(
          newRequest._id,
          { status: "Assigned" },
          { new: true } // return the updated document
        );
        
        console.log(updatedDoc);
        let volEmail=volunteer.email;
        sendemail(volEmail,helpType,fullName,distance,location,peopleCount,phone,description);
        matched = true;
        console.log("✅ Match Found");
        console.log(`→ Help Needed: ${helpType}`);
        console.log(`→ Request By : ${fullName} (${phone})`);
        console.log(`→ Location    : ${location}`);
        console.log(`→ Volunteer   : ${volunteer.firstName} ${volunteer.lastName} (${volunteer.phone})`);
        console.log(`→ Skills      : ${volunteer.skills}`);
        console.log(`→ Distance    : ${distance.toFixed(2)} km`);
        console.log(`→ Travel Limit: ${canTravel} km`);
        console.log("---------------------------");
      }
    }

    if (!matched) {
      console.log("❌ No matching volunteer found for this request.");
    }

    res.send(`<h2>✅ Help request submitted successfully, ${fullName}!</h2><a href="/reqhelp">Submit another request</a>`);
  } catch (err) {
    console.error("❌ Error saving help request:", err);
    res.status(500).send("❌ Internal Server Error. Please try again.");
  }
});



app.get("/offhelp",(req,res)=>{
  res.render("offerHelp")
})
app.post("/offhelp", async (req, res) => {
  try {
    const {
      orgCheck,
      firstName,
      lastName,
      location,
      phone,
      email,
      assistance,
      availability,
      skills,
      travelRange
    } = req.body;

    const newVolunteer = new Volunteer({
      isOrganization: orgCheck === "on", // Checkbox returns "on" if checked
      firstName,
      lastName,
      location,
      phone,
      email,
      assistance,
      availability,
      skills,
      travelRange
    });

    await newVolunteer.save().then((a)=>console.log("Stoerd",a)).catch((err)=>console.log("er",err));
    // console.log( {
    //   orgCheck,
    //   firstName,
    //   lastName,
    //   location,
    //   phone,
    //   email,
    //   assistance,
    //   availability,
    //   skills,
    //   travelRange
    // })
    res.send(`<h2>✅ Thank you, ${firstName}! Your offer has been recorded.</h2><a href="/offhelp">Go Back</a>`);
  } catch (err) {
    console.error("Error saving volunteer:", err);
    res.status(500).send("❌ Internal Server Error. Please try again.");
  }
});



// app.post("/location", (req, res) => {
//     const { lat, lon } = req.body || {}; // fallback to empty object
//     if (!lat || !lon) {
//       return res.status(400).json({ error: "Latitude and longitude are required." });
//     }
  
//     console.log("📍 Received location from frontend:", lat, lon);
//     res.json({ status: "Location received", lat, lon });
//   });
  
const { marked } = require("marked"); // add this at the top of the file

app.get('/location', async (req, res) => {
  try {
    const response = await axios.get('http://ip-api.com/json');

    const disaster = "flood";
    const data = {
      city: response.data.city,
      region: response.data.regionName,
      country: response.data.country,
      lat: response.data.lat,
      lon: response.data.lon,
    };

    const newsData = await news(data.city, disaster);
    const weatherData = await weather(data.city);
    const tweets = await twitter(disaster, data.lat, data.lon, "10km");

    // Get Gemini AI response
    const raw = await gemini({ location: data, tweets, news: newsData, weather: weatherData });
    console.log("🌐 RAW Response:", raw);

    let markdownRaw;

    // If it's a string, process it as markdown
    if (typeof raw.suggestions === "string") {
      markdownRaw = raw.suggestions;
    } else {
      markdownRaw = JSON.stringify(raw, null, 2); // fallback to displaying JSON
    }

    // Convert Markdown to HTML
    const htmlOutput = marked.parse(markdownRaw);

    // Render the view with HTML content
    return res.render("Report.ejs", { data, jdata: htmlOutput });

  } catch (error) {
    console.error("❌ Error in /location:", error.message);
    if (!res.headersSent) {
      return res.status(500).send("Internal Server Error");
    }
  }
});


async function gemini({ location, tweets, news, weather }) {
  // 🧪 Simulated fallback data
  const simulatedTweets = [
    "Water levels rising rapidly near Sinhagad Road.",
    "Multiple vehicles stuck in Kothrud underpass due to flooding!",
    "Pune University Road completely waterlogged. Avoid the route.",
    "Rain hasn't stopped since last night, Hadapsar residents seek help.",
    "Low-lying areas near Deccan flooded – people stranded on rooftops."
  ];

  const simulatedWeather = [
    {
      temperature: "22°C",
      condition: "Heavy Rain",
      humidity: "95%",
      windSpeed: "12 km/h",
      alert: "Red alert issued by IMD for Pune region"
    }
  ];

  const simulatedNews = [
    "Floods wreak havoc in Pune as rains continue unabated.",
    "Local authorities deploy rescue teams in low-lying areas.",
    "Schools and colleges shut across Pune district.",
    "Power outages in multiple areas due to flooding.",
    "IMD forecasts more rainfall for the next 48 hours."
  ];

  const simulatedVolunteers = [
    { name: "Amit", skill: "First Aid", lat: 18.5204, lon: 73.8567 },
    { name: "Sneha", skill: "Food Distribution", lat: 18.509, lon: 73.855 },
    { name: "Ravi", skill: "Rescue Operations", lat: 18.5301, lon: 73.8702 }
  ];

  const simulatedNGOs = [
    { name: "Relief Pune", contact: "9876543210", area: "Kothrud" },
    { name: "Hope Foundation", contact: "9765432109", area: "Hadapsar" }
  ];

  const simulatedRiskZones = [
    { zone: "Sinhagad Road", riskLevel: "High" },
    { zone: "Deccan", riskLevel: "Medium" },
    { zone: "Kothrud", riskLevel: "High" },
    { zone: "Wakad", riskLevel: "Low" }
  ];

  // 🧠 Use real or simulated data (fallback logic)
  const safeTweets = Array.isArray(tweets) && tweets.length > 0 ? tweets : simulatedTweets;
  const safeWeather = Array.isArray(weather) && weather.length > 0 ? weather : simulatedWeather;
  const safeNews = Array.isArray(news) && news.length > 0 ? news : simulatedNews;

  const safeVolunteers = simulatedVolunteers; // Extend for real-time logic later
  const safeNGOs = simulatedNGOs;
  const safeRiskZones = simulatedRiskZones;

  // 🧾 Format data
  const formattedTweets = safeTweets.join("\n");
  const formattedWeather = safeWeather.map(w => 
    `Temperature: ${w.temperature}, Condition: ${w.condition}, Humidity: ${w.humidity}, Wind: ${w.windSpeed}, Alert: ${w.alert}`
  ).join("\n");

  const formattedNews = safeNews.map((n, i) => `News ${i + 1}: ${n.title || n}`).join("\n");
  const formattedVolunteers = JSON.stringify(safeVolunteers, null, 2);
  const formattedNGOs = JSON.stringify(safeNGOs, null, 2);
  const formattedRiskZones = JSON.stringify(safeRiskZones, null, 2);

  // 🪄 Gemini Prompt
  const prompt = `
📍 **Disaster Situation Analysis: ${location.city || "Pune"} (Flood)**

🌧️ **Weather Data**:
${formattedWeather}

📲 **Social Media Signals (Tweets)**:
${formattedTweets}

🗞️ **News Reports**:
${formattedNews}

🧑‍🤝‍🧑 **Volunteer Info**:
${formattedVolunteers}

🏥 **NGO Support**:
${formattedNGOs}

🧭 **Flood Risk Zones**:
${formattedRiskZones}

---

Please provide:
1. 🔍 Real-Time Damage Assessment  
2. 🚚 Optimal Aid Distribution Routes  
3. 🧑‍🤝‍🧑 Volunteer and NGO Coordination  
4. 🔮 Predictive Risk Modeling  
5. 📊 Overall Model Confidence (0–100%)  
6. 🧠 Short reasoning for each insight.
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No suggestions.";
    return { suggestions: text };

  } catch (err) {
    console.error("❌ Gemini API Error:", err.response?.data || err.message);
    return { suggestions: "{}" };
  }
}


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
        // console.log("🌦️ Weather Data:", data);
        // res.json(data);
      } catch (err) {
        console.error("❌ Weather API Error:", err.message);
        // res.status(500).json({ error: 'Weather API failed' });
      }
}




async function twitter(keyword, latitude, longitude, radius = '10km', res) {
  try {
    const geoQuery = `point_radius:[${longitude} ${latitude} ${radius}]`;

    const response = await axios.get(
      `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(`${keyword} ${geoQuery}`)}&max_results=10&tweet.fields=created_at,author_id,geo`,
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

    // console.log("🕎 Tweets:", tweets);
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
      // articles.forEach(article => {
      //   console.log(`\n📰 ${article.index}. ${article.title}`);
      //   console.log(`📅 ${article.date}`);
      //   console.log(`🔗 ${article.link}`);
      //   console.log(`📝 ${article.summary}\n`);
      // });
  
      console.log(articles);
      return articles;
    } catch (err) {
      console.error('❌ Error fetching city-specific news:', err.message);
      return [];
    }
  }
// 🏠 Root
// app.get('/', (req, res) => {
//   res.send('🌍 Welcome to the AI-Powered Disaster Relief API');
// });



app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});



