// =======================================================
// 1. SELEÇÃO DE ELEMENTOS (APÓS DOM READY)
// =======================================================

let logo,
    header,
    hero,
    heroZoom,
    heroTitle,
    heroLogo,
    heroCross;

document.addEventListener('DOMContentLoaded', () => {
    logo = document.querySelector('.logo');
    header = document.querySelector('header');
    hero = document.querySelector('.hero');
    heroZoom = document.querySelector('.hero-zoom');
    heroTitle = document.querySelector('#hero-title');
    heroLogo = document.querySelector('#hero-logo');
    heroCross = document.querySelector('#hero-cross');
    maryContainer = document.querySelector('.mary-container');

    handleSplashScreen();

    document.body.addEventListener('click', (event) => {
        event.preventDefault();

        const tab = event.target.closest('.tab');
        if (!tab) return;
        switchTab(tab);
    });
});

// =======================================================
// 2. CONFIGURAÇÕES
// =======================================================

const PARALLAX_RATE = 0.2;
const MARY_PARALLAX_RATE = 0.08;
const TITLE_PARALLAX_RATE = 0.3;
const MAX_ZOOM_TRANSLATE = 0;
const MAX_TITLE_TRANSLATE = 100;

const IS_NEW_SESSION_KEY = 'isNewSession';
const isNewSession = sessionStorage.getItem(IS_NEW_SESSION_KEY);

function repairHeroTitleSharpness() {
    requestAnimationFrame(() => {
        const words = heroTitle.querySelectorAll('.word'); words.forEach(word => {
            const currentSize = parseFloat(window.getComputedStyle(word).fontSize);
            // Adiciona uma fração minúscula que o olho humano não percebe, mas que força o motor de renderização a recalcular os subpixels
            word.style.fontSize = (currentSize + 0.1) + 'px';
        });
        requestAnimationFrame(() => {
            words.forEach(word => {
                const currentSize = parseFloat(window.getComputedStyle(word).fontSize);
                word.style.fontSize = (currentSize - 0.1) + 'px';
            });
        });
    });
}

// =======================================================
// 3. ESTADO GLOBAL CONTROLADO
// =======================================================

let parallaxEnabled = false;
let parallaxScale = 'scale(1)';

// =======================================================
// 4. PARALLAX (PURO, SEM ACOPLAMENTO)
// =======================================================

function applyParallax() {
    if (!parallaxEnabled) return;

    const scrollY = window.scrollY;

    const zoomTranslate = Math.min(
        scrollY * PARALLAX_RATE,
        MAX_ZOOM_TRANSLATE
    );

    const titleTranslate = Math.min(
        scrollY * TITLE_PARALLAX_RATE,
        MAX_TITLE_TRANSLATE
    );

    const maryTranslate = Math.min(
        scrollY * MARY_PARALLAX_RATE,
        50
    );

    heroZoom.style.transform =
        `translate3d(0, ${zoomTranslate}px, 0) ${parallaxScale}`;

    heroTitle.style.transform =
        `translate3d(0, ${titleTranslate}px, 0)`;

    maryContainer.style.transform =
        `translate3d(0, ${maryTranslate}px, 0)`;

    const inverse = `translate3d(0, ${-titleTranslate}px, 0)`;
    heroLogo.style.transform = inverse;
    heroCross.style.transform = inverse;
}

function enableParallax(scale) {
    parallaxScale = scale;
    parallaxEnabled = true;

    applyParallax(); // estado inicial
    window.addEventListener('scroll', applyParallax, { passive: true });
}

// =======================================================
// 5. HEADER OBSERVER (LAYOUT JÁ ESTÁVEL)
// =======================================================

function setupHeaderObserver() {
    const chevronUpBtn = document.getElementById('chevron-up-btn');

    const observer = new IntersectionObserver(entries => {
        const heroVisible = entries[0].isIntersecting;
        heroVisible ? header.classList.remove('bg-colored') : header.classList.add('bg-colored');
        chevronUpBtn.hidden = heroVisible;
    }, { threshold: 0 });

    observer.observe(hero);
}

// =======================================================
// 6. PÓS-ANIMAÇÃO INICIAL
// =======================================================

