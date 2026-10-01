// ============================================
// BRADESCON INVESTIMENTOS - SCRIPTS
// ============================================

// ============================================
// HOME — CLEAN URL / SCROLL RESOLUTION
// ============================================
// Home lives at "/". A reload must always land at the top with a clean URL
// (no hash, no /index.html). A normal arrival that carries a hash — a link
// clicked from another page (e.g. /quem-somos/ -> /#como-funciona) or a
// hash typed/bookmarked directly — must still land on that section, but the
// hash is stripped from the address bar right after scrolling there. Only
// an actual reload (Navigation Timing type "reload") skips the section
// scroll and goes straight to the top.
//
// `html { scroll-behavior: smooth }` (style.css) applies to scrollTo/
// scrollIntoView too, so a plain call here would animate instead of
// snapping — racing the browser's own (repeated, until load settles)
// native scroll to the fragment and often losing. We flip scroll-behavior
// to 'auto' for the duration of each correction and re-assert across two
// animation frames to win against late layout shifts (images/fonts).
function normalizeHomePath(pathname) {
    if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
    return pathname === '' ? '/' : pathname;
}
const IS_HOME = normalizeHomePath(window.location.pathname) === '/'
    || /\/index\.html$/.test(window.location.pathname);

(function () {
    if (!IS_HOME) return;

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    function isReloadNavigation() {
        const [entry] = performance.getEntriesByType ? performance.getEntriesByType('navigation') : [];
        if (entry && entry.type) return entry.type === 'reload';
        if (performance.navigation) return performance.navigation.type === performance.navigation.TYPE_RELOAD;
        return false;
    }

    function withInstantScroll(scrollFn) {
        const html = document.documentElement;
        const previousInlineBehavior = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';
        scrollFn();
        requestAnimationFrame(() => {
            scrollFn();
            requestAnimationFrame(() => {
                scrollFn();
                html.style.scrollBehavior = previousInlineBehavior;
            });
        });
    }

    function stripHash() {
        if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }

    function goToTop() {
        stripHash();
        withInstantScroll(() => window.scrollTo(0, 0));
    }

    function goToSection(target) {
        withInstantScroll(() => target.scrollIntoView({ block: 'start' }));
        stripHash();
    }

    const reloaded = isReloadNavigation();

    if (reloaded) {
        goToTop();
    } else if (window.location.hash) {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target) goToSection(target);
        else stripHash();
    }

    window.addEventListener('pageshow', function () {
        if (reloaded) goToTop();
    });
})();

// ============================================
// HEADER SCROLL EFFECT
// ============================================
const header = document.getElementById('header');
let lastScrollTop = 0;

