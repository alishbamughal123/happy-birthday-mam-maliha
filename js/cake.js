class BirthdayCake {
  constructor(scene) {
    this.scene = scene;
    this.cakeGroup = new THREE.Group();
    this.candleLight = null;
    this.flameMesh = null;
    this.flameInner = null;
    this.flameGlow = null;
    this.smokeParticles = [];
    this.isLit = true;
    this.theme = 'royalGold';
    this.tierMeshes = [];
    this.decorations = [];

    this.themes = {
      royalGold: {
        cake1: 0xfffcf5,
        cake2: 0xfbf6e9,
        cake3: 0xfffcf5,
        frosting: 0xffd700,
        decor: 0xf5af19,
        ribbon: 0xffd700,
        lightColor: 0xffaa33
      },
      roseBlossom: {
        cake1: 0xffedf3,
        cake2: 0xffd5e5,
        cake3: 0xffedf3,
        frosting: 0xff758c,
        decor: 0xffb6c1,
        ribbon: 0xff416c,
        lightColor: 0xff99aa
      },
      midnightTruffle: {
        cake1: 0x2c1d11,
        cake2: 0x1f140a,
        cake3: 0x2c1d11,
        frosting: 0xffd700,
        decor: 0xd4af37,
        ribbon: 0x8a1c14,
        lightColor: 0xffb347
      },
      emeraldRoyale: {
        cake1: 0x0a3323,
        cake2: 0x052418,
        cake3: 0x0a3323,
        frosting: 0xffd700,
        decor: 0xf2c94c,
        ribbon: 0xd4af37,
        lightColor: 0xffe066
      }
    };

    this.initCake();
  }

  initCake() {
    this.cakeGroup.position.set(0, 0, 0);
    this.createCakeStand();
    this.createCakeTiers();
    this.createToppings();
    this.createCandle();
    this.createCakeTopper();
    this.scene.add(this.cakeGroup);
  }

  createCakeStand() {
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.2
    });

    const baseGeo = new THREE.CylinderGeometry(2.6, 2.8, 0.25, 48);
    const baseMesh = new THREE.Mesh(baseGeo, goldMaterial);
    baseMesh.position.y = 0.125;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.cakeGroup.add(baseMesh);

    const pillarGeo = new THREE.CylinderGeometry(0.8, 1.4, 0.8, 32);
    const pillarMesh = new THREE.Mesh(pillarGeo, goldMaterial);
    pillarMesh.position.y = 0.65;
    pillarMesh.castShadow = true;
    this.cakeGroup.add(pillarMesh);

    const plateGeo = new THREE.CylinderGeometry(3.6, 3.4, 0.15, 64);
    const plateMesh = new THREE.Mesh(plateGeo, goldMaterial);
    plateMesh.position.y = 1.12;
    plateMesh.castShadow = true;
    plateMesh.receiveShadow = true;
    this.cakeGroup.add(plateMesh);

    const beadCount = 36;
    const beadRadius = 3.55;
    const beadGeo = new THREE.SphereGeometry(0.09, 16, 16);
    for (let i = 0; i < beadCount; i++) {
      const angle = (i / beadCount) * Math.PI * 2;
      const bead = new THREE.Mesh(beadGeo, goldMaterial);
      bead.position.set(Math.cos(angle) * beadRadius, 1.14, Math.sin(angle) * beadRadius);
      this.cakeGroup.add(bead);
    }
  }

  createCakeTiers() {
    const t = this.themes[this.theme];

    // Tier 1
    const tier1Geo = new THREE.CylinderGeometry(3.0, 3.0, 1.2, 48);
    const tier1Mat = new THREE.MeshStandardMaterial({ color: t.cake1, roughness: 0.35, metalness: 0.05 });
    const tier1 = new THREE.Mesh(tier1Geo, tier1Mat);
    tier1.position.y = 1.8;
    tier1.castShadow = true;
    tier1.receiveShadow = true;
    tier1.name = 'cake_tier_1';
    this.cakeGroup.add(tier1);
    this.tierMeshes.push(tier1);

    this.addPipingRing(3.04, 1.25, 0.12, 0xffd700, true);
    this.addPipingRing(3.02, 2.4, 0.08, 0xffffff, false);
    this.addIcingSwags(3.05, 1.8, 16);

    // Tier 2
    const tier2Geo = new THREE.CylinderGeometry(2.1, 2.1, 1.0, 48);
    const tier2Mat = new THREE.MeshStandardMaterial({ color: t.cake2, roughness: 0.35, metalness: 0.05 });
    const tier2 = new THREE.Mesh(tier2Geo, tier2Mat);
    tier2.position.y = 2.9;
    tier2.castShadow = true;
    tier2.receiveShadow = true;
    tier2.name = 'cake_tier_2';
    this.cakeGroup.add(tier2);
    this.tierMeshes.push(tier2);

    this.addPipingRing(2.14, 2.42, 0.1, 0xffd700, true);
    this.addPipingRing(2.12, 3.4, 0.08, 0xffffff, false);
    this.addPearlGrid(2.12, 2.9, 12);

    // Tier 3
    const tier3Geo = new THREE.CylinderGeometry(1.3, 1.3, 0.85, 48);
    const tier3Mat = new THREE.MeshStandardMaterial({ color: t.cake3, roughness: 0.35, metalness: 0.05 });
    const tier3 = new THREE.Mesh(tier3Geo, tier3Mat);
    tier3.position.y = 3.825;
    tier3.castShadow = true;
    tier3.receiveShadow = true;
    tier3.name = 'cake_tier_3';
    this.cakeGroup.add(tier3);
    this.tierMeshes.push(tier3);

    this.addPipingRing(1.34, 3.42, 0.09, 0xffd700, true);
    this.addPipingRing(1.32, 4.25, 0.07, 0xffd700, true);
  }

  addPipingRing(radius, y, tubeRadius, color, isMetallic = false) {
    const torusGeo = new THREE.TorusGeometry(radius, tubeRadius, 16, 64);
    const torusMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: isMetallic ? 0.25 : 0.4,
      metalness: isMetallic ? 0.75 : 0.05
    });
    const ring = new THREE.Mesh(torusGeo, torusMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    ring.castShadow = true;
    this.cakeGroup.add(ring);
    this.decorations.push(ring);
  }

  addIcingSwags(radius, y, count) {
    const swagMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), swagMat);
      bead.position.set(Math.cos(angle) * radius, y - 0.2 + Math.sin(angle * 4) * 0.15, Math.sin(angle) * radius);
      this.cakeGroup.add(bead);
      this.decorations.push(bead);
    }
  }

  addPearlGrid(radius, y, count) {
    const pearlMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), pearlMat);
      pearl.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      this.cakeGroup.add(pearl);
      this.decorations.push(pearl);
    }
  }

  createToppings() {
    const rosetteCount = 8;
    const rosetteRadius = 0.95;
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const strawberryMat = new THREE.MeshStandardMaterial({ color: 0xd91438, roughness: 0.3, metalness: 0.1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.5 });

    for (let i = 0; i < rosetteCount; i++) {
      const angle = (i / rosetteCount) * Math.PI * 2;
      const x = Math.cos(angle) * rosetteRadius;
      const z = Math.sin(angle) * rosetteRadius;

      const rosette = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.22, 8), creamMat);
      rosette.position.set(x, 4.35, z);
      rosette.rotation.y = angle;
      this.cakeGroup.add(rosette);

      const berry = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 12), strawberryMat);
      berry.position.set(x * 0.75, 4.38, z * 0.75);
      berry.rotation.x = Math.PI;
      berry.rotation.z = 0.2;
      this.cakeGroup.add(berry);

      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.08, 4), leafMat);
      leaf.position.set(x * 0.75, 4.48, z * 0.75);
      this.cakeGroup.add(leaf);
    }
  }

  createCandle() {
    this.candleGroup = new THREE.Group();
    this.candleGroup.position.set(0, 4.25, 0);

    const candleGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 32);
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    const candle = new THREE.Mesh(candleGeo, candleMat);
    candle.position.y = 0.7;
    candle.castShadow = true;
    candle.name = 'birthday_candle';
    this.candleGroup.add(candle);

    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0x222222 }));
    wick.position.y = 1.45;
    this.candleGroup.add(wick);

    const flameOuterGeo = new THREE.ConeGeometry(0.14, 0.48, 16);
    flameOuterGeo.translate(0, 0.24, 0);
    this.flameMesh = new THREE.Mesh(flameOuterGeo, new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    }));
    this.flameMesh.position.y = 1.5;
    this.flameMesh.name = 'candle_flame';
    this.candleGroup.add(this.flameMesh);

    const flameInnerGeo = new THREE.ConeGeometry(0.08, 0.32, 16);
    flameInnerGeo.translate(0, 0.16, 0);
    this.flameInner = new THREE.Mesh(flameInnerGeo, new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    }));
    this.flameInner.position.y = 1.5;
    this.candleGroup.add(this.flameInner);

    this.flameBase = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    }));
    this.flameBase.position.y = 1.52;
    this.candleGroup.add(this.flameBase);

    this.candleLight = new THREE.PointLight(0xffaa33, 2.2, 12, 2);
    this.candleLight.position.set(0, 1.7, 0);
    this.candleLight.castShadow = true;
    this.candleGroup.add(this.candleLight);

    this.cakeGroup.add(this.candleGroup);
  }

  createCakeTopper() {
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 4.35, -0.6);

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.15 });
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.9, 0, 0),
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0.9, 0, 0)
    );
    const archMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.035, 12, false), goldMat);
    archGroup.add(archMesh);

    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.22, 5), goldMat);
    crown.position.set(0, 1.55, 0);
    crown.rotation.x = Math.PI;
    archGroup.add(crown);

    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshStandardMaterial({
      color: 0xff3366,
      emissive: 0xff3366,
      emissiveIntensity: 0.6,
      roughness: 0.1
    }));
    star.position.set(0, 1.05, 0);
    archGroup.add(star);
    this.topperStar = star;

    this.cakeGroup.add(archGroup);
  }

  update(time) {
    if (this.isLit && this.flameMesh && this.flameInner) {
      const flicker1 = Math.sin(time * 18.0) * 0.08 + Math.cos(time * 25.0) * 0.05;
      const flicker2 = Math.sin(time * 22.0) * 0.06;

      this.flameMesh.scale.set(1 + flicker1, 1 + flicker2 * 1.5, 1 + flicker1);
      this.flameMesh.rotation.z = flicker1 * 0.4;
      this.flameMesh.rotation.x = flicker2 * 0.4;
      this.flameInner.scale.set(1 + flicker1 * 0.6, 1 + flicker2, 1 + flicker1 * 0.6);

      if (this.candleLight) {
        this.candleLight.intensity = 2.0 + Math.sin(time * 20.0) * 0.4 + Math.random() * 0.15;
      }
    }

    if (this.topperStar) {
      this.topperStar.rotation.y = time * 1.5;
      this.topperStar.rotation.z = Math.sin(time * 2.0) * 0.2;
    }

    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.mesh.position.y += p.velocity.y;
      p.mesh.position.x += p.velocity.x;
      p.mesh.position.z += p.velocity.z;
      p.mesh.scale.multiplyScalar(1.025);
      p.mesh.material.opacity *= 0.95;
      p.life -= 0.02;

      if (p.life <= 0 || p.mesh.material.opacity <= 0.01) {
        this.cakeGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.smokeParticles.splice(i, 1);
      }
    }
  }

  blowCandle() {
    if (!this.isLit) {
      this.relightCandle();
      return false;
    }

    this.isLit = false;

    if (window.gsap) {
      gsap.to([this.flameMesh.scale, this.flameInner.scale, this.flameBase.scale], {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.35,
        ease: 'power2.out'
      });
      gsap.to(this.candleLight, {
        intensity: 0,
        duration: 0.4,
        ease: 'power2.out'
      });
    } else {
      this.flameMesh.visible = false;
      this.flameInner.visible = false;
      this.flameBase.visible = false;
      this.candleLight.intensity = 0;
    }

    this.spawnSmokePuff();
    return true;
  }

  relightCandle() {
    this.isLit = true;
    this.flameMesh.visible = true;
    this.flameInner.visible = true;
    this.flameBase.visible = true;

    if (window.gsap) {
      gsap.fromTo(
        [this.flameMesh.scale, this.flameInner.scale, this.flameBase.scale],
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(2)' }
      );
      gsap.to(this.candleLight, {
        intensity: 2.2,
        duration: 0.5,
        ease: 'power2.out'
      });
    } else {
      this.flameMesh.scale.set(1, 1, 1);
      this.flameInner.scale.set(1, 1, 1);
      this.flameBase.scale.set(1, 1, 1);
      this.candleLight.intensity = 2.2;
    }
  }

  spawnSmokePuff() {
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xdddddd,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const smokeGeo = new THREE.SphereGeometry(0.08, 8, 8);

    for (let i = 0; i < 18; i++) {
      const mesh = new THREE.Mesh(smokeGeo, smokeMat.clone());
      mesh.position.set(
        (Math.random() - 0.5) * 0.05,
        5.7 + Math.random() * 0.1,
        (Math.random() - 0.5) * 0.05
      );

      const p = {
        mesh: mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          0.025 + Math.random() * 0.03,
          (Math.random() - 0.5) * 0.02
        ),
        life: 1.0
      };

      this.cakeGroup.add(mesh);
      this.smokeParticles.push(p);
    }
  }

  setTheme(themeName) {
    if (!this.themes[themeName]) return;
    this.theme = themeName;
    const t = this.themes[themeName];

    if (this.tierMeshes.length === 3) {
      if (window.gsap) {
        gsap.to(this.tierMeshes[0].material.color, {
          r: ((t.cake1 >> 16) & 255) / 255,
          g: ((t.cake1 >> 8) & 255) / 255,
          b: (t.cake1 & 255) / 255,
          duration: 0.8
        });
        gsap.to(this.tierMeshes[1].material.color, {
          r: ((t.cake2 >> 16) & 255) / 255,
          g: ((t.cake2 >> 8) & 255) / 255,
          b: (t.cake2 & 255) / 255,
          duration: 0.8
        });
        gsap.to(this.tierMeshes[2].material.color, {
          r: ((t.cake3 >> 16) & 255) / 255,
          g: ((t.cake3 >> 8) & 255) / 255,
          b: (t.cake3 & 255) / 255,
          duration: 0.8
        });
      } else {
        this.tierMeshes[0].material.color.setHex(t.cake1);
        this.tierMeshes[1].material.color.setHex(t.cake2);
        this.tierMeshes[2].material.color.setHex(t.cake3);
      }
    }

    if (this.candleLight) {
      this.candleLight.color.setHex(t.lightColor);
    }
  }
}

window.BirthdayCake = BirthdayCake;
