# RUNTIME DEBUG ANALYSIS - Dashboard Data Flow
## Simulasi Tracing & Debug Script

**Tanggal:** 23 Juli 2026  
**Scope:** Tracing alur data runtime dari login hingga dashboard rendering  
**Metode:** Code simulation + Debug script  

---

## 🎯 SIMULASI ALUR DATA

### **Scenario: User Login dengan Email "zazkia.nur.alifa@auditflow.com"**

---

### **TAHAP 1: LOGIN (index.html)**

**Code:** [`js/login.js:127-137`](js/login.js:127-137)

```javascript
const user = {
    id: Utils.generateId(),              // Contoh: "usr-1234567890"
    email: "zazkia.nur.alifa@auditflow.com",
    name: "zazkia.nur.alifa",            // ← Diextract from email
    role: "auditor",
    remember: true
};

AuditFlow.setUser(user);
```

**Expected Behavior:**
```javascript
// AuditFlow.setUser() - js/app.js:19-22
setUser(user) {
    this.currentUser = user;
    localStorage.setItem('auditflow_user', JSON.stringify(user));
}
```

**localStorage After Login:**
```json
{
  "auditflow_user": {
    "id": "usr-1234567890",
    "email": "zazkia.nur.alifa@auditflow.com",
    "name": "zazkia.nur.alifa",
    "role": "auditor",
    "remember": true
  }
}
```

**⚠️ MASALAH POTENSIAL #1:**
- Name extracted from email: `"zazkia.nur.alifa"` (bukan `"Zazkia Nur Alifa"`)
- Ini akan ditampilkan di dashboard sebagai "Zazkia.nur.alifa" atau "ZA" (initials)

---

### **TAHAP 2: REDIRECT KE DASHBOARD**

**Code:** [`js/login.js:143-145`](js/login.js:143-145)

```javascript
setTimeout(() => {
    Navigation.goToDashboard();
}, 500);

// js/app.js:300-302
goToDashboard() {
    window.location.href = 'dashboard.html';
}
```

**Expected:** Browser navigates to `dashboard.html`

**localStorage State:**
```json
{
  "auditflow_user": { ... },
  "auditflow_projects": undefined  // ← BELUM ADA
}
```

---

### **TAHAP 3: DASHBOARD INITIALIZATION**

