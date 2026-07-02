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
        const canvas = document.getElementById('dotbackground');
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

            const EXPLOSION_RADIUS = 260;
            const EXPLOSION_STRENGTH = 26;

            window.addEventListener('click', function (e) {
                const homePage = document.getElementById('home');
                const isHomeActive = homePage && homePage.classList.contains('active');
                if (!isHomeActive) return;

                if (e.target.closest('.navigation, button, a, .pixelgrid, .icecreampic')) return;

                for (let i = 0; i < dots.length; i++) {
                    const dot = dots[i];
                    const dx = dot.x - e.clientX;
                    const dy = dot.y - e.clientY;
                    const dist = Math.hypot(dx, dy);

                    if (dist < EXPLOSION_RADIUS) {
                        const force = (1 - dist / EXPLOSION_RADIUS) * EXPLOSION_STRENGTH;
                        const angle = Math.atan2(dy, dx) || (Math.random() * Math.PI * 2);
                        dot.vx += Math.cos(angle) * force;
                        dot.vy += Math.sin(angle) * force;
                    }
                }
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

    
    try {
        if (typeof THREE === 'undefined') throw new Error('THREE.js did not load');

        const homeCanvas = document.getElementById('home-3d');
        if (homeCanvas) {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
            camera.position.z = 3.4;

            const renderer = new THREE.WebGLRenderer({ canvas: homeCanvas, alpha: true, antialias: true });
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            renderer.setPixelRatio(dpr);

            function sizeRenderer() {
                const size = homeCanvas.clientWidth || 190;
                renderer.setSize(size, size, false);
                camera.aspect = 1;
                camera.updateProjectionMatrix();
            }
            sizeRenderer();
            window.addEventListener('resize', sizeRenderer);

            const geometry = new THREE.IcosahedronGeometry(1.3, 0);
            const edges = new THREE.EdgesGeometry(geometry);
            const material = new THREE.LineBasicMaterial({ color: 0x2563eb });
            const wireframe = new THREE.LineSegments(edges, material);
            scene.add(wireframe);

            const fillMaterial = new THREE.MeshBasicMaterial({
                color: 0x60a5fa,
                transparent: true,
                opacity: 0.06,
                side: THREE.DoubleSide
            });
            const fillMesh = new THREE.Mesh(geometry, fillMaterial);
            scene.add(fillMesh);

            let targetTiltX = 0;
            let targetTiltY = 0;

            window.addEventListener('mousemove', function (e) {
                const nx = (e.clientX / window.innerWidth) * 2 - 1;
                const ny = (e.clientY / window.innerHeight) * 2 - 1;
                targetTiltY = nx * 0.5;
                targetTiltX = ny * 0.35;
            });

            function animateHome3D() {
                wireframe.rotation.y += 0.006 + targetTiltY * 0.002;
                wireframe.rotation.x += 0.0015 + targetTiltX * 0.002;
                fillMesh.rotation.copy(wireframe.rotation);

                renderer.render(scene, camera);
                requestAnimationFrame(animateHome3D);
            }
            animateHome3D();
        }
    } catch (err) {
        console.error('Home 3D object setup failed:', err);
    }

    
    try {
        if (typeof THREE === 'undefined') throw new Error('THREE.js did not load');
        if (typeof THREE.GLTFLoader === 'undefined') throw new Error('GLTFLoader did not load');

        const notepadCanvas = document.getElementById('notepad-3d');
        if (notepadCanvas) {
            const MODEL_PATH = 'notepad.glb';

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
            camera.position.set(0, 0, 3.6);

            scene.add(new THREE.AmbientLight(0xffffff, 0.9));
            const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
            keyLight.position.set(2, 3, 4);
            scene.add(keyLight);

            const renderer = new THREE.WebGLRenderer({ canvas: notepadCanvas, alpha: true, antialias: true });
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            renderer.setPixelRatio(dpr);

            function sizeNotepad() {
                const w = notepadCanvas.clientWidth || 300;
                const h = notepadCanvas.clientHeight || 360;
                renderer.setSize(w, h, false);
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            }
            sizeNotepad();
            window.addEventListener('resize', sizeNotepad);

            const group = new THREE.Group();
            scene.add(group);

            const loader = new THREE.GLTFLoader();
            loader.load(
                MODEL_PATH,
                function (gltf) {
                    const model = gltf.scene;

                    const box = new THREE.Box3().setFromObject(model);
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    const center = new THREE.Vector3();
                    box.getCenter(center);
                    model.position.sub(center);
                    const maxDim = Math.max(size.x, size.y, size.z) || 1;
                    const scale = 2.1 / maxDim;
                    model.scale.setScalar(scale);

                    group.add(model);
                },
                undefined,
                function (err) {
                    console.error('could not load notepad model (check MODEL_PATH):', err);
                }
            );

            function animateNotepad() {
                group.rotation.y += 0.012;
                group.rotation.x = Math.sin(Date.now() * 0.0006) * 0.14;
                renderer.render(scene, camera);
                requestAnimationFrame(animateNotepad);
            }
            animateNotepad();
        }
    } catch (err) {
        console.error('Notepad 3D object setup failed:', err);
    }

    
    try {
        const grid = document.getElementById('pixel-grid');
        const paletteEl = document.getElementById('pixel-palette');
        const clearBtn = document.getElementById('pixel-clear');

        if (grid && paletteEl) {
            const COLORS = ['#2563eb', '#60a5fa', '#93c5fd', '#1e3a8a', '#f43f5e', '#f8fafc'];
            let currentColor = COLORS[0];
            let painting = false;

            const GRID_SIZE = 10;
            for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
                const cell = document.createElement('div');
                cell.className = 'pixel-cell';
                cell.addEventListener('mousedown', function () {
                    painting = true;
                    cell.style.backgroundColor = currentColor;
                });
                cell.addEventListener('mouseenter', function () {
                    if (painting) cell.style.backgroundColor = currentColor;
                });
                grid.appendChild(cell);
            }

            window.addEventListener('mouseup', function () {
                painting = false;
            });

            COLORS.forEach(function (color, i) {
                const swatch = document.createElement('button');
                swatch.type = 'button';
                swatch.className = 'palette-swatch' + (i === 0 ? ' active' : '');
                swatch.style.backgroundColor = color;
                if (color === '#f8fafc') swatch.style.border = '1px solid #cbd5e1';
                swatch.addEventListener('click', function () {
                    currentColor = color;
                    paletteEl.querySelectorAll('.palette-swatch').forEach(function (s) {
                        s.classList.remove('active');
                    });
                    swatch.classList.add('active');
                });
                paletteEl.appendChild(swatch);
            });

            if (clearBtn) {
                clearBtn.addEventListener('click', function () {
                    grid.querySelectorAll('.pixel-cell').forEach(function (cell) {
                        cell.style.backgroundColor = '';
                    });
                });
            }
        }
    } catch (err) {
        console.error('Pixel art app setup failed:', err);
    }


    try {
        const img = document.getElementById('icecreamimg');
        const btn = document.getElementById('icecream-btn');

        if (img && btn) {
            const FALLBACK_IMAGES = [
                'https://commons.wikimedia.org/wiki/Special:FilePath/Ice_cream_3.jpg',
                'https://commons.wikimedia.org/wiki/Special:FilePath/Ice_cream_sundae.jpg',
                'https://commons.wikimedia.org/wiki/Special:FilePath/Ice_Cream.jpg',
                'https://commons.wikimedia.org/wiki/Special:FilePath/Colourful_ice_cream.jpg',
                'https://commons.wikimedia.org/wiki/Special:FilePath/Ice_cream_cone.jpg',
                'https://commons.wikimedia.org/wiki/Special:FilePath/IceCream.jpg'
            ];

            function setImage(url) {
                img.src = url;
            }

            function fallbackPic() {
                const pick = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
                setImage(pick);
            }

            async function fetchIceCreamPic() {
                btn.disabled = true;
                btn.textContent = 'Loading...';
                try {
                    const apiUrl = 'https://commons.wikimedia.org/w/api.php'
                        + '?action=query&generator=search&gsrsearch=ice%20cream'
                        + '&gsrnamespace=6&gsrlimit=30&prop=imageinfo&iiprop=url'
                        + '&iiurlwidth=400&format=json&origin=*';
                    const res = await fetch(apiUrl);
                    if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
                    const data = await res.json();
                    const pages = data && data.query && data.query.pages;
                    if (!pages) throw new Error('No pages in response');

                    const candidates = Object.values(pages)
                        .map(function (p) {
                            return p.imageinfo && p.imageinfo[0] &&
                                (p.imageinfo[0].thumburl || p.imageinfo[0].url);
                        })
                        .filter(Boolean);

                    if (candidates.length === 0) throw new Error('No usable images found');
                    const pick = candidates[Math.floor(Math.random() * candidates.length)];
                    setImage(pick);
                } catch (err) {
                    console.error('Ice cream API call failed, using fallback:', err);
                    fallbackPic();
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Another pic';
                }
            }

            btn.addEventListener('click', fetchIceCreamPic);
            fetchIceCreamPic();
        }
    } catch (err) {
        console.error('Ice cream widget setup failed:', err);
    }

});