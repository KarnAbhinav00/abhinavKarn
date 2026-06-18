/**
 * Abhinav AKA Tyson - Portfolio Public JavaScript
 * Dynamic Data Fetching, Markdown Parsing, Theme Toggling, & Security validations
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRouter();
  initContactForm();
});

// ==========================================
// THEME MANAGER (DARK / LIGHT TOGGLE)
// ==========================================
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;

  const currentTheme = localStorage.getItem('theme') || 'light';
  applyTheme(currentTheme);

  toggleBtn.addEventListener('click', () => {
    const activeTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    applyTheme(activeTheme);
  });
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  } else {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  }
  localStorage.setItem('theme', theme);
}

// ==========================================
// ROUTER & VIEW LOADING
// ==========================================
function initRouter() {
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const blogPostSlug = searchParams.get('p');

  if (path.includes('blog')) {
    if (blogPostSlug) {
      loadSingleBlogPost(blogPostSlug);
    } else {
      loadBlogListing();
    }
  } else if (path === '/' || path.includes('index.html')) {
    loadPortfolioHome();
  } else if (path.includes('login')) {
    checkLoginStatusRedirect();
  }
}

// ==========================================
// PORTFOLIO HOME RENDERING
// ==========================================
async function loadPortfolioHome() {
  // 1. Fetch & Render Updates (Timeline)
  const updatesTimeline = document.getElementById('updates-timeline');
  if (updatesTimeline) {
    try {
      const res = await fetch('/api/updates');
      const data = await res.json();
      if (data && data.length > 0) {
        updatesTimeline.innerHTML = data.map(item => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-date">${escapeHtml(item.date)}</div>
            <h3 class="timeline-title">${escapeHtml(item.title)}</h3>
            <div class="timeline-details">${escapeHtml(item.details)}</div>
          </div>
        `).join('');
      } else {
        updatesTimeline.innerHTML = `<p style="text-align: center; color: var(--text-muted);">No logs posted yet.</p>`;
      }
    } catch (err) {
      updatesTimeline.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Failed to load updates.</p>`;
    }
  }

  // 2. Fetch & Render Projects
  const projectsGrid = document.getElementById('projects-grid-container');
  if (projectsGrid) {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data && data.length > 0) {
        projectsGrid.innerHTML = data.map(p => {
          const tagsHtml = p.tags.split(',').map(t => `<span class="project-tag">${escapeHtml(t.trim())}</span>`).join('');
          const imgUrl = p.image_url || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=60';
          const linkHtml = p.link ? `<a href="${escapeHtml(p.link)}" target="_blank" class="project-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live</a>` : '';
          const sourceHtml = p.source_link ? `<a href="${escapeHtml(p.source_link)}" target="_blank" class="project-link"><i class="fa-brands fa-github"></i> Source</a>` : '';
          
          return `
            <div class="project-card">
              <div class="project-image">
                <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.title)}" loading="lazy">
              </div>
              <div class="project-content">
                <div class="project-tags">${tagsHtml}</div>
                <h3 class="project-title">${escapeHtml(p.title)}</h3>
                <p class="project-desc">${escapeHtml(p.description)}</p>
                <div class="project-links">${linkHtml} ${sourceHtml}</div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        projectsGrid.innerHTML = `<p style="text-align: center; color: var(--text-muted);">No projects added yet.</p>`;
      }
    } catch (err) {
      projectsGrid.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Failed to load projects.</p>`;
    }
  }

  // 3. Fetch & Render Skills
  const skillsContainer = document.getElementById('skills-container-element');
  if (skillsContainer) {
    try {
      const res = await fetch('/api/skills');
      const data = await res.json();
      if (data && data.length > 0) {
        // Group skills by category
        const categories = {};
        data.forEach(s => {
          if (!categories[s.category]) {
            categories[s.category] = [];
          }
          categories[s.category].push(s);
        });

        let categoriesHtml = '';
        for (const cat in categories) {
          const skillsHtml = categories[cat].map(s => `
            <div class="skill-item">
              <div class="skill-info">
                <span class="skill-name">${escapeHtml(s.name)}</span>
                <span class="skill-percentage">${parseInt(s.level, 10)}%</span>
              </div>
              <div class="skill-bar-container">
                <div class="skill-bar" data-level="${parseInt(s.level, 10)}%"></div>
              </div>
            </div>
          `).join('');

          categoriesHtml += `
            <div class="skills-category-box">
              <h3 class="skills-category-title">${escapeHtml(cat)}</h3>
              <div class="skills-list">${skillsHtml}</div>
            </div>
          `;
        }
        skillsContainer.innerHTML = categoriesHtml;

        // Animate skills bars loading after display
        setTimeout(() => {
          document.querySelectorAll('.skill-bar').forEach(bar => {
            bar.style.width = bar.getAttribute('data-level');
          });
        }, 100);
      } else {
        skillsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">No skills added yet.</p>`;
      }
    } catch (err) {
      skillsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Failed to load skills.</p>`;
    }
  }

  // 4. Fetch & Render Recent Blogs Previews
  const blogsPreview = document.getElementById('blogs-preview-container');
  if (blogsPreview) {
    try {
      const res = await fetch('/api/blogs');
      const data = await res.json();
      if (data && data.length > 0) {
        // Only show top 3 on homepage
        const recentBlogs = data.slice(0, 3);
        blogsPreview.innerHTML = recentBlogs.map(b => {
          const imgUrl = b.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60';
          const formattedDate = formatDate(b.date);
          
          return `
            <div class="blog-card">
              <div class="blog-card-image">
                <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(b.title)}" loading="lazy">
              </div>
              <div class="blog-card-content">
                <div class="blog-card-meta">
                  <span class="blog-card-category">${escapeHtml(b.category)}</span>
                  <span class="blog-card-date">${escapeHtml(formattedDate)}</span>
                </div>
                <h3 class="blog-card-title">${escapeHtml(b.title)}</h3>
                <a href="/blog?p=${escapeHtml(b.slug)}" class="blog-card-link">
                  Read Article <i class="fa-solid fa-arrow-right"></i>
                </a>
              </div>
            </div>
          `;
        }).join('');
      } else {
        blogsPreview.innerHTML = `<p style="text-align: center; color: var(--text-muted);">No blogs posted yet.</p>`;
      }
    } catch (err) {
      blogsPreview.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Failed to load recent blogs.</p>`;
    }
  }
}

// ==========================================
// BLOG LISTING RENDERING
// ==========================================
let allBlogsData = [];

async function loadBlogListing() {
  const blogsContainer = document.getElementById('blogs-grid-container');
  const catFilterContainer = document.getElementById('blog-categories');
  const searchInput = document.getElementById('blog-search');

  if (!blogsContainer) return;

  try {
    const res = await fetch('/api/blogs');
    allBlogsData = await res.json();

    if (allBlogsData && allBlogsData.length > 0) {
      // 1. Setup category buttons
      const categoriesSet = new Set(allBlogsData.map(b => b.category));
      let catButtonsHtml = `<button class="cat-btn active" data-category="All">All</button>`;
      categoriesSet.forEach(c => {
        catButtonsHtml += `<button class="cat-btn" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
      });
      if (catFilterContainer) catFilterContainer.innerHTML = catButtonsHtml;

      // 2. Render blogs list
      renderBlogsGrid(allBlogsData);

      // 3. Listen to filters
      if (catFilterContainer) {
        catFilterContainer.addEventListener('click', (e) => {
          if (e.target.classList.contains('cat-btn')) {
            document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            filterBlogs();
          }
        });
      }

      if (searchInput) {
        searchInput.addEventListener('input', filterBlogs);
      }
    } else {
      blogsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">No blogs posted yet. Check back daily!</p>`;
    }
  } catch (err) {
    blogsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Failed to load blogs. Please try again later.</p>`;
  }
}

function renderBlogsGrid(blogsList) {
  const blogsContainer = document.getElementById('blogs-grid-container');
  if (!blogsContainer) return;

  if (blogsList.length === 0) {
    blogsContainer.innerHTML = `<p style="text-align: center; grid-column: 1/-1; color: var(--text-muted); padding: 40px 0;">No matching blog posts found.</p>`;
    return;
  }

  blogsContainer.innerHTML = blogsList.map(b => {
    const imgUrl = b.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60';
    const formattedDate = formatDate(b.date);
    
    return `
      <div class="blog-card">
        <div class="blog-card-image">
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(b.title)}" loading="lazy">
        </div>
        <div class="blog-card-content">
          <div class="blog-card-meta">
            <span class="blog-card-category">${escapeHtml(b.category)}</span>
            <span class="blog-card-date">${escapeHtml(formattedDate)}</span>
          </div>
          <h3 class="blog-card-title">${escapeHtml(b.title)}</h3>
          <p class="blog-card-summary">${escapeHtml(truncateText(stripHtml(b.content || ''), 120))}</p>
          <a href="/blog?p=${escapeHtml(b.slug)}" class="blog-card-link">
            Read Article <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function filterBlogs() {
  const searchInput = document.getElementById('blog-search');
  const activeCatBtn = document.querySelector('.cat-btn.active');
  
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const category = activeCatBtn ? activeCatBtn.getAttribute('data-category') : 'All';

  const filtered = allBlogsData.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(query) || b.content.toLowerCase().includes(query);
    const matchesCategory = (category === 'All') || (b.category === category);
    return matchesSearch && matchesCategory;
  });

  renderBlogsGrid(filtered);
}

// ==========================================
// SINGLE BLOG POST DETAILS
// ==========================================
async function loadSingleBlogPost(slug) {
  const listView = document.getElementById('blog-list-view');
  const detailView = document.getElementById('blog-detail-view');
  const detailContent = document.getElementById('detail-content');

  if (!listView || !detailView || !detailContent) return;

  listView.style.display = 'none';
  detailView.style.display = 'block';

  try {
    const res = await fetch(`/api/blogs/${slug}`);
    if (!res.ok) {
      if (res.status === 404) {
        detailContent.innerHTML = `<h2>Post Not Found</h2><p>The blog post you are looking for does not exist.</p>`;
      } else {
        detailContent.innerHTML = `<h2>Error</h2><p>Failed to load the blog post.</p>`;
      }
      return;
    }

    const blog = await res.json();
    
    // Set text elements
    document.getElementById('detail-title').textContent = blog.title;
    document.title = `${blog.title} | Abhinav AKA Tyson Blog`;
    document.getElementById('detail-category').textContent = blog.category;
    document.getElementById('detail-date').textContent = formatDate(blog.date);

    // Cover image
    const imgContainer = document.getElementById('detail-image-container');
    const imgElement = document.getElementById('detail-image');
    if (blog.image_url) {
      imgElement.src = blog.image_url;
      imgElement.alt = blog.title;
      imgContainer.style.display = 'block';
    } else {
      imgContainer.style.display = 'none';
    }

    // Render markdown content
    detailContent.innerHTML = parseMarkdown(blog.content);

  } catch (err) {
    detailContent.innerHTML = `<h2>Error</h2><p>Failed to load content: ${escapeHtml(err.message)}</p>`;
  }
}

// ==========================================
// CONTACT FORM SUBMISSION
// ==========================================
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusDiv = document.getElementById('contact-form-status');

  if (!form || !statusDiv) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    statusDiv.className = 'form-status';
    statusDiv.style.display = 'none';
    statusDiv.textContent = '';

    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCookie('XSRF-TOKEN')
        },
        body: JSON.stringify({ name, email, message })
      });

      const data = await res.json();

      if (res.ok) {
        statusDiv.classList.add('success');
        statusDiv.textContent = data.message;
        form.reset();
      } else {
        statusDiv.classList.add('error');
        statusDiv.textContent = data.error || 'Failed to submit message.';
      }
    } catch (err) {
      statusDiv.classList.add('error');
      statusDiv.textContent = 'Network error: Failed to connect to server.';
    }
  });
}

// ==========================================
// ADMIN LOGIN CHECK (REDIRECTS ON SUCCES)
// ==========================================
async function checkLoginStatusRedirect() {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    if (data.loggedIn && data.user.role === 'admin') {
      window.location.href = '/admin';
    }
  } catch (err) {
    console.error('Session check failed:', err);
  }
}

// ==========================================
// HELPERS & STRING SECURITY UTILITIES
// ==========================================

// Get a cookie value by name (for CSRF Double Submit token extraction)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}

// Escape HTML entities to prevent XSS injection
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Truncate text block to length with ellipses
function truncateText(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substr(0, maxLength) + '...';
}

// Simple strip HTML tags for summary previews
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

// Format date into human-friendly string (e.g. June 13, 2026)
function formatDate(dateStr) {
  try {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    return dateStr;
  }
}

// Safe Light-weight custom Markdown-to-HTML parser (Layer 2 Shielded)
function parseMarkdown(mdText) {
  if (!mdText) return '';
  
  // 1. Escape HTML first to prevent raw script execution
  let html = escapeHtml(mdText);

  // 2. Parse code blocks: ```code```
  html = html.replace(/\n```([\s\S]*?)\n```/g, (match, code) => {
    return `<pre><code>${code}</code></pre>`;
  });

  // 3. Parse inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 4. Parse headers: ### Title, ## Title, # Title
  html = html.replace(/\n### (.*?)\n/g, '\n<h3>$1</h3>\n');
  html = html.replace(/\n## (.*?)\n/g, '\n<h2>$1</h2>\n');
  html = html.replace(/\n# (.*?)\n/g, '\n<h1>$1</h1>\n');

  // 5. Parse bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 6. Parse italic: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 7. Parse links: [label](url)
  // Ensure we safely prefix with https:// if it looks like a clean web URL and escape inside
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    const cleanUrl = url.trim().startsWith('javascript:') ? '#' : url;
    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  // 8. Parse blockquotes: > text
  html = html.replace(/\n&gt; (.*?)\n/g, '\n<blockquote>$1</blockquote>\n');

  // 9. Parse bullet lists: - item or * item
  html = html.replace(/\n(?:-|\*)\s+(.*?)\n/g, '\n<ul><li>$1</li></ul>\n');
  // Collapse adjacent <ul> blocks
  html = html.replace(/<\/ul>\n<ul>/g, '\n');

  // 10. Split lines into paragraph paragraphs (excluding headers/blocks)
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    // If line is already an HTML block tag, leave it alone
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('<pre') || trimmed.startsWith('<code') || trimmed.startsWith('<block') || trimmed.startsWith('</')) {
      return line;
    }
    return `<p>${line}</p>`;
  });

  return processedLines.filter(line => line).join('\n');
}
