/**
 * Chat Module - Live Messaging Interface
 * Handles real-time messaging, notifications, and user interactions
 */

class ChatInterface {
  constructor() {
    this.currentChatId = '1';
    this.messages = {};
    this.users = {
      '1': { name: 'John Farmer', status: 'online', avatar: 'John+Farmer' },
      '2': { name: 'Sarah Buyer', status: 'offline', avatar: 'Sarah+Buyer' },
      '3': { name: 'Market Admin', status: 'online', avatar: 'Market+Admin' }
    };
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadMessages();
    this.setupResponsive();
  }

  setupEventListeners() {
    // Send message
    document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Chat selection
    document.querySelectorAll('.chat-item').forEach(item => {
      item.addEventListener('click', () => this.selectChat(item));
    });

    // Action buttons
    document.getElementById('attachBtn').addEventListener('click', () => this.attachFile());
    document.getElementById('emojiBtn').addEventListener('click', () => this.showEmojis());
    document.getElementById('recordBtn').addEventListener('click', () => this.recordVoice());
    document.getElementById('newChatBtn').addEventListener('click', () => this.newChat());
    document.getElementById('backToList').addEventListener('click', () => this.backToList());

    // Search
    document.getElementById('searchChats').addEventListener('input', (e) => this.searchChats(e.target.value));

    // Auto-scroll to bottom
    document.getElementById('messageInput').addEventListener('input', () => this.updateInputHeight());
  }

  selectChat(chatElement) {
    // Remove active from all chats
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    chatElement.classList.add('active');

    const chatId = chatElement.getAttribute('data-chat-id');
    this.currentChatId = chatId;

    // Update header
    const user = this.users[chatId];
    document.getElementById('chatHeaderName').textContent = user.name;
    document.getElementById('chatHeaderStatus').textContent = user.status === 'online' ? 'Online' : 'Offline';
    
    const statusIndicator = document.querySelector('.status-indicator');
    statusIndicator.classList.remove('online', 'offline');
    statusIndicator.classList.add(user.status === 'online' ? 'online' : 'offline');

    // Load messages for this chat
    this.loadMessages();
    this.scrollToBottom();
  }

  sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message) return;

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message sent animate-slide-in-right';
    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-bubble">
          <p>${this.escapeHtml(message)}</p>
        </div>
        <span class="message-time">${this.getCurrentTime()}</span>
      </div>
    `;

    // Add to messages area
    document.getElementById('messagesArea').appendChild(messageDiv);

    // Clear input
    input.value = '';
    this.updateInputHeight();

    // Show typing indicator
    setTimeout(() => {
      this.showTypingIndicator();
    }, 500);

    // Simulate response
    setTimeout(() => {
      this.removeTypingIndicator();
      this.addReceivedMessage(this.generateResponse());
    }, 2000 + Math.random() * 2000);

    // Scroll to bottom
    this.scrollToBottom();
  }

  addReceivedMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message received animate-slide-in-left';
    const user = this.users[this.currentChatId];
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <img src="https://ui-avatars.com/api/?name=${user.avatar}&background=166534&color=fff" alt="${user.name}">
      </div>
      <div class="message-content">
        <div class="message-bubble">
          <p>${message}</p>
        </div>
        <span class="message-time">${this.getCurrentTime()}</span>
      </div>
    `;

    document.getElementById('messagesArea').appendChild(messageDiv);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message received typing-message';
    const user = this.users[this.currentChatId];
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <img src="https://ui-avatars.com/api/?name=${user.avatar}&background=166534&color=fff" alt="${user.name}">
      </div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    document.getElementById('messagesArea').appendChild(messageDiv);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const typingMessage = document.querySelector('.typing-message');
    if (typingMessage) {
      typingMessage.style.opacity = '0';
      typingMessage.style.transition = 'opacity 0.3s ease';
      setTimeout(() => typingMessage.remove(), 300);
    }
  }

  generateResponse() {
    const responses = [
      "That sounds great! When can you deliver?",
      "I'll check with the team and get back to you.",
      "Sure, I can arrange that for you.",
      "Thanks for reaching out. Let me know what you need.",
      "Perfect! I'll process your order right away.",
      "Yes, we have that in stock.",
      "Do you need any other information?",
      "Looking forward to working with you!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  attachFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.sendMessage();
        alert(`File "${file.name}" would be uploaded`);
      }
    };
    input.click();
  }

  showEmojis() {
    const emojis = ['😊', '😂', '🎉', '🔥', '💯', '👍', '❤️', '😍', '🤔', '😢'];
    const popover = document.createElement('div');
    popover.className = 'emoji-popover';
    popover.innerHTML = emojis.map(emoji => 
      `<button class="emoji-btn">${emoji}</button>`
    ).join('');

    const emojiBtn = document.getElementById('emojiBtn');
    emojiBtn.parentElement.appendChild(popover);

    popover.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('messageInput');
        input.value += btn.textContent;
        input.focus();
        popover.remove();
      });
    });

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closePopover(e) {
        if (!popover.contains(e.target) && e.target !== emojiBtn) {
          popover.remove();
          document.removeEventListener('click', closePopover);
        }
      });
    }, 0);
  }

  recordVoice() {
    alert('🎤 Voice recording feature coming soon!\n\nYou can attach audio files for now.');
  }

  newChat() {
    alert('Start a new conversation coming soon!');
  }

  backToList() {
    document.querySelector('.chat-sidebar').style.display = 'block';
    document.querySelector('.chat-main').style.display = 'none';
  }

  searchChats(query) {
    document.querySelectorAll('.chat-item').forEach(item => {
      const name = item.querySelector('.chat-item-name').textContent.toLowerCase();
      const message = item.querySelector('.chat-item-message').textContent.toLowerCase();
      
      if (name.includes(query.toLowerCase()) || message.includes(query.toLowerCase())) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  loadMessages() {
    // Clear current messages
    const messagesArea = document.getElementById('messagesArea');
    const dateHeader = messagesArea.querySelector('.message-date-separator');
    while (messagesArea.firstChild !== dateHeader) {
      messagesArea.removeChild(messagesArea.firstChild);
    }

    // In real app, load from database
    // For now, we have the initial messages shown
  }

  updateInputHeight() {
    const input = document.getElementById('messageInput');
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  }

  scrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    setTimeout(() => {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 0);
  }

  getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setupResponsive() {
    // Handle responsive layout
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Mobile view
        const chatMain = document.querySelector('.chat-main');
        if (chatMain.style.display === 'block') {
          document.querySelector('.chat-sidebar').style.display = 'none';
          document.getElementById('backToList').style.display = 'block';
        }
      } else {
        // Desktop view
        document.querySelector('.chat-sidebar').style.display = 'block';
        document.querySelector('.chat-main').style.display = 'block';
        document.getElementById('backToList').style.display = 'none';
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Click on chat item in mobile
    if (window.innerWidth < 768) {
      document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', function() {
          if (window.innerWidth < 768) {
            document.querySelector('.chat-sidebar').style.display = 'none';
            document.querySelector('.chat-main').style.display = 'block';
            document.getElementById('backToList').style.display = 'block';
          }
        });
      });
    }
  }
}

// Initialize chat when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ChatInterface();
});
