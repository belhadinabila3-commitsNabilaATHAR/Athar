/**
 * ATHAR | أثر - تطبيق قياس الأثر الحقيقي للعمل التطوعي
 * Complete Production Logic
 */

// Global State Management
const ATHAR_STATE = {
    currentUser: null,
    users: [],
    activities: [],
    badgeDefinitions: [
        { id: 'first_step', title: 'الخطوة الأولى', desc: 'إكمال أول نشاط تطوعي', icon: 'fa-seedling', minScore: 10 },
        { id: 'active_volunteer', title: 'متطوع نشط', desc: 'الوصول إلى 100 نقطة أثر', icon: 'fa-hands-helping', minScore: 100 },
        { id: 'community_leader', title: 'قائد مجتمعي', desc: 'الوصول إلى 500 نقطة أثر', icon: 'fa-award', minScore: 500 },
        { id: 'impact_champion', title: 'بطل الأثر', desc: 'الوصول إلى 1000 نقطة أثر', icon: 'fa-crown', minScore: 1000 }
    ]
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    loadState();
    setupEventListeners();
    checkAuthStatus();
    setupAndroidBackButton();
});

// Storage & State Initialization
function initStorage() {
    if (!localStorage.getItem('athar_users')) {
        const defaultUsers = [{
            id: 'usr_default',
            name: 'متطوع تجريبي',
            email: 'demo@athar.dz',
            pin: '0000',
            role: 'متطوع نشط',
            bio: 'حساب تجريبي لاختبار كافة خصائص المنصة',
            impactScore: 150,
            earnedBadges: ['first_step', 'active_volunteer'],
            createdAt: new Date().toISOString()
        }];
        localStorage.setItem('athar_users', JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem('athar_activities')) {
        const defaultActivities = [{
            id: 'act_1',
            userId: 'usr_default',
            title: 'حملة تنظيف وترميم موقع أثري',
            category: 'سياحة وبيئة',
            hours: 4,
            participants: 15,
            location: 'ولاية بومرداس',
            impactScore: 50,
            status: 'completed',
            date: new Date().toISOString().split('T')[0]
        }];
        localStorage.setItem('athar_activities', JSON.stringify(defaultActivities));
    }
}

function loadState() {
    ATHAR_STATE.users = JSON.parse(localStorage.getItem('athar_users')) || [];
    ATHAR_STATE.activities = JSON.parse(localStorage.getItem('athar_activities')) || [];
    const activeUserId = localStorage.getItem('athar_active_user_id');
    if (activeUserId) {
        ATHAR_STATE.currentUser = ATHAR_STATE.users.find(u => u.id === activeUserId) || null;
    }
}

function saveState() {
    localStorage.setItem('athar_users', JSON.stringify(ATHAR_STATE.users));
    localStorage.setItem('athar_activities', JSON.stringify(ATHAR_STATE.activities));
    if (ATHAR_STATE.currentUser) {
        localStorage.setItem('athar_active_user_id', ATHAR_STATE.currentUser.id);
    } else {
        localStorage.removeItem('athar_active_user_id');
    }
}

// Section & View Navigation
function showSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
    }
}

function checkAuthStatus() {
    const userInfoHeader = document.getElementById('user-info-header');
    if (ATHAR_STATE.currentUser) {
        if (userInfoHeader) userInfoHeader.style.setProperty('display', 'flex', 'important');
        showSection('dashboard-section');
        updateUI();
    } else {
        if (userInfoHeader) userInfoHeader.style.setProperty('display', 'none', 'important');
        showSection('login-section');
    }
}

// User Actions: Register & Login
function handleRegister(name, email, pin, role, bio) {
    if (!/^\d{4}$/.test(pin)) {
        alert('رمز PIN يجب أن يتكون من 4 أرقام فقط!');
        return false;
    }
    if (ATHAR_STATE.users.some(u => u.email === email)) {
        alert('البريد الإلكتروني مسجل بالفعل!');
        return false;
    }
    const newUser = {
        id: 'usr_' + Date.now(),
        name,
        email,
        pin,
        role: role || 'متطوع',
        bio: bio || '',
        impactScore: 0,
        earnedBadges: [],
        createdAt: new Date().toISOString()
    };
    ATHAR_STATE.users.push(newUser);
    ATHAR_STATE.currentUser = newUser;
    saveState();
    checkAuthStatus();
    return true;
}

function handleLogin(email, pin) {
    const user = ATHAR_STATE.users.find(u => u.email === email && u.pin === pin);
    if (user) {
        ATHAR_STATE.currentUser = user;
        saveState();
        checkAuthStatus();
        return true;
    } else {
        alert('البريد الإلكتروني أو رمز PIN غير صحيح');
        return false;
    }
}

function handleLogout() {
    ATHAR_STATE.currentUser = null;
    saveState();
    checkAuthStatus();
}

