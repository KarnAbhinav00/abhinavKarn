/**
 * Abhinav AKA Tyson - Admin Panel Controller JS
 * Session verification, Tab Routing, and CRUD REST Handlers
 */

let activeModalType = ''; // 'blog', 'project', 'skill', 'update'
let activeModalMode = 'create'; // 'create', 'edit'
let currentEditId = null;

// Cache of resources loaded in memory to populate edit forms
let cacheData = {
  blogs: [],
  projects: [],
  skills: [],
  updates: [],
  messages: []
};

document.addEventListener('DOMContentLoaded', () => {
  // If we are on admin.html page, verify authentication and set up listeners
  if (window.location.pathname.includes('admin')) {
    checkAdminSession();
    initAdminNavigation();
    loadAllAdminData();
  }

  // If login form is present, hook it
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  // Hook logout button
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogoutClick);
  }
});

// ==========================================
// SESSION CHECK & AUTHORIZATION
// ==========================================
async function checkAdminSession() {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    
    if (!data.loggedIn || data.user.role !== 'admin') {
      // Banish to login page (Layer 1 Security)
      window.location.href = '/login';
    }
  } catch (err) {
    window.location.href = '/login';
  }
}

// ==========================================
// NAVIGATION & PANE CONTROLLER
// ==========================================
function initAdminNavigation() {
  const menuButtons = document.querySelectorAll('.admin-menu-btn');
  const contentPanes = document.querySelectorAll('.admin-content-pane');

  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const paneId = btn.getAttribute('data-pane');
      if (!paneId) return;

      // Toggle Active buttons
      menuButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Toggle active panes
      contentPanes.forEach(pane => pane.classList.remove('active'));
      const activePane = document.getElementById(`pane-${paneId}`);
      if (activePane) activePane.classList.add('active');
    });
  });
}

// ==========================================
// DYNAMIC TABLE LOADERS
// ==========================================
function loadAllAdminData() {
  loadAdminBlogs();
  loadAdminProjects();
  loadAdminSkills();
  loadAdminUpdates();
  loadAdminMessages();
}

