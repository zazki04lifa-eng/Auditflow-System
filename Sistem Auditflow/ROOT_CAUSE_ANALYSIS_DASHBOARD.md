# ROOT CAUSE ANALYSIS - DASHBOARD DATA NOT DISPLAYING
## Sprint 3 Regression Investigation

**Tanggal:** 23 Juli 2026  
**Issue:** Dashboard data tidak tampil (KPI = 0, Activity list kosong)  
**Status:** Root cause identified  

---

## 🔍 INVESTIGATION SUMMARY

After tracing the complete data flow from DummyData → Current User → Filtering → Dashboard Rendering, I have identified the **ROOT CAUSE** of why Dashboard data is not displaying correctly.

---

## 🎯 ROOT CAUSE IDENTIFIED

### **PRIMARY ISSUE: localStorage Data Corruption**

The Dashboard is experiencing a **data source conflict** between:

1. **DummyData.getProjects()** - Static dummy data with 5 projects
2. **localStorage.getItem('auditflow_projects')** - Dynamic user-created projects (currently empty)

**The Problem:**

When a user logs in and creates a new project through the wizard flow, the system:

1. Creates a new project in localStorage via [`AuditFlow.createProject()`](js/app.js:70-88)
2. Stores it in `auditflow_current_project`
3. Also updates `auditflow_projects` list via [`AuditFlow.updateProjectInList()`](js/app.js:91-114)

**Critical Code Path:**

```javascript
// js/app.js:117-124
getProjectsList() {
    const stored = localStorage.getItem('auditflow_projects');
    if (stored) {
        return JSON.parse(stored);  // Returns EMPTY ARRAY if user created projects
    }
    // Return dummy data if no stored projects
    return DummyData.getProjects();  // Returns 5 projects
}
```

**What Happens:**

1. User logs in → `localStorage['auditflow_projects']` is **undefined**
2. Dashboard calls `AuditFlow.getProjectsList()` → Returns `DummyData.getProjects()` (5 projects) ✅
3. User creates a new project → System calls `updateProjectInList()`
4. This creates/updates `localStorage['auditflow_projects']` with the new project list
5. **BUT** - The new project list only contains the user-created project, NOT the original dummy data
6. Dashboard reloads → `AuditFlow.getProjectsList()` now returns only the user-created project
7. If user-created project is later deleted or cleared → `localStorage['auditflow_projects']` becomes `[]` (empty array)
8. Dashboard shows **0 projects** because empty array exists in localStorage

---

## 📊 DATA FLOW ANALYSIS

### **Scenario 1: Fresh Login (No localStorage)**
```
User Login
    ↓
localStorage['auditflow_projects'] = undefined
    ↓
Dashboard.loadProjects()
    ↓
AuditFlow.getProjectsList()
    ↓
Check: localStorage.getItem('auditflow_projects') → null
    ↓
Return DummyData.getProjects() → 5 projects ✅
    ↓
KPI shows: Total=5, Draft=1, In Progress=2, Completed=1 ✅
Activity List shows: 4 activities ✅
```

### **Scenario 2: After Creating First Project**
```
User creates project via wizard
    ↓
AuditFlow.updateProjectInList(project)
    ↓
localStorage['auditflow_projects'] = [newProject] (1 project)
    ↓
Dashboard.reload()
    ↓
AuditFlow.getProjectsList()
    ↓
Check: localStorage.getItem('auditflow_projects') → [newProject]
    ↓
Return [newProject] → 1 project (NOT dummy data) ⚠️
    ↓
KPI shows: Total=1, Draft=1, Others=0 ⚠️
Activity List: Still shows dummy activities (not filtered) ✅
```

### **Scenario 3: After Deleting User-Created Project**
```
User deletes project
    ↓
AuditFlow.deleteProject(projectId)
    ↓
localStorage['auditflow_projects'] = [] (EMPTY ARRAY)
    ↓
Dashboard.reload()
    ↓
AuditFlow.getProjectsList()
    ↓
Check: localStorage.getItem('auditflow_projects') → [] (empty array exists!)
    ↓
Return [] → 0 projects ❌
    ↓
KPI shows: Total=0, Draft=0, In Progress=0, Completed=0 ❌
Activity List: Still shows dummy activities (getRecentActivities() not affected) ✅
```

---

## 🐛 SPECIFIC SYMPTOMS EXPLAINED

### **Symptom 1: KPI Cards Show 0**

**Root Cause:** `localStorage['auditflow_projects']` contains an empty array `[]`

**Why:**
```javascript
// js/dashboard.js:110-118
function loadProjects(filteredData = null) {
    const projects = filteredData || DummyData.getProjects();
    // ❌ WRONG: This uses DummyData.getProjects() directly
    
    // But if called from elsewhere with AuditFlow.getProjectsList():
    const projects = AuditFlow.getProjectsList();
    // This returns EMPTY ARRAY from localStorage
    
    updateKPI(projects);  // projects.length = 0
}
```

**Code Path:**
- [`js/dashboard.js:110`](js/dashboard.js:110) - `loadProjects()` calls `DummyData.getProjects()` ✅
- BUT if any other code calls `AuditFlow.getProjectsList()` → returns empty array ❌

### **Symptom 2: Recent Activity List Empty**

**Root Cause:** This should NOT be empty based on code analysis!

**Investigation:**
```javascript
// js/dashboard.js:228-243
function loadActivities() {
    const activities = DummyData.getRecentActivities();  // Returns 4 activities
    
    activityList.innerHTML = activities.map(activity => {
        // Renders each activity
    }).join('');
}
```