// Activity & Impact Logic
function addActivity(title, category, hours, participants, location) {
    if (!ATHAR_STATE.currentUser) return;

    const numHours = Math.max(0, parseFloat(hours) || 0);
    const numParticipants = Math.max(0, parseInt(participants) || 0);

    // Calculation formula for Impact Score
    const baseScore = numHours * 5;
    const bonusScore = Math.min(numParticipants * 2, 50);
    const calculatedImpact = baseScore + bonusScore;

    const newActivity = {
        id: 'act_' + Date.now(),
        userId: ATHAR_STATE.currentUser.id,
        title,
        category,
        hours: numHours,
        participants: numParticipants,
        location,
        impactScore: calculatedImpact,
        status: 'completed',
        date: new Date().toISOString().split('T')[0]
    };

    ATHAR_STATE.activities.push(newActivity);
    ATHAR_STATE.currentUser.impactScore += calculatedImpact;

    checkBadges(ATHAR_STATE.currentUser);
    saveState();
    updateUI();
    showSection('dashboard-section');
}

function checkBadges(user) {
    ATHAR_STATE.badgeDefinitions.forEach(badge => {
        if (user.impactScore >= badge.minScore && !user.earnedBadges.includes(badge.id)) {
            user.earnedBadges.push(badge.id);
            alert(`🎉 تهانينا! لقد حصلت على وسام جديد: ${badge.title}`);
        }
    });
}

// UI Rendering
function updateUI() {
    if (!ATHAR_STATE.currentUser) return;

    const user = ATHAR_STATE.currentUser;
    
    // Update Profile Information
    const nameDisplays = document.querySelectorAll('#user-name-display');
    nameDisplays.forEach(el => el.textContent = user.name);

    const userRoleEl = document.getElementById('user-role-display');
    if (userRoleEl) userRoleEl.textContent = user.role;

    const scoreEl = document.getElementById('impact-score-display');
    if (scoreEl) scoreEl.textContent = user.impactScore;

    // Render User Activities
    const userActs = ATHAR_STATE.activities.filter(a => a.userId === user.id);
    const actsContainer = document.getElementById('activities-list');
    if (actsContainer) {
        if (userActs.length === 0) {
            actsContainer.innerHTML = '<p class="text-muted text-center py-3">لا توجد أنشطة مسجلة بعد.</p>';
        } else {
            actsContainer.innerHTML = userActs.map(act => `
                <div class="card mb-3 shadow-sm border-0">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="card-title m-0 fw-bold">${act.title}</h6>
                            <span class="badge bg-teal text-white">+${act.impactScore} نقطة</span>
                        </div>
                        <p class="card-text text-muted small mb-1">
                            <i class="fa-solid fa-folder me-1 text-teal"></i> ${act.category} | 
                            <i class="fa-solid fa-location-dot me-1 text-teal"></i> ${act.location}
                        </p>
                        <small class="text-secondary">
                            <i class="fa-solid fa-clock me-1"></i> ${act.hours} ساعات | 
                            <i class="fa-solid fa-users me-1"></i> ${act.participants} مشارك
                        </small>
                    </div>
                </div>
            `).join('');
        }
    }

    // Render Badges
    const badgesContainer = document.getElementById('badges-list');
    if (badgesContainer) {
        badgesContainer.innerHTML = ATHAR_STATE.badgeDefinitions.map(badge => {
            const earned = user.earnedBadges.includes(badge.id);
            return `
                <div class="col-6 col-md-3">
                    <div class="card text-center p-3 border-0 shadow-sm ${earned ? 'bg-light-success' : 'opacity-50'}">
                        <div class="fs-2 text-teal mb-2"><i class="fa-solid ${badge.icon}"></i></div>
                        <h6 class="fw-bold mb-1 small">${badge.title}</h6>
                        <p class="text-muted mb-2" style="font-size: 0.75rem;">${badge.desc}</p>
                        <div>
                            ${earned ? '<span class="badge bg-success small">مكتسب</span>' : '<span class="badge bg-secondary small">مغلق</span>'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Registration Form
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const pin = document.getElementById('reg-pin').value;
            const role = document.getElementById('reg-role').value;
            const bio = document.getElementById('reg-bio').value;
            handleRegister(name, email, pin, role, bio);
        });
    }

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pin = document.getElementById('login-pin').value;
            handleLogin(email, pin);
        });
    }

    // Add Activity Form
    const actForm = document.getElementById('add-activity-form');
    if (actForm) {
        actForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('act-title').value;
            const category = document.getElementById('act-category').value;
            const hours = document.getElementById('act-hours').value;
            const participants = document.getElementById('act-participants').value;
            const location = document.getElementById('act-location').value;
            addActivity(title, category, hours, participants, location);
            actForm.reset();
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Android Back Button Navigation
function setupAndroidBackButton() {
    document.addEventListener('deviceready', () => {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('backButton', () => {
                // 1. Close open modal if exists
                const openModal = document.querySelector('.modal.show, .modal[style*="display: block"]');
                if (openModal) {
                    if (window.bootstrap && bootstrap.Modal) {
                        const modalInstance = bootstrap.Modal.getInstance(openModal);
                        if (modalInstance) modalInstance.hide();
                    } else {
                        openModal.style.display = 'none';
                    }
                    return;
                }

                // 2. Navigate back to dashboard if in sub-section
                const currentSection = document.querySelector('.page-section.active');
                if (currentSection && currentSection.id !== 'dashboard-section' && currentSection.id !== 'login-section') {
                    showSection('dashboard-section');
                    return;
                }

                // 3. Exit application if on main screen
                window.Capacitor.Plugins.App.exitApp();
            });
        }
    });
}
