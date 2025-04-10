const express = require('express');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/apiRoutes'); // path to your routes file

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/', apiRoutes); // mount your routes

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});



//tweeterr api jast test karu nako tyachi limit kami ahe, 15 min thambayla lagty mg


// api endpint
// http://localhost:3000/location
// http://localhost:3000/weather/Pune
// http://localhost:3000/route
// http://localhost:3000/gemini
// http://localhost:3000/twitter/earthquake
