const chat = document.getElementById("chat");
const input = document.getElementById("userInput");

// Send on Enter
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  // --- User message ---
  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.innerText = text;
  chat.appendChild(userMsg);

  input.value = "";
  chat.scrollTop = chat.scrollHeight;

  // --- AI typing placeholder ---
  const aiMsg = document.createElement("div");
  aiMsg.className = "message ai";
  aiMsg.innerText = "🤖 Thinking...";
  chat.appendChild(aiMsg);
  chat.scrollTop = chat.scrollHeight;

  try {
    // ✅ CORRECT: POST request with JSON body
    const res = await fetch("/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: text
      })
    });

    if (!res.ok) {
      throw new Error("Request failed");
    }

    const data = await res.json();
    aiMsg.innerText = data.answer;

  } catch (err) {
    console.error(err);
    aiMsg.innerText = "❌ Error talking to backend";
  }

  chat.scrollTop = chat.scrollHeight;
}
