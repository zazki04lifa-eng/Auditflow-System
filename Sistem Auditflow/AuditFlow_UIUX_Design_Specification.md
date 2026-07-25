# AuditFlow — UI/UX Design Specification
**Prepared for:** Development Team
**Prepared by:** Senior UI/UX & Product Designer
**Product:** AuditFlow — Audit Intelligence Platform
**Version:** 1.0 (MVP Design Spec)

---

## 1. Information Architecture

### 1.1 Struktur Halaman

```
AuditFlow
│
├── Auth
│   ├── Login
│   ├── Register
│   └── Forgot Password / Reset Password
│
├── Dashboard (Home)
│
├── Project Workspace
│   ├── Project List (embedded in Dashboard, dengan Search/Filter)
│   └── Create Project Wizard
│        ├── Step 1 — Project Information
│        ├── Step 2 — Understanding Business
│        ├── Step 3 — Flowchart Generation
│        ├── Step 4 — Flowchart Editor & Review
│        ├── Step 5 — Audit Analysis
│        ├── Step 6 — Review & Approval
│        └── Step 7 — Export & Reporting
│
├── Flowchart Editor (deep-link, dapat diakses ulang dari Project Detail)
│
├── Audit Analysis Page (deep-link, dapat diakses ulang dari Project Detail)
│
├── Supervisor Review Page (role: Supervisor/Admin)
│
├── Chat Assistant (panel global, kontekstual per-project)
│
├── Knowledge Base (Shape Library, Risk Library, COSO/ISA Library, dll)
│
├── Notifications Center
│
└── Settings
     ├── Profile
     ├── API Key Management
     ├── Mode (Rule-Based / AI)
     └── Preferences (tema, orientasi default, format export)
```

### 1.2 Hubungan Antar Halaman

- **Login** → **Dashboard**: satu-satunya pintu masuk aplikasi.
- **Dashboard** adalah hub utama: dari sini user membuka project lama atau memulai **Create Project Wizard**.
- **Create Project Wizard** bersifat *linear-guided* (Step 1 → 7) tetapi setiap step dapat diakses kembali via sidebar step-indicator selama project belum di-lock/approved.
- **Flowchart Editor** adalah sub-halaman dari Step 3–4, namun juga dapat dibuka langsung dari **Project Detail** setelah project dibuat (untuk revisi).
- **Audit Analysis Page** adalah sub-halaman dari Step 5, dapat diakses ulang untuk edit sebelum submit.
- **Review & Approval** hanya muncul setelah status project "Submitted"; halaman ini eksklusif untuk role Supervisor/Admin, namun Auditor dapat melihat versi read-only + komentar.
- **Chat Assistant** muncul sebagai panel *docked* di kanan pada semua halaman dalam konteks project (Step 2–6), bukan halaman terpisah.
- **Export & Reporting** hanya aktif setelah Audit Analysis selesai (atau setelah approval, tergantung setting workflow).

### 1.3 Navigasi Utama

**Top Navigation Bar (global, selalu terlihat):**
- Logo AuditFlow (klik → Dashboard)
- Search global (project, client, dsb.)
- Notification bell (dropdown)
- Mode indicator (Rule-Based / AI) — badge kecil
- User avatar → dropdown (Profile, Settings, Logout)

**Left Sidebar (kontekstual, muncul saat masuk ke project):**
- Step indicator (1–7) sebagai vertical stepper
- Quick links: Overview, Flowchart, Audit Analysis, Audit Trail, Comments
- Collapsible untuk memperluas ruang kerja (penting untuk Flowchart Editor)

**Breadcrumb:**
Dashboard / [Nama Project] / [Step Aktif]

---

## 2. User Interface Design Specification

### A. Login Page

**Tujuan:** Autentikasi user secara aman dan cepat, mencerminkan kesan software enterprise/professional.

**Layout:** Split-screen 50/50 — kiri panel branding (logo, tagline, ilustrasi flowchart abstrak), kanan form login. Pada tablet: form login full-width, ilustrasi disembunyikan.

**Komponen:**
- Input Email/Username
- Input Password (dengan toggle show/hide)
- Checkbox "Remember Me"
- Link "Forgot Password?"
- Button "Login" (primary, full-width)
- Divider "atau"
- Link "Belum punya akun? Register"
- Footer kecil: versi aplikasi, link privacy/terms