**Code:** [`js/dashboard.js:6-66`](js/dashboard.js:6-66)

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!AuditFlow.isAuthenticated()) {
        Navigation.goToLogin();
        return;
    }
    
    function initDashboard() {
        const user = AuditFlow.getUser();  // ← Baca dari localStorage
        
        if (user) {
            userName.textContent = user.name;           // "zazkia.nur.alifa"
            userRole.textContent = "Auditor";
            userAvatar.innerHTML = getInitials(user.name);  // "ZA"
            welcomeName.textContent = user.name.split(' ')[0];  // "zazkia.nur.alifa"
        }
        
        loadProjects();      // ← Load projects
        loadActivities();    // ← Load activities
        setupEventListeners();
    }
    
    initDashboard();
});
```

**Expected User Display:**
- User Name: `"zazkia.nur.alifa"` (di sidebar)
- Initials: `"ZA"` (di avatar)
- Welcome: `"Selamat Datang, zazkia.nur.alifa!"`

**⚠️ MASALAH POTENSIAL #2:**
- Jika `AuditFlow.getUser()` returns `null` → dashboard tidak load
- Jika JavaScript error terjadi → rendering berhenti

---

### **TAHAP 4: LOAD PROJECTS**

**Code:** [`js/dashboard.js:110-118`](js/dashboard.js:110-118)

```javascript
function loadProjects(filteredData = null) {
    const projects = filteredData || DummyData.getProjects();
    
    // Update KPI
    updateKPI(projects);
    
    // Render project cards
    renderProjectCards(projects);
}
```

**Expected Flow:**
```javascript
// DummyData.getProjects() - js/app.js:325-393
getProjects() {
    return [
        {
            id: 'proj-001',
            name: 'Audit PT Maju Jaya',
            company: 'PT Maju Jaya',
            industry: 'Manufaktur',
            auditor: 'Andi Pratama',  // ← MASALAH: Bukan Zazkia
            status: 'in-progress',
            progress: 70,
            cycle: 'Annual',
            startDate: '2024-01-15',
            endDate: '2024-02-28',
            lastUpdated: '2024-01-20T10:30:00'
        },
        // ... 4 more projects
    ];
}
```

**Expected Projects Count:** 5 projects

**⚠️ MASALAH POTENSIAL #3:**
- Jika `localStorage['auditflow_projects']` EXISTS tapi EMPTY ARRAY `[]`
- `AuditFlow.getProjectsList()` akan return `[]` bukan dummy data
- Result: KPI = 0, no project cards

**Expected localStorage:**
```json
{
  "auditflow_user": { ... },
  "auditflow_projects": undefined  // ← Should be undefined for dummy data to load
}
```

**If localStorage['auditflow_projects'] exists:**
```javascript
// js/app.js:117-124
getProjectsList() {
    const stored = localStorage.getItem('auditflow_projects');
    if (stored) {
        return JSON.parse(stored);  // ← Returns [] if empty array stored
    }
    return DummyData.getProjects();  // ← Only if undefined
}
```

---

### **TAHAP 5: UPDATE KPI**

**Code:** [`js/dashboard.js:120-131`](js/dashboard.js:120-131)

```javascript
function updateKPI(projects) {
    const total = projects.length;           // Expected: 5
    const draft = projects.filter(p => p.status === 'draft').length;        // Expected: 1
    const inProgress = projects.filter(p => p.status === 'in-progress' || p.status === 'review').length;  // Expected: 2
    const completed = projects.filter(p => p.status === 'completed').length;  // Expected: 1
    
    animateCounter(kpiTotal, total);         // 5
    animateCounter(kpiDraft, draft);         // 1
    animateCounter(kpiProgress, inProgress); // 2
    animateCounter(kpiCompleted, completed); // 1
}
```

**Expected KPI Values:**
- Total Projects: **5**
- Draft Projects: **1**
- In Progress: **2**
- Completed: **1**

**If KPI shows 0:**
- `projects.length === 0`
- `loadProjects()` received empty array
- `localStorage['auditflow_projects']` is `[]`

---

### **TAHAP 6: LOAD ACTIVITIES**

**Code:** [`js/dashboard.js:228-243`](js/dashboard.js:228-243)

```javascript
function loadActivities() {
    const activities = DummyData.getRecentActivities();
    
    activityList.innerHTML = activities.map(activity => {
        return `
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
        `;
    }).join('');
}
```

**Expected Activities:**
```javascript
// DummyData.getRecentActivities() - js/app.js:423-454
getRecentActivities() {
    return [
        {
            id: 1,
            type: 'update',
            message: 'Flowchart PT Maju Jaya diperbarui',
            time: '2 jam yang lalu',
            project: 'Audit PT Maju Jaya'
        },
        {
            id: 2,
            type: 'comment',
            message: 'Supervisor menambahkan komentar pada Audit Bank Nusantara',
            time: '4 jam yang lalu',
            project: 'Audit Bank Nusantara'
        },
        {
            id: 3,
            type: 'complete',
            message: 'Audit CV Karya Mandiri selesai',
            time: '1 hari yang lalu',
            project: 'Audit CV Karya Mandiri'
        },
        {
            id: 4,
            type: 'create',
            message: 'Project baru dibuat: PT Sejahtera Abadi',
            time: '2 hari yang lalu',
            project: 'Audit PT Sejahtera Abadi'
        }
    ];
}
```

**Expected Activity Count:** 4 activities

**If Activity List is empty:**
- `loadActivities()` not called (JavaScript error before it)
- `DummyData.getRecentActivities()` returns empty array (unlikely)
- `activityList` element not found (HTML ID mismatch)
- JavaScript error in `getActivityIcon()` function

---

### **TAHAP 7: RENDER DASHBOARD**

**Expected Final State:**

```html
<!-- Sidebar -->
<div class="user-info">
    <div class="user-avatar" id="user-avatar">
        <span>ZA</span>  <!-- Initials from "zazkia.nur.alifa" -->
    </div>
    <div class="user-details">
        <span class="user-name" id="user-name">zazkia.nur.alifa</span>
        <span class="user-role" id="user-role">Auditor</span>
    </div>
</div>

<!-- Welcome Section -->
<div class="welcome-section">
    <h1>Selamat Datang, <span id="welcome-name">zazkia.nur.alifa</span>! 👋</h1>
    <p>Berikut ringkasan project audit Anda</p>
</div>

<!-- KPI Cards -->
<div class="kpi-card kpi-card-total">
    <span class="kpi-value" id="kpi-total">5</span>
    <span class="kpi-label">Total Projects</span>
