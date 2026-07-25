/**
 * AuditFlow Knowledge Base
 * 
 * Central repository for WCGW detection rules, risk definitions,
 * control libraries, and assertion definitions.
 * 
 * Design Principles:
 * - Data-driven: All rules stored as data, not hardcoded logic
 * - Scalable: Supports hundreds/thousands of rules
 * - Maintainable: Easy to add/modify rules without code changes
 * - Standardized: Consistent key naming (capitalized assertion keys)
 */

const KnowledgeBase = {
    // ==========================================
    // ASSERTION LIBRARY
    // Key format: lowercase-dash (standardized format)
    // ==========================================
    assertionLibrary: {
        'occurrence': {
            id: 'occurrence',
            name: 'Occurrence',
            description: 'Transaksi atau kejadian yang dicatat benar-benar terjadi dan berkaitan dengan entitas',
            auditFocus: 'Memastikan keberadaan dan keaslian transaksi',
            wcgwExamples: [
                'Penjualan fiktif dicatat untuk meningkatkan pendapatan',
                'Pembelian palsu untuk mengalihkan dana',
                'Karyawan phantom (fiktif) untuk penggelembungan biaya'
            ]
        },
        'authorization': {
            id: 'authorization',
            name: 'Authorization',
            description: 'Transaksi telah disetujui oleh pihak yang berwenang sesuai kebijakan perusahaan',
            auditFocus: 'Memastikan persetujuan yang tepat sebelum transaksi diproses',
            wcgwExamples: [
                'Pembelian di atas batas tanpa persetujuan manajemen',
                'Akses sistem diberikan tanpa approval IT',
                'Pengeluaran kas tanpa otorisasi yang sesuai'
            ]
        },
        'accuracy': {
            id: 'accuracy',
            name: 'Accuracy',
            description: 'Jumlah dan detail transaksi dicatat dengan benar dan akurat',
            auditFocus: 'Memastikan ketepatan penghitungan dan pencatatan',
            wcgwExamples: [
                'Salah hitung dalam penjumlahan faktur',
                'Kesalahan konversi mata uang asing',
                'Alokasi biaya ke akun yang salah'
            ]
        },
        'completeness': {
            id: 'completeness',
            name: 'Completeness',
            description: 'Semua transaksi dan kejadian yang harus dicatat telah dimasukkan ke dalam catatan akuntansi',
            auditFocus: 'Memastikan tidak ada transaksi yang terlewat',
            wcgwExamples: [
                'Penjualan tunai tidak dicatat untuk penggelapan',
                'Kewajiban disembunyikan di luar neraca',
                'Biaya periode berjalan ditangguhkan ke periode berikutnya'
            ]
        },
        'classification': {
            id: 'classification',
            name: 'Classification',
            description: 'Transaksi dicatat dalam akun yang tepat sesuai dengan klasifikasi yang benar',
            auditFocus: 'Memastikan pengklasifikasian yang tepat',
            wcgwExamples: [
                'Biaya modal diklasifikasikan sebagai biaya operasional',
                'Pendapatan non-operasional dicatat sebagai pendapatan operasional',
                'Aset lancar diklasifikasikan sebagai aset tetap'
            ]
        },
        'cutoff': {
            id: 'cutoff',
            name: 'Cutoff',
            description: 'Transaksi dicatat dalam periode akuntansi yang benar',
            auditFocus: 'Memastikan pemotongan periode yang tepat',
            wcgwExamples: [
                'Penjualan periode berikutnya dicatat di periode berjalan',
                'Pembelian tahun depan diakui tahun ini',
                'Biaya yang masih harus dibayar tidak diakui'
            ]
        },
        'existence': {
            id: 'existence',
            name: 'Existence',
            description: 'Aset, liabilitas, dan ekuitas yang dicatat benar-benar ada',
            auditFocus: 'Memastikan keberadaan aset dan kewajiban',
            wcgwExamples: [
                'Persediaan fiktif dicatat untuk mempercantik neraca',
                'Piutang yang sudah hapus buku tetap dicatat',
                'Kas di bank yang tidak benar-benar ada'
            ]
        },
        'rights-and-obligations': {
            id: 'rights-obligations',
            name: 'Rights and Obligations',
            description: 'Entitas memiliki hak atas aset dan kewajiban atas liabilitas yang dicatat',
            auditFocus: 'Memastikan kepemilikan dan kewajiban hukum',
            wcgwExamples: [
                'Aset sewaan dicatat sebagai aset milik sendiri',
                'Persediaan konsinyasi diakui sebagai milik perusahaan',
                'Kewajiban kontinjensi tidak diungkapkan'
            ]
        },
        'valuation': {
            id: 'valuation',
            name: 'Valuation',
            description: 'Aset, liabilitas, dan transaksi dicatat pada jumlah yang tepat sesuai prinsip akuntansi',
            auditFocus: 'Memastikan penilaian yang wajar',
            wcgwExamples: [
                'Persediaan usang tidak disesuaikan dengan nilai realisasi',
                'Goodwill tidak diuji penurunan nilainya',
                'Investasi dicatat di atas nilai wajar'
            ]
        }
    },

    // ==========================================
    // WCGW LIBRARY
    // Definisi What Can Go Wrong untuk setiap skenario
    // ==========================================
    wcgwLibrary: {
        'fictitious-sales': {
            id: 'fictitious-sales',
            name: 'Penjualan Fiktif',
            description: 'Penjualan dicatat tanpa adanya pengiriman barang atau jasa yang sebenarnya',
            assertion: 'occurrence',
            riskLevel: 'high',
            indicators: [
                'Faktur tanpa dokumen pengiriman',
                'Penjualan ke pelanggan yang tidak dapat dikonfirmasi',
                'Pola penjualan meningkat di akhir periode'
            ],
            impact: 'Overstatement pendapatan dan aset, misleading financial statements'
        },
        'unauthorized-purchase': {
            id: 'unauthorized-purchase',
            name: 'Pembelian Tanpa Otorisasi',
            description: 'Pembelian dilakukan tanpa persetujuan dari pihak yang berwenang sesuai batas kewenangan',
            assertion: 'authorization',
            riskLevel: 'high',
            indicators: [
                'Purchase order tanpa tanda tangan approval',
                'Pembelian di atas batas tanpa persetujuan level lebih tinggi',
                'Vendor baru tanpa proses approval'
            ],
            impact: 'Potensi fraud, pembelian tidak efisien, konflik kepentingan'
        },
        'misappropriation-assets': {
            id: 'misappropriation-assets',
            name: 'Penggelapan Aset',
            description: 'Aset perusahaan diambil atau digunakan untuk kepentingan pribadi tanpa otorisasi',
            assertion: 'occurrence',
            riskLevel: 'high',
            indicators: [
                'Selisih kas yang tidak dapat dijelaskan',
                'Persediaan hilang tanpa dokumen yang jelas',
                'Aset tetap tidak dapat dilacak keberadaannya'
            ],
            impact: 'Kerugian finansial langsung, potensi indikasi fraud sistematis'
        },
        'unrecorded-liabilities': {
            id: 'unrecorded-liabilities',
            name: 'Kewajiban Tidak Dicatat',
            description: 'Kewajiban yang ada tidak dicatat dalam laporan keuangan',
            assertion: 'completeness',
            riskLevel: 'medium',
            indicators: [
                'Faktur vendor diterima setelah tanggal cutoff',
                'Jasa telah diterima tetapi belum ada pencatatan',
                'Transaksi dengan pihak berelasi tidak diungkapkan'
            ],
            impact: 'Understatement liabilitas, overstatement ekuitas'
        },
        'incorrect-cutoff': {
            id: 'incorrect-cutoff',
            name: 'Cutoff Tidak Tepat',
            description: 'Transaksi dicatat dalam periode yang salah',
            assertion: 'cutoff',
            riskLevel: 'medium',
            indicators: [
                'Dokumen pengiriman tanggal periode depan dicatat periode berjalan',
                'Faktur tanggal akhir periode dikirim awal periode berikutnya',
                'Jurnal penyesuaian besar di akhir periode'
            ],
            impact: 'Distorsi kinerja periode, potensi earnings management'
        },
        'wrong-classification': {
            id: 'wrong-classification',
            name: 'Salah Klasifikasi',
            description: 'Transaksi dicatat dalam akun yang tidak tepat',
            assertion: 'classification',
            riskLevel: 'low',
            indicators: [
                'Biaya repair dikapitalisasi sebagai aset',
                'Pendapatan lain-lain dicatat sebagai pendapatan usaha',
                'Biaya pemasaran diklasifikasikan sebagai HPP'
            ],
            impact: 'Misleading analysis rasio keuangan, salah interpretasi kinerja'
        },
        'duplicate-payment': {
            id: 'duplicate-payment',
            name: 'Pembayaran Ganda',
            description: 'Pembayaran dilakukan lebih dari sekali untuk transaksi yang sama',
            assertion: 'accuracy',
            riskLevel: 'medium',
            indicators: [
                'Faktur dengan nomor dan jumlah yang sama dibayar dua kali',
                'Pembayaran ke vendor yang sama dalam periode singkat',
                'Selisih antara catatan vendor dan perusahaan'
            ],
            impact: 'Kerugian finansial, potensi fraud, cash flow terganggu'
        },
        'ghost-employee': {
            id: 'ghost-employee',
            name: 'Karyawan Fiktif',
            description: 'Gaji dibayarkan kepada karyawan yang tidak benar-benar bekerja di perusahaan',
            assertion: 'occurrence',
            riskLevel: 'high',
            indicators: [
                'Karyawan tanpa nomor induk yang valid',
                'Rekening bank gaji yang sama untuk beberapa karyawan',
                'Karyawan tanpa catatan absensi atau kinerja'
            ],
            impact: 'Penggelembungan biaya gaji, potensi fraud payroll'
        },
        'inventory-overstatement': {
            id: 'inventory-overstatement',
            name: 'Overstatement Persediaan',
            description: 'Nilai persediaan dicatat lebih tinggi dari yang sebenarnya',
            assertion: 'existence',
            riskLevel: 'medium',
            indicators: [
                'Selisih stock opname yang signifikan',
                'Persediaan usang tidak di-provision',
                'Pergerakan persediaan tidak sesuai dengan pola penjualan'
            ],
            impact: 'Overstatement aset lancar, understatement HPP'
        },
        'revenue-recognition-timing': {
            id: 'revenue-recognition-timing',
            name: 'Pengakuan Pendapatan Tidak Tepat Waktu',
            description: 'Pendapatan diakui sebelum atau sesudah periode yang tepat',
            assertion: 'cutoff',
            riskLevel: 'high',
            indicators: [
                'Pendapatan diakui sebelum penyerahan barang/jasa',
                'Sales di akhir periode meningkat tidak wajar',
                'Return penjualan tinggi di periode berikutnya'
            ],
            impact: 'Distorsi kinerja periode, potensi earnings management'
        }
    },

    // ==========================================
    // RISK LIBRARY
    // Level risiko dan dampaknya
    // ==========================================
    riskLibrary: {
        'high': {
            level: 'high',
            label: 'Tinggi',
            color: '#dc2626',
            colorLight: '#fef2f2',
            description: 'Risiko yang dapat menyebabkan salah saji material atau fraud signifikan',
            requiredAction: 'Wajib dilakukan testing substantif dan evaluasi kontrol',
            threshold: 0.7
        },
        'medium': {
            level: 'medium',
            label: 'Sedang',
            color: '#ea580c',
            colorLight: '#fff7ed',
            description: 'Risiko yang memerlukan perhatian dan testing terbatas',
            requiredAction: 'Lakukan testing dan evaluasi efektivitas kontrol',
            threshold: 0.4
        },
        'low': {
            level: 'low',
            label: 'Rendah',
            color: '#65a30d',
            colorLight: '#f7fee7',
            description: 'Risiko dengan dampak terbatas yang dapat dikelola dengan kontrol rutin',
            requiredAction: 'Monitor melalui prosedur rutin',
            threshold: 0
        }
    },

    // ==========================================
    // CONTROL LIBRARY
    // Kontrol yang dapat mitigate WCGW
    // ==========================================
    controlLibrary: {
        'segregation-duties': {
            id: 'segregation-duties',
            name: 'Pemisahan Tugas',
            description: 'Pemisahan fungsi otorisasi, pencatatan, dan penyimpanan aset',
            type: 'preventive',
            mitigatesAssertions: ['Occurrence', 'Authorization', 'Completeness'],
            effectiveness: 0.8
        },
        'authorization-controls': {
            id: 'authorization-controls',
            name: 'Kontrol Otorisasi',
            description: 'Persyaratan persetujuan berjenjang berdasarkan nilai transaksi',
            type: 'preventive',
            mitigatesAssertions: ['Authorization', 'Occurrence'],
            effectiveness: 0.75
        },
        'reconciliation': {
            id: 'reconciliation',
            name: 'Rekonsiliasi',
            description: 'Pencocokan berkala antara catatan internal dan eksternal',
            type: 'detective',
            mitigatesAssertions: ['Accuracy', 'Completeness', 'Existence'],
            effectiveness: 0.7
        },
        'physical-controls': {
            id: 'physical-controls',
            name: 'Kontrol Fisik',
            description: 'Pengamanan fisik atas aset (gudang, brankas, akses terbatas)',
            type: 'preventive',
            mitigatesAssertions: ['Existence', 'Occurrence'],
            effectiveness: 0.85
        },
        'it-general-controls': {
            id: 'it-general-controls',
            name: 'IT General Controls',
            description: 'Kontrol akses, perubahan, dan operasi sistem informasi',
            type: 'preventive',
            mitigatesAssertions: ['Authorization', 'Accuracy', 'Completeness'],
            effectiveness: 0.75
        },
        'supervisory-review': {
            id: 'supervisory-review',
            name: 'Review Supervisi',
            description: 'Pemeriksaan dan persetujuan oleh atasan atas transaksi dan laporan',
            type: 'detective',
            mitigatesAssertions: ['Accuracy', 'Classification', 'Cutoff'],
            effectiveness: 0.65
        },
        'documentation-requirements': {
            id: 'documentation-requirements',
            name: 'Persyaratan Dokumentasi',
            description: 'Kewajiban dokumen pendukung lengkap untuk setiap transaksi',
            type: 'preventive',
            mitigatesAssertions: ['Occurrence', 'Authorization', 'Accuracy'],
            effectiveness: 0.7
        },
        'independent-verification': {
            id: 'independent-verification',
            name: 'Verifikasi Independen',
            description: 'Pemeriksaan oleh pihak independen atas transaksi dan saldo',
            type: 'detective',
            mitigatesAssertions: ['Existence', 'Accuracy', 'Valuation'],
            effectiveness: 0.8
        }
    },

    // ==========================================
    // DETECTION RULES
    // Aturan WCGW detection berdasarkan proses bisnis
    // 
    // Structure:
    // - id: Unique identifier
    // - name: Nama rule
    // - description: Penjelasan rule
    // - assertion: Assertion yang terdampak (capitalized)
    // - triggerProcesses: Proses yang JIKA ADA memicu risiko
    // - requiredProcesses: Proses yang JIKA TIDAK ADA meningkatkan risiko
    // - riskLevel: Level risiko (high/medium/low)
    // - wcgwIds: Array WCGW yang mungkin terjadi
    // - recommendedControls: Kontrol yang disarankan
    // ==========================================
    rules: [
        {
            id: 'sales-no-shipping',
            name: 'Penjualan Tanpa Dokumen Pengiriman',
            description: 'Proses pencatatan penjualan ada tetapi tidak ada proses pengiriman barang',
            assertion: 'occurrence',
            triggerProcesses: ['record-sale', 'create-invoice', 'recognize-revenue'],
            requiredProcesses: ['ship-goods', 'create-delivery-order'],
            riskLevel: 'high',
            wcgwIds: ['fictitious-sales'],
            recommendedControls: ['documentation-requirements', 'reconciliation'],
            keywords: ['jual', 'faktur', 'invoice', 'pendapatan', 'revenue']
        },
        {
            id: 'purchase-no-approval',
            name: 'Pembelian Tanpa Persetujuan',
            description: 'Proses pembelian/pengadaan dilakukan tanpa proses persetujuan',
            assertion: 'authorization',
            triggerProcesses: ['create-purchase-order', 'procure', 'buy'],
            requiredProcesses: ['approve-purchase', 'authorize', 'approval'],
            riskLevel: 'high',
            wcgwIds: ['unauthorized-purchase'],
            recommendedControls: ['authorization-controls', 'segregation-duties'],
            keywords: ['beli', 'purchase', 'pengadaan', 'procurement']
        },
        {
            id: 'payment-no-receiving',
            name: 'Pembayaran Tanpa Bukti Penerimaan',
            description: 'Pembayaran dilakukan tanpa adanya proses penerimaan barang/jasa',
            assertion: 'occurrence',
            triggerProcesses: ['make-payment', 'pay-vendor', 'disburse'],
            requiredProcesses: ['receive-goods', 'receive-service', 'goods-receipt'],
            riskLevel: 'high',
            wcgwIds: ['misappropriation-assets', 'duplicate-payment'],
            recommendedControls: ['documentation-requirements', 'segregation-duties'],
            keywords: ['bayar', 'payment', 'disbursement', 'kas keluar']
        },
        {
            id: 'revenue-timing',
            name: 'Pengakuan Pendapatan Tidak Sesuai Periode',
            description: 'Pendapatan diakui sebelum atau tanpa penyerahan barang/jasa',
            assertion: 'cutoff',
            triggerProcesses: ['recognize-revenue', 'record-revenue', 'book-sale'],
            requiredProcesses: ['deliver', 'ship', 'complete-service'],
            riskLevel: 'high',
            wcgwIds: ['revenue-recognition-timing', 'incorrect-cutoff'],
            recommendedControls: ['supervisory-review', 'documentation-requirements'],
            keywords: ['pendapatan', 'revenue', 'penjualan', 'pengakuan']
        },
        {
            id: 'inventory-no-count',
            name: 'Persediaan Tanpa Stock Opname',
            description: 'Tidak ada proses penghitungan fisik persediaan',
            assertion: 'existence',
            triggerProcesses: ['manage-inventory', 'store-inventory', 'warehouse'],
            requiredProcesses: ['stock-take', 'physical-count', 'stock-opname'],
            riskLevel: 'medium',
            wcgwIds: ['inventory-overstatement'],
            recommendedControls: ['physical-controls', 'independent-verification'],
            keywords: ['persediaan', 'inventory', 'gudang', 'stock']
        },
        {
            id: 'payroll-no-hr',
            name: 'Pembayaran Gaji Tanpa Data HR',
            description: 'Gaji dibayarkan tanpa adanya data karyawan yang valid dari HR',
            assertion: 'occurrence',
            triggerProcesses: ['process-payroll', 'pay-salary', 'gaji'],
            requiredProcesses: ['hr-record', 'employee-data', 'karyawan-valid'],
            riskLevel: 'high',
            wcgwIds: ['ghost-employee'],
            recommendedControls: ['segregation-duties', 'it-general-controls'],
            keywords: ['gaji', 'payroll', ' kompensasi', 'upah']
        },
        {
            id: 'journal-no-support',
            name: 'Jurnal Tanpa Dokumen Pendukung',
            description: 'Jurnal akuntansi dibuat tanpa dokumen pendukung yang memadai',
            assertion: 'accuracy',
            triggerProcesses: ['create-journal', 'post-entry', 'jurnal'],
            requiredProcesses: ['attach-document', 'supporting-doc', 'dokumen'],
            riskLevel: 'medium',
            wcgwIds: ['wrong-classification', 'incorrect-cutoff'],
            recommendedControls: ['documentation-requirements', 'supervisory-review'],
            keywords: ['jurnal', 'entry', 'posting', 'akuntansi']
        },
        {
            id: 'cash-no-reconciliation',
            name: 'Kas Tanpa Rekonsiliasi Bank',
            description: 'Saldo kas tidak direkonsiliasi dengan rekening koran',
            assertion: 'existence',
            triggerProcesses: ['manage-cash', 'cash-handling', 'kas'],
            requiredProcesses: ['bank-reconciliation', 'reconcile', 'rekonsiliasi'],
            riskLevel: 'medium',
            wcgwIds: ['misappropriation-assets'],
            recommendedControls: ['reconciliation', 'segregation-duties'],
            keywords: ['kas', 'cash', 'bank', 'uang']
        },
        {
            id: 'fixed-asset-no-verification',
            name: 'Aset Tetap Tanpa Verifikasi Fisik',
            description: 'Aset tetap dicatat tanpa verifikasi fisik berkala',
            assertion: 'existence',
            triggerProcesses: ['acquire-asset', 'capitalize', 'aset-tetap'],
            requiredProcesses: ['physical-verification', 'asset-count', 'cek-fisik'],
            riskLevel: 'medium',
            wcgwIds: ['misappropriation-assets'],
            recommendedControls: ['physical-controls', 'independent-verification'],
            keywords: ['aset', 'fixed-asset', 'investasi', 'kapital']
        },
        {
            id: 'expense-no-budget',
            name: 'Beban Tanpa Kontrol Anggaran',
            description: 'Beban dikeluarkan tanpa monitoring terhadap anggaran',
            assertion: 'authorization',
            triggerProcesses: ['incur-expense', 'spend', 'beban'],
            requiredProcesses: ['budget-check', 'budget-control', 'anggaran'],
            riskLevel: 'low',
            wcgwIds: ['unauthorized-purchase'],
            recommendedControls: ['authorization-controls', 'supervisory-review'],
            keywords: ['beban', 'expense', 'biaya', 'pengeluaran']
        }
    ],

    // ==========================================
    // PROCESS KEYWORDS
    // Mapping keywords untuk fuzzy matching proses
    // ==========================================
    processKeywords: {
        // Sales & Revenue
        'record-sale': ['catat penjualan', 'input penjualan', 'record sale', 'booking', 'sales entry'],
        'create-invoice': ['buat faktur', 'buat invoice', 'billing', 'tagih', 'create invoice'],
        'recognize-revenue': ['akui pendapatan', 'recognize revenue', 'acknowledge revenue', 'pengakuan'],
        'ship-goods': ['kirim barang', 'ship', 'pengiriman', 'delivery', 'dispatch'],
        'create-delivery-order': ['buat surat jalan', 'delivery order', 'DO', 'bukti kirim'],

        // Purchase & Payment
        'create-purchase-order': ['buat PO', 'purchase order', 'pesan beli', 'order pembelian'],
        'procure': ['beli', 'procure', 'pengadaan', 'procurement', 'pembelian'],
        'approve-purchase': ['setuju beli', 'approve PO', 'otorisasi pembelian', 'persetujuan'],
        'make-payment': ['bayar', 'payment', 'disburse', 'kas keluar', 'pembayaran'],
        'receive-goods': ['terima barang', 'receive', 'goods receipt', 'penerimaan'],
        'receive-service': ['terima jasa', 'service received', 'jasa diterima'],

        // Inventory
        'manage-inventory': ['kelola persediaan', 'manage inventory', 'gudang', 'warehouse'],
        'store-inventory': ['simpan persediaan', 'store', 'penyimpanan'],
        'stock-take': ['stock opname', 'hitung fisik', 'physical count', 'cek stok'],

        // Payroll
        'process-payroll': ['proses gaji', 'payroll', 'hitung gaji', 'slip gaji'],
        'pay-salary': ['bayar gaji', 'pay salary', 'transfer gaji'],
        'hr-record': ['data karyawan', 'HR record', 'data HR', 'karyawan aktif'],

        // General
        'create-journal': ['buat jurnal', 'create entry', 'posting jurnal', 'jurnal umum'],
        'attach-document': ['lampirkan dokumen', 'attach doc', 'dukung jurnal'],
        'bank-reconciliation': ['rekonsiliasi bank', 'rekonsiliasi', 'reconcile', 'cocok bank'],
        'acquire-asset': ['peroleh aset', 'acquire asset', 'beli aset', 'kapitalisasi'],
        'physical-verification': ['cek fisik', 'verifikasi fisik', 'physical check'],
        'incur-expense': ['keluarkan beban', 'incur expense', 'beban', 'cost'],
        'budget-check': ['cek anggaran', 'budget check', 'kontrol anggaran']
    },

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Get assertion details by name
     */
    getAssertion(assertionName) {
        return this.assertionLibrary[assertionName] || null;
    },

    /**
     * Get WCGW details by ID
     */
    getWCGW(wcgwId) {
        return this.wcgwLibrary[wcgwId] || null;
    },

    /**
     * Get risk level details
     */
    getRiskLevel(level) {
        return this.riskLibrary[level] || null;
    },

    /**
     * Get control details by ID
     */
    getControl(controlId) {
        return this.controlLibrary[controlId] || null;
    },

    /**
     * Get all rules for a specific assertion
     */
    getRulesByAssertion(assertion) {
        return this.rules.filter(rule => rule.assertion === assertion);
    },

    /**
     * Get all rules for a specific risk level
     */
    getRulesByRiskLevel(level) {
        return this.rules.filter(rule => rule.riskLevel === level);
    },

    /**
     * Find keywords for a process
     */
    getProcessKeywords(processName) {
        return this.processKeywords[processName] || [];
    },

    /**
     * Get total rule count
     */
    getRuleCount() {
        return this.rules.length;
    },

    /**
     * Get statistics about the knowledge base
     */
    getStatistics() {
        return {
            totalRules: this.rules.length,
            rulesByAssertion: this.assertionLibrary ? Object.keys(this.assertionLibrary).length : 0,
            wcgwDefinitions: Object.keys(this.wcgwLibrary).length,
            controlsDefined: Object.keys(this.controlLibrary).length,
            riskLevels: Object.keys(this.riskLibrary).length,
            processKeywordsMapped: Object.keys(this.processKeywords).length
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KnowledgeBase;
}