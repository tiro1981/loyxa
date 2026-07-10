// ===== BiznesOnline — auth.js =====
// Kirish sahifasi: client va admin alohida login
'use strict';

// Telefon raqamni faqat raqamlarga keltirish (taqqoslash uchun)
const digits = (s) => String(s || '').replace(/\D/g, '');

// +998 XX XXX XX XX formatiga avtomatik moslash (9 xonali raqam: 2+3+2+2).
// `skipIfLetters` — true bo'lsa, foydalanuvchi harf kiritsa (masalan username) mask qo'llanmaydi.
function formatUzPhone(raw) {
    let v = digits(raw);
    if (v.startsWith('998')) v = v.substring(3);
    v = v.substring(0, 9);
    let f = '+998 ';
    if (v.length > 0) f += v.substring(0, 2);
    if (v.length > 2) f += ' ' + v.substring(2, 5);
    if (v.length > 5) f += ' ' + v.substring(5, 7);
    if (v.length > 7) f += ' ' + v.substring(7, 9);
    return f;
}
function attachPhoneMask(input, { skipIfLetters = false } = {}) {
    if (!input) return;
    input.addEventListener('input', (e) => {
        if (skipIfLetters && /[a-zA-Z_]/.test(e.target.value)) return;   // username kiritilmoqda — mask qo'llanmaydi
        e.target.value = formatUzPhone(e.target.value);
    });
}

// ===== Telegram OTP tasdiqlash sozlamalari (ro'yxatdan o'tishda telefon tasdiqlash) =====
// ↓↓↓ BU IKKI QIYMATNI O'ZINGIZNIKI BILAN ALMASHTIRING (aks holda tasdiqlash ishlamaydi) ↓↓↓
const BOT_USERNAME = "onlinebiznes_smsbot";   // platforma boti @username (@ siz), masalan: onlinebiznes_bot
const BOT_SERVER   = "https://tiro22.alwaysdata.net";     // SMS bot (sms-habar) ishlab turgan HTTPS manzil — alohida akkaunt/subdomen (tiro21 endi asosiy buyurtma-bot tomonidan band)
// ↑↑↑ ───────────────────────────────────────────────────────────────────────────── ↑↑↑
const digitsOnly = (s) => String(s || '').replace(/\D/g, '');

/* Ilovani bepul biriktirish (URL ?app=slug bo'lsa) */
function assignAppByParam(clientId) {
    try {
        const slug = new URLSearchParams(window.location.search).get('app');
        if (!slug) return false;
        const apps = JSON.parse(localStorage.getItem('bo_apps') || '[]');
        const app = apps.find(a => a.slug === slug || a.id === slug);
        if (!app) return false;
        const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
        const me = subs.find(s => s.id === clientId);
        if (!me) return false;
        me.app = app.slug || app.id;
        me.appId = app.id;
        me.appName = app.name;
        me.appUrl = app.demoUrl || null;
        me.adminUrl = app.adminUrl || null;
        me.slug = app.slug || null;
        me.logoEmoji = app.logoEmoji || null;
        me.price = 0;
        me.status = 'active';
        me.activatedAt = new Date().toISOString();
        if (!me.subdomain) {
            me.subdomain = (me.businessName || 'biznes').toLowerCase()
                .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'biznes';
        }
        localStorage.setItem('bo_subscriptions', JSON.stringify(subs));
        return true;
    } catch (e) { console.error('assignAppByParam', e); return false; }
}

/* Telegram OTP tasdiqlangach chaqiriladi — akkaunt SHU YERDA yaratiladi (avval emas).
   Ilgari registerForm submit ichida bo'lgan "akkaunt yaratish" kodi shu yerga ko'chirildi. */
