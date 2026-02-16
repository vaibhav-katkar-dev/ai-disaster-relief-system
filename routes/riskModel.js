// routes/riskModel.js
const express = require('express');
const router = express.Router();
const { faker } = require('@faker-js/faker');

// ✅ Indian cities for context relevance
const indianCities = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Ahmedabad',
  'Lucknow', 'Bhopal', 'Patna', 'Ranchi', 'Guwahati', 'Chandigarh', 'Kochi', 'Thiruvananthapuram',
  'Visakhapatnam', 'Nagpur', 'Indore'
];

// ✅ Data generation for Indian zones
function generateSampleZones(count = 100) {
  const zones = [];
  for (let i = 0; i < count; i++) {
    const city = indianCities[Math.floor(Math.random() * indianCities.length)];
    zones.push({
      name: city,
      populationDensity: faker.number.int({ min: 1000, max: 30000 }), // Indian urban density range
      historicalDisasters: faker.number.int({ min: 0, max: 12 }), // floods, quakes, etc.
      weatherSeverityIndex: faker.number.float({ min: 0.1, max: 1, precision: 0.01 }), // monsoon/drought severity
      infrastructureScore: faker.number.float({ min: 0.1, max: 1, precision: 0.01 }), // 1 = strong infra
    });
  }
  return zones;
}

// ✅ Risk scoring logic
function calculateRiskScore(zone) {
  const weights = {
    populationDensity: 0.2,
    historicalDisasters: 0.3,
    weatherSeverityIndex: 0.3,
    infrastructureScore: 0.2,
  };

  const infraRisk = 1 - zone.infrastructureScore;

  const score =
    (zone.populationDensity / 30000) * weights.populationDensity +
    (zone.historicalDisasters / 12) * weights.historicalDisasters +
    zone.weatherSeverityIndex * weights.weatherSeverityIndex +
    infraRisk * weights.infrastructureScore;

  return Number(score.toFixed(3));
}

// ✅ Main route
router.get('/predict-risk', (req, res) => {
  const zones = generateSampleZones(100);
  const topZones = zones
    .map(zone => ({ ...zone, riskScore: calculateRiskScore(zone) }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  // ✅ Render EJS with a reference note
  res.render('aiPredict.ejs', {
    zones: topZones,
    note: "⚠️ This is simulated data. For real statistics, visit NDMA (https://ndma.gov.in), IMD (https://mausam.imd.gov.in), or the Ministry of Earth Sciences (https://moes.gov.in)."
  });
});

// Test route
router.get('/test', (req, res) => {
  res.send("✅ Route works!");
});

module.exports = router;
