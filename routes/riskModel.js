// routes/riskModel.js
const express = require('express');
const router = express.Router();
const { faker } = require('@faker-js/faker');

// Data generation & risk scoring functions
function generateSampleZones(count = 100) {
  const zones = [];
  for (let i = 0; i < count; i++) {
    zones.push({
      name: faker.location.city(),
      populationDensity: faker.number.int({ min: 500, max: 20000 }),
      historicalDisasters: faker.number.int({ min: 0, max: 10 }),
      weatherSeverityIndex: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
      infrastructureScore: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
    });
  }
  return zones;
}

function calculateRiskScore(zone) {
  const weights = {
    populationDensity: 0.2,
    historicalDisasters: 0.3,
    weatherSeverityIndex: 0.3,
    infrastructureScore: 0.2,
  };

  const infraRisk = 1 - zone.infrastructureScore;

  const score =
    (zone.populationDensity / 20000) * weights.populationDensity +
    (zone.historicalDisasters / 10) * weights.historicalDisasters +
    zone.weatherSeverityIndex * weights.weatherSeverityIndex +
    infraRisk * weights.infrastructureScore;

  return Number(score.toFixed(3));
}

// EJS render route
router.get('/predict-risk', (req, res) => {
  const zones = generateSampleZones(100);
  const topZones = zones
    .map(zone => ({ ...zone, riskScore: calculateRiskScore(zone) }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  res.render('aiPredict.ejs', { zones: topZones });
});



router.get('/test', (req, res) => {
    res.send("✅ Route works!");
  });
  
module.exports = router;
