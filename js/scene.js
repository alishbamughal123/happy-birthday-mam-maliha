class BirthdayScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.cake = null;

    this.balloons = [];
    this.giftBoxes = [];
    this.lanterns = [];
    this.fireworks = [];
    this.interactiveObjects = [];

    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.hoveredObject = null;

    this.isAutoRotating = true;
    this.cameraViews = {
      overview: { pos: new THREE.Vector3(0, 4.5, 11), target: new THREE.Vector3(0, 2.2, 0) },
      cake: { pos: new THREE.Vector3(0, 3.5, 6.2), target: new THREE.Vector3(0, 2.8, 0) },
      candle: { pos: new THREE.Vector3(0, 5.6, 3.5), target: new THREE.Vector3(0, 4.6, 0) },
      portrait: { pos: new THREE.Vector3(-3.8, 3.2, 5.2), target: new THREE.Vector3(-4.0, 2.8, 0) },
      gift: { pos: new THREE.Vector3(3.8, 2.4, 4.8), target: new THREE.Vector3(3.8, 1.2, 0.8) },
      sky: { pos: new THREE.Vector3(0, 5.0, 12), target: new THREE.Vector3(0, 16.0, -10) }
    };

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070314, 0.025);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.updateCameraForViewport();
    this.camera.position.copy(this.cameraViews.overview.pos);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 3.0;
    this.controls.maxDistance = 30;
    this.controls.target.copy(this.cameraViews.overview.target);
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    this.setupLighting();
    this.createEnvironment();

    this.cake = new BirthdayCake(this.scene);
    this.interactiveObjects.push(this.cake.candleGroup);

    this.createPortraitEasel();
    this.createBalloonClusters();
    this.createGiftBoxes();
    this.createStardust();
    this.createAmbientLanterns();

    // Call updateCameraForViewport after creating objects so their positions/scales match mobile or desktop immediately
    this.updateCameraForViewport();
    this.camera.position.copy(this.cameraViews.overview.pos);
    this.controls.target.copy(this.cameraViews.overview.target);

    window.addEventListener('resize', () => this.onWindowResize(), false);
    window.addEventListener('orientationchange', () => setTimeout(() => this.onWindowResize(), 200), false);
    
    this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
    this.renderer.domElement.addEventListener('pointerdown', () => { this.isAutoRotating = false; }, false);

    this.animate();
  }

  updateCameraForViewport() {
    if (!this.container || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;
    const isMobile = width < 768 || aspect < 1.0;
    this.isMobile = isMobile;

    if (isMobile) {
      // Mobile FOV & Camera Views
      this.camera.fov = Math.min(65, Math.max(52, (45 / Math.max(aspect, 0.45)) * 0.58));

      // Overview: frames BOTH portrait frame and cake side-by-side perfectly
      this.cameraViews.overview.pos.set(-0.1, 3.8, 12.5);
      this.cameraViews.overview.target.set(-0.1, 2.0, 0);

      // 3D Cake view: zooms straight into cake
      this.cameraViews.cake.pos.set(1.15, 3.0, 6.8);
      this.cameraViews.cake.target.set(1.15, 2.4, 0.2);

      // Candle view: focuses right on burning flame
      this.cameraViews.candle.pos.set(1.15, 4.8, 3.8);
      this.cameraViews.candle.target.set(1.15, 3.6, 0.2);

      // Portrait view: full close-up of Mam Maliha's portrait
      this.cameraViews.portrait.pos.set(-1.35, 2.8, 5.5);
      this.cameraViews.portrait.target.set(-1.35, 2.6, -0.1);

      // Gift view: focuses on the surprise gift box
      this.cameraViews.gift.pos.set(1.3, 2.0, 5.0);
      this.cameraViews.gift.target.set(1.3, 0.8, 1.6);

      // Sky view: looks up at flying lanterns
      this.cameraViews.sky.pos.set(0, 5.0, 14.0);
      this.cameraViews.sky.target.set(0, 16.0, -10);

      // Position Portrait Easel so it is 100% visible on mobile screen without scrolling
      if (this.portraitGroup) {
        this.portraitGroup.position.set(-1.4, 0, -0.1);
        this.portraitGroup.rotation.y = 0.22;
        this.portraitGroup.scale.set(0.85, 0.85, 0.85);
      }

      // Position Cake slightly to the right so both fit harmoniously
      if (this.cake && this.cake.cakeGroup) {
        this.cake.cakeGroup.position.set(1.15, 0, 0.3);
        this.cake.cakeGroup.scale.set(0.72, 0.72, 0.72);
      }

      // Position Gift Box in front of the cake on mobile
      if (this.giftBoxes && this.giftBoxes[0] && this.giftBoxes[0].group) {
        this.giftBoxes[0].group.position.set(1.3, 0, 1.8);
        this.giftBoxes[0].group.scale.set(0.68, 0.68, 0.68);
        this.giftBoxes[0].group.rotation.y = -0.35;
      }
    } else {
      // Desktop FOV & Camera Views
      this.camera.fov = 45;

      this.cameraViews.overview.pos.set(0, 4.5, 11);
      this.cameraViews.overview.target.set(0, 2.2, 0);

      this.cameraViews.cake.pos.set(0, 3.5, 6.2);
      this.cameraViews.cake.target.set(0, 2.8, 0);

      this.cameraViews.candle.pos.set(0, 5.6, 3.5);
      this.cameraViews.candle.target.set(0, 4.6, 0);

      this.cameraViews.portrait.pos.set(-3.8, 3.2, 5.2);
      this.cameraViews.portrait.target.set(-4.0, 2.8, 0);

      this.cameraViews.gift.pos.set(3.8, 2.4, 4.8);
      this.cameraViews.gift.target.set(3.8, 1.2, 0.8);

      this.cameraViews.sky.pos.set(0, 5.0, 12);
      this.cameraViews.sky.target.set(0, 16.0, -10);

      // Desktop layout positions
      if (this.portraitGroup) {
        this.portraitGroup.position.set(-4.2, 0, 0);
        this.portraitGroup.rotation.y = 0.38;
        this.portraitGroup.scale.set(1.0, 1.0, 1.0);
      }

      if (this.cake && this.cake.cakeGroup) {
        this.cake.cakeGroup.position.set(0, 0, 0);
        this.cake.cakeGroup.scale.set(1.0, 1.0, 1.0);
      }

      if (this.giftBoxes && this.giftBoxes[0] && this.giftBoxes[0].group) {
        this.giftBoxes[0].group.position.set(3.8, 0, 0.8);
        this.giftBoxes[0].group.scale.set(1.0, 1.0, 1.0);
        this.giftBoxes[0].group.rotation.y = -0.4;
      }
    }

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x22103b, 1.2);
    this.scene.add(ambientLight);

    const keyLight = new THREE.SpotLight(0xfff4e0, 2.4, 30, Math.PI / 4, 0.4, 1.2);
    keyLight.position.set(6, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff3388, 1.4);
    rimLight.position.set(-8, 10, -8);
    this.scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffd700, 0.8);
    fillLight.position.set(8, 4, -4);
    this.scene.add(fillLight);
  }

  createEnvironment() {
    const floorGeo = new THREE.CylinderGeometry(14, 14, 0.2, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f071a,
      roughness: 0.15,
      metalness: 0.85
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const ringGeo = new THREE.TorusGeometry(13.8, 0.08, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);

    const ringGeo2 = new THREE.TorusGeometry(6.5, 0.04, 16, 80);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.01;
    this.scene.add(ring2);

    const starsCount = 1000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);

    const color1 = new THREE.Color(0xffffff);
    const color2 = new THREE.Color(0xffd700);
    const color3 = new THREE.Color(0xffaacc);

    for (let i = 0; i < starsCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 50 + Math.random() * 40;

      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 2;
      starPos[i * 3 + 2] = r * Math.cos(phi);

      const chosenColor = Math.random() > 0.6 ? color2 : (Math.random() > 0.5 ? color3 : color1);
      starColors[i * 3] = chosenColor.r;
      starColors[i * 3 + 1] = chosenColor.g;
      starColors[i * 3 + 2] = chosenColor.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    this.starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starPoints);
  }

  createPortraitEasel() {
    this.portraitGroup = new THREE.Group();
    this.portraitGroup.position.set(-4.2, 0, 0);
    this.portraitGroup.rotation.y = 0.38;

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.2
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x1f100a,
      roughness: 0.4
    });

    const legGeo = new THREE.CylinderGeometry(0.04, 0.05, 5.2, 12);

    const leftLeg = new THREE.Mesh(legGeo, woodMat);
    leftLeg.position.set(-0.7, 2.5, 0);
    leftLeg.rotation.z = -0.15;
    leftLeg.rotation.x = -0.12;
    leftLeg.castShadow = true;
    this.portraitGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, woodMat);
    rightLeg.position.set(0.7, 2.5, 0);
    rightLeg.rotation.z = 0.15;
    rightLeg.rotation.x = -0.12;
    rightLeg.castShadow = true;
    this.portraitGroup.add(rightLeg);

    const backLeg = new THREE.Mesh(legGeo, woodMat);
    backLeg.position.set(0, 2.4, -1.1);
    backLeg.rotation.x = 0.25;
    backLeg.castShadow = true;
    this.portraitGroup.add(backLeg);

    const shelfGeo = new THREE.BoxGeometry(2.4, 0.08, 0.2);
    const shelf = new THREE.Mesh(shelfGeo, goldMat);
    shelf.position.set(0, 2.0, 0.1);
    shelf.castShadow = true;
    this.portraitGroup.add(shelf);

    // Natural aspect ratio for 592x550 photo: 2.1 wide x 2.0 high
    const frameWidth = 2.1;
    const frameHeight = 2.0;
    const frameThick = 0.12;

    const frameOuterGeo = new THREE.BoxGeometry(frameWidth + 0.28, frameHeight + 0.28, frameThick);
    const frameMesh = new THREE.Mesh(frameOuterGeo, goldMat);
    frameMesh.position.set(0, 3.15, 0.15);
    frameMesh.rotation.x = -0.1;
    frameMesh.castShadow = true;
    this.portraitGroup.add(frameMesh);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'assets/image.png',
      (texture) => {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;

        const photoMat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.2,
          metalness: 0.1
        });
        const photoGeo = new THREE.PlaneGeometry(frameWidth, frameHeight);
        const photoMesh = new THREE.Mesh(photoGeo, photoMat);
        photoMesh.position.set(0, 3.15, 0.22);
        photoMesh.rotation.x = -0.1;
        photoMesh.name = 'portrait_frame';
        this.portraitGroup.add(photoMesh);
        this.interactiveObjects.push(photoMesh);
      }
    );

    const lightCount = 18;
    const fairyMat = new THREE.MeshBasicMaterial({ color: 0xffe680 });
    const fairyLight = new THREE.PointLight(0xffd700, 1.2, 5, 2);
    fairyLight.position.set(0, 3.15, 0.8);
    this.portraitGroup.add(fairyLight);

    const halfW = (frameWidth + 0.2) / 2;
    const halfH = (frameHeight + 0.2) / 2;
    const topY = 3.15 + halfH;
    const botY = 3.15 - halfH;

    for (let i = 0; i < lightCount; i++) {
      const progress = i / lightCount;
      let fx, fy;
      if (progress < 0.25) {
        fx = -halfW + (progress / 0.25) * (halfW * 2);
        fy = topY;
      } else if (progress < 0.5) {
        fx = halfW;
        fy = topY - ((progress - 0.25) / 0.25) * (topY - botY);
      } else if (progress < 0.75) {
        fx = halfW - ((progress - 0.5) / 0.25) * (halfW * 2);
        fy = botY;
      } else {
        fx = -halfW;
        fy = botY + ((progress - 0.75) / 0.25) * (topY - botY);
      }

      const fairy = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), fairyMat);
      fairy.position.set(fx, fy, 0.25);
      this.portraitGroup.add(fairy);
    }

    this.scene.add(this.portraitGroup);
  }

  createBalloonClusters() {
    const balloonColors = [0xffd700, 0xff416c, 0xec407a, 0x9c27b0, 0xffd180, 0xff1744];
    const balloonCount = 12;
    for (let i = 0; i < balloonCount; i++) {
      this.spawnBalloon(i, balloonColors[i % balloonColors.length]);
    }
  }

  spawnBalloon(index, colorHex) {
    const angle = (index / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist = 5.2 + Math.random() * 2.5;
    const baseY = 4.5 + Math.random() * 2.8;

    const balloonGroup = new THREE.Group();
    const bx = Math.cos(angle) * dist;
    const bz = Math.sin(angle) * dist;
    balloonGroup.position.set(bx, baseY, bz);

    const balloonGeo = new THREE.SphereGeometry(0.65, 24, 24);
    balloonGeo.scale(1, 1.25, 1);

    const balloonMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.6,
      roughness: 0.18
    });
    const balloonMesh = new THREE.Mesh(balloonGeo, balloonMat);
    balloonMesh.castShadow = true;
    balloonMesh.name = `balloon_${index}`;
    balloonGroup.add(balloonMesh);

    const knotGeo = new THREE.ConeGeometry(0.1, 0.12, 12);
    const knot = new THREE.Mesh(knotGeo, balloonMat);
    knot.position.y = -0.8;
    balloonGroup.add(knot);

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, -0.8, 0),
      new THREE.Vector3((Math.random() - 0.5) * 0.4, -2.2, (Math.random() - 0.5) * 0.4),
      new THREE.Vector3(0, -3.8, 0)
    );
    const points = curve.getPoints(20);
    const stringGeo = new THREE.BufferGeometry().setFromPoints(points);
    const stringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    const stringLine = new THREE.Line(stringGeo, stringMat);
    balloonGroup.add(stringLine);

    this.scene.add(balloonGroup);
    this.interactiveObjects.push(balloonMesh);

    this.balloons.push({
      group: balloonGroup,
      mesh: balloonMesh,
      baseY: baseY,
      origX: bx,
      origZ: bz,
      speed: 0.8 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      color: colorHex,
      isPopped: false
    });
  }

  popBalloon(balloonMesh) {
    const balloonData = this.balloons.find(b => b.mesh === balloonMesh);
    if (!balloonData || balloonData.isPopped) return;

    balloonData.isPopped = true;

    if (window.birthdayAudio) {
      window.birthdayAudio.playBalloonPop();
    }

    this.createMiniExplosion(balloonData.group.position, balloonData.color);

    if (window.gsap) {
      gsap.to(balloonData.group.scale, {
        x: 1.4,
        y: 1.4,
        z: 1.4,
        duration: 0.08,
        onComplete: () => {
          this.scene.remove(balloonData.group);
          setTimeout(() => this.respawnBalloon(balloonData), 3500);
        }
      });
    } else {
      this.scene.remove(balloonData.group);
      setTimeout(() => this.respawnBalloon(balloonData), 3500);
    }
  }

  respawnBalloon(balloonData) {
    balloonData.isPopped = false;
    balloonData.group.scale.set(0.01, 0.01, 0.01);
    this.scene.add(balloonData.group);

    if (window.gsap) {
      gsap.to(balloonData.group.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.8,
        ease: 'back.out(1.7)'
      });
    } else {
      balloonData.group.scale.set(1, 1, 1);
    }
  }

  createGiftBoxes() {
    const giftGroup = new THREE.Group();
    giftGroup.position.set(3.8, 0, 0.8);
    giftGroup.rotation.y = -0.4;

    const boxSize = 1.6;
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x800e2b,
      metalness: 0.3,
      roughness: 0.35
    });
    const goldRibbonMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.15
    });

    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(boxSize, boxSize * 0.9, boxSize), boxMat);
    boxMesh.position.y = (boxSize * 0.9) / 2;
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    giftGroup.add(boxMesh);

    const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(boxSize + 0.02, boxSize * 0.91, 0.26), goldRibbonMat);
    ribbonV.position.y = (boxSize * 0.9) / 2;
    giftGroup.add(ribbonV);

    const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(0.26, boxSize * 0.91, boxSize + 0.02), goldRibbonMat);
    ribbonH.position.y = (boxSize * 0.9) / 2;
    giftGroup.add(ribbonH);

    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, boxSize * 0.9, 0);

    const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(boxSize + 0.08, 0.24, boxSize + 0.08), boxMat);
    lidMesh.position.y = 0.12;
    lidMesh.castShadow = true;
    lidGroup.add(lidMesh);

    const lidRibbon1 = new THREE.Mesh(new THREE.BoxGeometry(boxSize + 0.1, 0.26, 0.26), goldRibbonMat);
    lidRibbon1.position.y = 0.12;
    lidGroup.add(lidRibbon1);

    const lidRibbon2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, boxSize + 0.1), goldRibbonMat);
    lidRibbon2.position.y = 0.12;
    lidGroup.add(lidRibbon2);

    const bowGeo = new THREE.TorusGeometry(0.25, 0.08, 12, 24);
    const bowLeft = new THREE.Mesh(bowGeo, goldRibbonMat);
    bowLeft.position.set(-0.18, 0.36, 0);
    bowLeft.rotation.y = Math.PI / 4;
    bowLeft.rotation.z = Math.PI / 4;
    lidGroup.add(bowLeft);

    const bowRight = new THREE.Mesh(bowGeo, goldRibbonMat);
    bowRight.position.set(0.18, 0.36, 0);
    bowRight.rotation.y = -Math.PI / 4;
    bowRight.rotation.z = -Math.PI / 4;
    lidGroup.add(bowRight);

    giftGroup.add(lidGroup);

    boxMesh.name = 'gift_box';
    lidMesh.name = 'gift_box';
    this.interactiveObjects.push(boxMesh);
    this.interactiveObjects.push(lidMesh);

    this.giftBoxes.push({
      group: giftGroup,
      lid: lidGroup,
      isOpen: false
    });

    this.scene.add(giftGroup);
  }

  openGiftBox() {
    const gift = this.giftBoxes[0];
    if (!gift) return;

    if (window.birthdayAudio) {
      window.birthdayAudio.playGiftOpen();
    }

    if (window.gsap) {
      gsap.to(gift.lid.position, {
        y: 2.8,
        z: -1.2,
        duration: 0.7,
        ease: 'back.out(2)'
      });
      gsap.to(gift.lid.rotation, {
        x: -0.8,
        z: 0.3,
        duration: 0.7,
        ease: 'power2.out'
      });
    }

    const burstPos = gift.group.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    this.createMiniExplosion(burstPos, 0xffd700, 35);
  }

  closeGiftBox() {
    const gift = this.giftBoxes[0];
    if (!gift) return;

    const boxSize = 1.6;
    if (window.gsap) {
      gsap.to(gift.lid.position, {
        x: 0,
        y: boxSize * 0.9,
        z: 0,
        duration: 0.6,
        ease: 'power2.inOut'
      });
      gsap.to(gift.lid.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.6,
        ease: 'power2.inOut'
      });
    }
  }

  createStardust() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = Math.random() * 9 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;

      vel.push({
        y: 0.003 + Math.random() * 0.007,
        radius: 3 + Math.random() * 5,
        speed: 0.2 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.18,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.stardust = new THREE.Points(geo, mat);
    this.stardustVel = vel;
    this.scene.add(this.stardust);
  }

  createAmbientLanterns() {
    const count = 16;
    for (let i = 0; i < count; i++) {
      this.spawnLantern(
        (Math.random() - 0.5) * 40,
        8 + Math.random() * 25,
        -15 - Math.random() * 30,
        0.6 + Math.random() * 0.4
      );
    }
  }

  spawnLantern(x, y, z, scale = 1.0, isCustom = false, customText = '') {
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(x, y, z);
    lanternGroup.scale.set(scale, scale, scale);

    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.32, 0.9, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xff7b25,
      emissive: 0xff5500,
      emissiveIntensity: 0.8,
      roughness: 0.5,
      transparent: true,
      opacity: 0.92
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    lanternGroup.add(bodyMesh);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3d1d07 });
    const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 16), ringMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 0.45;
    lanternGroup.add(topRing);

    const btmRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 16), ringMat);
    btmRing.rotation.x = Math.PI / 2;
    btmRing.position.y = -0.45;
    lanternGroup.add(btmRing);

    const innerLight = new THREE.PointLight(0xffaa44, 1.8, 6, 2);
    lanternGroup.add(innerLight);

    this.scene.add(lanternGroup);

    const lanternData = {
      group: lanternGroup,
      speedY: 0.015 + Math.random() * 0.02,
      driftX: (Math.random() - 0.5) * 0.008,
      driftZ: -0.01 - Math.random() * 0.01,
      swayFreq: 1.0 + Math.random(),
      isCustom: isCustom,
      text: customText
    };

    this.lanterns.push(lanternData);
    return lanternData;
  }

  launchWishLantern(wishText) {
    if (window.birthdayAudio) {
      window.birthdayAudio.playLanternSound();
    }

    const lantern = this.spawnLantern(0, 1.5, 3.5, 1.2, true, wishText);

    if (window.gsap) {
      gsap.from(lantern.group.scale, {
        x: 0.1,
        y: 0.1,
        z: 0.1,
        duration: 0.8,
        ease: 'back.out(1.5)'
      });
    }

    lantern.speedY = 0.045;
    lantern.driftZ = -0.035;
  }

  createMiniExplosion(position, colorHex, count = 20) {
    const geo = new THREE.SphereGeometry(0.04, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 1
    });

    const particles = [];
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.position.copy(position);
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        Math.random() * 0.25,
        (Math.random() - 0.5) * 0.25
      );

      particles.push({ mesh, vel, life: 1.0 });
    }

    const animInterval = setInterval(() => {
      let aliveCount = 0;
      for (const p of particles) {
        if (p.life > 0) {
          aliveCount++;
          p.mesh.position.add(p.vel);
          p.vel.y -= 0.008;
          p.mesh.material.opacity = p.life;
          p.life -= 0.04;
        } else {
          this.scene.remove(p.mesh);
        }
      }
      if (aliveCount === 0) {
        clearInterval(animInterval);
      }
    }, 20);
  }

  launchFirework() {
    if (window.birthdayAudio) {
      window.birthdayAudio.playFirework();
    }

    const startX = (Math.random() - 0.5) * 16;
    const targetY = 12 + Math.random() * 8;
    const targetZ = -5 - Math.random() * 12;

    const colors = [0xffd700, 0xff007f, 0x00ffff, 0x76ff03, 0xff3d00, 0xe040fb];
    const burstColor = colors[Math.floor(Math.random() * colors.length)];

    const rocketGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const rocketMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const rocket = new THREE.Mesh(rocketGeo, rocketMat);
    rocket.position.set(startX, 0, targetZ);
    this.scene.add(rocket);

    if (window.gsap) {
      gsap.to(rocket.position, {
        y: targetY,
        duration: 0.6,
        ease: 'power1.out',
        onComplete: () => {
          this.scene.remove(rocket);
          this.explodeFirework(new THREE.Vector3(startX, targetY, targetZ), burstColor);
        }
      });
    } else {
      setTimeout(() => {
        this.scene.remove(rocket);
        this.explodeFirework(new THREE.Vector3(startX, targetY, targetZ), burstColor);
      }, 600);
    }
  }

  explodeFirework(pos, colorHex) {
    const count = 90;
    const geo = new THREE.SphereGeometry(0.06, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 1
    });

    const particles = [];
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const speed = 0.15 + Math.random() * 0.22;

      const vel = new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi)
      );

      particles.push({ mesh, vel, life: 1.0 });
    }

    const fireworkFlash = new THREE.PointLight(colorHex, 5, 25, 2);
    fireworkFlash.position.copy(pos);
    this.scene.add(fireworkFlash);

    const animInterval = setInterval(() => {
      let aliveCount = 0;
      for (const p of particles) {
        if (p.life > 0) {
          aliveCount++;
          p.mesh.position.add(p.vel);
          p.vel.y -= 0.005;
          p.vel.multiplyScalar(0.97);
          p.mesh.material.opacity = p.life;
          p.life -= 0.025;
        } else {
          this.scene.remove(p.mesh);
        }
      }

      fireworkFlash.intensity *= 0.9;

      if (aliveCount === 0) {
        this.scene.remove(fireworkFlash);
        clearInterval(animInterval);
      }
    }, 20);
  }

  setCameraView(viewName) {
    const v = this.cameraViews[viewName];
    if (!v) return;

    this.isAutoRotating = false;

    if (window.gsap) {
      gsap.to(this.camera.position, {
        x: v.pos.x,
        y: v.pos.y,
        z: v.pos.z,
        duration: 1.4,
        ease: 'power2.inOut'
      });
      gsap.to(this.controls.target, {
        x: v.target.x,
        y: v.target.y,
        z: v.target.z,
        duration: 1.4,
        ease: 'power2.inOut',
        onUpdate: () => this.controls.update()
      });
    } else {
      this.camera.position.copy(v.pos);
      this.controls.target.copy(v.target);
      this.controls.update();
    }
  }

  onMouseMove(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    const tooltip = document.getElementById('scene-tooltip');

    if (intersects.length > 0) {
      const topObj = intersects[0].object;
      this.renderer.domElement.style.cursor = 'pointer';
      this.hoveredObject = topObj;

      if (tooltip) {
        let label = 'Click to interact';
        if (topObj.name && topObj.name.includes('candle')) label = '🎂 Click to Blow / Light Candle';
        else if (topObj.name && topObj.name.includes('balloon')) label = '🎈 Click to Pop Balloon!';
        else if (topObj.name && topObj.name.includes('portrait')) label = '💌 Click to View Special Wishes';
        else if (topObj.name && topObj.name.includes('gift')) label = '🎁 Click to Open Gift Box';

        tooltip.textContent = label;
        tooltip.style.left = `${e.clientX}px`;
        tooltip.style.top = `${e.clientY}px`;
        tooltip.classList.add('visible');
      }
    } else {
      this.renderer.domElement.style.cursor = 'default';
      this.hoveredObject = null;
      if (tooltip) tooltip.classList.remove('visible');
    }
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.updateCameraForViewport();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    if (this.cake) {
      this.cake.update(elapsedTime);
    }

    for (const b of this.balloons) {
      if (!b.isPopped) {
        b.group.position.y = b.baseY + Math.sin(elapsedTime * b.speed + b.phase) * 0.35;
        b.group.rotation.z = Math.sin(elapsedTime * 0.8 + b.phase) * 0.08;
        b.group.rotation.x = Math.cos(elapsedTime * 0.6 + b.phase) * 0.06;
      }
    }

    if (this.stardust) {
      const positions = this.stardust.geometry.attributes.position.array;
      for (let i = 0; i < this.stardustVel.length; i++) {
        const vel = this.stardustVel[i];
        positions[i * 3 + 1] += vel.y;
        positions[i * 3] += Math.sin(elapsedTime * vel.speed + vel.offset) * 0.005;

        if (positions[i * 3 + 1] > 10) {
          positions[i * 3 + 1] = 0.5;
        }
      }
      this.stardust.geometry.attributes.position.needsUpdate = true;
    }

    for (let i = this.lanterns.length - 1; i >= 0; i--) {
      const l = this.lanterns[i];
      l.group.position.y += l.speedY;
      l.group.position.x += l.driftX + Math.sin(elapsedTime * l.swayFreq) * 0.005;
      l.group.position.z += l.driftZ;
      l.group.rotation.y += 0.005;

      if (l.group.position.y > 60) {
        if (!l.isCustom) {
          l.group.position.y = 8;
          l.group.position.z = -15 - Math.random() * 20;
        } else {
          this.scene.remove(l.group);
          this.lanterns.splice(i, 1);
        }
      }
    }

    if (this.isAutoRotating) {
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.35;
    } else {
      this.controls.autoRotate = false;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.BirthdayScene = BirthdayScene;