</div>
<div class="kpi-card kpi-card-draft">
    <span class="kpi-value" id="kpi-draft">1</span>
    <span class="kpi-label">Draft Projects</span>
</div>
<div class="kpi-card kpi-card-progress">
    <span class="kpi-value" id="kpi-progress">2</span>
    <span class="kpi-label">Active Audits</span>
</div>
<div class="kpi-card kpi-card-completed">
    <span class="kpi-value" id="kpi-completed">1</span>
    <span class="kpi-label">Completed</span>
</div>

<!-- Project Grid -->
<div class="project-grid" id="project-grid">
    <!-- 5 project cards rendered here -->
</div>

<!-- Recent Activity -->
<div class="recent-activity">
    <h3>Aktivitas Terbaru</h3>
    <div class="activity-list" id="activity-list">
        <!-- 4 activity items rendered here -->
    </div>
</div>
```

---

## 🔍 RANKED POSSIBLE ROOT CAUSES

### **#1: localStorage['auditflow_projects'] is Empty Array []** ⭐⭐⭐⭐⭐

**Probability:** VERY HIGH (90%)

**Why:**
- User previously created/deleted projects
- `localStorage['auditflow_projects']` became `[]`
- `AuditFlow.getProjectsList()` returns `[]` instead of dummy data
- Dashboard shows 0 projects

**Evidence:**
```javascript
// js/app.js:117-124
getProjectsList() {
    const stored = localStorage.getItem('auditflow_projects');
    if (stored) {
        return JSON.parse(stored);  // Returns [] if empty array
    }
    return DummyData.getProjects();  // Only if undefined
}
```

**How to verify:**
```javascript
// Paste in browser console:
console.log(localStorage.getItem('auditflow_projects'));
// If shows "[]" → THIS IS THE PROBLEM
```

---

### **#2: JavaScript Error Prevents Dashboard Initialization** ⭐⭐⭐⭐

**Probability:** HIGH (70%)

**Why:**
- If any JavaScript error occurs before `loadProjects()` or `loadActivities()`
- Dashboard stops rendering
- All data appears empty

**Common causes:**
- Missing DOM element (`getElementById` returns null)
- TypeError on undefined variable
- Script loading order issue

**How to verify:**
```javascript
// Open browser console (F12)
// Look for red error messages
// Check if "Dashboard" or "AuditFlow" errors appear
```

---

### **#3: User Name Extraction from Email** ⭐⭐⭐

**Probability:** MEDIUM (60%)

**Why:**
- Login extracts name from email: `email.split('@')[0]`
- Results in "zazkia.nur.alifa" not "Zazkia Nur Alifa"
- User perceives this as "wrong name"

**Code:**
```javascript
// js/login.js:131
name: emailInput.value.trim().split('@')[0],
// "zazkia.nur.alifa@auditflow.com" → "zazkia.nur.alifa"
```

**How to verify:**
```javascript
// Check localStorage
const user = JSON.parse(localStorage.getItem('auditflow_user'));
console.log(user.name);  // Will show "zazkia.nur.alifa" not "Zazkia Nur Alifa"
```

---

### **#4: DummyData.getProjects() Returns Empty Array** ⭐⭐

**Probability:** LOW (20%)

**Why:**
- Very unlikely - hardcoded to return 5 projects
- Only if code was modified

**How to verify:**
```javascript
// Paste in browser console on dashboard page:
console.log(DummyData.getProjects());
// Should show array of 5 projects
```

---

### **#5: loadActivities() Not Called** ⭐⭐

**Probability:** LOW (15%)

**Why:**
- Code clearly shows it's called in `initDashboard()`
- Only if JavaScript error before it

**How to verify:**
```javascript
// Add console.log in js/dashboard.js line 62:
console.log('loadActivities called');
// Reload dashboard and check console
```

---

### **#6: Activity List Element Not Found** ⭐

**Probability:** VERY LOW (5%)

**Why:**
- HTML clearly has `<div class="activity-list" id="activity-list">`
- `activityList` element should be found

**How to verify:**
```javascript
// Paste in browser console:
console.log(document.getElementById('activity-list'));
// Should show the div element, not null
```

---

## 🛠️ DEBUG SCRIPT

Copy dan paste script ini di **Browser Console** (F12) saat berada di halaman Dashboard:

```javascript
// ============================================
// AUDITFLOW DASHBOARD DEBUG SCRIPT
// ============================================

console.log('=== AUDITFLOW DEBUG START ===\n');

