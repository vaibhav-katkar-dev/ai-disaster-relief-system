document.addEventListener("DOMContentLoaded", async () => {
    const botIcon = document.getElementById("bot-icon");
    const botChat = document.getElementById("bot-chat");
    const closeBot = document.getElementById("close-bot");
    const sendMessage = document.getElementById("send-message");
    const userMessageInput = document.getElementById("user-message");
    const botMessages = document.getElementById("bot-messages");

    let userSession = null;

    // 🟢 First, Check if userSession is Passed via EJS
    let ejsUserSessionElement = document.getElementById("huid");
    if (ejsUserSessionElement) {
        userSession = ejsUserSessionElement.value.trim();
    }

    // 🟢 If EJS `userSession` is not available, Fetch from Session API
    if (!userSession) {
        userSession = await getSessionData();
    }

    console.log("✅ Final User Session:", userSession);

    // 🔵 Function to Fetch Session Data (For Dashboard)
    async function getSessionData() {
        try {
            const response = await fetch("/api/session", {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

            const data = await response.json();
            console.log("🔵 User Session Data from API:", data);
            return data.userSession || "guest";
        } catch (error) {
            console.error("❌ Error fetching session data:", error);
            return "guest"; // Default fallback
        }
    }

    // 🟢 Ensure Chatbox Opens and Closes Properly
    botIcon.addEventListener("click", () => {
        botChat.classList.toggle("show");
    });

    closeBot.addEventListener("click", () => {
        botChat.classList.remove("show");
    });

    // 🟢 Click Outside to Close
    document.addEventListener("click", (event) => {
        if (!botChat.contains(event.target) && event.target !== botIcon) {
            botChat.classList.remove("show");
        }
    });

    // 🟢 Handle Sending Messages
    sendMessage.addEventListener("click", sendUserMessage);
    userMessageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendUserMessage();
        }
    });

    async function sendUserMessage() {
        const userMessage = userMessageInput.value.trim();
        if (!userMessage.replace(/\s/g, "").length) return;

        appendMessage(userMessage, ["user-text"]);
        userMessageInput.value = "";

        const typingIndicator = appendMessage("Thinking...", ["bot-text", "typing"]);

        try {
            console.log("User Session:", userSession);

            const botResponse = await getAIResponse(userMessage, userSession);

            typingIndicator.remove();
            appendMessage(botResponse, ["bot-text"]);
        } catch (error) {
            console.error("❌ Error:", error);
            typingIndicator.remove();
            appendMessage("Something went wrong, please try again.", ["bot-text", "error-text"]);
        }
    }

    function appendMessage(message, classNames = []) {
        const messageElement = document.createElement("p");
        messageElement.textContent = message;
        classNames.forEach(className => messageElement.classList.add(className));
        botMessages.appendChild(messageElement);
        botMessages.scrollTop = botMessages.scrollHeight;
        return messageElement;
    }

    async function getAIResponse(userMessage, userSession) {
        try {
            console.log("Sending request:", { userMessage, userSession });

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userMessage, userSession })
            });

            if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

            const data = await response.json();
            console.log("🟢 AI Response:", data);

            return data.response || "I'm not sure, could you clarify? 🤔";
        } catch (error) {
            console.error("❌ Failed to fetch AI response:", error);
            return "Something went wrong, please try again.";
        }
    }
});