**Informasi ditampilkan:** Tagline *"Transforming Business Process into Intelligent Audit Analysis."*

**User Interaction:** Submit form → validasi inline (format email, password kosong) → loading state pada button → redirect ke Dashboard atau tampilkan error message di atas form.

**Action tersedia:** Login, Forgot Password, Register.

---

### B. Dashboard

**Tujuan:** Memberi gambaran cepat status seluruh project audit dan menjadi titik awal semua aktivitas.

**Layout:** 3 zona utama —
1. Header ringkasan (KPI cards horizontal)
2. Toolbar aksi (Search, Filter, "+ New Project")
3. Grid/List Project Card

**Komponen:**
- **KPI Summary Cards** (4 kartu): Total Project, Draft, In Progress/Review, Completed
- **Filter Bar:** dropdown Industry, Auditor, Status, Audit Cycle; date range picker
- **Search bar** dengan autosuggest nama project/klien
- **View toggle:** Grid view / List view
- **Project Card** (lihat Component Spec) — menampilkan nama project, client, industri, progress bar, status badge, tanggal terakhir diubah
- **Quick Access:** section kecil di atas grid — "Lanjutkan Project Terakhir"
- **Empty state** untuk user baru: ilustrasi + CTA "Buat Project Pertama Anda"
- **Notification panel** (slide-in dari kanan saat bell diklik)

**Informasi ditampilkan:** Status project (Draft/In Progress/Review/Completed), progress %, nama auditor, tanggal audit.

**User Interaction:**
- Klik Project Card → buka Project Detail/lanjutkan wizard di step terakhir
- Klik "+ New Project" → buka Create Project Wizard Step 1
- Search/filter → hasil ter-update secara real-time (client-side atau debounce)

**Action tersedia:** Create Project, Open Project, Duplicate Project (context menu), Archive/Delete (context menu), Search, Filter.

---

### C. Create Project Wizard

Desain wizard menggunakan **stepper horizontal di bagian atas** (desktop) atau **progress bar bernomor** (tablet), dengan tombol **Back / Save Draft / Next** konsisten di setiap step (posisi footer, sticky).

#### C.1 Step 1 — Project Information
**Tujuan:** Menangkap metadata project sebagai dasar seluruh proses.
**Layout:** Form single-column, max-width 720px, centered — kesan formal/enterprise.
**Komponen:** Input Project Name, Auditor Name (auto-filled dari profil, editable), Company/Client, dropdown Industry, date range Audit Period, dropdown Audit Cycle.
**Interaksi:** Auto-save setiap perubahan field (debounce 2 detik) dengan indikator kecil "Tersimpan otomatis".
**Action:** Save Draft, Back (disabled di step 1), Next.

#### C.2 Step 2 — Understanding Business Input
**Tujuan:** Mengumpulkan deskripsi proses bisnis sebagai bahan generate flowchart.
**Layout:** Dua tab: "Text Input" dan "Upload Document". Area kerja luas (textarea besar atau drop-zone upload).
**Komponen:**
- Tab Text: rich textarea dengan word counter
- Tab Upload: drag-and-drop zone (PDF/DOCX), progress upload, preview thumbnail dokumen
- Panel preview dokumen di sisi kanan (split view) setelah upload
- Tombol "Edit Deskripsi" untuk menyunting hasil ekstraksi sebelum lanjut
**Interaksi:** Upload → progress bar → auto-extract text → tampil di editor untuk direview/diedit manual.
**Action:** Save Draft, Back, Next (disabled sampai ada input valid).

#### C.3 Step 3 — Flowchart Generation
**Tujuan:** Menentukan parameter output sebelum sistem men-generate flowchart.
**Layout:** Card pilihan besar di tengah layar (bukan form kecil) — mengesankan ini adalah keputusan penting.
**Komponen:**
- Toggle/Card selector: Orientation (Vertical / Horizontal) — dengan ilustrasi mini tiap opsi
- Toggle/Card selector: Output Type (Flowchart Only / Flowchart + WCGW)
- Button besar "Generate Flowchart" (primary, center)
- Loading state: progress indicator dengan tahapan ("Mengidentifikasi Actor... Menyusun Swimlane... Merender Flowchart...") agar user paham proses berjalan, bukan hang.
**Interaksi:** Setelah generate selesai → auto-redirect ke Step 4 (Flowchart Editor).
**Action:** Back, Generate & Next.

