// 化学实验室模拟器 - Three.js 游戏逻辑

class ChemistryLab {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.beakers = [];
        this.selectedPotion = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.particles = [];
        this.animations = [];

        // Potion Configuration
        this.potionConfig = {
            red: { color: 0xff4444, name: 'Red Potion', viscosity: 1.0 },
            blue: { color: 0x4444ff, name: 'Blue Potion', viscosity: 1.0 },
            yellow: { color: 0xffff44, name: 'Yellow Potion', viscosity: 1.0 },
            pink: { color: 0xff69b4, name: 'Pink Potion', viscosity: 0.8 },
            green: { color: 0x44ff44, name: 'Green Potion', viscosity: 1.2 }
        };

        // Chemical Reaction Rules
        this.reactionRules = {
            'red+blue': { type: 'explosion', result: 0x8800ff, name: '💥🎆 MASSIVE EXPLOSION! 🎆💥' },
            'red+yellow': { type: 'bubbles', result: 0xff8800, name: '🫧✨ BUBBLING REACTION! ✨🫧' },
            'blue+yellow': { type: 'freeze', result: 0x00ffff, name: '❄️🧊 FROZEN SOLID! 🧊❄️' },
            'pink+yellow': { type: 'viscous', result: 0xffaa00, name: '🍯💧 VISCOUS MIXTURE! 💧🍯' },
            'green+red': { type: 'jelly', result: 0x88ff44, name: '🍮🎉 JELLY FORMING! 🎉🍮' },
            'green+blue': { type: 'bubbles', result: 0x0088ff, name: '🫧🌊 BUBBLING UP! 🌊🫧' },
            'pink+blue': { type: 'none', result: 0xaa44aa, name: '⚪💭 NO REACTION 💭⚪' },
            'pink+green': { type: 'glow', result: 0x88ff88, name: '✨🌟 GLOWING BRIGHT! 🌟✨' },
            'red+green': { type: 'viscous', result: 0x888800, name: '🍯🌿 STICKY GOO! 🌿🍯' },
            'yellow+green': { type: 'jelly', result: 0xaaff44, name: '🍮⚡ SOLIDIFYING! ⚡🍮' }
        };

        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