window.addEventListener('scroll', function () {
    if (!header) return;
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    // Retract the header while scrolling down past the hero headline's
    // reach, so it never overlaps the hero text; bring it back on any
    // upward scroll. Keeps it visible while the mobile menu is open.
    const menuOpen = navMobile && navMobile.classList.contains('show');
    const delta = scrollTop - lastScrollTop;
    if (!menuOpen && Math.abs(delta) > 4) {
        if (delta > 0 && scrollTop > 80) {
            header.classList.add('hide');
        } else if (delta < 0 || scrollTop <= 80) {
            header.classList.remove('hide');
        }
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================
const menuToggle = document.getElementById('menuToggle');
const navMobile = document.getElementById('navMobile');
const mobileLinks = document.querySelectorAll('.nav-list-mobile a');

// Highlight the current page in the shared navigation.
const currentPath = normalizeHomePath(window.location.pathname);
document.querySelectorAll('.nav-list a, .nav-list-mobile a').forEach(link => {
    const linkUrl = new URL(link.href, window.location.href);
    if (normalizeHomePath(linkUrl.pathname) === currentPath && !linkUrl.hash) {
        link.setAttribute('aria-current', 'page');
    }
});

function setMobileMenu(open) {
    if (!menuToggle || !navMobile) return;
    menuToggle.classList.toggle('active', open);
    navMobile.classList.toggle('show', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}

if (menuToggle && navMobile) {
    menuToggle.addEventListener('click', function () {
        setMobileMenu(!navMobile.classList.contains('show'));
    });
}

// Close mobile menu when a link is clicked
mobileLinks.forEach(link => {
    link.addEventListener('click', function () {
        setMobileMenu(false);
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', function (event) {
    if (!navMobile || !menuToggle) return;
    const isClickInsideMenu = navMobile.contains(event.target);
    const isClickOnToggle = menuToggle.contains(event.target);

    if (!isClickInsideMenu && !isClickOnToggle && navMobile.classList.contains('show')) {
        setMobileMenu(false);
    }
});

// ============================================
// HOME — IN-PAGE SECTION LINKS WITHOUT A VISIBLE HASH
// ============================================
// "Como Funciona", "Contemplados" and "Contato" (desktop nav, mobile nav,
// footer, hero CTA) all point at href="#id" so the markup keeps working
// with no JS. On the Home page we intercept those clicks, scroll to the
// target ourselves and never touch the URL — so a click never adds
// #como-funciona/#conquistas/#contato to the address bar.
if (IS_HOME) {
    const sectionLinkReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        const id = link.getAttribute('href').slice(1);
        const target = id ? document.getElementById(id) : null;
        if (!target) return;

        link.addEventListener('click', function (event) {
            event.preventDefault();

            const scrollToTarget = () => {
                target.scrollIntoView({ behavior: sectionLinkReducedMotion ? 'auto' : 'smooth', block: 'start' });
            };

            if (navMobile && navMobile.classList.contains('show')) {
                setMobileMenu(false);
                requestAnimationFrame(scrollToTarget);
            } else {
                scrollToTarget();
            }
        });
    });
}

// ============================================
// CREDIBILITY STRIP — REVEAL ON SCROLL
// ============================================
const credibilityItems = document.querySelectorAll('.credibility-item');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateCredibilityCount(el) {
    const target = parseFloat(el.dataset.countTo);
    const suffix = el.dataset.suffix || '';
    const useLocale = el.dataset.locale === 'pt-BR';
    const format = value => (useLocale ? value.toLocaleString('pt-BR') : value) + suffix;

    if (prefersReducedMotion || isNaN(target)) {
        el.textContent = format(target);
        return;
    }

    const duration = 1400;
    const start = performance.now();
    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = format(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

if (credibilityItems.length && 'IntersectionObserver' in window) {
    const credibilityObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                const numberEl = entry.target.querySelector('[data-count-to]');
                if (numberEl) animateCredibilityCount(numberEl);
                credibilityObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    credibilityItems.forEach(el => credibilityObserver.observe(el));
} else {
    credibilityItems.forEach(el => {
        el.classList.add('in-view');
        const numberEl = el.querySelector('[data-count-to]');
        if (numberEl) animateCredibilityCount(numberEl);
    });
}

// ============================================
// PARCEIROS — REVEAL ON SCROLL
// ============================================
const partnersAnimated = document.querySelectorAll('.partners-animate');
if (partnersAnimated.length && 'IntersectionObserver' in window) {
    const partnersObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                partnersObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    partnersAnimated.forEach(el => partnersObserver.observe(el));
} else {
    partnersAnimated.forEach(el => el.classList.add('in-view'));
}

// ============================================
// PARCEIROS — CARROSSEL
// ============================================
(function () {
    const viewport = document.getElementById('partnersViewport');
    const track = document.getElementById('partnersTrack');
    const prevBtn = document.getElementById('partnersPrev');
    const nextBtn = document.getElementById('partnersNext');
    const dotsWrap = document.getElementById('partnersDots');
    if (!viewport || !track || !prevBtn || !nextBtn || !dotsWrap) return;

    const allCards = Array.from(track.children);
    const uniqueCount = allCards.length / 2;
    if (!uniqueCount || allCards.length % 2 !== 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const AUTOPLAY_SPEED = 26; // px per second — slow, continuous drift
    const RESUME_DELAY = 1200; // ms before autoplay resumes after interaction

    let cardStep = 0;
    let setWidth = 0;
    let offset = 0;
    let paused = false;
    let dragging = false;
    let dragStartX = 0;
    let dragStartOffset = 0;
    let resumeTimer = null;
    let lastTime = null;

    function measure() {
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
        cardStep = allCards[0].getBoundingClientRect().width + gap;
        setWidth = cardStep * uniqueCount;
    }

    function applyOffset() {
        track.style.transform = 'translateX(' + (-offset) + 'px)';
    }

    function wrap() {
        if (setWidth <= 0) return;
        offset = ((offset % setWidth) + setWidth) % setWidth;
    }

    function updateDots() {
        let idx = Math.round(offset / cardStep) % uniqueCount;
        if (idx < 0) idx += uniqueCount;
        Array.from(dotsWrap.children).forEach((dot, i) => {
            const active = i === idx;
            dot.classList.toggle('active', active);
            dot.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }

    function buildDots() {
        dotsWrap.innerHTML = '';
        for (let i = 0; i < uniqueCount; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'partners-dot';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', 'Ir para a administradora ' + (i + 1));
            dot.addEventListener('click', () => goToIndex(i));
            dotsWrap.appendChild(dot);
        }
        updateDots();
    }

    function animateTo(newOffset) {
        track.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1)';
        offset = newOffset;
        applyOffset();
        window.setTimeout(() => {
            track.style.transition = '';
            wrap();
            applyOffset();
        }, 620);
        updateDots();
    }

    function shortestDelta(target) {
        let delta = (target - offset) % setWidth;
        if (delta > setWidth / 2) delta -= setWidth;
        if (delta < -setWidth / 2) delta += setWidth;
        return delta;
    }

    function goToIndex(i) {
        pauseAutoplay();
        animateTo(offset + shortestDelta(i * cardStep));
        scheduleResume();
    }

    function nudge(direction) {
        pauseAutoplay();
        animateTo(offset + direction * cardStep);
        scheduleResume();
    }

    function pauseAutoplay() {
        paused = true;
        if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
    }

    function scheduleResume(delay) {
        if (resumeTimer) clearTimeout(resumeTimer);
        resumeTimer = window.setTimeout(() => {
            paused = false;
            lastTime = null;
        }, delay || RESUME_DELAY);
    }

    function tick(time) {
        if (lastTime === null) lastTime = time;
        const dt = (time - lastTime) / 1000;
        lastTime = time;
        if (!paused && !dragging && !reducedMotion) {
            offset += AUTOPLAY_SPEED * dt;
            wrap();
            applyOffset();
            updateDots();
        }
        requestAnimationFrame(tick);
    }

    prevBtn.addEventListener('click', () => nudge(-1));
    nextBtn.addEventListener('click', () => nudge(1));

    viewport.addEventListener('mouseenter', pauseAutoplay);
    viewport.addEventListener('mouseleave', () => scheduleResume(200));
    prevBtn.addEventListener('focus', pauseAutoplay);
    nextBtn.addEventListener('focus', pauseAutoplay);
    prevBtn.addEventListener('blur', () => scheduleResume(200));
    nextBtn.addEventListener('blur', () => scheduleResume(200));
    dotsWrap.addEventListener('focusin', pauseAutoplay);
    dotsWrap.addEventListener('focusout', () => scheduleResume(200));

    function onPointerDown(e) {
        dragging = true;
        pauseAutoplay();
        track.style.transition = '';
        dragStartX = e.clientX;
        dragStartOffset = offset;
        viewport.classList.add('is-dragging');
        if (viewport.setPointerCapture && e.pointerId !== undefined) {
            viewport.setPointerCapture(e.pointerId);
        }
    }
    function onPointerMove(e) {
        if (!dragging) return;
        offset = dragStartOffset - (e.clientX - dragStartX);
        wrap();
        applyOffset();
    }
    function onPointerUp() {
        if (!dragging) return;
        dragging = false;
        viewport.classList.remove('is-dragging');
        updateDots();
        scheduleResume();
    }

    viewport.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => { measure(); applyOffset(); }, 150);
    });

    measure();
    buildDots();
    applyOffset();
    requestAnimationFrame(tick);
})();

// ============================================
// ABOUT SECTION — REVEAL ON SCROLL
// ============================================
const aboutAnimated = document.querySelectorAll('.about-animate, .about-animate-x');
if (aboutAnimated.length && 'IntersectionObserver' in window) {
    const aboutObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                aboutObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    aboutAnimated.forEach(el => aboutObserver.observe(el));
} else {
    aboutAnimated.forEach(el => el.classList.add('in-view'));
}

const editorialAnimated = document.querySelectorAll('.editorial-animate');
if (editorialAnimated.length && 'IntersectionObserver' in window) {
    const editorialObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                editorialObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    editorialAnimated.forEach(el => editorialObserver.observe(el));
} else {
    editorialAnimated.forEach(el => el.classList.add('in-view'));
}

// ============================================
// SOLUÇÕES SHOWCASE — REVEAL ON SCROLL
// ============================================
const solucoesAnimated = document.querySelectorAll('.solucoes-animate');
if (solucoesAnimated.length && 'IntersectionObserver' in window) {
    const solucoesObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                solucoesObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    solucoesAnimated.forEach(el => solucoesObserver.observe(el));
} else {
    solucoesAnimated.forEach(el => el.classList.add('in-view'));
}

// ============================================
// COMO FUNCIONA — PROGRESSIVE JOURNEY
// ============================================
const processJourney = document.querySelector('.process-journey');
const processAnimated = document.querySelectorAll('.process-animate');
if ((processJourney || processAnimated.length) && 'IntersectionObserver' in window) {
    const processObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                processObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.16 });

    if (processJourney) processObserver.observe(processJourney);
    processAnimated.forEach(el => processObserver.observe(el));
} else {
    if (processJourney) processJourney.classList.add('in-view');
    processAnimated.forEach(el => el.classList.add('in-view'));
}

// ============================================
// DIFERENCIAIS — REVEAL ON SCROLL
// ============================================
const diffAnimated = document.querySelectorAll('.diff-animate');
if (diffAnimated.length && 'IntersectionObserver' in window) {
    const diffObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                diffObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    diffAnimated.forEach(el => diffObserver.observe(el));
} else {
    diffAnimated.forEach(el => el.classList.add('in-view'));
}

// ============================================
// CONQUISTAS SHOWCASE — REVEAL ON SCROLL
// ============================================
const conquistasAnimated = document.querySelectorAll('.conquistas-animate');
if (conquistasAnimated.length && 'IntersectionObserver' in window) {
    const conquistasObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                conquistasObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    conquistasAnimated.forEach(el => conquistasObserver.observe(el));
} else {
    conquistasAnimated.forEach(el => el.classList.add('in-view'));
}

// ============================================
// CONTEMPLADOS — DETAIL MODAL
// ============================================
const contempladoCases = {
    imovel: {
        category: 'Imóvel',
        title: 'Casa própria planejada',
        profile: 'Lucas Ferreira e Amanda Ribeiro',
        location: 'Porto Alegre, RS',
        achievement: 'Casa própria',
        type: 'Consórcio Imobiliário',
        story: 'Lucas e Amanda estavam há alguns anos pensando em sair do aluguel, mas sempre acabavam adiando a decisão por causa de outras prioridades.\n\nDepois de começarem a organizar melhor as finanças e entenderem as possibilidades de planejamento para aquisição de um imóvel, decidiram transformar aquela vontade em um projeto de verdade.\n\nO objetivo era encontrar uma casa onde pudessem ter mais espaço, receber a família e construir uma nova fase juntos.',
        quote: 'A gente falava em ter nossa casa fazia tempo, mas parecia uma coisa muito distante. Quando começamos a colocar tudo no papel e entender melhor como poderíamos nos organizar, ficou muito mais claro.',
        image: '/images/historia-imoveis.webp',
        imageAlt: 'Casal recebendo as chaves de um imóvel',
        imagePosition: 'center',
        simulation: 'imoveis'
    },
    veiculo: {
        category: 'Veículo',
        title: 'SUV zero quilômetro',
        profile: 'Rafael Mendes',
        location: 'Canoas, RS',
        achievement: 'SUV zero quilômetro',
        type: 'Consórcio Veicular',
        story: 'Rafael já estava com o mesmo carro havia bastante tempo e queria trocar por um veículo maior e mais confortável para usar no dia a dia e nas viagens com a família.\n\nEm vez de tomar uma decisão no impulso, começou a planejar a troca com antecedência.\n\nA ideia era conseguir fazer a mudança com mais organização e escolher o veículo que realmente atendesse o que ele precisava.',
        quote: 'Eu queria trocar de carro, mas não queria fazer isso correndo e depois me arrepender. Preferi me organizar, pesquisar bastante e esperar o momento em que a troca realmente fizesse sentido pra mim.',
        image: '/images/historia-veiculo.webp',
        imageAlt: 'Entrega das chaves de um veículo',
        imagePosition: 'center',
        simulation: 'veiculos'
    },
    pesado: {
        category: 'Pesado',
        title: 'Caminhão para expandir a operação',
        profile: 'Carlos Eduardo Martins',
        location: 'Chapecó, SC',
        achievement: 'Caminhão para ampliar a operação',
        type: 'Consórcio para Pesados',
        story: 'Carlos trabalha com transporte e começou a perceber que depender apenas do caminhão que já possuía estava limitando a quantidade de serviços que conseguia atender.\n\nA compra de outro veículo passou a fazer parte dos planos de crescimento da operação.\n\nDepois de analisar as possibilidades, decidiu se organizar para ampliar a frota de forma planejada, sem transformar a expansão em uma decisão precipitada.',
        quote: 'Chegou uma hora em que eu estava recusando serviço porque faltava caminhão. Aí percebi que precisava pensar no próximo passo com calma. Não dava pra simplesmente comprar qualquer coisa e torcer pra dar certo.',
        image: '/images/historia-pesado.webp',
        imageAlt: 'Motorista com as chaves de um caminhão',
        imagePosition: 'center 38%',
        simulation: 'pesados'
    },
    agro: {
        category: 'Agronegócio',
        title: 'Máquina agrícola para produção',
        profile: 'João Carlos Pereira',
        location: 'Passo Fundo, RS',
        achievement: 'Máquina agrícola para produção',
        type: 'Consórcio Agrícola',
        story: 'João Carlos trabalha no campo com a família e queria modernizar parte da operação para ganhar mais agilidade durante os períodos de maior movimento.\n\nA troca do equipamento antigo por uma máquina mais moderna já era discutida havia algum tempo.\n\nCom planejamento, a família começou a tratar a aquisição como investimento de longo prazo na produtividade da propriedade.',
        quote: 'No campo tudo tem hora certa. Máquina é investimento alto, então não dá pra decidir de um dia pro outro. A gente queria melhorar a produção, mas sem fazer uma loucura.',
        image: '/images/historia-agro.webp',
        imageAlt: 'Produtor ao lado de uma máquina agrícola',
        imagePosition: 'center 68%',
        simulation: 'agro'
    }
};

const contempladoModal = document.getElementById('contemplado-modal');
const contempladoTriggers = document.querySelectorAll('.contemplado-trigger');

if (contempladoModal && contempladoTriggers.length) {
    const modalDialog = contempladoModal.querySelector('.contemplado-dialog');
    const closeButton = contempladoModal.querySelector('.contemplado-close');
    const modalImage = document.getElementById('contemplado-modal-image');
    const modalCategory = document.getElementById('contemplado-modal-category');
    const modalTitle = document.getElementById('contemplado-modal-title');
    const modalProfile = document.getElementById('contemplado-modal-profile');
    const modalLocation = document.getElementById('contemplado-modal-location');
    const modalAchievement = document.getElementById('contemplado-modal-achievement');
    const modalType = document.getElementById('contemplado-modal-type');
    const modalStory = document.getElementById('contemplado-modal-story');
    const modalQuote = document.getElementById('contemplado-modal-quote');
    const modalCta = document.getElementById('contemplado-modal-cta');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeTrigger = null;
    let closeTimer = null;
    let previousBodyPadding = '';

    function fillContempladoModal(data) {
        modalImage.src = data.image;
        modalImage.alt = data.imageAlt;
        modalImage.style.objectPosition = data.imagePosition;
        modalCategory.textContent = data.category;
        modalTitle.textContent = data.title;
        modalProfile.textContent = data.profile;
        modalLocation.textContent = data.location;
        modalAchievement.textContent = data.achievement;
        modalType.textContent = data.type;
        modalStory.textContent = data.story;
        modalQuote.textContent = data.quote;
        modalCta.href = `/simulacao/?categoria=${data.simulation}`;
    }

    function openContempladoModal(trigger) {
        const data = contempladoCases[trigger.dataset.contemplado];
        if (!data) return;

        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }

        activeTrigger = trigger;
        fillContempladoModal(data);
        trigger.setAttribute('aria-expanded', 'true');
        previousBodyPadding = document.body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
        document.body.classList.add('contemplado-open');
        contempladoModal.hidden = false;

        requestAnimationFrame(() => {
            contempladoModal.classList.add('is-open');
            closeButton.focus({ preventScroll: true });
        });
    }

    function closeContempladoModal() {
        if (contempladoModal.hidden) return;

        const triggerToRestore = activeTrigger;
        contempladoModal.classList.remove('is-open');
        if (activeTrigger) activeTrigger.setAttribute('aria-expanded', 'false');
        activeTrigger = null;
        document.body.classList.remove('contemplado-open');
        document.body.style.paddingRight = previousBodyPadding;

        const finishClose = () => {
            contempladoModal.hidden = true;
            if (triggerToRestore) triggerToRestore.focus({ preventScroll: true });
            closeTimer = null;
        };

        if (reducedMotion.matches) {
            finishClose();
        } else {
            closeTimer = setTimeout(finishClose, 280);
        }
    }

    contempladoTriggers.forEach(trigger => {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.addEventListener('click', () => openContempladoModal(trigger));
    });

    contempladoModal.querySelectorAll('[data-contemplado-close]').forEach(control => {
        control.addEventListener('click', closeContempladoModal);
    });

    document.addEventListener('keydown', event => {
        if (contempladoModal.hidden) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeContempladoModal();
            return;
        }

        if (event.key !== 'Tab') return;
        const focusable = [...modalDialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
            .filter(element => element.offsetParent !== null);
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
}

// ============================================
// FAQ ACCORDION
// ============================================
const faqToggles = document.querySelectorAll('.faq-toggle');

function setFaqState(toggle, shouldOpen) {
    const faqItem = toggle.closest('.faq-item');
    const answerId = toggle.getAttribute('aria-controls');
    const answer = answerId ? document.getElementById(answerId) : null;

    faqItem.classList.toggle('open', shouldOpen);
    toggle.setAttribute('aria-expanded', String(shouldOpen));
    if (answer) answer.setAttribute('aria-hidden', String(!shouldOpen));
}

faqToggles.forEach((toggle, index) => {
    toggle.addEventListener('click', function () {
        const shouldOpen = this.getAttribute('aria-expanded') !== 'true';

        faqToggles.forEach(otherToggle => {
            if (otherToggle !== this) setFaqState(otherToggle, false);
        });

        setFaqState(this, shouldOpen);
    });

    toggle.addEventListener('keydown', function (event) {
        let targetIndex = null;

        if (event.key === 'ArrowDown') targetIndex = (index + 1) % faqToggles.length;
        if (event.key === 'ArrowUp') targetIndex = (index - 1 + faqToggles.length) % faqToggles.length;
        if (event.key === 'Home') targetIndex = 0;
        if (event.key === 'End') targetIndex = faqToggles.length - 1;

        if (targetIndex !== null) {
            event.preventDefault();
            faqToggles[targetIndex].focus();
        }
    });
});

// ============================================
// FINAL CTA — PROGRESSIVE REVEAL
// ============================================
const finalCtaSection = document.querySelector('.final-cta');
const finalCtaReveals = document.querySelectorAll('.final-reveal');

if (finalCtaSection && finalCtaReveals.length && 'IntersectionObserver' in window) {
    finalCtaSection.classList.add('final-animate-ready');

    const finalCtaObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            finalCtaReveals.forEach(element => element.classList.add('in-view'));
            finalCtaObserver.unobserve(entry.target);
        });
    }, { threshold: 0.14, rootMargin: '0px 0px -50px 0px' });

    finalCtaObserver.observe(finalCtaSection);
} else {
    finalCtaReveals.forEach(element => element.classList.add('in-view'));
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================
document.addEventListener('keydown', function (e) {
    // ESC to close mobile menu
    if (e.key === 'Escape' && navMobile && navMobile.classList.contains('show')) {
        setMobileMenu(false);
        menuToggle.focus();
    }
});

// ============================================
// FORM VALIDATION
// ============================================
function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);
}