#### C.4 Step 4 — Flowchart Review & Editing
Lihat bagian **D. Flowchart Editor** secara detail di bawah.
**Action tambahan pada step ini:** Back, Save Draft, **Lock Flowchart & Next** (tombol ini memunculkan konfirmasi modal karena mengunci struktur untuk analysis).

#### C.5 Step 5 — Audit Analysis
Lihat bagian **E. Audit Analysis Page**.
**Action:** Back, Save Draft, **Submit for Review**.

#### C.6 Step 6 — Review & Approval
Lihat bagian **F. Supervisor Review Page**. Bagi Auditor, halaman ini tampil sebagai read-only status tracker + komentar.

#### C.7 Step 7 — Export & Reporting
**Tujuan:** Finalisasi dan pengunduhan dokumen audit.
**Layout:** Grid pilihan export dalam bentuk card, masing-masing dengan preview thumbnail dan format pilihan.
**Komponen:**
- Card "Export Flowchart" (PNG/JPG)
- Card "Export Flowchart + WCGW" (PNG/JPG)
- Card "Export Audit Analysis" (PDF/Word)
- Card "Export Full Audit Report" (PDF/Word) — dengan checklist section yang ingin disertakan
- Preview modal sebelum download final
**Action:** Download, Kembali ke Dashboard (tombol "Selesaikan Project").

---

### D. Flowchart Editor (FITUR UTAMA)

**Tujuan:** Memberikan ruang kerja visual yang presisi bagi auditor untuk mereview dan mengedit flowchart hasil generate sebelum dikunci sebagai dasar analisis audit.

#### D.1 Layout Canvas
- **Infinite canvas** dengan grid background halus (dot-grid, bukan garis solid, agar tidak mengganggu visual node)
- Canvas menempati **≥80% area layar**; panel lain bersifat collapsible/floating agar canvas selalu jadi fokus utama
- **Auto Center & Auto Fit Screen** saat pertama kali flowchart digenerate
- **Mini Map** di pojok kanan bawah canvas (semi-transparent, muncul otomatis saat flowchart lebih besar dari viewport)
- **Zoom control** di pojok kanan bawah: slider + tombol (-) (+) + persentase (25%–400%) + tombol "Fit to Screen"
- Snap-to-grid aktif secara default saat drag node

#### D.2 Posisi Toolbar
- **Toolbar atas (horizontal, sticky):** Undo, Redo, Add Node (dropdown shape), Add Connector, Delete, Zoom In/Out, Fit Screen, Orientation Toggle, "AI Revision" (button dengan ikon sparkle), Lock/Unlock Flowchart, Version History
- **Toolbar kiri (vertical, collapsible):** Shape Library palette — drag shape langsung ke canvas
- **Panel kanan (collapsible, docked):** context-sensitive
  - Saat tidak ada node dipilih → tab "Layers/Swimlane" & tab "AI Chat/Revision"
  - Saat node dipilih → Node Properties Panel (edit teks, tipe shape, warna WCGW jika ada)

#### D.3 Shape Library
Ditampilkan sebagai palette ikon vertikal di kiri, masing-masing dengan tooltip nama & fungsi, sesuai standar ANSI/ISO 5807:
| Shape | Label |
|---|---|
| Terminator | Start/End |
| Process (rectangle) | Aktivitas |
| Decision (diamond) | Keputusan |
| Manual Input | Input Manual |
| Manual Operation | Aktivitas Manual |
| Document | Dokumen |
| Multiple Document | Banyak Dokumen |
| Database (cylinder) | Sistem/Database |
| Off-page Connector | Penghubung Antar Halaman |

Interaksi: drag-and-drop shape ke canvas, atau klik shape → muncul di posisi cursor terakhir.

#### D.4 Swimlane Structure
- Lane disusun **horizontal (default vertical flow)** atau **vertical (default horizontal flow)** tergantung orientation yang dipilih di Step 3
- Setiap lane memiliki **header** berisi nama Actor/Department, dengan warna header netral (abu muda) agar tidak bersaing dengan warna node
- Lebar/tinggi lane menyesuaikan isi secara otomatis (auto-resize), dengan jarak antar-lane konsisten (spacing token, misal 24px)
- Lane dapat di-collapse individual untuk fokus pada satu departemen tertentu (UX improvement dari spec asli — memudahkan flowchart kompleks)
- Tombol "+ Tambah Lane" muncul di ujung susunan lane

