// Global State
let currentUser = null;
let activeProjectId = null;
let activeProjectData = null;
let dragTaskId = null;

// DOM Load
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// Extract CSRF Token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// App Initialization
async function initApp() {
    await checkUserAuth();

    const path = window.location.pathname;

    if (path.includes("/auth/")) {
        initAuthPage();
    } else {
        initDashboardPage();
    }
    initPageAnimations();
}

// Check Authentication
async function checkUserAuth() {
    try {
        const response = await fetch("/api/auth/me/");
        const data = await response.json();
        if (data.authenticated) {
            currentUser = data.user;
        } else {
            currentUser = null;
            if (!window.location.pathname.includes("/auth/")) {
                window.location.href = "/auth/";
            }
        }
    } catch (err) {
        console.error("Auth check failed:", err);
    }
}

/* =========================================================================
   AUTHENTICATION PAGE LOGIC
   ========================================================================= */
function initAuthPage() {
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const loginError = document.getElementById("login-error");
    const registerError = document.getElementById("register-error");

    if (!tabLogin) return;

    // Toggle Tabs
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

    // Handle Login Submit
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        loginError.textContent = "";

        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value;

        try {
            const response = await fetch("/api/auth/login/", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok) {
                window.location.href = "/";
            } else {
                loginError.textContent = data.error || "Login failed.";
            }
        } catch (err) {
            loginError.textContent = "Network error. Try again.";
        }
    });

    // Handle Register Submit
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        registerError.textContent = "";

        const fullname = document.getElementById("register-fullname").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const username = document.getElementById("register-username").value.trim();
        const password = document.getElementById("register-password").value;

        if (password.length < 6) {
            registerError.textContent = "Password must be at least 6 characters.";
            return;
        }

        try {
            const response = await fetch("/api/auth/register/", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password, 
                    full_name: fullname 
                })
            });
            const data = await response.json();

            if (response.ok) {
                window.location.href = "/";
            } else {
                registerError.textContent = data.error || "Registration failed.";
            }
        } catch (err) {
            registerError.textContent = "Network error. Try again.";
        }
    });
}

/* =========================================================================
   DASHBOARD / WORKSPACE LOGIC
   ========================================================================= */
function initDashboardPage() {
    if (!currentUser) return;

    renderSidebarUser();
    loadProjects();

    // Wire project views tabs
    const tabDashboard = document.getElementById("tab-dashboard");
    const tabKanban = document.getElementById("tab-kanban");
    const viewDashboard = document.getElementById("view-dashboard");
    const viewKanban = document.getElementById("view-kanban");

    if (tabDashboard && tabKanban) {
        tabDashboard.addEventListener("click", () => {
            tabDashboard.classList.add("active");
            tabKanban.classList.remove("active");
            viewDashboard.classList.add("active");
            viewKanban.classList.remove("active");
            if (activeProjectId) loadProjectMetrics();
        });

        tabKanban.addEventListener("click", () => {
            tabKanban.classList.add("active");
            tabDashboard.classList.remove("active");
            viewKanban.classList.add("active");
            viewDashboard.classList.remove("active");
            if (activeProjectId) loadProjectTasks();
        });
    }

    // Modal wires
    wireModals();
}

// Render User details in Sidebar
function renderSidebarUser() {
    const section = document.getElementById("sidebar-user-section");
    if (!section) return;

    section.innerHTML = `
        <div class="user-badge">
            <img src="${currentUser.avatar_url}" alt="${currentUser.username}" class="avatar">
            <div class="user-info">
                <span class="username">${currentUser.full_name || currentUser.username}</span>
                <span class="user-role">Workspace Owner</span>
            </div>
        </div>
        <button class="sidebar-action-btn" id="logout-btn" title="Sign Out">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
        </button>
    `;

    document.getElementById("logout-btn").addEventListener("click", handleLogout);
}

// Logout Handler
async function handleLogout() {
    try {
        const response = await fetch("/api/auth/logout/", {
            method: "POST",
            headers: { "X-CSRFToken": getCookie("csrftoken") }
        });
        if (response.ok) {
            window.location.href = "/auth/";
        }
    } catch (err) {
        console.error("Logout failed:", err);
    }
}

