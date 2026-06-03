// ===== BiznesOnline — auth.js =====
// Kirish sahifasi: client va admin alohida login
'use strict';

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- ROLE TABS ---------- */
    const tabs = document.querySelectorAll('.role-tab');
    const forms = document.querySelectorAll('.auth-form');

    function switchRole(role) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.role === role));
        forms.forEach(f => f.classList.toggle('active', f.dataset.role === role));
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchRole(tab.dataset.role));
    });

    // Form ichidagi "Kirish" / "Ro'yxatdan o'ting" linklari
    document.querySelectorAll('[data-switch-role]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchRole(link.dataset.switchRole);
        });
    });

    // URL ?tab=register / ?tab=admin orqali boshlang'ich tab
    const urlTab = new URLSearchParams(window.location.search).get('tab');
    if (urlTab && document.querySelector(`.role-tab[data-role="${urlTab}"]`)) {
        switchRole(urlTab);
    }

    /* ---------- PASSWORD TOGGLE ---------- */
    document.querySelectorAll('.eye-btn[data-toggle]').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
            }
        });
    });

    /* ---------- DEMO ACCOUNTS SEED ---------- */
    // Demo mijoz akkaunti — agar yo'q bo'lsa yaratish
    try {
        const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
        if (!subs.find(s => s.email === 'mijoz@demo.uz')) {
            subs.push({
                id: 'CL-001',
                businessName: 'Demo Burger',
                businessType: 'fastfood',
                app: 'fastfood',
                email: 'mijoz@demo.uz',
                phone: '+998 90 123 45 67',
                city: 'Toshkent',
                address: 'Chilonzor tumani',
                password: 'demo123',
                price: 99000,
                status: 'active',
                subdomain: 'demo-burger',
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('bo_subscriptions', JSON.stringify(subs));
        }
        if (!localStorage.getItem('bo_admin')) {
            localStorage.setItem('bo_admin', JSON.stringify({
                username: 'admin',
                password: 'admin123',
                name: 'Bosh administrator'
            }));
        }
    } catch (e) { /* ignore */ }

    /* ---------- CLIENT LOGIN ---------- */
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const login = clientForm.login.value.trim();
            const password = clientForm.password.value;

            try {
                const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
                const user = subs.find(s =>
                    (s.email === login || s.phone === login) && s.password === password
                );

                if (!user) {
                    window.showToast && window.showToast("Login yoki parol noto'g'ri", 'error');
                    return;
                }
                // 'registered' va 'active' kirishga ruxsat — 'registered' obuna sotib olmagan mijoz
                if (user.status !== 'active' && user.status !== 'registered') {
                    window.showToast && window.showToast(
                        user.status === 'pending'
                            ? "Obunangiz hali tasdiqlanmagan"
                            : "Hisobingiz faol emas",
                        'error'
                    );
                    return;
                }
                localStorage.setItem('bo_session', JSON.stringify({
                    type: 'client',
                    clientId: user.id,
                    id: user.id,
                    email: user.email,
                    businessName: user.businessName,
                    app: user.app,
                    loggedAt: Date.now()
                }));
                window.showToast && window.showToast('Xush kelibsiz, ' + user.businessName + '!', 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
            } catch (err) {
                console.error(err);
                window.showToast && window.showToast('Xato yuz berdi', 'error');
            }
        });
    }

    /* ---------- REGISTER (yangi mijoz) ---------- */
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Phone mask
        const phoneInput = registerForm.querySelector('[name="phone"]');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.startsWith('998')) v = v.substring(3);
                v = v.substring(0, 9);
                let f = '+998 ';
                if (v.length > 0) f += v.substring(0, 2);
                if (v.length > 2) f += ' ' + v.substring(2, 5);
                if (v.length > 5) f += ' ' + v.substring(5, 7);
                if (v.length > 7) f += ' ' + v.substring(7, 9);
                e.target.value = f;
            });
        }

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const businessName = registerForm.businessName.value.trim();
            const email = registerForm.email.value.trim();
            const phone = registerForm.phone.value.trim();
            const password = registerForm.password.value;
            const termsOk = document.getElementById('termsRegister')?.checked;

            if (!businessName || businessName.length < 2) {
                window.showToast && window.showToast("Biznes nomini kiriting", 'error');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                window.showToast && window.showToast("To'g'ri email kiriting", 'error');
                return;
            }
            if (password.length < 6) {
                window.showToast && window.showToast("Parol kamida 6 ta belgidan iborat bo'lishi kerak", 'error');
                return;
            }
            if (!termsOk) {
                window.showToast && window.showToast("Foydalanish shartlariga rozilik bering", 'error');
                return;
            }

            try {
                const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');

                // Email band emasligini tekshirish
                if (subs.find(s => s.email === email)) {
                    window.showToast && window.showToast("Bu email ro'yxatdan o'tgan. Kirishni urinib ko'ring.", 'error');
                    return;
                }

                const clientId = 'CL-' + (1000 + subs.length + 1);
                const now = new Date().toISOString();

                const newClient = {
                    id: clientId,
                    businessName,
                    email,
                    phone,
                    password,
                    // App hali tanlanmagan — bo'sh
                    app: null,
                    appName: null,
                    appId: null,
                    price: null,
                    subdomain: null,
                    // Status: 'registered' — ro'yxatdan o'tgan, lekin obuna yo'q
                    status: 'registered',
                    createdAt: now
                };

                subs.push(newClient);
                localStorage.setItem('bo_subscriptions', JSON.stringify(subs));

                localStorage.setItem('bo_session', JSON.stringify({
                    type: 'client',
                    clientId: clientId,
                    id: clientId,
                    email,
                    businessName,
                    loggedAt: Date.now()
                }));

                window.showToast && window.showToast("Ro'yxatdan o'tdingiz! Xush kelibsiz.", 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
            } catch (err) {
                console.error(err);
                window.showToast && window.showToast("Xatolik yuz berdi", 'error');
            }
        });
    }

    /* ---------- ADMIN LOGIN ---------- */
    const adminForm = document.getElementById('adminForm');
    if (adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = adminForm.user.value.trim();
            const password = adminForm.password.value;

            try {
                const admin = JSON.parse(localStorage.getItem('bo_admin') || '{}');
                if (user === admin.username && password === admin.password) {
                    localStorage.setItem('bo_session', JSON.stringify({
                        type: 'admin',
                        username: admin.username,
                        name: admin.name,
                        loggedAt: Date.now()
                    }));
                    window.showToast && window.showToast('Admin paneliga kirildi', 'success');
                    setTimeout(() => { window.location.href = 'admin.html'; }, 700);
                } else {
                    window.showToast && window.showToast("Login yoki parol noto'g'ri", 'error');
                }
            } catch (err) {
                console.error(err);
                window.showToast && window.showToast('Xato yuz berdi', 'error');
            }
        });
    }
});