#### D.5 Connector System
- Connector berbentuk **orthogonal line** dengan rounded corner, tebal 2px, warna abu gelap
- Arah panah otomatis mengikuti alur proses (auto-routing) dengan **crossing detection** — sistem mengoptimalkan agar garis silang minimal
- User dapat menarik ulang titik ujung connector (reconnect) dengan drag handle yang muncul saat connector dipilih
- Connector tidak boleh menggantung — sistem menampilkan warning visual (garis merah putus-putus) jika ada endpoint tidak terhubung
- Klik-kanan pada connector → context menu: Delete, Add Label, Change Style

#### D.6 Node Editing
- **Klik node** → node ter-highlight (border biru tua) + Node Properties Panel muncul di kanan
- **Double-klik node** → masuk mode inline text edit langsung di canvas
- **Drag node** → snap to grid aktif, garis bantu alignment (smart guides) muncul saat sejajar dengan node lain
- **Klik kanan node** → context menu: Edit Text, Change Shape, Add WCGW, Delete, Duplicate
- Constraint diterapkan dengan validasi real-time: Start/End tidak bisa dihapus (tombol delete disabled + tooltip alasan), Decision harus punya cabang Yes/No (warning muncul jika tidak lengkap)

#### D.7 WCGW Indicator
- Ditampilkan sebagai **ikon lingkaran merah kecil (⚠)** menempel di sudut kanan atas node terkait, tidak mengubah ukuran/struktur node
- **Hover** → tooltip ringkas (Risk singkat + Risk Level badge warna)
- **Klik** → side panel kanan terbuka menampilkan detail lengkap: WCGW, Risk, Risk Level, Existing Control, Recommendation, Confidence Score
- User dapat menambah WCGW manual via context menu node → "Add WCGW" → modal form singkat

#### D.8 Risk Visualization
- Risk Level direpresentasikan dengan **badge warna**: Merah (High), Oranye (Medium), Kuning (Low) — konsisten dipakai juga di Audit Analysis Page
- Opsi toggle di toolbar: "Highlight High Risk Only" — menonaktifkan opacity node lain untuk fokus visual pada proses berisiko tinggi (UX improvement, memudahkan reviewer/supervisor)
- Confidence Score ditampilkan sebagai small progress ring di dalam detail panel WCGW

#### D.9 Version Control
- Tombol "Version History" pada toolbar atas membuka side panel/modal berisi timeline versi (v1, v2, v3...) dengan timestamp dan nama editor
- Setiap versi dapat di-preview (thumbnail) dan di-restore
- Highlight diff sederhana: node/connector yang berubah ditandai warna berbeda saat mode "Compare Version" aktif

#### D.10 Revision Panel (AI Edit)
- Panel docked di kanan (tab "AI Revision") berisi:
  - Input prompt box ("Contoh: Ubah proses approval menjadi 2 tahap")
  - Riwayat percakapan revisi sebelumnya (chat-like list)
  - Tombol "Apply Revision" — preview perubahan sebelum konfirmasi (side-by-side before/after) agar auditor tidak kehilangan kontrol atas hasil AI
- Status indikator kecil menunjukkan mode aktif: "Rule-Based" atau "AI (Provider: ...)"

---

### E. Audit Analysis Page

**Tujuan:** Menyajikan hasil analisis audit yang terstruktur dan dapat direview/diedit sebelum submit, dengan tetap merujuk pada standar COSO dan ISA.

**Layout:** Two-column —
- **Kolom kiri (30%):** navigasi anchor menuju tiap section analisis (Executive Summary, Risk, dst.) + mini-preview flowchart yang bisa diklik untuk highlight node terkait
- **Kolom kanan (70%):** konten analisis dalam bentuk **accordion/card per proses/WCGW**, bukan satu tabel panjang, agar auditor bisa fokus per-item risiko

**Komponen per bagian:**