// Load workspaces in Sidebar
async function loadProjects() {
    const listEl = document.getElementById("sidebar-project-list");
    if (!listEl) return;

    try {
        const response = await fetch("/api/projects/");
        const projects = await response.json();

        if (projects.length === 0) {
            listEl.innerHTML = `<div class="sidebar-spinner">No projects created yet.</div>`;
            switchToPanel("panel-empty-state");
            return;
        }

        listEl.innerHTML = projects.map(p => `
            <li class="project-item ${p.id === activeProjectId ? 'active' : ''}" data-id="${p.id}">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">${p.name}</span>
                <span class="project-item-meta">${p.progress}%</span>
            </li>
        `).join("");

        // Add Click handlers
        listEl.querySelectorAll(".project-item").forEach(item => {
            item.addEventListener("click", () => {
                selectProject(parseInt(item.dataset.id));
            });
        });

        // Re-select active project if it still exists
        if (activeProjectId && !projects.some(p => p.id === activeProjectId)) {
            activeProjectId = null;
            switchToPanel("panel-empty-state");
        } else if (activeProjectId) {
            selectProject(activeProjectId);
        }

    } catch (err) {
        listEl.innerHTML = `<div class="sidebar-spinner">Failed to load workspaces.</div>`;
    }
}

// Switch panels
function switchToPanel(panelId) {
    document.querySelectorAll(".workspace-panel").forEach(p => p.classList.remove("active"));
    document.getElementById(panelId).classList.add("active");
}

