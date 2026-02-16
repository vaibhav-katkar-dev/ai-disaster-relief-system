const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const Parser = require('rss-parser');
const { marked } = require("marked");
const path = require("path");

dotenv.config();
const app = express();
const parser = new Parser({ headers: { 'User-Agent': 'Mozilla/5.0 (AI-Relief-Agent)' } });
const nodemailer = require("nodemailer");

mongoose.connect("mongodb://127.0.0.1:27017/dh", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
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
const HelpRequest = require("./models/HelpRequest");

const Disaster = require('./models/Disaster'); // Adjust path as needed


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
const riskModelRoutes = require('./routes/riskModel');
app.use('/api/risk', riskModelRoutes);
// const Disaster = require('./models/Disaster');
// const Disaster = require('./models/Disaster'); // Adjust path as needed

// app.get('/api/disasters', async (req, res) => {
//   try {
//     const disasters = await Disaster.find({});
//     res.json(disasters);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


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
  const [latPart, lonPart] = location.split(',');
  const lat = latPart.split(':')[1].trim();
  const lon = lonPart.split(':')[1].trim();
  // console.log("ha re hbhai",lat,lon)
  
  try {
    const info = await transporter.sendMail({
      from: '"Mahesh👻" <maheshs.thombare@gmail.com>',
      to,
      subject: "For verification",
      text: "gqpf efvj lgpn sova",
      html: `<b>Hello Volunteer,</b><br><br>You have been <b>assigned a new help request</b> in your area. Here are the details:<br><br><b>Requester Name:</b>"+${fullName}+" <br><b>Location:</b>"+${location}+"<br><b>Phone:</b> "+${phone}+"<br><b>Type of Help Needed:</b> "+${helpType}+"<br><b>Number of People:</b> "+${peopleCount}+"<br><b>Description:</b> "+${description}+"<br><br><a href='https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}'>get direction</a><br>Please reach out to the requester as soon as possible and confirm their safety.<br><br>Thank you for your continued support and compassion! 💪<br><br>Warm regards,<br><b>Disaster Relief Team</b>`,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Email sending failed:", error.message);
  }
}


const cities = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { name: "Patna", lat: 25.5941, lng: 85.1376 },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
  { name: "Surat", lat: 21.1702, lng: 72.8311 },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 }
];

const disasterTypes = ["Flood", "Earthquake", "Cyclone", "Heatwave", "Landslide"];

function getRandomSeverity() {
  const roll = Math.random();
  if (roll < 0.2) return "High";
  if (roll < 0.5) return "Medium";
  return "Low";
}

app.get('/api/disasters/grouped', (req, res) => {
  const grouped = { High: [], Medium: [], Low: [] };

  cities.forEach(city => {
    const chanceOfDisaster = Math.random();
    if (chanceOfDisaster < 0.6) { // 60% cities affected
      const severity = getRandomSeverity();
      const type = disasterTypes[Math.floor(Math.random() * disasterTypes.length)];

      grouped[severity].push({
        city: city.name,
        location: { lat: city.lat, lng: city.lng },
        severity,
        type,
        timestamp: new Date()
      });
    }
  });

  res.json(grouped);
});


// Utility functions
const reverseGeocode = require("./utils/reverseGeocode");

