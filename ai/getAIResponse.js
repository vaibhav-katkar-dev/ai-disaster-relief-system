import fetch from "node-fetch";

const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget');

const API_KEY = process.env.GEMINI_API_KEY; // Ensure API key is set securely
const STOCK_API_KEY = process.env.STOCK_API_KEY; // For fetching live financial data

async function getAIResponse(userMessage, userSession) {
    if (!API_KEY) {
        console.error("❌ Missing Gemini API Key");
        return "Server Error: Missing API Key.";
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;
    console.log("User Session:", userSession);

    try {
        // ✅ Validate userSession
        if (!userSession || !mongoose.Types.ObjectId.isValid(userSession)) {
            console.error("❌ Invalid userSession:", userSession);
            return "Session Error: Invalid user ID.";
        }

        let transactions = [], budget = [];
        try {
            transactions = await Transaction.find({ userId: userSession });
            budget = await Budget.find({ userId: userSession });
        } catch (dbError) {
            console.error("❌ Database Error:", dbError.message);
            return "Server Error: Unable to fetch financial data.";
        }

        if (!transactions.length && !budget.length) {
            console.warn("⚠️ No financial data found for user:", userSession);
        }

        let income = 0, expenses = 0;
        transactions.forEach(txn => {
            if (txn.type === "income") income += txn.amount;
            else expenses += txn.amount;
        });

        const savings = income - expenses;
        const budgetSummary = budget.map(b => `${b.category}: ₹${b.amount}`).join(", ");

        // ✅ Get Real-World Financial Data (Optional)
        let stockPrice = await getStockMarketData("AAPL"); // Example: Fetch Apple's stock price

        // ✅ Construct AI Prompt
        let aiPrompt = `
        User's Financial Summary:
        - Income: ₹${income}
        - Expenses: ₹${expenses}
        - Savings: ₹${savings}
        - Budget Overview: ${budgetSummary}
        - Apple Stock Price: ₹${stockPrice}

        User's Question: "${userMessage}"

        🟢 Guidelines for the AI Response:
        - Provide a **fact-based** answer using financial and economic principles.
        - Use **scientific reasoning** (budgeting models, economic trends, or statistical analysis).
        - If applicable, mention financial rules like the **50/30/20 budgeting rule** or **investment strategies**.
        - Avoid vague answers; include **data, case studies, or expert opinions** when possible.
        - Keep the response **concise and to the point**.
        `;

        // ✅ Context-Aware Adjustments
        if (expenses > income) {
            aiPrompt += "\n⚠️ Your expenses exceed your income. AI should recommend ways to cut costs.";
        } else if (savings < 1000) {
            aiPrompt += "\n⚠️ Your savings are very low. AI should suggest how to build a better financial buffer.";
        }

        // ✅ Call Gemini AI API
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: aiPrompt }] }],
                generationConfig: {
                    temperature: 0.2, // 🔹 Lower = More factual
                    top_p: 0.9,
                    top_k: 40,
                    max_output_tokens: 500
                }
            })
        });

        const data = await response.json();
        console.log("🔥 Gemini AI Response:", JSON.stringify(data, null, 2));

        // ✅ Handle API errors
        if (!response.ok) {
            throw new Error(data.error?.message || "API request failed");
        }

        let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure, could you clarify? 🤔";

        // ✅ Validate AI Response
        if (aiResponse.includes("I think") || aiResponse.includes("maybe") || aiResponse.includes("possibly")) {
            console.warn("⚠️ AI gave an uncertain response. Requesting a better answer...");
            return "The AI is uncertain. Let me refine the response and get back to you.";
        }

        return aiResponse;
    } catch (error) {
        console.error("❌ Error fetching AI response:", error.message);
        return "Oops! Something went wrong. Please try again.";
    }
}

// ✅ Fetch Live Stock Market Data (Optional)
async function getStockMarketData(symbol) {
    try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${STOCK_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        return data["Global Quote"]?.["05. price"] || "No data available";
    } catch (error) {
        console.error("❌ Stock Market API Error:", error.message);
        return "No stock data available.";
    }
}

module.exports = getAIResponse;
