// Asteroid Hunter — Data
// Config, part types, ship layouts, asteroid types, sounds, narrative
(function() {
  'use strict';
  var FA = window.FA;

  // === CONFIG ===
  FA.register('config', 'game', {
    canvasWidth: 1000,
    canvasHeight: 800,
    gridSize: 30,
    partProximity: 45,
    bulletSpeed: 12,
    bulletLife: 60,
    shootCooldown: 120,
    thrustBase: 0.5,
    turboMultiplier: 1.8,
    friction: 0.99,
    angularFriction: 0.92,
    floatingPartLife: 600,
    pickupRadius: 40,
    waveDelay: 3000,
    asteroidBaseSpeed: 1.5
  });

  FA.register('config', 'colors', {
    bg: '#0a0a1a',
    gridLine: '#111133',
    playerCore: '#0cf', playerEngine: '#4f4', playerGun: '#f80',
    asteroid: '#888', asteroidMedium: '#999', asteroidSmall: '#aaa',
    bulletFriendly: '#ff0',
    text: '#fff', dim: '#777',
    narrative: '#c8b4ff'
  });

  FA.register('config', 'scoring', {
    asteroidLarge: 50,
    asteroidMedium: 100,
    asteroidSmall: 150,
    survivalPerSecond: 1,
    waveBonus: 200
  });

  // === PART TYPES ===
  FA.register('partTypes', 'core',   { name: 'Core',   mass: 10, maxHp: 8, char: 'O' });
  FA.register('partTypes', 'engine', { name: 'Engine', mass: 5,  maxHp: 3, char: 'E' });
  FA.register('partTypes', 'gun',    { name: 'Gun',    mass: 5,  maxHp: 2, char: 'G' });

  // === SHIP LAYOUTS ===
  FA.register('shipLayouts', 'player_default', {
    parts: [
      { x: 0, y: 0, type: 'core' },
      { x: -30, y: 30, type: 'engine' },
      { x: 30, y: 30, type: 'engine' },
      { x: 0, y: -30, type: 'gun' }
    ]
  });

  // === ASTEROID TYPES ===
  FA.register('asteroidTypes', 'large',  { hp: 3, radius: 40, speed: 1.0, score: 50,  splits: 'medium', splitCount: 2 });
  FA.register('asteroidTypes', 'medium', { hp: 2, radius: 25, speed: 1.5, score: 100, splits: 'small',  splitCount: 2 });
  FA.register('asteroidTypes', 'small',  { hp: 1, radius: 14, speed: 2.0, score: 150, splits: null,     splitCount: 0 });

  // === SOUNDS ===
  FA.defineSound('shoot', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, actx.currentTime + 0.06);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.3, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.06);
    osc.connect(g);
    g.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.06);
  });

  FA.defineSound('explosion', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, actx.currentTime + 0.4);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.6, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.4);
    osc.connect(g);
    g.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.4);
  });

  FA.defineSound('asteroidBreak', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, actx.currentTime + 0.15);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.4, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.15);
    osc.connect(g);
    g.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.15);
  });

  FA.defineSound('waveStart', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, actx.currentTime + 0.2);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.3, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.3);
    osc.connect(g);
    g.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.3);
  });

  // === NARRATIVE ===
  FA.register('config', 'narrative', {
    startNode: 'launch',
    variables: { asteroids_destroyed: 0, waves_survived: 0 },
    graph: {
      nodes: [
        { id: 'launch', label: 'Launch', type: 'scene' },
        { id: 'first_kill', label: 'First asteroid', type: 'scene' },
        { id: 'wave_clear', label: 'Wave cleared', type: 'scene' },
        { id: 'getting_intense', label: 'Getting intense', type: 'scene' },
        { id: 'destroyed', label: 'Destroyed', type: 'scene' }
      ],
      edges: [
        { from: 'launch', to: 'first_kill' },
        { from: 'first_kill', to: 'wave_clear' },
        { from: 'wave_clear', to: 'getting_intense' },
        { from: 'getting_intense', to: 'destroyed' },
        { from: 'launch', to: 'destroyed' }
      ]
    }
  });

  FA.register('narrativeText', 'launch', {
    text: 'Engines online. Asteroid field detected ahead.',
    color: '#c8b4ff'
  });

  FA.register('narrativeText', 'first_kill', {
    text: 'First asteroid shattered. Stay sharp — more incoming.',
    color: '#c8b4ff'
  });

  FA.register('narrativeText', 'wave_clear', {
    text: 'Wave cleared! Brief calm before the next storm.',
    color: '#4f4'
  });

  FA.register('narrativeText', 'getting_intense', {
    text: 'Density increasing. Watch your hull integrity.',
    color: '#f88'
  });

  FA.register('narrativeText', 'destroyed', {
    text: 'Hull breach critical. Ship lost.',
    color: '#f44'
  });

})();
