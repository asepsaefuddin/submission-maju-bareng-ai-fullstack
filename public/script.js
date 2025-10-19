document.addEventListener('DOMContentLoaded', () => {
  const docPreviewWrapper = document.getElementById('doc-preview-wrapper');
  const docFilenameSpan = docPreviewWrapper ? docPreviewWrapper.querySelector('.doc-filename') : null;
  const uploadBtn = document.getElementById('upload-btn');
  const uploadBubbleMenu = document.getElementById('upload-bubble-menu');
  if (uploadBtn && uploadBubbleMenu) {
    uploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      uploadBubbleMenu.style.display = uploadBubbleMenu.style.display === 'none' || !uploadBubbleMenu.style.display ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!uploadBubbleMenu.contains(e.target) && e.target !== uploadBtn) {
        uploadBubbleMenu.style.display = 'none';
      }
    });
  }
  // Upload bubble menu logic
  const uploadImageBtn = document.getElementById('upload-image-btn');
  const uploadFileBtn = document.getElementById('upload-file-btn');
  const uploadAudioBtn = document.getElementById('upload-audio-btn');
  const fileImageInput = document.getElementById('file-image-input');
  const fileDocInput = document.getElementById('file-doc-input');
  const fileAudioInput = document.getElementById('file-audio-input');

  // State untuk file upload sementara
  let pendingUpload = null;
  if (uploadImageBtn && fileImageInput) {
    uploadImageBtn.addEventListener('click', () => fileImageInput.click());
    fileImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      pendingUpload = { type: 'image', file };
      if (docPreviewWrapper && docFilenameSpan) {
        docFilenameSpan.textContent = file.name;
        docPreviewWrapper.style.display = 'block';
      }
      fileImageInput.value = '';
    });
  }
  if (uploadFileBtn && fileDocInput) {
    uploadFileBtn.addEventListener('click', () => {
      fileDocInput.value = '';
      fileDocInput.click();
    });
    fileDocInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      pendingUpload = { type: 'document', file };
      if (docPreviewWrapper && docFilenameSpan) {
        docFilenameSpan.textContent = file.name;
        docPreviewWrapper.style.display = 'block';
      }
      fileDocInput.value = '';
    });
  }
  if (uploadAudioBtn && fileAudioInput) {
    uploadAudioBtn.addEventListener('click', () => fileAudioInput.click());
    fileAudioInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      pendingUpload = { type: 'audio', file };
      if (docPreviewWrapper && docFilenameSpan) {
        docFilenameSpan.textContent = file.name;
        docPreviewWrapper.style.display = 'block';
      }
      fileAudioInput.value = '';
    });
  }
  // Microphone button implementation
  const micBtn = document.getElementById('mic-btn');
  const userInput = document.getElementById('user-input');
  let mediaRecorder, audioChunks = [];

  if (micBtn) {
    micBtn.textContent = '🎙️';
    let isRecording = false;
    let stopTimeout = null;
    micBtn.addEventListener('click', async () => {
      if (!isRecording) {
        micBtn.textContent = '⏹️';
        isRecording = true;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];
          mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
          mediaRecorder.onstop = async () => {
            isRecording = false;
            micBtn.textContent = '🎙️';
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            userInput.value = 'Loading...';
            try {
              const res = await fetch('/generate-from-audio', { method: 'POST', body: formData });
              const data = await res.json();
              let transcript = data.data || data.message;
              if (transcript && transcript.trim()) {
                transcript = transcript.replace(/^(Berikut( adalah)? transkrip( audio)?( singkat| tersebut)?|Berikut adalah transkripsi dari rekaman audio tersebut):?\s*/i, 'hasil rekaman: ');
                setTimeout(() => {
                  userInput.value = transcript.trim();
                }, 700);
              } else {
                userInput.value = '';
                alert('Gagal mendapatkan transkrip audio.');
              }
            } catch (err) {
              userInput.value = '';
              alert('Gagal mengirim audio ke server.');
            }
          };
          mediaRecorder.start();
          stopTimeout = setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }, 30000);
        } catch (err) {
          isRecording = false;
          micBtn.textContent = '🎙️';
          alert('Tidak bisa mengakses mikrofon: ' + err.message);
        }
      } else {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          if (stopTimeout) clearTimeout(stopTimeout);
        }
      }
    });
  }

  const chatForm = document.getElementById('chat-form');
  const chatBox = document.getElementById('chat-box');

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = userInput.value.trim();
    if (pendingUpload) {
      addMessageToChatBox('user', pendingUpload.file.name);
      if (userMessage) {
        addMessageToChatBox('user', userMessage);
      }
      userInput.value = '';
      const thinkingMessageId = `bot-thinking-${Date.now()}`;
      addMessageToChatBox('bot', `Processing ${pendingUpload.type}...`, thinkingMessageId);
      const formData = new FormData();
      if (pendingUpload.type === 'image') formData.append('image', pendingUpload.file);
      if (pendingUpload.type === 'document') formData.append('document', pendingUpload.file);
      if (pendingUpload.type === 'audio') formData.append('audio', pendingUpload.file);
      if (userMessage) formData.append('prompt', userMessage);
      let endpoint = '';
      if (pendingUpload.type === 'image') endpoint = '/generate-from-image';
      if (pendingUpload.type === 'document') endpoint = '/generate-from-document';
      if (pendingUpload.type === 'audio') endpoint = '/generate-from-audio';
      try {
        const res = await fetch(endpoint, { method: 'POST', body: formData });
        const data = await res.json();
        updateMessage(thinkingMessageId, data.data || data.message);
      } catch (err) {
        updateMessage(thinkingMessageId, `Failed to upload ${pendingUpload.type}.`);
      }
      pendingUpload = null;
      if (fileImageInput) fileImageInput.value = '';
      if (fileDocInput) fileDocInput.value = '';
      if (fileAudioInput) fileAudioInput.value = '';
      if (docPreviewWrapper) docPreviewWrapper.style.display = 'none';
      return;
    }
    if (!userMessage) {
      return;
    }
    addMessageToChatBox('user', userMessage);
    userInput.value = '';
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
      updateMessage(thinkingMessageId, botReply);
    } catch (error) {
      console.error('Error:', error);
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
    chatBox.scrollTop = chatBox.scrollHeight; 
  }

  function updateMessage(id, newContent) {
    const messageElement = document.getElementById(id);
    if (messageElement) {
      const sanitizedHtml = marked.parse(newContent, { breaks: true, gfm: true, highlight: (code, lang) => {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      }});
      messageElement.innerHTML = sanitizedHtml;
      messageElement.removeAttribute('id'); 

     
      const codeBlocks = messageElement.querySelectorAll('pre');
      codeBlocks.forEach(pre => {
        const code = pre.querySelector('code');
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.textContent = 'Copy';
        
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(code.textContent).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
              copyButton.textContent = 'Copy';
            }, 2000);
          }).catch(err => {
            console.error('Failed to copy code: ', err);
            copyButton.textContent = 'Error';
          });
        });

        pre.appendChild(copyButton);
      });
    }
  }
});