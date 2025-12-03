const NOTE_CONFIG = [
  { id: "note1", label: "A",   color: "note1",  durationBeats: 1,   threshold: 8, midiNote: 45, channel: 1,  active: true },
  { id: "note2", label: "A#",  color: "note2",  durationBeats: 1,   threshold: 7, midiNote: 46, channel: 2,  active: true },
  { id: "note3", label: "B",   color: "note3",  durationBeats: 1,   threshold: 6, midiNote: 47, channel: 3,  active: true },
  { id: "note4", label: "C",   color: "note4",  durationBeats: 1,   threshold: 5, midiNote: 48, channel: 4,  active: true },
  { id: "note5", label: "C#",  color: "note5",  durationBeats: 1,   threshold: 4, midiNote: 49, channel: 5,  active: true },
  { id: "note6", label: "D",   color: "note6",  durationBeats: 1,   threshold: 3, midiNote: 50, channel: 6,  active: true },
  { id: "note7", label: "D#",  color: "note7",  durationBeats: 0.5, threshold: 3, midiNote: 51, channel: 7,  active: true },
  { id: "note8", label: "E",   color: "note8",  durationBeats: 0.5, threshold: 5, midiNote: 52, channel: 8,  active: true },
  { id: "note9", label: "F",   color: "note9",  durationBeats: 0.5, threshold: 4, midiNote: 53, channel: 9,  active: true },
  { id: "note10", label: "F#", color: "note10", durationBeats: 0.25, threshold: 3, midiNote: 54, channel: 10, active: true },
  { id: "note11", label: "G",  color: "note11", durationBeats: 0.25, threshold: 2, midiNote: 55, channel: 11, active: true },
  { id: "note12", label: "G#", color: "note12", durationBeats: 0.25, threshold: 2, midiNote: 56, channel: 12, active: true }
];

const NOTE_COLOR_CLASSES = NOTE_CONFIG.map((note) => note.color);

const BEAT_OPTIONS = [
  { value: 4, label: "4 beats" },
  { value: 2, label: "2 beats" },
  { value: 1, label: "1 beat" },
  { value: 0.5, label: "1/2 beat" },
  { value: 0.25, label: "1/4 beat" },
  { value: 0.125, label: "1/8 beat" },
  { value: 0.0625, label: "1/16 beat" }
];

const THRESHOLD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const SCALE_LIBRARY = {
  major: { label: "Ionian (Major)", intervals: [0, 2, 4, 5, 7, 9, 11] },
  dorian: { label: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { label: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] },
  lydian: { label: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { label: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10] },
  minor: { label: "Aeolian (Natural Minor)", intervals: [0, 2, 3, 5, 7, 8, 10] },
  locrian: { label: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10] },
  harmonic_minor: { label: "Harmonic Minor", intervals: [0, 2, 3, 5, 7, 8, 11] },
  phrygian_dominant: { label: "Phrygian Dominant", intervals: [0, 1, 4, 5, 7, 8, 10] },
  whole_tone: { label: "Whole Tone", intervals: [0, 2, 4, 6, 8, 10] },
  chromatic: { label: "Chromatic", intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
};

const TONIC_OPTIONS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

class CellularAutomataApp {
  constructor() {
    this.musicBarHeight = 6;
    this.musicBarWidth = 6;
    this.maxColumns = 16;
    this.activeColumnCount = 8;
    this.gridSize = this.musicBarWidth * this.activeColumnCount;
    this.grid = this.createMatrix();
    this.nextGrid = this.createMatrix();
    this.isRunning = false;
    this.simIntervalId = null;
    this.simBpm = 75;

    this.isMusicRunning = false;
    this.bpm = 75;
    this.musicBoxes = [];
    this.boxIdCounter = 0;
    this.cascadeFrameId = null;
    this.columnSpawnAccumulator = 0;
    this.spawnMode = "cascade";
    this.columnNextSpawnMs = [];
    this.columnNextSpawnMeanBeats = 1;
    this.spawnRateFactor = 1; // 1x default
    this.randomFillPercent = 0.35; // 35%
    this.randomFillAlgorithm = "uniform";
    this.keyTonic = "A";
    this.keyScale = "phrygian_dominant";

    this.isMouseDown = false;
    this.isRightClick = false;
    this.currentRule = "conway";
    this.activeNotes = new Map();
    this.midiAccess = null;
    this.midiOutput = null;
    this.preferredMidiOutputId = null;

    this.cacheElements();
    this.customSelects = new Map();
    this.initCustomSelects();
    this.buildGrid();
    this.attachEventListeners();
    this.renderNoteConfig();
    this.initializeMIDI();
  }

  spawnFullRow() {
    for (let i = 0; i < this.activeColumnCount; i += 1) {
      // ensure we don't exceed per-column cap
      const countInCol = this.musicBoxes.reduce((acc, b) => acc + (b.columnIndex === i ? 1 : 0), 0);
      if (countInCol < 4) this.spawnBox(i);
    }
  }

  applyRandomFill() {
    const totalCells = this.gridSize * this.gridSize;
    if (totalCells === 0) return;
    const targetCount = Math.max(1, Math.floor(totalCells * this.randomFillPercent));
    const positions = this.buildRandomFillPositions(targetCount);
    const newGrid = this.createMatrix();
    positions.forEach(([row, col]) => {
      newGrid[row][col] = 1;
    });
    this.grid = newGrid;
    this.nextGrid = this.createMatrix();
    this.renderGrid();
    this.elements.generation.textContent = "0";
  }

