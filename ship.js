// Asteroid Hunter — Game Logic
// Ship, station, asteroids, bullets, waves, arena, repairs, screens
(function() {
  'use strict';
  var FA = window.FA;
  var cfg = FA.lookup('config', 'game');

  function showNarrative(nodeId) {
    var textDef = FA.lookup('narrativeText', nodeId);
    if (textDef) {
      FA.setState('narrativeMessage', { text: textDef.text, color: textDef.color, life: 4000 });
    }
    FA.narrative.transition(nodeId);
  }

  // === SHIP CREATION ===

  function createShip(layoutId, x, y) {
    var layout = FA.lookup('shipLayouts', layoutId);
    if (!layout) return null;
    var parts = [];
    for (var i = 0; i < layout.parts.length; i++) {
      var p = layout.parts[i];
      var def = FA.lookup('partTypes', p.type);
      parts.push({
        x: p.x, y: p.y, type: p.type,
        hp: def ? def.maxHp : 2,
        maxHp: def ? def.maxHp : 2,
        lastHit: 0
      });
    }
    return {
      x: x, y: y, vx: 0, vy: 0,
      angle: 0, angVel: 0,
      parts: parts,
      activeEngines: new Set(),
      lastShot: 0
    };
  }

  // === STATION ===

  function createStation() {
    return {
      x: 0, y: 0,
      hp: cfg.stationHp,
      maxHp: cfg.stationHp,
      radius: cfg.stationRadius,
      lastHit: 0,
      warned50: false,
      warned30: false
    };
  }

  function damageStation(station, state) {
    station.hp--;
    station.lastHit = Date.now();
    FA.addFloat(station.x, station.y, '-1', '#f80', 800);
    FA.playSound('stationHit');

    FA.narrative.setVar('station_hp', station.hp, 'Station damaged');

    if (station.hp <= 0) {
      station.hp = 0;
      state.deathReason = 'station';
      showNarrative('station_destroyed');
      gameOver(state);
      return;
    }

    var ratio = station.hp / station.maxHp;
    if (ratio <= 0.3 && !station.warned30) {
      station.warned30 = true;
      showNarrative('station_critical');
    } else if (ratio <= 0.5 && !station.warned50) {
      station.warned50 = true;
      showNarrative('station_damaged');
    }
  }

  function checkAsteroidStationCollision(state) {
    if (!state.station || state.station.hp <= 0) return;
    for (var i = state.asteroids.length - 1; i >= 0; i--) {
      var a = state.asteroids[i];
      var d = Math.hypot(a.x - state.station.x, a.y - state.station.y);
      if (d < a.radius + state.station.radius) {
        damageStation(state.station, state);
        destroyAsteroid(state, i);
        if (state.screen === 'death') return;
      }
    }
  }

  // === REPAIRS ===

  function updateRepairs(state, dt) {
    if (!state.ship || !state.station || state.station.hp <= 0) {
      state.repairing = false;
      return;
    }
    var d = Math.hypot(state.ship.x - state.station.x, state.ship.y - state.station.y);
    if (d > cfg.stationRepairRange) {
      if (state.repairing) {
        state.repairing = false;
      }
      return;
    }

    // Player is in repair range
    if (!state.repairing) {
      state.repairing = true;
      showNarrative('repair_docking');
    }

    var dtSec = dt / 1000;

    // Repair ship parts
    state.repairAccum = (state.repairAccum || 0) + cfg.repairRate * dtSec;
    if (state.repairAccum >= 1) {
      state.repairAccum -= 1;
      var repaired = false;
      for (var i = 0; i < state.ship.parts.length; i++) {
        var p = state.ship.parts[i];
        if (p.hp < p.maxHp) {
          p.hp++;
          var wp = Physics.worldPartPosition(state.ship, p);
          FA.addFloat(wp.x, wp.y, '+1', '#4f8', 600);
          FA.playSound('repair');
          repaired = true;
          break;
        }
      }
      if (!repaired) state.repairAccum = 0;
    }

    // Repair station
    state.stationRepairAccum = (state.stationRepairAccum || 0) + cfg.stationRepairRate * dtSec;
    if (state.stationRepairAccum >= 1 && state.station.hp < state.station.maxHp) {
      state.stationRepairAccum -= 1;
      state.station.hp++;
      FA.addFloat(state.station.x, state.station.y - 30, '+1', '#4f8', 600);
      // Reset warnings if HP recovers
      if (state.station.hp / state.station.maxHp > 0.5) state.station.warned50 = false;
      if (state.station.hp / state.station.maxHp > 0.3) state.station.warned30 = false;
    }
  }

  // === ARENA BOUNDARY ===

  function checkArenaBoundary(state) {
    if (!state.ship) return;

    var d = Math.hypot(state.ship.x, state.ship.y);
    var warningDist = cfg.arenaRadius * cfg.arenaWarning;

    // Update boundary warning level (0 = safe, 0..1 = danger zone)
    if (d > warningDist) {
      var danger = (d - warningDist) / (cfg.arenaRadius - warningDist);
      state.boundaryWarning = Math.min(1, danger);

      // Show warning narrative once per crossing
      if (!state.boundaryWarnShown) {
        state.boundaryWarnShown = true;
        showNarrative('boundary_warning');
        FA.playSound('warning');
      }
    } else {
      state.boundaryWarning = 0;
      state.boundaryWarnShown = false;
    }

    // Kill player if outside arena
    if (d > cfg.arenaRadius) {
      state.deathReason = 'boundary';
      // Destroy all parts
      state.ship.parts = [];
      FA.emit('entity:killed', { entity: state.ship });
      gameOver(state);
    }

    // Remove asteroids far outside arena
    for (var i = state.asteroids.length - 1; i >= 0; i--) {
      var a = state.asteroids[i];
      var ad = Math.hypot(a.x, a.y);
      if (ad > cfg.arenaRadius + 200) {
        state.asteroids.splice(i, 1);
      }
    }
  }

  // === DAMAGE ===

  function damagePart(ship, partIndex, state) {
    var part = ship.parts[partIndex];
    if (!part) return;
    part.hp--;
    part.lastHit = Date.now();
    var wp = Physics.worldPartPosition(ship, part);
    FA.addFloat(wp.x, wp.y, '-1', '#f44', 800);
    FA.emit('entity:damaged', { entity: ship, part: part, partIndex: partIndex });

    if (part.hp <= 0) {
      ship.parts.splice(partIndex, 1);
      FA.playSound('explosion');
      var hasCores = false;
      for (var i = 0; i < ship.parts.length; i++) {
        if (ship.parts[i].type === 'core') { hasCores = true; break; }
      }
      if (!hasCores) {
        FA.emit('entity:killed', { entity: ship });
      }
    }
  }

  // === ASTEROIDS ===

  function createAsteroid(type, x, y) {
    var def = FA.lookup('asteroidTypes', type);
    if (!def) return null;
    var angle = Math.random() * Math.PI * 2;
    var speed = def.speed * cfg.asteroidBaseSpeed * (0.7 + Math.random() * 0.6);
    var verts = [];
    var numVerts = 7 + Math.floor(Math.random() * 5);
    for (var i = 0; i < numVerts; i++) {
      var a = (i / numVerts) * Math.PI * 2;
      var r = def.radius * (0.7 + Math.random() * 0.3);
      verts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return {
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      type: type,
      hp: def.hp,
      radius: def.radius,
      spin: (Math.random() - 0.5) * 0.04,
      angle: Math.random() * Math.PI * 2,
      verts: verts
    };
  }

  function spawnAsteroid(state, type) {
    // Spawn at arena edge, aimed toward center/station area
    var spawnAngle = Math.random() * Math.PI * 2;
    var x = Math.cos(spawnAngle) * cfg.arenaRadius;
    var y = Math.sin(spawnAngle) * cfg.arenaRadius;
    var asteroid = createAsteroid(type || 'large', x, y);
    if (asteroid) {
      // Aim toward center with some spread
      var aimAngle = Math.atan2(-y, -x) + (Math.random() - 0.5) * 0.8;
      var def = FA.lookup('asteroidTypes', asteroid.type);
      var speed = def.speed * cfg.asteroidBaseSpeed * (0.7 + Math.random() * 0.6);
      asteroid.vx = Math.cos(aimAngle) * speed;
      asteroid.vy = Math.sin(aimAngle) * speed;
      state.asteroids.push(asteroid);
    }
  }

  function spawnWave(state) {
    state.wave++;
    var count = 2 + state.wave;
    for (var i = 0; i < count; i++) {
      spawnAsteroid(state, 'large');
    }
    FA.playSound('waveStart');
    if (state.wave > 1) {
      var scoring = FA.lookup('config', 'scoring');
      var bonus = scoring.waveBonus;
      // Station defense bonus
      if (state.station && state.station.hp > state.station.maxHp * 0.5) {
        bonus += 50;
      }
      state.score += bonus;
      FA.addFloat(state.ship.x, state.ship.y - 50, '+' + bonus + ' wave bonus', '#ff0', 1500);
    }
    FA.narrative.setVar('waves_survived', state.wave, 'Wave ' + state.wave);
    if (state.wave >= 5) {
      showNarrative('wave_5');
    } else if (state.wave >= 3) {
      showNarrative('getting_intense');
    }
  }

  function updateAsteroids(state) {
    for (var i = 0; i < state.asteroids.length; i++) {
      var a = state.asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.spin;
    }
  }

  function checkAsteroidCollision(state) {
    if (!state.ship) return;
    for (var i = state.asteroids.length - 1; i >= 0; i--) {
      var a = state.asteroids[i];
      for (var j = state.ship.parts.length - 1; j >= 0; j--) {
        var wp = Physics.worldPartPosition(state.ship, state.ship.parts[j]);
        var d = Math.hypot(a.x - wp.x, a.y - wp.y);
        if (d < a.radius + 12) {
          damagePart(state.ship, j, state);
          destroyAsteroid(state, i);
          var hasCores = false;
          for (var k = 0; k < state.ship.parts.length; k++) {
            if (state.ship.parts[k].type === 'core') { hasCores = true; break; }
          }
          if (!hasCores) {
            state.deathReason = 'player';
            gameOver(state);
          }
          break;
        }
      }
    }
  }

  function destroyAsteroid(state, index) {
    var a = state.asteroids[index];
    var def = FA.lookup('asteroidTypes', a.type);
    state.asteroids.splice(index, 1);
    state.asteroidsDestroyed++;
    state.score += def.score;
    FA.addFloat(a.x, a.y, '+' + def.score, '#ff0', 800);
    FA.playSound('asteroidBreak');
    FA.narrative.setVar('asteroids_destroyed', state.asteroidsDestroyed, 'Asteroid destroyed');

    if (state.asteroidsDestroyed === 1) showNarrative('first_kill');

    if (def.splits) {
      for (var i = 0; i < def.splitCount; i++) {
        var child = createAsteroid(def.splits, a.x, a.y);
        if (child) {
          child.vx = a.vx * 0.5 + (Math.random() - 0.5) * 3;
          child.vy = a.vy * 0.5 + (Math.random() - 0.5) * 3;
          state.asteroids.push(child);
        }
      }
    }
  }

  // === SHOOTING ===

  function playerShoot(state) {
    var now = Date.now();
    if (now - state.ship.lastShot < cfg.shootCooldown) return;
    state.ship.lastShot = now;

    var fired = false;
    for (var i = 0; i < state.ship.parts.length; i++) {
      var part = state.ship.parts[i];
      if (part.type === 'gun' && Physics.isConnected(state.ship.parts, i)) {
        var wp = Physics.worldPartPosition(state.ship, part);
        state.bullets.push({
          x: wp.x, y: wp.y,
          vx: state.ship.vx + Math.sin(state.ship.angle) * cfg.bulletSpeed,
          vy: state.ship.vy - Math.cos(state.ship.angle) * cfg.bulletSpeed,
          life: cfg.bulletLife
        });
        fired = true;
      }
    }
    if (fired) FA.playSound('shoot');
  }

  function updateBullets(state) {
    for (var i = state.bullets.length - 1; i >= 0; i--) {
      var b = state.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      if (b.life <= 0) {
        state.bullets.splice(i, 1);
        continue;
      }

      for (var j = state.asteroids.length - 1; j >= 0; j--) {
        var a = state.asteroids[j];
        var d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d < a.radius) {
          a.hp--;
          FA.addFloat(a.x, a.y, '-1', '#f44', 600);
          state.bullets.splice(i, 1);
          if (a.hp <= 0) {
            destroyAsteroid(state, j);
          }
          break;
        }
      }
    }
  }

  // === SCREENS ===

  function startScreen() {
    FA.resetState({
      screen: 'start',
      ship: null,
      station: null,
      asteroids: [],
      bullets: [],
      score: 0,
      asteroidsDestroyed: 0,
      wave: 0,
      waveTimer: 0,
      survivalTime: 0,
      narrativeMessage: null,
      boundaryWarning: 0,
      boundaryWarnShown: false,
      repairing: false,
      repairAccum: 0,
      stationRepairAccum: 0,
      deathReason: null
    });
    var narCfg = FA.lookup('config', 'narrative');
    if (narCfg) FA.narrative.init(narCfg);
  }

  function beginGame() {
    var state = FA.getState();
    state.screen = 'playing';
    state.station = createStation();
    state.ship = createShip('player_default', 0, -150);
    spawnWave(state);
    showNarrative('launch');
  }

  function gameOver(state) {
    if (state.screen === 'death') return;
    state.screen = 'death';
    state.score += Math.floor(state.survivalTime);
    FA.emit('game:over', { victory: false, score: state.score });
    if (state.deathReason === 'station') {
      showNarrative('station_destroyed');
    } else {
      showNarrative('player_destroyed');
    }
  }

  // === EXPORT ===

  window.Ship = {
    create: createShip,
    damagePart: damagePart,
    playerShoot: playerShoot,
    updateBullets: updateBullets,
    updateAsteroids: updateAsteroids,
    checkAsteroidCollision: checkAsteroidCollision,
    checkAsteroidStationCollision: checkAsteroidStationCollision,
    checkArenaBoundary: checkArenaBoundary,
    updateRepairs: updateRepairs,
    spawnWave: spawnWave,
    startScreen: startScreen,
    beginGame: beginGame,
    gameOver: gameOver,
    showNarrative: showNarrative
  };

})();