// Select active project
async function selectProject(projectId) {
    activeProjectId = projectId;
    
    // Highlight in sidebar
    document.querySelectorAll(".project-list .project-item").forEach(item => {
        if (parseInt(item.dataset.id) === projectId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    try {
        const response = await fetch(`/api/projects/${projectId}/`);
        if (!response.ok) throw new Error("Project details not found.");
        
        activeProjectData = await response.json();
        
        document.getElementById("active-project-name").textContent = activeProjectData.name;
        document.getElementById("active-project-desc").textContent = activeProjectData.description || "No project description provided.";
        
        switchToPanel("panel-active-project");
        
        // Load default tab view: Dashboard or Kanban
        const activeTab = document.querySelector(".workspace-tabs .workspace-tab.active");
        if (activeTab.id === "tab-dashboard") {
            loadProjectMetrics();
        } else {
            loadProjectTasks();
        }

    } catch (err) {
        console.error(err);
        switchToPanel("panel-empty-state");
    }
}

/* =========================================================================
   DASHBOARD METRICS AND SVG CHARTS
   ========================================================================= */
async function loadProjectMetrics() {
    if (!activeProjectId) return;

    try {
        const response = await fetch(`/api/projects/${activeProjectId}/`);
        const data = await response.json();
        const stats = data.stats;

        // Render stat values with count-up animation
        animateCountUp(document.getElementById('stat-total-tasks'), stats.total);
        animateCountUp(document.getElementById('stat-todo-tasks'), stats.todo);
        animateCountUp(document.getElementById('stat-progress-tasks'), stats.in_progress);
        animateCountUp(document.getElementById('stat-done-tasks'), stats.done);

        // Donut Chart calculations
        // Circumference is 100 for r=15.91549430918954
        const todoPct = stats.total > 0 ? Math.round((stats.todo / stats.total) * 100) : 0;
        const progressPct = stats.total > 0 ? Math.round((stats.in_progress / stats.total) * 100) : 0;
        const donePct = stats.total > 0 ? (100 - todoPct - progressPct) : 0; // ensure sum is 100

        // Set segments dash-arrays and dash-offsets
        let offset = 25; // start at top (12 o'clock)
        
        const segmentTodo = document.querySelector(".donut-segment-todo");
        segmentTodo.setAttribute("stroke-dasharray", `${todoPct} 100`);
        segmentTodo.setAttribute("stroke-dashoffset", offset);
        offset = offset - todoPct;

        const segmentProgress = document.querySelector(".donut-segment-progress");
        segmentProgress.setAttribute("stroke-dasharray", `${progressPct} 100`);
        segmentProgress.setAttribute("stroke-dashoffset", offset);
        offset = offset - progressPct;

        const segmentDone = document.querySelector(".donut-segment-done");
        segmentDone.setAttribute("stroke-dasharray", `${stats.total > 0 ? donePct : 0} 100`);
        segmentDone.setAttribute("stroke-dashoffset", offset);

        // Update Legend Percentages
        document.getElementById("legend-todo-pct").textContent = `${todoPct}%`;
        document.getElementById("legend-progress-pct").textContent = `${progressPct}%`;
        document.getElementById("legend-done-pct").textContent = `${stats.total > 0 ? donePct : 0}%`;

        // Priority breakdown progress bars
        const maxPriority = Math.max(stats.low, stats.medium, stats.high, 1);
        
        const highBar = document.getElementById("priority-high-bar");
        const highCount = document.getElementById("priority-high-count");
        highCount.textContent = stats.high;
        highBar.style.width = `${(stats.high / maxPriority) * 100}%`;

        const mediumBar = document.getElementById("priority-medium-bar");
        const mediumCount = document.getElementById("priority-medium-count");
        mediumCount.textContent = stats.medium;
        mediumBar.style.width = `${(stats.medium / maxPriority) * 100}%`;

        const lowBar = document.getElementById("priority-low-bar");
        const lowCount = document.getElementById("priority-low-count");
        lowCount.textContent = stats.low;
        lowBar.style.width = `${(stats.low / maxPriority) * 100}%`;

        // Load upcoming deadlines
        loadUpcomingDeadlines();

    } catch (err) {
        console.error("Failed to load project metrics:", err);
    }
}

// Load deadlines for active project
async function loadUpcomingDeadlines() {
    const listEl = document.getElementById("dashboard-deadlines-list");
    if (!listEl) return;

    try {
        const response = await fetch(`/api/projects/${activeProjectId}/tasks/`);
        const tasks = await response.json();
        
        // Filter tasks that have due dates and are not completed
        const pendingTasks = tasks.filter(t => t.due_date && t.status !== 'DONE');
        
        if (pendingTasks.length === 0) {
            listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: 0.9rem;">No upcoming due dates for incomplete tasks.</div>`;
            return;
        }

        // Sort tasks by due date
        pendingTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

        const today = new Date().setHours(0,0,0,0);

        listEl.innerHTML = pendingTasks.map(t => {
            const dueDate = new Date(t.due_date);
            const dueTime = dueDate.setHours(0,0,0,0);
            
            let statusClass = "upcoming";
            let statusText = "Upcoming";

            if (dueTime < today) {
                statusClass = "overdue";
                statusText = "Overdue";
            } else if (dueTime === today) {
                statusClass = "today";
                statusText = "Due Today";
            }

            const formattedDate = new Date(t.due_date).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            return `
                <div class="deadline-item ${statusClass}" onclick="openEditTaskModal(${t.id})">
                    <div class="deadline-info">
                        <span class="deadline-task-title">${t.title}</span>
                        <span class="deadline-task-project">Priority: ${t.priority}</span>
                    </div>
                    <div class="deadline-meta">
                        <span class="deadline-tag ${statusClass}">${statusText}</span>
                        <span class="deadline-date">${formattedDate}</span>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        listEl.innerHTML = `<div style="text-align: center; color: var(--color-danger); padding: 1rem 0;">Error loading deadlines.</div>`;
    }
}

/* =========================================================================
   KANBAN BOARD AND DRAG AND DROP LOGIC
   ========================================================================= */
async function loadProjectTasks() {
    if (!activeProjectId) return;

    try {
        const response = await fetch(`/api/projects/${activeProjectId}/tasks/`);
        const tasks = await response.json();

        // Separate columns
        const todoCol = document.getElementById("col-todo");
        const progressCol = document.getElementById("col-progress");
        const doneCol = document.getElementById("col-done");

        const todoTasks = tasks.filter(t => t.status === "TODO");
        const progressTasks = tasks.filter(t => t.status === "IN_PROGRESS");
        const doneTasks = tasks.filter(t => t.status === "DONE");

        // Update column badges
        document.getElementById("badge-todo").textContent = todoTasks.length;
        document.getElementById("badge-progress").textContent = progressTasks.length;
        document.getElementById("badge-done").textContent = doneTasks.length;

        // Render functions
        todoCol.innerHTML = renderTaskCards(todoTasks);
        progressCol.innerHTML = renderTaskCards(progressTasks);
        doneCol.innerHTML = renderTaskCards(doneTasks);

    } catch (err) {
        console.error("Failed to load project tasks:", err);
    }
}

// Generate HTML for task cards list
function renderTaskCards(tasksList) {
    if (tasksList.length === 0) {
        return `<div style="text-align: center; color: var(--text-muted); padding: 2.5rem 0; font-size: 0.85rem; border: 1px dashed rgba(255,255,255,0.02); border-radius: 8px;">Drag items here</div>`;
    }

    const today = new Date().setHours(0,0,0,0);

    return tasksList.map((t, idx) => {
        let isOverdue = false;
        if (t.due_date && t.status !== 'DONE') {
            const dueTime = new Date(t.due_date).setHours(0,0,0,0);
            if (dueTime < today) isOverdue = true;
        }

        const dateStr = t.due_date ? new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

        let assigneeHTML = '';
        if (t.assignee) {
            const initials = t.assignee.full_name.split(' ').map(n => n[0]).join('').substring(0,2);
            assigneeHTML = `<div class="task-card-assignee" title="Assigned to ${t.assignee.full_name}">${initials || t.assignee.username[0]}</div>`;
        }

        // High-priority class for pulse animation
        const priorityClass = t.priority === 'HIGH' ? 'priority-high' : '';

        return `
            <div class="task-card ${priorityClass}" draggable="true" id="task-${t.id}"
                style="animation-delay: ${idx * 60}ms"
                ondragstart="handleDragStart(event, ${t.id})"
                ondragend="handleDragEnd(event)"
                onclick="openEditTaskModal(${t.id})">
                <div class="task-card-header">
                    <span class="task-priority-tag ${t.priority.toLowerCase()}">${t.priority}</span>
                </div>
                <h4 class="task-card-title">${t.title}</h4>
                <p class="task-card-desc">${t.description || 'No description provided.'}</p>
                <div class="task-card-footer">
                    <span class="task-card-due ${isOverdue ? 'overdue' : ''}">
                        ${dateStr ? `
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg> ${dateStr}
                        ` : ''}
                    </span>
                    ${assigneeHTML}
                </div>
            </div>
        `;
    }).join('');
}

// Drag & Drop event handlers
function handleDragStart(e, taskId) {
    dragTaskId = taskId;
    e.dataTransfer.setData('text/plain', taskId);
    e.currentTarget.classList.add('dragging');

    // Mark entire board as drag-active for column highlight
    const board = document.querySelector('.kanban-board');
    if (board) board.classList.add('drag-active');
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    e.currentTarget.style.opacity = '';
    const board = document.querySelector('.kanban-board');
    if (board) board.classList.remove('drag-active');
    document.querySelectorAll('.kanban-cards-wrapper').forEach(col => {
        col.classList.remove('drag-allowed', 'drag-over');
    });
}

function allowDrop(e) {
    e.preventDefault();
    const col = e.currentTarget;
    if (col.classList.contains("kanban-cards-wrapper")) {
        col.classList.add("drag-over");
    }
}

// Handle drop and persist status
async function handleDrop(e, newStatus) {
    e.preventDefault();
    const col = e.currentTarget;
    col.classList.remove("drag-over");

    const taskId = e.dataTransfer.getData("text/plain") || dragTaskId;
    if (!taskId) return;

    try {
        const response = await fetch(`/api/tasks/${taskId}/`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            // Reload Tasks
            loadProjectTasks();
        } else {
            console.error("Failed to move task status.");
        }
    } catch (err) {
        console.error("Drop save failed:", err);
    }
    
    dragTaskId = null;
}

/* =========================================================================
   MODALS AND CRUD ACTION TRIGGERS
   ========================================================================= */
function wireModals() {
    // 1. Project Creation Modal
    const btnNewProj = document.getElementById("new-project-btn");
    const btnNewProjEmpty = document.getElementById("empty-state-new-project-btn");
    const modalProj = document.getElementById("modal-project");
    const closeProj = document.getElementById("close-project-modal");
    const formProj = document.getElementById("project-form");

    const openProjModal = () => { modalProj.classList.add("active"); };
    const closeProjModal = () => { modalProj.classList.remove("active"); formProj.reset(); };

    if (btnNewProj) btnNewProj.addEventListener("click", openProjModal);
    if (btnNewProjEmpty) btnNewProjEmpty.addEventListener("click", openProjModal);
    if (closeProj) closeProj.addEventListener("click", closeProjModal);

    if (formProj) {
        formProj.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("project-name").value.trim();
            const description = document.getElementById("project-description").value.trim();

            try {
                const response = await fetch("/api/projects/", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCookie("csrftoken")
                    },
                    body: JSON.stringify({ name, description })
                });
                const result = await response.json();
                
                if (response.status === 201 || response.ok) {
                    closeProjModal();
                    // Load and auto-select new project
                    await loadProjects();
                    selectProject(result.id);
                } else {
                    alert(result.error || "Failed to create project board.");
                }
            } catch (err) {
                console.error("Create project failed:", err);
            }
        });
    }

    // Delete Board trigger
    const btnDeleteProj = document.getElementById("delete-project-btn");
    if (btnDeleteProj) {
        btnDeleteProj.addEventListener("click", async () => {
            if (!activeProjectId) return;
            const confirmMsg = "Warning: Deleting this project board will permanently erase all associated tasks, activity logs, and comments. Proceed?";
            if (confirm(confirmMsg)) {
                try {
                    const response = await fetch(`/api/projects/${activeProjectId}/`, {
                        method: "DELETE",
                        headers: { "X-CSRFToken": getCookie("csrftoken") }
                    });
                    if (response.ok) {
                        activeProjectId = null;
                        await loadProjects();
                    } else {
                        const errData = await response.json();
                        alert(errData.error || "Failed to delete project board.");
                    }
                } catch (err) {
                    console.error("Delete project failed:", err);
                }
            }
        });
    }

    // 2. Task Modal
    const modalTask = document.getElementById("modal-task");
    const closeTask = document.getElementById("close-task-modal");
    const formTask = document.getElementById("task-form");
    const btnDeleteTask = document.getElementById("delete-task-btn");

    if (closeTask) {
        closeTask.addEventListener("click", () => {
            modalTask.classList.remove("active");
            formTask.reset();
            document.getElementById("task-id").value = "";
        });
    }

    // Save Task Submit (Create or Edit)
    if (formTask) {
        formTask.addEventListener("submit", async (e) => {
            e.preventDefault();
            const taskId = document.getElementById("task-id").value;
            const title = document.getElementById("task-title").value.trim();
            const description = document.getElementById("task-desc").value.trim();
            const status = document.getElementById("task-status").value;
            const priority = document.getElementById("task-priority").value;
            const due_date = document.getElementById("task-due").value;
            const assignee_id = document.getElementById("task-assignee").value;

            const payload = {
                title,
                description,
                status,
                priority,
                due_date,
                assignee_id
            };

            try {
                let response;
                if (taskId) {
                    // Update
                    response = await fetch(`/api/tasks/${taskId}/`, {
                        method: "PUT",
                        headers: { 
                            "Content-Type": "application/json",
                            "X-CSRFToken": getCookie("csrftoken")
                        },
                        body: JSON.stringify(payload)
                    });
                } else {
                    // Create
                    response = await fetch(`/api/projects/${activeProjectId}/tasks/`, {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "X-CSRFToken": getCookie("csrftoken")
                        },
                        body: JSON.stringify(payload)
                    });
                }

                if (response.ok) {
                    modalTask.classList.remove("active");
                    formTask.reset();
                    document.getElementById("task-id").value = "";
                    
                    // Reload workspace views
                    const activeTab = document.querySelector(".workspace-tabs .workspace-tab.active");
                    if (activeTab.id === "tab-dashboard") {
                        loadProjectMetrics();
                    } else {
                        loadProjectTasks();
                    }
                } else {
                    const resData = await response.json();
                    alert(resData.error || "Failed to save task.");
                }
            } catch (err) {
                console.error("Save task failed:", err);
            }
        });
    }

    // Delete Task click
    if (btnDeleteTask) {
        btnDeleteTask.addEventListener("click", async () => {
            const taskId = document.getElementById("task-id").value;
            if (!taskId) return;

            if (confirm("Delete this task permanently?")) {
                try {
                    const response = await fetch(`/api/tasks/${taskId}/`, {
                        method: "DELETE",
                        headers: { "X-CSRFToken": getCookie("csrftoken") }
                    });
                    if (response.ok) {
                        modalTask.classList.remove("active");
                        formTask.reset();
                        document.getElementById("task-id").value = "";
                        
                        // Reload Tasks/Metrics
                        const activeTab = document.querySelector(".workspace-tabs .workspace-tab.active");
                        if (activeTab.id === "tab-dashboard") {
                            loadProjectMetrics();
                        } else {
                            loadProjectTasks();
                        }
                    }
                } catch (err) {
                    console.error("Delete task failed:", err);
                }
            }
        });
    }

    // 3. Task Extra Info Tabs Wires (Comments vs Activity)
    const tabComments = document.getElementById("tab-comments");
    const tabActivity = document.getElementById("tab-activity");
    const panelComments = document.getElementById("panel-comments");
    const panelActivity = document.getElementById("panel-activity");

    if (tabComments && tabActivity) {
        tabComments.addEventListener("click", () => {
            tabComments.classList.add("active");
            tabActivity.classList.remove("active");
            panelComments.classList.add("active");
            panelActivity.classList.remove("active");
        });

        tabActivity.addEventListener("click", () => {
            tabActivity.classList.add("active");
            tabComments.classList.remove("active");
            panelActivity.classList.add("active");
            panelComments.classList.remove("active");
            
            const taskId = document.getElementById("task-id").value;
            if (taskId) loadTaskActivity(taskId);
        });
    }

    // Comment Submission
    const formComment = document.getElementById("comment-form");
    if (formComment) {
        formComment.addEventListener("submit", async (e) => {
            e.preventDefault();
            const taskId = document.getElementById("task-id").value;
            const content = document.getElementById("comment-text").value.trim();

            if (!taskId || !content) return;

            try {
                const response = await fetch(`/api/tasks/${taskId}/comments/`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCookie("csrftoken")
                    },
                    body: JSON.stringify({ content })
                });

                if (response.ok) {
                    document.getElementById("comment-text").value = "";
                    loadTaskComments(taskId);
                }
            } catch (err) {
                console.error("Post comment failed:", err);
            }
        });
    }
}

// Open Add Task Modal
async function openAddTaskModal(status = "TODO") {
    if (!activeProjectId) return;

    const modal = document.getElementById("modal-task");
    const titleText = document.getElementById("task-modal-title-text");
    const deleteBtn = document.getElementById("delete-task-btn");
    const extraInfo = document.getElementById("task-extra-info");

    titleText.textContent = "Add Task";
    deleteBtn.style.display = "none";
    extraInfo.style.display = "none";

    // Set Default Status dropdown
    document.getElementById("task-status").value = status;
    document.getElementById("task-priority").value = "MEDIUM";
    document.getElementById("task-due").value = "";

    // Load Assignee Dropdown
    await loadAssigneeDropdown();

    modal.classList.add("active");
}

// Open Edit Task Modal
async function openEditTaskModal(taskId) {
    const modal = document.getElementById("modal-task");
    const titleText = document.getElementById("task-modal-title-text");
    const deleteBtn = document.getElementById("delete-task-btn");
    const extraInfo = document.getElementById("task-extra-info");

    titleText.textContent = "Edit Task Details";
    deleteBtn.style.display = "inline-block";
    extraInfo.style.display = "flex";

    // Select default tab
    document.getElementById("tab-comments").click();

    try {
        const response = await fetch(`/api/tasks/${taskId}/`);
        const task = await response.json();

        document.getElementById("task-id").value = task.id;
        document.getElementById("task-title").value = task.title;
        document.getElementById("task-desc").value = task.description || "";
        document.getElementById("task-status").value = task.status;
        document.getElementById("task-priority").value = task.priority;
        document.getElementById("task-due").value = task.due_date || "";

        // Load Assignee options and select current
        await loadAssigneeDropdown(task.assignee ? task.assignee.id : "");

        // Load Comments & Activity log
        loadTaskComments(task.id);
        loadTaskActivity(task.id);

        modal.classList.add("active");

    } catch (err) {
        console.error("Failed to load task detail:", err);
    }
}

// Load users in Assignee Selector Dropdown
async function loadAssigneeDropdown(selectedId = "") {
    const select = document.getElementById("task-assignee");
    if (!select) return;

    try {
        const response = await fetch("/api/users/");
        const users = await response.json();

        let optionsHTML = `<option value="">Unassigned</option>`;
        optionsHTML += users.map(u => `
            <option value="${u.id}" ${u.id === selectedId ? 'selected' : ''}>
                ${u.full_name || u.username} (@${u.username})
            </option>
        `).join("");

        select.innerHTML = optionsHTML;

    } catch (err) {
        select.innerHTML = `<option value="">Error loading users</option>`;
    }
}

// Load comments inside task edit modal
async function loadTaskComments(taskId) {
    const listEl = document.getElementById("task-comments-list");
    if (!listEl) return;

    try {
        const response = await fetch(`/api/tasks/${taskId}/comments/`);
        const comments = await response.json();

        if (comments.length === 0) {
            listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: 0.85rem;">No comments posted yet.</div>`;
            return;
        }

        listEl.innerHTML = comments.map(c => {
            const timeStr = new Date(c.created_at).toLocaleTimeString(undefined, {
                hour: '2-digit', minute: '2-digit'
            }) + " on " + new Date(c.created_at).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric'
            });

            return `
                <div class="comment-item">
                    <img src="${c.user.avatar_url}" alt="${c.user.username}" class="avatar" style="width: 28px; height: 28px;">
                    <div class="comment-bubble">
                        <div class="comment-header">
                            <span class="comment-user">${c.user.full_name || c.user.username}</span>
                            <span class="comment-time">${timeStr}</span>
                        </div>
                        <div class="comment-body">${c.content}</div>
                    </div>
                </div>
            `;
        }).join("");

        // Scroll comments to bottom
        listEl.scrollTop = listEl.scrollHeight;

    } catch (err) {
        listEl.innerHTML = `<div style="text-align: center; color: var(--color-danger); padding: 1rem 0;">Error loading comments.</div>`;
    }
}

// Load activity timeline inside task edit modal
async function loadTaskActivity(taskId) {
    const listEl = document.getElementById("task-activity-list");
    if (!listEl) return;

    try {
        const response = await fetch(`/api/tasks/${taskId}/activity/`);
        const activities = await response.json();

        if (activities.length === 0) {
            listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: 0.85rem;">No timeline events recorded.</div>`;
            return;
        }

        listEl.innerHTML = activities.map(a => {
            const timeStr = new Date(a.created_at).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric'
            }) + " " + new Date(a.created_at).toLocaleTimeString(undefined, {
                hour: '2-digit', minute: '2-digit'
            });

            return `
                <div class="activity-item">
                    <div class="activity-dot"></div>
                    <div class="activity-details">
                        <span class="activity-text"><strong>${a.user.full_name || a.user.username}</strong> ${a.action}</span>
                        <span class="activity-time">${timeStr}</span>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        listEl.innerHTML = `<div style="text-align: center; color: var(--color-danger); padding: 1rem 0;">Error loading activity timeline.</div>`;
    }
}


/* ============================================================
   ANIMATION and UX ENHANCEMENT UTILITIES
   ============================================================ */

function initPageAnimations() {
    var bar = document.createElement('div');
    bar.id = 'page-progress-bar';
    document.body.prepend(bar);
    setTimeout(function() { bar.remove(); }, 900);
    if (!document.getElementById('toast-container')) { var tc = document.createElement('div'); tc.id = 'toast-container'; document.body.appendChild(tc); }
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.btn');
        if (!btn || btn.disabled) return;
        var ripple = document.createElement('span');
        ripple.className = 'ripple-wave';
        var rect = btn.getBoundingClientRect();
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top  = (e.clientY - rect.top)  + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', function() { ripple.remove(); });
    });
}

function animateCountUp(el, end, dur) {
    if (!el) return; if (!dur) dur = 700;
    var startTime = performance.now();
    function step(now) { var elapsed = now - startTime; var progress = Math.min(elapsed / dur, 1); var eased = 1 - Math.pow(1 - progress, 3); el.textContent = Math.round(end * eased); if (progress < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
}

function showToast(message, type, duration) {
    if (!type) type = 'info'; if (!duration) duration = 3500;
    var container = document.getElementById('toast-container');
    if (!container) { container = document.createElement('div'); container.id = 'toast-container'; document.body.appendChild(container); }
    var icons = { success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' };
    var toast = document.createElement('div'); toast.className = 'toast toast-' + type; toast.innerHTML = (icons[type] || icons.info) + '<span>' + message + '</span>'; container.appendChild(toast);
    var dismiss = function() { toast.classList.add('hiding'); toast.addEventListener('animationend', function() { toast.remove(); }, { once: true }); };
    setTimeout(dismiss, duration); toast.addEventListener('click', dismiss); return toast;
}