  buildRandomFillPositions(targetCount) {
    switch (this.randomFillAlgorithm) {
      case "clusters":
        return this.generateClusterFill(targetCount);
      case "noise":
        return this.generateNoiseFill(targetCount);
      case "uniform":
      default:
        return this.generateUniformFill(targetCount);
    }
  }

  generateUniformFill(targetCount) {
    const totalCells = this.gridSize * this.gridSize;
    const indices = Array.from({ length: totalCells }, (_, index) => index);
    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const selection = indices.slice(0, targetCount);
    return selection.map((index) => [Math.floor(index / this.gridSize), index % this.gridSize]);
  }

  generateClusterFill(targetCount) {
    const selected = new Set();
    const maxIndex = this.gridSize - 1;
    const addCell = (row, col) => {
      selected.add(row * this.gridSize + col);
    };

    while (selected.size < targetCount) {
      let currentRow = Math.floor(Math.random() * this.gridSize);
      let currentCol = Math.floor(Math.random() * this.gridSize);
      addCell(currentRow, currentCol);
      const clusterSize = Math.max(6, Math.floor(targetCount / 8));
      for (let i = 0; i < clusterSize && selected.size < targetCount; i += 1) {
        currentRow = Math.min(maxIndex, Math.max(0, currentRow + (Math.floor(Math.random() * 5) - 2)));
        currentCol = Math.min(maxIndex, Math.max(0, currentCol + (Math.floor(Math.random() * 5) - 2)));
        addCell(currentRow, currentCol);
      }
    }

    return Array.from(selected).map((index) => [Math.floor(index / this.gridSize), index % this.gridSize]);
  }

  generateNoiseFill(targetCount) {
    const seedX = Math.random() * 1000;
    const seedY = Math.random() * 1000;
    const freq = 0.05 + this.randomFillPercent * 0.35;
    const noiseBuckets = [];
    for (let row = 0; row < this.gridSize; row += 1) {
      for (let col = 0; col < this.gridSize; col += 1) {
        const combined = Math.sin((row + seedX) * freq) + Math.cos((col + seedY) * (freq * 0.9));
        const diagonal = Math.sin((row + col + seedX - seedY) * freq * 0.5);
        const jitter = Math.random() * 0.35;
        const value = combined + diagonal + jitter;
        const index = row * this.gridSize + col;
        noiseBuckets.push({ index, value });
      }
    }
    noiseBuckets.sort((a, b) => b.value - a.value);
    return noiseBuckets.slice(0, targetCount).map(({ index }) => [Math.floor(index / this.gridSize), index % this.gridSize]);
  }

  cacheElements() {
    this.elements = {
      grid: document.getElementById("grid"),
      canvasWrapper: document.querySelector(".canvas-wrapper"),
      startBtn: document.getElementById("startBtn"),
      stopBtn: document.getElementById("stopBtn"),
      clearBtn: document.getElementById("clearBtn"),
      simBpmInput: document.getElementById("simBpmInput"),
      simBpmValue: document.getElementById("simBpmValue"),
      ruleSelect: document.getElementById("ruleSelect"),
      generation: document.getElementById("generation"),
      musicStartBtn: document.getElementById("musicStartBtn"),
      musicStopBtn: document.getElementById("musicStopBtn"),
      bpmSlider: document.getElementById("bpmSlider"),
      bpmInput: document.getElementById("bpmInput"),
      bpmValue: document.getElementById("bpmValue"),
      columnSlider: document.getElementById("columnSlider"),
      columnInput: document.getElementById("columnInput"),
      columnValue: document.getElementById("columnValue"),
      spawnRateSlider: document.getElementById("spawnRateSlider"),
      spawnRateInput: document.getElementById("spawnRateInput"),
      spawnRateValue: document.getElementById("spawnRateValue"),
      spawnModeSelect: document.getElementById("spawnModeSelect"),
      randomFillSlider: document.getElementById("randomFillSlider"),
      randomFillValue: document.getElementById("randomFillValue"),
      randomFillAlgorithmSelect: document.getElementById("randomFillAlgorithmSelect"),
      randomFillBtn: document.getElementById("randomFillBtn"),
      keyTonicSelect: document.getElementById("keyTonicSelect"),
      keyScaleSelect: document.getElementById("keyScaleSelect"),
      currentScaleLabel: document.getElementById("currentScaleLabel"),
      applyKeyPresetBtn: document.getElementById("applyKeyPresetBtn"),
      randomizeKeyPresetBtn: document.getElementById("randomizeKeyPresetBtn"),
      midiOutputSelect: document.getElementById("midiOutputSelect"),
      refreshMidiBtn: document.getElementById("refreshMidiBtn"),
      midiStatusText: document.getElementById("midiStatusText"),
      panel: document.getElementById("controlPanel"),
      panelToggle: document.getElementById("panelToggle"),
      panelClose: document.getElementById("panelClose"),
      aboutToggle: document.getElementById("aboutToggle"),
      noteConfigBtn: document.getElementById("noteConfigBtn"),
      noteConfigGrid: document.getElementById("noteConfigGrid"),
      overlays: document.querySelectorAll(".overlay")
    };
  }