- **Executive Summary:** card ringkasan naratif di paling atas halaman, editable rich text
- **Risk Card:** satu card per WCGW, berisi — nama proses terkait, Risk description, **Risk Level badge**, Root Cause, Impact (semua expandable/collapsible)
- **Control Analysis:** sub-section dalam Risk Card — Existing Control vs Control Gap ditampilkan **side-by-side** (comparison layout) agar gap terlihat jelas
- **Audit Procedure:** ditampilkan sebagai checklist/numbered list di bawah Risk Card, dengan Audit Response terkait
- **Recommendation:** highlighted box (warna aksen berbeda, misal hijau muda) agar menonjol sebagai actionable item
- **COSO/ISA Reference:** tag/chip kecil di footer tiap Risk Card (misal "COSO — Control Activities", "ISA 315") — klik membuka tooltip definisi singkat
- **Confidence Score:** progress ring kecil di pojok kanan atas tiap Risk Card

**User Interaction:**
- Edit inline pada tiap field (klik → jadi editable)
- Tombol "AI Regenerate" per-card (regenerasi satu risk saja, bukan seluruh halaman — penting agar auditor tidak kehilangan hasil review yang sudah dikerjakan)
- Filter di kolom kiri: tampilkan hanya Risk Level tertentu
- Tombol global di footer: Save Draft, Version History, **Submit for Review**

---

### F. Supervisor Review Page

**Tujuan:** Memberi supervisor ruang kerja untuk mereview, memberi komentar, dan memutuskan status project.

**Layout:** Mirip Audit Analysis Page (read-only) namun dengan **panel komentar docked di kanan** menggantikan panel AI Revision.

**Komponen:**
- Header status: badge "Pending Review", info auditor pengaju, tanggal submit
- Viewer flowchart (read-only, tetap bisa zoom/pan) dan viewer audit analysis (read-only per card)
- **Comment Panel:** thread komentar per-section/per-node (anchor comment, mirip Figma/Google Docs), dengan mention auditor
- Tombol besar di footer: **Approve**, **Request Revision**, **Reject** — masing-masing memunculkan modal konfirmasi + field catatan wajib untuk Reject/Revision
- Log riwayat status sebelumnya (jika ini bukan submission pertama)

**User Interaction:** Klik node/card flowchart atau analysis → tambah comment ter-anchor pada elemen tersebut → auditor menerima notifikasi dengan link langsung ke elemen yang dikomentari.

---

## 3. Component Specification

**Project Card**
Function: Menampilkan ringkasan satu project audit di Dashboard.
Content: Nama project, Company/Client, Industry tag, Audit Cycle, Status badge, Progress bar (%), tanggal terakhir diubah, avatar auditor.
Interaction: Click → Open Project; Hover → tampilkan quick-action icon (Duplicate, Archive); Right-click → context menu.

**Status Badge**
Function: Menunjukkan status project atau review secara visual cepat.
Content: Label (Draft/In Progress/Review/Approved/Completed) + warna sesuai status.
Interaction: Non-interactive (indicator only), tooltip menjelaskan arti status saat hover.

**Risk Level Badge**
Function: Menunjukkan tingkat risiko WCGW.
Content: Label (High/Medium/Low) + warna (Merah/Oranye/Kuning).
Interaction: Hover → tooltip definisi kriteria level tersebut.

**Stepper (Wizard Navigation)**
Function: Navigasi antar step dalam Create Project Wizard.
Content: 7 step dengan nomor, label, dan status (completed/active/locked).
Interaction: Klik step yang sudah completed → langsung pindah ke step tersebut; step yang belum tercapai bersifat disabled.

**Shape Palette Item**
Function: Menyediakan shape ANSI/ISO untuk digambar ke canvas.
Content: Ikon shape + label nama fungsi.
Interaction: Drag ke canvas, atau klik untuk insert pada posisi default.

**Node (Flowchart Element)**
Function: Merepresentasikan satu aktivitas/keputusan/entitas dalam proses bisnis.
Content: Teks label, tipe shape, ikon WCGW (jika ada), warna sesuai tipe.
Interaction: Klik → select & buka Properties Panel; Double-klik → edit teks inline; Drag → reposisi dengan snap-to-grid; Right-click → context menu.

**Connector**
Function: Menghubungkan alur antar node.
Content: Garis orthogonal + arah panah, label opsional.
Interaction: Klik → select (tampilkan handle reconnect); Right-click → Delete/Add Label.

**WCGW Indicator**
Function: Menandai node yang memiliki risiko teridentifikasi.
Content: Ikon merah kecil di sudut node.
Interaction: Hover → tooltip ringkas; Klik → buka detail panel (Risk, Control, Recommendation, Confidence Score).

