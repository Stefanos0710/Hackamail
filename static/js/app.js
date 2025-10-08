/**
 * HackClub Mail - Minimalist Edition
 * Handles fetching and displaying mail data with user-provided API key
 */

class MailApp {
    constructor() {
        this.currentFilter = 'all';
        this.apiKey = '';
        this.mailData = {
            mail: [],
            letters: [],
            packages: []
        };
        this.allMailItems = [];
        this.currentMap = null;
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.setupEventListeners();
        this.loadApiKeyFromStorage();
    }

    /**
     * Load API key from localStorage if available
     */
    loadApiKeyFromStorage() {
        const savedKey = localStorage.getItem('hackmail_api_key');
        if (savedKey) {
            document.getElementById('apiKeyInput').value = savedKey;
            this.apiKey = savedKey;
            document.getElementById('saveKeyBtn').classList.add('saved');
            document.getElementById('saveKeyBtn').textContent = '✓ Saved';
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Save API Key button
        const saveKeyBtn = document.getElementById('saveKeyBtn');
        if (saveKeyBtn) {
            saveKeyBtn.addEventListener('click', () => this.saveApiKey());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadAllMail());
        }

        // API Key input - remove saved state when typing
        const apiKeyInput = document.getElementById('apiKeyInput');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', () => {
                document.getElementById('saveKeyBtn').classList.remove('saved');
                document.getElementById('saveKeyBtn').textContent = '💾 Save';
            });
        }

        // Category filters
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.filterMail(category);
            });
        });

        // Search box
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                this.searchMail(e.target.value);
            });
        }

        // Modal close
        const modalClose = document.getElementById('modalClose');
        const modalOverlay = document.getElementById('mailModal');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * Save API key
     */
    saveApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const key = apiKeyInput.value.trim();

        if (!key) {
            alert('Please enter an API key');
            return;
        }

        this.apiKey = key;
        localStorage.setItem('hackmail_api_key', key);

        const saveBtn = document.getElementById('saveKeyBtn');
        saveBtn.classList.add('saved');
        saveBtn.textContent = '✓ Saved';

        console.log('API key saved successfully');
    }

    /**
     * Load all mail data from API
     */
    async loadAllMail() {
        if (!this.apiKey) {
            this.showError('Please enter and save your API key first');
            return;
        }

        this.showLoading();

        try {
            // Fetch all data in parallel with custom API key
            const [mailResponse, lettersResponse, packagesResponse] = await Promise.all([
                this.fetchWithApiKey('/api/public/v1/mail'),
                this.fetchWithApiKey('/api/public/v1/letters'),
                this.fetchWithApiKey('/api/public/v1/packages')
            ]);

            // Parse responses
            const mailData = await mailResponse.json();
            const lettersData = await lettersResponse.json();
            const packagesData = await packagesResponse.json();

            // Check for errors
            if (!mailResponse.ok || !lettersResponse.ok || !packagesResponse.ok) {
                throw new Error('Failed to fetch mail data. Please check your API key.');
            }

            // Store data
            this.mailData = {
                mail: this.normalizeMailData(mailData),
                letters: this.normalizeLettersData(lettersData),
                packages: this.normalizePackagesData(packagesData)
            };

            // Store all items with original data for detail view
            this.allMailItems = [
                ...this.mailData.mail,
                ...this.mailData.letters,
                ...this.mailData.packages
            ];

            // Update UI
            this.updateStats();
            this.displayMail();

            this.showNotification('✅ Mail loaded successfully!');
        } catch (error) {
            console.error('Error loading mail:', error);
            this.showError('Failed to load mail. Please check your API key and try again.');
        }
    }

    /**
     * Fetch with custom API key header
     */
    async fetchWithApiKey(endpoint) {
        return fetch(endpoint, {
            headers: {
                'X-API-Key': this.apiKey
            }
        });
    }

    /**
     * Normalize mail data structure
     */
    normalizeMailData(data) {
        if (!data) return [];

        const items = data.mail || data.data || data;
        if (!Array.isArray(items)) return [];

        return items.map(item => ({
            id: item.id || Math.random().toString(36),
            type: 'mail',
            from: item.from || item.sender || 'Unknown',
            subject: item.subject || 'No Subject',
            preview: item.preview || item.body || '',
            date: item.date || item.created_at || new Date().toISOString(),
            unread: item.unread !== undefined ? item.unread : true,
            // Store all original data for details
            originalData: item
        }));
    }

    /**
     * Normalize letters data structure
     */
    normalizeLettersData(data) {
        if (!data) return [];

        const items = data.letters || data.data || data;
        if (!Array.isArray(items)) return [];

        return items.map(item => ({
            id: item.id || Math.random().toString(36),
            type: 'letter',
            from: item.from || item.sender || 'Unknown',
            subject: item.subject || item.title || 'Letter',
            preview: item.preview || item.description || '',
            date: item.date || item.received_at || new Date().toISOString(),
            unread: item.unread !== undefined ? item.unread : true,
            originalData: item
        }));
    }

    /**
     * Normalize packages data structure
     */
    normalizePackagesData(data) {
        if (!data) return [];

        const items = data.packages || data.data || data;
        if (!Array.isArray(items)) return [];

        return items.map(item => ({
            id: item.id || Math.random().toString(36),
            type: 'package',
            from: item.from || item.sender || item.carrier || 'Unknown',
            subject: item.subject || item.tracking_number || 'Package',
            preview: item.preview || item.description || item.status || '',
            date: item.date || item.received_at || new Date().toISOString(),
            unread: item.unread !== undefined ? item.unread : true,
            originalData: item
        }));
    }

    /**
     * Update statistics cards
     */
    updateStats() {
        const totalMail = this.mailData.mail.length;
        const totalLetters = this.mailData.letters.length;
        const totalPackages = this.mailData.packages.length;
        const total = totalMail + totalLetters + totalPackages;

        document.getElementById('totalMail').textContent = totalMail;
        document.getElementById('totalLetters').textContent = totalLetters;
        document.getElementById('totalPackages').textContent = totalPackages;
        document.getElementById('totalAll').textContent = total;

        // Update category counts
        document.querySelector('[data-category="all"] .category-count').textContent = total;
        document.querySelector('[data-category="mail"] .category-count').textContent = totalMail;
        document.querySelector('[data-category="letters"] .category-count').textContent = totalLetters;
        document.querySelector('[data-category="packages"] .category-count').textContent = totalPackages;

        // Update unread count
        const unreadCount = this.allMailItems.filter(item => item.unread).length;
        document.querySelector('[data-category="unread"] .category-count').textContent = unreadCount;
    }

    /**
     * Display mail items
     */
    displayMail() {
        const mailListEl = document.getElementById('mailList');

        // Combine all mail items
        let allItems = [];

        switch(this.currentFilter) {
            case 'mail':
                allItems = this.mailData.mail;
                break;
            case 'letters':
                allItems = this.mailData.letters;
                break;
            case 'packages':
                allItems = this.mailData.packages;
                break;
            case 'unread':
                allItems = this.allMailItems.filter(item => item.unread);
                break;
            default: // 'all'
                allItems = this.allMailItems;
        }

        // Sort by date (newest first)
        allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Display items
        if (allItems.length === 0) {
            mailListEl.innerHTML = this.getEmptyStateHTML();
        } else {
            mailListEl.innerHTML = allItems.map(item => this.createMailItemHTML(item)).join('');

            // Add click listeners to mail items
            this.attachMailItemListeners();
        }
    }

    /**
     * Attach click listeners to mail items
     */
    attachMailItemListeners() {
        const mailItems = document.querySelectorAll('.mail-item');
        mailItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.id;
                this.showMailDetail(itemId);
            });
        });
    }

    /**
     * Show mail detail modal
     */
    showMailDetail(itemId) {
        const item = this.allMailItems.find(i => i.id === itemId);
        if (!item) return;

        const modal = document.getElementById('mailModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMeta = document.getElementById('modalMeta');
        const detailGrid = document.getElementById('detailGrid');
        const detailContent = document.getElementById('detailContent');
        const mapSection = document.getElementById('mapSection');

        // Set title
        modalTitle.textContent = item.subject;

        // Set meta info
        const date = new Date(item.date).toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        modalMeta.innerHTML = `
            <span><strong>From:</strong> ${this.escapeHtml(item.from)}</span>
            <span><strong>Date:</strong> ${date}</span>
            <span><strong>Type:</strong> ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
        `;

        // Build detail grid
        const details = this.extractDetails(item);
        detailGrid.innerHTML = details.map(detail => `
            <div class="detail-item">
                <div class="detail-label">${detail.label}</div>
                <div class="detail-value">${this.escapeHtml(String(detail.value))}</div>
            </div>
        `).join('');

        // Set content
        detailContent.textContent = item.preview || item.originalData.body || item.originalData.description || 'No content available';

        // Handle map/location data
        const locationData = this.extractLocationData(item);
        if (locationData) {
            mapSection.style.display = 'block';
            this.initMap(locationData);
        } else {
            mapSection.style.display = 'none';
        }

        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Extract details from mail item
     */
    extractDetails(item) {
        const details = [];
        const data = item.originalData;

        // Common fields
        if (data.id) details.push({ label: 'ID', value: data.id });
        if (data.status) details.push({ label: 'Status', value: data.status });
        if (data.tracking_number) details.push({ label: 'Tracking', value: data.tracking_number });
        if (data.carrier) details.push({ label: 'Carrier', value: data.carrier });
        if (data.weight) details.push({ label: 'Weight', value: data.weight });
        if (data.dimensions) details.push({ label: 'Dimensions', value: data.dimensions });
        if (data.sender_address) details.push({ label: 'Sender Address', value: data.sender_address });
        if (data.recipient_address) details.push({ label: 'Recipient', value: data.recipient_address });
        if (data.estimated_delivery) details.push({ label: 'Est. Delivery', value: data.estimated_delivery });

        return details;
    }

    /**
     * Extract location data from mail item
     */
    extractLocationData(item) {
        const data = item.originalData;

        // Check for various location formats
        if (data.location) {
            if (data.location.lat && data.location.lng) {
                return {
                    lat: data.location.lat,
                    lng: data.location.lng,
                    label: data.location.label || 'Location'
                };
            }
        }

        if (data.latitude && data.longitude) {
            return {
                lat: data.latitude,
                lng: data.longitude,
                label: 'Location'
            };
        }

        if (data.tracking_location) {
            return {
                lat: data.tracking_location.lat,
                lng: data.tracking_location.lng,
                label: 'Tracking Location'
            };
        }

        return null;
    }

    /**
     * Initialize map
     */
    initMap(locationData) {
        const mapContainer = document.getElementById('detailMap');

        // Clear existing map
        if (this.currentMap) {
            this.currentMap.remove();
            this.currentMap = null;
        }

        // Remove placeholder if exists
        mapContainer.innerHTML = '';

        try {
            // Initialize Leaflet map
            this.currentMap = L.map('detailMap').setView([locationData.lat, locationData.lng], 13);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.currentMap);

            // Add marker
            L.marker([locationData.lat, locationData.lng])
                .addTo(this.currentMap)
                .bindPopup(locationData.label)
                .openPopup();
        } catch (error) {
            console.error('Error initializing map:', error);
            mapContainer.innerHTML = `
                <div class="map-placeholder">
                    <div class="map-placeholder-icon">📍</div>
                    <div>Location: ${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}</div>
                </div>
            `;
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('mailModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Cleanup map
        if (this.currentMap) {
            this.currentMap.remove();
            this.currentMap = null;
        }
    }

    /**
     * Create HTML for a mail item
     */
    createMailItemHTML(item) {
        const date = this.formatDate(item.date);
        const unreadClass = item.unread ? 'unread' : '';
        const badgeText = item.type.charAt(0).toUpperCase() + item.type.slice(1);

        return `
            <li class="mail-item ${unreadClass}" data-id="${item.id}">
                <div class="mail-header">
                    <div class="mail-from">
                        ${this.escapeHtml(item.from)}
                        <span class="mail-badge">${badgeText}</span>
                    </div>
                    <div class="mail-date">${date}</div>
                </div>
                <div class="mail-subject">${this.escapeHtml(item.subject)}</div>
                <div class="mail-preview">${this.escapeHtml(item.preview)}</div>
            </li>
        `;
    }

    /**
     * Filter mail by category
     */
    filterMail(category) {
        this.currentFilter = category;

        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        this.displayMail();
    }

    /**
     * Search mail
     */
    searchMail(query) {
        const allItems = document.querySelectorAll('.mail-item');
        const searchLower = query.toLowerCase();

        allItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchLower) ? '' : 'none';
        });
    }

    /**
     * Show loading state
     */
    showLoading() {
        const mailListEl = document.getElementById('mailList');
        mailListEl.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <div class="loading-text">Loading mail...</div>
            </div>
        `;

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
            refreshBtn.textContent = '⏳ Loading...';
        }
    }

    /**
     * Show error state
     */
    showError(message) {
        const mailListEl = document.getElementById('mailList');
        mailListEl.innerHTML = `
            <div class="error-state">
                <div class="error-title">⚠️ Error</div>
                <div class="error-message">${this.escapeHtml(message)}</div>
            </div>
        `;

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.textContent = '🔄 Load Mail';
        }
    }

    /**
     * Get empty state HTML
     */
    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-title">No mail found</div>
                <div class="empty-text">Your mailbox is empty or no items match your filter.</div>
            </div>
        `;
    }

    /**
     * Show notification
     */
    showNotification(message) {
        console.log(message);

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.textContent = '🔄 Load Mail';
        }
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mailApp = new MailApp();
});
