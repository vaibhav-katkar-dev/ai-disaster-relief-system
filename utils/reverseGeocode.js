// // utils/reverseGeocode.js
// const fetch = require("node-fetch");

// async function reverseGeocode(lat, lon) {
//   const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
//   const response = await fetch(url, {
//     headers: { 'User-Agent': 'DisasterHelpApp/1.0' }
//   });
//   const data = await response.json();
//   return data.address ? data.address.city || data.address.town || data.address.village || data.display_name : 'Unknown location';
// }

// module.exports = reverseGeocode;


const fetch = require("node-fetch");

async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: {
          "User-Agent": "yourappname/1.0 (your@email.com)" // <-- Required
        },
        timeout: 10000 // optional: 10 seconds timeout
      }
    );

    if (!response.ok) throw new Error("Response not OK");

    const data = await response.json();
    return data.address?.city || data.address?.town || data.address?.village || "Unknown";
  } catch (error) {
    console.error("Reverse geocoding failed:", error.message);
    return "Location unavailable";
  }
}
module.exports = reverseGeocode;
