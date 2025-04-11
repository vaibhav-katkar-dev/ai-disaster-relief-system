const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
//hh
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
const Parser = require('rss-parser');
const { marked } = require("marked");
const path = require("path");

dotenv.config();
const app = express();
const parser = new Parser({ headers: { 'User-Agent': 'Mozilla/5.0 (AI-Relief-Agent)' } });

mongoose.connect("mongodb://127.0.0.1:27017/disasterHelp2", {
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
app.set("views", path.join(__dirname, "views"));
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

// Dashboard with location names
app.get("/dashboard", async (req, res) => {
  const reqdata = await HelpRequest.find();
  const enrichedData = await Promise.all(reqdata.map(async (item) => {
    const [lat, lon] = item.location.match(/[-+]?[0-9]*\.?[0-9]+/g);
    const locationName = await reverseGeocode(lat, lon);
    return { ...item.toObject(), locationName };
  }));
  res.render("dashboard.ejs", { reqdata: enrichedData });
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

        const updatedDoc = await HelpRequest.findByIdAndUpdate(
          newRequest._id,
          { status: "Assigned" },
          { new: true } // return the updated document
        );
        
        console.log(updatedDoc);
        let volEmail=volunteer.email;
        sendemail(volEmail,helpType,fullName,distance,location,peopleCount,phone,description);

        await HelpRequest.findByIdAndUpdate(newRequest._id, { status: "Assigned" });

        matched = true;

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

// Report Page
app.get('/location', async (req, res) => {
  try {
    const response = await axios.get('http://ip-api.com/json');
    const data = {
      city: response.data.city,
      region: response.data.regionName,
      country: response.data.country,
      lat: response.data.lat,
      lon: response.data.lon
    };

    const newsData = await news(data.city, "flood");
    const weatherData = await weather(data.city);
    const tweets = await twitter("flood", data.lat, data.lon, "10km");
    const raw = await gemini({ location: data, tweets, news: newsData, weather: weatherData });

    const markdownRaw = typeof raw.suggestions === "string" ? raw.suggestions : JSON.stringify(raw, null, 2);
    const htmlOutput = marked.parse(markdownRaw);
    return res.render("Report.ejs", { data, jdata: htmlOutput });

  } catch (error) {
    console.error("❌ Error in /location:", error.message);
    if (!res.headersSent) return res.status(500).send("Internal Server Error");
  }
});

// Simulated Gemini AI response
async function gemini({ location, tweets, news, weather }) {
  const simulatedTweets = [
    "Water levels rising near Sinhagad Road.",
    "Multiple vehicles stuck in Kothrud underpass.",
    "Pune University Road flooded. Avoid the area.",
    "Continuous rain in Hadapsar.",
    "Deccan flooded – people stranded."
  ];

  const simulatedWeather = [{ temperature: "22°C", condition: "Heavy Rain", humidity: "95%", windSpeed: "12 km/h", alert: "Red alert issued by IMD for Pune" }];
  const simulatedNews = [
    "Floods cause havoc in Pune.",
    "Rescue teams deployed.",
    "Schools shut due to waterlogging.",
    "Power outages reported.",
    "Heavy rainfall forecasted for 48 hrs."
  ];

  const response = {
    suggestions: `
### 🛟 Disaster Relief Summary

**📍 Location**: ${location.city}, ${location.region}, ${location.country}

**🌧️ Weather**: ${weather[0]?.condition || simulatedWeather[0].condition}

**📢 Alerts**:
- ${weather[0]?.alert || simulatedWeather[0].alert}
- ${news[0] || simulatedNews[0]}

**📲 Social Media Reports**:
${(tweets || simulatedTweets).map(t => `- ${t}`).join('\n')}

**✅ Recommendations**:
- Avoid low-lying areas
- Contact local NGOs
- Keep emergency contacts handy
`
  };
  return response;
}

// Dummy handlers (replace with real ones if you have logic)
async function news(city, disaster) {
  return [`Major ${disaster} in ${city}`, "Rescue teams on alert"];
}
async function weather(city) {
  return [{ condition: "Heavy Rain", alert: "Flood warning in effect" }];
}
async function twitter(topic, lat, lon, radius) {
  return ["Tweet 1 about " + topic, "Tweet 2 near your location"];
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



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