// 1. Check localStorage
console.log('📦 LOCALSTORAGE CHECK:');
console.log('auditflow_user:', localStorage.getItem('auditflow_user'));
console.log('auditflow_projects:', localStorage.getItem('auditflow_projects'));
console.log('auditflow_current_project:', localStorage.getItem('auditflow_current_project'));
console.log('');

// 2. Parse and display user
console.log('👤 USER DATA:');
try {
    const user = JSON.parse(localStorage.getItem('auditflow_user'));
    if (user) {
        console.log('User ID:', user.id);
        console.log('User Name:', user.name);
        console.log('User Email:', user.email);
        console.log('User Role:', user.role);
    } else {
        console.log('❌ No user found in localStorage');
    }
} catch (e) {
    console.log('❌ Error parsing user:', e);
}
console.log('');

// 3. Check projects
console.log('📊 PROJECTS DATA:');
try {
    const projectsStored = localStorage.getItem('auditflow_projects');
    if (projectsStored) {
        const projects = JSON.parse(projectsStored);
        console.log('Stored projects count:', projects.length);
        if (projects.length > 0) {
            console.log('First project:', projects[0]);
        } else {
            console.log('⚠️ Stored projects is EMPTY ARRAY []');
        }
    } else {
        console.log('✅ No stored projects (will use dummy data)');
    }
} catch (e) {
    console.log('❌ Error parsing projects:', e);
}
console.log('');

// 4. Check DummyData
console.log('🎯 DUMMY DATA CHECK:');
try {
    if (typeof DummyData !== 'undefined') {
        const dummyProjects = DummyData.getProjects();
        console.log('DummyData.getProjects() count:', dummyProjects.length);
        console.log('Dummy projects:', dummyProjects);
        
        const dummyActivities = DummyData.getRecentActivities();
        console.log('DummyData.getRecentActivities() count:', dummyActivities.length);
        console.log('Dummy activities:', dummyActivities);
    } else {
        console.log('❌ DummyData object not found');
    }
} catch (e) {
    console.log('❌ Error accessing DummyData:', e);
}
console.log('');

// 5. Check AuditFlow state
console.log('🔧 AUDITFLOW STATE:');
try {
    if (typeof AuditFlow !== 'undefined') {
        console.log('AuditFlow.isAuthenticated():', AuditFlow.isAuthenticated());
        console.log('AuditFlow.currentUser:', AuditFlow.currentUser);
        
        const userFromMethod = AuditFlow.getUser();
        console.log('AuditFlow.getUser():', userFromMethod);
        
        const projectsFromMethod = AuditFlow.getProjectsList();
        console.log('AuditFlow.getProjectsList() count:', projectsFromMethod ? projectsFromMethod.length : 0);
    } else {
        console.log('❌ AuditFlow object not found');
    }
} catch (e) {
    console.log('❌ Error accessing AuditFlow:', e);
}
console.log('');

// 6. Check DOM elements
console.log('🔍 DOM ELEMENTS CHECK:');
const elements = {
    'user-name': document.getElementById('user-name'),
    'user-role': document.getElementById('user-role'),
    'user-avatar': document.getElementById('user-avatar'),
    'welcome-name': document.getElementById('welcome-name'),
    'kpi-total': document.getElementById('kpi-total'),
    'kpi-draft': document.getElementById('kpi-draft'),
    'kpi-progress': document.getElementById('kpi-progress'),
    'kpi-completed': document.getElementById('kpi-completed'),
    'project-grid': document.getElementById('project-grid'),
    'activity-list': document.getElementById('activity-list')
};

for (const [id, element] of Object.entries(elements)) {
    console.log(`${id}:`, element ? '✅ Found' : '❌ Not found');
    if (element) {
        console.log(`  Content: "${element.textContent.trim()}"`);
    }
}
console.log('');

// 7. Check for JavaScript errors
console.log('⚠️ JAVASCRIPT ERRORS:');
// This will show any console errors that occurred
console.log('Check the Console tab for red error messages above');
console.log('');

// 8. Simulate loadProjects
console.log('🔄 SIMULATE LOAD PROJECTS:');
try {
    if (typeof DummyData !== 'undefined') {
        const projects = DummyData.getProjects();
        const total = projects.length;
        const draft = projects.filter(p => p.status === 'draft').length;
        const inProgress = projects.filter(p => p.status === 'in-progress' || p.status === 'review').length;
        const completed = projects.filter(p => p.status === 'completed').length;
        
        console.log('Expected KPI values:');
        console.log('  Total:', total);
        console.log('  Draft:', draft);
        console.log('  In Progress:', inProgress);
        console.log('  Completed:', completed);
    }
} catch (e) {
    console.log('❌ Error in simulation:', e);
}
console.log('');

