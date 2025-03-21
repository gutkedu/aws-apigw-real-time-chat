// DOM elements
const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const statusIndicator = document.getElementById("status");
const themeToggle = document.getElementById("theme-toggle");
const themeColor = document.getElementById("theme-color");

// Theme constants
const THEME_KEY = "chat-theme-preference";

// Variables
let socket = null;
let reconnectAttempt = 0;
const maxReconnectAttempts = 5;

// API endpoints
const API_GATEWAY_URL =
  "https://b5nevg72lc.execute-api.us-east-1.amazonaws.com/dev";

const WEBSOCKET_API_URL =
  "wss://6wrv63btff.execute-api.us-east-1.amazonaws.com/dev";

/**
 * Function to set the theme
 */
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  // Update meta theme-color for mobile browsers
  if (theme === "dark") {
    themeColor.setAttribute("content", "#2c3e50");
  } else {
    themeColor.setAttribute("content", "#4a69bd");
  }
}

/**
 * Initialize theme from saved preference or system preference
 */
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    // Check if user has dark mode preference in their OS
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setTheme(prefersDark ? "dark" : "light");
  }
}

/**
 * Fetches last messages from REST API
 */
async function fetchLastMessages() {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/chat/last-messages`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Display history messages
    if (data.messages && Array.isArray(data.messages)) {
      // Clear any placeholder or loading messages
      messagesContainer.innerHTML = "";

      // Messages are returned newest first, but we want to display oldest first
      const sortedMessages = [...data.messages].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      // Add messages in chronological order (oldest first)
      sortedMessages.forEach((message) => {
        // Create a clean message object in the format expected by displayMessage
        const formattedMessage = {
          action: "receiveMessage",
          sender: message.sender,
          content: message.content,
          timestamp: message.createdAt,
          id: message.id,
        };

        displayMessage(formattedMessage);
      });

      // Scroll to bottom after adding history
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Add a system message indicating the separation between history and new messages
      const dividerDiv = document.createElement("div");
      dividerDiv.classList.add("message", "system", "divider");
      dividerDiv.textContent = "— Recent Messages Above • New Messages Below —";
      messagesContainer.appendChild(dividerDiv);
    }
  } catch (error) {
    console.error("Error fetching message history:", error);
    const errorDiv = document.createElement("div");
    errorDiv.classList.add("message", "system", "error");
    errorDiv.textContent =
      "Failed to load message history. Please try refreshing the page.";
    messagesContainer.appendChild(errorDiv);
  }
}

function generateClientId(length = 8) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Establishes a WebSocket connection to the chat server.
 */
function connect() {
  if (socket) {
    socket.close();
  }

  try {
    // Get or generate the client ID first
    const clientId = generateClientId(12);

    // Append the clientId as a query parameter to the WebSocket URL
    const wsUrlWithClientId = `${WEBSOCKET_API_URL}?clientId=${encodeURIComponent(
      clientId
    )}`;

    // Connect with the client ID in the URL
    socket = new WebSocket(wsUrlWithClientId);

    socket.onopen = () => {
      statusIndicator.classList.remove("offline");
      statusIndicator.classList.add("online");
      messageInput.disabled = false;
      sendButton.disabled = false;
      reconnectAttempt = 0;

      fetchLastMessages();
    };

    // Rest of the function remains the same
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      displayMessage(data);
    };

    socket.onclose = (event) => {
      statusIndicator.classList.remove("online");
      statusIndicator.classList.add("offline");
      messageInput.disabled = true;
      sendButton.disabled = true;

      // Try to reconnect with exponential backoff
      if (reconnectAttempt < maxReconnectAttempts) {
        reconnectAttempt++;
        const timeout = reconnectAttempt * 2000;
        setTimeout(connect, timeout);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  } catch (error) {
    console.error("Failed to connect to WebSocket:", error);
  }
}

/**
 * Sends a user message to the server through WebSocket.
 */
/**
 * Sends a user message to the server through WebSocket.
 */
function sendMessage() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  const content = messageInput.value.trim();

  if (content) {
    // Validate message length
    if (content.length < 1 || content.length > 150) {
      alert("Message must be between 1 and 150 characters");
      return;
    }

    const payload = {
      action: "sendMessage",
      content: content,
    };

    socket.send(JSON.stringify(payload));

    // Clear input after sending
    messageInput.value = "";

    // Focus the input field for easier continuous messaging
    messageInput.focus();

    // Display the message locally on the right side
    displayLocalMessage(content);
  }
}

/**
 * Displays the user's own messages on the right side
 */
function displayLocalMessage(content) {
  // Create message container
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "outgoing");

  // Create message text
  const messageText = document.createElement("div");
  messageText.textContent = content;
  messageDiv.appendChild(messageText);

  // Add timestamp
  const now = new Date();
  const timestampSpan = document.createElement("div");
  timestampSpan.classList.add("timestamp");
  timestampSpan.textContent = formatTime(now);
  messageDiv.appendChild(timestampSpan);

  // Add message to container
  messagesContainer.appendChild(messageDiv);

  // Auto-scroll to the bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Displays a message in the chat UI.
 * Only displays incoming messages from the server.
 */
function displayMessage(data) {
  // Check if this is a system message
  const isSystemMessage = data.action === "systemMessage";

  // Create message container
  const messageDiv = document.createElement("div");

  if (isSystemMessage) {
    // System message
    messageDiv.classList.add("message", "system");
    messageDiv.textContent = data.content;
  } else {
    // Regular message - only display incoming messages
    messageDiv.classList.add("message", "incoming");

    // Create sender display
    const senderSpan = document.createElement("div");
    senderSpan.classList.add("sender");
    senderSpan.textContent = data.sender;
    messageDiv.appendChild(senderSpan);

    // Create message text
    const messageText = document.createElement("div");
    messageText.textContent = data.content;
    messageDiv.appendChild(messageText);
  }

  // Add timestamp
  if (data.timestamp) {
    const date = new Date(data.timestamp);
    messageDiv.title = formatTime(date);

    const timestampSpan = document.createElement("div");
    timestampSpan.classList.add("timestamp");
    timestampSpan.textContent = formatTime(date);
    messageDiv.appendChild(timestampSpan);
  }

  // Add message to container
  messagesContainer.appendChild(messageDiv);

  // Auto-scroll to the bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Formats a date object into a readable time string.
 */
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ===== Event Listeners =====

// Send message button
sendButton.addEventListener("click", sendMessage);

// Enter key to send message
messageInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

// Theme toggle button
themeToggle.addEventListener("click", () => {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme);
});

// Listen for system theme changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      setTheme(e.matches ? "dark" : "light");
    }
  });

// Tab visibility change
document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "visible" &&
    (!socket || socket.readyState !== WebSocket.OPEN)
  ) {
    connect();
  }
});

// Initialize on page load
window.addEventListener("load", () => {
  // Initialize theme
  initTheme();

  // Initialize connection
  connect();
});
