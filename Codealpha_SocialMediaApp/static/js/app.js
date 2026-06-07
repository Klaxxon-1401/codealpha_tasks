// Global State Management
let currentUser = null;
let activePostIdForComments = null;

// DOM Content Loaded Handler
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    await checkAuth();
    routePageLogic();
    setupGlobalSearch();
}

// Authentication check
async function checkAuth() {
    try {
        const response = await fetch("/api/auth/me/");
        const data = await response.json();
        
        const path = window.location.pathname;

        if (data.authenticated) {
            currentUser = data.user;
            
            // Set up personal profile link in header navigation
            const profileLink = document.getElementById("header-my-profile-link");
            if (profileLink) {
                profileLink.href = `/profile/?u=${currentUser.username}`;
            }

            // Redirect authenticated users away from auth page
            if (path.includes("/auth")) {
                window.location.href = "/";
            }
            
            // Attach global logout
            const logoutBtn = document.getElementById("logout-btn");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", handleLogout);
            }
        } else {
            currentUser = null;
            // Redirect unauthenticated users to auth page
            if (!path.includes("/auth")) {
                window.location.href = "/auth/";
            }
        }
    } catch (err) {
        console.error("Auth check failed:", err);
    }
}

async function handleLogout(e) {
    e.preventDefault();
    try {
        const response = await fetch("/api/auth/logout/", { method: "POST" });
        if (response.ok) {
            currentUser = null;
            window.location.href = "/auth/";
        }
    } catch (err) {
        console.error("Logout failed:", err);
    }
}

// Router
function routePageLogic() {
    const path = window.location.pathname;
    
    if (path === "/" || path.endsWith("feed.html")) {
        loadFeedPage();
    } else if (path.includes("/profile")) {
        loadProfilePage();
    } else if (path.includes("/auth")) {
        loadAuthPage();
    }
}

// Global User Search dropdown
function setupGlobalSearch() {
    const searchInput = document.getElementById("search-users-input");
    const dropdown = document.getElementById("search-results-dropdown");
    
    if (!searchInput || !dropdown) return;
    
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        
        if (!query) {
            dropdown.style.display = "none";
            return;
        }
        
        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/users/search/?query=${encodeURIComponent(query)}`);
                const users = await response.json();
                
                if (users.length === 0) {
                    dropdown.innerHTML = `<div style="padding: 0.75rem 1rem; font-size: 0.85rem; color: var(--text-secondary);">No people found.</div>`;
                } else {
                    dropdown.innerHTML = users.map(u => `
                        <div class="search-result-item" data-username="${u.username}">
                            <img src="${u.avatar_url}" alt="${u.username}" class="avatar avatar-sm">
                            <div>
                                <span class="suggestion-name">${u.full_name || u.username}</span>
                                <span class="suggestion-username">@${u.username}</span>
                            </div>
                        </div>
                    `).join("");
                    
                    dropdown.querySelectorAll(".search-result-item").forEach(item => {
                        item.addEventListener("click", () => {
                            window.location.href = `/profile/?u=${item.dataset.username}`;
                        });
                    });
                }
                dropdown.style.display = "block";
            } catch (err) {
                console.error("User search failed:", err);
            }
        }, 300);
    });
    
    // Close dropdown on click outside
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = "none";
        }
    });
}

// Page Logic: Feed Dashboard
async function loadFeedPage() {
    loadFeedSidebarSummary();
    loadWhoToFollowSuggestions();
    loadFeedPosts();
    
    // Post creator form
    const createForm = document.getElementById("create-post-form");
    const postInput = document.getElementById("post-content-input");
    const charCounter = document.getElementById("char-counter");
    
    if (createForm && postInput) {
        postInput.addEventListener("input", (e) => {
            const len = e.target.value.length;
            charCounter.textContent = `${len}/1000`;
        });
        
        createForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const content = postInput.value.trim();
            if (!content) return;
            
            try {
                const response = await fetch("/api/posts/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content })
                });
                
                if (response.ok) {
                    postInput.value = "";
                    charCounter.textContent = "0/1000";
                    // Reload feed
                    loadFeedPosts();
                    loadFeedSidebarSummary(); // Updates own posts count
                } else {
                    const result = await response.json();
                    alert(result.error || "Failed to submit post.");
                }
            } catch (err) {
                console.error("Failed to create post:", err);
            }
        });
    }
}

async function loadFeedSidebarSummary() {
    const card = document.getElementById("profile-summary-card");
    if (!card || !currentUser) return;
    
    try {
        const response = await fetch(`/api/profiles/${currentUser.username}/`);
        const data = await response.json();
        
        const postsCount = data.posts.length;
        
        card.innerHTML = `
            <img src="${data.user.avatar_url}" alt="${data.user.username}" class="avatar">
            <h3 class="profile-preview-name">${data.user.full_name || data.user.username}</h3>
            <div class="profile-preview-username">@${data.user.username}</div>
            <p class="profile-preview-bio">${data.user.bio || "No biography added yet."}</p>
            <div class="profile-preview-stats">
                <div class="preview-stat-item">
                    <span class="preview-stat-val">${postsCount}</span>
                    <span class="preview-stat-lbl">Posts</span>
                </div>
                <div class="preview-stat-item">
                    <span class="preview-stat-val">${data.followers_count}</span>
                    <span class="preview-stat-lbl">Followers</span>
                </div>
                <div class="preview-stat-item">
                    <span class="preview-stat-val">${data.following_count}</span>
                    <span class="preview-stat-lbl">Following</span>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Failed to load sidebar summary:", err);
    }
}

