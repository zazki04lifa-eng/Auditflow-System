/**
 * AuditFlow - Dashboard Page JavaScript
 * Version: 1.0 (MVP)
 */

document.addEventListener('DOMContentLoaded', () => {
  // ============================================
  // Check Authentication
  // ============================================
  if (!AuditFlow.isAuthenticated()) {
    Navigation.goToLogin();
    return;
  }

  // ============================================
  // DOM Elements
  // ============================================
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const logoutBtn = document.getElementById('logout-btn');
  const searchInput = document.getElementById('search-input');
  const filterIndustry = document.getElementById('filter-industry');
  const filterStatus = document.getElementById('filter-status');
  const filterCycle = document.getElementById('filter-cycle');
  const gridViewBtn = document.getElementById('grid-view-btn');
  const listViewBtn = document.getElementById('list-view-btn');
  const newProjectBtn = document.getElementById('new-project-btn');
  const projectGrid = document.getElementById('project-grid');
  const emptyState = document.getElementById('empty-state');
  const activityList = document.getElementById('activity-list');

  // User info elements
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const userAvatar = document.getElementById('user-avatar');
  const welcomeName = document.getElementById('welcome-name');

  // KPI elements
  const kpiTotal = document.getElementById('kpi-total');
  const kpiDraft = document.getElementById('kpi-draft');
  const kpiProgress = document.getElementById('kpi-progress');
  const kpiCompleted = document.getElementById('kpi-completed');

  // ============================================
  // Initialize Dashboard
  // ============================================
  function initDashboard() {
    const user = AuditFlow.getUser();

    // Set user info
    if (user) {
      userName.textContent = user.name;
      userRole.textContent = user.role === 'auditor' ? 'Auditor' : 'Supervisor';
      userAvatar.innerHTML = getInitials(user.name);
      welcomeName.textContent = user.name.split(' ')[0];
    }

    // Load projects
    loadProjects();

    // Load activities
    loadActivities();

    // Setup event listeners
    setupEventListeners();
  }

  // ============================================
  // Helper Functions
  // ============================================
  function getInitials(name) {
    // Guard: handle undefined/null/empty string
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return '??';
    }
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function getStatusClass(status) {
    const statusMap = {
      'draft': 'badge-draft',
      'in-progress': 'badge-in-progress',
      'review': 'badge-review',
      'completed': 'badge-completed'
    };
    return statusMap[status] || 'badge-draft';
  }

  function getStatusLabel(status) {
    const labelMap = {
      'draft': 'Draft',
      'in-progress': 'In Progress',
      'review': 'Review',
      'completed': 'Completed'
    };
    return labelMap[status] || status;
  }

  function getProgressBarClass(status) {
    if (status === 'completed') return 'completed';
    if (status === 'review') return 'review';
    if (status === 'in-progress') return 'in-progress';
    return '';
  }

  // ============================================
  // Load and Render Projects
  // ============================================
  function loadProjects(filteredData = null) {
    console.log('[Dashboard.loadProjects] Called with filteredData:', filteredData ? 'provided' : 'null');

    // Use AuditFlow.getProjectsList() to get real projects from localStorage
    const projects = filteredData || AuditFlow.getProjectsList();

    console.log('[Dashboard.loadProjects] Received', projects.length, 'projects');
    console.log('[Dashboard.loadProjects] Projects:', projects.map(p => ({ id: p.id, name: p.name, status: p.status })));

    // Update KPI
    updateKPI(projects);

    // Render project cards
    renderProjectCards(projects);
  }

  function updateKPI(projects) {
    const total = projects.length;
    const draft = projects.filter(p => p.status === 'draft').length;
    const inProgress = projects.filter(p => p.status === 'in-progress' || p.status === 'review').length;
    const completed = projects.filter(p => p.status === 'completed').length;

    // Animate counter
    animateCounter(kpiTotal, total);
    animateCounter(kpiDraft, draft);
    animateCounter(kpiProgress, inProgress);
    animateCounter(kpiCompleted, completed);
  }

  function animateCounter(element, target) {
    let current = 0;
    const duration = 500;
    const step = target / (duration / 16);

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }

  function renderProjectCards(projects) {
    if (projects.length === 0) {
      projectGrid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    projectGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    projectGrid.innerHTML = projects.map(project => {
      // Handle both dummy data fields and real project fields
      const name = project.name || project.projectName || 'Untitled Project';
      const company = project.company || project.companyName || 'Unknown Company';
      const industry = project.industry || '-';
      const cycle = project.cycle || project.auditFrequency || '-';
      const progress = project.progress || 0;
      const status = project.status || 'draft';
      const auditor = project.auditor || project.auditorName || name || 'Unknown';
      const lastUpdated = project.lastUpdated || project.updatedAt || project.createdAt;

      return `
        <div class="project-card" data-id="${project.id}" onclick="openProject('${project.id}')">
          <div class="project-card-header">
            <div>
              <h4 class="project-name">${name}</h4>
              <p class="project-company">${company}</p>
            </div>
            <span class="badge ${getStatusClass(status)}">${getStatusLabel(status)}</span>
          </div>
          
          <div class="project-card-body">
            <div class="project-meta">
              <span class="project-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                ${industry}
              </span>
              <span class="project-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${cycle}
              </span>
            </div>
            
            <div class="project-progress">
              <div class="project-progress-label">
                <span>Progress</span>
                <span>${progress}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar-fill ${getProgressBarClass(status)}" style="width: ${progress}%"></div>
              </div>
            </div>
          </div>
          
          <div class="project-card-footer">
            <div class="project-auditor">
              <div class="project-auditor-avatar">${getInitials(auditor)}</div>
              <span class="project-date">${auditor}</span>
            </div>
            <span class="project-date">${formatRelativeTime(lastUpdated)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return Utils.formatDate(dateString);
  }

  // ============================================
  // Load Activities (Sprint 5: Use AuditTrail if available)
  // ============================================
  function loadActivities() {
    console.log('[Dashboard.loadActivities] Called');
    console.log('[Dashboard.loadActivities] AuditTrail defined?', typeof AuditTrail !== 'undefined');
    console.log('[Dashboard.loadActivities] AuditTrail:', typeof AuditTrail);

    // Try to use AuditTrail for real activity data (Sprint 5)
    if (typeof AuditTrail !== 'undefined') {
      console.log('[Dashboard.loadActivities] Entering AuditTrail block');
      try {
        console.log('[Dashboard.loadActivities] Calling AuditTrail.getRecentActivities(10)');
        const auditActivities = AuditTrail.getRecentActivities(10);
        console.log('[Dashboard.loadActivities] AuditTrail returned', auditActivities.length, 'activities');

        if (auditActivities.length > 0) {
          activityList.innerHTML = auditActivities.map(entry => {
            const summary = entry.summary || 'Activity';
            // Fix: AuditTrail uses 'type' not 'action'
            const actionType = entry.type || entry.action || 'unknown';
            const iconType = mapAuditActionToIconType(actionType);
            const timeAgo = formatTimeAgo(entry.timestamp);

            return `
              <div class="activity-item">
                <div class="activity-icon ${iconType}">
                  ${getActivityIcon(iconType)}
                </div>
                <div class="activity-content">
                  <p class="activity-message">${summary}</p>
                  <span class="activity-project">${entry.projectId || 'System'}</span>
                </div>
                <span class="activity-time">${timeAgo}</span>
              </div>
            `;
          }).join('');
          console.log('[Dashboard.loadActivities] Rendered AuditTrail activities');
          return;
        }
      } catch (e) {
        console.warn('AuditTrail getRecentActivities failed:', e);
      }
    }

    // Fallback to dummy data if AuditTrail not available or empty
    const activities = DummyData.getRecentActivities();

    activityList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}">
          ${getActivityIcon(activity.type)}
        </div>
        <div class="activity-content">
          <p class="activity-message">${activity.message}</p>
          <span class="activity-project">${activity.project}</span>
        </div>
        <span class="activity-time">${activity.time}</span>
      </div>
    `).join('');
  }

  // Map AuditActionType to icon type for activity display
  function mapAuditActionToIconType(action) {
    const actionMap = {
      'session.start': 'create',
      'session.end': 'update',
      'project.create': 'create',
      'project.update': 'update',
      'project.delete': 'update',
      'project.open': 'update',
      'flowchart.generate': 'create',
      'flowchart.lock': 'complete',
      'flowchart.unlock': 'update',
      'flowchart.node.add': 'create',
      'flowchart.node.edit': 'update',
      'flowchart.node.delete': 'update',
      'wcgw.detect': 'update',
      'wcgw.accept': 'complete',
      'wcgw.reject': 'update',
      'review.approve': 'complete',
      'review.reject': 'update',
      'export.pdf': 'complete',
      'export.json': 'complete'
    };
    return actionMap[action] || 'update';
  }

  // Format timestamp to relative time (e.g., "5 menit yang lalu")
  function formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return Utils.formatDate(timestamp);
  }

  function getActivityIcon(type) {
    const icons = {
      update: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
      comment: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      complete: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      create: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
    };
    return icons[type] || icons.update;
  }

  // ============================================
  // Filter Projects
  // ============================================
  function filterProjects() {
    let projects = DummyData.getProjects();

    const searchTerm = searchInput.value.toLowerCase();
    const industry = filterIndustry.value;
    const status = filterStatus.value;
    const cycle = filterCycle.value;

    if (searchTerm) {
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.company.toLowerCase().includes(searchTerm) ||
        p.industry.toLowerCase().includes(searchTerm) ||
        p.auditor.toLowerCase().includes(searchTerm)
      );
    }

    if (industry) {
      projects = projects.filter(p => p.industry === industry);
    }

    if (status) {
      projects = projects.filter(p => p.status === status);
    }

    if (cycle) {
      projects = projects.filter(p => p.cycle === cycle);
    }

    loadProjects(projects);
  }

  // ============================================
  // Event Listeners
  // ============================================
  function setupEventListeners() {
    // Sidebar toggle (mobile)
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside (mobile)
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024 &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target) &&
        sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin logout?')) {
        AuditFlow.logout();
      }
    });

    // Search (debounced)
    searchInput.addEventListener('input', Utils.debounce(filterProjects, 300));

    // Filters
    filterIndustry.addEventListener('change', filterProjects);
    filterStatus.addEventListener('change', filterProjects);
    filterCycle.addEventListener('change', filterProjects);

    // View toggle
    gridViewBtn.addEventListener('click', () => {
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
      projectGrid.style.display = 'grid';
    });

    listViewBtn.addEventListener('click', () => {
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
      projectGrid.style.display = 'flex';
      projectGrid.style.flexDirection = 'column';
    });

    // New project button
    newProjectBtn.addEventListener('click', () => {
      Navigation.goToCreateProject();
    });
  }

  // ============================================
  // Global Functions (for onclick handlers)
  // ============================================
  window.openProject = function (projectId) {
    // For prototype, just redirect to create project page
    // In real app, this would open the specific project
    console.log('Opening project:', projectId);
    alert(`Membuka project: ${projectId}\n(Fitur ini akan membuka project workspace di tahap berikutnya)`);
  };

  // ============================================
  // Initialize
  // ============================================
  initDashboard();
});