function finishRegistration(username, phone, password) {
    try {
        const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
        // MUHIM: bu ID Supabase'da har bir do'konning ma'lumotini ("app_state" jadvali)
        // ajratib turadi. Ilgari "1000 + subs.length + 1" edi — bu deyarli har bir
        // qurilmada BIR XIL ID (masalan CL-1002) hosil qilardi, chunki har bir yangi
        // brauzerda avval demo hisob (CL-001) urug'lanadi va birinchi haqiqiy
        // ro'yxatdan o'tishda subs.length har doim 1 bo'lardi. Natijada turli
        // qurilmalardagi mutlaqo bog'liq bo'lmagan foydalanuvchilar bir xil ID olib,
        // bir-birining do'koni/admin paneliga (Supabase orqali) kirib qolishardi.
        // Endi vaqt tamg'asi + tasodifiy qism bilan har doim noyob ID hosil qilinadi.
        let clientId = 'CL-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
        while (subs.some((s) => s.id === clientId)) {
            clientId = 'CL-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
        }
        const now = new Date().toISOString();

        const newClient = {
            id: clientId,
            username,
            businessName: username,   // ko'rsatish uchun (dashboard/admin) — username bilan bir xil
            phone,
            password,
            // App hali tanlanmagan — bo'sh
            app: null,
            appName: null,
            appId: null,
            price: null,
            subdomain: null,
            // Status: 'registered' — ro'yxatdan o'tgan, lekin ilova tanlanmagan
            status: 'registered',
            createdAt: now
        };

        subs.push(newClient);
        localStorage.setItem('bo_subscriptions', JSON.stringify(subs));

        localStorage.setItem('bo_session', JSON.stringify({
            type: 'client',
            clientId: clientId,
            id: clientId,
            username,
            businessName: username,
            loggedAt: Date.now()
        }));

        // Agar ?app= bilan kelgan bo'lsa — dashboard'da subdomen so'rab obuna qilamiz
        const appParam = new URLSearchParams(window.location.search).get('app');
        window.showToast && window.showToast("Ro'yxatdan o'tdingiz! Xush kelibsiz.", 'success');
        setTimeout(() => {
            window.location.href = appParam ? ('dashboard.html?subscribe=' + encodeURIComponent(appParam)) : 'dashboard.html';
        }, 800);
    } catch (err) {
        console.error(err);
        window.showToast && window.showToast("Xatolik yuz berdi", 'error');
    }
}

/* ===== Sanoq taymeri (kod amal qilish muddati) =====
   Taymer server bilan sinxron: /verify/status?phone=... har 3 soniyada so'raladi,
   oradagi soniyalar mahalliy (1s) sanoq bilan to'ldiriladi. Botda "Yangi kod olish"
   bosilsa, server remaining qiymati o'sadi va taymer avtomatik qayta boshlanadi. */
const VERIFY_TTL = 120;      // kod amal qilish muddati (soniya) — server CODE_TTL bilan bir xil
let _verifyTickInt = null;   // mahalliy 1s sanoq
let _verifyPollInt = null;   // serverga so'rov (3s)
let _verifyRemaining = 0;    // qolgan soniya
let _verifyTimerTargetId = 'verifyTimer';   // qaysi taymer div'ga chizish (registratsiya yoki parolni tiklash)

function stopVerifyTimers() {
    if (_verifyTickInt) { clearInterval(_verifyTickInt); _verifyTickInt = null; }
    if (_verifyPollInt) { clearInterval(_verifyPollInt); _verifyPollInt = null; }
}

function renderVerifyTimer() {
    const el = document.getElementById(_verifyTimerTargetId);
    if (!el) return;
    const base = 'display:block;margin-top:12px;text-align:center;font-weight:600;'
        + 'font-size:15px;padding:10px 12px;border-radius:10px;';
    if (_verifyRemaining > 0) {
        // Sanoq davom etmoqda — yashil
        const m = Math.floor(_verifyRemaining / 60);
        const s = _verifyRemaining % 60;
        el.style.cssText = base + 'color:#15803d;background:#dcfce7;';
        el.innerHTML = '⏳ Kod amal qiladi: ' + m + ':' + String(s).padStart(2, '0');
    } else {
        // Sanoq tugadi — qizil ogohlantirish
        el.style.cssText = base + 'color:#b91c1c;background:#fee2e2;';
        el.innerHTML = "⏱ Kod muddati tugadi. Botda «🔄 Yangi kod olish» tugmasini bosing.";
    }
}

