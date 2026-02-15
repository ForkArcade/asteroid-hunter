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
    shootCooldown: 200,
    thrustBase: 0.5,
    turboMultiplier: 1.8,
    friction: 0.99,
    angularFriction: 0.92,
    floatingPartLife: 600,
    pickupRadius: 40,
    waveDelay: 2500,
    asteroidBaseSpeed: 2.0,
    arenaRadius: 1800,
    arenaWarning: 0.8,
    stationHp: 20,
    stationRadius: 60,
    stationRepairRange: 140,
    repairRate: 0.35,
    stationRepairRate: 0.15,
    stationGravity: 200,
    gravityMaxDist: 800,
    gravityMinDist: 40,
    maxFuel: 100,
    fuelConsumption: 5,
    turboFuelMultiplier: 2.5,
    fuelRefuelRate: 10,
    stationRotationSpeed: 0.0003
  });

  FA.register('config', 'colors', {
    bg: '#0a0a1a',
    gridLine: '#111133',
    playerCore: '#0cf', playerEngine: '#4f4', playerGun: '#f80',
    asteroid: '#888', asteroidMedium: '#999', asteroidSmall: '#aaa',
    bulletFriendly: '#ff0',
    station: '#4cf', stationDamaged: '#f80', stationCritical: '#f44',
    arenaLine: '#2244aa', arenaWarn: '#ff4444',
    repairGlow: '#4f8',
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

  FA.defineSound('warning', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, actx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, actx.currentTime + 0.3);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.25, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.3);
    osc.connect(g);
    g.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.3);
  });

  FA.defineSound('repair', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, actx.currentTime + 0.15);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.15, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.2);
    osc.connect(g);
    g.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.2);
  });

  FA.defineSound('stationHit', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, actx.currentTime + 0.25);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.4, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.25);
    osc.connect(g);
    g.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.25);
  });

  FA.defineSound('fuelWarn', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, actx.currentTime);
    osc.frequency.setValueAtTime(90, actx.currentTime + 0.1);
    osc.frequency.setValueAtTime(120, actx.currentTime + 0.2);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.2, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.3);
    osc.connect(g);
    g.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.3);
  });

  // === NARRATIVE ===
  FA.register('config', 'narrative', {
    startNode: 'launch',
    variables: { asteroids_destroyed: 0, waves_survived: 0, station_hp: 25, fuel: 100 },
    graph: {
      nodes: [
        { id: 'launch', label: 'Launch', type: 'scene' },
        { id: 'first_kill', label: 'First asteroid', type: 'scene' },
        { id: 'wave_clear', label: 'Wave cleared', type: 'scene' },
        { id: 'getting_intense', label: 'Getting intense', type: 'scene' },
        { id: 'wave_5', label: 'Deep field', type: 'scene' },
        { id: 'station_damaged', label: 'Station hit', type: 'scene' },
        { id: 'station_critical', label: 'Station critical', type: 'scene' },
        { id: 'station_destroyed', label: 'Station lost', type: 'scene' },
        { id: 'boundary_warning', label: 'Boundary', type: 'scene' },
        { id: 'repair_docking', label: 'Repair dock', type: 'scene' },
        { id: 'fuel_low', label: 'Fuel low', type: 'scene' },
        { id: 'fuel_critical', label: 'Fuel critical', type: 'scene' },
        { id: 'fuel_empty', label: 'Fuel empty', type: 'scene' },
        { id: 'refueling', label: 'Refueling', type: 'scene' },
        { id: 'gravity_warning', label: 'Gravity pull', type: 'scene' },
        { id: 'wave_7', label: 'Asteroid storm', type: 'scene' },
        { id: 'wave_10', label: 'Hell wave', type: 'scene' },
        { id: 'wave_15', label: 'Beyond limits', type: 'scene' },
        { id: 'survivor_60', label: 'One minute', type: 'scene' },
        { id: 'survivor_180', label: 'Three minutes', type: 'scene' },
        { id: 'survivor_300', label: 'Five minutes', type: 'scene' },
        { id: 'ship_damaged', label: 'Ship damaged', type: 'scene' },
        { id: 'last_part', label: 'Last stand', type: 'scene' },
        { id: 'player_destroyed', label: 'Player destroyed', type: 'scene' }
      ],
      edges: [
        { from: 'launch', to: 'first_kill' },
        { from: 'first_kill', to: 'wave_clear' },
        { from: 'wave_clear', to: 'getting_intense' },
        { from: 'getting_intense', to: 'wave_5' },
        { from: 'wave_5', to: 'wave_7' },
        { from: 'wave_7', to: 'wave_10' },
        { from: 'wave_10', to: 'wave_15' },
        { from: 'launch', to: 'station_damaged' },
        { from: 'station_damaged', to: 'station_critical' },
        { from: 'station_critical', to: 'station_destroyed' },
        { from: 'launch', to: 'boundary_warning' },
        { from: 'launch', to: 'repair_docking' },
        { from: 'launch', to: 'fuel_low' },
        { from: 'fuel_low', to: 'fuel_critical' },
        { from: 'fuel_critical', to: 'fuel_empty' },
        { from: 'launch', to: 'refueling' },
        { from: 'launch', to: 'gravity_warning' },
        { from: 'launch', to: 'survivor_60' },
        { from: 'survivor_60', to: 'survivor_180' },
        { from: 'survivor_180', to: 'survivor_300' },
        { from: 'launch', to: 'ship_damaged' },
        { from: 'ship_damaged', to: 'last_part' },
        { from: 'launch', to: 'player_destroyed' }
      ]
    }
  });

  FA.register('narrativeText', 'launch', {
    text: '[ COMMS ] Station Coriolis-7 online. Gravitational anchor active. Defend at all costs, pilot.',
    color: '#c8b4ff'
  });

  FA.register('narrativeText', 'first_kill', {
    text: '[ COMMS ] First contact neutralized. The station\'s gravity well is pulling debris inward — stay sharp.',
    color: '#c8b4ff'
  });

  FA.register('narrativeText', 'wave_clear', {
    text: '[ COMMS ] Sector clear. Dock with the station to refuel and repair before the next wave.',
    color: '#4f4'
  });

  FA.register('narrativeText', 'getting_intense', {
    text: '[ WARNING ] Asteroid density rising. Station gravity pulling them in faster. Intercept early!',
    color: '#f88'
  });

  FA.register('narrativeText', 'wave_5', {
    text: '[ ALERT ] Deep field breach! Swarm density critical — station cannot survive this alone!',
    color: '#f44'
  });

  FA.register('narrativeText', 'wave_10', {
    text: '[ MAYDAY ] Uncharted density level! This is beyond anything we\'ve seen. Hold the line, pilot!',
    color: '#f44'
  });

  FA.register('narrativeText', 'station_damaged', {
    text: '[ STATION ] Impact detected! Asteroids breaking through defense perimeter!',
    color: '#f80'
  });

  FA.register('narrativeText', 'station_critical', {
    text: '[ STATION ] HULL CRITICAL! Structural integrity below 30%! We\'re losing her!',
    color: '#f44'
  });

  FA.register('narrativeText', 'station_destroyed', {
    text: '[ STATION ] Core breach. Coriolis-7 lost. All hands... mission failed.',
    color: '#f44'
  });

  FA.register('narrativeText', 'boundary_warning', {
    text: '[ NAV ] You are leaving the operational zone! Return to station immediately!',
    color: '#ff4'
  });

  FA.register('narrativeText', 'repair_docking', {
    text: '[ STATION ] Repair field engaged. Refueling in progress. Hull restoring...',
    color: '#4f8'
  });

  FA.register('narrativeText', 'fuel_low', {
    text: '[ ENGINE ] Fuel reserves at 30%. Recommend returning to station for refueling.',
    color: '#f80'
  });

  FA.register('narrativeText', 'fuel_critical', {
    text: '[ ENGINE ] FUEL CRITICAL! 10% remaining! Dock immediately or you\'ll be adrift!',
    color: '#f44'
  });

  FA.register('narrativeText', 'fuel_empty', {
    text: '[ ENGINE ] Fuel depleted. Engines offline. Drifting... station gravity is your only hope.',
    color: '#f44'
  });

  FA.register('narrativeText', 'refueling', {
    text: '[ ENGINE ] Fuel transfer active. Tanks replenishing.',
    color: '#4f8'
  });

  FA.register('narrativeText', 'gravity_warning', {
    text: '[ NAV ] Station gravitational pull detected. Use it to your advantage, pilot.',
    color: '#88f'
  });

  FA.register('narrativeText', 'wave_7', {
    text: '[ ALERT ] Asteroid storm forming! Multiple vectors — they\'re coming from everywhere!',
    color: '#f80'
  });

  FA.register('narrativeText', 'wave_15', {
    text: '[ MAYDAY ] Gravitational cascade! The entire belt is collapsing inward! This wasn\'t supposed to be possible!',
    color: '#f44'
  });

  FA.register('narrativeText', 'survivor_60', {
    text: '[ COMMS ] One minute in the field. Station sensors calibrating to your flight pattern. Keep it up.',
    color: '#88f'
  });

  FA.register('narrativeText', 'survivor_180', {
    text: '[ COMMS ] Three minutes. You\'re setting records out there, pilot. Command is watching.',
    color: '#8cf'
  });

  FA.register('narrativeText', 'survivor_300', {
    text: '[ COMMS ] Five minutes of continuous combat. They\'ll write songs about you, pilot. If we survive.',
    color: '#ff0'
  });

  FA.register('narrativeText', 'ship_damaged', {
    text: '[ HULL ] Ship integrity compromised! Dock for repairs before you lose more systems!',
    color: '#f80'
  });

  FA.register('narrativeText', 'last_part', {
    text: '[ HULL ] CRITICAL! Core exposed — one more hit and it\'s over! GET TO THE STATION!',
    color: '#f44'
  });

  FA.register('narrativeText', 'player_destroyed', {
    text: '[ COMMS ] We\'ve lost the pilot. Station Coriolis-7 is now undefended. God help them.',
    color: '#f44'
  });

})();
