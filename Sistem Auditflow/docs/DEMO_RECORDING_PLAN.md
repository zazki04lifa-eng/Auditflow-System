# Demo Recording Plan - Contingency Backup

**Date:** 2026-07-24  
**Priority:** CRITICAL - DEMO SAFETY NET  
**Status:** READY TO EXECUTE

## Objective

Record a complete, working demo flow as backup evidence before any further changes. This serves as a safety net in case new bugs appear during the live demo.

## Core Demo Flow (5-7 minutes)

### 1. Login (30 seconds)
- **URL:** `index.html`
- **Action:** Enter credentials, click Login
- **Expected:** Redirect to Dashboard
- **Narration:** "Sistem AuditFlow dimulai dengan login yang aman."

### 2. Dashboard Overview (45 seconds)
- **URL:** `dashboard.html`
- **Action:** Show project list, KPI cards
- **Expected:** Display existing projects
- **Narration:** "Dashboard menampilkan overview project audit yang sedang berjalan."

### 3. Create New Project (1 minute)
- **Action:** Click "New Project" button
- **URL:** `create-project.html`
- **Action:** Fill in project info (use dummy data)
- **Expected:** Project created, redirect to Understanding Business
- **Narration:** "Kita buat project audit baru untuk siklus revenue."

### 4. Understanding Business (1.5 minutes)
- **URL:** `understanding-business.html`
- **Action:** Enter business process description
- **Sample Text:** "Proses penjualan dimulai dari penerimaan pesanan pelanggan. Kemudian, tim penjualan memverifikasi ketersediaan barang. Setelah itu, bagian gudang menyiapkan barang untuk dikirim. Lalu, faktur dibuat dan dikirim ke pelanggan. Kemudian, pembayaran diterima dan dicatat dalam sistem."
- **Expected:** Text saved, can proceed to next step
- **Narration:** "Deskripsi proses bisnis diisi untuk memahami alur yang akan diaudit."

### 5. Flowchart Generation (1 minute)
- **URL:** `flowchart-prep.html`
- **Action:** Set generation parameters, click Generate
- **Expected:** Flowchart created with nodes
- **Narration:** "Sistem menghasilkan flowchart berdasarkan deskripsi proses bisnis."

### 6. Flowchart Editor & WCGW Detection (2 minutes)
- **URL:** `flowchart-editor.html`
- **Action:** 
  - Show the generated flowchart
  - Click "Run WCGW Detection" button
  - Show detection results panel
- **Expected:** Detections appear with risk levels
- **Narration:** "Sistem mendeteksi potensi Weaknesses, Control Gaps, dan Weaknesses (WCGW) dalam flowchart."

### 7. Close Recording (15 seconds)
- **Narration:** "Demo alur inti AuditFlow selesai. Sistem siap untuk audit yang lebih komprehensif."

## Recording Guidelines

### Technical Setup
- **Tool:** Use built-in screen recorder (Windows Game Bar: Win+G)
- **Resolution:** 1920x1080 or native screen resolution
- **Audio:** Optional - can add voiceover later
- **Browser:** Chrome/Edge with developer tools closed

### Best Practices
1. **Clean Desktop:** Close all unnecessary applications
2. **Browser Tabs:** Only have AuditFlow tabs open
3. **Fresh Session:** Use incognito/private mode to avoid cached data issues
4. **Stable Connection:** Ensure no network interruptions
5. **Multiple Takes:** Record 2-3 takes to have options

### What to Avoid
- ❌ Don't click on Knowledge Base in sidebar
- ❌ Don't click on Settings in sidebar
- ❌ Don't explore unrelated features
- ❌ Don't show error messages or console logs
- ❌ Don't rush - speak clearly and pause between steps

## Backup Responses for Questions

If asked about features not in the demo:

| Question | Response |
|----------|----------|
| "What about Knowledge Base?" | "Itu di roadmap sprint berikutnya. Fokus kita saat ini adalah core audit workflow." |
| "Can you show Settings?" | "Settings masih dalam pengembangan. Untuk demo ini, kita fokus pada alur audit utama." |
| "What about advanced analytics?" | "Analytics adalah fitur sprint depan. Yang penting sekarang adalah foundation audit yang solid." |
| "Why is this feature missing?" | "Kita menggunakan pendekatan agile - rilis bertahap. Sprint ini fokus pada core workflow." |

## File Naming Convention

Save recordings as:
- `AuditFlow_Demo_Core_v1.mp4`
- `AuditFlow_Demo_Core_v2.mp4`
- `AuditFlow_Demo_Full_v1.mp4` (if doing extended version)

## Storage Location

Save to:
- Primary: `c:\Users\ASUS 409\Videos\AuditFlow_Demo\`
- Backup: Upload to Google Drive/Dropbox immediately after recording

## Success Criteria

A successful recording should:
- ✅ Show complete flow from Login to WCGW Detection
- ✅ Have clear, readable text (no blurry screens)
- ✅ Demonstrate smooth navigation without errors
- ✅ Be 5-7 minutes in length
- ✅ Have clear narration (if voiceover included)

## Immediate Action Required

**NOW:** Before any further code changes, record at least 2 complete takes of the core demo flow. This ensures we have backup evidence even if new bugs appear.

## Post-Recording Checklist

- [ ] Recording saved with proper filename
- [ ] File uploaded to cloud backup
- [ ] Test playback to ensure audio/video quality
- [ ] Note any issues or retakes needed
- [ ] Keep file accessible for demo day

---

**REMEMBER:** This is a SAFETY NET. Even if the live demo has issues, we have proof that the system works. Stay calm, stick to the script, and avoid unscripted exploration.