async function pollVerifyStatus(phone) {
    try {
        const r = await fetch(BOT_SERVER.replace(/\/+$/, '') + '/verify/status?phone=' + encodeURIComponent(phone));
        const d = await r.json().catch(() => ({}));
        if (!d || !d.ok) return;
        // Botda kod yaratilgan/yangilangan bo'lsa — mahalliy sanoqni server bilan sinxronlaymiz
        // (farq 2s dan katta bo'lsa). "Yangi kod olish"dan keyin sanoq shu yerda qayta to'ladi.
        // Kod hali yo'q bo'lsa — mahalliy teskari sanoq davom etaveradi (0 da "muddati tugadi").
        if (d.exists && d.remaining > 0 && Math.abs(d.remaining - _verifyRemaining) > 2) {
            _verifyRemaining = d.remaining;
            renderVerifyTimer();
        }
    } catch (e) { /* jim — tarmoq vaqtincha uzilgan bo'lishi mumkin */ }
}

function startVerifyCountdown(phone, targetId) {
    stopVerifyTimers();
    _verifyTimerTargetId = targetId || 'verifyTimer';
    _verifyRemaining = VERIFY_TTL;   // oyna ochilishi bilan darrov 2:00 dan teskari sanoq
    renderVerifyTimer();
    _verifyTickInt = setInterval(() => {
        if (_verifyRemaining > 0) _verifyRemaining--;
        renderVerifyTimer();
    }, 1000);
    pollVerifyStatus(phone);
    _verifyPollInt = setInterval(() => pollVerifyStatus(phone), 3000);
}

/* Tasdiqlash bosqichini yopish/tiklash — login (Kirish) tabiga o'tilganda chaqiriladi,
   shunda "Telefonni tasdiqlang" bloki login sahifasida ko'rinib qolmaydi. */
function resetVerifyStep() {
    stopVerifyTimers();
    _verifyRemaining = 0;
    const box = document.getElementById('verifyStep');
    const formEl = document.getElementById('registerForm');
    const input = document.getElementById('verifyCode');
    const timer = document.getElementById('verifyTimer');
    if (box) box.style.display = 'none';
    if (formEl) formEl.style.display = '';   // openVerifyStep qo'ygan inline display:none ni tozalash
    if (input) input.value = '';
    if (timer) timer.style.display = 'none';
}

/* Tasdiqlash bosqichi: registratsiya formasi o'rniga "Telegram botni ochish" + 4 xonali
   kod kiritish ko'rsatiladi. Kod BOT_SERVER/verify/check orqali tekshiriladi. */
function openVerifyStep(username, phone, password) {
    const box = document.getElementById('verifyStep');
    const link = document.getElementById('verifyBotLink');
    const input = document.getElementById('verifyCode');
    const btn = document.getElementById('verifyConfirm');
    const formEl = document.getElementById('registerForm');
    if (!box || !link || !input || !btn) {
        // Tasdiqlash UI'si bo'lmasa — to'g'ridan-to'g'ri yaratamiz (zaxira yo'l)
        finishRegistration(username, phone, password);
        return;
    }
    if (formEl) formEl.style.display = 'none';
    box.style.display = 'block';
    link.href = 'https://t.me/' + BOT_USERNAME + '?start=verify';
    input.value = '';
    try { input.focus(); } catch (e) {}
    btn.disabled = false;
    startVerifyCountdown(phone);   // sanoq taymerini ishga tushiramiz
    btn.onclick = async () => {
        const code = digitsOnly(input.value);
        if (code.length !== 4) {
            window.showToast && window.showToast("4 xonali kod kiriting", 'error');
            return;
        }
        btn.disabled = true;
        try {
            const r = await fetch(BOT_SERVER.replace(/\/+$/, '') + '/verify/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code }),
            });
            const data = await r.json().catch(() => ({}));
            if (data.ok) {
                stopVerifyTimers();
                finishRegistration(username, phone, password);
            } else {
                window.showToast && window.showToast(data.error || "Kod tasdiqlanmadi", 'error');
                btn.disabled = false;
            }
        } catch (e) {
            window.showToast && window.showToast("Server bilan ulanib bo'lmadi", 'error');
            btn.disabled = false;
        }
    };
}