async function loadWhoToFollowSuggestions() {
    const list = document.getElementById("suggestions-list");
    if (!list) return;
    
    try {
        // Query people. A simple list is retrieved by searching with an empty string or 'a' to get all users
        const response = await fetch(`/api/users/search/?query=a`);
        let users = await response.json();
        
        // Filter out ourselves
        if (currentUser) {
            users = users.filter(u => u.username !== currentUser.username);
        }
        
        // Randomize list and slice top 4
        users.sort(() => 0.5 - Math.random());
        const suggestedUsers = users.slice(0, 4);
        
        if (suggestedUsers.length === 0) {
            list.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-secondary);">No suggestions available.</div>`;
            return;
        }
        
        list.innerHTML = suggestedUsers.map(u => `
            <div class="suggestion-item">
                <div class="suggestion-item-info">
                    <img src="${u.avatar_url}" alt="${u.username}" class="avatar avatar-sm">
                    <div>
                        <a href="/profile/?u=${u.username}" class="suggestion-name">${u.full_name || u.username}</a>
                        <div class="suggestion-username">@${u.username}</div>
                    </div>
                </div>
                <button class="btn btn-outline btn-sm suggestion-follow-btn" data-username="${u.username}">Follow</button>
            </div>
        `).join("");
        
        list.querySelectorAll(".suggestion-follow-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const targetUser = e.target.dataset.username;
                try {
                    const res = await fetch(`/api/profiles/${targetUser}/follow/`, { method: "POST" });
                    const resData = await res.json();
                    if (res.ok) {
                        e.target.textContent = resData.following ? "Unfollow" : "Follow";
                        e.target.classList.toggle("btn-primary");
                        // Refresh feed and sidebar stats
                        loadFeedPosts();
                        loadFeedSidebarSummary();
                    }
                } catch (err) {
                    console.error("Follow suggestion failed:", err);
                }
            });
        });
        
    } catch (err) {
        console.error("Failed to load suggestions:", err);
    }
}