  createMatrix() {
    return Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(0));
  }

  buildGrid() {
    this.cells = [];
    this.elements.grid.innerHTML = "";
    // apply dynamic grid template to match current gridSize
    this.elements.grid.style.gridTemplateColumns = `repeat(${this.gridSize}, var(--cell-size))`;
    this.elements.grid.style.gridTemplateRows = `repeat(${this.gridSize}, var(--cell-size))`;
    for (let row = 0; row < this.gridSize; row += 1) {
      for (let col = 0; col < this.gridSize; col += 1) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        this.elements.grid.appendChild(cell);
        this.cells.push(cell);
      }
    }
    this.updateGridCellSize();
  }

  attachEventListeners() {
    const {
      startBtn,
      stopBtn,
      clearBtn,
      simBpmInput,
      ruleSelect,
      grid,
      musicStartBtn,
      musicStopBtn,
      bpmSlider,
      bpmInput,
      columnSlider,
      columnInput,
      columnValue,
      spawnRateSlider,
      spawnRateInput,
      spawnRateValue,
      spawnModeSelect,
      randomFillSlider,
      randomFillValue,
      randomFillAlgorithmSelect,
      randomFillBtn,
      keyTonicSelect,
      keyScaleSelect,
      currentScaleLabel,
      applyKeyPresetBtn,
      randomizeKeyPresetBtn,
      midiOutputSelect,
      refreshMidiBtn,
      panelToggle,
      panelClose,
      aboutToggle,
      noteConfigBtn,
      overlays
    } = this.elements;

    startBtn.addEventListener("click", () => this.start());
    stopBtn.addEventListener("click", () => this.stop());
    clearBtn.addEventListener("click", () => this.clear());

    ruleSelect.addEventListener("change", (event) => {
      this.currentRule = event.target.value;
    });

    simBpmInput.addEventListener("input", (event) => {
      this.simBpm = Number(event.target.value) || 60;
      this.updateSimBpmDisplay();
      if (this.isRunning) {
        this.stop();
        this.start();
      }
    });

    musicStartBtn.addEventListener("click", () => this.startMusic());
    musicStopBtn.addEventListener("click", () => this.stopMusic());

    const handleBpmChange = (value) => {
      const sanitized = Math.min(300, Math.max(30, Number(value) || 75));
      this.bpm = sanitized;
      bpmSlider.value = String(sanitized);
      bpmInput.value = String(sanitized);
      this.elements.bpmValue.textContent = `${sanitized} BPM`;
      if (this.isMusicRunning) {
        this.stopMusic();
        this.startMusic();
      }
    };

    bpmSlider.addEventListener("input", (event) => handleBpmChange(event.target.value));
    bpmInput.addEventListener("input", (event) => handleBpmChange(event.target.value));

    const handleColumnChange = (value) => {
      const sanitized = Math.min(this.maxColumns, Math.max(4, Number(value) || this.activeColumnCount));
      this.activeColumnCount = sanitized;
      columnSlider.value = String(sanitized);
      columnInput.value = String(sanitized);
      columnValue.textContent = `${sanitized} ${sanitized === 1 ? "Column" : "Columns"}`;
      // Recompute grid size and rebuild grid to match fixed 6x6 box per column
      const newGridSize = this.musicBarWidth * this.activeColumnCount;
      if (newGridSize !== this.gridSize) {
        this.gridSize = newGridSize;
        this.grid = this.createMatrix();
        this.nextGrid = this.createMatrix();
        this.buildGrid();
      }
      if (this.isMusicRunning) {
        this.stopMusic();
        this.startMusic();
      }
    };

    columnSlider.addEventListener("input", (event) => handleColumnChange(event.target.value));
    columnInput.addEventListener("input", (event) => handleColumnChange(event.target.value));

    const handleSpawnRateChange = (value) => {
      const numeric = Number(value) || 1;
      const clamped = Math.min(4, Math.max(0.25, numeric));
      this.spawnRateFactor = clamped;
      spawnRateSlider.value = String(clamped);
      spawnRateInput.value = String(clamped);
      spawnRateValue.textContent = `${clamped.toFixed(2)}×`;
      this.columnNextSpawnMeanBeats = 1 / this.spawnRateFactor;
      if (this.isMusicRunning) {
        this.initializeColumns();
      }
    };

    spawnRateSlider.addEventListener("input", (event) => handleSpawnRateChange(event.target.value));
    spawnRateInput.addEventListener("input", (event) => handleSpawnRateChange(event.target.value));

    spawnModeSelect.addEventListener("change", (event) => {
      this.spawnMode = event.target.value === "scanning" ? "scanning" : "cascade";
      if (this.isMusicRunning) {
        this.stopMusic();
        this.startMusic();
      }
    });

    const handleRandomFillAmountChange = (value) => {
      const numeric = Math.min(90, Math.max(5, Number(value) || 35));
      this.randomFillPercent = numeric / 100;
      randomFillSlider.value = String(numeric);
      randomFillValue.textContent = `${numeric}%`;
    };

    randomFillSlider.addEventListener("input", (event) => handleRandomFillAmountChange(event.target.value));

    randomFillAlgorithmSelect.addEventListener("change", (event) => {
      this.randomFillAlgorithm = event.target.value;
    });

    randomFillBtn.addEventListener("click", () => this.applyRandomFill());

    keyTonicSelect.addEventListener("change", (event) => {
      this.keyTonic = event.target.value;
      this.updateCurrentScaleLabel();
    });

    keyScaleSelect.addEventListener("change", (event) => {
      this.keyScale = event.target.value;
      this.updateCurrentScaleLabel();
    });

    applyKeyPresetBtn.addEventListener("click", () => this.applyKeyPreset());
    randomizeKeyPresetBtn.addEventListener("click", () => this.randomizeKeyPreset());

    midiOutputSelect.addEventListener("change", (event) => this.selectMIDIDevice(event.target.value));
    refreshMidiBtn.addEventListener("click", () => this.rescanMIDIDevices());

    grid.addEventListener("mousedown", (event) => this.handlePointerDown(event));
    grid.addEventListener("mousemove", (event) => this.handlePointerMove(event));
    grid.addEventListener("mouseup", () => this.handlePointerUp());
    grid.addEventListener("mouseleave", () => this.handlePointerUp());
    grid.addEventListener("contextmenu", (event) => event.preventDefault());
    document.addEventListener("mouseup", () => this.handlePointerUp());

    panelToggle.addEventListener("click", () => this.togglePanel());
    panelClose.addEventListener("click", () => this.togglePanel(false));

    aboutToggle.addEventListener("click", () => this.openOverlay("aboutOverlay"));
    noteConfigBtn.addEventListener("click", () => this.openOverlay("noteConfigOverlay"));

    overlays.forEach((overlay) => {
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          this.closeOverlay(overlay.id);
        }
      });
    });

    document.querySelectorAll("[data-overlay-close]").forEach((button) => {
      button.addEventListener("click", () => this.closeOverlay(button.dataset.overlayClose));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.closeOverlay("aboutOverlay");
        this.closeOverlay("noteConfigOverlay");
        this.togglePanel(false);
        this.closeAllCustomSelects();
      }
    });

    document.addEventListener("click", (event) => this.handleDocumentClick(event));

    window.addEventListener("resize", () => this.updateGridCellSize());
  }

  updateSimBpmDisplay() {
    this.elements.simBpmValue.textContent = `${this.simBpm} BPM`;
  }

  handlePointerDown(event) {
    if (!event.target.classList.contains("cell")) return;
    event.preventDefault();
    this.isMouseDown = true;
    this.isRightClick = event.button === 2;
    this.seedCells(event.target);
  }

  handlePointerMove(event) {
    if (!this.isMouseDown || !event.target.classList.contains("cell")) return;
    this.seedCells(event.target);
  }

  handlePointerUp() {
    this.isMouseDown = false;
  }

  seedCells(targetCell) {
    const centerRow = Number(targetCell.dataset.row);
    const centerCol = Number(targetCell.dataset.col);

    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
        const row = centerRow + rowOffset;
        const col = centerCol + colOffset;
        if (row < 0 || col < 0 || row >= this.gridSize || col >= this.gridSize) continue;

        const isCenter = rowOffset === 0 && colOffset === 0;
        const shouldAffect = isCenter || Math.random() < 0.6;
        if (!shouldAffect) continue;

        this.grid[row][col] = this.isRightClick ? 0 : 1;
        const index = row * this.gridSize + col;
        const cell = this.cells[index];
        cell.classList.toggle("alive", this.grid[row][col] === 1);
        cell.classList.remove("dying");
      }
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.elements.startBtn.disabled = true;
    this.elements.stopBtn.disabled = false;
    const interval = this.calculateSimulationTiming();
    this.simIntervalId = setInterval(() => this.updateGrid(), interval);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.elements.startBtn.disabled = false;
    this.elements.stopBtn.disabled = true;
    clearInterval(this.simIntervalId);
  }

  clear() {
    this.stop();
    this.grid = this.createMatrix();
    this.nextGrid = this.createMatrix();
    this.renderGrid();
    this.elements.generation.textContent = "0";
  }

  calculateSimulationTiming() {
    return 60000 / this.simBpm;
  }

  updateGrid() {
    for (let row = 0; row < this.gridSize; row += 1) {
      for (let col = 0; col < this.gridSize; col += 1) {
        const currentState = this.grid[row][col];
        const aliveNeighbors = this.countNeighbors(row, col, 1);
        this.nextGrid[row][col] = this.applyRule(currentState, aliveNeighbors, row, col);
      }
    }

    [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
    this.renderGrid();
    this.elements.generation.textContent = String(Number(this.elements.generation.textContent) + 1);
  }

  countNeighbors(row, col, state = 1) {
    let count = 0;
    for (let i = -1; i <= 1; i += 1) {
      for (let j = -1; j <= 1; j += 1) {
        if (i === 0 && j === 0) continue;
        const newRow = row + i;
        const newCol = col + j;
        if (newRow < 0 || newCol < 0 || newRow >= this.gridSize || newCol >= this.gridSize) continue;
        if (this.grid[newRow][newCol] === state) count += 1;
      }
    }
    return count;
  }

  applyRule(currentState, aliveNeighbors, row, col) {
    switch (this.currentRule) {
      case "highlife":
        return currentState === 1 ? (aliveNeighbors === 2 || aliveNeighbors === 3 ? 1 : 0) : aliveNeighbors === 3 || aliveNeighbors === 6 ? 1 : 0;
      case "seeds":
        return currentState === 1 ? 0 : aliveNeighbors === 2 ? 1 : 0;
      case "starwars":
        return currentState === 1 ? (aliveNeighbors >= 3 && aliveNeighbors <= 5 ? 1 : 0) : aliveNeighbors === 2 ? 1 : 0;
      case "briansbrain":
        if (currentState === 0) return aliveNeighbors === 2 ? 1 : 0;
        if (currentState === 1) return 2;
        return 0;
      case "diamoeba":
        return currentState === 1 ? (aliveNeighbors >= 5 && aliveNeighbors <= 8 ? 1 : 0) : aliveNeighbors === 3 || (aliveNeighbors >= 5 && aliveNeighbors <= 8) ? 1 : 0;
      case "conway":
      default:
        return currentState === 1 ? (aliveNeighbors === 2 || aliveNeighbors === 3 ? 1 : 0) : aliveNeighbors === 3 ? 1 : 0;
    }
  }

  renderGrid() {
    this.cells.forEach((cell, index) => {
      const row = Math.floor(index / this.gridSize);
      const col = index % this.gridSize;
      const state = this.grid[row][col];
      cell.classList.toggle("alive", state === 1);
      cell.classList.toggle("dying", state === 2);
      if (state === 0) {
        cell.classList.remove("alive", "dying");
      }
    });
  }

  startMusic() {
    if (this.isMusicRunning) return;
    this.isMusicRunning = true;
    this.elements.musicStartBtn.disabled = true;
    this.elements.musicStopBtn.disabled = false;
    this.resetMusicBoxes();
    this.initializeColumns();
    if (this.spawnMode === "scanning") {
      this.spawnFullRow();
    }
    this.startCascadeLoop();
  }

  stopMusic() {
    if (!this.isMusicRunning) return;
    this.isMusicRunning = false;
    this.elements.musicStartBtn.disabled = false;
    this.elements.musicStopBtn.disabled = true;
    this.resetMusicBoxes();
    this.stopAllMIDINotes();
    this.clearMusicHighlights();
    this.stopCascadeLoop();
  }

  resetMusicBoxes() {
    this.musicBoxes = [];
    this.columnSpawnAccumulator = 0;
  }

  initializeColumns() {
    this.columnWidth = this.musicBarWidth; // fixed 6 cells per column
    // initialize per-column next spawn timers
    this.columnNextSpawnMs = Array.from({ length: this.activeColumnCount }, () =>
      this.spawnMode === "cascade" ? this.poissonIntervalMs() : 0
    );
    this.columnSpawnAccumulator = 0;
  }

  updateGridCellSize() {
    const wrapper = this.elements.canvasWrapper;
    const stageSize = wrapper
      ? Math.min(wrapper.clientHeight, wrapper.clientWidth)
      : Math.min(window.innerHeight, window.innerWidth);
    const styles = getComputedStyle(this.elements.grid);
    const gapVar = styles.getPropertyValue('--grid-gap').trim() || '1px';
    const gridGap = parseFloat(gapVar) || 1;
    const cellSize = Math.max(4, (stageSize - (this.gridSize - 1) * gridGap) / this.gridSize);
    this.elements.grid.style.setProperty('--cell-size', `${cellSize.toFixed(3)}px`);
  }

  poissonIntervalMs() {
    const u = Math.random() || Number.EPSILON;
    const intervalBeats = -Math.log(u) * this.columnNextSpawnMeanBeats;
    return this.calculateTiming(intervalBeats);
  }

  startCascadeLoop() {
    let lastTimestamp = performance.now();
    const loop = (timestamp) => {
      if (!this.isMusicRunning) return;
      const deltaMs = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      this.updateCascade(deltaMs);
      this.cascadeFrameId = requestAnimationFrame(loop);
    };
    this.cascadeFrameId = requestAnimationFrame(loop);
  }

  stopCascadeLoop() {
    if (this.cascadeFrameId !== null) {
      cancelAnimationFrame(this.cascadeFrameId);
      this.cascadeFrameId = null;
    }
  }

  updateCascade(deltaMs) {
    const fallStepMs = this.calculateTiming(1);
    if (this.spawnMode === "scanning") {
      // spawn a new full row only after previous row completes
      if (this.musicBoxes.length === 0) {
        this.spawnFullRow();
      }
    } else {
      // cascade: random per-column spawn using Poisson-distributed timers
      for (let i = 0; i < this.activeColumnCount; i += 1) {
        this.columnNextSpawnMs[i] -= deltaMs;
        if (this.columnNextSpawnMs[i] <= 0) {
          const countInCol = this.musicBoxes.reduce((acc, b) => acc + (b.columnIndex === i ? 1 : 0), 0);
          if (countInCol < 4) {
            this.spawnBox(i);
          }
          // reset next spawn window using Poisson interval
          this.columnNextSpawnMs[i] = this.poissonIntervalMs();
        }
      }
    }

    const completedBoxes = [];
    this.musicBoxes.forEach((box) => {
      box.elapsed = (box.elapsed || 0) + deltaMs;
      if (box.elapsed >= fallStepMs) {
        box.elapsed = 0;
        this.updateDynamicBox(box);
        box.row += this.musicBarHeight;
        if (box.row >= this.gridSize) {
          completedBoxes.push(box);
        }
      }
    });

    completedBoxes.forEach((box) => this.removeBox(box));
  }

  spawnBoxesForColumns() {
    const currentCounts = Array.from({ length: this.activeColumnCount }, () => 0);
    this.musicBoxes.forEach((box) => {
      if (box.columnIndex < this.activeColumnCount) currentCounts[box.columnIndex] += 1;
    });

    currentCounts.forEach((count, columnIndex) => {
      if (count >= 4) return;
      this.spawnBox(columnIndex);
    });
  }

  spawnBox(columnIndex) {
    const box = {
      columnIndex,
      row: 0,
      prevRow: null,
      elapsed: this.spawnMode === "scanning" ? this.calculateTiming(1) : 0,
      color: this.pickColumnColor(columnIndex),
      id: `box-${(this.boxIdCounter += 1)}`
    };
    this.musicBoxes.push(box);
    this.updateDynamicBox(box);
  }

  pickColumnColor(columnIndex) {
    const palette = NOTE_COLOR_CLASSES;
    return palette[columnIndex % palette.length];
  }

  removeBox(box) {
    this.musicBoxes = this.musicBoxes.filter((candidate) => candidate !== box);
    this.clearBoxArea(box, box.prevRow);
    this.clearBoxArea(box, box.row);
  }

  clearMusicHighlights() {
    this.cells.forEach((cell) => {
      cell.classList.remove("music-bar", ...NOTE_COLOR_CLASSES);
    });
  }

  updateDynamicBox(box) {
    if (box.prevRow !== null) {
      this.clearBoxArea(box, box.prevRow);
    }

    const aliveCount = this.applyBoxArea(box, box.row);
    box.prevRow = box.row;
    const selected = this.resolveNoteFromDensity(aliveCount);
    if (selected) {
      this.colorBoxArea(box, selected.color);
    }
  }

  clearBoxArea(box, startRow) {
    if (startRow === null || startRow >= this.gridSize) return;
    const startCol = box.columnIndex * this.columnWidth;
    const endCol = Math.min(startCol + this.columnWidth, this.gridSize);
    const endRow = Math.min(startRow + this.musicBarHeight, this.gridSize);
    for (let row = startRow; row < endRow; row += 1) {
      for (let col = startCol; col < endCol; col += 1) {
        const index = row * this.gridSize + col;
        this.cells[index].classList.remove("music-bar", ...NOTE_COLOR_CLASSES);
      }
    }
  }

  applyBoxArea(box, startRow) {
    const startCol = box.columnIndex * this.columnWidth;
    const endCol = Math.min(startCol + this.columnWidth, this.gridSize);
    const endRow = Math.min(startRow + this.musicBarHeight, this.gridSize);
    let aliveCount = 0;
    for (let row = startRow; row < endRow; row += 1) {
      for (let col = startCol; col < endCol; col += 1) {
        const index = row * this.gridSize + col;
        const cell = this.cells[index];
        // Neutral highlight until activation
        cell.classList.add("music-bar");
        if (this.grid[row][col] === 1) {
          aliveCount += 1;
        }
      }
    }
    return aliveCount;
  }

  colorBoxArea(box, noteColor) {
    const startCol = box.columnIndex * this.columnWidth;
    const endCol = Math.min(startCol + this.columnWidth, this.gridSize);
    const startRow = box.row;
    const endRow = Math.min(startRow + this.musicBarHeight, this.gridSize);
    for (let row = startRow; row < endRow; row += 1) {
      for (let col = startCol; col < endCol; col += 1) {
        const index = row * this.gridSize + col;
        const cell = this.cells[index];
        NOTE_COLOR_CLASSES.forEach((c) => cell.classList.remove(c));
        cell.classList.add(noteColor);
      }
    }
  }

  resolveNoteFromDensity(aliveCount) {
    if (aliveCount <= 0) return null;
    if (!this.sortedNotesCache) {
      this.sortedNotesCache = [...NOTE_CONFIG].filter(n => n.active !== false).sort((a, b) => b.threshold - a.threshold);
    }
    if (this.sortedNotesCache.length === 0) return null;
    const candidate = this.sortedNotesCache.find((note) => aliveCount >= note.threshold);
    const selected = candidate || this.sortedNotesCache[this.sortedNotesCache.length - 1];
    const duration = this.calculateTiming(selected.durationBeats);
    const velocity = Math.min(127, 70 + aliveCount * 3);
    if (this.midiOutput) {
      this.playMIDINote(selected.midiNote, velocity, duration, selected.channel - 1);
    }
    return selected;
  }

  calculateTiming(beats) {
    return (60000 / this.bpm) * beats;
  }

  stopAllMIDINotes() {
    this.activeNotes.forEach((timeoutId, key) => {
      clearTimeout(timeoutId);
      const [channel, note] = key.split("-").map(Number);
      this.sendNoteOff(note, channel);
    });
    this.activeNotes.clear();

    for (let channel = 0; channel < 16; channel += 1) {
      if (this.midiOutput) {
        this.midiOutput.send([0xb0 | channel, 123, 0]);
      }
    }
  }

  async initializeMIDI() {
    if (!navigator.requestMIDIAccess) {
      this.updateMIDIStatus("Web MIDI API not supported in this browser.");
      return;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.midiAccess.addEventListener("statechange", () => this.updateMIDIDeviceList());
      this.updateMIDIDeviceList();
    } catch (error) {
      console.warn("MIDI initialization failed", error);
      this.midiAccess = null;
      this.midiOutput = null;
      this.updateMIDIDeviceList();
      this.updateMIDIStatus("Unable to initialize Web MIDI. Check browser permissions.");
    }
  }

  async rescanMIDIDevices() {
    if (!navigator.requestMIDIAccess) {
      this.updateMIDIStatus("Web MIDI API not supported in this browser.");
      return;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.updateMIDIDeviceList();
      this.updateMIDIStatus("MIDI devices refreshed.");
    } catch (error) {
      console.warn("MIDI refresh failed", error);
      this.updateMIDIStatus("Unable to refresh MIDI devices.");
    }
  }

  updateMIDIDeviceList() {
    const select = this.elements.midiOutputSelect;
    select.innerHTML = "";

    if (!this.midiAccess) {
      const option = new Option("Web MIDI unavailable", "unavailable");
      option.disabled = true;
      option.selected = true;
      select.appendChild(option);
      this.midiOutput = null;
      this.buildCustomSelectOptions("midiOutputSelect");
      this.syncCustomSelectLabel("midiOutputSelect");
      return;
    }

    const outputs = Array.from(this.midiAccess.outputs.values()).filter((output) => output.state === "connected");

    if (outputs.length === 0) {
      const option = new Option("No MIDI outputs detected", "no-output");
      option.disabled = true;
      option.selected = true;
      select.appendChild(option);
      this.midiOutput = null;
      this.preferredMidiOutputId = null;
      this.buildCustomSelectOptions("midiOutputSelect");
      this.syncCustomSelectLabel("midiOutputSelect");
      this.updateMIDIStatus("No MIDI outputs detected. Connect a device and refresh.");
      return;
    }

    outputs.forEach((output) => {
      const option = new Option(output.name, output.id);
      select.appendChild(option);
    });

    const preferredId = this.preferredMidiOutputId || this.midiOutput?.id;
    const matchedOutput = outputs.find((output) => output.id === preferredId) || outputs[0];
    this.midiOutput = matchedOutput;
    this.preferredMidiOutputId = matchedOutput.id;
    select.value = matchedOutput.id;

    this.buildCustomSelectOptions("midiOutputSelect");
    this.syncCustomSelectLabel("midiOutputSelect");
    if (this.midiOutput) {
      this.updateMIDIStatus(`Connected to "${this.midiOutput.name}"`);
    }
  }

  selectMIDIDevice(deviceId) {
    if (!this.midiAccess) return;
    const output = Array.from(this.midiAccess.outputs.values()).find((device) => device.id === deviceId);
    if (output) {
      this.midiOutput = output;
      this.preferredMidiOutputId = output.id;
      this.updateMIDIStatus(`Connected to "${output.name}"`);
      this.syncCustomSelectLabel("midiOutputSelect");
    }
  }

  updateMIDIStatus(message) {
    this.elements.midiStatusText.textContent = message;
  }

  playMIDINote(note, velocity, duration, channel) {
    if (!this.midiOutput) return;
    const key = `${channel}-${note}`;
    if (this.activeNotes.has(key)) {
      clearTimeout(this.activeNotes.get(key));
      this.sendNoteOff(note, channel);
    }

    this.sendNoteOn(note, velocity, channel);
    const timeoutId = setTimeout(() => {
      this.sendNoteOff(note, channel);
      this.activeNotes.delete(key);
    }, duration);
    this.activeNotes.set(key, timeoutId);
  }

  sendNoteOn(note, velocity, channel) {
    this.midiOutput.send([0x90 | channel, note, velocity]);
  }

  sendNoteOff(note, channel) {
    this.midiOutput.send([0x80 | channel, note, 0]);
  }

  togglePanel(force) {
    const shouldOpen = typeof force === "boolean" ? force : !this.elements.panel.classList.contains("open");
    this.elements.panel.classList.toggle("open", shouldOpen);
    this.elements.panelToggle.setAttribute("aria-expanded", String(shouldOpen));
  }

  openOverlay(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
    }
  }

  closeOverlay(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
    }
  }

  renderNoteConfig() {
    const grid = this.elements.noteConfigGrid;
    grid.innerHTML = "";
    NOTE_CONFIG.forEach((note) => {
      const card = document.createElement('div');
      card.className = 'note-card glass-panel';

      const header = document.createElement('header');
      const title = document.createElement('h3');
      title.innerHTML = `<span class="note-name ${note.color}">${note.label}</span>`;
      const chip = document.createElement('span');
      chip.className = 'note-chip';
      chip.textContent = `Channel ${note.channel}`;
      header.appendChild(title);
      header.appendChild(chip);

      const activeLabel = document.createElement('label');
      activeLabel.textContent = 'Active';
      const activeToggle = document.createElement('input');
      activeToggle.type = 'checkbox';
      activeToggle.checked = note.active !== false;
      activeToggle.addEventListener('change', (e) => {
        note.active = e.target.checked;
        this.sortedNotesCache = null;
      });
      activeLabel.appendChild(activeToggle);

      const thresholdLabel = document.createElement('label');
      thresholdLabel.textContent = 'Trigger threshold';
      const thresholdSelect = document.createElement('select');
      THRESHOLD_OPTIONS.forEach((value) => {
        const opt = new Option(`${value} cell${value > 1 ? 's' : ''}`, value, false, value === note.threshold);
        thresholdSelect.appendChild(opt);
      });
      thresholdSelect.addEventListener('change', (event) => {
        note.threshold = Number(event.target.value);
        this.sortedNotesCache = null;
      });

      const durationLabel = document.createElement('label');
      durationLabel.textContent = 'Note length';
      const durationSelect = document.createElement('select');
      BEAT_OPTIONS.forEach((option) => {
        const opt = new Option(option.label, option.value, false, option.value === note.durationBeats);
        durationSelect.appendChild(opt);
      });
      durationSelect.addEventListener('change', (event) => {
        note.durationBeats = Number(event.target.value);
      });

      thresholdLabel.appendChild(thresholdSelect);
      durationLabel.appendChild(durationSelect);
      card.appendChild(header);
      card.appendChild(activeLabel);
      card.appendChild(thresholdLabel);
      card.appendChild(durationLabel);
      grid.appendChild(card);
    });
  }

  updateCurrentScaleLabel() {
    const label = SCALE_LIBRARY[this.keyScale]?.label || "Custom";
    if (this.elements.currentScaleLabel) {
      this.elements.currentScaleLabel.textContent = `${this.keyTonic} ${label}`;
    }
  }

  applyKeyPreset() {
    const tonicIndex = TONIC_OPTIONS.indexOf(this.keyTonic);
    if (tonicIndex === -1) return;
    const intervals = SCALE_LIBRARY[this.keyScale]?.intervals || SCALE_LIBRARY.major.intervals;
    const midiNotes = intervals.map((interval) => (tonicIndex * 1 + interval) % 12);
    NOTE_CONFIG.forEach((note, idx) => {
      const degree = midiNotes[idx % midiNotes.length];
      note.midiNote = 36 + degree + Math.floor(idx / midiNotes.length) * 12;
    });
    this.sortedNotesCache = null;
    this.renderNoteConfig();
    this.updateCurrentScaleLabel();
  }

  randomizeKeyPreset() {
    const randomTonic = TONIC_OPTIONS[Math.floor(Math.random() * TONIC_OPTIONS.length)];
    const scaleKeys = Object.keys(SCALE_LIBRARY);
    const randomScale = scaleKeys[Math.floor(Math.random() * scaleKeys.length)];
    this.keyTonic = randomTonic;
    this.keyScale = randomScale;
    this.elements.keyTonicSelect.value = randomTonic;
    this.elements.keyScaleSelect.value = randomScale;
    this.syncCustomSelectLabel("keyTonicSelect");
    this.syncCustomSelectLabel("keyScaleSelect");
    this.applyKeyPreset();
  }

  initCustomSelects() {
    this.registerCustomSelect("ruleSelect");
    this.registerCustomSelect("midiOutputSelect");
    this.registerCustomSelect("spawnModeSelect");
    this.registerCustomSelect("randomFillAlgorithmSelect");
    this.registerCustomSelect("keyTonicSelect");
    this.registerCustomSelect("keyScaleSelect");
  }

  registerCustomSelect(selectId) {
    const select = document.getElementById(selectId);
    const wrapper = document.querySelector(`[data-select="${selectId}"]`);
    if (!select || !wrapper) return;
    const toggle = wrapper.querySelector(".custom-select-toggle");
    const optionsContainer = wrapper.querySelector(".custom-select-options");
    if (!toggle || !optionsContainer) return;

    const placeholder = toggle.dataset.placeholder || toggle.textContent.trim();
    toggle.dataset.placeholder = placeholder;

    this.customSelects.set(selectId, { select, wrapper, toggle, optionsContainer });
    this.buildCustomSelectOptions(selectId);
    this.syncCustomSelectLabel(selectId);

    toggle.addEventListener("click", () => this.toggleCustomSelect(selectId));
    select.addEventListener("change", () => this.syncCustomSelectLabel(selectId));
  }

  buildCustomSelectOptions(selectId) {
    const instance = this.customSelects.get(selectId);
    if (!instance) return;
    const { select, optionsContainer } = instance;
    optionsContainer.innerHTML = "";
    Array.from(select.options).forEach((option) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "custom-select-option";
      optionDiv.textContent = option.textContent;
      optionDiv.dataset.value = option.value;
      optionDiv.setAttribute("role", "option");
      if (option.value === select.value) {
        optionDiv.setAttribute("aria-selected", "true");
      }
      optionDiv.addEventListener("click", () => this.selectCustomOption(selectId, option.value));
      optionsContainer.appendChild(optionDiv);
    });
  }

  toggleCustomSelect(selectId) {
    const instance = this.customSelects.get(selectId);
    if (!instance) return;
    const isOpen = instance.wrapper.classList.toggle("open");
    instance.toggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      this.customSelects.forEach((item, id) => {
        if (id !== selectId) {
          item.wrapper.classList.remove("open");
          item.toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  closeAllCustomSelects() {
    this.customSelects.forEach((instance) => {
      instance.wrapper.classList.remove("open");
      instance.toggle.setAttribute("aria-expanded", "false");
    });
  }

  selectCustomOption(selectId, value) {
    const instance = this.customSelects.get(selectId);
    if (!instance) return;
    const { select } = instance;
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    this.syncCustomSelectLabel(selectId);
    this.closeAllCustomSelects();
  }

  syncCustomSelectLabel(selectId) {
    const instance = this.customSelects.get(selectId);
    if (!instance) return;
    const { select, toggle, optionsContainer } = instance;
    const placeholder = toggle.dataset.placeholder || "Select";
    const selectedOption = select.options[select.selectedIndex];
    toggle.textContent = selectedOption ? selectedOption.textContent : placeholder;
    toggle.dataset.placeholder = placeholder;

    Array.from(optionsContainer.children).forEach((child) => {
      child.removeAttribute("aria-selected");
      if (child.dataset.value === select.value) {
        child.setAttribute("aria-selected", "true");
      }
    });
  }

  handleDocumentClick(event) {
    const isSelectClick = [...this.customSelects.values()].some(({ wrapper }) => wrapper.contains(event.target));
    if (!isSelectClick) {
      this.closeAllCustomSelects();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CellularAutomataApp();
});
