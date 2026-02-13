// Asteroid Hunter — Rendering
// Layers: start/death screen, grid, arena, station, asteroids, ship, bullets, effects, warnings, narrative, HUD
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
      FA.draw.text('ASTEROID HUNTER', cfg.canvasWidth / 2, 160, { color: '#ff0', size: 48, bold: true, align: 'center' });
      FA.draw.text('Defend the orbital station from asteroid waves.', cfg.canvasWidth / 2, 230, { color: '#aaa', size: 16, align: 'center' });
      FA.draw.text('Fly near the station to repair your ship and the station.', cfg.canvasWidth / 2, 260, { color: '#4f8', size: 14, align: 'center' });
      FA.draw.text('Stay inside the safe zone — leaving means death!', cfg.canvasWidth / 2, 290, { color: '#f88', size: 14, align: 'center' });
      FA.draw.text('WASD — fly | SHIFT — turbo | SPACE — shoot', cfg.canvasWidth / 2, 350, { color: '#aaa', size: 14, align: 'center' });
      FA.draw.text('[SPACE] to launch', cfg.canvasWidth / 2, 430, { color: '#fff', size: 20, bold: true, align: 'center' });
    }, 0);

    // === DEATH SCREEN ===
    FA.addLayer('deathScreen', function() {
      var state = FA.getState();
      if (state.screen !== 'death') return;
      FA.draw.withAlpha(0.7, function() {
        FA.draw.rect(0, 0, cfg.canvasWidth, cfg.canvasHeight, '#000');
      });

      var reason = state.deathReason;
      var title = 'DESTROYED';
      var subtitle = '';
      if (reason === 'station') {
        title = 'STATION LOST';
        subtitle = 'The orbital station was destroyed.';
      } else if (reason === 'boundary') {
        title = 'LEFT SAFE ZONE';
        subtitle = 'You drifted too far from the station.';
      } else {
        subtitle = 'Your ship was destroyed.';
      }

      FA.draw.text(title, cfg.canvasWidth / 2, 180, { color: '#f44', size: 48, bold: true, align: 'center' });
      FA.draw.text(subtitle, cfg.canvasWidth / 2, 230, { color: '#f88', size: 16, align: 'center' });
      FA.draw.text('Score: ' + state.score, cfg.canvasWidth / 2, 290, { color: '#fff', size: 24, align: 'center' });

      var stats = 'Asteroids: ' + state.asteroidsDestroyed +
                  ' | Waves: ' + state.wave +
                  ' | Time: ' + Math.floor(state.survivalTime) + 's';
      if (state.station) {
        stats += ' | Station HP: ' + state.station.hp + '/' + state.station.maxHp;
      }
      FA.draw.text(stats, cfg.canvasWidth / 2, 340, { color: '#aaa', size: 14, align: 'center' });

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

    // === ARENA BOUNDARY ===
    FA.addLayer('arena', function() {
      var state = FA.getState();
      if (state.screen !== 'playing') return;

      var cx = -FA.camera.x;
      var cy = -FA.camera.y;
      var r = cfg.arenaRadius;

      // Main boundary circle
      ctx.save();
      ctx.setLineDash([15, 10]);
      var warn = state.boundaryWarning || 0;
      if (warn > 0) {
        // Pulsing red when in danger zone
        var pulse = 0.4 + Math.sin(Date.now() * 0.008) * 0.3;
        ctx.strokeStyle = 'rgba(255,' + Math.floor(60 * (1 - warn)) + ',60,' + (0.3 + warn * pulse) + ')';
        ctx.lineWidth = 2 + warn * 2;
      } else {
        ctx.strokeStyle = 'rgba(34,68,170,0.3)';
        ctx.lineWidth = 1.5;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Warning zone ring (inner)
      var warningR = r * cfg.arenaWarning;
      ctx.strokeStyle = 'rgba(34,68,170,0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.arc(cx, cy, warningR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    }, 2);

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

    // === STATION ===
    FA.addLayer('station', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || !state.station) return;

      var st = state.station;
      var sx = st.x - FA.camera.x;
      var sy = st.y - FA.camera.y;
      if (sx < -100 || sx > cfg.canvasWidth + 100 || sy < -100 || sy > cfg.canvasHeight + 100) return;

      var ratio = st.hp / st.maxHp;
      var hitFlash = (Date.now() - st.lastHit) < 150;

      ctx.save();
      ctx.translate(sx, sy);

      // Repair field glow (when player is in range)
      if (state.repairing) {
        var glowPulse = 0.08 + Math.sin(Date.now() * 0.004) * 0.04;
        ctx.fillStyle = 'rgba(68,255,136,' + glowPulse + ')';
        ctx.beginPath();
        ctx.arc(0, 0, cfg.stationRepairRange, 0, Math.PI * 2);
        ctx.fill();
      }

      // Station body — octagon
      var stColor;
      if (hitFlash) {
        stColor = '#fff';
      } else if (ratio > 0.5) {
        stColor = colors.station;
      } else if (ratio > 0.3) {
        stColor = colors.stationDamaged;
      } else {
        stColor = colors.stationCritical;
      }

      // Outer ring
      ctx.strokeStyle = stColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, st.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner octagon
      ctx.fillStyle = stColor;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      var innerR = st.radius * 0.7;
      for (var i = 0; i < 8; i++) {
        var ang = (i / 8) * Math.PI * 2 - Math.PI / 8;
        var px = Math.cos(ang) * innerR;
        var py = Math.sin(ang) * innerR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Octagon outline
      ctx.strokeStyle = stColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var i = 0; i < 8; i++) {
        var ang = (i / 8) * Math.PI * 2 - Math.PI / 8;
        var px = Math.cos(ang) * innerR;
        var py = Math.sin(ang) * innerR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Center dot
      ctx.fillStyle = stColor;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Docking arms (4 lines)
      ctx.strokeStyle = stColor;
      ctx.lineWidth = 1;
      for (var i = 0; i < 4; i++) {
        var ang = (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * innerR, Math.sin(ang) * innerR);
        ctx.lineTo(Math.cos(ang) * st.radius, Math.sin(ang) * st.radius);
        ctx.stroke();
      }

      // HP bar below station
      var barW = 60, barH = 5;
      var barX = -barW / 2, barY = st.radius + 10;
      ctx.fillStyle = '#400';
      ctx.fillRect(barX, barY, barW, barH);
      var hpColor = ratio > 0.5 ? '#4cf' : ratio > 0.3 ? '#f80' : '#f44';
      ctx.fillStyle = hpColor;
      ctx.fillRect(barX, barY, barW * ratio, barH);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, barY, barW, barH);

      // Label
      FA.draw.text('STATION', sx, sy + st.radius + 22, { color: '#888', size: 10, align: 'center' });

      ctx.restore();
    }, 4);

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

    // === WARNINGS OVERLAY ===
    FA.addLayer('warnings', function() {
      var state = FA.getState();
      if (state.screen !== 'playing') return;

      var warn = state.boundaryWarning || 0;
      if (warn > 0) {
        // Red vignette on screen edges
        var alpha = warn * (0.2 + Math.sin(Date.now() * 0.006) * 0.1);
        var grad = ctx.createRadialGradient(
          cfg.canvasWidth / 2, cfg.canvasHeight / 2, cfg.canvasWidth * 0.3,
          cfg.canvasWidth / 2, cfg.canvasHeight / 2, cfg.canvasWidth * 0.6
        );
        grad.addColorStop(0, 'rgba(255,0,0,0)');
        grad.addColorStop(1, 'rgba(255,0,0,' + alpha + ')');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cfg.canvasWidth, cfg.canvasHeight);

        // Warning text
        if (warn > 0.3) {
          var textAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
          FA.draw.withAlpha(textAlpha, function() {
            FA.draw.text('!! RETURN TO STATION !!', cfg.canvasWidth / 2, cfg.canvasHeight / 2 - 60,
              { color: '#f44', size: 22, bold: true, align: 'center' });
          });
        }
      }

      // Station direction indicator (arrow pointing to station when off-screen)
      if (state.ship && state.station) {
        var stSx = state.station.x - FA.camera.x;
        var stSy = state.station.y - FA.camera.y;
        var margin = 60;
        if (stSx < margin || stSx > cfg.canvasWidth - margin || stSy < margin || stSy > cfg.canvasHeight - margin) {
          // Station is off-screen, draw arrow
          var angle = Math.atan2(stSy - cfg.canvasHeight / 2, stSx - cfg.canvasWidth / 2);
          var edgeX = cfg.canvasWidth / 2 + Math.cos(angle) * (cfg.canvasWidth / 2 - 40);
          var edgeY = cfg.canvasHeight / 2 + Math.sin(angle) * (cfg.canvasHeight / 2 - 40);
          edgeX = Math.max(30, Math.min(cfg.canvasWidth - 30, edgeX));
          edgeY = Math.max(30, Math.min(cfg.canvasHeight - 60, edgeY));

          var stDist = Math.hypot(state.ship.x - state.station.x, state.ship.y - state.station.y);
          var arrowColor = stDist > cfg.arenaRadius * 0.6 ? '#f80' : '#4cf';

          ctx.save();
          ctx.translate(edgeX, edgeY);
          ctx.rotate(angle);
          ctx.fillStyle = arrowColor;
          ctx.beginPath();
          ctx.moveTo(10, 0);
          ctx.lineTo(-6, -6);
          ctx.lineTo(-6, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          FA.draw.text(Math.floor(stDist) + 'px', edgeX, edgeY + 14, { color: arrowColor, size: 10, align: 'center' });
        }
      }
    }, 20);

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
      FA.draw.rect(0, y - 5, cfg.canvasWidth, 35, 'rgba(0,0,0,0.6)');

      // Ship hull
      var coreHp = 0, coreMax = 0;
      for (var i = 0; i < state.ship.parts.length; i++) {
        var p = state.ship.parts[i];
        if (p.type === 'core') { coreHp += p.hp; coreMax += p.maxHp; }
      }
      var hullColor = coreHp > coreMax * 0.5 ? '#4cf' : coreHp > coreMax * 0.3 ? '#f80' : '#f44';
      FA.draw.text('Hull: ' + coreHp + '/' + coreMax, 10, y, { color: hullColor, size: 13 });

      // Station HP
      if (state.station) {
        var stRatio = state.station.hp / state.station.maxHp;
        var stColor = stRatio > 0.5 ? '#4cf' : stRatio > 0.3 ? '#f80' : '#f44';
        FA.draw.text('Station: ' + state.station.hp + '/' + state.station.maxHp, 140, y, { color: stColor, size: 13 });
      }

      // Wave & asteroids
      FA.draw.text('Wave: ' + state.wave, 310, y, { color: '#aaa', size: 13 });
      FA.draw.text('Asteroids: ' + state.asteroids.length, 400, y, { color: '#aaa', size: 13 });

      // Repair indicator
      if (state.repairing) {
        var repPulse = 0.6 + Math.sin(Date.now() * 0.008) * 0.4;
        FA.draw.withAlpha(repPulse, function() {
          FA.draw.text('REPAIRING', 550, y, { color: '#4f8', size: 13, bold: true });
        });
      }

      // Score
      FA.draw.text('Score: ' + state.score, cfg.canvasWidth - 10, y, { color: '#ff0', size: 13, align: 'right' });

      // Parts count
      FA.draw.text('Parts: ' + state.ship.parts.length, 640, y, { color: '#888', size: 11 });
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
