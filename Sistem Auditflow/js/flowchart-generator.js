/**
 * AuditFlow - Flowchart Generator (Sprint 4)
 * 
 * Rule-based parser that converts business process text into structured flowchart data.
 * Generates Flowchart objects that conform to docs/DATA_SCHEMAS.md.
 * 
 * Architecture:
 * 1. Text Parsing: Extract actors, activities, decisions, documents, databases
 * 2. Priority Resolution: Handle overlapping keywords with clear precedence
 * 3. Layout Calculation: Auto-position nodes within swimlanes
 * 4. Schema Validation: Validate output against DATA_SCHEMAS.md
 * 5. Flowchart Generation: Create complete Flowchart object
 */

const FlowchartGenerator = (function () {
    // ============================================
    // Configuration & Constants
    // ============================================

    // Parser version - update on each sprint
    const PARSER_VERSION = '4.0-final';

    // Priority order for keyword classification (higher index = higher priority)
    // When a word matches multiple categories, use the highest priority
    const PRIORITY = {
        ACTIVITY: 1,
        DATABASE: 2,
        DOCUMENT: 3,
        DECISION: 4,
        ACTOR: 5
    };

    // Generic department/unit prefixes that should be merged with following words
    const DEPARTMENT_PREFIXES = [
        'departemen', 'divisi', 'bagian', 'unit', 'tim', 'seksi', 'bidang'
    ];

    // Actor normalization mappings - standardize synonyms to canonical names
    const ACTOR_NORMALIZATIONS = {
        // Finance variations
        'finance': 'finance',
        'bagian finance': 'finance',
        'departemen finance': 'finance',
        'keuangan': 'finance',
        'bagian keuangan': 'finance',
        'departemen keuangan': 'finance',
        'akuntansi': 'finance',
        'accounting': 'finance',
        // HR variations
        'hr': 'hrd',
        'hrd': 'hrd',
        'human resource': 'hrd',
        'human resources': 'hrd',
        'bagian hr': 'hrd',
        'departemen hr': 'hrd',
        // Procurement variations
        'procurement': 'procurement',
        'purchasing': 'procurement',
        'pembelian': 'procurement',
        'pengadaan': 'procurement',
        'bagian pembelian': 'procurement',
        // Sales variations
        'sales': 'sales',
        'penjualan': 'sales',
        'marketing': 'sales',
        'bagian penjualan': 'sales',
        // IT variations
        'it': 'it',
        'teknologi': 'it',
        'informasi': 'it',
        'sistem informasi': 'it',
        // Gudang variations
        'gudang': 'gudang',
        'warehouse': 'gudang',
        'logistik': 'gudang',
        // Manajer variations
        'manajer': 'manajer',
        'manager': 'manajer',
        'supervisor': 'supervisor',
        'kepala': 'manajer'
    };

    // Actor/Department keywords - will become swimlanes
    const ACTOR_KEYWORDS = [
        // Role titles and department names
        'manajer', 'manager', 'supervisor', 'kepala', 'direktur', 'director',
        'staff', 'kasir', 'gudang', 'finance', 'hrd', 'procurement',
        'sales', 'marketing', 'produksi', 'production', 'quality', 'audit',
        'akuntansi', 'accounting', 'it', 'teknologi', 'operasional',
        'logistik', 'warehouse', 'purchasing', 'vendor', 'customer',
        'hr', 'humas', 'legal', 'compliance', 'risk',
        // Common actor patterns
        'tim it', 'tim finance', 'tim sales', 'tim gudang',
        'bagian keuangan', 'bagian penjualan', 'bagian pembelian',
        'user', 'pengguna', 'karyawan', 'pegawai', 'operator'
    ];

    // Activity/Process keywords - will become process nodes
    const ACTIVITY_KEYWORDS = [
        // Action verbs
        'mencatat', 'catat', 'membuat', 'buat', 'mengirim', 'kirim',
        'memverifikasi', 'verifikasi', 'menyetujui', 'setuju', 'approve',
        'memproses', 'proses', 'menginput', 'input', 'mereview', 'review',
        'mengecek', 'cek', 'memeriksa', 'periksa', 'menghitung', 'hitung',
        'menganalisis', 'analisis', 'melaporkan', 'lapor', 'mendokumentasikan',
        'dokumentasi', 'mengajukan', 'ajukan', 'meneruskan', 'teruskan',
        'menolak', 'tolak', 'menerima', 'terima', 'menyimpan', 'simpan',
        'mengupdate', 'update', 'mengubah', 'ubah', 'mengonfirmasi', 'konfirmasi',
        'menagih', 'tagih', 'membayar', 'bayar', 'setup', 'mengatur', 'atur',
        'melatih', 'latih', 'mengikuti', // 'training' is a noun, use 'mengikuti' for "follow training"
        'mengevaluasi', 'evaluasi',
        'merekrut', 'rekrut', 'hiring',
        // Activity nouns (when used with action context)
        'transaksi', 'pembayaran', 'penagihan', 'pengiriman', 'penerimaan',
        'persetujuan', 'validasi', 'rekonsiliasi', 'pelaporan'
    ];

    // Decision point keywords - will become decision nodes
    const DECISION_KEYWORDS = [
        // Question/conditional words
        'apakah', 'jika', 'bila', 'ketika', 'saat', 'apabila', 'jikalau',
        // Approval outcomes
        'disetujui', 'setuju', 'ditolak', 'tolak', 'diterima', 'terima',
        'diteruskan', 'dikembalikan', 'kembali',
        // Yes/No indicators
        'ya', 'tidak', 'lulus', 'gagal', 'benar', 'salah',
        // Question patterns
        'sudah', 'belum', 'pernah',
        // Conditional phrases
        'jika tidak', 'jika ya', 'apabila tidak', 'apabila ya',
        'kalau tidak', 'kalau ya'
    ];

    // Document keywords - will become document nodes
    // Ordered by specificity (longer/more specific phrases first)
    // When a longer phrase contains a shorter one, only the longer one should match
    const DOCUMENT_KEYWORDS = [
        // Multi-word phrases (most specific first)
        'purchase order', 'delivery order', 'surat jalan', 'goods received note',
        'berita acara penerimaan', 'purchase request', 'permintaan pembelian',
        'kontrak kerja', 'perjanjian', 'agreement',
        // Single words that are actual documents
        'invoice', 'faktur', 'kwitansi', 'receipt', 'bukti',
        'laporan', 'report', 'dokumen', 'document',
        'surat', 'memo', 'kontrak', 'contract',
        'berita acara', 'nota', 'pesanan',
        'billing', 'tagihan', 'slip', 'voucher',
        'cheque', 'cek', 'bilyet',
        'spesifikasi', 'requirement', 'proposal',
        'ktp', 'npwp', 'sertifikat', 'izin', 'lisensi'
        // Note: Removed 'po', 'do', 'pr', 'form', 'order', 'pengiriman' as they cause false positives
        // 'order' removed because it's part of 'purchase order' - we want the more specific term
        // 'pengiriman' removed because it's an activity, not a document
    ];

    // Database/System keywords - will become database nodes
    const DATABASE_KEYWORDS = [
        'sistem', 'system', 'aplikasi', 'application', 'software',
        'database', 'db', 'erp', 'sap', 'oracle', 'accurate', 'zahir', 'myob',
        'server', 'cloud', 'arsip', 'file', 'folder', 'repository',
        'backup', 'log', 'history', 'rekam', 'record',
        'portal', 'platform', 'website', 'app', 'mobile app',
        'spreadsheet', 'excel', 'google sheets',
        'email', 'whatsapp', 'slack', 'telegram'
    ];

    // Layout configuration
    const LAYOUT_CONFIG = {
        vertical: {
            swimlaneWidth: 280,
            swimlaneSpacing: 40,
            nodeSpacing: 80,
            nodePadding: 40,
            nodeWidth: 180,
            nodeHeight: 50,
            startY: 80
        },
        horizontal: {
            swimlaneHeight: 200,
            swimlaneSpacing: 40,
            nodeSpacing: 100,
            nodePadding: 40,
            nodeWidth: 150,
            nodeHeight: 40,
            startX: 80
        }
    };

    // ============================================
    // Private State
    // ============================================

    let nodeIdCounter = 1;
    let laneIdCounter = 1;

    // ID counters for metadata (separate from layout counters)
    let actorIdCounter = 1;
    let activityIdCounter = 1;
    let decisionIdCounter = 1;
    let documentIdCounter = 1;
    let databaseIdCounter = 1;

    // ============================================
    // Utility Functions
    // ============================================

    /**
     * Generate stable ID with prefix and timestamp for uniqueness
     * Format: prefix_timestamp_randomSuffix
     */
    function generateId(prefix, counter) {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        return `${prefix}_${timestamp}_${randomSuffix}`;
    }

    /**
     * Normalize text for consistent parsing
     */
    function normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[.,;:!?]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Split text into sentences
     */
    function splitSentences(text) {
        return text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    /**
     * Check if a sentence contains any of the given keywords
     */
    function containsKeyword(sentence, keywords) {
        const normalized = normalizeText(sentence);
        return keywords.some(kw => {
            const normalizedKw = normalizeText(kw);
            return normalized.includes(normalizedKw) ||
                normalized.includes(normalizedKw + ' ') ||
                normalized.includes(' ' + normalizedKw);
        });
    }

    /**
     * Find which specific keyword matched
     */
    function findMatchingKeyword(sentence, keywords) {
        const normalized = normalizeText(sentence);
        for (const kw of keywords) {
            const normalizedKw = normalizeText(kw);
            if (normalized.includes(normalizedKw)) {
                return kw;
            }
        }
        return null;
    }

    /**
     * Generate unique ID
     */
    function generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // ============================================
    // Parsing Functions
    // ============================================

    /**
     * Normalize actor name to canonical form
     * Handles synonyms like Finance/Keuangan, HR/HRD, Procurement/Purchasing
     */
    function normalizeActorName(actorName) {
        const normalized = normalizeText(actorName);

        // Check for exact match in normalization mappings
        if (ACTOR_NORMALIZATIONS[normalized]) {
            return ACTOR_NORMALIZATIONS[normalized];
        }

        // Check for partial matches (e.g., "tim finance" -> "finance")
        for (const [key, value] of Object.entries(ACTOR_NORMALIZATIONS)) {
            if (normalized.includes(key)) {
                return value;
            }
        }

        // No normalization found, return as-is
        return actorName;
    }

    /**
     * Classify actor as internal or external
     * Internal: departments, roles within organization
     * External: customer, vendor, supplier, client, etc.
     */
    function classifyActor(actorName) {
        const normalized = normalizeText(actorName);
        const externalKeywords = ['customer', 'vendor', 'supplier', 'client', 'pelanggan',
            'pemasok', 'supplier', ' Mitra', 'partner', 'external'];

        for (const ext of externalKeywords) {
            if (normalized.includes(ext)) {
                return 'external';
            }
        }
        return 'internal';
    }

    /**
     * Generate display name for actor (capitalized, readable format)
     */
    function getActorDisplayName(actorName) {
        return actorName.charAt(0).toUpperCase() + actorName.slice(1);
    }

    /**
     * Extract actors/departments from text
     * Returns array of unique actor names in order of first occurrence
     * Handles department prefixes (departemen, divisi, etc.) by merging with following word
     * Normalizes actor names to avoid duplicates (e.g., "finance" vs "bagian finance")
     */
    function extractActors(text) {
        const sentences = splitSentences(text);
        const actorsOrder = []; // Maintain insertion order
        const actorsSet = new Set(); // For quick lookup

        for (const sentence of sentences) {
            const normalized = normalizeText(sentence);
            const words = normalized.split(/\s+/);

            // First pass: find department prefix + specific name combinations
            const skipIndices = new Set();

            for (let i = 0; i < words.length; i++) {
                if (skipIndices.has(i)) continue;

                // Check if current word is a department prefix
                if (DEPARTMENT_PREFIXES.includes(words[i]) && i < words.length - 1) {
                    // Merge prefix with the following word(s) to form complete actor name
                    let actorName = words[i] + ' ' + words[i + 1];
                    skipIndices.add(i);
                    skipIndices.add(i + 1);

                    // Check if there's a third word that's also part of the actor name
                    if (i < words.length - 2 && ACTOR_KEYWORDS.includes(words[i + 2])) {
                        actorName += ' ' + words[i + 2];
                        skipIndices.add(i + 2);
                    }

                    // Normalize actor name
                    const normalizedActor = normalizeActorName(actorName);

                    // Add if not already present
                    if (!actorsSet.has(normalizedActor)) {
                        actorsSet.add(normalizedActor);
                        actorsOrder.push(normalizedActor);
                    }
                    continue;
                }

                // Check for multi-word actor names from ACTOR_KEYWORDS (2-word combinations)
                if (i < words.length - 1) {
                    const twoWord = words[i] + ' ' + words[i + 1];
                    if (ACTOR_KEYWORDS.some(kw => normalizeText(kw) === twoWord)) {
                        const normalizedActor = normalizeActorName(twoWord);
                        if (!actorsSet.has(normalizedActor)) {
                            actorsSet.add(normalizedActor);
                            actorsOrder.push(normalizedActor);
                        }
                        skipIndices.add(i);
                        skipIndices.add(i + 1);
                        continue;
                    }
                }

                // Check single words (skip if already part of a merged actor)
                if (!skipIndices.has(i) && ACTOR_KEYWORDS.some(kw => normalizeText(kw) === words[i])) {
                    const word = words[i];
                    const normalizedActor = normalizeActorName(word);

                    // Only add if not already present
                    if (!actorsSet.has(normalizedActor)) {
                        actorsSet.add(normalizedActor);
                        actorsOrder.push(normalizedActor);
                    }
                }
            }
        }

        return actorsOrder;
    }

    /**
     * Extract activity phrase in "Verb + Object" format from sentence
     * Returns cleaned activity text starting with the action verb
     */
    function extractActivityPhrase(sentence, matchedKeyword) {
        const normalized = normalizeText(sentence);
        const words = normalized.split(/\s+/);

        // Find the position of the matched keyword (verb)
        const keywordIndex = words.indexOf(normalizeText(matchedKeyword));

        if (keywordIndex >= 0) {
            // Extract from the verb onwards, but stop at decision markers or conjunctions
            let endIndex = words.length;

            // Stop before conditional words that indicate a decision clause
            const decisionMarkers = ['jika', 'bila', 'apabila', 'ketika', 'saat', 'setelah'];
            // Also stop at conjunctions that start a new clause
            const conjunctions = ['dan', 'atau', 'tetapi', 'namun', 'sedangkan'];

            for (let i = keywordIndex + 1; i < words.length; i++) {
                if (decisionMarkers.includes(words[i]) || conjunctions.includes(words[i])) {
                    endIndex = i;
                    break;
                }
            }

            let activityPhrase = words.slice(keywordIndex, endIndex).join(' ');

            // Capitalize first letter
            activityPhrase = activityPhrase.charAt(0).toUpperCase() + activityPhrase.slice(1);

            return activityPhrase;
        }

        // Fallback: return original sentence cleaned up
        return sentence.trim().replace(/[.,;:!?]+$/, '').trim();
    }

    /**
     * Calculate confidence score for parsed elements
     * Returns score between 0-100
     */
    function calculateConfidence(type, context) {
        let score = 50; // Base confidence

        switch (type) {
            case 'actor':
                // Higher confidence if actor has department prefix
                if (context.hasPrefix) score += 20;
                // Higher confidence if actor is at sentence beginning (subject position)
                if (context.isSubjectPosition) score += 15;
                // Higher confidence if actor is normalized (known synonym)
                if (context.isNormalized) score += 10;
                break;

            case 'activity':
                // Higher confidence if activity starts with verb
                if (context.startsWithVerb) score += 20;
                // Higher confidence if activity has associated actor
                if (context.hasActor) score += 15;
                // Higher confidence if activity has object
                if (context.hasObject) score += 10;
                break;

            case 'decision':
                // Higher confidence if sentence has question mark
                if (context.hasQuestionMark) score += 20;
                // Higher confidence if starts with conditional word
                if (context.startsWithConditional) score += 15;
                // Higher confidence if has comma (clear conditional clause)
                if (context.hasComma) score += 10;
                break;

            case 'document':
                // Higher confidence if document keyword is multi-word (more specific)
                if (context.isMultiWord) score += 15;
                // Higher confidence if document appears with actor
                if (context.hasActor) score += 10;
                break;

            case 'database':
                // Higher confidence for well-known system names
                if (context.isWellKnown) score += 20;
                // Higher confidence if appears with action context
                if (context.hasActionContext) score += 10;
                break;
        }

        return Math.min(score, 100);
    }

    /**
     * Extract activities from text
     * Returns array of activity objects with context and confidence
     * Format: "Verb + Object" for Rule Engine compatibility
     */
    function extractActivities(text, actors) {
        const sentences = splitSentences(text);
        const activities = [];

        for (const sentence of sentences) {
            if (!containsKeyword(sentence, ACTIVITY_KEYWORDS)) continue;

            // Skip if this is a true decision point (priority: decision > activity)
            if (isTrueDecision(sentence)) continue;

            // Try to associate with an actor
            let associatedActor = null;
            for (const actor of actors) {
                if (normalizeText(sentence).includes(normalizeText(actor))) {
                    associatedActor = actor;
                    break;
                }
            }

            // Extract the activity phrase
            const matchedKeyword = findMatchingKeyword(sentence, ACTIVITY_KEYWORDS);

            // Extract activity in "Verb + Object" format
            const activityPhrase = extractActivityPhrase(sentence, matchedKeyword);

            // Calculate confidence
            const confidence = calculateConfidence('activity', {
                startsWithVerb: ACTIVITY_KEYWORDS.some(kw =>
                    normalizeText(activityPhrase).startsWith(normalizeText(kw))
                ),
                hasActor: associatedActor !== null,
                hasObject: activityPhrase.split(/\s+/).length > 1
            });

            activities.push({
                text: activityPhrase,
                actor: associatedActor,
                keyword: matchedKeyword,
                confidence: confidence,
                type: 'activity'
            });
        }

        return activities;
    }

    /**
     * Check if a sentence is a true decision point
     * Must have conditional structure, not just contain decision keywords
     * NOTE: Checks for comma in ORIGINAL sentence, not normalized (normalizeText removes commas)
     */
    function isTrueDecision(sentence) {
        // IMPORTANT: Check for comma in ORIGINAL sentence before normalization
        // normalizeText() removes all punctuation including commas
        const hasCommaInOriginal = sentence.includes(',');
        const hasQuestionMark = sentence.includes('?');

        const normalized = normalizeText(sentence);

        // Check for question marks - always a decision
        if (hasQuestionMark) {
            return true;
        }

        // Check for explicit question format (starts with "apakah")
        if (normalized.startsWith('apakah')) {
            return true;
        }

        // Check for conditional clauses at the BEGINNING of sentence
        // "Jika X, maka Y" or "Jika disetujui, ..." structure
        const conditionalStarters = ['jika', 'bila', 'apabila', 'ketika', 'saat'];
        for (const starter of conditionalStarters) {
            if (normalized.startsWith(starter + ' ')) {
                // Use hasCommaInOriginal instead of checking normalized (which has no commas)
                if (hasCommaInOriginal) {
                    return true;
                }
            }
        }

        // Check for approval outcome words that indicate a decision was made
        // Only if they appear as the main verb, not just mentioned
        const decisionOutcomes = ['disetujui', 'ditolak', 'diterima', 'dikembalikan'];
        for (const outcome of decisionOutcomes) {
            // Check if the outcome is the main action (after subject)
            const pattern = new RegExp(`\\b${outcome}\\b`);
            if (pattern.test(normalized)) {
                // Check if it's a standalone statement about approval
                const words = normalized.split(/\s+/);
                const outcomeIndex = words.indexOf(outcome);
                if (outcomeIndex > 0 && outcomeIndex < 3) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Extract decision points from text
     */
    function extractDecisions(text, actors) {
        const sentences = splitSentences(text);
        const decisions = [];

        for (const sentence of sentences) {
            // Check for question marks
            const hasQuestionMark = sentence.includes('?');

            // Only proceed if it's a true decision point
            const hasDecisionKeyword = containsKeyword(sentence, DECISION_KEYWORDS);
            const isDecision = hasQuestionMark || (hasDecisionKeyword && isTrueDecision(sentence));

            if (!isDecision) continue;

            // Try to associate with an actor
            let associatedActor = null;
            for (const actor of actors) {
                if (normalizeText(sentence).includes(normalizeText(actor))) {
                    associatedActor = actor;
                    break;
                }
            }

            // Clean up decision text
            let decisionText = sentence.trim()
                .replace(/[.,;:!?]+$/, '')
                .replace(/^\?/, '')
                .trim();

            // Add question mark if it's a question format
            if (decisionText.startsWith('apakah') || hasQuestionMark) {
                decisionText = decisionText.replace(/\?$/, '') + '?';
            }

            // Calculate confidence for this decision
            const confidence = calculateConfidence('decision', {
                sentence: sentence,
                actor: associatedActor,
                hasQuestionMark: hasQuestionMark,
                hasComma: sentence.includes(','),
                hasConditional: DECISION_KEYWORDS.some(kw => normalizeText(sentence).includes(normalizeText(kw)))
            });

            decisions.push({
                text: decisionText,
                actor: associatedActor,
                hasQuestionMark: hasQuestionMark,
                type: 'decision',
                confidence: confidence
            });
        }

        return decisions;
    }

    /**
     * Extract documents from text
     * Extracts document mentions even when they appear within activity sentences
     * Filters out shorter keywords when longer variants exist in the SAME sentence
     * (e.g., "order" when "purchase order" exists in same sentence, "berita acara" when "berita acara penerimaan" exists)
     */
    function extractDocuments(text, activities) {
        const sentences = splitSentences(text);
        const documents = [];
        const seenDocuments = new Set(); // Avoid duplicates

        // Helper: Check if a keyword is a substring of any longer keyword that also matches in the same sentence
        function isSubKeywordOfLonger(keyword, sentence) {
            const normalizedSentence = normalizeText(sentence);
            const normalizedKw = normalizeText(keyword);

            // Check if this keyword is contained within any OTHER longer keyword that also matches
            for (const otherKw of DOCUMENT_KEYWORDS) {
                const normalizedOther = normalizeText(otherKw);
                // Skip if same keyword or if other is not longer
                if (normalizedOther === normalizedKw || normalizedOther.length <= normalizedKw.length) continue;

                // Check if the longer keyword contains this keyword AND both match the sentence
                if (normalizedOther.includes(normalizedKw) && normalizedSentence.includes(normalizedOther)) {
                    return true; // This keyword is part of a longer matching keyword
                }
            }
            return false;
        }

        for (const sentence of sentences) {
            if (!containsKeyword(sentence, DOCUMENT_KEYWORDS)) continue;

            const normalizedSentence = normalizeText(sentence);

            // Find all matching document keywords in this sentence
            const matchesInSentence = [];

            for (const docKeyword of DOCUMENT_KEYWORDS) {
                const normalizedKw = normalizeText(docKeyword);
                if (normalizedSentence.includes(normalizedKw)) {
                    // Skip if this is a sub-keyword of a longer matching keyword in the same sentence
                    if (isSubKeywordOfLonger(docKeyword, sentence)) continue;

                    matchesInSentence.push(docKeyword);
                }
            }

            // Process matches
            for (const docKeyword of matchesInSentence) {
                const docKey = normalizeText(docKeyword);
                if (seenDocuments.has(docKey)) continue;
                seenDocuments.add(docKey);

                const docText = docKeyword.charAt(0).toUpperCase() + docKeyword.slice(1);

                // Try to associate with an actor from the sentence
                let associatedActor = null;
                const sentenceActors = extractActors(sentence);
                if (sentenceActors.length > 0) {
                    associatedActor = sentenceActors[0];
                }

                // Calculate confidence for this document
                const confidence = calculateConfidence('document', {
                    sentence: sentence,
                    keyword: docKeyword,
                    actor: associatedActor
                });

                documents.push({
                    text: docText,
                    actor: associatedActor,
                    keyword: docKeyword,
                    type: 'document',
                    confidence: confidence
                });
            }
        }

        return documents;
    }

    /**
     * Extract database/system references from text
     * Extracts database mentions even when they appear within activity sentences
     */
    function extractDatabases(text, activities) {
        const sentences = splitSentences(text);
        const databases = [];
        const seenDatabases = new Set(); // Avoid duplicates

        for (const sentence of sentences) {
            if (!containsKeyword(sentence, DATABASE_KEYWORDS)) continue;

            const normalizedSentence = normalizeText(sentence);

            // Find all matching database keywords in this sentence
            for (const dbKeyword of DATABASE_KEYWORDS) {
                const normalizedKw = normalizeText(dbKeyword);
                if (normalizedSentence.includes(normalizedKw)) {
                    // Create unique key to avoid duplicates
                    const dbKey = normalizedKw.toLowerCase();
                    if (seenDatabases.has(dbKey)) continue;
                    seenDatabases.add(dbKey);

                    const dbText = dbKeyword.charAt(0).toUpperCase() + dbKeyword.slice(1);

                    // Calculate confidence for this database
                    const confidence = calculateConfidence('database', {
                        sentence: sentence,
                        keyword: dbKeyword
                    });

                    databases.push({
                        text: dbText,
                        keyword: dbKeyword,
                        type: 'database',
                        confidence: confidence
                    });
                }
            }
        }

        return databases;
    }

    // ============================================
    // Priority Resolution
    // ============================================

    /**
     * Resolve overlapping classifications using priority system
     * 
     * Priority (highest to lowest):
     * 1. ACTOR - Department/role mentions
     * 2. DECISION - Conditional/question points
     * 3. DOCUMENT - Document references
     * 4. DATABASE - System/database references
     * 5. ACTIVITY - Action/process descriptions
     * 
     * Rules:
     * - If a sentence mentions an actor + activity, create activity node assigned to actor
     * - If a sentence is a decision, create decision node (not activity)
     * - Documents mentioned within activity sentences are NOT separate nodes
     * - Standalone document mentions become document nodes
     */
    function resolvePriorities(text) {
        const startTime = performance.now();

        // Reset metadata ID counters
        actorIdCounter = 1;
        activityIdCounter = 1;
        decisionIdCounter = 1;
        documentIdCounter = 1;
        databaseIdCounter = 1;

        // Step 1: Extract all actors first (highest priority)
        const actors = extractActors(text);

        // Step 2: Extract activities
        const activities = extractActivities(text, actors);

        // Step 3: Extract decisions (higher priority than documents)
        const decisions = extractDecisions(text, actors);

        // Step 4: Extract standalone documents (not in activity context)
        const documents = extractDocuments(text, activities);

        // Step 5: Extract databases (lowest priority, standalone only)
        const databases = extractDatabases(text, activities);

        const endTime = performance.now();
        const parsingDurationMs = Math.round((endTime - startTime) * 100) / 100;

        // Build actor metadata (parallel to actors array for backward compatibility)
        const actorMetadata = actors.map(actor => ({
            id: generateId('actor', actorIdCounter++),
            name: actor,
            displayName: getActorDisplayName(actor),
            classification: classifyActor(actor),
            confidence: calculateConfidence('actor', {
                hasPrefix: DEPARTMENT_PREFIXES.some(prefix =>
                    normalizeText(actor).startsWith(normalizeText(prefix))
                ),
                isSubjectPosition: true,
                isNormalized: ACTOR_NORMALIZATIONS[normalizeText(actor)] !== undefined
            })
        }));

        // Build activity metadata
        const activityMetadata = activities.map(activity => ({
            id: generateId('activity', activityIdCounter++),
            text: activity.text,
            actor: activity.actor,
            confidence: activity.confidence
        }));

        // Build decision metadata
        const decisionMetadata = decisions.map(decision => ({
            id: generateId('decision', decisionIdCounter++),
            text: decision.text,
            actor: decision.actor,
            confidence: decision.confidence
        }));

        // Build document metadata
        const documentMetadata = documents.map(document => ({
            id: generateId('document', documentIdCounter++),
            text: document.text,
            actor: document.actor,
            confidence: document.confidence
        }));

        // Build database metadata
        const databaseMetadata = databases.map(database => ({
            id: generateId('database', databaseIdCounter++),
            text: database.text,
            confidence: database.confidence
        }));

        // Calculate confidence statistics
        const allConfidences = [
            ...actors.map(() => actorMetadata.find(m => m.name === actors[0])?.confidence || 50),
            ...activities.map(a => a.confidence),
            ...decisions.map(d => d.confidence),
            ...documents.map(d => d.confidence),
            ...databases.map(d => d.confidence)
        ];
        const averageConfidence = allConfidences.length > 0
            ? Math.round(allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length * 10) / 10
            : 0;

        const confidenceByCategory = {
            actor: actorMetadata.length > 0
                ? Math.round(actorMetadata.reduce((sum, m) => sum + m.confidence, 0) / actorMetadata.length)
                : 0,
            activity: activities.length > 0
                ? Math.round(activities.reduce((sum, a) => sum + a.confidence, 0) / activities.length)
                : 0,
            decision: decisions.length > 0
                ? Math.round(decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length)
                : 0,
            document: documents.length > 0
                ? Math.round(documents.reduce((sum, d) => sum + d.confidence, 0) / documents.length)
                : 0,
            database: databases.length > 0
                ? Math.round(databases.reduce((sum, d) => sum + d.confidence, 0) / databases.length)
                : 0
        };

        // Build validation summary
        const totalElements = actors.length + activities.length + decisions.length + documents.length + databases.length;
        const validationSummary = {
            actors: actors.length,
            activities: activities.length,
            decisions: decisions.length,
            documents: documents.length,
            databases: databases.length,
            totalElements: totalElements
        };

        // Generate warnings for low confidence items
        const warnings = [];
        const LOW_CONFIDENCE_THRESHOLD = 60;

        if (decisions.length > 0 && confidenceByCategory.decision < LOW_CONFIDENCE_THRESHOLD) {
            warnings.push({
                type: 'low_confidence',
                category: 'decision',
                message: 'Low confidence in decision detection - consider manual review'
            });
        }

        if (actors.length === 0) {
            warnings.push({
                type: 'missing_element',
                category: 'actor',
                message: 'No actors detected - flowchart may lack clear responsibility assignment'
            });
        }

        if (activities.length === 0) {
            warnings.push({
                type: 'missing_element',
                category: 'activity',
                message: 'No activities detected - cannot generate meaningful flowchart'
            });
        }

        // Build parser metadata
        const parserMetadata = {
            version: PARSER_VERSION,
            parsedAt: new Date().toISOString(),
            parsingDurationMs: parsingDurationMs,
            averageConfidence: averageConfidence,
            confidenceByCategory: confidenceByCategory,
            validationSummary: validationSummary,
            warnings: warnings
        };

        return {
            actors,
            activities,
            decisions,
            documents,
            databases,
            actorMetadata,
            activityMetadata,
            decisionMetadata,
            documentMetadata,
            databaseMetadata,
            parserMetadata
        };
    }

    // ============================================
    // Layout Calculation
    // ============================================

    /**
     * Calculate positions for nodes within swimlanes
     */
    function calculateLayout(parsedData, orientation = 'vertical') {
        const config = LAYOUT_CONFIG[orientation];
        const nodes = [];
        const swimlanes = [];
        const connectors = [];

        // Reset counters
        nodeIdCounter = 1;
        laneIdCounter = 1;

        // Create swimlanes for each actor
        const uniqueActors = [...new Set([
            ...parsedData.actors,
            ...parsedData.activities.map(a => a.actor).filter(Boolean),
            ...parsedData.decisions.map(d => d.actor).filter(Boolean),
            ...parsedData.documents.map(d => d.actor).filter(Boolean)
        ])];

        // If no actors found, create a default lane
        if (uniqueActors.length === 0) {
            uniqueActors.push('Umum');
        }

        // Calculate swimlane positions
        if (orientation === 'vertical') {
            uniqueActors.forEach((actor, index) => {
                swimlanes.push({
                    id: `lane_${laneIdCounter++}`,
                    name: actor,
                    x: config.nodePadding + index * (config.swimlaneWidth + config.swimlaneSpacing),
                    y: config.nodePadding,
                    width: config.swimlaneWidth,
                    height: 600, // Will be adjusted based on content
                    color: '#F3F4F6'
                });
            });
        } else {
            uniqueActors.forEach((actor, index) => {
                swimlanes.push({
                    id: `lane_${laneIdCounter++}`,
                    name: actor,
                    x: config.nodePadding,
                    y: config.nodePadding + index * (config.swimlaneHeight + config.swimlaneSpacing),
                    width: 800, // Will be adjusted
                    height: config.swimlaneHeight,
                    color: '#F3F4F6'
                });
            });
        }

        // Create a map for quick lane lookup
        const laneMap = {};
        swimlanes.forEach(lane => {
            laneMap[lane.name] = lane;
            // Also map common variations
            laneMap[lane.name.toLowerCase()] = lane;
        });

        // Track node positions per lane for flow ordering
        const laneNodeCount = {};
        swimlanes.forEach(lane => { laneNodeCount[lane.id] = 0; });

        let previousNode = null;

        // Helper to get lane for an actor
        function getLaneForActor(actorName) {
            if (!actorName) return swimlanes[0];

            // Try exact match
            if (laneMap[actorName]) return laneMap[actorName];
            if (laneMap[actorName.toLowerCase()]) return laneMap[actorName.toLowerCase()];

            // Try partial match
            for (const [key, lane] of Object.entries(laneMap)) {
                if (actorName.toLowerCase().includes(key) || key.includes(actorName.toLowerCase())) {
                    return lane;
                }
            }

            return swimlanes[0]; // Default to first lane
        }

        // Helper to calculate node position
        function getNodePosition(lane, offset) {
            if (orientation === 'vertical') {
                return {
                    x: lane.x + (lane.width - config.nodeWidth) / 2,
                    y: config.startY + offset * (config.nodeHeight + config.nodeSpacing)
                };
            } else {
                return {
                    x: config.startX + offset * (config.nodeWidth + config.nodeSpacing),
                    y: lane.y + (lane.height - config.nodeHeight) / 2
                };
            }
        }

        // Create start node
        const startLane = swimlanes[0];
        const startNode = {
            id: nodeIdCounter++,
            type: 'terminator',
            text: 'Mulai',
            ...getNodePosition(startLane, laneNodeCount[startLane.id]++),
            color: '#10B981',
            swimlane: startLane.id,
            wcgwDetectionIds: []
        };
        nodes.push(startNode);
        previousNode = startNode;

        // Process activities
        for (const activity of parsedData.activities) {
            const lane = getLaneForActor(activity.actor);
            const pos = getNodePosition(lane, laneNodeCount[lane.id]++);

            const node = {
                id: nodeIdCounter++,
                type: 'process',
                text: activity.text.length > 30 ? activity.text.substring(0, 28) + '...' : activity.text,
                ...pos,
                color: '#4A90D9',
                swimlane: lane.id,
                wcgwDetectionIds: []
            };
            nodes.push(node);

            // Create connector from previous node
            if (previousNode) {
                connectors.push({
                    id: generateId('conn'),
                    from: previousNode.id,
                    to: node.id
                });
            }
            previousNode = node;
        }

        // Process decisions
        for (const decision of parsedData.decisions) {
            const lane = getLaneForActor(decision.actor);
            const pos = getNodePosition(lane, laneNodeCount[lane.id]++);

            const node = {
                id: nodeIdCounter++,
                type: 'decision',
                text: decision.text.length > 20 ? decision.text.substring(0, 18) + '...' : decision.text,
                ...pos,
                color: '#F59E0B',
                swimlane: lane.id,
                wcgwDetectionIds: []
            };
            nodes.push(node);

            // Create connector from previous node
            if (previousNode) {
                connectors.push({
                    id: generateId('conn'),
                    from: previousNode.id,
                    to: node.id
                });
            }

            // Create Yes/No branches
            const yesOffset = laneNodeCount[lane.id]++;
            const noOffset = laneNodeCount[lane.id]++;

            const yesNode = {
                id: nodeIdCounter++,
                type: 'process',
                text: 'Proses Ya',
                ...getNodePosition(lane, yesOffset),
                color: '#4A90D9',
                swimlane: lane.id,
                wcgwDetectionIds: []
            };

            const noNode = {
                id: nodeIdCounter++,
                type: 'process',
                text: 'Proses Tidak',
                ...getNodePosition(lane, noOffset),
                color: '#4A90D9',
                swimlane: lane.id,
                wcgwDetectionIds: []
            };

            nodes.push(yesNode, noNode);

            connectors.push({
                id: generateId('conn'),
                from: node.id,
                to: yesNode.id,
                label: 'Ya'
            });

            connectors.push({
                id: generateId('conn'),
                from: node.id,
                to: noNode.id,
                label: 'Tidak'
            });

            // Continue from Yes branch
            previousNode = yesNode;
        }

        // Process documents
        for (const doc of parsedData.documents) {
            const lane = getLaneForActor(doc.actor);
            const pos = getNodePosition(lane, laneNodeCount[lane.id]++);

            const node = {
                id: nodeIdCounter++,
                type: 'document',
                text: doc.text,
                ...pos,
                color: '#8B5CF6',
                swimlane: lane.id,
                wcgwDetectionIds: []
            };
            nodes.push(node);

            if (previousNode) {
                connectors.push({
                    id: generateId('conn'),
                    from: previousNode.id,
                    to: node.id
                });
            }
            previousNode = node;
        }

        // Process databases
        for (const db of parsedData.databases) {
            const lane = getLaneForActor(db.actor) || swimlanes[0];
            const pos = getNodePosition(lane, laneNodeCount[lane.id]++);

            const node = {
                id: nodeIdCounter++,
                type: 'database',
                text: db.text,
                ...pos,
                color: '#6366F1',
                swimlane: lane.id,
                wcgwDetectionIds: []
            };
            nodes.push(node);

            if (previousNode) {
                connectors.push({
                    id: generateId('conn'),
                    from: previousNode.id,
                    to: node.id
                });
            }
            previousNode = node;
        }

        // Create end node
        if (previousNode) {
            const endLane = previousNode.swimlane ?
                swimlanes.find(l => l.id === previousNode.swimlane) || swimlanes[0] :
                swimlanes[0];

            const endNode = {
                id: nodeIdCounter++,
                type: 'terminator',
                text: 'Selesai',
                ...getNodePosition(endLane, laneNodeCount[endLane.id]++),
                color: '#EF4444',
                swimlane: endLane.id,
                wcgwDetectionIds: []
            };
            nodes.push(endNode);

            connectors.push({
                id: generateId('conn'),
                from: previousNode.id,
                to: endNode.id
            });
        }

        // Adjust swimlane sizes based on content
        swimlanes.forEach(lane => {
            const laneNodes = nodes.filter(n => n.swimlane === lane.id);
            if (laneNodes.length > 0) {
                if (orientation === 'vertical') {
                    const maxY = Math.max(...laneNodes.map(n => n.y));
                    lane.height = maxY + config.nodeHeight + config.nodePadding;
                } else {
                    const maxX = Math.max(...laneNodes.map(n => n.x));
                    lane.width = maxX + config.nodeWidth + config.nodePadding;
                }
            }
        });

        return { nodes, connectors, swimlanes };
    }

    // ============================================
    // Schema Validation
    // ============================================

    /**
     * Validate generated flowchart against DATA_SCHEMAS.md
     * Uses schema-validator.js if available
     */
    function validateFlowchart(flowchart) {
        // Check required fields
        if (!flowchart.nodes || !Array.isArray(flowchart.nodes)) {
            return { valid: false, errors: ['Missing nodes array'] };
        }

        if (!flowchart.connectors || !Array.isArray(flowchart.connectors)) {
            return { valid: false, errors: ['Missing connectors array'] };
        }

        if (!flowchart.swimlanes || !Array.isArray(flowchart.swimlanes)) {
            return { valid: false, errors: ['Missing swimlanes array'] };
        }

        // Validate nodes
        const nodeErrors = [];
        const nodeIds = new Set();

        flowchart.nodes.forEach((node, index) => {
            if (typeof node.id !== 'number') {
                nodeErrors.push(`Node ${index}: id must be a number`);
            }
            if (nodeIds.has(node.id)) {
                nodeErrors.push(`Node ${index}: Duplicate id ${node.id}`);
            }
            nodeIds.add(node.id);

            if (!node.type || typeof node.text !== 'string') {
                nodeErrors.push(`Node ${index}: Missing required fields (type, text)`);
            }
            if (typeof node.x !== 'number' || typeof node.y !== 'number') {
                nodeErrors.push(`Node ${index}: Invalid coordinates`);
            }
            if (node.wcgwDetectionIds && !Array.isArray(node.wcgwDetectionIds)) {
                nodeErrors.push(`Node ${index}: wcgwDetectionIds must be an array`);
            }
        });

        // Validate connectors
        const connectorErrors = [];
        flowchart.connectors.forEach((conn, index) => {
            if (!conn.from || !conn.to) {
                connectorErrors.push(`Connector ${index}: Missing from/to`);
            }
            if (!flowchart.nodes.find(n => n.id === conn.from)) {
                connectorErrors.push(`Connector ${index}: Invalid from node ${conn.from}`);
            }
            if (!flowchart.nodes.find(n => n.id === conn.to)) {
                connectorErrors.push(`Connector ${index}: Invalid to node ${conn.to}`);
            }
        });

        // Validate swimlanes
        const swimlaneErrors = [];
        const swimlaneIds = new Set();

        flowchart.swimlanes.forEach((lane, index) => {
            if (!lane.id || typeof lane.name !== 'string') {
                swimlaneErrors.push(`Swimlane ${index}: Missing required fields`);
            }
            if (swimlaneIds.has(lane.id)) {
                swimlaneErrors.push(`Swimlane ${index}: Duplicate id ${lane.id}`);
            }
            swimlaneIds.add(lane.id);
        });

        // Check node-swimlane references
        flowchart.nodes.forEach(node => {
            if (node.swimlane && !flowchart.swimlanes.find(l => l.id === node.swimlane)) {
                nodeErrors.push(`Node ${node.id}: Invalid swimlane reference ${node.swimlane}`);
            }
        });

        const allErrors = [...nodeErrors, ...connectorErrors, ...swimlaneErrors];

        return {
            valid: allErrors.length === 0,
            errors: allErrors
        };
    }

    // ============================================
    // Main Generation Function
    // ============================================

    /**
     * Generate complete flowchart from business process text
     * 
     * @param {string} text - Business process description
     * @param {object} options - Generation options
     * @param {string} options.orientation - 'vertical' or 'horizontal'
     * @param {string} options.outputType - 'flowchart-only' or 'flowchart-wcgw'
     * @param {string} options.userId - User ID for audit trail
     * @returns {object} Flowchart object conforming to DATA_SCHEMAS.md
     */
    function generate(text, options = {}) {
        const {
            orientation = 'vertical',
            outputType = 'flowchart-wcgw',
            userId = 'system'
        } = options;

        // Reset state
        nodeIdCounter = 1;
        laneIdCounter = 1;

        // Step 1: Parse text with priority resolution
        const parsedData = resolvePriorities(text);

        // Step 2: Check for minimum requirements
        if (parsedData.actors.length === 0 && parsedData.activities.length === 0) {
            return {
                success: false,
                error: 'Tidak dapat mengidentifikasi actor atau aktivitas dari teks. Pastikan deskripsi proses bisnis mengandung informasi tentang departemen/pihak yang terlibat dan aktivitas yang dilakukan.',
                parsedData: parsedData
            };
        }

        // Step 3: Calculate layout
        const layout = calculateLayout(parsedData, orientation);

        // Step 4: Build flowchart object
        const now = new Date().toISOString();
        const flowchart = {
            nodes: layout.nodes,
            connectors: layout.connectors,
            swimlanes: layout.swimlanes,
            orientation: orientation,
            locked: false,
            versionHistory: [
                {
                    version: 1,
                    timestamp: now,
                    editor: userId,
                    changes: 'Generated from business process description',
                    snapshot: {
                        nodes: layout.nodes,
                        connectors: layout.connectors,
                        swimlanes: layout.swimlanes
                    }
                }
            ],
            createdBy: userId,
            updatedBy: userId,
            createdAt: now,
            updatedAt: now,
            title: 'Flowchart - Generated',
            description: text.substring(0, 100) + (text.length > 100 ? '...' : '')
        };

        // Step 5: Validate against schema
        const validation = validateFlowchart(flowchart);

        if (!validation.valid) {
            return {
                success: false,
                error: 'Validasi flowchart gagal: ' + validation.errors.join(', '),
                flowchart: flowchart,
                parsedData: parsedData
            };
        }

        return {
            success: true,
            flowchart: flowchart,
            parsedData: parsedData,
            stats: {
                nodeCount: layout.nodes.length,
                connectorCount: layout.connectors.length,
                swimlaneCount: layout.swimlanes.length,
                actorCount: parsedData.actors.length,
                activityCount: parsedData.activities.length,
                decisionCount: parsedData.decisions.length,
                documentCount: parsedData.documents.length,
                databaseCount: parsedData.databases.length
            }
        };
    }

    // ============================================
    // Public API
    // ============================================

    return {
        generate,
        validateFlowchart,
        extractActors,
        extractActivities,
        extractDecisions,
        extractDocuments,
        extractDatabases,
        resolvePriorities,
        calculateLayout,

        // Configuration access for testing
        getConfig: () => ({
            ACTOR_KEYWORDS,
            ACTIVITY_KEYWORDS,
            DECISION_KEYWORDS,
            DOCUMENT_KEYWORDS,
            DATABASE_KEYWORDS,
            PRIORITY,
            LAYOUT_CONFIG
        })
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlowchartGenerator;
}