**Risk Card**
Function: Menyajikan satu unit analisis audit (satu risiko/WCGW) secara terstruktur.
Content: Nama proses, Risk, Risk Level badge, Root Cause, Impact, Existing Control vs Control Gap, Audit Procedure, Recommendation, COSO/ISA tag, Confidence Score.
Interaction: Expand/collapse; edit inline per field; tombol "AI Regenerate" per-card.

**Version History Timeline**
Function: Menampilkan riwayat perubahan flowchart/analysis.
Content: List versi dengan timestamp, nama editor, thumbnail preview.
Interaction: Klik versi → preview; tombol "Restore" per item; toggle "Compare" untuk melihat diff dua versi.

**Comment Thread (Anchor Comment)**
Function: Memungkinkan supervisor memberi feedback pada elemen spesifik.
Content: Avatar, nama, waktu, isi komentar, status (resolved/open).
Interaction: Klik anchor pada canvas/card → buka thread; Reply; Mark as Resolved.

**Notification Item**
Function: Menginformasikan aktivitas penting terkait project.
Content: Ikon tipe notifikasi, deskripsi singkat, timestamp, status read/unread.
Interaction: Klik → redirect ke halaman/elemen terkait; tombol "Mark all as read".

**API Key Manager Row**
Function: Mengelola koneksi provider AI.
Content: Nama provider (OpenAI/Gemini/Claude/OpenRouter), status koneksi (Connected/Not Set), masked API key.
Interaction: Klik "Edit" → modal input key; toggle Active provider; tombol "Test Connection".

**Chat Assistant Panel**
Function: Menyediakan tanya-jawab kontekstual mengenai project aktif.
Content: History chat, input box, referensi Knowledge Base yang dikutip (chip link).
Interaction: Kirim pertanyaan → jawaban muncul dengan referensi terkait yang bisa diklik untuk detail.

---

## 4. Wireframe (ASCII)

### 4.1 Dashboard

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] AuditFlow          [Search..............]      [🔔] [Mode] [👤] │
├────────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│  │ Total: 24  │ │ Draft: 5   │ │ Review: 7  │ │ Done: 12   │            │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘            │
│                                                                          │
│  [Filter: Industry ▾] [Auditor ▾] [Status ▾]      [Grid|List] [+ New]   │
│                                                                          │
│  Lanjutkan Terakhir: ▸ PT Sejahtera Abadi — Step 4/7                    │
│                                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                │
│  │ PT Maju Jaya   │  │ Bank Nusantara │  │ CV Karya Mandiri│              │
│  │ Manufaktur     │  │ Perbankan      │  │ Retail          │              │
│  │ [In Progress]  │  │ [Review]       │  │ [Completed]     │              │
│  │ ▓▓▓▓▓▓░░ 70%   │  │ ▓▓▓▓▓▓▓▓ 90%   │  │ ▓▓▓▓▓▓▓▓ 100%  │              │
│  └───────────────┘  └───────────────┘  └───────────────┘                │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Project Page (Wizard — contoh Step 2)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Dashboard / PT Maju Jaya / Understanding Business                      │
├───────────────┬──────────────────────────────────────────────────────┤
│ ① Project Info │  [Text Input] [Upload Document]                       │
│ ② Understanding│  ┌──────────────────────────────────────────────┐    │
│    Business    │  │                                                │    │
│ ③ Flowchart    │  │   (drag & drop PDF/DOCX di sini)               │    │
│ ④ Editor       │  │                                                │    │
│ ⑤ Analysis     │  └──────────────────────────────────────────────┘    │
│ ⑥ Review       │  Preview Dokumen:                                    │
│ ⑦ Export       │  ┌──────────────────────────────────────────────┐    │
│                │  │ ...ekstraksi teks proses bisnis...            │    │
│                │  └──────────────────────────────────────────────┘    │
├───────────────┴──────────────────────────────────────────────────────┤
│                                     [Save Draft]  [Back]   [Next →]     │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Flowchart Editor

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Undo][Redo] [+Node▾][+Conn] [Zoom -/+] [Orientation] [AI Revise] [🔒]  │
├──────┬─────────────────────────────────────────────────────┬──────────┤
│Shape │  Lane: Sales        Lane: Finance      Lane: System   │ Node     │
│ ▢    │  ┌────┐             ┌────┐                            │ Props    │
│ ◇    │  │Start│──▶│Process│──▶│Process│──▶◇Decision          │ ────────│
│ ▤    │  └────┘             └────┘             │  Yes│No      │ Text:    │
│ ⛁    │                                   ⚠──▶│Doc │ │End     │ [_____]  │
│ ▥    │                                                        │ Shape:   │
│      │                                                        │ Process  │
│      │  [ Mini Map ▢ ]                        [Zoom: 100%]    │ WCGW:👆  │
├──────┴─────────────────────────────────────────────────────┴──────────┤
│                                 [Back] [Save Draft] [Lock & Next →]     │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Audit Analysis Page