        // 创建相机 - 更水平的视角
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 3, 12);
        this.camera.lookAt(0, 2.5, 0);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // 添加光照
        this.setupLighting();

        // 创建实验室环境
        this.createLabEnvironment();

        // 添加第一个烧杯
        this.addBeaker();
    }

    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 主光源
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);

        // 点光源（实验室氛围）
        const pointLight1 = new THREE.PointLight(0x4444ff, 0.5, 20);
        pointLight1.position.set(-5, 5, 5);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff4444, 0.5, 20);
        pointLight2.position.set(5, 5, 5);
        this.scene.add(pointLight2);

        // 聚光灯
        const spotLight = new THREE.SpotLight(0xffffff, 1);
        spotLight.position.set(0, 10, 0);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.3;
        spotLight.castShadow = true;
        this.scene.add(spotLight);
    }

    createLabEnvironment() {
        // 实验桌 - 提高位置以适应新的相机视角
        const tableGeometry = new THREE.BoxGeometry(25, 0.4, 10);
        const tableMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.2
        });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.y = 0;
        table.receiveShadow = true;
        this.scene.add(table);

        // 桌面光泽效果
        const glossGeometry = new THREE.PlaneGeometry(25, 10);
        const glossMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.05,
            roughness: 0.1,
            metalness: 0.9
        });
        const gloss = new THREE.Mesh(glossGeometry, glossMaterial);
        gloss.rotation.x = -Math.PI / 2;
        gloss.position.y = 0.21;
        this.scene.add(gloss);

        // 背景墙 - 调整位置
        const wallGeometry = new THREE.PlaneGeometry(30, 12);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d3561,
            roughness: 0.9
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(0, 4, -6);
        wall.receiveShadow = true;
        this.scene.add(wall);
    }

    createBeaker(x, z) {
        const beakerGroup = new THREE.Group();
        beakerGroup.userData = {
            liquids: [],
            capacity: 1.5,
            currentVolume: 0,
            reactions: []
        };

        // 烧杯玻璃体 - 放大2倍
        const glassGeometry = new THREE.CylinderGeometry(1.2, 1.0, 4, 32, 1, true);
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            transmission: 0.9,
            thickness: 0.5
        });
        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.castShadow = true;
        glass.receiveShadow = true;
        beakerGroup.add(glass);

        // 烧杯底部 - 放大2倍
        const bottomGeometry = new THREE.CylinderGeometry(1.0, 1.0, 0.1, 32);
        const bottomMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            roughness: 0.1,
            metalness: 0.1
        });
        const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
        bottom.position.y = -1.95;
        beakerGroup.add(bottom);

        // 刻度线 - 放大2倍
        for (let i = 1; i <= 4; i++) {
            const lineGeometry = new THREE.TorusGeometry(1.1, 0.02, 8, 32);
            const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = Math.PI / 2;
            line.position.y = -1.6 + i * 0.8;
            beakerGroup.add(line);
        }

        beakerGroup.position.set(x, 2, z);
        beakerGroup.userData.isBeaker = true;

        return beakerGroup;
    }

    addBeaker() {
        const spacing = 4.5; // Increased spacing for 2x larger beakers
        const x = (this.beakers.length - 2) * spacing;
        const z = 0;

        const beaker = this.createBeaker(x, z);
        this.beakers.push(beaker);
        this.scene.add(beaker);
    }

    createLiquid(beaker, color, volume, viscosity = 1.0) {
        const liquidGroup = new THREE.Group();

        // 计算液体高度 - 2x beaker scale
        const height = volume * 2.4;
        const radius = 1.0; // Matches new beaker bottom radius

        // 液体主体
        const liquidGeometry = new THREE.CylinderGeometry(radius, radius * 0.95, height, 32);
        const liquidMaterial = new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
            roughness: 0.3,
            metalness: 0.1,
            clearcoat: 0.5,
            transmission: 0.3
        });
        const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
        liquid.position.y = -1.95 + height / 2; // Adjusted for new beaker bottom position
        liquidGroup.add(liquid);

        // 液体表面
        const surfaceGeometry = new THREE.CircleGeometry(radius, 32);
        const surfaceMaterial = new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.3,
            clearcoat: 1.0
        });
        const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        surface.rotation.x = -Math.PI / 2;
        surface.position.y = -1.95 + height; // Adjusted for new beaker bottom position
        liquidGroup.add(surface);

        // 添加波纹效果
        liquidGroup.userData = {
            color: color,
            volume: volume,
            viscosity: viscosity,
            time: 0
        };

        beaker.add(liquidGroup);
        return liquidGroup;
    }

    addLiquidToBeaker(beaker, potionType) {
        const config = this.potionConfig[potionType];
        const volumeToAdd = 0.3;

        if (beaker.userData.currentVolume + volumeToAdd > beaker.userData.capacity) {
            this.showNotification('⚠️ BEAKER FULL!');
            return;
        }

        // 创建倾倒动画
        this.createPourAnimation(beaker, config.color, volumeToAdd);

        // 添加液体数据
        beaker.userData.liquids.push({
            type: potionType,
            color: config.color,
            volume: volumeToAdd,
            viscosity: config.viscosity
        });

        beaker.userData.currentVolume += volumeToAdd;

        // Show success notification for pouring
        const potionEmojis = {
            red: '🔴',
            blue: '🔵',
            yellow: '🟡',
            pink: '🩷',
            green: '🟢'
        };
        this.showNotification(`${potionEmojis[potionType]} Pouring ${config.name}... ✓`, 800);

        // 检查化学反应
        setTimeout(() => {
            this.checkReactions(beaker);
            this.updateBeakerLiquid(beaker);
        }, 1000);
    }

    createPourAnimation(beaker, color, volume) {
        const droplets = [];
        const dropletCount = 20;

        for (let i = 0; i < dropletCount; i++) {
            const dropletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const dropletMaterial = new THREE.MeshPhysicalMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                roughness: 0.2,
                metalness: 0.3
            });
            const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial);

            droplet.position.set(
                beaker.position.x + (Math.random() - 0.5) * 0.3,
                beaker.position.y + 2 + Math.random() * 0.5,
                beaker.position.z
            );

            droplet.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    -0.05 - Math.random() * 0.03,
                    (Math.random() - 0.5) * 0.02
                ),
                life: 1.0
            };

            this.scene.add(droplet);
            droplets.push(droplet);
        }

        this.animations.push({
            type: 'pour',
            droplets: droplets,
            beaker: beaker,
            time: 0,
            duration: 1.0
        });
    }

    updateBeakerLiquid(beaker) {
        // 移除旧液体
        const oldLiquids = beaker.children.filter(child => child.userData.volume !== undefined);
        oldLiquids.forEach(liquid => beaker.remove(liquid));

        // 计算混合后的颜色和总体积
        let totalVolume = 0;
        let mixedColor = new THREE.Color(0x000000);
        let totalViscosity = 0;

        beaker.userData.liquids.forEach(liquid => {
            totalVolume += liquid.volume;
            const color = new THREE.Color(liquid.color);
            mixedColor.r += color.r * liquid.volume;
            mixedColor.g += color.g * liquid.volume;
            mixedColor.b += color.b * liquid.volume;
            totalViscosity += liquid.viscosity * liquid.volume;
        });

        if (totalVolume > 0) {
            mixedColor.r /= totalVolume;
            mixedColor.g /= totalVolume;
            mixedColor.b /= totalVolume;
            totalViscosity /= totalVolume;

            this.createLiquid(beaker, mixedColor.getHex(), totalVolume, totalViscosity);
        }
    }

    checkReactions(beaker) {
        const liquids = beaker.userData.liquids;
        if (liquids.length < 2) return;

        // 检查最后两种液体的反应
        const last = liquids[liquids.length - 1];
        const secondLast = liquids[liquids.length - 2];

        const key1 = `${last.type}+${secondLast.type}`;
        const key2 = `${secondLast.type}+${last.type}`;

        const reaction = this.reactionRules[key1] || this.reactionRules[key2];

        if (reaction) {
            this.triggerReaction(beaker, reaction);
        }
    }

    triggerReaction(beaker, reaction) {
        this.showNotification(reaction.name);

        switch (reaction.type) {
            case 'explosion':
                this.createExplosion(beaker);
                break;
            case 'bubbles':
                this.createBubbles(beaker);
                break;
            case 'freeze':
                this.createFreezeEffect(beaker);
                break;
            case 'viscous':
                this.createViscousEffect(beaker);
                break;
            case 'jelly':
                this.createJellyEffect(beaker);
                break;
            case 'glow':
                this.createGlowEffect(beaker);
                break;
        }

        // 更新液体颜色为反应结果
        beaker.userData.liquids = [{
            type: 'reaction',
            color: reaction.result,
            volume: beaker.userData.currentVolume,
            viscosity: 1.0
        }];

        this.updateBeakerLiquid(beaker);
    }

    createExplosion(beaker) {
        const particleCount = 600; // MASSIVE explosion - doubled particles!
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.18, 8, 8); // Even LARGER particles!
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(Math.random(), Math.random() * 0.5, Math.random() * 0.5),
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geometry, material);

            particle.position.copy(beaker.position);
            particle.position.y += 2;

            const angle = Math.random() * Math.PI * 2;
            const verticalAngle = (Math.random() - 0.3) * Math.PI / 2;
            const speed = 0.4 + Math.random() * 0.8; // MUCH FASTER - tripled speed!
            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(verticalAngle) * speed,
                    Math.sin(verticalAngle) * speed + Math.random() * 0.8,
                    Math.sin(angle) * Math.cos(verticalAngle) * speed
                ),
                life: 4.0 // MUCH LONGER life - doubled to 4 seconds!
            };

            this.scene.add(particle);
            particles.push(particle);
        }

        this.particles.push(...particles);

        // SUPER INTENSE shake effect - LONGER duration!
        this.shakeBeaker(beaker, 0.6, 3.0); // Extended to 3 seconds!

        // ULTRA BRIGHT flash effect - multiple flashes LONGER!
        const flash = new THREE.PointLight(0xff6600, 20, 25);
        flash.position.copy(beaker.position);
        flash.position.y += 2.5;
        this.scene.add(flash);

        // Add secondary explosion ring
        const ring = new THREE.PointLight(0xff0000, 15, 20);
        ring.position.copy(beaker.position);
        ring.position.y += 2.5;
        this.scene.add(ring);

        setTimeout(() => {
            this.scene.remove(flash);
            this.scene.remove(ring);
        }, 1500); // Extended flash duration to 1.5 seconds!
    }

    createBubbles(beaker) {
        const animation = {
            type: 'bubbles',
            beaker: beaker,
            time: 0,
            duration: 12.0, // SUPER LONG duration - extended to 12 seconds!
            bubbles: [],
            intensity: 5.0 // TONS of bubbles - 5x intensity!
        };

        // Add bubbling sound effect with light pulses
        const bubbleLight = new THREE.PointLight(0x00ffff, 3, 8);
        bubbleLight.position.copy(beaker.position);
        bubbleLight.position.y += 3;
        this.scene.add(bubbleLight);

        setTimeout(() => this.scene.remove(bubbleLight), 12000); // Extended to 12 seconds!

        this.animations.push(animation);
    }

    createFreezeEffect(beaker) {
        // SUPER ENHANCED ice crystal effect with TONS of ice!
        const iceGroup = new THREE.Group();

        // Create MASSIVE ice crystal formation - 150 crystals!
        for (let i = 0; i < 150; i++) {
            const size = 0.15 + Math.random() * 0.35; // MUCH larger ice crystals!
            const geometry = new THREE.OctahedronGeometry(size, 0);
            const material = new THREE.MeshPhysicalMaterial({
                color: 0xaaffff,
                transparent: true,
                opacity: 0.9,
                roughness: 0.02,
                metalness: 1.0,
                clearcoat: 1.0,
                envMapIntensity: 2.0
            });
            const crystal = new THREE.Mesh(geometry, material);

            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1.1;
            crystal.position.set(
                Math.cos(angle) * radius,
                -1.5 + Math.random() * 4.0,
                Math.sin(angle) * radius
            );
            crystal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            iceGroup.add(crystal);
        }

        beaker.add(iceGroup);
        iceGroup.userData.type = 'freeze';

        // INTENSE freeze light effect - multiple lights!
        const freezeLight1 = new THREE.PointLight(0x00ffff, 12, 15); // Much brighter!
        freezeLight1.position.copy(beaker.position);
        freezeLight1.position.y += 2.5;
        this.scene.add(freezeLight1);

        const freezeLight2 = new THREE.PointLight(0xaaffff, 8, 12);
        freezeLight2.position.copy(beaker.position);
        freezeLight2.position.y += 3.5;
        this.scene.add(freezeLight2);

        // Add frost particle burst effect
        for (let i = 0; i < 100; i++) {
            const frostParticle = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xccffff, transparent: true, opacity: 0.8 })
            );
            frostParticle.position.copy(beaker.position);
            frostParticle.position.y += 2;

            const angle = Math.random() * Math.PI * 2;
            const speed = 0.15 + Math.random() * 0.25;
            frostParticle.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    Math.random() * 0.3,
                    Math.sin(angle) * speed
                ),
                life: 3.0 // MUCH LONGER particle life - doubled to 3 seconds!
            };
            this.scene.add(frostParticle);
            this.particles.push(frostParticle);
        }

        setTimeout(() => {
            this.scene.remove(freezeLight1);
            this.scene.remove(freezeLight2);
        }, 4000); // Extended light duration to 4 seconds!

        this.shakeBeaker(beaker, 0.4, 2.5); // Extended shake duration!
        this.showNotification('❄️ FROZEN SOLID!');
    }

    createViscousEffect(beaker) {
        this.showNotification('🍯 GETTING VISCOUS!');

        // SUPER ENHANCED viscous animation with DRAMATIC dripping effect!
        const animation = {
            type: 'viscous',
            beaker: beaker,
            time: 0,
            duration: 8.0, // SUPER LONG duration - extended to 8 seconds!
            amplitude: 0.4 // MUCH more pronounced movement!
        };
        this.animations.push(animation);

        // Add sticky drip particles
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const drip = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1, 8, 8),
                    new THREE.MeshPhysicalMaterial({
                        color: beaker.userData.liquids[0]?.color || 0xffaa00,
                        transparent: true,
                        opacity: 0.7,
                        roughness: 0.8
                    })
                );
                drip.position.copy(beaker.position);
                drip.position.y += 1.5;
                drip.userData = {
                    velocity: new THREE.Vector3(0, -0.02, 0),
                    life: 4.0 // MUCH LONGER drip life - doubled to 4 seconds!
                };
                this.scene.add(drip);
                this.particles.push(drip);
            }, i * 100);
        }

        this.shakeBeaker(beaker, 0.25, 3.0); // Extended shake duration!
    }

    createJellyEffect(beaker) {
        this.showNotification('🍮 SOLIDIFYING INTO JELLY!');

        // EXTREME jelly wobble effect - SUPER JIGGLY!
        const animation = {
            type: 'jelly',
            beaker: beaker,
            time: 0,
            duration: 12.0, // SUPER LONG wobble - extended to 12 seconds!
            amplitude: 0.5 // EXTREME wobble for maximum jiggle!
        };
        this.animations.push(animation);

        // Add jelly sparkle effect
        const jellyLight = new THREE.PointLight(0xffaaff, 4, 10);
        jellyLight.position.copy(beaker.position);
        jellyLight.position.y += 2;
        this.scene.add(jellyLight);

        setTimeout(() => this.scene.remove(jellyLight), 12000); // Extended to 12 seconds!

        this.shakeBeaker(beaker, 0.35, 3.0); // Extended shake duration!
    }

    createGlowEffect(beaker) {
        // ULTRA BRIGHT glow effect with INTENSE pulsing!
        const glowLight = new THREE.PointLight(0x88ff88, 15, 20); // SUPER bright and large!
        glowLight.position.copy(beaker.position);
        glowLight.position.y += 2.5;
        this.scene.add(glowLight);

        // Add secondary glow ring
        const glowRing = new THREE.PointLight(0xaaffaa, 10, 15);
        glowRing.position.copy(beaker.position);
        glowRing.position.y += 3.5;
        this.scene.add(glowRing);

        // Add sparkle particles
        for (let i = 0; i < 80; i++) {
            setTimeout(() => {
                const sparkle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.06, 6, 6),
                    new THREE.MeshBasicMaterial({ color: 0xccffcc, transparent: true, opacity: 1.0 })
                );
                sparkle.position.copy(beaker.position);
                sparkle.position.y += 2;

                const angle = Math.random() * Math.PI * 2;
                const speed = 0.1 + Math.random() * 0.2;
                sparkle.userData = {
                    velocity: new THREE.Vector3(
                        Math.cos(angle) * speed,
                        0.2 + Math.random() * 0.3,
                        Math.sin(angle) * speed
                    ),
                    life: 4.0 // MUCH LONGER sparkle life - doubled to 4 seconds!
                };
                this.scene.add(sparkle);
                this.particles.push(sparkle);
            }, i * 80);
        }

        beaker.userData.glowLight = glowLight;
        beaker.userData.glowRing = glowRing;

        const animation = {
            type: 'glow',
            beaker: beaker,
            light: glowLight,
            ring: glowRing,
            time: 0,
            duration: 12.0, // SUPER LONG glow - extended to 12 seconds!
            maxIntensity: 18 // ULTRA bright pulses!
        };
        this.animations.push(animation);
    }

    shakeBeaker(beaker, intensity = 0.3, duration = 1.0) {
        const originalPos = beaker.position.clone();
        const animation = {
            type: 'shake',
            beaker: beaker,
            originalPos: originalPos,
            time: 0,
            duration: duration,
            intensity: intensity
        };
        this.animations.push(animation);
    }

    updateAnimations(deltaTime) {
        // 更新所有动画
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            anim.time += deltaTime;

            if (anim.type === 'pour') {
                anim.droplets.forEach(droplet => {
                    droplet.position.add(droplet.userData.velocity);
                    droplet.userData.velocity.y -= 0.002; // 重力

                    if (droplet.position.y < anim.beaker.position.y - 0.5) {
                        this.scene.remove(droplet);
                    }
                });

                if (anim.time > anim.duration) {
                    anim.droplets.forEach(d => this.scene.remove(d));
                    this.animations.splice(i, 1);
                }
            }

            else if (anim.type === 'bubbles') {
                // Generate TONS of bubbles!
                const intensity = anim.intensity || 1.0;
                if (Math.random() < 0.7 * intensity) { // Higher chance of spawning!
                    const bubble = this.createBubble(anim.beaker);
                    anim.bubbles.push(bubble);
                }

                // Update bubbles with FASTER rise and MORE growth!
                anim.bubbles = anim.bubbles.filter(bubble => {
                    bubble.position.y += 0.06; // MUCH faster rise - doubled!
                    bubble.scale.x += 0.012; // Grow MUCH more as they rise!
                    bubble.scale.y += 0.012;
                    bubble.scale.z += 0.012;
                    bubble.userData.life -= 0.006; // Slower fade for longer visibility
                    bubble.material.opacity = bubble.userData.life * 0.6;

                    // Add wobble to bubbles for more realism
                    bubble.position.x += Math.sin(anim.time * 10 + bubble.position.y) * 0.02;
                    bubble.position.z += Math.cos(anim.time * 10 + bubble.position.y) * 0.02;

                    if (bubble.userData.life <= 0) {
                        this.scene.remove(bubble);
                        return false;
                    }
                    return true;
                });

                if (anim.time > anim.duration) {
                    anim.bubbles.forEach(b => this.scene.remove(b));
                    this.animations.splice(i, 1);
                }
            }

            else if (anim.type === 'shake') {
                const progress = anim.time / anim.duration;
                if (progress < 1) {
                    const intensity = anim.intensity || 0.1;
                    const shake = Math.sin(progress * Math.PI * 30) * (1 - progress) * intensity;
                    const shakeY = Math.cos(progress * Math.PI * 25) * (1 - progress) * intensity * 0.5;
                    anim.beaker.position.x = anim.originalPos.x + shake;
                    anim.beaker.position.y = anim.originalPos.y + shakeY;
                } else {
                    anim.beaker.position.copy(anim.originalPos);
                    this.animations.splice(i, 1);
                }
            }

            else if (anim.type === 'jelly') {
                // Enhanced jelly wobble
                const amplitude = anim.amplitude || 0.1;
                const liquids = anim.beaker.children.filter(c => c.userData.volume);
                liquids.forEach(liquid => {
                    liquid.rotation.z = Math.sin(anim.time * 6) * amplitude;
                    liquid.rotation.x = Math.cos(anim.time * 4) * amplitude * 0.5;
                    liquid.scale.y = 1 + Math.sin(anim.time * 10) * amplitude * 0.8;
                    liquid.scale.x = 1 + Math.cos(anim.time * 8) * amplitude * 0.3;
                });

                if (anim.time > anim.duration) {
                    liquids.forEach(l => {
                        l.rotation.z = 0;
                        l.rotation.x = 0;
                        l.scale.y = 1;
                        l.scale.x = 1;
                    });
                    this.animations.splice(i, 1);
                }
            }

            else if (anim.type === 'glow') {
                const maxIntensity = anim.maxIntensity || 3;
                anim.light.intensity = maxIntensity + Math.sin(anim.time * 8) * (maxIntensity / 2);

                // Pulse the secondary ring if it exists
                if (anim.ring) {
                    anim.ring.intensity = (maxIntensity * 0.6) + Math.sin(anim.time * 10) * (maxIntensity / 3);
                }

                if (anim.time > anim.duration) {
                    this.scene.remove(anim.light);
                    if (anim.ring) this.scene.remove(anim.ring);
                    this.animations.splice(i, 1);
                }
            }
        }

        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.position.add(particle.userData.velocity);
            particle.userData.velocity.y -= 0.005; // 重力
            particle.userData.life -= 0.02;
            particle.material.opacity = particle.userData.life;

            if (particle.userData.life <= 0) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
            }
        }
    }

    createBubble(beaker) {
        // HUGE bubbles with lots of variety!
        const geometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.35, 16, 16); // MUCH bigger bubbles!
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            roughness: 0,
            metalness: 0.1,
            clearcoat: 1.0,
            transmission: 0.95,
            thickness: 0.8
        });
        const bubble = new THREE.Mesh(geometry, material);

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 1.0;
        bubble.position.set(
            beaker.position.x + Math.cos(angle) * radius,
            beaker.position.y - 1.4 + Math.random() * 1.0,
            beaker.position.z + Math.sin(angle) * radius
        );

        bubble.userData.life = 2.0; // Much longer life for dramatic effect!

        this.scene.add(bubble);
        return bubble;
    }

    showNotification(message, duration = 2000) {
        const notification = document.createElement('div');
        notification.className = 'reaction-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, duration);
    }

    setupEventListeners() {
        // 窗口调整
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // 鼠标移动
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // 点击事件
        window.addEventListener('click', (event) => {
            this.handleClick(event);
        });

        // 药水选择
        document.querySelectorAll('.potion-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.potion-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                this.selectedPotion = item.dataset.potion;
            });
        });

        // Add beaker button
        document.getElementById('add-beaker-btn').addEventListener('click', () => {
            if (this.beakers.length < 6) {
                this.addBeaker();
                this.showNotification('🧪 New Beaker Added! ✨', 1000);
            } else {
                this.showNotification('⚠️ MAX BEAKERS REACHED!');
            }
        });

        // Clear all beakers button
        document.getElementById('clear-beakers-btn').addEventListener('click', () => {
            this.clearAllBeakers();
        });
    }

    clearAllBeakers() {
        if (this.beakers.length === 0) {
            this.showNotification('⚠️ No beakers to clear!', 1000);
            return;
        }

        // Remove all beakers from the scene
        this.beakers.forEach(beaker => {
            this.scene.remove(beaker);
        });

        // Clear the beakers array
        this.beakers = [];

        this.showNotification('🗑️ All beakers cleared! ✨', 1000);
    }

    handleClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 检测烧杯点击
        const beakerMeshes = [];
        this.beakers.forEach(beaker => {
            beaker.children.forEach(child => {
                if (child.isMesh) {
                    beakerMeshes.push({ mesh: child, beaker: beaker });
                }
            });
        });

        const intersects = this.raycaster.intersectObjects(beakerMeshes.map(b => b.mesh));

        if (intersects.length > 0 && this.selectedPotion) {
            const clickedMesh = intersects[0].object;
            const beakerData = beakerMeshes.find(b => b.mesh === clickedMesh);

            if (beakerData) {
                this.addLiquidToBeaker(beakerData.beaker, this.selectedPotion);
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 0.016; // ~60fps

        // 更新动画
        this.updateAnimations(deltaTime);

        // 液体波动效果
        this.beakers.forEach(beaker => {
            const liquids = beaker.children.filter(child => child.userData.volume !== undefined);
            liquids.forEach(liquid => {
                liquid.userData.time += deltaTime;
                const wave = Math.sin(liquid.userData.time * 2) * 0.02;
                liquid.children.forEach(child => {
                    if (child.geometry.type === 'CircleGeometry') {
                        child.position.y += wave * 0.5;
                    }
                });
            });
        });

        // 相机轻微摆动
        this.camera.position.x = Math.sin(Date.now() * 0.0001) * 0.5;
        this.camera.lookAt(0, 2.5, 0);

        this.renderer.render(this.scene, this.camera);
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new ChemistryLab();
});