async function loadAdminBlogs() {
  const container = document.getElementById('admin-blogs-list');
  if (!container) return;

  try {
    const res = await fetch('/api/blogs');
    const data = await res.json();
    cacheData.blogs = data;

    if (data.length === 0) {
      container.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No blog posts found.</td></tr>`;
      return;
    }

    container.innerHTML = data.map(blog => `
      <tr>
        <td style="font-family: var(--font-mono); font-size: 12px; width: 120px;">${escapeHtml(blog.date)}</td>
        <td style="font-weight: 500; color: var(--text-main);">${escapeHtml(blog.title)}</td>
        <td><span class="badge badge-coral">${escapeHtml(blog.category)}</span></td>
        <td style="width: 100px;">
          <div class="admin-actions-cell">
            <button class="admin-btn-action edit-btn" onclick="openCrudModal('blog', 'edit', ${blog.id})" title="Edit Blog"><i class="fa-regular fa-pen-to-square"></i></button>
            <button class="admin-btn-action delete-btn" onclick="deleteResource('blog', ${blog.id})" title="Delete Blog"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="4" style="color: var(--accent-secondary);">Error loading blogs.</td></tr>`;
  }
}

async function loadAdminProjects() {
  const container = document.getElementById('admin-projects-list');
  if (!container) return;

  try {
    const res = await fetch('/api/projects');
    const data = await res.json();
    cacheData.projects = data;

    if (data.length === 0) {
      container.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No projects found.</td></tr>`;
      return;
    }

    container.innerHTML = data.map(p => `
      <tr>
        <td style="font-weight: 500; color: var(--text-main); font-size: 14px;">${escapeHtml(p.title)}</td>
        <td>${p.tags.split(',').map(t => `<span class="project-tag" style="margin-right: 4px;">${escapeHtml(t.trim())}</span>`).join('')}</td>
        <td style="width: 100px;">
          <div class="admin-actions-cell">
            <button class="admin-btn-action edit-btn" onclick="openCrudModal('project', 'edit', ${p.id})" title="Edit Project"><i class="fa-regular fa-pen-to-square"></i></button>
            <button class="admin-btn-action delete-btn" onclick="deleteResource('project', ${p.id})" title="Delete Project"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="3" style="color: var(--accent-secondary);">Error loading projects.</td></tr>`;
  }
}

async function loadAdminSkills() {
  const container = document.getElementById('admin-skills-list');
  if (!container) return;

  try {
    const res = await fetch('/api/skills');
    const data = await res.json();
    cacheData.skills = data;

    if (data.length === 0) {
      container.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No skills found.</td></tr>`;
      return;
    }

    container.innerHTML = data.map(s => `
      <tr>
        <td style="font-weight: 500; color: var(--text-main);">${escapeHtml(s.name)}</td>
        <td><span class="badge badge-indigo">${escapeHtml(s.category)}</span></td>
        <td style="font-family: var(--font-mono);">${s.level}%</td>
        <td style="width: 100px;">
          <div class="admin-actions-cell">
            <button class="admin-btn-action edit-btn" onclick="openCrudModal('skill', 'edit', ${s.id})" title="Edit Skill"><i class="fa-regular fa-pen-to-square"></i></button>
            <button class="admin-btn-action delete-btn" onclick="deleteResource('skill', ${s.id})" title="Delete Skill"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="4" style="color: var(--accent-secondary);">Error loading skills.</td></tr>`;
  }
}

async function loadAdminUpdates() {
  const container = document.getElementById('admin-updates-list');
  if (!container) return;

  try {
    const res = await fetch('/api/updates');
    const data = await res.json();
    cacheData.updates = data;

    if (data.length === 0) {
      container.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No timeline updates found.</td></tr>`;
      return;
    }

    container.innerHTML = data.map(u => `
      <tr>
        <td style="font-family: var(--font-mono); font-weight: 600; color: var(--accent-secondary); width: 120px;">${escapeHtml(u.date)}</td>
        <td style="font-weight: 500; color: var(--text-main);">${escapeHtml(u.title)}</td>
        <td style="width: 100px;">
          <div class="admin-actions-cell">
            <button class="admin-btn-action edit-btn" onclick="openCrudModal('update', 'edit', ${u.id})" title="Edit Update"><i class="fa-regular fa-pen-to-square"></i></button>
            <button class="admin-btn-action delete-btn" onclick="deleteResource('update', ${u.id})" title="Delete Update"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="3" style="color: var(--accent-secondary);">Error loading updates.</td></tr>`;
  }
}

async function loadAdminMessages() {
  const container = document.getElementById('admin-messages-list');
  const badgeElement = document.getElementById('unread-count');
  if (!container) return;

  try {
    const res = await fetch('/api/messages');
    const data = await res.json();
    cacheData.messages = data;

    if (badgeElement) {
      if (data.length > 0) {
        badgeElement.textContent = data.length;
        badgeElement.style.display = 'inline-flex';
      } else {
        badgeElement.style.display = 'none';
      }
    }

    if (data.length === 0) {
      container.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No messages received yet.</td></tr>`;
      return;
    }

    container.innerHTML = data.map(m => `
      <tr>
        <td style="font-family: var(--font-mono); font-size: 11px; width: 140px;">${new Date(m.created_at).toLocaleString()}</td>
        <td style="font-weight: 500; color: var(--text-main);">${escapeHtml(m.name)}</td>
        <td><a href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a></td>
        <td style="width: 120px;">
          <div class="admin-actions-cell">
            <button class="admin-btn-action edit-btn" onclick="toggleMessageBlock(${m.id})" title="Read Message"><i class="fa-regular fa-envelope-open"></i> View</button>
            <button class="admin-btn-action delete-btn" onclick="deleteResource('message', ${m.id})" title="Delete Message"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
      <tr id="message-block-${m.id}" style="display: none;">
        <td colspan="4" style="background-color: var(--bg-floor); border-top: none;">
          <div class="message-details-block">${escapeHtml(m.message)}</div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="4" style="color: var(--accent-secondary);">Error loading messages.</td></tr>`;
  }
}

function toggleMessageBlock(id) {
  const block = document.getElementById(`message-block-${id}`);
  if (!block) return;
  block.style.display = block.style.display === 'none' ? 'table-row' : 'none';
}

// ==========================================
// LOGIN SUBMISSION HANDLER
// ==========================================
async function handleLoginSubmit(e) {
  e.preventDefault();
  
  const errorMsg = document.getElementById('login-error-msg');
  if (errorMsg) {
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';
  }

  const usernameVal = document.getElementById('login-username').value;
  const passwordVal = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCookie('XSRF-TOKEN')
      },
      body: JSON.stringify({ username: usernameVal, password: passwordVal })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // Redirect to admin panel on authorization success
      window.location.href = '/admin';
    } else {
      if (errorMsg) {
        errorMsg.textContent = data.error || 'Login failed. Please check credentials.';
        errorMsg.style.display = 'block';
      }
    }
  } catch (err) {
    if (errorMsg) {
      errorMsg.textContent = 'Network error: Failed to connect to server.';
      errorMsg.style.display = 'block';
    }
  }
}

// ==========================================
// LOGOUT PROCESS HANDLER
// ==========================================
async function handleLogoutClick() {
  try {
    const res = await fetch('/api/auth/logout', { 
      method: 'POST',
      headers: {
        'X-CSRF-Token': getCookie('XSRF-TOKEN')
      }
    });
    if (res.ok) {
      window.location.href = '/';
    }
  } catch (err) {
    console.error('Logout failed:', err);
    window.location.href = '/';
  }
}

// ==========================================
// CRUD MODAL VIEW HANDLERS
// ==========================================
function openCrudModal(type, mode, id = null) {
  activeModalType = type;
  activeModalMode = mode;
  currentEditId = id;

  const modal = document.getElementById('crud-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalStatus = document.getElementById('modal-status');
  
  if (!modal || !modalTitle || !modalStatus) return;

  // Clear modal statuses
  modalStatus.className = 'form-status';
  modalStatus.style.display = 'none';
  modalStatus.textContent = '';

  // Hide all inner forms first
  const forms = ['form-blog', 'form-project', 'form-skill', 'form-update'];
  forms.forEach(f => {
    const element = document.getElementById(f);
    if (element) element.style.display = 'none';
  });

  // Display target form
  const activeForm = document.getElementById(`form-${type}`);
  if (activeForm) activeForm.style.display = 'block';

  // Set Modal title
  const capType = type.charAt(0).toUpperCase() + type.slice(1);
  modalTitle.textContent = mode === 'create' ? `Add New ${capType}` : `Edit ${capType}`;

  // Populate data if in Edit Mode
  if (mode === 'edit' && id !== null) {
    populateFormFields(type, id);
  } else {
    resetFormFields(type);
  }

  // Open modal animation
  modal.classList.add('open');
}

function closeCrudModal() {
  const modal = document.getElementById('crud-modal');
  if (modal) modal.classList.remove('open');
}

function resetFormFields(type) {
  if (type === 'blog') {
    document.getElementById('blog-id').value = '';
    document.getElementById('blog-title').value = '';
    document.getElementById('blog-category').value = '';
    document.getElementById('blog-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('blog-image').value = '';
    document.getElementById('blog-content').value = '';
  } else if (type === 'project') {
    document.getElementById('project-id').value = '';
    document.getElementById('project-title').value = '';
    document.getElementById('project-desc').value = '';
    document.getElementById('project-tags').value = '';
    document.getElementById('project-link').value = '';
    document.getElementById('project-source').value = '';
    document.getElementById('project-image').value = '';
  } else if (type === 'skill') {
    document.getElementById('skill-id').value = '';
    document.getElementById('skill-name').value = '';
    document.getElementById('skill-category').value = 'Frontend';
    document.getElementById('skill-level').value = '80';
  } else if (type === 'update') {
    document.getElementById('update-id').value = '';
    document.getElementById('update-date').value = '';
    document.getElementById('update-title').value = '';
    document.getElementById('update-details').value = '';
  }
}

function populateFormFields(type, id) {
  if (type === 'blog') {
    const blog = cacheData.blogs.find(b => b.id === id);
    if (!blog) return;
    document.getElementById('blog-id').value = blog.id;
    document.getElementById('blog-title').value = blog.title;
    document.getElementById('blog-category').value = blog.category;
    document.getElementById('blog-date').value = blog.date;
    document.getElementById('blog-image').value = blog.image_url || '';
    
    // Fetch full post to get the markdown content (listing endpoint only yields meta properties)
    fetch(`/api/blogs/${blog.slug}`)
      .then(res => res.json())
      .then(fullBlog => {
        document.getElementById('blog-content').value = fullBlog.content;
      })
      .catch(() => {
        document.getElementById('blog-content').value = 'Error fetching content.';
      });

  } else if (type === 'project') {
    const project = cacheData.projects.find(p => p.id === id);
    if (!project) return;
    document.getElementById('project-id').value = project.id;
    document.getElementById('project-title').value = project.title;
    document.getElementById('project-desc').value = project.description;
    document.getElementById('project-tags').value = project.tags;
    document.getElementById('project-link').value = project.link || '';
    document.getElementById('project-source').value = project.source_link || '';
    document.getElementById('project-image').value = project.image_url || '';
  } else if (type === 'skill') {
    const skill = cacheData.skills.find(s => s.id === id);
    if (!skill) return;
    document.getElementById('skill-id').value = skill.id;
    document.getElementById('skill-name').value = skill.name;
    document.getElementById('skill-category').value = skill.category;
    document.getElementById('skill-level').value = skill.level;
  } else if (type === 'update') {
    const update = cacheData.updates.find(u => u.id === id);
    if (!update) return;
    document.getElementById('update-id').value = update.id;
    document.getElementById('update-date').value = update.date;
    document.getElementById('update-title').value = update.title;
    document.getElementById('update-details').value = update.details;
  }
}

// ==========================================
// CRUD SUBMIT & SAVE HANDLERS
// ==========================================
async function submitCrudForm() {
  const statusDiv = document.getElementById('modal-status');
  if (!statusDiv) return;

  statusDiv.className = 'form-status';
  statusDiv.style.display = 'none';
  statusDiv.textContent = '';

  const payload = {};
  let url = `/api/${activeModalType}s`;
  let method = activeModalMode === 'create' ? 'POST' : 'PUT';

  if (activeModalType === 'blog') {
    payload.title = document.getElementById('blog-title').value;
    payload.category = document.getElementById('blog-category').value;
    payload.date = document.getElementById('blog-date').value;
    payload.image_url = document.getElementById('blog-image').value;
    payload.content = document.getElementById('blog-content').value;

    if (!payload.title || !payload.category || !payload.date || !payload.content) {
      showModalError('Please fill out all required fields.');
      return;
    }
  } else if (activeModalType === 'project') {
    payload.title = document.getElementById('project-title').value;
    payload.description = document.getElementById('project-desc').value;
    payload.tags = document.getElementById('project-tags').value;
    payload.link = document.getElementById('project-link').value;
    payload.source_link = document.getElementById('project-source').value;
    payload.image_url = document.getElementById('project-image').value;

    if (!payload.title || !payload.description || !payload.tags) {
      showModalError('Please fill out all required fields.');
      return;
    }
  } else if (activeModalType === 'skill') {
    payload.name = document.getElementById('skill-name').value;
    payload.category = document.getElementById('skill-category').value;
    payload.level = parseInt(document.getElementById('skill-level').value, 10);

    if (!payload.name || !payload.category || isNaN(payload.level)) {
      showModalError('Please fill out all required fields.');
      return;
    }
  } else if (activeModalType === 'update') {
    payload.date = document.getElementById('update-date').value;
    payload.title = document.getElementById('update-title').value;
    payload.details = document.getElementById('update-details').value;

    if (!payload.date || !payload.title || !payload.details) {
      showModalError('Please fill out all required fields.');
      return;
    }
  }

  // Adjust URL for PUT requests
  if (activeModalMode === 'edit') {
    url += `/${currentEditId}`;
  }

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCookie('XSRF-TOKEN')
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      // Reload relevant table
      refreshActiveTable();
      
      // Close Modal
      closeCrudModal();
      
      // Toast notice
      alert(data.message || 'Operation succeeded.');
    } else {
      showModalError(data.error || 'Server error occurred.');
    }
  } catch (err) {
    showModalError('Network error: Failed to save changes.');
  }
}

function showModalError(msg) {
  const statusDiv = document.getElementById('modal-status');
  if (!statusDiv) return;
  statusDiv.textContent = msg;
  statusDiv.className = 'form-status error';
  statusDiv.style.display = 'block';
}

function refreshActiveTable() {
  if (activeModalType === 'blog') loadAdminBlogs();
  else if (activeModalType === 'project') loadAdminProjects();
  else if (activeModalType === 'skill') loadAdminSkills();
  else if (activeModalType === 'update') loadAdminUpdates();
}

// ==========================================
// DELETE HANDLER (SECURE API CALLS)
// ==========================================
async function deleteResource(type, id) {
  const confirmMsg = `Are you absolutely sure you want to delete this ${type}? This action cannot be undone.`;
  if (!confirm(confirmMsg)) return;

  let url = `/api/${type}s/${id}`;

  try {
    const res = await fetch(url, { 
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': getCookie('XSRF-TOKEN')
      }
    });
    const data = await res.json();

    if (res.ok) {
      if (type === 'blog') loadAdminBlogs();
      else if (type === 'project') loadAdminProjects();
      else if (type === 'skill') loadAdminSkills();
      else if (type === 'update') loadAdminUpdates();
      else if (type === 'message') loadAdminMessages();

      alert(data.message || 'Deleted successfully.');
    } else {
      alert(data.error || 'Failed to delete resource.');
    }
  } catch (err) {
    alert('Network error: Failed to contact the server.');
  }
}

// ==========================================
// ESCAPE UTILITY FOR HTML ENTITIES
// ==========================================
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Get a cookie value by name (for CSRF Double Submit token extraction)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}
