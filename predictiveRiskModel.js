// predictiveRiskModel.js
// ✅ Predictive Risk Modeling Simulation

const { faker } = require('@faker-js/faker');

// -------------------------- Sample Data Generation --------------------------
function generateSampleZones(count = 50) {
  const zones = [];
  for (let i = 0; i < count; i++) {
    zones.push({
      name: faker.location.city(),
      populationDensity: faker.number.int({ min: 500, max: 20000 }), // per sq.km
      historicalDisasters: faker.number.int({ min: 0, max: 10 }), // last 5 years
      weatherSeverityIndex: faker.number.float({ min: 0, max: 1, precision: 0.01 }), // 0 (good) - 1 (extreme)
      infrastructureScore: faker.number.float({ min: 0, max: 1, precision: 0.01 }) // 0 (poor) - 1 (excellent)
    });
  }
  return zones;
}

// -------------------------- Risk Score Calculation --------------------------
function calculateRiskScore(zone) {
  // Weight factors - customizable
  const weights = {
    populationDensity: 0.2,
    historicalDisasters: 0.3,
    weatherSeverityIndex: 0.3,
    infrastructureScore: 0.2,
  };

  // Invert infrastructureScore as lower is worse
  const infraRisk = 1 - zone.infrastructureScore;

  const score =
    (zone.populationDensity / 20000) * weights.populationDensity +
    (zone.historicalDisasters / 10) * weights.historicalDisasters +
    zone.weatherSeverityIndex * weights.weatherSeverityIndex +
    infraRisk * weights.infrastructureScore;

  return Number(score.toFixed(3));
}

// -------------------------- Main Execution --------------------------
function runPredictiveRiskModel() {
  const zones = generateSampleZones(100);

  const zonesWithRisk = zones.map(zone => {
    const riskScore = calculateRiskScore(zone);
    return { ...zone, riskScore };
  });

  // Sort descending by risk
  zonesWithRisk.sort((a, b) => b.riskScore - a.riskScore);

  console.log("\n✅ Top 10 High-Risk Zones (Simulated):\n---------------------------------------");
  zonesWithRisk.slice(0, 10).forEach((z, i) => {
    console.log(`\n${i + 1}. Zone: ${z.name}`);
    console.log(`   Risk Score: ${z.riskScore}`);
    console.log(`   Population Density: ${z.populationDensity}/km²`);
    console.log(`   Disasters (5 yrs): ${z.historicalDisasters}`);
    console.log(`   Weather Severity: ${z.weatherSeverityIndex}`);
    console.log(`   Infrastructure Score: ${z.infrastructureScore}`);
  });
}

// -------------------------- Run --------------------------
runPredictiveRiskModel();