function setupAfterInitialAnimation() {
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');

    main.hidden = false;
    footer.hidden = false;

    document.body.classList.remove('scroll-lock');

    const scale = isNewSession
        ? 'scale(1)'
        : 'scale(calc(1 / var(--hero-scale)))';

    //enableParallax(scale);
    setupHeaderObserver();

    if (isNewSession) return repairHeroTitleSharpness();

    heroTitle.addEventListener('animationend', () => {
        setTimeout(repairHeroTitleSharpness, 1000);
    });
}

// =======================================================
// 7. SPLASH / ANIMAÇÃO INICIAL
// =======================================================

function handleSplashScreen() {
    const lockOverlay = document.querySelector('#lock-overlay');

    // Sessão já iniciada → sem splash
    if (isNewSession === 'false') {
        hero.style.transform = 'scale(1)';
        lockOverlay?.remove();
        logo?.remove();
        setupAfterInitialAnimation();
        return;
    }

    // Primeira visita na sessão
    heroZoom.classList.add('hero-anim');
    logo.classList.add('decrease-opacity-anim');
    heroTitle.classList.add('increase-opacity-anim');

    heroZoom.addEventListener('animationend', () => {
        setTimeout(setupAfterInitialAnimation, 3000);
    }, { once: true });

    setTimeout(() => {
        sessionStorage.setItem(IS_NEW_SESSION_KEY, 'false');
    }, 5000);
}

// =======================================================
// 8. TRANSFORM-ORIGIN DINÂMICO (APÓS LOAD)
// =======================================================

window.addEventListener('load', () => {
    if (!logo || !hero || !heroZoom) return;

    function calculateTransformOrigin() {
        const logoRect = logo.getBoundingClientRect();
        const heroRect = hero.getBoundingClientRect();

        const originX =
            ((logoRect.left + logoRect.width / 2) - heroRect.left)
            / heroRect.width * 100;

        const originY =
            ((logoRect.top + logoRect.height / 2) - heroRect.top)
            / heroRect.height * 105;

        const value = `${originX}% ${originY}%`;

        heroZoom.style.transformOrigin = value;
        document.documentElement.style.setProperty('--transform-origin', value);
    }

    calculateTransformOrigin();
    window.addEventListener('resize', calculateTransformOrigin);
});

// =======================================================
// 9. SISTEMA DE ABAS (INÍCIO / HORÁRIOS / DEVOÇÕES / PASTORAIS / MÍDIA / CONTATO)
// =======================================================

const tabsMap = {
    inicio: 'content-inicio',
    horarios: 'content-horarios',
    devocoes: 'content-devocoes',
    pastorais: 'content-pastorais',
    midia: 'content-midia',
    contato: 'content-contato'
};

let activeTabContentId = 'content-inicio';

function switchTab(targetTab) {
    const isNavTab = targetTab.classList.contains('nav');
    const targetContentId = tabsMap[targetTab.dataset.content];

    if (!targetContentId || targetContentId === activeTabContentId) return;

    // Oculta conteúdo atual
    document.getElementById(activeTabContentId).hidden = true;
    document.querySelector('nav .tab-active').classList.remove('tab-active');
    document.querySelector('main .tab-active').classList.remove('tab-active');

    // Exibe novo conteúdo
    document.getElementById(targetContentId).hidden = false;
    targetTab.classList.add('tab-active');
    document.querySelector(`${isNavTab ? 'main' : 'nav'} .tab[data-content="${targetTab.dataset.content}"]`).classList.add('tab-active');

    activeTabContentId = targetContentId;

    // Lazy load específico
    if (targetTab.dataset.content === 'midia') {
        loadYoutubeVideos();
    }
}

// =======================================================
// 10. CARREGAMENTO DE VÍDEOS DO YOUTUBE
// =======================================================

const API_KEY = 'AIzaSyBqzCQQqD_mFhcAnZZ-lL-J4skC6NraRBo';
const CHANNEL_ID = 'UCeu2aaql5duJPhbP3F3wjQg';
const MAX_RESULTS = 6;