```
┌────────────────────────────────────────────────────────────────────────┐
│ Dashboard / PT Maju Jaya / Audit Analysis                               │
├───────────────┬──────────────────────────────────────────────────────┤
│ ▸ Exec Summary │  Executive Summary                                    │
│ ▸ Risk #1 (Hi) │  [....................................editable.....] │
│ ▸ Risk #2 (Med)│  ────────────────────────────────────────────────────│
│ ▸ Risk #3 (Low)│  ⚠ Risk Card #1                    [High] Conf: 82%  │
│                │  Proses: Approval Pembelian                          │
│ Mini Flowchart │  Root Cause: ................  Impact: ..............│
│ [thumbnail]    │  ┌─────────────────┐  ┌─────────────────┐            │
│                │  │ Existing Control │  │ Control Gap      │            │
│                │  └─────────────────┘  └─────────────────┘            │
│                │  Recommendation: [ highlighted box ]                  │
│                │  Tags: [COSO - Control Activities] [ISA 315]          │
│                │                              [AI Regenerate]          │
├───────────────┴──────────────────────────────────────────────────────┤
│                            [Save Draft] [Version History] [Submit →]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Design Recommendation

**Visual Style**
- Gaya **enterprise minimalist**: banyak whitespace, hindari dekorasi berlebih, fokus pada keterbacaan data teknis
- Palet warna netral (abu/putih/biru navy) sebagai basis, dengan warna semantik (merah/oranye/kuning/hijau) khusus untuk indikator risiko dan status — jangan pakai warna semantik untuk elemen dekoratif lain agar maknanya tetap konsisten
- Tipografi: **Inter** (sesuai spec) untuk seluruh UI — sans-serif modern, netral, sangat legible pada ukuran kecil (badge, tag)
- Ikonografi konsisten (outline style, stroke 1.5–2px) agar selaras dengan gaya connector flowchart

**Layout Style**
- **Card-based layout** di hampir semua halaman non-canvas (Dashboard, Audit Analysis) — memecah informasi padat menjadi unit yang mudah dicerna auditor
- **Docked/collapsible panel** di kanan (bukan modal penuh) untuk Node Properties, AI Revision, dan Comment — menjaga konteks visual flowchart tetap terlihat saat berinteraksi
- Sidebar step-indicator selalu terlihat selama proses wizard agar auditor tidak "tersesat" dalam alur multi-step

**Dashboard Style**
- Kombinasi **KPI summary + grid project card**, mirip pola dashboard project-management modern (Linear/Asana) namun dengan bahasa visual audit (status Draft/Review/Approved, bukan To-Do/Done)
- Prioritaskan progress project di atas estetika — auditor perlu tahu "berapa banyak lagi yang harus dikerjakan", bukan sekadar daftar nama

**UX Improvement (di luar spec asli, sebagai rekomendasi tambahan)**
1. **Preview before AI Apply** — setiap revisi AI (flowchart maupun audit analysis) menampilkan before/after sebelum diterapkan, menjaga trust auditor terhadap output AI.
2. **Highlight High Risk Only** toggle pada canvas — mempercepat review reviewer/supervisor pada flowchart kompleks.
3. **Anchor Comment** (komentar menempel ke elemen spesifik, bukan komentar umum) — mempercepat proses revisi karena auditor langsung tahu elemen mana yang dimaksud.
4. **Regenerate per-card**, bukan regenerate seluruh halaman analysis — mencegah auditor kehilangan hasil edit manual yang sudah dilakukan.
5. **Collapsible Swimlane** — memudahkan navigasi flowchart proses bisnis kompleks dengan banyak departemen.
6. **Inline auto-save indicator** di setiap step wizard — memberi rasa aman bahwa data tidak akan hilang.

**Hal yang membuat AuditFlow berbeda dari software biasa**
- AuditFlow tidak memperlakukan AI sebagai "generator sekali jadi", melainkan sebagai **asisten yang bisa direvisi secara terkontrol** (preview-before-apply, regenerate per-unit) — mencerminkan value proposition "auditor hanya review, bukan buat dari nol, tapi tetap pegang kendali penuh".
- Integrasi eksplisit referensi **COSO & ISA** langsung pada level Risk Card, bukan sebagai lampiran terpisah — memperkuat kredibilitas hasil analisis sebagai dokumen audit, bukan sekadar output AI generik.
- **Flowchart bukan visual statis**, tapi living-document yang terhubung langsung dengan audit trail, versioning, dan approval workflow — cocok untuk kebutuhan dokumentasi enterprise/KAP yang membutuhkan jejak audit yang jelas.

---

## 6. Frontend Structure Recommendation

Rekomendasi ini berupa **struktur komponen**, bukan kode, agar developer dapat langsung memetakan ke implementasi framework pilihan (React/Vue/dsb).

```
src/
├── layouts/
│   ├── AuthLayout            (untuk Login/Register/Forgot Password)
│   ├── MainLayout            (TopNav + content, untuk Dashboard/Settings)
│   └── ProjectLayout         (TopNav + Sidebar Stepper + content, untuk Wizard)
│
├── pages/
│   ├── auth/                 (Login, Register, ForgotPassword)
│   ├── dashboard/             (Dashboard)
│   ├── project/
│   │   ├── ProjectInformation
│   │   ├── UnderstandingBusiness
│   │   ├── FlowchartGeneration
│   │   ├── FlowchartEditor
│   │   ├── AuditAnalysis
│   │   ├── ReviewApproval
│   │   └── ExportReporting
│   ├── supervisor/            (SupervisorReviewPage)
│   ├── knowledge-base/
│   └── settings/