async function loadFeedPosts() {
    const stream = document.getElementById("feed-stream");
    if (!stream) return;
    
    try {
        const response = await fetch("/api/posts/");
        const posts = await response.json();
        
        if (posts.length === 0) {
            stream.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 4rem 0;">Your feed is empty. Share updates or search for people to follow!</div>`;
            return;
        }
        
        renderPostsStream(posts, stream);
        
    } catch (err) {
        stream.innerHTML = `<div style="text-align: center; color: var(--danger-color); padding: 4rem 0;">Failed to load feed. Please try again.</div>`;
        console.error(err);
    }
}

// Shared renderer for post cards (used in Feed and Profiles)
function renderPostsStream(posts, containerEl) {
    containerEl.innerHTML = posts.map(post => {
        const date = new Date(post.created_at).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-card-header">
                    <div class="post-author-info">
                        <img src="${post.user.avatar_url}" alt="${post.user.username}" class="avatar avatar-sm">
                        <div>
                            <a href="/profile/?u=${post.user.username}" class="post-author-name">${post.user.full_name || post.user.username}</a>
                            <span class="post-author-username">@${post.user.username}</span>
                        </div>
                    </div>
                    <span class="post-time">${date}</span>
                </div>
                
                <div class="post-card-body">${post.content}</div>
                
                <div class="post-card-actions">
                    <button class="post-action-btn like-btn ${post.user_liked ? 'active' : ''}" data-id="${post.id}">
                        <span>Like</span>
                        <span class="likes-count">(${post.likes_count})</span>
                    </button>
                    <button class="post-action-btn comment-btn" data-id="${post.id}">
                        <span>Comments</span>
                        <span>(${post.comments_count})</span>
                    </button>
                </div>
            </div>
        `;
    }).join("");
    
    // Attach click listeners to likes
    containerEl.querySelectorAll(".like-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const btnEl = e.currentTarget;
            const id = btnEl.dataset.id;
            try {
                const response = await fetch(`/api/posts/${id}/like/`, { method: "POST" });
                const result = await response.json();
                if (response.ok) {
                    btnEl.classList.toggle("active", result.liked);
                    btnEl.querySelector(".likes-count").textContent = `(${result.likes_count})`;
                }
            } catch (err) {
                console.error("Like toggle failed:", err);
            }
        });
    });
    
    // Attach click listeners to comment buttons
    containerEl.querySelectorAll(".comment-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            openCommentsModal(id);
        });
    });
}

// Comments Modal Handlers
const commentsModal = document.getElementById("comments-modal");
const closeCommentsModalBtn = document.getElementById("close-comments-modal");
if (closeCommentsModalBtn && commentsModal) {
    closeCommentsModalBtn.addEventListener("click", () => {
        commentsModal.style.display = "none";
        activePostIdForComments = null;
    });
    // Close modal on background click
    window.addEventListener("click", (e) => {
        if (e.target === commentsModal) {
            commentsModal.style.display = "none";
            activePostIdForComments = null;
        }
    });
}

async function openCommentsModal(postId) {
    activePostIdForComments = postId;
    const commentsList = document.getElementById("modal-comments-list");
    if (!commentsList) return;
    
    commentsList.innerHTML = `<div class="loading-spinner">Loading comments...</div>`;
    commentsModal.style.display = "flex";
    
    try {
        const response = await fetch(`/api/posts/${postId}/comments/`);
        const comments = await response.json();
        
        if (comments.length === 0) {
            commentsList.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 1.5rem 0; font-size: 0.9rem;">No comments yet. Be the first to reply!</div>`;
        } else {
            commentsList.innerHTML = comments.map(c => {
                const date = new Date(c.created_at).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                return `
                    <div class="comment-item">
                        <img src="${c.user.avatar_url}" alt="${c.user.username}" class="avatar avatar-sm">
                        <div class="comment-item-bubble">
                            <div class="comment-item-header">
                                <span class="comment-user-name">${c.user.full_name || c.user.username}</span>
                                <span class="comment-time">${date}</span>
                            </div>
                            <div class="comment-content">${c.content}</div>
                        </div>
                    </div>
                `;
            }).join("");
        }
        
        // Auto scroll to bottom
        commentsList.scrollTop = commentsList.scrollHeight;
        
    } catch (err) {
        commentsList.innerHTML = `<div style="text-align: center; color: var(--danger-color); padding: 1.5rem 0;">Failed to load comments.</div>`;
    }
}