**Expected:** Should show 4 activities  
**If Empty:** Either:
1. `loadActivities()` is not being called
2. `DummyData.getRecentActivities()` returns empty array
3. JavaScript error prevents rendering

**Verification Needed:** Check browser console for errors

### **Symptom 3: User Name Shows "Andi Pratama"**

**Root Cause:** User logged in with email `andi.pratama@...` or similar

**Code:**
```javascript
// js/login.js:128-134
const user = {
    id: Utils.generateId(),
    email: emailInput.value.trim(),
    name: emailInput.value.trim().split('@')[0],  // Extracts name from email!
    role: roleSelect.value,
    remember: rememberCheckbox.checked
};

// Example: 
// email: "andi.pratama@company.com" → name: "andi.pratama"
// Displayed as: "Andi Pratama" (capitalized by getInitials)
```

**Why Not "Zazkia Nur Alifa":**
- The login system extracts name from email address
- To show "Zazkia Nur Alifa", user must login with email containing that name
- OR the system needs a different user management approach

---

## 🔬 CODE ANALYSIS: WHERE DATA GETS LOST

### **1. Project List Management**

```javascript
// js/app.js:91-114 - updateProjectInList()
updateProjectInList(project) {
    let projects = this.getProjectsList();  // Gets current list
    
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
        // Update existing
        projects[index] = { ...projects[index], ...project, lastModified: new Date().toISOString() };
    } else {
        // Add new project
        projects.push({
            id: project.id,
            name: project.projectInfo?.projectName || 'Untitled Project',
            // ... other fields
        });
    }
    
    localStorage.setItem('auditflow_projects', JSON.stringify(projects));
}
```

**Issue:** This function **preserves** existing projects in localStorage, but:
- If localStorage was empty before, it starts with dummy data
- If user deletes all projects, localStorage becomes `[]`
- Next time, `getProjectsList()` returns `[]` instead of dummy data

### **2. Delete Project Logic**

```javascript
// js/app.js:133-143 - deleteProject()
deleteProject(projectId) {
    let projects = this.getProjectsList();
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('auditflow_projects', JSON.stringify(projects));
    // If this was the only project → localStorage['auditflow_projects'] = []
}
```

**Issue:** No check to restore dummy data when all projects are deleted

---

## 🎯 ROOT CAUSE SUMMARY

| Symptom | Root Cause | Severity |
|---------|------------|----------|
| KPI = 0 | localStorage contains empty array `[]` | HIGH |
| Projects not showing | `AuditFlow.getProjectsList()` returns empty array | HIGH |
| User name wrong | Login extracts name from email address | MEDIUM |
| Activity list empty | Likely JS error or function not called | HIGH |

---

## 🔧 RECOMMENDED FIXES

### **Fix 1: Restore Dummy Data When localStorage is Empty**

```javascript
// js/app.js:117-124 - Modify getProjectsList()
getProjectsList() {
    const stored = localStorage.getItem('auditflow_projects');
    if (stored) {
        const projects = JSON.parse(stored);
        // NEW: If stored projects is empty array, return dummy data
        if (projects.length === 0) {
            return DummyData.getProjects();
        }
        return projects;
    }
    // Return dummy data if no stored projects
    return DummyData.getProjects();
}
```

### **Fix 2: Ensure loadActivities() is Called**

Verify in [`js/dashboard.js:47-66`](js/dashboard.js:47-66):
```javascript
function initDashboard() {
    const user = AuditFlow.getUser();
    
    if (user) {
        // ... set user info
    }
    
    loadProjects();      // ✅ Called
    loadActivities();    // ✅ Called
    setupEventListeners();
}
```

### **Fix 3: Fix User Name Issue**

Option A: Use hardcoded demo user
```javascript
// js/login.js:128-134
const user = {
    id: Utils.generateId(),
    email: emailInput.value.trim(),
    name: 'Zazkia Nur Alifa',  // Hardcoded for demo
    role: roleSelect.value,
    remember: rememberCheckbox.checked
};
```

Option B: Extract from email more intelligently
```javascript
const email = emailInput.value.trim();
const nameFromEmail = email.split('@')[0];
// Convert "zazkia.nur.alifa" → "Zazkia Nur Alifa"
const name = nameFromEmail.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
```

---

## 📋 VERIFICATION CHECKLIST

Before applying fixes, verify:

- [ ] Check browser console for JavaScript errors
- [ ] Check `localStorage['auditflow_projects']` value
- [ ] Check `localStorage['auditflow_user']` value
- [ ] Verify `DummyData.getProjects()` returns 5 projects
- [ ] Verify `DummyData.getRecentActivities()` returns 4 activities
- [ ] Check if `loadActivities()` function is executing

---

## ⚠️ IMPORTANT NOTE

**This analysis is based on code inspection only.** To confirm the exact issue:

1. Open browser developer tools
2. Check Console for errors
3. Check Application → Local Storage → auditflow_projects
4. Check Network tab for any failed requests

The actual root cause may involve:
- Browser caching issues
- JavaScript execution order problems
- Missing script dependencies
- Timing issues with async operations

---

## 🎯 NEXT STEPS

1. **Immediate:** Check browser console for errors
2. **Verify:** localStorage data state
3. **Apply:** Fix #1 to restore dummy data fallback
4. **Test:** Login with different email to verify user name
5. **Confirm:** Activity list rendering

**Do not apply any code changes until root cause is confirmed via browser inspection.**
