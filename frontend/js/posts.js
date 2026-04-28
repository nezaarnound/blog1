// ========== POSTS WITH AXIOS ==========

// Load all posts (Home Page)
async function loadPosts(page = 1, search = '') {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading posts...</div>';
    
    try {
        let url = `/posts?page=${page}&limit=6`;
        if (search) url = `/posts/search?q=${search}`;
        
        const response = await api.get(url);
        const data = response.data;
        
        if (data.success) {
            displayPosts(data.posts);
            if (!search && data.pagination) {
                displayPagination(data.pagination, page);
            }
        } else {
            grid.innerHTML = '<div class="loading">No posts found</div>';
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        grid.innerHTML = '<div class="loading">Error loading posts. Make sure backend is running on port 3005</div>';
    }
}

// Display posts
async function displayPosts(posts) {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;
    
    if (!posts || posts.length === 0) {
        grid.innerHTML = '<div class="loading">No posts yet. Be the first to create one!</div>';
        return;
    }
    
    const token = getToken();
    const userId = localStorage.getItem('userId');
    
    // Load images for each post
    const postsWithImages = await Promise.all(posts.map(async (post) => {
        const images = await loadPostImages(post.id);
        return { ...post, images };
    }));
    
    grid.innerHTML = postsWithImages.map(post => {
        const isAuthor = post.author?.id == userId;
        
        return `
            <div class="post-card">
                <div class="post-content">
                    <div class="post-meta">
                        <span class="post-author">
                            <i class="fas fa-user-circle"></i> ${post.author?.email?.split('@')[0] || 'Anonymous'}
                        </span>
                        <span><i class="far fa-calendar-alt"></i> ${new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 class="post-title">
                        <a href="pages/post-detail.html?id=${post.id}">${escapeHtml(post.title)}</a>
                    </h3>
                    ${post.images.length > 0 ? `
                        <div class="post-images-grid">
                            ${post.images.map(img => `<img src="${img.url}" alt="Post image" class="post-image">`).join('')}
                        </div>
                    ` : ''}
                    <p class="post-excerpt">${escapeHtml(post.content.substring(0, 150))}${post.content.length > 150 ? '...' : ''}</p>
                    <div class="post-actions">
                        <button onclick="likePost(${post.id}, this)" class="${post.userLiked ? 'liked' : ''}">
                            <i class="fas fa-heart"></i> <span>${post.likesCount || 0}</span>
                        </button>
                        <button onclick="toggleComments(${post.id})">
                            <i class="fas fa-comment"></i> <span class="comment-count-${post.id}">0</span>
                        </button>
                        ${isAuthor ? `
                            <button onclick="editPost(${post.id})" class="btn btn-outline" style="padding: 0.25rem 0.5rem;">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        ` : ''}
                    </div>
                    <div id="comments-${post.id}" class="comments-section" style="display: none;"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Load post images
async function loadPostImages(postId) {
    try {
        const response = await api.get(`/images/post/${postId}`);
        const data = response.data;
        if (data.success) {
            return data.images;
        }
        return [];
    } catch (error) {
        return [];
    }
}

// Display pagination
function displayPagination(pagination, currentPageNum) {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;
    
    if (pagination.pages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    
    let buttons = '';
    for (let i = 1; i <= pagination.pages; i++) {
        buttons += `<button onclick="changePage(${i})" class="${i === currentPageNum ? 'active' : ''}">${i}</button>`;
    }
    paginationDiv.innerHTML = buttons;
}

// Like post
async function likePost(postId, button) {
    const token = getToken();
    if (!token) {
        alert('Please login to like posts');
        window.location.href = 'pages/login.html';
        return;
    }
    
    try {
        const response = await api.post(`/posts/${postId}/like`);
        const data = response.data;
        
        if (data.success) {
            const span = button.querySelector('span');
            if (span) span.textContent = data.likesCount;
            button.classList.toggle('liked');
        }
    } catch (error) {
        console.error('Error liking post:', error);
        alert('Error liking post');
    }
}

// ========== TOGGLE COMMENTS ==========
async function toggleComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    if (!commentsDiv) return;
    
    if (commentsDiv.style.display === 'none') {
        commentsDiv.style.display = 'block';
        await loadCommentsForPost(postId);
    } else {
        commentsDiv.style.display = 'none';
    }
}

// ========== LOAD COMMENTS FOR POST ==========
async function loadCommentsForPost(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    if (!commentsDiv) return;
    
    commentsDiv.innerHTML = '<div class="loading">Loading comments...</div>';
    
    try {
        const response = await api.get(`/comments/post/${postId}`);
        const data = response.data;
        
        if (data.success) {
            const token = getToken();
            const userId = localStorage.getItem('userId');
            
            // Update comment count
            const countSpan = document.querySelector(`.comment-count-${postId}`);
            if (countSpan) countSpan.textContent = data.comments.length;
            
            commentsDiv.innerHTML = `
                <div class="comment-form">
                    <input type="text" id="comment-input-${postId}" placeholder="Write a comment..." autocomplete="off">
                    <button onclick="addComment(${postId})"><i class="fas fa-paper-plane"></i> Send</button>
                </div>
                <div class="comment-list" id="comment-list-${postId}">
                    ${data.comments.map(comment => `
                        <div class="comment-item">
                            <div class="comment-content">
                                <span class="comment-author">
                                    <i class="fas fa-user"></i> ${comment.user?.email?.split('@')[0] || 'Anonymous'}:
                                </span>
                                <span class="comment-text">${escapeHtml(comment.content)}</span>
                            </div>
                            ${comment.userId == userId ? `
                                <button class="delete-comment" onclick="deleteComment(${comment.id}, ${postId})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                    ${data.comments.length === 0 ? '<div class="no-comments">No comments yet. Be the first to comment!</div>' : ''}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsDiv.innerHTML = '<div class="error">Error loading comments</div>';
    }
}

// ========== ADD COMMENT ==========
async function addComment(postId) {
    const token = getToken();
    if (!token) {
        alert('Please login to comment');
        window.location.href = 'pages/login.html';
        return;
    }
    
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) {
        alert('Please enter a comment');
        return;
    }
    
    try {
        const response = await api.post('/comments', { content, postId: parseInt(postId) });
        const data = response.data;
        
        if (data.success) {
            input.value = '';
            await loadCommentsForPost(postId);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Error adding comment');
    }
}

// ========== DELETE COMMENT ==========
async function deleteComment(commentId, postId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    const token = getToken();
    if (!token) return;
    
    try {
        const response = await api.delete(`/comments/${commentId}`);
        const data = response.data;
        
        if (data.success) {
            await loadCommentsForPost(postId);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error deleting comment');
    }
}

// Load my posts (Dashboard)
async function loadMyPosts() {
    const grid = document.getElementById('myPostsGrid');
    if (!grid) return;
    
    const token = getToken();
    if (!token) return;
    
    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading your posts...</div>';
    
    try {
        const response = await api.get('/posts');
        const data = response.data;
        
        if (data.success) {
            const myPosts = data.posts.filter(post => post.author?.id == localStorage.getItem('userId'));
            
            if (myPosts.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-pen-fancy"></i>
                        <p>You haven't created any posts yet.</p>
                        <a href="create-post.html" class="btn btn-primary">Create Your First Post</a>
                    </div>
                `;
                return;
            }
            
            grid.innerHTML = myPosts.map(post => `
                <div class="post-card">
                    <div class="post-content">
                        <div class="post-meta">
                            <span><i class="far fa-calendar-alt"></i> ${new Date(post.createdAt).toLocaleDateString()}</span>
                            <span><i class="fas fa-heart"></i> ${post.likesCount || 0} likes</span>
                        </div>
                        <h3 class="post-title">${escapeHtml(post.title)}</h3>
                        <p class="post-excerpt">${escapeHtml(post.content.substring(0, 120))}...</p>
                        <div class="post-actions">
                            <button onclick="editPost(${post.id})" class="btn btn-outline">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="deletePost(${post.id})" class="btn btn-outline">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                            <a href="post-detail.html?id=${post.id}" class="btn btn-outline">
                                <i class="fas fa-eye"></i> View
                            </a>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading my posts:', error);
        grid.innerHTML = '<div class="loading error">Error loading your posts</div>';
    }
}

// Load stats (Dashboard)
async function loadStats() {
    const token = getToken();
    if (!token) return;
    
    try {
        const response = await api.get('/posts');
        const data = response.data;
        
        if (data.success) {
            const myPosts = data.posts.filter(post => post.author?.id == localStorage.getItem('userId'));
            const totalPostsEl = document.getElementById('totalPosts');
            const totalLikesEl = document.getElementById('totalLikes');
            
            if (totalPostsEl) totalPostsEl.textContent = myPosts.length;
            
            let totalLikes = myPosts.reduce((sum, post) => sum + (post.likesCount || 0), 0);
            if (totalLikesEl) totalLikesEl.textContent = totalLikes;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Create post
async function handleCreatePost(event) {
    event.preventDefault();
    
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const token = getToken();
    
    if (title.length < 3) {
        return showMessage('Title must be at least 3 characters!', 'error');
    }
    
    if (content.length < 10) {
        return showMessage('Content must be at least 10 characters!', 'error');
    }
    
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
    
    try {
        const response = await api.post('/posts', { title, content });
        const data = response.data;
        
        if (data.success) {
            // Upload images if any
            const imageInputs = document.querySelectorAll('#imageUrls input[type="url"]');
            for (const input of imageInputs) {
                if (input.value.trim()) {
                    await api.post('/images/upload', {
                        postId: data.post.id,
                        url: input.value.trim()
                    });
                }
            }
            
            showMessage('Post created successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        showMessage('Error: ' + message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Delete post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
        const response = await api.delete(`/posts/${postId}`);
        const data = response.data;
        
        if (data.success) {
            showMessage('Post deleted successfully!', 'success');
            setTimeout(() => {
                loadMyPosts();
                loadStats();
            }, 1000);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        showMessage('Error: ' + message, 'error');
    }
}

// ========== LOAD SINGLE POST DETAIL ==========
async function loadPostDetail(postId) {
    const container = document.getElementById('postDetail');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading post...</div>';
    
    try {
        const [postRes, imagesRes] = await Promise.all([
            api.get(`/posts/${postId}`),
            api.get(`/images/post/${postId}`)
        ]);
        
        const postData = postRes.data;
        const imagesData = imagesRes.data;
        
        if (postData.success) {
            const post = postData.post;
            const likeCount = post.likesCount || 0;
            const token = getToken();
            const userId = localStorage.getItem('userId');
            const isAuthor = post.author?.id == userId;
            const images = imagesData.success ? imagesData.images : [];
            
            container.innerHTML = `
                <div class="post-detail-header">
                    <h1 class="post-detail-title">${escapeHtml(post.title)}</h1>
                    <div class="post-detail-meta">
                        <span class="post-author">
                            <i class="fas fa-user-circle"></i> ${post.author?.email?.split('@')[0] || 'Anonymous'}
                        </span>
                        <span class="post-date">
                            <i class="far fa-calendar-alt"></i> ${new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span class="post-likes">
                            <i class="fas fa-heart"></i> ${likeCount} likes
                        </span>
                    </div>
                </div>
                ${images.length > 0 ? `
                    <div class="post-detail-images">
                        ${images.map(img => `<img src="${img.url}" alt="Post image" class="post-detail-image">`).join('')}
                    </div>
                ` : ''}
                <div class="post-detail-content">
                    ${escapeHtml(post.content).replace(/\n/g, '<br>')}
                </div>
                <div class="post-detail-actions">
                    <button onclick="likePostDetail(${postId})" class="btn btn-primary">
                        <i class="fas fa-heart"></i> Like (${likeCount})
                    </button>
                    ${isAuthor ? `
                        <button onclick="editPost(${postId})" class="btn btn-outline">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="deletePostAndRedirect(${postId})" class="btn btn-outline">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                    <a href="../index.html" class="btn btn-outline">
                        <i class="fas fa-arrow-left"></i> Back to Home
                    </a>
                </div>
                <div class="comments-section-detail">
                    <h3><i class="fas fa-comments"></i> Comments</h3>
                    <div id="commentsContainer"></div>
                </div>
            `;
            
            await loadCommentsForDetail(postId);
        } else {
            container.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Post not found</h2>
                    <p>The post you are looking for does not exist.</p>
                    <a href="../index.html" class="btn btn-primary">Back to Home</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading post:', error);
        container.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Error loading post</h2>
                <p>${error.response?.data?.message || error.message}</p>
                <a href="../index.html" class="btn btn-primary">Back to Home</a>
            </div>
        `;
    }
}

// ========== LOAD COMMENTS FOR DETAIL PAGE ==========
async function loadCommentsForDetail(postId) {
    const container = document.getElementById('commentsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading comments...</div>';
    
    try {
        const response = await api.get(`/comments/post/${postId}`);
        const data = response.data;
        
        if (data.success) {
            const token = getToken();
            const userId = localStorage.getItem('userId');
            
            container.innerHTML = `
                <div class="comment-form-detail">
                    <input type="text" id="commentInput" placeholder="Write a comment..." autocomplete="off">
                    <button onclick="addCommentDetail(${postId})">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </div>
                <div class="comment-list-detail" id="commentList">
                    ${data.comments.map(comment => `
                        <div class="comment-item-detail" id="comment-${comment.id}">
                            <div class="comment-header">
                                <span class="comment-author-detail">
                                    <i class="fas fa-user"></i> ${comment.user?.email?.split('@')[0] || 'Anonymous'}
                                </span>
                                <span class="comment-date">
                                    ${new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div class="comment-content-detail">
                                ${escapeHtml(comment.content)}
                            </div>
                            ${comment.userId == userId ? `
                                <div class="comment-actions">
                                    <button onclick="deleteCommentDetail(${comment.id}, ${postId})" class="delete-comment">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                    ${data.comments.length === 0 ? '<div class="no-comments">No comments yet. Be the first to comment!</div>' : ''}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        container.innerHTML = '<div class="error">Error loading comments</div>';
    }
}

// ========== ADD COMMENT ON DETAIL PAGE ==========
async function addCommentDetail(postId) {
    const token = getToken();
    if (!token) {
        alert('Please login to comment');
        window.location.href = 'login.html';
        return;
    }
    
    const input = document.getElementById('commentInput');
    const content = input.value.trim();
    
    if (!content) {
        alert('Please enter a comment');
        return;
    }
    
    try {
        const response = await api.post('/comments', { content, postId });
        const data = response.data;
        
        if (data.success) {
            input.value = '';
            await loadCommentsForDetail(postId);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Error adding comment');
    }
}

// ========== DELETE COMMENT ON DETAIL PAGE ==========
async function deleteCommentDetail(commentId, postId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    const token = getToken();
    if (!token) return;
    
    try {
        const response = await api.delete(`/comments/${commentId}`);
        const data = response.data;
        
        if (data.success) {
            await loadCommentsForDetail(postId);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error deleting comment');
    }
}

// ========== LIKE POST ON DETAIL PAGE ==========
async function likePostDetail(postId) {
    const token = getToken();
    if (!token) {
        alert('Please login to like posts');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await api.post(`/posts/${postId}/like`);
        const data = response.data;
        
        if (data.success) {
            await loadPostDetail(postId);
        }
    } catch (error) {
        console.error('Error liking post:', error);
        alert('Error liking post');
    }
}

// ========== DELETE POST AND REDIRECT ==========
async function deletePostAndRedirect(postId) {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone!')) return;
    
    const token = getToken();
    
    try {
        const response = await api.delete(`/posts/${postId}`);
        const data = response.data;
        
        if (data.success) {
            alert('Post deleted successfully!');
            window.location.href = '../index.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post');
    }
}

// ========== LOAD POST FOR EDIT ==========
async function loadPostForEdit(postId) {
    console.log('Loading post for edit:', postId);
    
    try {
        const response = await api.get(`/posts/${postId}`);
        const data = response.data;
        
        if (data.success) {
            const post = data.post;
            document.getElementById('title').value = post.title;
            document.getElementById('content').value = post.content;
            console.log('Form populated with:', post.title);
        } else {
            showMessage('Post not found', 'error');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading post for edit:', error);
        showMessage('Error loading post', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    }
}

// ========== HANDLE EDIT POST ==========
async function handleEditPost(event, postId) {
    event.preventDefault();
    
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const token = getToken();
    
    if (title.length < 3) {
        return showMessage('Title must be at least 3 characters!', 'error');
    }
    
    if (content.length < 10) {
        return showMessage('Content must be at least 10 characters!', 'error');
    }
    
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    
    try {
        const response = await api.put(`/posts/${postId}`, { title, content });
        const data = response.data;
        
        if (data.success) {
            showMessage('Post updated successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        showMessage('Error: ' + message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ========== EDIT POST (Redirect) ==========
async function editPost(postId) {
    window.location.href = `edit-post.html?id=${postId}`;
}

// ========== ADD IMAGE FIELD ==========
function addImageField() {
    const container = document.getElementById('imageUrls');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'image-url-input';
    div.innerHTML = `
        <input type="url" placeholder="https://example.com/image.jpg">
        <button type="button" onclick="this.parentElement.remove()">Remove</button>
    `;
    container.appendChild(div);
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== GLOBAL FUNCTIONS ==========
window.searchPosts = function() {
    const input = document.getElementById('searchInput');
    if (input) {
        currentSearch = input.value;
        currentPage = 1;
        loadPosts(currentPage, currentSearch);
    }
};

window.changePage = function(page) {
    currentPage = page;
    loadPosts(currentPage, currentSearch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.likePost = likePost;
window.deletePost = deletePost;
window.toggleComments = toggleComments;
window.addComment = addComment;
window.deleteComment = deleteComment;
window.loadPostDetail = loadPostDetail;
window.likePostDetail = likePostDetail;
window.addCommentDetail = addCommentDetail;
window.deleteCommentDetail = deleteCommentDetail;
window.deletePostAndRedirect = deletePostAndRedirect;
window.editPost = editPost;
window.loadPostForEdit = loadPostForEdit;
window.handleEditPost = handleEditPost;
window.addImageField = addImageField;