// Add comment submission listener
const commentForm = document.getElementById("modal-comment-form");
const commentInput = document.getElementById("modal-comment-input");
if (commentForm && commentInput) {
    commentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const content = commentInput.value.trim();
        if (!content || !activePostIdForComments) return;
        
        try {
            const response = await fetch(`/api/posts/${activePostIdForComments}/comments/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            });
            
            if (response.ok) {
                commentInput.value = "";
                // Reload comments modal list
                openCommentsModal(activePostIdForComments);
                
                // Update comment count on post card in feed
                const postCard = document.querySelector(`.post-card[data-post-id="${activePostIdForComments}"]`);
                if (postCard) {
                    const commentBtn = postCard.querySelector(".comment-btn");
                    // Fetch post info or just load feed again
                    loadFeedPosts();
                }
            } else {
                const result = await response.json();
                alert(result.error || "Failed to add comment.");
            }
        } catch (err) {
            console.error("Comment submission failed:", err);
        }
    });
}

// Page Logic: Profile Page
async function loadProfilePage() {
    const params = new URLSearchParams(window.location.search);
    let username = params.get("u");
    
    if (!username && currentUser) {
        username = currentUser.username;
    }
    
    if (!username) return;
    
    const headerEl = document.getElementById("profile-header");
    const postsListEl = document.getElementById("profile-posts-list");
    
    try {
        const response = await fetch(`/api/profiles/${username}/`);
        if (!response.ok) throw new Error("Profile not found");
        
        const profileData = await response.json();
        
        // Render Profile Header
        let actionBtnHTML = "";
        if (currentUser && currentUser.username === username) {
            actionBtnHTML = `<button class="btn btn-outline btn-sm" id="edit-profile-btn">Edit Profile</button>`;
        } else if (currentUser) {
            actionBtnHTML = `
                <button class="btn btn-primary btn-sm ${profileData.is_following ? 'btn-outline' : ''}" id="profile-follow-btn">
                    ${profileData.is_following ? 'Unfollow' : 'Follow'}
                </button>
            `;
        }
        
        headerEl.innerHTML = `
            <img src="${profileData.user.avatar_url}" alt="${profileData.user.username}" class="avatar avatar-lg">
            <div class="profile-header-info">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; flex-wrap: wrap; gap: 1rem;">
                    <h1 class="profile-header-name">${profileData.user.full_name || profileData.user.username}</h1>
                    ${actionBtnHTML}
                </div>
                <div class="profile-header-username">@${profileData.user.username}</div>
                <p class="profile-header-bio">${profileData.user.bio || "No biography added yet."}</p>
                <div class="profile-header-meta">
                    ${profileData.user.location ? `<span>Location: ${profileData.user.location}</span>` : ""}
                </div>
                <div class="profile-header-stats">
                    <div class="profile-stat"><span>${profileData.posts.length}</span> posts</div>
                    <div class="profile-stat"><span id="profile-followers-count">${profileData.followers_count}</span> followers</div>
                    <div class="profile-stat"><span>${profileData.following_count}</span> following</div>
                </div>
            </div>
        `;
        
        // Render user's posts
        if (profileData.posts.length === 0) {
            postsListEl.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 4rem 0;">No posts shared yet.</div>`;
        } else {
            renderPostsStream(profileData.posts, postsListEl);
        }
        
        // Wire up Follow Toggle Action
        const followBtn = document.getElementById("profile-follow-btn");
        if (followBtn) {
            followBtn.addEventListener("click", async () => {
                try {
                    const res = await fetch(`/api/profiles/${username}/follow/`, { method: "POST" });
                    const resData = await res.json();
                    if (res.ok) {
                        followBtn.textContent = resData.following ? "Unfollow" : "Follow";
                        followBtn.classList.toggle("btn-primary", !resData.following);
                        followBtn.classList.toggle("btn-outline", resData.following);
                        document.getElementById("profile-followers-count").textContent = resData.followers_count;
                    }
                } catch (err) {
                    console.error("Follow toggle failed:", err);
                }
            });
        }
        
        // Wire up Edit Profile Modal
        const editBtn = document.getElementById("edit-profile-btn");
        const editModal = document.getElementById("edit-profile-modal");
        const closeEditBtn = document.getElementById("close-edit-modal");
        
        if (editBtn && editModal && closeEditBtn) {
            editBtn.addEventListener("click", () => {
                document.getElementById("edit-fullname").value = profileData.user.full_name || "";
                document.getElementById("edit-location").value = profileData.user.location || "";
                document.getElementById("edit-avatar").value = profileData.user.avatar_url || "";
                document.getElementById("edit-bio").value = profileData.user.bio || "";
                
                editModal.style.display = "flex";
            });
            
            closeEditBtn.addEventListener("click", () => {
                editModal.style.display = "none";
            });
            
            // Close edit modal on background click
            window.addEventListener("click", (e) => {
                if (e.target === editModal) {
                    editModal.style.display = "none";
                }
            });
            
            // Edit profile submission
            const editForm = document.getElementById("edit-profile-form");
            const editError = document.getElementById("edit-profile-error");
            
            editForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                editError.textContent = "";
                
                const payload = {
                    full_name: document.getElementById("edit-fullname").value.trim(),
                    location: document.getElementById("edit-location").value.trim(),
                    avatar_url: document.getElementById("edit-avatar").value.trim(),
                    bio: document.getElementById("edit-bio").value.trim()
                };
                
                try {
                    const res = await fetch(`/api/profiles/${username}/`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    
                    if (res.ok) {
                        editModal.style.display = "none";
                        // Reload profile
                        loadProfilePage();
                    } else {
                        const resData = await res.json();
                        editError.textContent = resData.error || "Failed to update profile.";
                    }
                } catch (err) {
                    editError.textContent = "Network error. Please try again.";
                }
            });
        }
        
    } catch (err) {
        headerEl.innerHTML = `<div style="text-align: center; color: var(--danger-color); padding: 4rem 0;">User not found. <a href="/">Return to feed</a></div>`;
        postsListEl.innerHTML = "";
    }
}

