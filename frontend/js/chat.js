let currentChatUser = null;
let refreshInterval = null;

async function loadConversations() {
    const container = document.getElementById('conversationsList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            container.innerHTML = '<div class="error">Please login first</div>';
            return;
        }
        
        const usersRes = await fetch('http://localhost:3005/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        
        const convRes = await fetch('http://localhost:3005/api/chat/conversations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const convData = await convRes.json();
        
        const currentUserId = localStorage.getItem('userId');
        const otherUsers = usersData.users?.filter(u => u.id != currentUserId) || [];
        const conversations = convData.conversations || [];
        
        let totalUnread = 0;
        conversations.forEach(conv => {
            totalUnread += conv.unreadCount || 0;
        });
        localStorage.setItem('unreadMessages', totalUnread);
        if (typeof updateUnreadBadge === 'function') updateUnreadBadge();
        if (typeof updateFloatingBadge === 'function') updateFloatingBadge();
        
        let html = '';
        
        if (otherUsers.length > 0) {
            html += `<div class="section-title">📱 Start New Chat</div>`;
            otherUsers.forEach(user => {
                html += `
                    <div class="user-item" onclick="selectUser(${user.id}, '${user.email}')">
                        <div class="user-avatar"><i class="fas fa-user-circle"></i></div>
                        <div class="user-details">
                            <div class="user-name">${escapeHtml(user.email.split('@')[0])}</div>
                            <div class="user-email">${escapeHtml(user.email)}</div>
                        </div>
                        <button class="chat-btn">💬 Chat</button>
                    </div>
                `;
            });
        }
        
        if (conversations.length > 0) {
            html += `<div class="section-title">💬 Recent Chats</div>`;
            conversations.forEach(conv => {
                const userName = conv.user?.email?.split('@')[0] || 'User';
                const lastMsg = conv.lastMessage?.content?.substring(0, 40) || '';
                html += `
                    <div class="conversation-item" onclick="selectUser(${conv.user.id}, '${conv.user.email}')">
                        <div class="conv-avatar"><i class="fas fa-user-circle"></i></div>
                        <div class="conv-details">
                            <div class="conv-name">${escapeHtml(userName)} ${conv.unreadCount > 0 ? `<span class="unread-dot">●</span>` : ''}</div>
                            <div class="conv-last">${escapeHtml(lastMsg)}</div>
                        </div>
                        ${conv.unreadCount > 0 ? `<div class="unread-badge">${conv.unreadCount}</div>` : ''}
                    </div>
                `;
            });
        }
        
        if (html === '') {
            container.innerHTML = `<div class="no-users"><i class="fas fa-users"></i><p>No other users found</p><small>Ask someone to register!</small></div>`;
        } else {
            container.innerHTML = html;
        }
    } catch (error) {
        container.innerHTML = '<div class="error">Error loading users</div>';
    }
}

async function selectUser(userId, userEmail) {
    currentChatUser = { id: userId, email: userEmail };
    
    document.getElementById('chatHeader').innerHTML = `<h3><i class="fas fa-user"></i> Chat with ${escapeHtml(userEmail.split('@')[0])}</h3><small>${escapeHtml(userEmail)}</small>`;
    document.getElementById('chatInput').style.display = 'flex';
    document.getElementById('messageInput').focus();
    
    await loadMessages(userId);
}

async function loadMessages(otherUserId) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Loading messages...</div>';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3005/api/chat/${otherUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const currentUserId = localStorage.getItem('userId');
        
        if (data.success && data.messages) {
            if (data.messages.length === 0) {
                container.innerHTML = `<div class="empty-chat"><i class="fas fa-comment-dots"></i><p>No messages yet</p><small>Send a message to start!</small></div>`;
                return;
            }
            
            let messagesHtml = '';
            data.messages.forEach(msg => {
                const isSent = msg.senderId == currentUserId;
                messagesHtml += `
                    <div class="message ${isSent ? 'sent' : 'received'}">
                        <div class="message-bubble">${escapeHtml(msg.content)}</div>
                        <div class="message-time">${new Date(msg.createdAt).toLocaleTimeString()}</div>
                    </div>
                `;
            });
            
            container.innerHTML = messagesHtml;
            container.scrollTop = container.scrollHeight;
            
            // Mark messages as read
            let unreadMessages = 0;
            data.messages.forEach(msg => {
                if (msg.receiverId == currentUserId && !msg.isRead) unreadMessages++;
            });
            if (unreadMessages > 0) {
                const currentUnread = parseInt(localStorage.getItem('unreadMessages') || '0');
                localStorage.setItem('unreadMessages', Math.max(0, currentUnread - unreadMessages));
                if (typeof updateUnreadBadge === 'function') updateUnreadBadge();
                if (typeof updateFloatingBadge === 'function') updateFloatingBadge();
                loadConversations();
            }
        }
    } catch (error) {
        container.innerHTML = '<div class="error">Error loading messages</div>';
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content) {
        alert('Please enter a message');
        return;
    }
    
    if (!currentChatUser) {
        alert('Please select a user first');
        return;
    }
    
    const btn = document.querySelector('.chat-input button');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Sending...';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3005/api/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                receiverId: currentChatUser.id,
                content: content
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            input.value = '';
            await loadMessages(currentChatUser.id);
            await loadConversations();
        } else {
            alert('Error: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        alert('Error sending message');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        if (currentChatUser) {
            loadMessages(currentChatUser.id);
        }
        loadConversations();
    }, 3000);
}

window.selectUser = selectUser;
window.sendMessage = sendMessage;
window.loadConversations = loadConversations;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof loadConversations === 'function') {
        loadConversations();
        startAutoRefresh();
    }
});