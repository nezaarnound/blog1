function loadNavbar() {
    const container = document.getElementById('navbar-container');
    if (!container) return;
    
    const token = getToken();
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login') || currentPath.includes('register');
    
    let basePath = '';
    if (currentPath.includes('/pages/')) {
        basePath = '../';
    } else {
        basePath = '';
    }
    
    let navMenu = '';
    let authButtons = '';
    let unreadCount = parseInt(localStorage.getItem('unreadMessages') || '0');
    
    if (token && !isAuthPage) {
        navMenu = `
            <div class="nav-menu">
                <a href="${basePath}index.html" class="nav-link">Home</a>
                <a href="${basePath}pages/dashboard.html" class="nav-link">Dashboard</a>
                <a href="${basePath}pages/create-post.html" class="nav-link">Write Post</a>
                <a href="${basePath}pages/chat.html" class="nav-link nav-chat">
                    <i class="fas fa-comment-dots"></i> Chat
                    <span id="chatUnreadBadge" class="unread-badge-nav" style="${unreadCount > 0 ? 'display:flex' : 'display:none'}">${unreadCount > 0 ? unreadCount : ''}</span>
                </a>
            </div>
        `;
        authButtons = `
            <div class="nav-auth">
                <div class="user-email">
                    <i class="fas fa-user-circle"></i> ${localStorage.getItem('userEmail') || 'User'}
                </div>
                <button class="btn btn-outline" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        `;
    } else {
        navMenu = `<div class="nav-menu"><a href="${basePath}index.html" class="nav-link">Home</a></div>`;
        authButtons = `
            <div class="nav-auth">
                <a href="${basePath}pages/login.html" class="btn btn-outline">Login</a>
                <a href="${basePath}pages/register.html" class="btn btn-primary">Sign Up</a>
            </div>
        `;
    }
    
    container.innerHTML = `
        <nav class="navbar">
            <div class="container">
                <div class="nav-brand">
                    <a href="${basePath}index.html">
                        <i class="fas fa-blog"></i>
                        <span>Blog1</span>
                    </a>
                </div>
                ${navMenu}
                ${authButtons}
            </div>
        </nav>
    `;
}

function updateUnreadBadge() {
    const badge = document.getElementById('chatUnreadBadge');
    const unreadCount = parseInt(localStorage.getItem('unreadMessages') || '0');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Make logout function global
window.logout = function() {
    console.log('Logout clicked');
    localStorage.clear();
    window.location.href = '../index.html';
};

window.updateUnreadBadge = updateUnreadBadge;