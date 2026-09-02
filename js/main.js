document.addEventListener('DOMContentLoaded', () => {
  const sceneInstance = new BirthdayScene('canvas-container');
  window.appScene = sceneInstance;

  const introScreen = document.getElementById('intro-screen');
  const enterBtn = document.getElementById('enter-btn');
  const musicBtn = document.getElementById('music-btn');
  const soundBtn = document.getElementById('sound-btn');
  const themeBtn = document.getElementById('theme-btn');
  const snapshotBtn = document.getElementById('snapshot-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const brandBadge = document.getElementById('brand-badge');

  const blowCandleBtn = document.getElementById('blow-candle-btn');
  const fireworksBtn = document.getElementById('fireworks-btn');
  const confettiBtn = document.getElementById('confetti-btn');
  const lanternBtn = document.getElementById('lantern-btn');
  const giftBtn = document.getElementById('gift-btn');
  const tributeBtn = document.getElementById('tribute-btn');

  const camButtons = document.querySelectorAll('.cam-btn');
  const modalBackdrops = document.querySelectorAll('.modal-backdrop');
  const modalCloseButtons = document.querySelectorAll('.modal-close');

  const tributeModal = document.getElementById('tribute-modal');
  const lanternModal = document.getElementById('lantern-modal');
  const giftModal = document.getElementById('gift-modal');
  const themeModal = document.getElementById('theme-modal');

  const sendWishBtn = document.getElementById('send-wish-btn');
  const lanternInput = document.getElementById('lantern-input');
  const presetChips = document.querySelectorAll('.preset-chip');
  const themeCards = document.querySelectorAll('.theme-card');

  const toastElement = document.getElementById('toast-notification');
  const snapshotFlash = document.getElementById('snapshot-flash');

  let isAudioMuted = false;

  if (window.birthdayAudio) {
    window.birthdayAudio.onStateChange = (isPlaying) => {
      if (isPlaying) {
        musicBtn.classList.add('playing');
        musicBtn.title = 'Pause Music';
      } else {
        musicBtn.classList.remove('playing');
        musicBtn.title = 'Play Music';
      }
    };
  }

  function showToast(message, duration = 3000) {
    if (!toastElement) return;
    toastElement.textContent = message;
    toastElement.classList.add('show');
    clearTimeout(toastElement._timeout);
    toastElement._timeout = setTimeout(() => {
      toastElement.classList.remove('show');
    }, duration);
  }

  function openModal(modal) {
    if (!modal) return;
    closeAllModals();
    modal.classList.add('active');
    if (window.birthdayAudio) window.birthdayAudio.playClick();
  }

  function closeAllModals() {
    modalBackdrops.forEach((m) => m.classList.remove('active'));
    if (sceneInstance.giftBoxes[0] && sceneInstance.giftBoxes[0].isOpen) {
      sceneInstance.closeGiftBox();
      sceneInstance.giftBoxes[0].isOpen = false;
    }
  }

  modalCloseButtons.forEach((btn) => {
    btn.addEventListener('click', () => closeAllModals());
  });

  modalBackdrops.forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeAllModals();
    });
  });

  function triggerCelebrationConfetti() {
    if (window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#ff3366', '#ffffff', '#ff9a9e', '#f5af19']
      });

      setTimeout(() => {
        window.confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#ffd700', '#ff416c', '#00e5ff']
        });
        window.confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#ffd700', '#ff416c', '#00e5ff']
        });
      }, 250);
    }
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      if (window.birthdayAudio) {
        window.birthdayAudio.startMusic();
      }

      introScreen.classList.add('hidden');
      sceneInstance.setCameraView('overview');

      setTimeout(() => {
        triggerCelebrationConfetti();
        showToast('✨ Happy Birthday to You! Enjoy your day!');
      }, 800);
    });
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      if (window.birthdayAudio) {
        const isPlaying = window.birthdayAudio.toggleMusic();
        showToast(isPlaying ? '🎵 Birthday Melody Playing' : '⏸️ Music Paused');
      }
    });
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      if (window.birthdayAudio) {
        isAudioMuted = !isAudioMuted;
        window.birthdayAudio.isMuted = isAudioMuted;
        soundBtn.innerHTML = isAudioMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
        showToast(isAudioMuted ? '🔇 Sound Muted' : '🔊 Sound Enabled');
      }
    });
  }

  camButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      camButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const viewName = btn.dataset.view;
      sceneInstance.setCameraView(viewName);
      if (window.birthdayAudio) window.birthdayAudio.playClick();
    });
  });

  if (blowCandleBtn) {
    blowCandleBtn.addEventListener('click', () => {
      const wasBlown = sceneInstance.cake.blowCandle();

      if (wasBlown) {
        if (window.birthdayAudio) window.birthdayAudio.playBlowCandles();
        triggerCelebrationConfetti();
        showToast('✨ Happy Birthday! May all your wishes come true!');
        blowCandleBtn.innerHTML = '<i class="fa-solid fa-fire"></i> Relight Candle';
        blowCandleBtn.classList.remove('primary');
        blowCandleBtn.classList.add('gold');

        setTimeout(() => sceneInstance.launchFirework(), 600);
        setTimeout(() => sceneInstance.launchFirework(), 1200);
      } else {
        if (window.birthdayAudio) window.birthdayAudio.playClick();
        showToast('🕯️ Candle lit! Make a wish!');
        blowCandleBtn.innerHTML = '<i class="fa-solid fa-cake-candles"></i> Blow Candle';
        blowCandleBtn.classList.remove('gold');
        blowCandleBtn.classList.add('primary');
      }
    });
  }

  if (fireworksBtn) {
    fireworksBtn.addEventListener('click', () => {
      showToast('🎆 Fireworks in the sky!');
      sceneInstance.launchFirework();
      setTimeout(() => sceneInstance.launchFirework(), 400);
      setTimeout(() => sceneInstance.launchFirework(), 900);
      setTimeout(() => sceneInstance.launchFirework(), 1400);
    });
  }

  if (confettiBtn) {
    confettiBtn.addEventListener('click', () => {
      if (window.birthdayAudio) window.birthdayAudio.playConfetti();
      triggerCelebrationConfetti();
      showToast('🎉 Confetti Shower!');
    });
  }

  if (lanternBtn) {
    lanternBtn.addEventListener('click', () => {
      openModal(lanternModal);
    });
  }

  if (sendWishBtn) {
    sendWishBtn.addEventListener('click', () => {
      const wishText = lanternInput.value.trim() || 'Wishing you endless joy, health, and success!';
      sceneInstance.launchWishLantern(wishText);
      closeAllModals();
      lanternInput.value = '';
      showToast('🏮 Your wish lantern is flying high into the sky!');
      triggerCelebrationConfetti();
    });
  }

  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      lanternInput.value = chip.dataset.wish;
      if (window.birthdayAudio) window.birthdayAudio.playClick();
    });
  });

  if (giftBtn) {
    giftBtn.addEventListener('click', () => {
      sceneInstance.setCameraView('gift');
      setTimeout(() => {
        sceneInstance.openGiftBox();
        setTimeout(() => openModal(giftModal), 500);
      }, 600);
    });
  }

  if (tributeBtn) {
    tributeBtn.addEventListener('click', () => {
      sceneInstance.setCameraView('portrait');
      setTimeout(() => openModal(tributeModal), 600);
    });
  }

  if (brandBadge) {
    brandBadge.addEventListener('click', () => {
      sceneInstance.setCameraView('portrait');
      setTimeout(() => openModal(tributeModal), 600);
    });
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      openModal(themeModal);
    });
  }

  themeCards.forEach((card) => {
    card.addEventListener('click', () => {
      themeCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');

      const themeName = card.dataset.theme;
      sceneInstance.cake.setTheme(themeName);
      if (window.birthdayAudio) window.birthdayAudio.playClick();
      showToast(`🎨 Theme changed to ${card.querySelector('.theme-name').textContent}`);
      setTimeout(() => closeAllModals(), 400);
    });
  });

  const canvasElement = sceneInstance.renderer.domElement;
  function handleCanvasPointer(e) {
    const rect = canvasElement.getBoundingClientRect();
    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0);
    const clientY = e.clientY || (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0);
    if (!clientX && !clientY) return;

    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    sceneInstance.raycaster.setFromCamera(new THREE.Vector2(x, y), sceneInstance.camera);
    const intersects = sceneInstance.raycaster.intersectObjects(sceneInstance.interactiveObjects, true);

    if (intersects.length > 0) {
      const topObj = intersects[0].object;
      const name = topObj.name;

      if (name && name.includes('candle')) {
        blowCandleBtn.click();
      } else if (name && name.includes('balloon')) {
        sceneInstance.popBalloon(topObj);
        showToast('🎈 Balloon popped!');
      } else if (name && name.includes('portrait')) {
        tributeBtn.click();
      } else if (name && name.includes('gift')) {
        giftBtn.click();
      }
    }
  }

  canvasElement.addEventListener('click', handleCanvasPointer);


  if (snapshotBtn) {
    snapshotBtn.addEventListener('click', () => {
      if (snapshotFlash) {
        snapshotFlash.classList.add('flash');
        setTimeout(() => snapshotFlash.classList.remove('flash'), 200);
      }

      if (window.birthdayAudio) window.birthdayAudio.playClick();

      sceneInstance.renderer.render(sceneInstance.scene, sceneInstance.camera);

      const canvas3d = sceneInstance.renderer.domElement;
      const memCanvas = document.createElement('canvas');
      memCanvas.width = canvas3d.width;
      memCanvas.height = canvas3d.height;
      const ctx = memCanvas.getContext('2d');

      ctx.drawImage(canvas3d, 0, 0);

      const w = memCanvas.width;
      const h = memCanvas.height;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      ctx.fillStyle = 'rgba(12, 4, 25, 0.75)';
      ctx.fillRect(20, h - 90, w - 40, 70);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 26px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.fillText('Happy Birthday! Wishing you a wonderful year ahead ✨', w / 2, h - 48);

      const link = document.createElement('a');
      link.download = `Happy_Birthday_Souvenir_${new Date().getFullYear()}.png`;
      link.href = memCanvas.toDataURL('image/png');
      link.click();

      showToast('📸 Souvenir Photo Saved!');
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
        showToast('🖥️ Fullscreen Mode');
      } else {
        document.exitFullscreen().catch(() => {});
        fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
      }
    });
  }
});