console.log('=== AUDITFLOW DEBUG END ===');
```

---

## 📋 HASIL YANG DIHARAPKAN

Jika semua berfungsi dengan benar, debug script akan menampilkan:

```
=== AUDITFLOW DEBUG START ===

📦 LOCALSTORAGE CHECK:
auditflow_user: {"id":"usr-1234567890","email":"zazkia.nur.alifa@auditflow.com","name":"zazkia.nur.alifa","role":"auditor","remember":true}
auditflow_projects: null  ← HARUS NULL (undefined)
auditflow_current_project: null

👤 USER DATA:
User ID: usr-1234567890
User Name: zazkia.nur.alifa  ← NAME DARI EMAIL
User Email: zazkia.nur.alifa@auditflow.com
User Role: auditor

📊 PROJECTS DATA:
✅ No stored projects (will use dummy data)

🎯 DUMMY DATA CHECK:
DummyData.getProjects() count: 5
Dummy projects: [{id: 'proj-001', name: 'Audit PT Maju Jaya', ...}, ...]
DummyData.getRecentActivities() count: 4
Dummy activities: [{id: 1, type: 'update', ...}, ...]

🔧 AUDITFLOW STATE:
AuditFlow.isAuthenticated(): true
AuditFlow.currentUser: {id: 'usr-1234567890', ...}
AuditFlow.getUser(): {id: 'usr-1234567890', ...}
AuditFlow.getProjectsList() count: 5

🔍 DOM ELEMENTS CHECK:
user-name: ✅ Found
  Content: "zazkia.nur.alifa"
user-role: ✅ Found
  Content: "Auditor"
user-avatar: ✅ Found
  Content: "ZA"
welcome-name: ✅ Found
  Content: "zazkia.nur.alifa"
kpi-total: ✅ Found
  Content: "5"
kpi-draft: ✅ Found
  Content: "1"
kpi-progress: ✅ Found
  Content: "2"
kpi-completed: ✅ Found
  Content: "1"
project-grid: ✅ Found
activity-list: ✅ Found

⚠️ JAVASCRIPT ERRORS:
(No errors)

🔄 SIMULATE LOAD PROJECTS:
Expected KPI values:
  Total: 5
  Draft: 1
  In Progress: 2
  Completed: 1

=== AUDITFLOW DEBUG END ===
```

---

## 🚨 HASIL YANG MENUNJUKKAN MASALAH

### **Jika localStorage['auditflow_projects'] = []:**

```
📦 LOCALSTORAGE CHECK:
auditflow_projects: []  ← MASALAH! HARUSNYA null

📊 PROJECTS DATA:
Stored projects count: 0
⚠️ Stored projects is EMPTY ARRAY []

🔧 AUDITFLOW STATE:
AuditFlow.getProjectsList() count: 0  ← KPI AKAN 0

🔍 DOM ELEMENTS CHECK:
kpi-total: ✅ Found
  Content: "0"  ← SALAH! HARUSNYA "5"
```

### **Jika JavaScript Error:**

```
⚠️ JAVASCRIPT ERRORS:
Uncaught TypeError: Cannot read property 'textContent' of null
    at initDashboard (dashboard.js:52)

🔍 DOM ELEMENTS CHECK:
user-name: ❌ Not found  ← ERROR MENGHENTIKAN RENDERING
kpi-total: ❌ Not found
```

---

## 📝 CARA MENGGUNAKAN DEBUG SCRIPT

1. **Buka aplikasi dari `index.html`**
2. **Login** dengan email apa saja (misal: `zazkia.nur.alifa@auditflow.com`)
3. **Setelah masuk Dashboard**, tekan **F12** untuk buka Developer Tools
4. **Pilih tab "Console"**
5. **Copy dan paste** seluruh debug script di atas
6. **Tekan Enter**
7. **Screenshot atau copy hasil** dan berikan kepada saya

---

## 🎯 NEXT STEPS

Setelah Anda menjalankan debug script:

1. **Berikan hasil** debug script kepada saya
2. **Saya akan analisis** berdasarkan nilai-nilai yang muncul
3. **Saya akan identifikasi** titik pasti dimana data hilang atau berubah
4. **Saya akan berikan** solusi spesifik untuk masalah yang ditemukan

**Jangan melakukan perubahan kode apapun sebelum kita mengetahui root cause yang pasti.**