// Multi-step simulation flow
const simulationForm = document.getElementById('simulationForm');
if (simulationForm) {
    const formSteps = [...simulationForm.querySelectorAll('.form-step')];
    const progressSteps = [...simulationForm.querySelectorAll('.progress-step')];
    const status = document.getElementById('formStatus');
    let currentStep = 0;
    const categoryLabels = { imoveis: 'Imóvel', veiculos: 'Veículo', pesados: 'Pesado', agro: 'Máquina Agrícola' };
    const queryCategory = new URLSearchParams(window.location.search).get('categoria');
    const selectedCategory = [...simulationForm.querySelectorAll('input[name="categoria"]')]
        .find(input => input.value === queryCategory);
    if (selectedCategory) selectedCategory.checked = true;

    const phoneField = document.getElementById('whatsapp');
    phoneField.addEventListener('input', () => phoneField.setCustomValidity(''));

    function showStep(step) {
        currentStep = step;
        formSteps.forEach((item, index) => item.classList.toggle('active', index === step));
        progressSteps.forEach((item, index) => {
            item.classList.toggle('active', index <= step);
            if (index === step) item.setAttribute('aria-current', 'step');
            else item.removeAttribute('aria-current');
        });
        status.textContent = '';
        const heading = formSteps[step].querySelector('h2');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
        }
    }

    simulationForm.querySelectorAll('.next-step').forEach(button => button.addEventListener('click', () => {
        const fields = [...formSteps[currentStep].querySelectorAll('input')];
        if (currentStep === 2) {
            phoneField.setCustomValidity(validatePhone(phoneField.value) ? '' : 'Informe um telefone válido com DDD.');
        }
        const valid = fields.every(field => field.checkValidity());
        if (!valid) { simulationForm.reportValidity(); return; }
        if (currentStep === 2) {
            const data = new FormData(simulationForm);
            document.getElementById('reviewBox').innerHTML = `<strong>Categoria:</strong> ${escapeHtml(categoryLabels[data.get('categoria')])}<br><strong>Crédito:</strong> ${escapeHtml(data.get('credito'))}<br><strong>Nome:</strong> ${escapeHtml(data.get('nome'))}<br><strong>WhatsApp:</strong> ${escapeHtml(data.get('whatsapp'))}<br><strong>E-mail:</strong> ${escapeHtml(data.get('email'))}<br><strong>Cidade/UF:</strong> ${escapeHtml(data.get('cidade') || 'Não informado')}`;
        }
        showStep(Math.min(currentStep + 1, formSteps.length - 1));
    }));
    simulationForm.querySelectorAll('.previous-step').forEach(button => button.addEventListener('click', () => showStep(Math.max(currentStep - 1, 0))));
    simulationForm.addEventListener('submit', event => {
        event.preventDefault();
        const data = new FormData(simulationForm);
        const message = `Olá, gostaria de solicitar uma simulação pela Bradescon.\n\nCategoria: ${categoryLabels[data.get('categoria')]}\nCrédito desejado: ${data.get('credito')}\nNome: ${data.get('nome')}\nWhatsApp: ${data.get('whatsapp')}\nE-mail: ${data.get('email')}\nCidade/UF: ${data.get('cidade') || 'Não informado'}`;
        window.location.href = `https://wa.me/555180886484?text=${encodeURIComponent(message)}`;
    });
}

if ('serviceWorker' in navigator) {
    const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    if (isLocalDev) {
        // Live Server/dev: prevent stale cached CSS/JS from masking visual changes.
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => registration.unregister());
        }).catch(() => {});
    } else {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js').catch(() => {});
        });
    }
}



