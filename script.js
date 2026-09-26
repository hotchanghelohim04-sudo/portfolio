'use strict';

/*
 * Portfolio interactions. Vanilla JavaScript, no dependency.
 *
 * Every feature is optional: the page stays fully readable and usable without JavaScript,
 * and each module below checks that its elements exist before doing anything.
 * Motion is skipped when the visitor asks for reduced motion.
 */
(() => {
    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
    const root = document.documentElement;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const prefersReducedMotion = () => reducedMotionQuery.matches;
    const hasIntersectionObserver = 'IntersectionObserver' in window;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    /** Runs `fn` at most once per animation frame, always with the latest arguments. */
    const onFrame = (fn) => {
        let queued = false;
        let lastArgs = [];
        return (...args) => {
            lastArgs = args;
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => {
                queued = false;
                fn(...lastArgs);
            });
        };
    };

    /** One failing module must never break the others. */
    const safely = (name, fn) => {
        try {
            fn();
        } catch (error) {
            console.error(`[portfolio] ${name} failed`, error);
        }
    };

    /* ------------------------------------------------------------------ */
    /* Footer year                                                        */
    /* ------------------------------------------------------------------ */
    const initYear = () => {
        const element = $('#current-year');
        if (element) element.textContent = new Date().getFullYear();
    };

    /* ------------------------------------------------------------------ */
    /* Theme (dark by default). theme-init.js applies the saved choice     */
    /* before the first paint; this module handles the toggle button.     */
    /* ------------------------------------------------------------------ */
    const THEME_COLORS = { dark: '#04060d', light: '#f3f6fc' };

    const initTheme = () => {
        const button = $('.theme-toggle');
        const metaColor = $('meta[name="theme-color"]');
        const current = () => (root.dataset.theme === 'light' ? 'light' : 'dark');

        const apply = (theme) => {
            root.dataset.theme = theme;
            if (metaColor) metaColor.setAttribute('content', THEME_COLORS[theme]);
            if (button) {
                button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
            }
            window.dispatchEvent(new CustomEvent('themechange'));
        };

        apply(current());
        if (!button) return;

        button.addEventListener('click', () => {
            const next = current() === 'light' ? 'dark' : 'light';
            try {
                localStorage.setItem('theme', next);
            } catch (error) {
                // storage can be blocked (private mode, strict privacy settings)
            }

            if (!document.startViewTransition || prefersReducedMotion()) {
                apply(next);
                return;
            }

            // Circular reveal that grows from the button
            const box = button.getBoundingClientRect();
            const x = box.left + box.width / 2;
            const y = box.top + box.height / 2;
            const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
            const transition = document.startViewTransition(() => apply(next));
            transition.ready
                .then(() => {
                    root.animate(
                        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
                        { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
                    );
                })
                .catch(() => {});
        });
    };

    /* ------------------------------------------------------------------ */
    /* Header: scrolled state, progress bar, mobile menu, active section  */
    /* ------------------------------------------------------------------ */
    const initHeader = () => {
        const header = $('.site-header');
        const navList = $('#nav-links');
        if (!header || !navList) return;

        const menuButton = $('.menu-btn');
        const progress = $('.scroll-progress');
        const pill = $('.nav-pill', navList);
        const links = $$('a', navList);
        const mobileQuery = window.matchMedia('(max-width: 960px)');

        // Scroll progress + condensed header
        const onScroll = onFrame(() => {
            header.classList.toggle('is-scrolled', window.scrollY > 24);
            if (progress) {
                const max = root.scrollHeight - window.innerHeight;
                progress.style.setProperty('--p', max > 0 ? clamp(window.scrollY / max, 0, 1).toFixed(4) : '0');
            }
        });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        onScroll();

        // Mobile menu (full-screen overlay). While it is open, the page behind is inert.
        const setMenu = (open, returnFocus = false) => {
            if (!menuButton) return;
            navList.classList.toggle('is-open', open);
            menuButton.setAttribute('aria-expanded', String(open));
            menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            document.body.classList.toggle('no-scroll', open);
            [$('main'), $('.site-footer')].forEach((element) => {
                if (element) element.inert = open;
            });
            if (open && links[0]) links[0].focus({ preventScroll: true });
            if (!open && returnFocus) menuButton.focus();
        };

        if (menuButton) {
            menuButton.addEventListener('click', () => setMenu(!navList.classList.contains('is-open')));
        }
        links.forEach((link) => {
            link.addEventListener('click', () => {
                if (navList.classList.contains('is-open')) setMenu(false);
            });
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navList.classList.contains('is-open')) setMenu(false, true);
        });
        mobileQuery.addEventListener('change', () => setMenu(false));

        // Sliding pill behind the active link
        const movePill = () => {
            if (!pill) return;
            const active = links.find((link) => link.getAttribute('aria-current') === 'true');
            if (!active || mobileQuery.matches) {
                pill.classList.remove('is-visible');
                return;
            }
            const box = active.getBoundingClientRect();
            const parent = navList.getBoundingClientRect();
            pill.style.setProperty('--pill-x', `${(box.left - parent.left).toFixed(1)}px`);
            pill.style.setProperty('--pill-w', `${box.width.toFixed(1)}px`);
            pill.classList.add('is-visible');
        };

        const setActive = (id) => {
            links.forEach((link) => {
                if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'true');
                else link.removeAttribute('aria-current');
            });
            movePill();
        };

        // Active section = the one crossing the middle of the viewport
        if (hasIntersectionObserver) {
            const sections = links.map((link) => $(link.getAttribute('href'))).filter(Boolean);
            const visible = new Map();
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting));
                    const current = sections.filter((section) => visible.get(section.id)).pop();
                    if (current) setActive(current.id);
                },
                { rootMargin: '-45% 0px -50% 0px' }
            );
            sections.forEach((section) => observer.observe(section));
        }

        window.addEventListener('resize', onFrame(movePill));
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);
    };

    /* ------------------------------------------------------------------ */
    /* Scroll reveal. Only elements that start below the fold are hidden, */
    /* so there is never a flash and nothing depends on JavaScript.       */
    /* ------------------------------------------------------------------ */
    const initReveal = () => {
        // Stagger inside groups
        $$('[data-stagger]').forEach((group) => {
            $$('[data-reveal]', group).forEach((element, index) => {
                element.style.setProperty('--d', `${index * 80}ms`);
            });
        });

        if (prefersReducedMotion() || !hasIntersectionObserver) return;

        const pending = $$('[data-reveal]').filter((element) => element.getBoundingClientRect().top >= window.innerHeight * 0.9);
        pending.forEach((element) => element.classList.add('will-reveal'));

        // Once revealed, hand the element back to its normal hover transitions
        const finish = (element) => {
            element.classList.remove('will-reveal', 'is-visible');
            element.style.removeProperty('--d');
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const element = entry.target;
                    observer.unobserve(element);
                    element.classList.add('is-visible');
                    const onEnd = (event) => {
                        if (event.target !== element || event.propertyName !== 'opacity') return;
                        element.removeEventListener('transitionend', onEnd);
                        finish(element);
                    };
                    element.addEventListener('transitionend', onEnd);
                    setTimeout(() => finish(element), 2000);
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
        );
        pending.forEach((element) => observer.observe(element));
    };

    /* ------------------------------------------------------------------ */
    /* Counters: numbers are computed from the page itself                */
    /* ------------------------------------------------------------------ */
    const initCounters = () => {
        const certifications = $$('.cert-card').length;
        const skills = $$('.skill-card .chip').length;
        const years = Math.max(0, Math.floor((Date.now() - new Date(2023, 3, 1).getTime()) / (365.25 * 86400000)));
        const values = [certifications, skills, years];

        const numbers = $$('[data-count]');
        numbers.forEach((element, index) => {
            if (values[index] !== undefined) element.dataset.count = String(values[index]);
        });
        const show = (element, value) => {
            element.textContent = `${value}${element.dataset.suffix || ''}`;
        };
        numbers.forEach((element) => show(element, element.dataset.count));

        if (prefersReducedMotion() || !hasIntersectionObserver) return;

        const animate = (element) => {
            const end = Number(element.dataset.count);
            const duration = 1400;
            const start = performance.now();
            const tick = (now) => {
                const t = clamp((now - start) / duration, 0, 1);
                const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
                show(element, Math.round(end * eased));
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };

        numbers.forEach((element) => show(element, 0));
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    observer.unobserve(entry.target);
                    animate(entry.target);
                });
            },
            { threshold: 0.6 }
        );
        numbers.forEach((element) => observer.observe(element));
    };

    /* ------------------------------------------------------------------ */
    /* Hero terminal: types the commands, prints the answers              */
    /* ------------------------------------------------------------------ */
    const initTerminal = () => {
        const body = $('.terminal-body');
        if (!body) return;

        const count = $('.tl-count', body);
        if (count) count.textContent = String($$('.cert-card').length);
        if (prefersReducedMotion()) return; // the full text is already in the HTML

        const lines = $$('.tl', body);
        const typedElements = $$('.typed', body);
        const texts = typedElements.map((element) => element.textContent);
        typedElements.forEach((element) => {
            element.textContent = '';
        });
        lines.forEach((line) => line.classList.add('is-pending'));

        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        (async () => {
            await sleep(900);
            for (const line of lines) {
                line.classList.remove('is-pending');
                const typed = $('.typed', line);
                if (typed) {
                    const text = texts[typedElements.indexOf(typed)];
                    for (const character of text) {
                        typed.textContent += character;
                        await sleep(38 + Math.random() * 42);
                    }
                    await sleep(320);
                } else if (!line.classList.contains('tl-last')) {
                    await sleep(260);
                }
            }
        })();
    };

    /* ------------------------------------------------------------------ */
    /* Hero background: a small interactive network of nodes and packets  */
    /* ------------------------------------------------------------------ */
    const initNetwork = () => {
        const canvas = $('.hero-canvas');
        const hero = $('.hero');
        if (!canvas || !hero || !canvas.getContext) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        let width = 0;
        let height = 0;
        let nodes = [];
        let packets = [];
        let running = false;
        let heroVisible = true;
        let frameId = 0;
        let lastTime = 0;
        let packetTimer = 0;
        let slowFrames = 0;
        let lowPower = false;
        let colorA = '34,224,255';
        let colorB = '45,255,176';
        const pointer = { x: 0, y: 0, active: false };

        const readColors = () => {
            const style = getComputedStyle(root);
            const parse = (name, fallback) => {
                const value = style.getPropertyValue(name).trim();
                return value ? value.split(/\s+/).join(',') : fallback;
            };
            colorA = parse('--net-rgb', colorA);
            colorB = parse('--net-rgb-2', colorB);
        };

        const makeNode = () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.36,
            vy: (Math.random() - 0.5) * 0.36,
            r: 1 + Math.random() * 1.5,
            hot: Math.random() < 0.16,
        });

        const linkDistance = () => clamp(width * 0.14, 90, 165);

        const draw = (dt) => {
            context.clearRect(0, 0, width, height);
            const maxDistance = linkDistance();
            const maxSquared = maxDistance * maxDistance;

            for (const node of nodes) {
                if (dt) {
                    node.x += node.vx * dt;
                    node.y += node.vy * dt;
                    if (node.x < -20) node.x = width + 20;
                    else if (node.x > width + 20) node.x = -20;
                    if (node.y < -20) node.y = height + 20;
                    else if (node.y > height + 20) node.y = -20;
                    if (pointer.active) {
                        const dx = pointer.x - node.x;
                        const dy = pointer.y - node.y;
                        const squared = dx * dx + dy * dy;
                        if (squared < 22500 && squared > 1) {
                            const pull = (1 - squared / 22500) * 0.012 * dt;
                            node.x += dx * pull;
                            node.y += dy * pull;
                        }
                    }
                }
            }

            // Links
            context.lineWidth = 1;
            for (let i = 0; i < nodes.length; i += 1) {
                for (let j = i + 1; j < nodes.length; j += 1) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const squared = dx * dx + dy * dy;
                    if (squared > maxSquared) continue;
                    const alpha = Math.pow(1 - Math.sqrt(squared) / maxDistance, 1.6) * 0.42;
                    context.strokeStyle = `rgba(${colorA},${alpha.toFixed(3)})`;
                    context.beginPath();
                    context.moveTo(nodes[i].x, nodes[i].y);
                    context.lineTo(nodes[j].x, nodes[j].y);
                    context.stroke();
                }
            }

            // Links to the pointer
            if (pointer.active) {
                const reach = maxDistance * 1.3;
                for (const node of nodes) {
                    const distance = Math.hypot(pointer.x - node.x, pointer.y - node.y);
                    if (distance > reach) continue;
                    const alpha = Math.pow(1 - distance / reach, 1.4) * 0.6;
                    context.strokeStyle = `rgba(${colorB},${alpha.toFixed(3)})`;
                    context.beginPath();
                    context.moveTo(pointer.x, pointer.y);
                    context.lineTo(node.x, node.y);
                    context.stroke();
                }
            }

            // Nodes
            for (const node of nodes) {
                const color = node.hot ? colorB : colorA;
                if (node.hot) {
                    context.fillStyle = `rgba(${color},0.14)`;
                    context.beginPath();
                    context.arc(node.x, node.y, node.r * 4.2, 0, Math.PI * 2);
                    context.fill();
                }
                context.fillStyle = `rgba(${color},0.9)`;
                context.beginPath();
                context.arc(node.x, node.y, node.r, 0, Math.PI * 2);
                context.fill();
            }

            // Packets travelling along links
            packets = packets.filter((packet) => packet.t < 1);
            for (const packet of packets) {
                packet.t += 0.018 * (dt || 0);
                const x = packet.a.x + (packet.b.x - packet.a.x) * packet.t;
                const y = packet.a.y + (packet.b.y - packet.a.y) * packet.t;
                context.fillStyle = `rgba(${colorB},0.22)`;
                context.beginPath();
                context.arc(x, y, 6, 0, Math.PI * 2);
                context.fill();
                context.fillStyle = `rgba(${colorB},1)`;
                context.beginPath();
                context.arc(x, y, 2.2, 0, Math.PI * 2);
                context.fill();
            }
        };

        const spawnPacket = () => {
            if (packets.length >= 5 || nodes.length < 2) return;
            const maxDistance = linkDistance();
            const a = nodes[Math.floor(Math.random() * nodes.length)];
            const near = nodes.filter((b) => b !== a && Math.hypot(a.x - b.x, a.y - b.y) < maxDistance);
            if (near.length) packets.push({ a, b: near[Math.floor(Math.random() * near.length)], t: 0 });
        };

        const resize = () => {
            const box = canvas.getBoundingClientRect();
            width = box.width;
            height = box.height;
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            const target = Math.round(clamp(Math.round((width * height) / 16000), 26, 80) * (lowPower ? 0.5 : 1));
            while (nodes.length < target) nodes.push(makeNode());
            nodes.length = Math.min(nodes.length, target);
            if (!running) draw(0);
        };

        const loop = (now) => {
            if (!running) return;
            const dt = clamp((now - lastTime) / 16.667, 0, 2.5);
            lastTime = now;

            // Adaptive quality: on a slow device, halve the number of nodes and drop the packets
            if (!lowPower) {
                slowFrames = dt > 1.9 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
                if (slowFrames > 45) {
                    lowPower = true;
                    nodes.length = Math.ceil(nodes.length / 2);
                    packets = [];
                    window.clearInterval(packetTimer);
                }
            }

            draw(dt);
            frameId = requestAnimationFrame(loop);
        };

        const start = () => {
            if (running || prefersReducedMotion() || !heroVisible || document.hidden) return;
            running = true;
            lastTime = performance.now();
            frameId = requestAnimationFrame(loop);
            if (!lowPower) packetTimer = window.setInterval(spawnPacket, 900);
        };

        const stop = () => {
            running = false;
            cancelAnimationFrame(frameId);
            window.clearInterval(packetTimer);
        };

        readColors();
        resize();
        start();

        hero.addEventListener('pointermove', (event) => {
            const box = canvas.getBoundingClientRect();
            pointer.x = event.clientX - box.left;
            pointer.y = event.clientY - box.top;
            pointer.active = true;
        });
        hero.addEventListener('pointerleave', () => {
            pointer.active = false;
        });

        if (hasIntersectionObserver) {
            new IntersectionObserver((entries) => {
                heroVisible = entries[0].isIntersecting;
                if (heroVisible) start();
                else stop();
            }).observe(hero);
        }
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stop();
            else start();
        });
        if (window.ResizeObserver) new ResizeObserver(onFrame(resize)).observe(hero);
        else window.addEventListener('resize', onFrame(resize));
        window.addEventListener('themechange', () => {
            readColors();
            if (!running) draw(0);
        });
        reducedMotionQuery.addEventListener('change', () => {
            if (prefersReducedMotion()) {
                stop();
                draw(0);
            } else {
                start();
            }
        });
    };

    /* ------------------------------------------------------------------ */
    /* Pointer effects (mouse devices only): spotlight, tilt, magnetic     */
    /* buttons, soft cursor light                                          */
    /* ------------------------------------------------------------------ */
    const initPointerEffects = () => {
        if (!finePointerQuery.matches) return;

        // Spotlight: the card under the mouse gets --mx / --my
        document.addEventListener(
            'pointermove',
            onFrame((event) => {
                const card = event.target.closest && event.target.closest('[data-spotlight]');
                if (!card) return;
                const box = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${(event.clientX - box.left).toFixed(1)}px`);
                card.style.setProperty('--my', `${(event.clientY - box.top).toFixed(1)}px`);
            }),
            { passive: true }
        );

        if (prefersReducedMotion()) return;

        // 3D tilt
        $$('[data-tilt]').forEach((element) => {
            const maxAngle = 7;
            element.addEventListener('pointermove', (event) => {
                const box = element.getBoundingClientRect();
                const px = (event.clientX - box.left) / box.width - 0.5;
                const py = (event.clientY - box.top) / box.height - 0.5;
                element.style.setProperty('--rx', `${(-py * maxAngle).toFixed(2)}deg`);
                element.style.setProperty('--ry', `${(px * maxAngle).toFixed(2)}deg`);
            });
            element.addEventListener('pointerleave', () => {
                element.style.setProperty('--rx', '0deg');
                element.style.setProperty('--ry', '0deg');
            });
        });

        // Magnetic buttons
        $$('[data-magnetic]').forEach((element) => {
            element.addEventListener('pointermove', (event) => {
                const box = element.getBoundingClientRect();
                const x = event.clientX - (box.left + box.width / 2);
                const y = event.clientY - (box.top + box.height / 2);
                element.style.setProperty('--tx', `${(x * 0.18).toFixed(1)}px`);
                element.style.setProperty('--ty', `${(y * 0.3).toFixed(1)}px`);
            });
            element.addEventListener('pointerleave', () => {
                element.style.removeProperty('--tx');
                element.style.removeProperty('--ty');
            });
        });

        // Soft light following the cursor (eased)
        const glow = $('.cursor-glow');
        if (glow) {
            let x = window.innerWidth / 2;
            let y = window.innerHeight / 2;
            let targetX = x;
            let targetY = y;
            let animating = false;
            const tick = () => {
                x += (targetX - x) * 0.14;
                y += (targetY - y) * 0.14;
                glow.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
                if (Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5) requestAnimationFrame(tick);
                else animating = false;
            };
            document.addEventListener(
                'pointermove',
                (event) => {
                    targetX = event.clientX;
                    targetY = event.clientY;
                    glow.classList.add('is-active');
                    if (!animating) {
                        animating = true;
                        requestAnimationFrame(tick);
                    }
                },
                { passive: true }
            );
            root.addEventListener('mouseleave', () => glow.classList.remove('is-active'));
        }
    };

    /* ------------------------------------------------------------------ */
    /* Timelines: the line fills as the section is scrolled               */
    /* ------------------------------------------------------------------ */
    const initTimelines = () => {
        const timelines = $$('[data-timeline]');
        if (!timelines.length) return;

        const update = onFrame(() => {
            const readingLine = window.innerHeight * 0.62;
            timelines.forEach((timeline) => {
                const box = timeline.getBoundingClientRect();
                timeline.style.setProperty('--progress', clamp((readingLine - box.top) / box.height, 0, 1).toFixed(4));
                $$('.tl-item', timeline).forEach((item) => {
                    item.classList.toggle('is-passed', item.getBoundingClientRect().top + 40 < readingLine);
                });
            });
        });
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    };

    /* ------------------------------------------------------------------ */
    /* Certifications: filter by issuer                                   */
    /* ------------------------------------------------------------------ */
    const initCertFilters = () => {
        const bar = $('.cert-filters');
        const grid = $('.cert-grid');
        const status = $('#cert-status');
        if (!bar || !grid) return;

        const cards = $$('.cert-card', grid);
        const preferred = ['ISC2', 'Google', 'Cisco NetAcad', 'Hack & Fix', 'Other'];
        const present = [...new Set(cards.map((card) => card.dataset.issuer))];
        const issuers = [...preferred.filter((name) => present.includes(name)), ...present.filter((name) => !preferred.includes(name))];
        const label = (name) => (name === 'all' ? 'All' : name);
        const countOf = (name) => (name === 'all' ? cards.length : cards.filter((card) => card.dataset.issuer === name).length);

        bar.replaceChildren(
            ...['all', ...issuers].map((name) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'filter';
                button.dataset.filter = name;
                button.setAttribute('aria-pressed', String(name === 'all'));
                const count = document.createElement('span');
                count.className = 'filter-count';
                count.textContent = String(countOf(name));
                button.append(document.createTextNode(label(name)), count);
                return button;
            })
        );

        const apply = (name) => {
            $$('.filter', bar).forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === name)));
            let shown = 0;
            cards.forEach((card) => {
                const match = name === 'all' || card.dataset.issuer === name;
                const wasHidden = card.hidden;
                card.hidden = !match;
                if (!match) return;
                shown += 1;
                if (wasHidden && !prefersReducedMotion() && card.animate) {
                    card.animate(
                        [
                            { opacity: 0, transform: 'translateY(14px) scale(0.97)' },
                            { opacity: 1, transform: 'none' },
                        ],
                        { duration: 500, delay: shown * 45, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }
                    );
                }
            });
            if (status) {
                status.textContent = `Showing ${shown} of ${cards.length} certifications${name === 'all' ? '' : ` from ${label(name)}`}`;
            }
        };

        bar.addEventListener('click', (event) => {
            const button = event.target.closest('.filter');
            if (button) apply(button.dataset.filter);
        });
    };

    /* ------------------------------------------------------------------ */
    /* Copy to clipboard                                                  */
    /* ------------------------------------------------------------------ */
    const initCopy = () => {
        const buttons = $$('[data-copy]');
        if (!buttons.length) return;
        const toast = $('#toast');
        let toastTimer;

        const notify = (message) => {
            if (!toast) return;
            toast.textContent = message;
            toast.classList.add('is-visible');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
        };

        const copyText = async (text) => {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                const field = document.createElement('textarea');
                field.value = text;
                field.setAttribute('readonly', '');
                field.style.position = 'fixed';
                field.style.opacity = '0';
                document.body.appendChild(field);
                field.select();
                let copied = false;
                try {
                    copied = document.execCommand('copy');
                } catch (fallbackError) {
                    copied = false;
                }
                field.remove();
                return copied;
            }
        };

        buttons.forEach((button) => {
            button.addEventListener('click', async () => {
                const copied = await copyText(button.dataset.copy);
                notify(copied ? `${button.dataset.copyLabel || 'Text'} copied to clipboard` : 'Copy failed, please copy it manually');
                if (!copied) return;
                button.classList.add('is-copied');
                setTimeout(() => button.classList.remove('is-copied'), 1800);
            });
        });
    };

    /* ------------------------------------------------------------------ */
    /* Contact form (Netlify Forms)                                       */
    /* ------------------------------------------------------------------ */
    const initForm = () => {
        const form = $('#contact-form');
        if (!form) return;

        const submitButton = $('button[type="submit"]', form);
        const status = $('#form-status');
        const message = $('#message');
        const counter = $('#message-count');

        if (message && counter) {
            message.addEventListener('input', () => {
                counter.textContent = String(message.value.length);
            });
        }

        // Built with DOM APIs only, so what the visitor typed is never parsed as HTML.
        // Icons come from the SVG sprite in index.html.
        const showStatus = (type, iconName, text) => {
            const svgNs = 'http://www.w3.org/2000/svg';
            const icon = document.createElementNS(svgNs, 'svg');
            icon.setAttribute('class', 'icon');
            icon.setAttribute('aria-hidden', 'true');
            icon.setAttribute('focusable', 'false');
            const use = document.createElementNS(svgNs, 'use');
            use.setAttribute('href', `#i-${iconName}`);
            icon.appendChild(use);

            const paragraph = document.createElement('p');
            paragraph.textContent = text;

            status.className = `form-status form-status-${type}`;
            status.replaceChildren(icon, paragraph);
        };

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const data = new FormData(form);
            const name = String(data.get('name')).trim();

            // Native validation covers empty fields; this catches whitespace-only input
            const isBlank = ['name', 'email', 'subject', 'message'].some((field) => !String(data.get(field)).trim());
            if (isBlank) {
                showStatus('error', 'circle-exclamation', 'Please fill out all fields.');
                return;
            }

            status.className = 'form-status';
            status.replaceChildren(document.createTextNode('Sending your message...'));
            submitButton.dataset.loading = 'true';
            submitButton.setAttribute('aria-busy', 'true');

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams(data).toString(),
                });

                if (!response.ok) {
                    throw new Error(`Form submission failed (${response.status})`);
                }

                form.reset();
                if (counter) counter.textContent = '0';
                showStatus('success', 'circle-check', `Thank you, ${name}! Your message has been sent and I'll get back to you soon.`);
            } catch (error) {
                showStatus(
                    'error',
                    'circle-exclamation',
                    'Sorry, your message could not be sent. Please try again in a moment, or use the contact details next to this form.'
                );
            } finally {
                delete submitButton.dataset.loading;
                submitButton.removeAttribute('aria-busy');
            }
        });
    };

    /* ------------------------------------------------------------------ */
    safely('year', initYear);
    safely('theme', initTheme);
    safely('header', initHeader);
    safely('reveal', initReveal);
    safely('counters', initCounters);
    safely('terminal', initTerminal);
    safely('network', initNetwork);
    safely('pointer effects', initPointerEffects);
    safely('timelines', initTimelines);
    safely('certification filters', initCertFilters);
    safely('copy buttons', initCopy);
    safely('contact form', initForm);
})();
