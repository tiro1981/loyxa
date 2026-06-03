// ===== BiznesOnline — obuna.js =====
// Obunani sotib olish: 4 qadam, subdomen tanlash, ilova admin paneliga yo'naltirish
'use strict';

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('subscribeForm');
    if (!form) return;

    let currentStep = 1;
    const totalSteps = 2;

    const formData = {
        businessName: '',
        businessType: '',
        city: '',
        address: '',
        phone: '',
        email: '',
        appSlug: '',
        appId: '',
        appName: '',
        appPrice: null,
        appAdminUrl: '',
        subdomain: ''
    };

    /* ---------- ILOVALARNI BO_APPS DAN YUKLASH ---------- */
    function getApps() {
        try { return JSON.parse(localStorage.getItem('bo_apps') || '[]').filter(a => a.active !== false); }
        catch { return []; }
    }

    /* ---------- ILOVANI URL DAN AVTOMATIK TANLASH ---------- */
    // Plan tanlash UI olib tashlandi — ilova dashbordan tanlangan va URL ?app=... bilan keladi.
    (function pickAppFromUrl() {
        const apps = getApps();
        const urlParams = new URLSearchParams(window.location.search);
        const appParam = urlParams.get('app');
        const app = (appParam && apps.find(a => a.slug === appParam)) || apps[0];
        if (app) {
            formData.appSlug = app.slug;
            formData.appId = app.id;
            formData.appName = app.name;
            formData.appPrice = app.price || null;
            formData.appAdminUrl = app.adminUrl || '';
        }
    })();

    /* ---------- LOGIN BO'LGAN MIJOZ MA'LUMOTLARINI OLISH ---------- */
    // Biznes ma'lumotlari qadami olib tashlandi — bularni session/subscription'dan to'g'ridan-to'g'ri olamiz.
    (function loadFromSession() {
        try {
            const session = JSON.parse(localStorage.getItem('bo_session') || 'null');
            if (!session || session.type !== 'client') {
                // Login bo'lmagan foydalanuvchi — ro'yxatga qaytamiz
                window.location.replace('kirish.html?tab=register');
                return;
            }
            const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
            const me = subs.find(s => s.id === (session.clientId || session.id));
            if (me) {
                formData.businessName  = me.businessName  || '';
                formData.businessType  = me.businessType  || '';
                formData.city          = me.city          || '';
                formData.address       = me.address       || '';
                formData.phone         = me.phone         || '';
                formData.email         = me.email         || '';
            }
        } catch (err) { console.error(err); }
    })();

    /* ---------- URL PARAMS — URL dan narx olish ---------- */
    const urlParams = new URLSearchParams(window.location.search);
    const priceParam = urlParams.get('price');
    if (priceParam) {
        const apps = getApps();
        const appParam = urlParams.get('app');
        const foundApp = apps.find(a => a.slug === appParam);
        if (foundApp) {
            formData.appSlug = foundApp.slug;
            formData.appId = foundApp.id;
            formData.appName = foundApp.name;
            formData.appPrice = foundApp.price || parseInt(priceParam, 10) || null;
            formData.appAdminUrl = foundApp.adminUrl || '';
        }
    }

    /* ---------- DOM REFERENCES ---------- */
    const steps = form.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressLines = document.querySelectorAll('.progress-line');
    const nextBtns = form.querySelectorAll('.btn-next');
    const prevBtns = form.querySelectorAll('.btn-prev');

    /* ---------- STEP NAVIGATION ---------- */
    const showStep = (n) => {
        steps.forEach(s => s.classList.remove('active'));
        const target = form.querySelector(`.form-step[data-step="${n}"]`);
        if (target) target.classList.add('active');

        progressSteps.forEach((p) => {
            const stepNum = parseInt(p.dataset.step, 10);
            p.classList.remove('active', 'completed');
            if (stepNum < n) p.classList.add('completed');
            else if (stepNum === n) p.classList.add('active');
        });

        progressLines.forEach((line, idx) => {
            if (idx < n - 1) line.classList.add('filled');
            else line.classList.remove('filled');
        });

        currentStep = n;

        if (n === 1) renderSubdomainSuggestions();
        if (n === 2) renderSummary();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                saveStepData(currentStep);
                if (currentStep < totalSteps) showStep(currentStep + 1);
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) showStep(currentStep - 1);
        });
    });

    /* ---------- VALIDATION ---------- */
    const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    const isValidPhone = (str) => {
        const cleaned = str.replace(/[\s\-\(\)]/g, '');
        return /^(\+998)?[0-9]{9}$/.test(cleaned);
    };

    const showFieldError = (input, msg) => {
        const group = input.closest('.form-group');
        if (!group) return;
        group.classList.add('has-error');
        input.classList.add('error');
        if (msg) {
            const span = group.querySelector('.error-msg span');
            if (span) span.textContent = msg;
        }
    };

    const clearFieldError = (input) => {
        const group = input.closest('.form-group');
        if (!group) return;
        group.classList.remove('has-error');
        input.classList.remove('error');
    };

    const validateStep = (step) => {
        if (step === 1) {
            if (!formData.subdomain || formData.subdomain.length < 3) {
                const errEl = document.getElementById('subdomainError');
                if (errEl) errEl.style.display = 'flex';
                window.showToast && window.showToast("Iltimos, subdomen tanlang yoki kiriting", 'error');
                return false;
            }
            return true;
        }

        if (step === 2) {
            const terms = document.getElementById('termsCheck');
            if (!terms.checked) {
                window.showToast && window.showToast("Iltimos, foydalanish shartlariga rozilik bering", 'error');
                return false;
            }
            return true;
        }

        return true;
    };

    /* ---------- SAVE DATA ---------- */
    const saveStepData = (step) => {
        // Biznes ma'lumotlari qadami yo'q — ma'lumotlar formData ga session/subscription'dan yuklangan
    };

    /* ---------- REAL-TIME VALIDATION ---------- */
    form.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('input', () => clearFieldError(field));
        field.addEventListener('change', () => clearFieldError(field));
        field.addEventListener('blur', () => {
            const value = field.value.trim();
            if (!field.required || !value) return;
            if (field.name === 'email' && !isValidEmail(value)) showFieldError(field, "To'g'ri email kiriting");
            if (field.name === 'phone' && !isValidPhone(value)) showFieldError(field, "To'g'ri telefon kiriting (+998...)");
        });
    });

    /* ---------- PHONE INPUT MASK ---------- */
    const phoneInput = form.querySelector('[name="phone"]');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.startsWith('998')) v = v.substring(3);
            v = v.substring(0, 9);
            let formatted = '+998 ';
            if (v.length > 0) formatted += v.substring(0, 2);
            if (v.length > 2) formatted += ' ' + v.substring(2, 5);
            if (v.length > 5) formatted += ' ' + v.substring(5, 7);
            if (v.length > 7) formatted += ' ' + v.substring(7, 9);
            e.target.value = formatted;
        });
    }

    /* ---------- SUBDOMEN GENERATION ---------- */
    function makeSlug(str) {
        return (str || '').toLowerCase()
            .replace(/[^a-z0-9\s\-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .substring(0, 30) || 'biznes';
    }

    function generateSubdomainVariants(name, city) {
        const base = makeSlug(name);
        const cityCode = (city || '').toLowerCase().substring(0, 3).replace(/[^a-z]/g, '') || 'uz';
        const variants = [
            base,
            base + '-' + cityCode,
            base + '-uz'
        ];
        return [...new Set(variants)].slice(0, 3);
    }

    function renderSubdomainSuggestions() {
        const container = document.getElementById('subdomainSuggestions');
        if (!container) return;

        const variants = generateSubdomainVariants(formData.businessName, formData.city);

        container.innerHTML = variants.map(v => `
            <div class="subdomain-chip ${formData.subdomain === v ? 'selected' : ''}" data-sub="${escapeHtml(v)}">
                <div class="subdomain-chip-inner">
                    <i class="fa-solid fa-globe"></i>
                    <div>
                        <strong>${escapeHtml(v)}</strong>
                        <span>.biznesonline.uz</span>
                    </div>
                </div>
                <div class="subdomain-chip-check"><i class="fa-solid fa-check"></i></div>
            </div>
        `).join('');

        container.querySelectorAll('.subdomain-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                selectSubdomain(chip.dataset.sub);
                container.querySelectorAll('.subdomain-chip').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                document.getElementById('customSubdomainInput').value = '';
            });
        });

        if (!formData.subdomain && variants.length > 0) {
            selectSubdomain(variants[0]);
            container.querySelector('.subdomain-chip')?.classList.add('selected');
        } else if (formData.subdomain) {
            updateSelectedInfo(formData.subdomain);
        }
    }

    function selectSubdomain(val) {
        formData.subdomain = val;
        updateSelectedInfo(val);
        const errEl = document.getElementById('subdomainError');
        if (errEl) errEl.style.display = 'none';
    }

    function updateSelectedInfo(val) {
        const infoEl = document.getElementById('selectedSubdomainInfo');
        const displayEl = document.getElementById('selectedSubdomainDisplay');
        if (infoEl && displayEl && val) {
            infoEl.style.display = 'flex';
            displayEl.textContent = val;
        }
    }

    /* ---------- CUSTOM SUBDOMAIN INPUT ---------- */
    const customInput = document.getElementById('customSubdomainInput');
    if (customInput) {
        customInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '');
        });
    }

    const applyCustomBtn = document.getElementById('applyCustomSubdomain');
    if (applyCustomBtn) {
        applyCustomBtn.addEventListener('click', () => {
            const val = (customInput?.value || '').trim();
            const errEl = document.getElementById('subdomainError');
            const errMsg = document.getElementById('subdomainErrorMsg');
            if (!val || val.length < 3) {
                if (errEl) errEl.style.display = 'flex';
                if (errMsg) errMsg.textContent = 'Kamida 3 ta belgi kiriting';
                return;
            }
            if (val.length > 40) {
                if (errEl) errEl.style.display = 'flex';
                if (errMsg) errMsg.textContent = 'Ko\'pi bilan 40 ta belgi bo\'lishi mumkin';
                return;
            }
            if (errEl) errEl.style.display = 'none';
            document.querySelectorAll('.subdomain-chip').forEach(c => c.classList.remove('selected'));
            selectSubdomain(val);
            window.showToast && window.showToast(`"${val}.biznesonline.uz" tanlandi`, 'success');
        });
    }

    /* ---------- SUMMARY RENDER ---------- */
    const renderSummary = () => {
        const summary = document.getElementById('summaryList');
        if (!summary) return;

        const priceRow = formData.appPrice
            ? `<div class="summary-row total">
                    <div class="summary-label">Oylik narx</div>
                    <div class="summary-value" style="color:var(--primary);">
                        <strong>${fmtPrice(formData.appPrice)} so'm</strong>
                        <span style="font-size:12px;color:var(--gray-500);"> / ${escapeHtml('oyiga')}</span>
                    </div>
               </div>`
            : `<div class="summary-row total">
                    <div class="summary-label">Narx</div>
                    <div class="summary-value" style="color:#F59E0B;">
                        <i class="fa-solid fa-handshake"></i> Kelishiladi
                    </div>
               </div>`;

        summary.innerHTML = `
            <div class="summary-row">
                <div class="summary-label">Biznes nomi</div>
                <div class="summary-value">${escapeHtml(formData.businessName)}</div>
            </div>
            <div class="summary-row">
                <div class="summary-label">Manzil</div>
                <div class="summary-value">${escapeHtml(formData.city)}, ${escapeHtml(formData.address)}</div>
            </div>
            <div class="summary-row">
                <div class="summary-label">Telefon</div>
                <div class="summary-value">${escapeHtml(formData.phone)}</div>
            </div>
            <div class="summary-row">
                <div class="summary-label">Email</div>
                <div class="summary-value">${escapeHtml(formData.email)}</div>
            </div>
            <div class="summary-row">
                <div class="summary-label">Ilova</div>
                <div class="summary-value"><strong>${escapeHtml(formData.appName)}</strong></div>
            </div>
            <div class="summary-row">
                <div class="summary-label">Subdomen</div>
                <div class="summary-value">
                    <i class="fa-solid fa-globe" style="color:var(--primary);margin-right:4px;"></i>
                    <strong>${escapeHtml(formData.subdomain)}.biznesonline.uz</strong>
                </div>
            </div>
            ${priceRow}
        `;
    };

    /* ---------- FORM SUBMIT — DARHOL FAOLLASHTIRISH ---------- */
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateStep(2)) return;

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Amalga oshirilmoqda...';

        setTimeout(() => {
            try {
                const subs = JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
                const now = new Date().toISOString();

                // Hozir login bo'lgan mijoz bormi? — bo'lsa, uning yozuvini yangilaymiz
                let session = null;
                try { session = JSON.parse(localStorage.getItem('bo_session') || 'null'); } catch {}
                const existingId = session && session.type === 'client' ? (session.clientId || session.id) : null;
                const existingIdx = existingId ? subs.findIndex(s => s.id === existingId) : -1;

                let clientId;
                if (existingIdx >= 0) {
                    // YANGILASH — mavjud mijozga ilovani biriktiramiz
                    clientId = subs[existingIdx].id;
                    subs[existingIdx] = {
                        ...subs[existingIdx],
                        businessName: formData.businessName || subs[existingIdx].businessName,
                        businessType: formData.businessType,
                        app: formData.appSlug,
                        appName: formData.appName,
                        phone: formData.phone || subs[existingIdx].phone,
                        city: formData.city,
                        address: formData.address,
                        price: formData.appPrice,
                        status: 'active',
                        subdomain: formData.subdomain,
                        activatedAt: now
                    };
                } else {
                    // YANGI MIJOZ — bir bosqichda ham ro'yxat ham obuna
                    clientId = 'CL-' + (1000 + subs.length + 1);
                    subs.push({
                        id: clientId,
                        businessName: formData.businessName,
                        businessType: formData.businessType,
                        app: formData.appSlug,
                        appName: formData.appName,
                        email: formData.email,
                        phone: formData.phone,
                        city: formData.city,
                        address: formData.address,
                        password: 'demo123',
                        price: formData.appPrice,
                        status: 'active',
                        subdomain: formData.subdomain,
                        createdAt: now,
                        activatedAt: now
                    });
                }

                localStorage.setItem('bo_subscriptions', JSON.stringify(subs));

                // Mijoz sessiyasini yaratish/yangilash
                localStorage.setItem('bo_session', JSON.stringify({
                    type: 'client',
                    clientId: clientId,
                    id: clientId,
                    businessName: formData.businessName,
                    app: formData.appSlug,
                    email: formData.email,
                    loggedAt: now
                }));

                // Success ko'rsatish
                steps.forEach(s => s.classList.remove('active'));
                const successStep = form.querySelector('.form-step[data-step="3"]');
                if (successStep) successStep.classList.add('active');

                progressSteps.forEach(p => p.classList.add('completed'));
                progressLines.forEach(l => l.classList.add('filled'));

                // Success info box
                const infoBox = document.getElementById('successInfoBox');
                if (infoBox) {
                    infoBox.innerHTML = `
                        <div class="success-detail-row">
                            <i class="fa-solid fa-globe"></i>
                            <div>
                                <span>Manzil</span>
                                <strong>${escapeHtml(formData.subdomain)}.biznesonline.uz</strong>
                            </div>
                        </div>
                        <div class="success-detail-row">
                            <i class="fa-solid fa-mobile-screen"></i>
                            <div>
                                <span>Ilova</span>
                                <strong>${escapeHtml(formData.appName)}</strong>
                            </div>
                        </div>
                        ${formData.appPrice ? `
                        <div class="success-detail-row">
                            <i class="fa-solid fa-tag"></i>
                            <div>
                                <span>Oylik to'lov</span>
                                <strong style="color:var(--primary)">${fmtPrice(formData.appPrice)} so'm</strong>
                            </div>
                        </div>` : ''}
                    `;
                }

                window.showToast && window.showToast("Obuna faollashtirildi! Dashbordga o'tilmoqda...", 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1200);
            } catch (err) {
                console.error(err);
                window.showToast && window.showToast("Xatolik yuz berdi. Qayta urinib ko'ring.", 'error');
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Obunani sotib olish';
        }, 1000);
    });

    /* ---------- HELPERS ---------- */
    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }

    function fmtPrice(n) {
        return (n || 0).toLocaleString('uz-UZ').replace(/,/g, ' ');
    }

});
