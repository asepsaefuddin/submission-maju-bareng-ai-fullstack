document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) {
      return;
    }

    // Add user's message to the chat box
    addMessageToChatBox('user', userMessage);
    userInput.value = '';

    // Show "Thinking..." message
    const thinkingMessageId = `bot-thinking-${Date.now()}`;
    addMessageToChatBox('bot', 'Thinking...', thinkingMessageId);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server.');
      }

      const data = await response.json();
      const botReply = data.result;

      if (!botReply) {
        throw new Error('Sorry, no response received.');
      }

      // Replace "Thinking..." with the actual reply
      updateMessage(thinkingMessageId, botReply);

    } catch (error) {
      console.error('Error:', error);
      // Update the "Thinking..." message with an error
      updateMessage(thinkingMessageId, error.message || 'An unexpected error occurred.');
    }
  });

  function addMessageToChatBox(role, content, id = null) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${role}-message`);
    messageElement.textContent = content;
    if (id) {
      messageElement.id = id;
    }
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
  }

  function updateMessage(id, newContent) {
    const messageElement = document.getElementById(id);
    if (messageElement) {
      messageElement.textContent = newContent;
      messageElement.removeAttribute('id'); // Remove id after updating
    }
  }
});