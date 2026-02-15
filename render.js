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
      FA.draw.text('ASTEROID HUNTER', cfg.canvasWidth / 2, 120, { color: '#ff0', size: 48, bold: true, align: 'center' });
      FA.draw.text('CORIOLIS-7 STATION DEFENSE', cfg.canvasWidth / 2, 170, { color: '#4cf', size: 16, align: 'center' });

      FA.draw.text('Defend the orbital station from incoming asteroid waves.', cfg.canvasWidth / 2, 230, { color: '#aaa', size: 15, align: 'center' });
      FA.draw.text('The station\'s gravity well pulls objects inward.', cfg.canvasWidth / 2, 255, { color: '#88f', size: 13, align: 'center' });
      FA.draw.text('Dock with the station to repair hull and refuel engines.', cfg.canvasWidth / 2, 280, { color: '#4f8', size: 13, align: 'center' });
      FA.draw.text('Stay inside the safe zone — beyond lies only the void.', cfg.canvasWidth / 2, 305, { color: '#f88', size: 13, align: 'center' });
      FA.draw.text('Manage your fuel carefully — no fuel means no thrust.', cfg.canvasWidth / 2, 330, { color: '#f80', size: 13, align: 'center' });

      FA.draw.text('WASD / Arrows — fly | SHIFT — turbo (uses more fuel)', cfg.canvasWidth / 2, 380, { color: '#777', size: 12, align: 'center' });
      FA.draw.text('SPACE — shoot', cfg.canvasWidth / 2, 400, { color: '#777', size: 12, align: 'center' });

      var pulse = 0.5 + Math.sin(Date.now() * 0.004) * 0.5;
      FA.draw.pushAlpha(pulse);
      FA.draw.text('[SPACE] to launch', cfg.canvasWidth / 2, 460, { color: '#fff', size: 22, bold: true, align: 'center' });
      FA.draw.popAlpha();
    }, 0);

    // === DEATH SCREEN ===
    FA.addLayer('deathScreen', function() {
      var state = FA.getState();
      if (state.screen !== 'death') return;
      FA.draw.pushAlpha(0.75);
      FA.draw.rect(0, 0, cfg.canvasWidth, cfg.canvasHeight, '#000');
      FA.draw.popAlpha();

      var reason = state.deathReason;
      var title = 'DESTROYED';
      var subtitle = '';
      if (reason === 'station') {
        title = 'STATION LOST';
        subtitle = 'Coriolis-7 was destroyed. All hands lost.';
      } else if (reason === 'boundary') {
        title = 'LOST IN THE VOID';
        subtitle = 'You drifted beyond the operational zone. No rescue possible.';
      } else {
        subtitle = 'Your ship was destroyed. The station is now undefended.';
      }

      FA.draw.text(title, cfg.canvasWidth / 2, 160, { color: '#f44', size: 48, bold: true, align: 'center' });
      FA.draw.text(subtitle, cfg.canvasWidth / 2, 210, { color: '#f88', size: 15, align: 'center' });

      FA.draw.text('FINAL SCORE: ' + state.score, cfg.canvasWidth / 2, 270, { color: '#ff0', size: 28, bold: true, align: 'center' });

      var stats = 'Asteroids: ' + state.asteroidsDestroyed +
                  '  |  Waves: ' + state.wave +
                  '  |  Time: ' + Math.floor(state.survivalTime) + 's';
      FA.draw.text(stats, cfg.canvasWidth / 2, 320, { color: '#aaa', size: 14, align: 'center' });

      if (state.station) {
        var stStatus = state.station.hp > 0
          ? 'Station survived: ' + state.station.hp + '/' + state.station.maxHp + ' HP'
          : 'Station destroyed';
        var stClr = state.station.hp > 0 ? '#4cf' : '#f44';
        FA.draw.text(stStatus, cfg.canvasWidth / 2, 350, { color: stClr, size: 14, align: 'center' });
      }

      if (state.narrativeMessage) {
        FA.draw.text(state.narrativeMessage.text, cfg.canvasWidth / 2, 400, { color: state.narrativeMessage.color, size: 14, align: 'center' });
      }

      var rpulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
      FA.draw.pushAlpha(rpulse);
      FA.draw.text('[R] try again', cfg.canvasWidth / 2, 470, { color: '#fff', size: 20, bold: true, align: 'center' });
      FA.draw.popAlpha();
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

      ctx.save();
      ctx.setLineDash([15, 10]);
      var warn = state.boundaryWarning || 0;
      if (warn > 0) {
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

      // Warning zone ring
      var warningR = r * cfg.arenaWarning;
      ctx.strokeStyle = 'rgba(34,68,170,0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.arc(cx, cy, warningR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Gravity field ring
      ctx.strokeStyle = 'rgba(100,100,255,0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy, cfg.gravityMaxDist, 0, Math.PI * 2);
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

    // === STATION — Hexagonal Torus (Frontier-style) ===
    FA.addLayer('station', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || !state.station) return;

      var st = state.station;
      var sx = st.x - FA.camera.x;
      var sy = st.y - FA.camera.y;
      if (sx < -150 || sx > cfg.canvasWidth + 150 || sy < -150 || sy > cfg.canvasHeight + 150) return;

      var ratio = st.hp / st.maxHp;
      var hitFlash = (Date.now() - st.lastHit) < 150;
      var rot = st.rotation;

      ctx.save();
      ctx.translate(sx, sy);

      // Repair field glow
      if (state.repairing) {
        var glowPulse = 0.06 + Math.sin(Date.now() * 0.004) * 0.03;
        ctx.fillStyle = 'rgba(68,255,136,' + glowPulse + ')';
        ctx.beginPath();
        ctx.arc(0, 0, cfg.stationRepairRange, 0, Math.PI * 2);
        ctx.fill();
      }

      // Station color
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

      var R = st.radius;           // outer radius
      var r = R * 0.45;            // torus tube radius (thickness of the ring)
      var tilt = 0.35;             // viewing angle tilt (0=face-on, PI/2=edge-on)
      var sides = 6;               // hexagonal cross-section

      // Draw the hexagonal torus as connected hexagonal cross-sections around the ring
      var ringSegments = 12;
      var cosT = Math.cos(tilt);
      var sinT = Math.sin(tilt);

      // Compute all ring points with hex cross-section
      var allPoints = [];
      for (var seg = 0; seg < ringSegments; seg++) {
        var ringAngle = rot + (seg / ringSegments) * Math.PI * 2;
        var cx = Math.cos(ringAngle) * (R - r);
        var cy = Math.sin(ringAngle) * (R - r);
        var segPoints = [];
        for (var h = 0; h < sides; h++) {
          var hexAngle = (h / sides) * Math.PI * 2;
          // Cross-section offset in ring-local frame
          var offR = Math.cos(hexAngle) * r;   // radial
          var offZ = Math.sin(hexAngle) * r;   // vertical
          // Project to 2D with tilt
          var wx = cx + Math.cos(ringAngle) * offR;
          var wy = cy + Math.sin(ringAngle) * offR;
          // Apply tilt: y-component gets compressed
          segPoints.push({
            x: wx,
            y: wy * cosT + offZ * sinT
          });
        }
        allPoints.push(segPoints);
      }

      // Draw back segments first (depth sorting by y-center)
      var segments = [];
      for (var seg = 0; seg < ringSegments; seg++) {
        var next = (seg + 1) % ringSegments;
        var ringAngle = rot + (seg / ringSegments) * Math.PI * 2;
        var depth = Math.sin(ringAngle) * cosT;
        segments.push({ seg: seg, next: next, depth: depth });
      }
      segments.sort(function(a, b) { return a.depth - b.depth; });

      for (var si = 0; si < segments.length; si++) {
        var s = segments[si];
        var pts = allPoints[s.seg];
        var ptsN = allPoints[s.next];

        // Shading based on depth
        var shade = 0.3 + (s.depth + 1) * 0.35;

        // Parse station color for shading
        var baseR, baseG, baseB;
        if (stColor === '#fff') { baseR = 255; baseG = 255; baseB = 255; }
        else if (stColor === colors.station) { baseR = 68; baseG = 204; baseB = 255; }
        else if (stColor === colors.stationDamaged) { baseR = 255; baseG = 136; baseB = 0; }
        else { baseR = 255; baseG = 68; baseB = 68; }

        var sr = Math.floor(baseR * shade);
        var sg = Math.floor(baseG * shade);
        var sb = Math.floor(baseB * shade);
        var fillColor = 'rgb(' + sr + ',' + sg + ',' + sb + ')';
        var lineColor = 'rgba(' + Math.min(255, sr + 60) + ',' + Math.min(255, sg + 60) + ',' + Math.min(255, sb + 60) + ',0.7)';

        // Draw quad faces between segments
        for (var h = 0; h < sides; h++) {
          var hn = (h + 1) % sides;
          ctx.beginPath();
          ctx.moveTo(pts[h].x, pts[h].y);
          ctx.lineTo(pts[hn].x, pts[hn].y);
          ctx.lineTo(ptsN[hn].x, ptsN[hn].y);
          ctx.lineTo(ptsN[h].x, ptsN[h].y);
          ctx.closePath();
          ctx.fillStyle = fillColor;
          ctx.fill();
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Central hub — small circle in the middle
      ctx.fillStyle = stColor;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Hub outline
      ctx.strokeStyle = stColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Spokes — connect hub to torus at cardinal points
      ctx.strokeStyle = stColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      for (var sp = 0; sp < 4; sp++) {
        var spAngle = rot + (sp / 4) * Math.PI * 2;
        var spx = Math.cos(spAngle) * (R - r);
        var spy = Math.sin(spAngle) * (R - r) * cosT;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(spx, spy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Beacon light on top (pulsing)
      var beaconPulse = 0.3 + Math.sin(Date.now() * 0.006) * 0.7;
      ctx.fillStyle = ratio > 0.3 ? 'rgba(68,204,255,' + beaconPulse + ')' : 'rgba(255,68,68,' + beaconPulse + ')';
      ctx.beginPath();
      ctx.arc(0, -R * cosT * 0.1, 3, 0, Math.PI * 2);
      ctx.fill();

      // HP bar below station
      var barW = 70, barH = 5;
      var barX = -barW / 2, barY = R + 12;
      ctx.fillStyle = '#400';
      ctx.fillRect(barX, barY, barW, barH);
      var hpColor = ratio > 0.5 ? '#4cf' : ratio > 0.3 ? '#f80' : '#f44';
      ctx.fillStyle = hpColor;
      ctx.fillRect(barX, barY, barW * ratio, barH);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, barY, barW, barH);

      // Label
      FA.draw.text('CORIOLIS-7', sx, sy + R + 26, { color: '#666', size: 9, align: 'center' });

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
        var alpha = warn * (0.2 + Math.sin(Date.now() * 0.006) * 0.1);
        var grad = ctx.createRadialGradient(
          cfg.canvasWidth / 2, cfg.canvasHeight / 2, cfg.canvasWidth * 0.3,
          cfg.canvasWidth / 2, cfg.canvasHeight / 2, cfg.canvasWidth * 0.6
        );
        grad.addColorStop(0, 'rgba(255,0,0,0)');
        grad.addColorStop(1, 'rgba(255,0,0,' + alpha + ')');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cfg.canvasWidth, cfg.canvasHeight);

        if (warn > 0.3) {
          var textAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
          FA.draw.pushAlpha(textAlpha);
          FA.draw.text('!! RETURN TO STATION !!', cfg.canvasWidth / 2, cfg.canvasHeight / 2 - 60,
            { color: '#f44', size: 22, bold: true, align: 'center' });
          FA.draw.popAlpha();
        }
      }

      // Fuel empty overlay
      if (state.ship && state.ship.fuel <= 0) {
        var fuelAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.15;
        FA.draw.pushAlpha(fuelAlpha);
        FA.draw.text('ENGINES OFFLINE — NO FUEL', cfg.canvasWidth / 2, cfg.canvasHeight / 2 - 30,
          { color: '#f80', size: 18, bold: true, align: 'center' });
        FA.draw.popAlpha();
      }

      // Station direction indicator
      if (state.ship && state.station) {
        var stSx = state.station.x - FA.camera.x;
        var stSy = state.station.y - FA.camera.y;
        var margin = 60;
        if (stSx < margin || stSx > cfg.canvasWidth - margin || stSy < margin || stSy > cfg.canvasHeight - margin) {
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
          ctx.moveTo(12, 0);
          ctx.lineTo(-7, -7);
          ctx.lineTo(-7, 7);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          FA.draw.text(Math.floor(stDist) + 'u', edgeX, edgeY + 16, { color: arrowColor, size: 10, align: 'center' });
        }
      }
    }, 20);

    // === NARRATIVE ===
    FA.addLayer('narrative', function() {
      var state = FA.getState();
      if (state.screen !== 'playing') return;
      if (!state.narrativeMessage || state.narrativeMessage.life <= 0) return;
      var alpha = Math.min(1, state.narrativeMessage.life / 1500);
      FA.draw.pushAlpha(alpha);
      FA.draw.rect(0, 0, cfg.canvasWidth, 44, 'rgba(0,0,0,0.7)');
      FA.draw.text(state.narrativeMessage.text, cfg.canvasWidth / 2, 14,
        { color: state.narrativeMessage.color, size: 14, align: 'center' });
      FA.draw.popAlpha();
    }, 25);

    // === HUD ===
    FA.addLayer('hud', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || !state.ship) return;

      var y = cfg.canvasHeight - 30;
      FA.draw.rect(0, y - 8, cfg.canvasWidth, 38, 'rgba(0,0,0,0.65)');

      // Ship hull
      var coreHp = 0, coreMax = 0;
      for (var i = 0; i < state.ship.parts.length; i++) {
        var p = state.ship.parts[i];
        if (p.type === 'core') { coreHp += p.hp; coreMax += p.maxHp; }
      }
      var hullColor = coreHp > coreMax * 0.5 ? '#4cf' : coreHp > coreMax * 0.3 ? '#f80' : '#f44';
      FA.draw.text('HULL ' + coreHp + '/' + coreMax, 10, y, { color: hullColor, size: 12, bold: true });

      // Fuel bar
      var fuelRatio = state.ship.fuel / cfg.maxFuel;
      var fuelColor = fuelRatio > 0.3 ? '#4f8' : fuelRatio > 0.1 ? '#f80' : '#f44';
      FA.draw.text('FUEL', 110, y, { color: '#888', size: 10 });
      // Draw fuel bar
      var fbarX = 145, fbarY = y - 1, fbarW = 80, fbarH = 8;
      ctx.fillStyle = '#222';
      ctx.fillRect(fbarX, fbarY, fbarW, fbarH);
      ctx.fillStyle = fuelColor;
      ctx.fillRect(fbarX, fbarY, fbarW * fuelRatio, fbarH);
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(fbarX, fbarY, fbarW, fbarH);
      FA.draw.text(Math.floor(state.ship.fuel) + '%', fbarX + fbarW + 5, y, { color: fuelColor, size: 10 });

      // Station HP
      if (state.station) {
        var stRatio = state.station.hp / state.station.maxHp;
        var stColor = stRatio > 0.5 ? '#4cf' : stRatio > 0.3 ? '#f80' : '#f44';
        FA.draw.text('STN ' + state.station.hp + '/' + state.station.maxHp, 280, y, { color: stColor, size: 12 });
      }

      // Wave & asteroids
      FA.draw.text('W' + state.wave, 380, y, { color: '#aaa', size: 12 });
      FA.draw.text('AST ' + state.asteroids.length, 420, y, { color: '#aaa', size: 12 });

      // Repair indicator
      if (state.repairing) {
        var repPulse = 0.6 + Math.sin(Date.now() * 0.008) * 0.4;
        FA.draw.pushAlpha(repPulse);
        FA.draw.text('DOCKED', 500, y, { color: '#4f8', size: 12, bold: true });
        FA.draw.popAlpha();
      }

      // Parts count
      FA.draw.text('P:' + state.ship.parts.length, 570, y, { color: '#666', size: 10 });

      // Score (right-aligned)
      FA.draw.text(state.score + ' pts', cfg.canvasWidth - 10, y, { color: '#ff0', size: 13, bold: true, align: 'right' });

      // Time
      FA.draw.text(Math.floor(state.survivalTime) + 's', cfg.canvasWidth - 90, y, { color: '#666', size: 10, align: 'right' });
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

      FA.draw.pushAlpha(partAlpha);
      if (part.type === 'engine' && ship.activeEngines && ship.activeEngines.has(part)) {
        ctx.save();
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        FA.draw.rect(part.x - 4, part.y + 12, 8, 6 + Math.random() * 8, '#0ff');
        ctx.restore();
      }
      FA.draw.sprite('player', part.type, part.x - 10, part.y - 10, 20, ch, color, 0);
      FA.draw.popAlpha();

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
