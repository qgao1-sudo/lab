// 化学实验室模拟器 - Three.js 游戏逻辑

class ChemistryLab {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.beakers = [];
        this.selectedPotion = null;
        this.selectedTool = 'pour';
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
            'red+blue': { type: 'explosion', result: 0x8800ff, name: '💥 EXPLOSION!' },
            'red+yellow': { type: 'bubbles', result: 0xff8800, name: '🫧 BUBBLING!' },
            'blue+yellow': { type: 'freeze', result: 0x00ffff, name: '❄️ FROZEN!' },
            'pink+yellow': { type: 'viscous', result: 0xffaa00, name: '🍯 VISCOUS!' },
            'green+red': { type: 'jelly', result: 0x88ff44, name: '🍮 JELLY!' },
            'green+blue': { type: 'bubbles', result: 0x0088ff, name: '🫧 BUBBLING!' },
            'pink+blue': { type: 'none', result: 0xaa44aa, name: '⚪ NO REACTION' },
            'pink+green': { type: 'glow', result: 0x88ff88, name: '✨ GLOWING!' },
            'red+green': { type: 'viscous', result: 0x888800, name: '🍯 STICKY!' },
            'yellow+green': { type: 'jelly', result: 0xaaff44, name: '🍮 SOLIDIFYING!' }
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
        // 实验桌
        const tableGeometry = new THREE.BoxGeometry(20, 0.3, 8);
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
        const glossGeometry = new THREE.PlaneGeometry(20, 8);
        const glossMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.05,
            roughness: 0.1,
            metalness: 0.9
        });
        const gloss = new THREE.Mesh(glossGeometry, glossMaterial);
        gloss.rotation.x = -Math.PI / 2;
        gloss.position.y = 0.16;
        this.scene.add(gloss);

        // 背景墙
        const wallGeometry = new THREE.PlaneGeometry(25, 15);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d3561,
            roughness: 0.9
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(0, 5, -5);
        wall.receiveShadow = true;
        this.scene.add(wall);

        // 添加装饰性货架
        this.createShelf(-8, 4, -4.8);
        this.createShelf(8, 4, -4.8);
    }

    createShelf(x, y, z) {
        const shelfGroup = new THREE.Group();

        // 架子板
        const boardGeometry = new THREE.BoxGeometry(3, 0.1, 0.8);
        const boardMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.7
        });

        for (let i = 0; i < 3; i++) {
            const board = new THREE.Mesh(boardGeometry, boardMaterial);
            board.position.y = i * 1.2;
            board.castShadow = true;
            shelfGroup.add(board);
        }

        shelfGroup.position.set(x, y, z);
        this.scene.add(shelfGroup);
    }

    createBeaker(x, z) {
        const beakerGroup = new THREE.Group();
        beakerGroup.userData = {
            liquids: [],
            capacity: 1.5,
            currentVolume: 0,
            reactions: []
        };

        // 烧杯玻璃体 - 放大1.5倍
        const glassGeometry = new THREE.CylinderGeometry(0.9, 0.75, 3, 32, 1, true);
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

        // 烧杯底部 - 放大1.5倍
        const bottomGeometry = new THREE.CylinderGeometry(0.75, 0.75, 0.08, 32);
        const bottomMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            roughness: 0.1,
            metalness: 0.1
        });
        const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
        bottom.position.y = -1.46;
        beakerGroup.add(bottom);

        // 刻度线 - 放大1.5倍
        for (let i = 1; i <= 4; i++) {
            const lineGeometry = new THREE.TorusGeometry(0.83, 0.015, 8, 32);
            const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = Math.PI / 2;
            line.position.y = -1.2 + i * 0.6;
            beakerGroup.add(line);
        }

        beakerGroup.position.set(x, 1.5, z);
        beakerGroup.userData.isBeaker = true;

        return beakerGroup;
    }

    addBeaker() {
        const spacing = 3.5; // Increased spacing for larger beakers
        const x = (this.beakers.length - 2) * spacing;
        const z = 0;

        const beaker = this.createBeaker(x, z);
        this.beakers.push(beaker);
        this.scene.add(beaker);
    }

    createLiquid(beaker, color, volume, viscosity = 1.0) {
        const liquidGroup = new THREE.Group();

        // 计算液体高度 - 调整以适应更大的烧杯
        const height = volume * 1.8;
        const radius = 0.75;

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
        liquid.position.y = -1.5 + height / 2;
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
        surface.position.y = -1.5 + height;
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
        const particleCount = 300; // Increased from 100
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.12, 8, 8); // Larger particles for bigger beaker
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(Math.random(), Math.random() * 0.5, Math.random() * 0.5),
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geometry, material);

            particle.position.copy(beaker.position);
            particle.position.y += 1.5;

            const angle = Math.random() * Math.PI * 2;
            const verticalAngle = (Math.random() - 0.3) * Math.PI / 2;
            const speed = 0.2 + Math.random() * 0.4; // Doubled speed
            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(verticalAngle) * speed,
                    Math.sin(verticalAngle) * speed + Math.random() * 0.5,
                    Math.sin(angle) * Math.cos(verticalAngle) * speed
                ),
                life: 1.5 // Longer life
            };

            this.scene.add(particle);
            particles.push(particle);
        }

        this.particles.push(...particles);

        // Enhanced shake effect
        this.shakeBeaker(beaker);

        // Add flash effect
        const flash = new THREE.PointLight(0xff6600, 8, 15);
        flash.position.copy(beaker.position);
        flash.position.y += 2;
        this.scene.add(flash);

        setTimeout(() => this.scene.remove(flash), 300);
    }

    createBubbles(beaker) {
        const animation = {
            type: 'bubbles',
            beaker: beaker,
            time: 0,
            duration: 5.0, // Longer duration
            bubbles: [],
            intensity: 2.0 // More bubbles
        };

        this.animations.push(animation);
    }

    createFreezeEffect(beaker) {
        // Enhanced ice crystal effect
        const iceGroup = new THREE.Group();

        for (let i = 0; i < 50; i++) { // Increased from 20
            const size = 0.12 + Math.random() * 0.22; // Larger ice crystals
            const geometry = new THREE.OctahedronGeometry(size, 0);
            const material = new THREE.MeshPhysicalMaterial({
                color: 0xaaffff,
                transparent: true,
                opacity: 0.8,
                roughness: 0.05,
                metalness: 0.9,
                clearcoat: 1.0,
                envMapIntensity: 1.5
            });
            const crystal = new THREE.Mesh(geometry, material);

            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.65;
            crystal.position.set(
                Math.cos(angle) * radius,
                -0.8 + Math.random() * 2.5,
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

        // Add freeze light effect
        const freezeLight = new THREE.PointLight(0x00ffff, 5, 8);
        freezeLight.position.copy(beaker.position);
        freezeLight.position.y += 2;
        this.scene.add(freezeLight);

        setTimeout(() => this.scene.remove(freezeLight), 1000);

        this.showNotification('❄️ FROZEN SOLID!');
    }

    createViscousEffect(beaker) {
        this.showNotification('🍯 GETTING VISCOUS!');

        // Enhanced viscous animation with dripping effect
        const animation = {
            type: 'viscous',
            beaker: beaker,
            time: 0,
            duration: 3.0,
            amplitude: 0.15 // More pronounced
        };
        this.animations.push(animation);
    }

    createJellyEffect(beaker) {
        this.showNotification('🍮 SOLIDIFYING INTO JELLY!');

        // Enhanced jelly wobble effect
        const animation = {
            type: 'jelly',
            beaker: beaker,
            time: 0,
            duration: 5.0, // Longer wobble
            amplitude: 0.2 // More wobble
        };
        this.animations.push(animation);
    }

    createGlowEffect(beaker) {
        // Enhanced glow effect
        const glowLight = new THREE.PointLight(0x88ff88, 6, 12); // Brighter and larger for bigger beaker
        glowLight.position.copy(beaker.position);
        glowLight.position.y += 2;
        this.scene.add(glowLight);

        beaker.userData.glowLight = glowLight;

        const animation = {
            type: 'glow',
            beaker: beaker,
            light: glowLight,
            time: 0,
            duration: 5.0, // Longer glow
            maxIntensity: 8 // Brighter pulses
        };
        this.animations.push(animation);
    }

    shakeBeaker(beaker) {
        const originalPos = beaker.position.clone();
        const animation = {
            type: 'shake',
            beaker: beaker,
            originalPos: originalPos,
            time: 0,
            duration: 1.0, // Longer shake
            intensity: 0.3 // More intense
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
                // Generate more bubbles
                const intensity = anim.intensity || 1.0;
                if (Math.random() < 0.5 * intensity) {
                    const bubble = this.createBubble(anim.beaker);
                    anim.bubbles.push(bubble);
                }

                // Update bubbles
                anim.bubbles = anim.bubbles.filter(bubble => {
                    bubble.position.y += 0.03; // Faster rise
                    bubble.scale.x += 0.005; // Grow as they rise
                    bubble.scale.y += 0.005;
                    bubble.scale.z += 0.005;
                    bubble.userData.life -= 0.008;
                    bubble.material.opacity = bubble.userData.life * 0.5;

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

                if (anim.time > anim.duration) {
                    this.scene.remove(anim.light);
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
        const geometry = new THREE.SphereGeometry(0.12 + Math.random() * 0.18, 16, 16); // Even larger bubbles
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            roughness: 0,
            metalness: 0.1,
            clearcoat: 1.0,
            transmission: 0.9,
            thickness: 0.5
        });
        const bubble = new THREE.Mesh(geometry, material);

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.55;
        bubble.position.set(
            beaker.position.x + Math.cos(angle) * radius,
            beaker.position.y - 0.8 + Math.random() * 0.5,
            beaker.position.z + Math.sin(angle) * radius
        );

        bubble.userData.life = 1.2; // Longer life

        this.scene.add(bubble);
        return bubble;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'reaction-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
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

        // 工具选择
        document.querySelectorAll('.tool-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.tool-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                this.selectedTool = item.dataset.tool;
            });
        });

        // Add beaker button
        document.getElementById('add-beaker-btn').addEventListener('click', () => {
            if (this.beakers.length < 6) {
                this.addBeaker();
            } else {
                this.showNotification('⚠️ MAX BEAKERS REACHED!');
            }
        });
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