/* ===== PAROLNI TIKLASH (forgot password) =====
   1) telefon kiritish -> 2) Telegram OTP tasdiqlash (registratsiyadagi bilan bir xil
   mexanizm — BOT_SERVER/verify/check) -> 3) yangi parolni ikki marta kiritib saqlash. */

/* Barcha "parolni tiklash" bosqichlarini yopib, Kirish formasini qaytaradi. */
function resetForgotSteps() {
    stopVerifyTimers();
    _verifyRemaining = 0;
    ['forgotPhoneStep', 'forgotVerifyStep', 'forgotNewPassStep'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const timer = document.getElementById('forgotVerifyTimer');
    if (timer) timer.style.display = 'none';
    const code = document.getElementById('forgotCode');
    if (code) code.value = '';
    const clientFormEl = document.getElementById('clientForm');
    if (clientFormEl) clientFormEl.style.display = '';   // openForgotPhoneStep qo'ygan inline none'ni tozalash
}

function backToLoginFromForgot() {
    resetForgotSteps();
    if (typeof window.switchRole === 'function') window.switchRole('client');
}

/* 1-bosqich: telefon kiritish */
function openForgotPhoneStep() {
    stopVerifyTimers();
    const clientFormEl = document.getElementById('clientForm');
    const step = document.getElementById('forgotPhoneStep');
    const input = document.getElementById('forgotPhone');
    if (!step || !input) return;
    if (clientFormEl) clientFormEl.style.display = 'none';
    input.value = '+998 ';
    step.style.display = 'block';
    try { input.focus(); } catch (e) {}
}

/* 2-bosqich: Telegram OTP tasdiqlash — tasdiqlangach yangi parol bosqichiga o'tadi. */
function openForgotVerifyStep(phone) {
    const phoneStep = document.getElementById('forgotPhoneStep');
    const step = document.getElementById('forgotVerifyStep');
    const link = document.getElementById('forgotBotLink');
    const input = document.getElementById('forgotCode');
    const btn = document.getElementById('forgotConfirmCode');
    if (!step || !link || !input || !btn) return;
    if (phoneStep) phoneStep.style.display = 'none';
    step.style.display = 'block';
    link.href = 'https://t.me/' + BOT_USERNAME + '?start=verify';
    input.value = '';
    try { input.focus(); } catch (e) {}
    btn.disabled = false;
    startVerifyCountdown(phone, 'forgotVerifyTimer');   // sanoq taymerini ishga tushiramiz
    btn.onclick = async () => {
        const code = digitsOnly(input.value);
        if (code.length !== 4) {
            window.showToast && window.showToast("4 xonali kod kiriting", 'error');
            return;
        }
        btn.disabled = true;
        try {
            const r = await fetch(BOT_SERVER.replace(/\/+$/, '') + '/verify/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code }),
            });
            const data = await r.json().catch(() => ({}));
            if (data.ok) {
                stopVerifyTimers();
                openForgotNewPassStep(phone);
            } else {
                window.showToast && window.showToast(data.error || "Kod tasdiqlanmadi", 'error');
                btn.disabled = false;
            }
        } catch (e) {
            window.showToast && window.showToast("Server bilan ulanib bo'lmadi", 'error');
            btn.disabled = false;
        }
    };
}

