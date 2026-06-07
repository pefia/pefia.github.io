/* Three.js nature particle scene — floating seeds/embers */
(function initNatureScene() {
    const canvas = document.getElementById('nature-canvas');
    if (!canvas || !window.THREE) return;

    const THREE = window.THREE;

    const W = canvas.offsetWidth || window.innerWidth;
    const H = canvas.offsetHeight || 480;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    /* ── Particle counts ── */
    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 160 : 360;

    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const speeds    = new Float32Array(COUNT);
    const offsets   = new Float32Array(COUNT);

    const palette = [
        new THREE.Color('#4c878f'),
        new THREE.Color('#3b6f76'),
        new THREE.Color('#86efac'),
        new THREE.Color('#a7f3d0'),
        new THREE.Color('#d1fae5'),
        new THREE.Color('#ffffff'),
    ];

    /* weight distribution — more teal than white */
    const weights = [0.25, 0.2, 0.2, 0.15, 0.1, 0.1];

    function weightedColor() {
        const r = Math.random();
        let acc = 0;
        for (let i = 0; i < weights.length; i++) {
            acc += weights[i];
            if (r < acc) return palette[i];
        }
        return palette[0];
    }

    for (let i = 0; i < COUNT; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 24;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

        const c = weightedColor();
        colors[i * 3]     = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;

        speeds[i]  = 0.001 + Math.random() * 0.0028;
        offsets[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: isMobile ? 0.055 : 0.075,
        vertexColors: true,
        transparent: true,
        opacity: 0.82,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    /* ── Second, slightly larger sparse layer for depth ── */
    const SPARSE = isMobile ? 30 : 60;
    const sPos = new Float32Array(SPARSE * 3);
    const sCol = new Float32Array(SPARSE * 3);

    for (let i = 0; i < SPARSE; i++) {
        sPos[i * 3]     = (Math.random() - 0.5) * 20;
        sPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
        sPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
        const c = new THREE.Color('#4c878f');
        sCol[i * 3] = c.r; sCol[i * 3 + 1] = c.g; sCol[i * 3 + 2] = c.b;
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
    const sMat = new THREE.PointsMaterial({
        size: 0.14,
        vertexColors: true,
        transparent: true,
        opacity: 0.3,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const sparsePoints = new THREE.Points(sGeo, sMat);
    const sparseSpeedsArr = new Float32Array(SPARSE).map(() => 0.0005 + Math.random() * 0.001);
    scene.add(sparsePoints);

    /* ── Mouse parallax ── */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    document.addEventListener('mousemove', (e) => {
        mouse.tx = (e.clientX / window.innerWidth  - 0.5) * 1.4;
        mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 0.9;
    }, { passive: true });

    /* ── Animation loop ── */
    const clock = new THREE.Clock();
    let raf;

    function animate() {
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        /* Main particles — drift up with sway */
        const pos = geo.attributes.position.array;
        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;
            pos[i3 + 1] += speeds[i];
            pos[i3]     += Math.sin(t * 0.35 + offsets[i]) * 0.001;
            if (pos[i3 + 1] > 7) {
                pos[i3 + 1] = -7;
                pos[i3]     = (Math.random() - 0.5) * 24;
                pos[i3 + 2] = (Math.random() - 0.5) * 10;
            }
        }
        geo.attributes.position.needsUpdate = true;

        /* Sparse slow layer */
        const sp = sGeo.attributes.position.array;
        for (let i = 0; i < SPARSE; i++) {
            sp[i * 3 + 1] += sparseSpeedsArr[i];
            if (sp[i * 3 + 1] > 6) sp[i * 3 + 1] = -6;
        }
        sGeo.attributes.position.needsUpdate = true;

        /* Camera parallax — eased */
        mouse.x += (mouse.tx - mouse.x) * 0.035;
        mouse.y += (mouse.ty - mouse.y) * 0.035;
        camera.position.x = mouse.x * 0.55;
        camera.position.y = mouse.y * 0.35;

        /* Very slow overall drift */
        points.rotation.z = Math.sin(t * 0.08) * 0.02;

        renderer.render(scene, camera);
    }

    /* ── Only render when visible ── */
    const section = canvas.closest('.nature-scene') || canvas.parentElement;
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                clock.start();
                animate();
            } else {
                cancelAnimationFrame(raf);
            }
        });
    }, { threshold: 0 });
    obs.observe(section);

    /* ── Resize ── */
    window.addEventListener('resize', () => {
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }, { passive: true });
})();
