// ============ SETTINGS — theme + language ============
// index.html, dashboard.html — barchasida ishlatish uchun umumiy modul.
'use strict';

(function () {
    const STORAGE_THEME = 'bo_theme';
    const STORAGE_LANG = 'bo_lang';

    /* ============ TARJIMALAR ============ */
    const I18N = {
        uz: {
            // Common
            'common.settings':         'Sozlamalar',
            'common.theme':            'Mavzu',
            'common.language':         'Til',
            'common.theme_desc':       'Yorug\' yoki tungi rejimni tanlang',
            'common.lang_desc':        'Interfeys tilini tanlang',
            'common.light':            'Yorug\'',
            'common.light_desc':       'Kunduzgi rejim',
            'common.dark':             'Tungi',
            'common.dark_desc':        'Tungi rejim',
            // Nav (index.html)
            'nav.home':                'Bosh sahifa',
            'nav.apps':                'Ilovalar',
            'nav.how':                 'Qanday ishlaydi',
            'nav.reviews':             'Sharhlar',
            'nav.contact':             'Bog\'lanish',
            'nav.login':               'Kirish',
            'nav.register':            'Ro\'yxatdan o\'tish',
            // Hero
            'hero.badge':              'O\'zbekiston #1 biznes platforma',
            'hero.title_1':            'Biznesingizni',
            'hero.title_online':       'Online',
            'hero.title_2':            'ga oling —',
            'hero.title_sub':          'Bepul',
            'hero.title_3':            'va bir necha daqiqada',
            'hero.subtitle':           'Do\'kon, fast food yoki kafe — barchasi uchun tayyor veb-ilova va boshqaruv dashbordi. Ro\'yxatdan o\'ting va ilovani mutlaqo bepul oling.',
            'hero.btn_subscribe':      'Bepul boshlash',
            'hero.btn_view_apps':      'Ilovalarni ko\'rish',
            'hero.trust_count':        '200+ biznes',
            'hero.trust_text':         'bizga ishonadi',
            // Sections
            'apps.tag':                'ILOVALAR',
            'apps.title':              'Biznesingizga mos ilovani tanlang',
            'apps.subtitle':           'Har bir ilova tayyor — faqat ma\'lumotlaringizni kiriting va ishga tushiring',
            'how.tag':                 'QANDAY ISHLAYDI',
            'how.title':               '3 ta oddiy qadam',
            'how.subtitle':            '5 daqiqada biznesingizni online ga olib chiqing',
            'reviews.tag':             'SHARHLAR',
            'reviews.title':           'Mijozlarimiz nima deyishadi',
            'reviews.subtitle':        '200+ biznes egasi bizni tanladi',
            // CTA / Footer
            'cta.title':               'Bugun boshlang — ertaga mijozlaringiz ko\'paysin',
            'cta.btn_start':           'Bepul boshlash',
            // Dashboard
            'dash.main':               'Asosiy',
            'dash.home':               'Bosh sahifa',
            'dash.apps':               'Ilovalar',
            'dash.my_app':             'Mening ilovam',
            'dash.subscription':       'Obuna',
            'dash.help':               'Yordam',
            'dash.support':            'Qo\'llab-quvvatlash',
            'dash.settings':           'Sozlamalar',
            'dash.client_badge':       'MIJOZ DASHBORDI',
            'dash.quick_actions':      'Tezkor harakatlar',
            'dash.quick_desc':         'Ilovangiz va dashbordingizga tezkor kirish',
            'dash.open_app':           'Ilovani ochish',
            'dash.app_admin':          'Ilova boshqaruvi',
            'dash.renew':              'Obunani yangilash',
            'dash.contact_admin':      'Adminga yozish',
            'dash.no_sub_tag':         'XUSH KELIBSIZ!',
            'dash.no_sub_title':       'Biznesingizni online ga olib chiqing',
            'dash.no_sub_desc':        'Hali ilova tanlamagansiz. Pastdagi ilovalardan birini tanlang va biznesingiz uchun veb-ilova hamda boshqaruv dashbordini bir necha daqiqada bepul ishga tushiring.',
            'dash.no_sub_btn':         'Ilovalarni ko\'rish',
            'dash.mp_title':           'BiznesOnline Ilovalari',
            'dash.mp_subtitle':        'Biznesingizga mos ilovani tanlang — barchasi bepul',
        },
        ru: {
            'common.settings':         'Настройки',
            'common.theme':            'Тема',
            'common.language':         'Язык',
            'common.theme_desc':       'Выберите светлый или тёмный режим',
            'common.lang_desc':        'Выберите язык интерфейса',
            'common.light':            'Светлая',
            'common.light_desc':       'Дневной режим',
            'common.dark':             'Тёмная',
            'common.dark_desc':        'Ночной режим',
            'nav.home':                'Главная',
            'nav.apps':                'Приложения',
            'nav.how':                 'Как это работает',
            'nav.reviews':             'Отзывы',
            'nav.contact':             'Связаться',
            'nav.login':               'Войти',
            'nav.register':            'Регистрация',
            'hero.badge':              'Платформа №1 в Узбекистане',
            'hero.title_1':            'Сделайте бизнес',
            'hero.title_online':       'Онлайн',
            'hero.title_2':            ' —',
            'hero.title_sub':          'Бесплатно',
            'hero.title_3':            'за пару минут',
            'hero.subtitle':           'Магазин, фастфуд или кафе — готовое веб-приложение и панель управления. Зарегистрируйтесь и получите приложение совершенно бесплатно.',
            'hero.btn_subscribe':      'Начать бесплатно',
            'hero.btn_view_apps':      'Смотреть приложения',
            'hero.trust_count':        '200+ бизнесов',
            'hero.trust_text':         'нам доверяют',
            'apps.tag':                'ПРИЛОЖЕНИЯ',
            'apps.title':              'Выберите приложение для вашего бизнеса',
            'apps.subtitle':           'Каждое приложение готово — введите данные и запустите',
            'how.tag':                 'КАК ЭТО РАБОТАЕТ',
            'how.title':               '3 простых шага',
            'how.subtitle':            'Запустите бизнес онлайн за 5 минут',
            'reviews.tag':             'ОТЗЫВЫ',
            'reviews.title':           'Что говорят наши клиенты',
            'reviews.subtitle':        '200+ владельцев бизнеса выбрали нас',
            'cta.title':               'Начните сегодня — увеличьте клиентов завтра',
            'cta.btn_start':           'Начать бесплатно',
            'dash.main':               'Основное',
            'dash.home':               'Главная',
            'dash.apps':               'Приложения',
            'dash.my_app':             'Моё приложение',
            'dash.subscription':       'Подписка',
            'dash.help':               'Помощь',
            'dash.support':            'Поддержка',
            'dash.settings':           'Настройки',
            'dash.client_badge':       'ПАНЕЛЬ КЛИЕНТА',
            'dash.quick_actions':      'Быстрые действия',
            'dash.quick_desc':         'Быстрый доступ к приложению и панели',
            'dash.open_app':           'Открыть приложение',
            'dash.app_admin':          'Управление приложением',
            'dash.renew':              'Продлить подписку',
            'dash.contact_admin':      'Написать админу',
            'dash.no_sub_tag':         'ДОБРО ПОЖАЛОВАТЬ!',
            'dash.no_sub_title':       'Сделайте бизнес онлайн',
            'dash.no_sub_desc':        'Вы ещё не выбрали приложение. Выберите одно из приложений ниже и запустите веб-приложение и панель управления бесплатно за несколько минут.',
            'dash.no_sub_btn':         'Смотреть приложения',
            'dash.mp_title':           'Приложения BiznesOnline',
            'dash.mp_subtitle':        'Выберите подходящее приложение — всё бесплатно',
        },
        en: {
            'common.settings':         'Settings',
            'common.theme':            'Theme',
            'common.language':         'Language',
            'common.theme_desc':       'Choose light or dark mode',
            'common.lang_desc':        'Choose interface language',
            'common.light':            'Light',
            'common.light_desc':       'Day mode',
            'common.dark':             'Dark',
            'common.dark_desc':        'Night mode',
            'nav.home':                'Home',
            'nav.apps':                'Apps',
            'nav.how':                 'How it works',
            'nav.reviews':             'Reviews',
            'nav.contact':             'Contact',
            'nav.login':               'Log in',
            'nav.register':            'Sign up',
            'hero.badge':              'Uzbekistan\'s #1 business platform',
            'hero.title_1':            'Take your business',
            'hero.title_online':       'Online',
            'hero.title_2':            ' —',
            'hero.title_sub':          'Free',
            'hero.title_3':            'in minutes',
            'hero.subtitle':           'Shop, fast food or cafe — a ready web app and dashboard for all. Sign up and get your app completely free.',
            'hero.btn_subscribe':      'Start free',
            'hero.btn_view_apps':      'View apps',
            'hero.trust_count':        '200+ businesses',
            'hero.trust_text':         'trust us',
            'apps.tag':                'APPS',
            'apps.title':              'Pick the app for your business',
            'apps.subtitle':           'Each app is ready — just enter your data and launch',
            'how.tag':                 'HOW IT WORKS',
            'how.title':               '3 simple steps',
            'how.subtitle':            'Take your business online in 5 minutes',
            'reviews.tag':             'REVIEWS',
            'reviews.title':           'What our clients say',
            'reviews.subtitle':        '200+ business owners chose us',
            'cta.title':               'Start today — grow your customers tomorrow',
            'cta.btn_start':           'Start free',
            'dash.main':               'Main',
            'dash.home':               'Home',
            'dash.apps':               'Apps',
            'dash.my_app':             'My app',
            'dash.subscription':       'Subscription',
            'dash.help':               'Help',
            'dash.support':            'Support',
            'dash.settings':           'Settings',
            'dash.client_badge':       'CLIENT DASHBOARD',
            'dash.quick_actions':      'Quick actions',
            'dash.quick_desc':         'Quick access to your app and dashboard',
            'dash.open_app':           'Open app',
            'dash.app_admin':          'App management',
            'dash.renew':              'Renew subscription',
            'dash.contact_admin':      'Message admin',
            'dash.no_sub_tag':         'WELCOME!',
            'dash.no_sub_title':       'Take your business online',
            'dash.no_sub_desc':        'You haven\'t picked an app yet. Choose one of the apps below and launch a web app and dashboard for your business — free, in minutes.',
            'dash.no_sub_btn':         'View apps',
            'dash.mp_title':           'BiznesOnline Apps',
            'dash.mp_subtitle':        'Choose the right app — all free',
        }
    };

    /* ============ PANEL HTML ============ */
    function buildPanel() {
        if (document.getElementById('settingsPanel')) return;
        const overlay = document.createElement('div');
        overlay.className = 'settings-overlay';
        overlay.id = 'settingsOverlay';

        const panel = document.createElement('aside');
        panel.className = 'settings-panel';
        panel.id = 'settingsPanel';
        panel.innerHTML = `
            <div class="settings-head">
                <div>
                    <h3 data-i18n="common.settings">Sozlamalar</h3>
                    <p>Hisob va interfeys sozlamalari</p>
                </div>
                <button class="settings-close" id="settingsClose" aria-label="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="settings-body">

                <!-- TIL -->
                <div class="settings-section" data-accordion>
                    <button type="button" class="settings-label" aria-expanded="false">
                        <i class="fa-solid fa-language"></i>
                        <span data-i18n="common.language">Til</span>
                        <i class="fa-solid fa-chevron-down settings-acc-arrow"></i>
                    </button>
                    <div class="settings-section-body">
                        <div class="settings-section-inner">
                            <div class="lang-list">
                                <button type="button" class="lang-card" data-lang="uz">
                                    <span class="lang-flag">🇺🇿</span>
                                    <div class="lang-info">
                                        <strong>O'zbekcha</strong>
                                        <span>Uzbek</span>
                                    </div>
                                    <span class="lang-tick"><i class="fa-solid fa-check"></i></span>
                                </button>
                                <button type="button" class="lang-card" data-lang="ru">
                                    <span class="lang-flag">🇷🇺</span>
                                    <div class="lang-info">
                                        <strong>Русский</strong>
                                        <span>Russian</span>
                                    </div>
                                    <span class="lang-tick"><i class="fa-solid fa-check"></i></span>
                                </button>
                                <button type="button" class="lang-card" data-lang="en">
                                    <span class="lang-flag">🇬🇧</span>
                                    <div class="lang-info">
                                        <strong>English</strong>
                                        <span>English</span>
                                    </div>
                                    <span class="lang-tick"><i class="fa-solid fa-check"></i></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FOYDALANUVCHI NOMINI O'ZGARTIRISH -->
                <div class="settings-section" id="settingsUsernameSection" data-accordion>
                    <button type="button" class="settings-label" aria-expanded="false">
                        <i class="fa-solid fa-user"></i>
                        <span>Foydalanuvchi nomini o'zgartirish</span>
                        <i class="fa-solid fa-chevron-down settings-acc-arrow"></i>
                    </button>
                    <div class="settings-section-body">
                        <div class="settings-section-inner">
                            <form class="settings-form" id="usernameChangeForm">
                                <div class="settings-input-row">
                                    <label>Joriy foydalanuvchi nomi</label>
                                    <input type="text" id="settingsCurrentUsername" readonly>
                                </div>
                                <div class="settings-input-row">
                                    <label>Yangi foydalanuvchi nomi</label>
                                    <input type="text" id="settingsNewUsername" placeholder="yangi_username" required minlength="3">
                                </div>
                                <div class="settings-input-row">
                                    <label>Joriy parol (tasdiqlash uchun)</label>
                                    <input type="password" id="settingsUsernamePass" placeholder="••••••" required>
                                </div>
                                <button type="submit" class="settings-btn">
                                    <i class="fa-solid fa-floppy-disk"></i> Saqlash
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- PAROL O'ZGARTIRISH -->
                <div class="settings-section" id="settingsPassSection" data-accordion>
                    <button type="button" class="settings-label" aria-expanded="false">
                        <i class="fa-solid fa-lock"></i>
                        <span>Parolni o'zgartirish</span>
                        <i class="fa-solid fa-chevron-down settings-acc-arrow"></i>
                    </button>
                    <div class="settings-section-body">
                        <div class="settings-section-inner">
                            <form class="settings-form" id="passChangeForm">
                                <div class="settings-input-row">
                                    <label>Joriy parol</label>
                                    <input type="password" id="settingsCurrentPass" placeholder="••••••" required>
                                </div>
                                <div class="settings-input-row">
                                    <label>Yangi parol</label>
                                    <input type="password" id="settingsNewPass" placeholder="Kamida 6 ta belgi" required minlength="6">
                                </div>
                                <div class="settings-input-row">
                                    <label>Yangi parolni takrorlang</label>
                                    <input type="password" id="settingsConfirmPass" placeholder="••••••" required minlength="6">
                                </div>
                                <button type="submit" class="settings-btn">
                                    <i class="fa-solid fa-key"></i> Parol saqlash
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(panel);
    }

    /* ============ STATE ============ */
    function getTheme() {
        try { return localStorage.getItem(STORAGE_THEME) || 'light'; } catch { return 'light'; }
    }
    function getLang() {
        try { return localStorage.getItem(STORAGE_LANG) || 'uz'; } catch { return 'uz'; }
    }

    /* ============ APPLY ============ */
    function applyTheme(theme) {
        if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
        try { localStorage.setItem(STORAGE_THEME, theme); } catch {}
        // Theme toggle icons yangilash (agar mavjud bo'lsa)
        if (typeof updateThemeToggleIcons === 'function') updateThemeToggleIcons();
    }

    function applyLang(lang) {
        if (!I18N[lang]) lang = 'uz';
        const dict = I18N[lang];
        document.documentElement.setAttribute('lang', lang);
        try { localStorage.setItem(STORAGE_LANG, lang); } catch {}

        // text content uchun
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) el.textContent = dict[key];
        });
        // attribute uchun (placeholder, aria-label, title)
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            // format: "attr:key,attr2:key2"
            const spec = el.getAttribute('data-i18n-attr');
            spec.split(',').forEach(pair => {
                const [attr, key] = pair.split(':').map(s => s.trim());
                if (attr && key && dict[key] !== undefined) el.setAttribute(attr, dict[key]);
            });
        });

        document.querySelectorAll('.lang-card').forEach(c => {
            c.classList.toggle('active', c.dataset.lang === lang);
        });
    }

    /* ============ OPEN / CLOSE ============ */
    function openPanel() {
        document.getElementById('settingsPanel')?.classList.add('show');
        document.getElementById('settingsOverlay')?.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function closePanel() {
        document.getElementById('settingsPanel')?.classList.remove('show');
        document.getElementById('settingsOverlay')?.classList.remove('show');
        document.body.style.overflow = '';
    }

    /* ============ INIT ============ */
    function init() {
        buildPanel();

        // Apply saved state immediately
        applyTheme(getTheme());
        applyLang(getLang());

        // Event listeners
        document.getElementById('settingsClose')?.addEventListener('click', closePanel);
        document.getElementById('settingsOverlay')?.addEventListener('click', closePanel);
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

        document.querySelectorAll('.lang-card').forEach(card => {
            card.addEventListener('click', () => applyLang(card.dataset.lang));
        });

        // Akkordion — sozlamalar bo'limlari sarlavhasiga bosilganda ochiladi/yopiladi
        document.querySelectorAll('.settings-section[data-accordion] > .settings-label').forEach(label => {
            label.addEventListener('click', () => {
                const section = label.closest('.settings-section');
                const willOpen = !section.classList.contains('open');
                // Bir vaqtda faqat bitta bo'lim ochiq tursin
                document.querySelectorAll('.settings-section[data-accordion].open').forEach(s => {
                    if (s !== section) {
                        s.classList.remove('open');
                        s.querySelector('.settings-label')?.setAttribute('aria-expanded', 'false');
                    }
                });
                section.classList.toggle('open', willOpen);
                label.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            });
        });

        // Trigger buttons — `data-settings-open` atributi orqali har qanday element
        document.querySelectorAll('[data-settings-open]').forEach(btn => {
            btn.addEventListener('click', (e) => { e.preventDefault(); openPanel(); });
        });

        // Theme toggle buttons — `data-theme-toggle` atributi
        document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cur = getTheme();
                applyTheme(cur === 'dark' ? 'light' : 'dark');
                updateThemeToggleIcons();
            });
        });
        updateThemeToggleIcons();

        // Profile sozlamalari (mijoz session)
        setupProfileForms();
    }

    /* ============ THEME TOGGLE ICON UPDATE ============ */
    function updateThemeToggleIcons() {
        const isDark = getTheme() === 'dark';
        document.querySelectorAll('[data-theme-toggle] i').forEach(icon => {
            icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        });
        document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
            btn.title = isDark ? 'Yorug\' rejim' : 'Tungi rejim';
        });
    }

    /* ============ PROFILE FORMS (email & parol) ============ */
    // MUHIM: "bo_subscriptions" endi Supabase'da (js/cloud.js) saqlanadi — lekin bu
    // fayl index.html'da HAM ishlatilgani uchun (u yerda Cloud yuklanmaydi), har doim
    // "window.Cloud" mavjudligini tekshirib, bo'lmasa localStorage'ga tushamiz.
    function getSubs() {
        return window.Cloud ? Cloud.get('bo_subscriptions', []) : JSON.parse(localStorage.getItem('bo_subscriptions') || '[]');
    }
    function setSubs(subs) {
        if (window.Cloud) Cloud.set('bo_subscriptions', subs);
        else localStorage.setItem('bo_subscriptions', JSON.stringify(subs));
    }
    function getCurrentClient() {
        try {
            const session = JSON.parse(localStorage.getItem('bo_session') || 'null');
            if (!session || session.type !== 'client') return null;
            const subs = getSubs();
            return { session, subs, me: subs.find(s => s.id === (session.clientId || session.id)) };
        } catch { return null; }
    }

    function setupProfileForms() {
        const data = getCurrentClient();
        const usernameSection = document.getElementById('settingsUsernameSection');
        const passSection = document.getElementById('settingsPassSection');

        if (!data || !data.me) {
            // Login bo'lmagan — bo'limlarni yashirish
            if (usernameSection) usernameSection.style.display = 'none';
            if (passSection) passSection.style.display = 'none';
            return;
        }

        // Foydalanuvchi nomi — current ni to'ldirish
        const curUserEl = document.getElementById('settingsCurrentUsername');
        if (curUserEl) curUserEl.value = data.me.username || data.me.businessName || '';

        // Foydalanuvchi nomi submit
        const usernameForm = document.getElementById('usernameChangeForm');
        usernameForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newU = document.getElementById('settingsNewUsername').value.trim();
            const pass = document.getElementById('settingsUsernamePass').value;
            const fresh = getCurrentClient();
            if (!fresh || !fresh.me) return;

            if (newU.length < 3) {
                showToast("Foydalanuvchi nomi kamida 3 ta belgi", 'error'); return;
            }
            if (/\s/.test(newU)) {
                showToast("Foydalanuvchi nomida bo'sh joy bo'lmasin", 'error'); return;
            }
            const passCheck = await verifyPassword(pass, fresh.me.password);
            if (!passCheck.ok) {
                showToast("Parol noto'g'ri", 'error'); return;
            }
            if (passCheck.upgradedHash) fresh.me.password = passCheck.upgradedHash;
            if (fresh.subs.find(s => s.username && s.username.toLowerCase() === newU.toLowerCase() && s.id !== fresh.me.id)) {
                showToast("Bu foydalanuvchi nomi band", 'error'); return;
            }

            fresh.me.username = newU;
            fresh.me.businessName = newU;   // ko'rsatish nomi ham yangilanadi
            setSubs(fresh.subs);
            // Session ham yangilash (bu doim shu qurilmada, localStorage'da qoladi)
            fresh.session.username = newU;
            fresh.session.businessName = newU;
            localStorage.setItem('bo_session', JSON.stringify(fresh.session));

            if (curUserEl) curUserEl.value = newU;
            document.getElementById('settingsNewUsername').value = '';
            document.getElementById('settingsUsernamePass').value = '';
            showToast('Foydalanuvchi nomi yangilandi ✅', 'success');
        });

        // Parol submit
        const passForm = document.getElementById('passChangeForm');
        passForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cur = document.getElementById('settingsCurrentPass').value;
            const neu = document.getElementById('settingsNewPass').value;
            const conf = document.getElementById('settingsConfirmPass').value;
            const fresh = getCurrentClient();
            if (!fresh || !fresh.me) return;

            const curCheck = await verifyPassword(cur, fresh.me.password);
            if (!curCheck.ok) { showToast("Joriy parol noto'g'ri", 'error'); return; }
            if (neu.length < 6) { showToast("Yangi parol kamida 6 ta belgi", 'error'); return; }
            if (neu !== conf) { showToast("Parollar mos kelmadi", 'error'); return; }

            fresh.me.password = await hashPassword(neu);
            setSubs(fresh.subs);

            passForm.reset();
            showToast('Parol yangilandi ✅', 'success');
        });
    }

    function showToast(msg, type) {
        if (window.showToast) window.showToast(msg, type);
        else alert(msg);
    }

    // Expose
    window.BO_Settings = {
        open: openPanel,
        close: closePanel,
        setTheme: applyTheme,
        setLang: applyLang,
        getTheme,
        getLang,
        t(key) { return (I18N[getLang()] || {})[key] || key; }
    };

    // Apply theme on script load (so it's set before DOM paints)
    try {
        const t = getTheme();
        if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    } catch {}

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
