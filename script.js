document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinksContainer = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links a');

    // Routes Configuration
    const routes = {
        '/': 'Dashboard', // Default to Dashboard logic or home
        '/dashboard': 'Dashboard',
        '/saved': 'Saved',
        '/digest': 'Digest',
        '/settings': 'Settings',
        '/proof': 'Proof',
        '/jt/07-test': 'Test',
        '/jt/08-ship': 'Ship'
    };

    // ... (existing code) ...

    // Router Function
    function router() {
        // Get current hash path or default to '/'
        let path = window.location.hash.slice(1) || '/';

        const contentContainer = app;

        // Route Handlers
        switch (path) {
            case '/':
                renderLanding();
                break;
            case '/settings':
                renderSettings();
                break;
            case '/dashboard':
                renderDashboard();
                break;
            case '/saved':
                renderSaved();
                break;
            case '/digest':
                renderPremiumEmptyState(path);
                break;
            case '/proof':
                renderProof();
                break;
            case '/jt/07-test': // New Test Route
                renderTestPage();
                break;
            case '/jt/08-ship': // New Ship Route
                renderShipPage();
                break;
            default:
                renderNotFound();
        }

        updateActiveNav(path);
    }

    // --- Test Checklist System ---

    const TEST_ITEMS = [
        { id: 'prefs_persist', label: 'Preferences persist after refresh', desc: 'Modify settings, refresh, verify they are saved.' },
        { id: 'match_score', label: 'Match score calculates correctly', desc: 'Verify score matches your keywords/status.' },
        { id: 'matches_toggle', label: '"Show only matches" toggle works', desc: 'Toggle should filter out 0-score jobs.' },
        { id: 'save_persist', label: 'Save job persists after refresh', desc: 'Star a job, refresh, check /saved.' },
        { id: 'apply_tab', label: 'Apply opens in new tab', desc: 'Click Apply, should open new window.' },
        { id: 'status_persist', label: 'Status update persists after refresh', desc: 'Change status, refresh, verify preserved.' },
        { id: 'status_filter', label: 'Status filter works correctly', desc: 'Filter by "Applied", verify list.' },
        { id: 'digest_gen', label: 'Digest generates top 10 by score', desc: 'Check digest count and scoring.' },
        { id: 'digest_persist', label: 'Digest persists for the day', desc: 'Refresh /digest, should not reset.' },
        { id: 'no_console', label: 'No console errors on main pages', desc: 'F12 > Console > Check for red text.' }
    ];

    function renderTestPage() {
        const testStatus = JSON.parse(localStorage.getItem('jobTrackerTestStatus')) || {};
        const passedCount = Object.values(testStatus).filter(v => v).length;
        const total = TEST_ITEMS.length;
        const isComplete = passedCount === total;

        const badgeClass = isComplete ? 'progress-pass' : 'progress-warn';

        const itemsHTML = TEST_ITEMS.map(item => {
            const isChecked = testStatus[item.id] ? 'checked' : '';
            return `
                <div class="checklist-item">
                    <input type="checkbox" id="${item.id}" class="checklist-checkbox" ${isChecked} onchange="toggleTestItem('${item.id}')">
                    <div class="checklist-content">
                        <label for="${item.id}">${item.label}</label>
                        <div class="checklist-desc">${item.desc}</div>
                    </div>
                </div>
            `;
        }).join('');

        app.innerHTML = `
            <div class="checklist-container">
                <div class="checklist-header">
                    <h1>Pre-Flight Checklist</h1>
                    <span class="progress-badge ${badgeClass}">Tests Passed: ${passedCount} / ${total}</span>
                </div>

                ${!isComplete ? `<p style="margin-bottom: 1.5rem; color: var(--accent-color); font-weight: 500;">⚠️ Resolve all issues before shipping.</p>` : ''}

                <div class="checklist-items">
                    ${itemsHTML}
                </div>

                ${isComplete ? `<a href="#/jt/08-ship" class="cta-button" style="display:block; text-align:center; margin-top: 2rem;">Proceed to Ship 🚀</a>` : ''}
                
                <a onclick="resetTests()" class="reset-link">Reset Test Status</a>
            </div>
        `;
    }

    window.toggleTestItem = function (id) {
        const testStatus = JSON.parse(localStorage.getItem('jobTrackerTestStatus')) || {};
        testStatus[id] = !testStatus[id];
        localStorage.setItem('jobTrackerTestStatus', JSON.stringify(testStatus));
        renderTestPage(); // Re-render to update count/badge
    };

    window.resetTests = function () {
        if (confirm('Are you sure you want to reset all test progress?')) {
            localStorage.removeItem('jobTrackerTestStatus');
            renderTestPage();
        }
    };

    function renderShipPage() {
        // Check Tests
        const testStatus = JSON.parse(localStorage.getItem('jobTrackerTestStatus')) || {};
        const passedCount = Object.values(testStatus).filter(v => v).length;
        const totalTests = TEST_ITEMS.length;
        const testsPassed = passedCount === totalTests;

        // Check Artifacts
        const links = JSON.parse(localStorage.getItem('jobTrackerArtifacts')) || {};
        const allLinksProvided = links.lovable && links.github && links.deploy;

        const isShippable = testsPassed && allLinksProvided;

        let statusBadge = '';
        if (isShippable) {
            statusBadge = '<span class="status-badge status-shipped">Shipped</span>';
        } else if (passedCount > 0 || links.lovable) {
            statusBadge = '<span class="status-badge status-progress">In Progress</span>';
        } else {
            statusBadge = '<span class="status-badge status-start">Not Started</span>';
        }

        if (!isShippable) {
            // Locked State
            app.innerHTML = `
                <div class="lock-screen">
                    <div class="lock-icon">🔒</div>
                    <h1>Locked for Shipping</h1>
                    <div style="margin: 1rem 0;">${statusBadge}</div>
                    
                    <div class="ship-criteria">
                        <div class="criteria-item ${testsPassed ? 'pass' : 'fail'}">
                            ${testsPassed ? '✅' : '❌'} All ${totalTests} Tests Passed
                        </div>
                        <div class="criteria-item ${allLinksProvided ? 'pass' : 'fail'}">
                            ${allLinksProvided ? '✅' : '❌'} All Artifact Links Provided
                        </div>
                    </div>

                    <p class="subtext" style="margin-top: 2rem;">Complete all requirements to verify this build.</p>
                    
                    <div class="ship-actions">
                        <a href="#/jt/07-test" class="btn-secondary">Go to Checklist</a>
                        <a href="#/proof" class="btn-secondary">Go to Proof</a>
                    </div>
                </div>
            `;
        } else {
            // Unlocked State (Shipped)
            app.innerHTML = `
                <div class="ship-screen">
                    <div class="ship-icon">✅</div>
                    <h1>Project 1 Shipped Successfully.</h1>
                    <div style="margin: 1rem 0;">${statusBadge}</div>
                    <p class="subtext">All systems operational. Submission ready.</p>
                    <p style="margin-top: 2rem; color: var(--text-muted); font-family: monospace;">Build v1.0.0-verified</p>
                </div>
            `;
        }
    }

    function renderLanding() {
        app.innerHTML = `
            <div class="hero">
                <h1>Stop Missing The Right Jobs.</h1>
                <p class="subtext">Precision-matched job discovery delivered daily at 9AM.</p>
                <a href="#/settings" class="cta-button">Start Tracking</a>
            </div>
        `;
    }

    function renderSettings() {
        // Load existing prefs
        const prefs = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || {
            roleKeywords: '',
            preferredLocations: [],
            preferredMode: [],
            experienceLevel: '',
            skills: '',
            minMatchScore: 40
        };

        const isModeChecked = (mode) => prefs.preferredMode.includes(mode) ? 'checked' : '';
        const isLocSelected = (loc) => prefs.preferredLocations.includes(loc) ? 'selected' : ''; // simplified for multi-select simulation or just text

        app.innerHTML = `
            <div class="settings-form">
                <h1>Preferences</h1>
                <p class="subtext" style="margin-bottom: 2rem;">Customize your matching engine.</p>
                
                <form id="preferences-form">
                    <div class="form-group">
                        <label>Role Keywords (comma separated)</label>
                        <input type="text" id="pref-roles" value="${prefs.roleKeywords}" placeholder="e.g. Frontend, React, SDE">
                    </div>
                    
                    <div class="form-group">
                        <label>Preferred Locations (hold Ctrl to select multiple)</label>
                        <select id="pref-locations" multiple style="height: 100px; border: 1px solid #e0e0e0; padding: 0.5rem;">
                            <option value="Bangalore" ${isLocSelected('Bangalore')}>Bangalore</option>
                            <option value="Hyderabad" ${isLocSelected('Hyderabad')}>Hyderabad</option>
                            <option value="Pune" ${isLocSelected('Pune')}>Pune</option>
                            <option value="Gurgaon" ${isLocSelected('Gurgaon')}>Gurgaon</option>
                            <option value="Chennai" ${isLocSelected('Chennai')}>Chennai</option>
                            <option value="Mumbai" ${isLocSelected('Mumbai')}>Mumbai</option>
                            <option value="Noida" ${isLocSelected('Noida')}>Noida</option>
                            <option value="Remote" ${isLocSelected('Remote')}>Remote</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-section-title">Work Mode</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label"><input type="checkbox" name="pref-mode" value="Remote" ${isModeChecked('Remote')}> Remote</label>
                            <label class="checkbox-label"><input type="checkbox" name="pref-mode" value="Hybrid" ${isModeChecked('Hybrid')}> Hybrid</label>
                            <label class="checkbox-label"><input type="checkbox" name="pref-mode" value="Onsite" ${isModeChecked('Onsite')}> Onsite</label>
                        </div>
                    </div>

                     <div class="form-group">
                        <label>Experience Level</label>
                        <select id="pref-exp">
                            <option value="">Any</option>
                            <option value="Fresher" ${prefs.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                            <option value="0-1" ${prefs.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Years</option>
                            <option value="1-3" ${prefs.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option>
                            <option value="3-5" ${prefs.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Your Skills (comma separated)</label>
                        <input type="text" id="pref-skills" value="${prefs.skills}" placeholder="e.g. Java, Python, AWS">
                    </div>

                    <div class="form-group">
                        <label>Minimum Match Score: <span id="score-value">${prefs.minMatchScore}</span></label>
                        <div class="range-container">
                            <input type="range" id="pref-score" min="0" max="100" value="${prefs.minMatchScore}">
                        </div>
                    </div>

                    <button type="submit" class="cta-button">Save Preferences</button>
                    <div id="save-msg" style="margin-top: 1rem; color: green; display: none;">Preferences Saved!</div>
                </form>
            </div>
        `;

        // Interactive Slider
        document.getElementById('pref-score').addEventListener('input', (e) => {
            document.getElementById('score-value').textContent = e.target.value;
        });

        // Form Submit
        document.getElementById('preferences-form').addEventListener('submit', (e) => {
            e.preventDefault();

            const roles = document.getElementById('pref-roles').value;
            const locs = Array.from(document.getElementById('pref-locations').selectedOptions).map(opt => opt.value);
            const modes = Array.from(document.querySelectorAll('input[name="pref-mode"]:checked')).map(cb => cb.value);
            const exp = document.getElementById('pref-exp').value;
            const skills = document.getElementById('pref-skills').value;
            const score = document.getElementById('pref-score').value;

            const newPrefs = {
                roleKeywords: roles,
                preferredLocations: locs,
                preferredMode: modes,
                experienceLevel: exp,
                skills: skills,
                minMatchScore: parseInt(score)
            };

            localStorage.setItem('jobTrackerPreferences', JSON.stringify(newPrefs));

            const msg = document.getElementById('save-msg');
            msg.style.display = 'block';
            setTimeout(() => msg.style.display = 'none', 2000);
        });
    }

    // State
    let savedJobIds = JSON.parse(localStorage.getItem('kodnest_saved_jobs')) || [];
    let jobStatuses = JSON.parse(localStorage.getItem('jobTrackerStatus')) || {};
    let statusHistory = JSON.parse(localStorage.getItem('jobTrackerHistory')) || [];

    // --- Status Logic ---
    window.updateStatus = function (id, status) {
        jobStatuses[id] = status;
        localStorage.setItem('jobTrackerStatus', JSON.stringify(jobStatuses));

        // Add to history
        const job = window.jobData.find(j => j.id === id);
        if (job) {
            statusHistory.unshift({
                id: job.id,
                title: job.title,
                company: job.company,
                status: status,
                date: new Date().toISOString()
            });
            // Keep last 20
            if (statusHistory.length > 20) statusHistory.pop();
            localStorage.setItem('jobTrackerHistory', JSON.stringify(statusHistory));
        }

        // Show toast
        showToast(`Status updated: ${status}`);

        // Re-render to update UI (colors)
        // If on Dashboard, re-apply filters. If on Saved, re-render saved.
        const currentHash = window.location.hash.slice(1);
        if (currentHash === '/saved') {
            renderSaved();
        } else {
            applyFiltersAndRender();
        }
    };

    function showToast(msg) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function renderDashboard() {
        app.innerHTML = `
            <h1>Dashboard</h1>
            ${renderFilterBar()}
            <div class="jobs-container" id="jobs-list">
                <!-- Jobs injected here -->
            </div>
        `;

        applyFiltersAndRender();
        attachFilterListeners();
    }

    function renderFilterBar() {
        return `
            <div class="filter-bar">
                <input type="text" id="search-input" class="search-input" placeholder="Search role, company or skills...">
                
                <select id="location-filter" class="filter-select">
                    <option value="">Location</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                    <option value="Remote">Remote</option>
                </select>

                <select id="mode-filter" class="filter-select">
                    <option value="">Mode</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                </select>

                <select id="experience-filter" class="filter-select">
                    <option value="">Exp</option>
                    <option value="Fresher">Fresher</option>
                    <option value="0-1">0-1 Years</option>
                    <option value="1-3">1-3 Years</option>
                </select>

                <select id="status-filter" class="filter-select status-filter-select">
                    <option value="">Status: All</option>
                    <option value="Not Applied">Not Applied</option>
                    <option value="Applied">Applied</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Selected">Selected</option>
                </select>

                <select id="sort-filter" class="filter-select">
                    <option value="latest">Latest</option>
                    <option value="match">Match Score</option>
                    <option value="salary">Salary</option>
                </select>

                <div class="toggle-container">
                    <label class="checkbox-label">
                        <input type="checkbox" id="match-toggle"> Show only matches
                    </label>
                </div>
            </div>
        `;
    }

    function applyFiltersAndRender() {
        const prefs = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || null;

        // Calculate scores for all jobs first (enrichment)
        const enrichedJobs = window.jobData.map(job => ({
            ...job,
            matchScore: prefs ? calculateMatchScore(job, prefs) : 0,
            status: jobStatuses[job.id] || 'Not Applied'
        }));

        // Inputs
        const searchVal = document.getElementById('search-input')?.value.toLowerCase() || '';
        const locVal = document.getElementById('location-filter')?.value || '';
        const modeVal = document.getElementById('mode-filter')?.value || '';
        const expVal = document.getElementById('experience-filter')?.value || '';
        const statusVal = document.getElementById('status-filter')?.value || '';
        const showMatchesOnly = document.getElementById('match-toggle')?.checked || false;

        // Filter
        let filtered = enrichedJobs.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchVal) ||
                job.company.toLowerCase().includes(searchVal) ||
                job.skills.some(s => s.toLowerCase().includes(searchVal));
            const matchesLoc = locVal ? job.location === locVal : true;
            const matchesMode = modeVal ? job.mode === modeVal : true;
            const matchesExp = expVal ? job.experience === expVal : true;
            const matchesStatus = statusVal ? job.status === statusVal : true;

            // Match Score Filter
            const matchesScore = showMatchesOnly && prefs ? job.matchScore >= prefs.minMatchScore : true;

            return matchesSearch && matchesLoc && matchesMode && matchesExp && matchesStatus && matchesScore;
        });

        // Sorting
        const sortVal = document.getElementById('sort-filter')?.value || 'latest';
        if (sortVal === 'latest') {
            filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
        } else if (sortVal === 'match') {
            filtered.sort((a, b) => b.matchScore - a.matchScore);
        }

        const container = document.getElementById('jobs-list');
        if (container) {
            if (filtered.length === 0) {
                container.innerHTML = `<div class="empty-state"><h2>No roles match your criteria</h2><p>Adjust filters or status.</p></div>`;
            } else {
                container.innerHTML = filtered.map(job => createJobCard(job, prefs)).join('');
                attachCardListeners();
            }
        }
    }

    function createJobCard(job, prefs) {
        const isSaved = savedJobIds.includes(job.id);
        const currentStatus = jobStatuses[job.id] || 'Not Applied';

        const scoreBadge = prefs && prefs.roleKeywords ?
            `<div class="match-score ${getScoreClass(job.matchScore || 0)}">Match: ${job.matchScore || 0}</div>` : '';

        return `
            <div class="job-card">
                ${scoreBadge}
                <div class="source-badge">${job.source}</div>
                <div class="job-card-header">
                    <div>
                        <div class="job-title" style="margin-top: 0.5rem;">${job.title}</div>
                        <div class="job-company">${job.company}</div>
                    </div>
                </div>
                
                <div class="job-meta">
                    <span class="meta-item">📍 ${job.location} (${job.mode})</span>
                    <span class="meta-item">💼 ${job.experience}</span>
                    <span class="meta-item salary-tag">💰 ${job.salaryRange}</span>
                </div>

                <div class="posted-date">${job.postedDaysAgo === 0 ? 'Today' : job.postedDaysAgo + ' days ago'}</div>

                <div class="job-actions" style="flex-wrap: wrap;">
                    <select class="status-select ${currentStatus !== 'Not Applied' ? currentStatus : ''}" 
                            onchange="updateStatus(${job.id}, this.value)">
                        <option value="Not Applied" ${currentStatus === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
                        <option value="Applied" ${currentStatus === 'Applied' ? 'selected' : ''}>Applied</option>
                        <option value="Rejected" ${currentStatus === 'Rejected' ? 'selected' : ''}>Rejected</option>
                        <option value="Selected" ${currentStatus === 'Selected' ? 'selected' : ''}>Selected</option>
                    </select>

                    <a href="${job.applyUrl}" target="_blank" class="btn-primary">Apply</a>
                    <button class="btn-secondary" onclick="openModal(${job.id})">View</button>
                    <button class="btn-icon ${isSaved ? 'saved' : ''}" onclick="toggleSave(${job.id})">
                        ${isSaved ? '★' : '☆'}
                    </button>
                </div>
            </div>
        `;
    }

    function attachFilterListeners() {
        ['search-input', 'location-filter', 'mode-filter', 'experience-filter', 'status-filter', 'sort-filter', 'match-toggle'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', applyFiltersAndRender);
            }
        });
    }

    // Attach to window so onclick works
    window.toggleSave = function (id) {
        if (savedJobIds.includes(id)) {
            savedJobIds = savedJobIds.filter(sid => sid !== id);
        } else {
            savedJobIds.push(id);
        }
        localStorage.setItem('kodnest_saved_jobs', JSON.stringify(savedJobIds));

        // Re-render if on dashboard to update icon, or saved page to remove it
        const currentHash = window.location.hash.slice(1);
        if (currentHash === '/saved') {
            renderSaved();
        } else {
            applyFiltersAndRender();
        }
    };

    window.openModal = function (id) {
        const job = window.jobData.find(j => j.id === id);
        if (!job) return;

        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <div class="modal-title">${job.title}</div>
            <div class="modal-company">${job.company}</div>
            <div class="tag-container">
                ${job.skills.map(s => `<span class="tag">${s}</span>`).join('')}
            </div>
            <div class="modal-details">
                <p>${job.description}</p>
                <p style="margin-top: 1rem;"><strong>Source:</strong> ${job.source}</p>
                <p><strong>Posted:</strong> ${job.postedDaysAgo} days ago</p>
            </div>
            <a href="${job.applyUrl}" target="_blank" class="cta-button" style="width: 100%; text-align: center;">Apply Now</a>
        `;

        document.getElementById('job-modal').classList.add('active');
    };

    // Modal Close
    const modal = document.getElementById('job-modal');
    const closeBtn = document.querySelector('.modal-close');

    // Check if elements exist (script might run before dom update fully if not careful, but we are inside specific render flows usually)
    // Actually we need to attach these once globally or re-attach. 
    // Since script.js runs once at load, these should be static in index.html.
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // Stub for attachCardListeners if needed, but we used inline onclick for simplicity in vanilla JS
    function attachCardListeners() { }

    function renderSaved() {
        app.innerHTML = `<h1>Saved Jobs</h1><div class="jobs-container" id="saved-list"></div>`;
        const container = document.getElementById('saved-list');

        const savedJobs = window.jobData.filter(job => savedJobIds.includes(job.id));

        if (savedJobs.length === 0) {
            renderPremiumEmptyState('/saved');
        } else {
            container.innerHTML = savedJobs.map(job => createJobCard(job)).join('');
        }
    }

    function renderPremiumEmptyState(path) {
        if (path === '/digest') {
            renderDigestPage();
            return;
        }

        // Saved page empty state handled in renderSaved or here if generic
        const title = 'Saved Jobs';

        if (document.getElementById('saved-list') && path === '/saved') {
            document.getElementById('saved-list').innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <h2>No saved jobs yet</h2>
                    <p>Click the star icon to save jobs you are interested in.</p>
                </div>
            `;
            return;
        }

        app.innerHTML = `
            <div class="empty-state">
                <h2>${title}</h2>
                <p>Your saved items will appear here.</p>
            </div>
        `;
    }

    // --- Scoring Engine ---

    function calculateMatchScore(job, prefs) {
        if (!prefs) return 0;

        let score = 0;
        const roleKeywords = prefs.roleKeywords.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
        const userSkills = prefs.skills.toLowerCase().split(',').map(s => s.trim()).filter(s => s);

        // +25 if any roleKeyword in title
        if (roleKeywords.some(k => job.title.toLowerCase().includes(k))) {
            score += 25;
        }

        // +15 if any roleKeyword in description
        if (roleKeywords.some(k => job.description.toLowerCase().includes(k))) {
            score += 15;
        }

        // +15 if location matches
        if (prefs.preferredLocations.includes(job.location)) {
            score += 15;
        }

        // +10 if mode matches
        if (prefs.preferredMode.includes(job.mode)) {
            score += 10;
        }

        // +10 if experience matches
        if (prefs.experienceLevel && job.experience === prefs.experienceLevel) {
            score += 10;
        }

        // +15 if skill overlap
        const jobSkills = job.skills.map(s => s.toLowerCase());
        if (userSkills.some(s => jobSkills.includes(s))) {
            score += 15;
        }

        // +5 if posted <= 2 days
        if (job.postedDaysAgo <= 2) {
            score += 5;
        }

        // +5 if source is LinkedIn
        if (job.source === 'LinkedIn') {
            score += 5;
        }

        return Math.min(score, 100);
    }

    function getScoreClass(score) {
        if (score >= 80) return 'score-green';
        if (score >= 60) return 'score-amber';
        if (score >= 40) return 'score-neutral';
        return 'score-grey';
    }

    // --- Digest Engine ---

    function renderDigestPage() {
        const today = new Date().toISOString().split('T')[0];
        const digestKey = `jobTrackerDigest_${today}`;
        const storedDigest = localStorage.getItem(digestKey);

        if (storedDigest) {
            const digestJobs = JSON.parse(storedDigest);
            renderDigestUI(digestJobs, today);
        } else {
            app.innerHTML = `
                <div class="empty-state">
                    <h2>Daily 9AM Digest</h2>
                    <p>Your personalized job curation is ready to be generated.</p>
                    <p class="subtext" style="font-size: 0.9rem; margin-top: 0.5rem;">Demo Mode: Daily 9AM trigger simulated manually.</p>
                    <button class="cta-button" onclick="generateDigest()" style="margin-top: 2rem;">Generate Today's Digest (Simulated)</button>
                </div>
            `;
        }
    }

    window.generateDigest = function () {
        const prefs = JSON.parse(localStorage.getItem('jobTrackerPreferences'));

        if (!prefs) {
            alert("Please set your preferences in the Settings page first.");
            window.location.hash = '#/settings';
            return;
        }

        // 1. Calculate scores
        const scoredJobs = window.jobData.map(job => ({
            ...job,
            matchScore: calculateMatchScore(job, prefs)
        }));

        // 2. Filter (Match Score > 0)
        let candidates = scoredJobs.filter(j => j.matchScore > 0);

        if (candidates.length === 0) {
            app.innerHTML = `
                <div class="empty-state">
                    <h2>No matching roles today</h2>
                    <p>Check again tomorrow or adjust your preferences.</p>
                    <button class="btn-secondary" onclick="renderDigestPage()" style="margin-top: 1rem;">Back</button>
                </div>
            `;
            return;
        }

        // 3. Sort (Score DESC, Date ASC - fresh but high match)
        candidates.sort((a, b) => {
            if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
            return a.postedDaysAgo - b.postedDaysAgo;
        });

        // 4. Slice Top 10
        const digest = candidates.slice(0, 10);

        // 5. Persist
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`jobTrackerDigest_${today}`, JSON.stringify(digest));

        // 6. Render
        renderDigestUI(digest, today);
    };

    function renderDigestUI(jobs, dateStr) {
        const dateDisplay = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const jobListHTML = jobs.map(job => `
            <div class="digest-job">
                <div>
                    <h3>${job.title} <span class="digest-score ${getScoreClass(job.matchScore)}">${job.matchScore}</span></h3>
                    <div class="digest-job-meta">${job.company} • ${job.location} • ${job.experience}</div>
                </div>
                <a href="${job.applyUrl}" target="_blank" class="btn-primary" style="padding: 0.4rem 1rem; font-size: 0.85rem;">Apply</a>
            </div>
        `).join('');

        app.innerHTML = `
            <div class="digest-container">
                <div class="digest-header">
                    <h2>Top 10 Jobs For You</h2>
                    <div class="digest-date">${dateDisplay}</div>
                </div>
                
                <div class="digest-body">
                    ${jobListHTML}

                    ${renderRecentHistory()}
                </div>

                <div class="digest-footer">
                    This digest was generated based on your preferences.<br>
                    Job Notification Tracker Premium
                </div>
            </div>

            <div class="digest-actions">
                <button class="btn-action" onclick="copyDigest()">📋 Copy to Clipboard</button>
                <button class="btn-action" onclick="emailDigest()">✉️ Create Email Draft</button>
            </div>
        `;
    }

    function renderRecentHistory() {
        const history = JSON.parse(localStorage.getItem('jobTrackerHistory')) || [];
        if (history.length === 0) return '';

        const historyHTML = history.slice(0, 5).map(item => `
            <div class="history-item">
                <span>${item.title} @ ${item.company}</span>
                <span class="history-status st-${item.status.replace(' ', '')}">${item.status}</span>
            </div>
        `).join('');

        return `
            <div class="digest-section-title">Recent Status Updates</div>
            <div class="history-list">
                ${historyHTML}
            </div>
        `;
    }
    window.copyDigest = function () {
        const today = new Date().toISOString().split('T')[0];
        const digest = JSON.parse(localStorage.getItem(`jobTrackerDigest_${today}`));
        if (!digest) return;

        let text = `My 9AM Job Digest - ${today}\n\n`;
        digest.forEach((job, i) => {
            text += `${i + 1}. ${job.title} at ${job.company}\n   Loc: ${job.location} | Score: ${job.matchScore}\n   Link: ${job.applyUrl}\n\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            alert("Digest copied to clipboard!");
        });
    };

    window.emailDigest = function () {
        const today = new Date().toISOString().split('T')[0];
        const digest = JSON.parse(localStorage.getItem(`jobTrackerDigest_${today}`));
        if (!digest) return;

        let body = `Here is my daily job digest for ${today}:\n\n`;
        digest.forEach((job, i) => {
            body += `${i + 1}. ${job.title} at ${job.company} (${job.location})\n   Match Score: ${job.matchScore}\n   Apply: ${job.applyUrl}\n\n`;
        });

        const subject = encodeURIComponent("My 9AM Job Digest");
        const bodyEncoded = encodeURIComponent(body);
        window.location.href = `mailto:?subject=${subject}&body=${bodyEncoded}`;
    };


    function renderProof() {
        // Load existing links
        const links = JSON.parse(localStorage.getItem('jobTrackerArtifacts')) || {
            lovable: '',
            github: '',
            deploy: ''
        };

        const testStatus = JSON.parse(localStorage.getItem('jobTrackerTestStatus')) || {};
        const testsPassed = Object.values(testStatus).filter(v => v).length === 10;
        const linksProvided = links.lovable && links.github && links.deploy;

        // Step Summary Data
        const steps = [
            { label: 'Project Setup & Routing', done: true },
            { label: 'Landing Page', done: true },
            { label: 'Preferences Engine', done: true },
            { label: 'Job Data & State', done: true },
            { label: 'Dashboard UI', done: true },
            { label: 'Daily Digest Logic', done: true },
            { label: 'Test Checklist System', done: testsPassed },
            { label: 'Final Submission', done: linksProvided }
        ];

        const stepsHTML = steps.map((s, i) => `
            <div class="step-item ${s.done ? 'step-done' : 'step-pending'}">
                <div class="step-icon">${s.done ? '✓' : '○'}</div>
                <div class="step-label">Step ${i + 1}: ${s.label}</div>
                <div class="step-status">${s.done ? 'Completed' : 'Pending'}</div>
            </div>
        `).join('');

        app.innerHTML = `
            <div class="proof-container">
                <h1>Proof of Work</h1>
                <p class="subtext">Project 1 — Job Notification Tracker</p>

                <div class="proof-section">
                    <h2>A. Step Completion Summary</h2>
                    <div class="steps-grid">
                        ${stepsHTML}
                    </div>
                </div>

                <div class="proof-section">
                    <h2>B. Artifact Collection</h2>
                    <p style="margin-bottom: 1.5rem; color: var(--text-muted);">Please provide links to your work. All fields are required.</p>
                    
                    <div class="form-group">
                        <label>Lovable Project Link</label>
                        <input type="url" id="link-lovable" class="artifact-input" 
                               value="${links.lovable}" placeholder="https://lovable.dev/..." oninput="saveArtifacts()">
                    </div>

                    <div class="form-group">
                        <label>GitHub Repository Link</label>
                        <input type="url" id="link-github" class="artifact-input" 
                               value="${links.github}" placeholder="https://github.com/..." oninput="saveArtifacts()">
                    </div>

                    <div class="form-group">
                        <label>Deployed URL (Vercel/Netlify)</label>
                        <input type="url" id="link-deploy" class="artifact-input" 
                               value="${links.deploy}" placeholder="https://..." oninput="saveArtifacts()">
                    </div>
                </div>

                <div class="proof-actions">
                    <button class="cta-button" onclick="copyFinalSubmission()">Copy Final Submission</button>
                    <div id="copy-msg" style="margin-top: 1rem; color: green; opacity: 0; transition: opacity 0.3s;">Copied to clipboard!</div>
                </div>
            </div>
        `;
    }

    window.saveArtifacts = function () {
        const links = {
            lovable: document.getElementById('link-lovable').value.trim(),
            github: document.getElementById('link-github').value.trim(),
            deploy: document.getElementById('link-deploy').value.trim()
        };
        localStorage.setItem('jobTrackerArtifacts', JSON.stringify(links));
        // Re-render handled by user nav or we could live update status badges if complex, 
        // but for now simple persistence is fine.
    };

    window.copyFinalSubmission = function () {
        const links = JSON.parse(localStorage.getItem('jobTrackerArtifacts')) || {};

        const text = `Job Notification Tracker — Final Submission

Lovable Project:
${links.lovable || '[Missing]'}

GitHub Repository:
${links.github || '[Missing]'}

Live Deployment:
${links.deploy || '[Missing]'}

Core Features:
- Intelligent match scoring
- Daily digest simulation
- Status tracking
- Test checklist enforced`;

        navigator.clipboard.writeText(text).then(() => {
            const msg = document.getElementById('copy-msg');
            msg.style.opacity = '1';
            setTimeout(() => msg.style.opacity = '0', 2000);
        });
    };

    function renderNotFound() {
        app.innerHTML = `<h1>404 Not Found</h1>`;
    }

    function updateActiveNav(path) {
        navLinks.forEach(link => {
            const linkRoute = link.getAttribute('data-route');
            // Special handling: '/' doesn't have a nav link usually, or maybe it should not highlight anything?
            // User requirement: "Dashboard | Saved..." logic.
            // If path is '/', we might want to NOT highlight anything, or highlight nothing.

            if (path === linkRoute) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Listen for hash changes
    window.addEventListener('hashchange', router);

    // Initial load
    router();
});