function loadYoutubeVideos() {
    const container = document.getElementById('youtube-videos');
    if (!container || container.dataset.loaded === 'true') return;

    container.dataset.loaded = 'true';
    container.innerHTML =
        `<div id="loader-overlay">
        <div id="loader-container" class="pulse-animation">
            <svg id="svg" version="1.1" viewBox="0 0 270.93425605536333 300" width="270.93425605536333" height="305"
                xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip-1)" fill="none" fill-rule="nonzero" stroke="none" stroke-width="1"
                    stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray=""
                    stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none"
                    style="mix-blend-mode: normal">
                    <path id="first-path"
                        d="M63.91954,1.89486c7.20612,1.69254 13.0911,3.2751 20.53477,4.63462c30.24695,5.51055 61.18779,6.07302 91.61488,1.66545c10.87545,-1.65252 19.85143,-3.76326 30.44569,-6.13923c3.29808,5.90036 5.20926,9.5544 9.48709,15.11695c13.17912,17.13882 32.0918,28.38882 51.20804,37.7187c-0.44082,3.1645 -1.1511,6.50127 -1.64318,9.72671c-0.75862,5.08594 -1.26094,10.20674 -1.50698,15.34307c-0.46425,10.02393 0.08348,20.27944 -0.17428,30.32417c-0.14352,5.58428 -0.60484,11.32852 -1.22287,16.87515c-4.02887,34.64326 -16.90044,67.6667 -37.37721,95.8957c-5.80678,8.26611 -12.20669,16.09717 -19.14993,23.43311c-7.05015,7.31104 -14.55869,14.16504 -22.48022,20.521c-11.73219,9.59766 -25.47954,18.54346 -38.60886,26.09766c-2.35596,1.35645 -8.08277,4.68604 -10.41105,5.625c-17.50221,-9.68115 -30.56812,-17.66016 -46.50667,-29.90039c-45.69709,-35.09619 -74.75911,-85.41064 -80.83176,-142.91968c-0.78321,-7.1606 -1.26198,-14.35122 -1.43504,-21.55254c-0.12747,-8.83506 0.25009,-17.96074 -0.22965,-26.76211c-0.28782,-4.85698 -0.83108,-9.69536 -1.62752,-14.49507c-0.41993,-2.67788 -0.92651,-5.25205 -1.2742,-7.95117c1.73672,-1.03931 4.34019,-2.15186 6.22605,-3.07207c2.63046,-1.29463 5.21934,-2.67217 7.76278,-4.13042c17.60311,-9.96226 33.36519,-22.26987 43.82896,-39.85077c1.17966,-1.98193 2.28888,-4.15759 3.37115,-6.20383z"
                        fill="#141414" />
                    <path id="second-path"
                        d="M64.26971,2.49302c1.15169,0.35133 2.87542,0.67214 4.15379,1.03024c7.22779,2.02444 14.58988,3.38791 22.00865,4.53478c26.45841,4.27639 53.38987,4.77391 79.98843,1.47766c7.46021,-1.04291 14.8882,-2.31489 22.2708,-3.81415c4.5268,-0.95978 9.04188,-2.19687 13.56282,-3.06542c1.10717,1.85492 2.11182,3.89969 3.21753,5.78684c2.04885,3.42205 4.29687,6.72066 6.73235,9.87901c11.89914,15.34849 32.74497,28.88906 50.46846,36.76245c-1.61242,8.11948 -2.65223,16.34194 -3.11355,24.60703c-0.44668,9.72319 -0.02197,19.38618 -0.19332,29.09429c-0.10544,5.66528 -0.47597,11.32251 -1.11303,16.95278c-5.01741,44.29907 -24.15123,85.80835 -54.57348,118.39087c-7.55833,8.04785 -15.67904,15.54639 -24.30207,22.44141c-14.69489,12.23291 -32.02736,22.44873 -48.68,31.72998c-2.38627,-1.65088 -5.38266,-3.14648 -7.93413,-4.59668c-21.57296,-12.26953 -42.04328,-26.47998 -59.75492,-44.04199c-34.20025,-33.98145 -55.27596,-78.97266 -59.49583,-127.00518c-0.29593,-3.14941 -0.49991,-6.27246 -0.72808,-9.42539c-0.82344,-11.37861 -0.06674,-22.81904 -0.53771,-34.21084c-0.32779,-7.92803 -1.61774,-15.82573 -3.02885,-23.62192c1.47302,-0.86118 3.88423,-1.92451 5.46038,-2.68301c2.72705,-1.29155 5.40518,-2.68389 8.02888,-4.17437c17.36352,-9.82559 33.7297,-22.38691 43.99562,-39.8077c1.1615,-1.97098 2.18754,-4.15805 3.43881,-6.04854z"
                        fill="#ffffff" />
                </g>
            </svg>
            <p id="loading-text">Carregando</p>
        </div>
    </div>`;

    fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `key=${API_KEY}&channelId=${CHANNEL_ID}` +
        `&part=snippet,id&type=video&order=date&maxResults=${MAX_RESULTS}`
    )
        .then(res => {
            if (!res.ok) throw new Error('Falha ao buscar vídeos');
            return res.json();
        })
        .then(data => {
            container.innerHTML = '';

            if (!data.items?.length) {
                container.innerHTML =
                    '<p style="grid-column:1/-1;text-align:center">Nenhum vídeo encontrado.</p>';
                return;
            }

            for (const item of data.items) {
                const card = document.createElement('div');
                card.className = 'card-sacrament youtube-card';

                card.innerHTML = `
                <iframe
                    src="https://www.youtube.com/embed/${item.id.videoId}"
                    loading="lazy"
                    allowfullscreen
                ></iframe>
                <p class="youtube-card-title">${item.snippet.title}</p>
            `;

                container.appendChild(card);
            }
        })
        .catch(err => {
            console.error(err);
            container.innerHTML =
                '<p style="grid-column:1/-1;text-align:center;color:red">Erro ao carregar vídeos.</p>';
        });
}