function getLatLon(locationStr) {
  if (typeof locationStr !== "string") return null;
  const match = locationStr.match(/Lat:\s*([-.\d]+),\s*Lon:\s*([-.\d]+)/);
  return match ? { lat: parseFloat(match[1]), lon: parseFloat(match[2]) } : null;
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Routes
app.get("/", async(req, res) =>{ 
  
  const requests = await HelpRequest.countDocuments();
  const volunteers = await Volunteer.countDocuments();
  const deliveries = Math.floor(requests * 0.3);

  res.render('index', { requests, volunteers, deliveries });
  // res.render("index.ejs")

});
app.get("/map", (req, res) => res.render("home.ejs"));
app.get("/dashboard/login", (req, res) => res.render("admin_login.ejs"));
app.get("/reqhelp", (req, res) => res.render("reqHelp"));
app.get("/offhelp", (req, res) => res.render("offerHelp"));

// Dashboard with location names hhhhh
app.get("/dashboard", async (req, res) => {
  const reqdata = await HelpRequest.find();
  const enrichedData = await Promise.all(reqdata.map(async (item) => {
    const [lat, lon] = item.location.match(/[-+]?[0-9]*\.?[0-9]+/g);
    const locationName = await reverseGeocode(lat, lon);
    return { ...item.toObject(), locationName };
  }));


  const requests = await HelpRequest.countDocuments();
  const volunteers = await Volunteer.countDocuments();
  const deliveries = Math.floor(requests * 0.3);
  res.render("dashboard.ejs", { reqdata: enrichedData,requests, volunteers, deliveries  });
});

// Submit Help Request
app.post("/reqhelp", async (req, res) => {
  try {
    const { fullName, location, phone, helpType, peopleCount, description } = req.body;
    const newRequest = new HelpRequest({ fullName, location, phone, helpType, peopleCount, description });
    await newRequest.save();
    console.log("✅ Help request saved:", newRequest);

    const requestLoc = getLatLon(location);
    if (!requestLoc) return res.status(400).send("❌ Invalid location format. Use: 'Lat: 18.5204, Lon: 73.8567'");

    const volunteers = await Volunteer.find();
    let matched = false;

    for (const volunteer of volunteers) {
      const volunteerLoc = getLatLon(volunteer.location);
      if (!volunteerLoc) continue;

      const distance = calculateDistanceKm(volunteerLoc.lat, volunteerLoc.lon, requestLoc.lat, requestLoc.lon);
      const canTravel = parseFloat(volunteer.travelRange || "0");
      const isHelpTypeMatch = (volunteer.assistance || "").toLowerCase() === helpType.toLowerCase();

      if (distance <= canTravel && isHelpTypeMatch) {
        await HelpRequest.findByIdAndUpdate(newRequest._id, { status: "Assigned" });
        matched = true;
        let volEmail=volunteer.email;
        sendemail(volEmail,helpType,fullName,distance,location,peopleCount,phone,description);
        console.log(`✅ Match Found\n→ Volunteer: ${volunteer.firstName} ${volunteer.lastName}\n→ Distance: ${distance.toFixed(2)} km`);
        break;
      }
    }

    if (!matched) console.log("❌ No matching volunteer found.");
    res.send(`
      <h2>✅ Thank you, ${fullName}! Your offer has been recorded.</h2>
      <p>You will be redirected shortly...</p>
      <script>
        setTimeout(() => {
          window.location.href = "/?success=offered";
        }, 1000); // Redirect after 3 seconds
      </script>
    `);  } catch (err) {
    console.error("❌ Error saving help request:", err);
    res.status(500).send("❌ Internal Server Error.");
  }
});

// Submit Offer to Help
app.post("/offhelp", async (req, res) => {
  try {
    const {
      orgCheck, firstName, lastName, location,
      phone, email, assistance, availability,
      skills, travelRange
    } = req.body;

    const newVolunteer = new Volunteer({
      isOrganization: orgCheck === "on",
      firstName, lastName, location,
      phone, email, assistance,
      availability, skills, travelRange
    });

    await newVolunteer.save();
    // res.redirect("/");
    res.send(`
      <h2>✅ Thank you, ${firstName}! Your offer has been recorded.</h2>
      <p>You will be redirected shortly...</p>
      <script>
        setTimeout(() => {
          window.location.href = "/?success=offered";
        }, 1000); // Redirect after 3 seconds
      </script>
    `);
      } catch (err) {
    console.error("Error saving volunteer:", err);
    res.status(500).send("❌ Internal Server Error.");
  }
});




// Dummy data fallback (optional)
const fallbackNews = ["Flood warning issued", "Rescue operations on standby"];
const fallbackTweets = ["Water levels rising", "Heavy rainfall causing traffic jams"];
const fallbackWeather = [{
  temperature: "23°C",
  condition: "Heavy Rain",
  humidity: "92%",
  windSpeed: "15 km/h",
  alert: "IMD issued red alert"
}];

// 🌍 GET Location-Based Disaster Report
app.get('/location', async (req, res) => {
  try {
    // Step 1: Get User Location by IP
    const response = await axios.get('http://ip-api.com/json');
    const data = {
      city: response.data.city,
      region: response.data.regionName,
      country: response.data.country,
      lat: response.data.lat,
      lon: response.data.lon
    };

    // Step 2: Fetch all data, fallback to safe defaults if fails
    let newsData = [];
    let weatherData = [];
    let tweets = [];

    try {
      newsData = await news(data.city, "flood") || [];
    } catch (err) {
      console.warn("⚠️ News fetch failed:", err.message);
      newsData = fallbackNews;
    }

    try {
      weatherData = await weather(data.city) || [];
    } catch (err) {
      console.warn("⚠️ Weather fetch failed:", err.message);
      weatherData = fallbackWeather;
    }

    try {
      tweets = await twitter("flood", data.lat, data.lon, "10km") || [];
    } catch (err) {
      console.warn("⚠️ Tweets fetch failed:", err.message);
      tweets = fallbackTweets;
    }

    // Step 3: Generate AI summary
    const raw = await gemini({ location: data, tweets, news: newsData, weather: weatherData });

    // Step 4: Convert Markdown → HTML for display
    const markdownRaw = typeof raw.suggestions === "string"
      ? raw.suggestions
      : JSON.stringify(raw, null, 2);
    const htmlOutput = marked.parse(markdownRaw);

    return res.render("Report.ejs", { data, jdata: htmlOutput });

  } catch (error) {
    console.error("❌ Fatal Error in /location route:", error.message);
    if (!res.headersSent) return res.status(500).send("Internal Server Error");
  }
});


// Simulated Gemini AI response
async function gemini({ location, tweets, news, weather }) {
  const city = location.city;
  const region = location.region;
  const country = location.country;

  const weatherData = weather[0] || {
    temperature: "23°C",
    condition: "Heavy Rain",
    humidity: "92%",
    windSpeed: "15 km/h",
    alert: "IMD issued red alert"
  };

  const response = {
    suggestions: `
### 🛟 Disaster Relief Summary for ${city}, ${region}, ${country}

---

#### 📍 Location Details:
- **City**: ${city}
- **Region**: ${region}
- **Country**: ${country}
- **Coordinates**: ${location.lat}, ${location.lon}

---

#### 🌧️ Weather Report:
- **Condition**: ${weatherData.condition}
- **Temperature**: ${weatherData.temperature}
- **Humidity**: ${weatherData.humidity}
- **Wind Speed**: ${weatherData.windSpeed}
- **Alert**: ${weatherData.alert}

---

#### 📰 Latest News:
${news.map((item, i) => `- ${i + 1}. ${item}`).join('\n')}

---

#### 📢 Real-Time Tweets Near You:
${tweets.map((tweet, i) => `- ${i + 1}. ${tweet}`).join('\n')}

---

#### ✅ Actionable Recommendations:
- Stay indoors and avoid flooded roads
- Keep your mobile charged and ready
- Contact nearest shelter or emergency helpline
- Follow alerts from IMD and local authorities
- If stranded, dial emergency services and send your live location

---

#### 🆘 Emergency Contacts (India):
- **National Disaster Helpline**: 1078
- **Police**: 100
- **Ambulance**: 102 / 108
- **Fire Department**: 101

Stay safe. 🌧️💪

---
_Last updated: ${new Date().toLocaleString()}_
`
  };
  return response;
}


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

const API_KEY = "AIzaSyAyEmH1mZmanVJQNI8oes_Vj3DbxG9hDpE"; // Replace with your actual key

// In-memory stack for storing user messages per request
let messageStack = {};

// Handle chat message requests
app.post('/api/chat', async (req, res) => {
    try {
        const { userMessage } = req.body; // Accept user message
        if (!userMessage) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Generate a unique ID for this user (e.g., IP, random ID, or just use a generic)
        const userId = 'guest'; // Or generate dynamically, e.g., random UUID, IP-based, etc.

        // Initialize stack for user if not exists
        if (!messageStack[userId]) {
            messageStack[userId] = [];
        }

        // Push current message into user message stack
        messageStack[userId].push(userMessage);

        // Optionally, limit stack size to the last 5 messages to prevent overload
        if (messageStack[userId].length > 5) {
            messageStack[userId].shift(); // Remove the oldest message
        }

        // Prepare the AI prompt with all previous messages
        const conversationHistory = messageStack[userId]
            .map((msg, index) => `#${index + 1}: ${msg}`)
            .join("\n");

        const aiPrompt = `
🆘 **Disaster Relief Helper Bot**

🧑‍💼 **User ID**: ${userId}
💬 **Recent Queries**:
${conversationHistory}

📌 **Instructions**:
- Answer like a trained disaster response assistant.
- Help users find resources: food, shelter, medicine, volunteer help.
- Ask location or emergency type if needed.
- Use calm, clear, helpful language.
- Respond as if helping during an actual disaster.

🤖 **Response**:
`;

        // Get the response from the AI
        const botResponse = await getAIResponse(aiPrompt);

        // Return the AI response
        res.json({ response: botResponse });

    } catch (error) {
        console.error("❌ Chat Route Error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});