├── components/
│   ├── common/                (Button, Badge, Modal, Tooltip, Toast, Avatar)
│   ├── dashboard/              (ProjectCard, KpiCard, FilterBar)
│   ├── wizard/                 (StepperSidebar, WizardFooterActions)
│   ├── flowchart-editor/
│   │   ├── Canvas
│   │   ├── Toolbar
│   │   ├── ShapePalette
│   │   ├── Node
│   │   ├── Connector
│   │   ├── SwimlaneLane
│   │   ├── WCGWIndicator
│   │   ├── NodePropertiesPanel
│   │   ├── AIRevisionPanel
│   │   ├── VersionHistoryPanel
│   │   └── MiniMap
│   ├── audit-analysis/
│   │   ├── ExecutiveSummaryCard
│   │   ├── RiskCard
│   │   ├── ControlComparison
│   │   ├── RecommendationBox
│   │   └── ReferenceTag
│   ├── review/
│   │   ├── CommentThread
│   │   └── ApprovalActions
│   └── chat-assistant/
│       └── ChatPanel
│
├── state/ (rekomendasi domain, bukan implementasi)
│   ├── authStore
│   ├── projectStore            (metadata, status, progress)
│   ├── flowchartStore           (nodes, connectors, swimlane, versi)
│   ├── analysisStore            (risk cards, status edit)
│   └── notificationStore
│
└── design-tokens/
    ├── colors.ts                (Start/End/Process/Decision/Document/Database/WCGW/Selected/Locked)
    ├── typography.ts            (Inter, size scale, weight scale)
    └── spacing.ts               (grid spacing, node dimension 180–220px, radius 8px)
```

**Catatan implementasi untuk developer:**
- Pisahkan **Canvas rendering logic** (flowchart-editor) dari **state management** project agar Auto Layout Algorithm dan Manual Editing Constraint dapat diuji secara independen.
- Komponen **RiskCard** dan **CommentThread** sebaiknya reusable antara Audit Analysis Page dan Supervisor Review Page (mode editable vs read-only via prop).
- Design tokens warna (Section 7 pada dokumen asli: Start Hijau, End Abu-abu, Process Biru, Decision Orange, Document Hijau Muda, Database Ungu, Connector Abu Gelap, WCGW Merah, Selected Node Biru Tua, Locked Flowchart Abu Transparan) harus didefinisikan sebagai **satu sumber kebenaran (design tokens)**, dipakai konsisten di Canvas, Legend, dan Risk Level Badge.

---

*Dokumen ini adalah spesifikasi desain UI/UX. Tidak mencakup implementasi backend, database, maupun API.*