/* 3-bosqich: yangi parolni ikki marta kiritib saqlash. */
function openForgotNewPassStep(phone) {
    const verifyStepEl = document.getElementById('forgotVerifyStep');
    const step = document.getElementById('forgotNewPassStep');
    const p1 = document.getElementById('forgotNewPass');
    const p2 = document.getElementById('forgotNewPassConfirm');
    const btn = document.getElementById('forgotSavePass');
    if (!step || !p1 || !p2 || !btn) return;
    if (verifyStepEl) verifyStepEl.style.display = 'none';
    p1.value = '';
    p2.value = '';
    step.style.display = 'block';
    try { p1.focus(); } catch (e) {}
    btn.onclick = () => {
        const pass1 = p1.value;
        const pass2 = p2.value;
        if (pass1.length < 6) {
            window.showToast && window.showToast("Parol kamida 6 ta belgidan iborat bo'lsin", 'error');
            return;
        }
        if (pass1 !== pass2) {
            window.showToast && window.showToast("Parollar mos kelmadi", 'error');
            return;
        }
        try {
            const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
            const user = subs.find((s) => digits(s.phone) === digits(phone));
            if (!user) {
                window.showToast && window.showToast("Hisob topilmadi", 'error');
                return;
            }
            user.password = pass1;
            localStorage.setItem('bo_subscriptions', JSON.stringify(subs));
            window.showToast && window.showToast("Parol muvaffaqiyatli yangilandi! Endi kirishingiz mumkin.", 'success');
            backToLoginFromForgot();
        } catch (err) {
            console.error(err);
            window.showToast && window.showToast("Xatolik yuz berdi", 'error');
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- ROLE TABS ---------- */
    const tabs = document.querySelectorAll('.role-tab');
    const forms = document.querySelectorAll('.auth-form');

    function switchRole(role) {
        resetVerifyStep();    // tab almashganda "Telefonni tasdiqlang" blokini yashiramiz
        resetForgotSteps();   // ...va "Parolni tiklash" bosqichlarini ham
        tabs.forEach(t => t.classList.toggle('active', t.dataset.role === role));
        forms.forEach(f => f.classList.toggle('active', f.dataset.role === role));
    }
    window.switchRole = switchRole;   // backToLoginFromForgot() dan chaqirish uchun

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

    /* ---------- LOGIN MAYDONI: +998 avtomatik + telefon mask ----------
       "login" maydoni telefon YOKI username qabul qiladi — shuning uchun
       foydalanuvchi harf kiritsa (username) mask o'chadi, faqat raqam
       kiritilsa +998 XX XXX XX XX formatiga avtomatik moslanadi. */
    const loginInput = document.querySelector('#clientForm [name="login"]');
    if (loginInput) {
        if (!loginInput.value) loginInput.value = '+998 ';
        attachPhoneMask(loginInput, { skipIfLetters: true });
    }

    /* ---------- PAROLNI UNUTDINGIZMI ---------- */
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            openForgotPhoneStep();
        });
    }
    document.querySelectorAll('#forgotBackLink1').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            backToLoginFromForgot();
        });
    });
    const forgotPhoneInput = document.getElementById('forgotPhone');
    attachPhoneMask(forgotPhoneInput);
    const forgotSendBtn = document.getElementById('forgotSendCode');
    if (forgotSendBtn) {
        forgotSendBtn.addEventListener('click', () => {
            const phone = (forgotPhoneInput && forgotPhoneInput.value || '').trim();
            if (digits(phone).length < 9) {
                window.showToast && window.showToast("To'g'ri telefon raqam kiriting", 'error');
                return;
            }
            try {
                const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
                const user = subs.find((s) => digits(s.phone) === digits(phone));
                if (!user) {
                    window.showToast && window.showToast("Bu raqam bilan ro'yxatdan o'tilmagan", 'error');
                    return;
                }
                openForgotVerifyStep(phone);
            } catch (err) {
                console.error(err);
                window.showToast && window.showToast('Xatolik yuz berdi', 'error');
            }
        });
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
                username: 'demo',
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
        // Admin standart hisobi: tiro / tiro2004
        const _adm = JSON.parse(localStorage.getItem('bo_admin') || 'null');
        if (!_adm || (_adm.username === 'admin' && _adm.password === 'admin123')) {
            localStorage.setItem('bo_admin', JSON.stringify({
                username: 'tiro',
                password: 'tiro2004',
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
            const loginDigits = digits(login);

            try {
                // ---- MAXFIY ADMIN KIRISHI ----
                // Oddiy kirish formasiga admin login/parol terilsa — boshqaruv paneli ochiladi.
                // (Alohida ko'rinadigan "Admin" tugmasi yo'q — maxfiy)
                const admin = JSON.parse(localStorage.getItem('bo_admin') || 'null');
                if (admin && admin.username
                    && login.toLowerCase() === String(admin.username).toLowerCase()
                    && password === admin.password) {
                    localStorage.setItem('bo_session', JSON.stringify({
                        type: 'admin',
                        username: admin.username,
                        name: admin.name,
                        loggedAt: Date.now()
                    }));
                    window.showToast && window.showToast('Admin paneliga kirildi', 'success');
                    setTimeout(() => { window.location.href = 'admin.html'; }, 700);
                    return;
                }

                const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
                // Telefon (raqamlar bo'yicha) yoki foydalanuvchi nomi (katta-kichik harf farqsiz)
                const user = subs.find(s => {
                    const byPhone = loginDigits.length >= 7 && digits(s.phone) === loginDigits;
                    const byUsername = s.username && s.username.toLowerCase() === login.toLowerCase();
                    return (byPhone || byUsername) && s.password === password;
                });

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
                    username: user.username,
                    email: user.email,
                    businessName: user.businessName,
                    app: user.app,
                    loggedAt: Date.now()
                }));
                // Agar ?app= bo'lsa — dashboard'da subdomen so'rab obuna qilamiz
                const appParam = new URLSearchParams(window.location.search).get('app');
                window.showToast && window.showToast('Xush kelibsiz, ' + user.businessName + '!', 'success');
                setTimeout(() => {
                    window.location.href = appParam ? ('dashboard.html?subscribe=' + encodeURIComponent(appParam)) : 'dashboard.html';
                }, 800);
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
        attachPhoneMask(phoneInput);

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = registerForm.username.value.trim();
            const phone = registerForm.phone.value.trim();
            const password = registerForm.password.value;
            const passwordConfirm = registerForm.passwordConfirm.value;
            const termsOk = document.getElementById('termsRegister')?.checked;

            if (username.length < 3) {
                window.showToast && window.showToast("Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lsin", 'error');
                return;
            }
            if (/\s/.test(username)) {
                window.showToast && window.showToast("Foydalanuvchi nomida bo'sh joy bo'lmasin", 'error');
                return;
            }
            if (digits(phone).length < 9) {
                window.showToast && window.showToast("To'g'ri telefon raqam kiriting", 'error');
                return;
            }
            if (password.length < 6) {
                window.showToast && window.showToast("Parol kamida 6 ta belgidan iborat bo'lishi kerak", 'error');
                return;
            }
            if (password !== passwordConfirm) {
                window.showToast && window.showToast("Parollar mos kelmadi", 'error');
                return;
            }
            if (!termsOk) {
                window.showToast && window.showToast("Foydalanish shartlariga rozilik bering", 'error');
                return;
            }

            try {
                const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');

                // Foydalanuvchi nomi band emasligini tekshirish (katta-kichik harf farqsiz)
                if (subs.find(s => s.username && s.username.toLowerCase() === username.toLowerCase())) {
                    window.showToast && window.showToast("Bu foydalanuvchi nomi band. Boshqasini tanlang.", 'error');
                    return;
                }
                // Telefon band emasligini tekshirish
                if (subs.find(s => digits(s.phone) === digits(phone))) {
                    window.showToast && window.showToast("Bu telefon raqam ro'yxatdan o'tgan. Kirishni urinib ko'ring.", 'error');
                    return;
                }

                // Akkaunt HALI yaratilmaydi — avval Telegram orqali telefon egaligi tasdiqlansin.
                // Tasdiqlangach openVerifyStep ichidagi finishRegistration() akkauntni yaratadi.
                openVerifyStep(username, phone, password);
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