const images = document.querySelectorAll('.intro-image, #welcome-image');
const speed = 0.05;

function animate() {
    const viewportCenter = window.innerHeight / 2;

    images.forEach(img => {
        const rect = img.getBoundingClientRect();

        // distância do centro da viewport (invertida de propósito)
        const distanceFromCenter =
            viewportCenter - (rect.top + rect.height / 2);

        if (img.classList.contains('parallax-quote')) {
            const speed = 0.3;
            img.style.transform = `translateY(${distanceFromCenter * speed}px)`;
            return;
        }

        img.style.transform = `translateY(${distanceFromCenter * speed}px)`;
    });

    requestAnimationFrame(animate);
}

function supportsFixedBackground() {
    const el = document.createElement('div');
    el.style.backgroundAttachment = 'fixed';
    // Verifica se a propriedade foi aceita e se não é um dispositivo móvel
    return (el.style.backgroundAttachment === 'fixed') &&
        !(/iPad|iPhone|iPod|Android/.test(navigator.userAgent));
}

/*if (!supportsFixedBackground()) {
    const parallaxImages = document.querySelectorAll('.parallax-img');
    parallaxImages.forEach(img => {
        img.classList.remove('parallax-img');
    });
}*/

//animate();

const parallaxItems = document.querySelectorAll('.parallax-container');

const activeItems = new Set();
let ticking = false;

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            activeItems.add(entry.target);
        } else {
            activeItems.delete(entry.target);
        }
    });
}, {
    threshold: 0
});

parallaxItems.forEach(item => observer.observe(item));

function onScroll() {
    if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
    }
}

function updateParallax() {
    activeItems.forEach(container => {
        const img = container.querySelector('.parallax-img');
        if (!img) return;

        const rect = container.getBoundingClientRect();
        const distanceFromCenter =
            rect.top + rect.height / 2 - window.innerHeight / 2;

        img.style.transform = `translateY(${-distanceFromCenter * 0.3}px)`;
    });

    ticking = false;
}

window.addEventListener('scroll', onScroll, { passive: true });

function centerMaryContainer() {
    const heroWrapper = document.querySelector('.hero-wrapper');
    const maryContainer = document.querySelector('.mary-container');

    if (!heroWrapper || !maryContainer) return;

    const maryRect = maryContainer.getBoundingClientRect();
    const viewportCenter = window.innerWidth / 2;
    const maryCenter = maryRect.left + maryRect.width / 2;

    const offset = viewportCenter - maryCenter;

    heroWrapper.style.setProperty('--hero-offset-x', `${offset}px`);
}

window.addEventListener('load', centerMaryContainer);
window.addEventListener('resize', centerMaryContainer);
