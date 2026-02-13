// Asteroid Hunter — Entry Point
// Keybindings, game loop, ForkArcade integration
(function() {
  'use strict';
  var FA = window.FA;
  var cfg = FA.lookup('config', 'game');
  var colors = FA.lookup('config', 'colors');

  FA.initCanvas('game', cfg.canvasWidth, cfg.canvasHeight);

  // === KEYBINDINGS ===
  FA.bindKey('thrust',    ['w', 'ArrowUp']);
  FA.bindKey('brake',     ['s', 'ArrowDown']);
  FA.bindKey('turnLeft',  ['a', 'ArrowLeft']);
  FA.bindKey('turnRight', ['d', 'ArrowRight']);
  FA.bindKey('shoot',     [' ']);
  FA.bindKey('turbo',     ['Shift']);
  FA.bindKey('start',     [' ']);
  FA.bindKey('restart',   ['r']);

  // === INPUT ===
  FA.on('input:action', function(data) {
    var state = FA.getState();
    if (state.screen === 'start' && (data.action === 'start' || data.action === 'shoot')) {
      Ship.beginGame();
      return;
    }
    if (state.screen === 'death' && data.action === 'restart') {
      Ship.startScreen();
      return;
    }
  });

  // === SCORE ===
  FA.on('game:over', function(data) {
    if (typeof ForkArcade !== 'undefined') {
      ForkArcade.submitScore(data.score);
    }
  });

  // === GAME LOOP ===
  FA.setUpdate(function(dt) {
    var state = FA.getState();
    if (state.screen !== 'playing') return;

    // Player input
    if (state.ship) {
      state.ship.activeEngines = new Set();
      var turbo = FA.isHeld('turbo') ? cfg.turboMultiplier : 1;
      var base = cfg.thrustBase * turbo;

      if (FA.isHeld('thrust')) {
        for (var i = 0; i < state.ship.parts.length; i++) {
          if (state.ship.parts[i].type === 'engine' && Physics.isConnected(state.ship.parts, i)) {
            Physics.applyThrust(state.ship, state.ship.parts[i], base);
          }
        }
      }
      if (FA.isHeld('brake')) {
        state.ship.vx *= 0.95;
        state.ship.vy *= 0.95;
      }
      if (FA.isHeld('turnLeft'))  Physics.applyTurn(state.ship, 'left', base * 0.8);
      if (FA.isHeld('turnRight')) Physics.applyTurn(state.ship, 'right', base * 0.8);
      if (FA.isHeld('shoot')) Ship.playerShoot(state);

      Physics.updatePhysics(state.ship);

      // Camera
      FA.camera.x = state.ship.x - cfg.canvasWidth / 2;
      FA.camera.y = state.ship.y - cfg.canvasHeight / 2;
    }

    // Arena boundary check
    Ship.checkArenaBoundary(state);
    if (state.screen === 'death') return;

    // Asteroids
    Ship.updateAsteroids(state);
    Ship.updateBullets(state);
    Ship.checkAsteroidCollision(state);
    if (state.screen === 'death') return;

    // Station collision
    Ship.checkAsteroidStationCollision(state);
    if (state.screen === 'death') return;

    // Repairs
    Ship.updateRepairs(state, dt);

    // Effects
    FA.updateEffects(dt);
    FA.updateFloats(dt);

    // Narrative timer
    if (state.narrativeMessage && state.narrativeMessage.life > 0) {
      state.narrativeMessage.life -= dt;
    }

    // Survival time
    state.survivalTime += dt / 1000;

    // Wave spawning — when all asteroids are destroyed
    if (state.asteroids.length === 0) {
      state.waveTimer += dt;
      if (state.waveTimer >= cfg.waveDelay) {
        state.waveTimer = 0;
        Ship.showNarrative('wave_clear');
        Ship.spawnWave(state);
      }
    }

    // Connectivity check
    if (state.ship) {
      for (var c = state.ship.parts.length - 1; c >= 0; c--) {
        if (state.ship.parts[c].type !== 'core' && !Physics.isConnected(state.ship.parts, c)) {
          state.ship.parts.splice(c, 1);
        }
      }
    }

    FA.clearInput();
  });

  FA.setRender(function() {
    FA.draw.clear(colors.bg);
    FA.renderLayers();
  });

  // === START ===
  Render.setup();
  Ship.startScreen();

  if (typeof ForkArcade !== 'undefined') {
    ForkArcade.onReady(function() {});
  }

  FA.start();
})();
