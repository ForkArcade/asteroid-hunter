// Asteroid Hunter — Rendering
// Layers: start/death screen, grid, asteroids, ship, bullets, effects, narrative, HUD
(function() {
  'use strict';
  var FA = window.FA;

  function setupLayers() {
    var cfg = FA.lookup('config', 'game');
    var colors = FA.lookup('config', 'colors');
    var ctx = FA.getCtx();

    // === START SCREEN ===
    FA.addLayer('startScreen', function() {
      var state = FA.getState();
      if (state.screen !== 'start') return;
      FA.draw.text('ASTEROID HUNTER', cfg.canvasWidth / 2, 200, { color: '#ff0', size: 48, bold: true, align: 'center' });
      FA.draw.text('Survive the asteroid field. Destroy everything.', cfg.canvasWidth / 2, 270, { color: '#888', size: 16, align: 'center' });
      FA.draw.text('WASD — fly | SHIFT — turbo', cfg.canvasWidth / 2, 340, { color: '#aaa', size: 14, align: 'center' });
      FA.draw.text('SPACE — shoot | Dodge and destroy asteroids', cfg.canvasWidth / 2, 370, { color: '#aaa', size: 14, align: 'center' });
      FA.draw.text('[SPACE] to launch', cfg.canvasWidth / 2, 450, { color: '#fff', size: 20, bold: true, align: 'center' });
    }, 0);

    // === DEATH SCREEN ===
    FA.addLayer('deathScreen', function() {
      var state = FA.getState();
      if (state.screen !== 'death') return;
      FA.draw.withAlpha(0.7, function() {
        FA.draw.rect(0, 0, cfg.canvasWidth, cfg.canvasHeight, '#000');
      });
      FA.draw.text('DESTROYED', cfg.canvasWidth / 2, 200, { color: '#f44', size: 48, bold: true, align: 'center' });
      FA.draw.text('Score: ' + state.score, cfg.canvasWidth / 2, 280, { color: '#fff', size: 24, align: 'center' });
      FA.draw.text('Asteroids: ' + state.asteroidsDestroyed + ' | Waves: ' + state.wave + ' | Time: ' + Math.floor(state.survivalTime) + 's', cfg.canvasWidth / 2, 330, { color: '#aaa', size: 14, align: 'center' });
      if (state.narrativeMessage) {
        FA.draw.text(state.narrativeMessage.text, cfg.canvasWidth / 2, 390, { color: state.narrativeMessage.color, size: 16, align: 'center' });
      }
      FA.draw.text('[R] restart', cfg.canvasWidth / 2, 460, { color: '#fff', size: 18, bold: true, align: 'center' });
    }, 0);

    // === BACKGROUND GRID ===
    FA.addLayer('grid', function() {
      var state = FA.getState();
      if (state.screen !== 'playing') return;
      var gridSize = 250;
      var ox = -(FA.camera.x % gridSize);
      var oy = -(FA.camera.y % gridSize);
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var x = ox; x < cfg.canvasWidth; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cfg.canvasHeight);
      }
      for (var y = oy; y < cfg.canvasHeight; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(cfg.canvasWidth, y);
      }
      ctx.stroke();
    }, 1);

    // === ASTEROIDS ===
    FA.addLayer('asteroids', function() {
      var state = FA.getState();
      if (state.screen !== 'playing') return;
      for (var i = 0; i < state.asteroids.length; i++) {
        var a = state.asteroids[i];
        var sx = a.x - FA.camera.x;
        var sy = a.y - FA.camera.y;
        if (sx < -60 || sx > cfg.canvasWidth + 60 || sy < -60 || sy > cfg.canvasHeight + 60) continue;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(a.angle);

        // Draw polygon
        var color = a.type === 'large' ? '#777' : a.type === 'medium' ? '#999' : '#bbb';
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(a.verts[0].x, a.verts[0].y);
        for (var v = 1; v < a.verts.length; v++) {
          ctx.lineTo(a.verts[v].x, a.verts[v].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }
    }, 3);

    // === SHIP ===
    FA.addLayer('ship', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || !state.ship) return;
      drawShip(state.ship, ctx, cfg, colors);
    }, 5);

    // === BULLETS ===
    FA.addLayer('bullets', function() {
      var state = FA.getState();
      if (state.screen !== 'playing') return;
      for (var i = 0; i < state.bullets.length; i++) {
        var b = state.bullets[i];
        var sx = b.x - FA.camera.x, sy = b.y - FA.camera.y;
        if (sx < -20 || sx > cfg.canvasWidth + 20 || sy < -20 || sy > cfg.canvasHeight + 20) continue;
        ctx.save();
        ctx.shadowColor = colors.bulletFriendly;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = colors.bulletFriendly;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - b.vx * 0.3, sy - b.vy * 0.3);
        ctx.stroke();
        ctx.restore();
      }
    }, 10);

    // === EFFECTS ===
    FA.addLayer('effects', function() {
      FA.drawFloats();
    }, 15);

    // === NARRATIVE ===
    FA.addLayer('narrative', function() {
      var state = FA.getState();
      if (state.screen !== 'playing') return;
      if (!state.narrativeMessage || state.narrativeMessage.life <= 0) return;
      var alpha = Math.min(1, state.narrativeMessage.life / 1000);
      FA.draw.withAlpha(alpha, function() {
        FA.draw.rect(0, 0, cfg.canvasWidth, 40, 'rgba(0,0,0,0.6)');
        FA.draw.text(state.narrativeMessage.text, cfg.canvasWidth / 2, 12,
          { color: state.narrativeMessage.color, size: 16, align: 'center' });
      });
    }, 25);

    // === HUD ===
    FA.addLayer('hud', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || !state.ship) return;
      var y = cfg.canvasHeight - 30;
      var coreHp = 0, coreMax = 0, parts = state.ship.parts.length;
      for (var i = 0; i < state.ship.parts.length; i++) {
        var p = state.ship.parts[i];
        if (p.type === 'core') { coreHp += p.hp; coreMax += p.maxHp; }
      }
      var info = 'Hull: ' + coreHp + '/' + coreMax +
                 ' | Parts: ' + parts +
                 ' | Wave: ' + state.wave +
                 ' | Asteroids: ' + state.asteroids.length +
                 ' | Score: ' + state.score;
      FA.draw.rect(0, y - 5, cfg.canvasWidth, 35, 'rgba(0,0,0,0.5)');
      FA.draw.text(info, 10, y, { color: colors.text, size: 14 });
    }, 30);
  }

  // === DRAW SHIP ===

  function drawShip(ship, ctx, cfg, colors) {
    var sx = ship.x - FA.camera.x;
    var sy = ship.y - FA.camera.y;
    if (sx < -200 || sx > cfg.canvasWidth + 200 || sy < -200 || sy > cfg.canvasHeight + 200) return;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ship.angle);

    for (var i = 0; i < ship.parts.length; i++) {
      var part = ship.parts[i];
      var conn = Physics.isConnected(ship.parts, i);
      var partAlpha = conn ? 1.0 : 0.4;
      var color = part.type === 'core' ? colors.playerCore :
                  part.type === 'engine' ? colors.playerEngine :
                  colors.playerGun;
      if (!conn) color = '#555';
      var def = FA.lookup('partTypes', part.type);
      var ch = def ? def.char : '?';
      var hitFlash = (Date.now() - part.lastHit) < 100;
      if (hitFlash) color = '#fff';

      FA.draw.withAlpha(partAlpha, function() {
        if (part.type === 'engine' && ship.activeEngines && ship.activeEngines.has(part)) {
          ctx.save();
          ctx.shadowColor = '#0ff';
          ctx.shadowBlur = 10;
          FA.draw.rect(part.x - 4, part.y + 12, 8, 6 + Math.random() * 8, '#0ff');
          ctx.restore();
        }
        FA.draw.sprite('player', part.type, part.x - 10, part.y - 10, 20, ch, color);
      });

      if (part.type === 'core' && part.hp < part.maxHp) {
        FA.draw.bar(part.x - 12, part.y + 12, 24, 3, part.hp / part.maxHp, '#f44', '#400');
      }
    }

    ctx.restore();
  }

  window.Render = {
    setup: setupLayers
  };

})();