// Page Logic: Authentication Sign In / Sign Up page
function loadAuthPage() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const loginError = document.getElementById("login-error");
    const registerError = document.getElementById("register-error");
    
    if (!loginForm) return;
    
    // Tab toggling
    tabLogin.addEventListener("click", () => {
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        loginForm.classList.add("active");
        registerForm.classList.remove("active");
    });
    
    tabRegister.addEventListener("click", () => {
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
        registerForm.classList.add("active");
        loginForm.classList.remove("active");
    });
    
    // Login Submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        loginError.textContent = "";
        
        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value;
        
        try {
            const response = await fetch("/api/auth/login/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            
            if (response.ok) {
                window.location.href = "/";
            } else {
                loginError.textContent = data.error || "Invalid credentials.";
            }
        } catch (err) {
            loginError.textContent = "Network error. Please try again.";
        }
    });
    
    // Register Submission
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        registerError.textContent = "";
        
        const username = document.getElementById("register-username").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const full_name = document.getElementById("register-fullname").value.trim();
        const password = document.getElementById("register-password").value;
        
        if (password.length < 6) {
            registerError.textContent = "Password must be at least 6 characters.";
            return;
        }
        
        try {
            const response = await fetch("/api/auth/register/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, full_name })
            });
            const data = await response.json();
            
            if (response.ok) {
                window.location.href = "/";
            } else {
                registerError.textContent = data.error || "Registration failed.";
            }
        } catch (err) {
            registerError.textContent = "Network error. Please try again.";
        }
    });
}
