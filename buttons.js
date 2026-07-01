document.addEventListener('DOMContentLoaded', function () {

    try {
        const navButtons = document.querySelectorAll('.nav-item[data-page]');
        navButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const pageId = btn.getAttribute('data-page');

                document.querySelectorAll('.page').forEach(function (page) {
                    page.classList.remove('active');
                });
                navButtons.forEach(function (b) {
                    b.classList.remove('active');
                });

                const target = document.getElementById(pageId);
                if (target) target.classList.add('active');
                btn.classList.add('active');
            });
        });
    } catch (err) {
        console.error('Nav setup failed:', err);
    }

    try {
        function updateTime() {
            const timeElement = document.getElementById('live-time');
            if (timeElement) {
                const now = new Date();
                timeElement.textContent = now.toTimeString().split(' ')[0];
            }
        }
        updateTime();
        setInterval(updateTime, 1000);
    } catch (err) {
        console.error('Clock setup failed:', err);
    }

    try {
        const glowUnits = [];

        function wrapForGlow(el) {
            const isTitle = el.classList.contains('hero-title');
            const text = el.textContent;
            const pieces = isTitle ? text.split('') : text.trim().split(/(\s+)/);

            el.textContent = '';
            pieces.forEach(function (piece) {
                if (piece === '') return;
                if (!isTitle && /^\s+$/.test(piece)) {
                    el.appendChild(document.createTextNode(piece));
                    return;
                }
                const span = document.createElement('span');
                span.className = 'glow-unit';
                span.textContent = piece;
                el.appendChild(span);
                glowUnits.push(span);
            });
        }

        const glowTargets = document.querySelectorAll('[data-glow-text]');
        glowTargets.forEach(wrapForGlow);

        if (glowUnits.length > 0) {
            const GLOW_RADIUS = 150; 
            let mouseX = -9999;
            let mouseY = -9999;
            let frameQueued = false;

            function applyGlow() {
                frameQueued = false;
                for (let i = 0; i < glowUnits.length; i++) {
                    const span = glowUnits[i];
                    const rect = span.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const dist = Math.hypot(mouseX - cx, mouseY - cy);
                    const intensity = Math.max(0, 1 - dist / GLOW_RADIUS);

                    if (intensity <= 0.02) {
                        span.style.textShadow = 'none';
                        span.style.color = '';
                    } else {
                        const blur1 = Math.round(intensity * 14);
                        const blur2 = Math.round(intensity * 34);
                        const a1 = Math.min(1, intensity * 0.95).toFixed(2);
                        const a2 = Math.min(1, intensity * 0.65).toFixed(2);
                        span.style.textShadow =
                            '0 0 ' + blur1 + 'px rgba(59,130,246,' + a1 + '), ' +
                            '0 0 ' + blur2 + 'px rgba(37,99,235,' + a2 + ')';
                        span.style.color = intensity > 0.5 ? '#1d4ed8' : '';
                    }
                }
            }

            function queueGlow() {
                if (!frameQueued) {
                    frameQueued = true;
                    requestAnimationFrame(applyGlow);
                }
            }

            window.addEventListener('mousemove', function (e) {
                mouseX = e.clientX;
                mouseY = e.clientY;
                queueGlow();
            });

            window.addEventListener('mouseleave', function () {
                mouseX = -9999;
                mouseY = -9999;
                queueGlow();
            });
        }
    } catch (err) {
        console.error('Glow text setup failed:', err);
    }

    try {
        const canvas = document.getElementById('dot-field');
        if (canvas && canvas.getContext) {
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;

            let width, height, dots;
            const SPACING = 36;
            const REPEL_RADIUS = 110;
            const REPEL_STRENGTH = 30;
            const SPRING = 0.08;
            const FRICTION = 0.82;

            const cursor = { x: -9999, y: -9999 };

            function buildDots() {
                dots = [];
                const cols = Math.ceil(width / SPACING) + 1;
                const rows = Math.ceil(height / SPACING) + 1;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const homeX = c * SPACING;
                        const homeY = r * SPACING;
                        dots.push({ homeX: homeX, homeY: homeY, x: homeX, y: homeY, vx: 0, vy: 0 });
                    }
                }
            }

            function resize() {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                buildDots();
            }

            window.addEventListener('resize', resize);
            window.addEventListener('mousemove', function (e) {
                cursor.x = e.clientX;
                cursor.y = e.clientY;
            });
            window.addEventListener('mouseleave', function () {
                cursor.x = -9999;
                cursor.y = -9999;
            });

            function tick() {
                ctx.clearRect(0, 0, width, height);

                for (let i = 0; i < dots.length; i++) {
                    const dot = dots[i];
                    const dx = dot.x - cursor.x;
                    const dy = dot.y - cursor.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < REPEL_RADIUS) {
                        const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
                        const angle = Math.atan2(dy, dx);
                        dot.vx += Math.cos(angle) * force * 0.05;
                        dot.vy += Math.sin(angle) * force * 0.05;
                    }

                    dot.vx += (dot.homeX - dot.x) * SPRING;
                    dot.vy += (dot.homeY - dot.y) * SPRING;
                    dot.vx *= FRICTION;
                    dot.vy *= FRICTION;
                    dot.x += dot.vx;
                    dot.y += dot.vy;

                    const displacement = Math.hypot(dot.x - dot.homeX, dot.y - dot.homeY);
                    const glow = Math.min(1, displacement / 16);
                    const radius = 2.2 + glow * 2.2;
                    const alpha = 0.55 + glow * 0.45;

                    ctx.beginPath();
                    ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(37, 99, 235, ' + alpha + ')';
                    ctx.fill();
                }

                requestAnimationFrame(tick);
            }

            resize();
            requestAnimationFrame(tick);
        }
    } catch (err) {
        console.error('Dot field setup failed:', err);
    }

});