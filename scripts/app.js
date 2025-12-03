const NOTE_CONFIG = [
  { id: "note1", label: "A", color: "note1", column: 0, startRow: 0, beats: 4, threshold: 8, midiNote: 45, channel: 1 },
  { id: "note2", label: "B♭", color: "note2", column: 1, startRow: 8, beats: 2, threshold: 7, midiNote: 46, channel: 2 },
  { id: "note3", label: "C♯", color: "note3", column: 2, startRow: 16, beats: 2, threshold: 6, midiNote: 49, channel: 3 },
  { id: "note4", label: "D", color: "note4", column: 3, startRow: 24, beats: 1, threshold: 5, midiNote: 50, channel: 4 },
  { id: "note5", label: "E", color: "note5", column: 4, startRow: 32, beats: 1, threshold: 4, midiNote: 52, channel: 5 },
  { id: "note6", label: "F", color: "note6", column: 5, startRow: 40, beats: 1, threshold: 3, midiNote: 53, channel: 6 },
  { id: "note7", label: "G", color: "note7", column: 6, startRow: 48, beats: 0.5, threshold: 3, midiNote: 55, channel: 7 },
  { id: "note8", label: "A↑", color: "note8", column: 7, startRow: 56, beats: 0.5, threshold: 5, midiNote: 57, channel: 8 },
  { id: "note9", label: "C♯↑", color: "note9", column: 8, startRow: 64, beats: 0.5, threshold: 4, midiNote: 61, channel: 9 },
  { id: "note10", label: "D↑", color: "note10", column: 9, startRow: 72, beats: 0.25, threshold: 3, midiNote: 62, channel: 10 },
  { id: "note11", label: "E↑", color: "note11", column: 10, startRow: 80, beats: 0.25, threshold: 2, midiNote: 64, channel: 11 }
];

const BEAT_OPTIONS = [
  { value: 4, label: "4 beats" },
  { value: 2, label: "2 beats" },
  { value: 1, label: "1 beat" },
  { value: 0.5, label: "1/2 beat" },
  { value: 0.25, label: "1/4 beat" },
  { value: 0.125, label: "1/8 beat" },
  { value: 0.0625, label: "1/16 beat" }
];

const THRESHOLD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

class CellularAutomataApp {
  constructor() {
    this.gridSize = 88;
    this.musicBarHeight = 8;
    this.musicBarWidth = 8;
    this.grid = this.createMatrix();
    this.nextGrid = this.createMatrix();
    this.isRunning = false;
    this.simIntervalId = null;
    this.simBpm = 75;

    this.isMusicRunning = false;
    this.bpm = 75;
    this.musicBoxes = NOTE_CONFIG.map((config) => ({
      ...config,
      position: config.startRow,
      intervalId: null,
      timeoutId: null
    }));

    this.isMouseDown = false;
    this.isRightClick = false;
    this.currentRule = "conway";
    this.activeNotes = new Map();
    this.midiAccess = null;
    this.midiOutput = null;

    this.cacheElements();
    this.buildGrid();
    this.attachEventListeners();
    this.renderNoteConfig();
    this.initializeMIDI();
  }

  cacheElements() {
    this.elements = {
      grid: document.getElementById("grid"),
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

    midiOutputSelect.addEventListener("change", (event) => this.selectMIDIDevice(event.target.value));
    refreshMidiBtn.addEventListener("click", () => this.updateMIDIDeviceList());

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
      }
    });
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

    this.musicBoxes.forEach((box, index) => {
      const timing = this.calculateTiming(box.beats);
      const startDelay = this.calculateTiming(0.125) * index;
      box.timeoutId = setTimeout(() => {
        this.updateMusicBox(index);
        box.intervalId = setInterval(() => this.updateMusicBox(index), timing);
      }, startDelay);
    });
  }

  stopMusic() {
    if (!this.isMusicRunning) return;
    this.isMusicRunning = false;
    this.elements.musicStartBtn.disabled = false;
    this.elements.musicStopBtn.disabled = true;
    this.resetMusicBoxes();
    this.stopAllMIDINotes();
    this.clearMusicHighlights();
  }

  resetMusicBoxes() {
    this.musicBoxes.forEach((box) => {
      box.position = box.startRow;
      if (box.intervalId) {
        clearInterval(box.intervalId);
        box.intervalId = null;
      }
      if (box.timeoutId) {
        clearTimeout(box.timeoutId);
        box.timeoutId = null;
      }
    });
  }

  clearMusicHighlights() {
    this.cells.forEach((cell) => {
      cell.classList.remove(
        "music-bar",
        "note1",
        "note2",
        "note3",
        "note4",
        "note5",
        "note6",
        "note7",
        "note8",
        "note9",
        "note10",
        "note11"
      );
    });
  }

  updateMusicBox(index) {
    const box = this.musicBoxes[index];
    this.cells.forEach((cell) => {
      if (cell.classList.contains(box.color)) {
        cell.classList.remove("music-bar", box.color);
      }
    });

    const startCol = box.column * this.musicBarWidth;
    const endCol = startCol + this.musicBarWidth;
    const startRow = box.position;
    const endRow = Math.min(startRow + this.musicBarHeight, this.gridSize);
    let aliveCount = 0;

    for (let row = startRow; row < endRow; row += 1) {
      for (let col = startCol; col < Math.min(endCol, this.gridSize); col += 1) {
        const cellIndex = row * this.gridSize + col;
        const cell = this.cells[cellIndex];
        cell.classList.add("music-bar", box.color);
        if (this.grid[row][col] === 1) {
          aliveCount += 1;
        }
      }
    }

    this.playBoxTone(box, aliveCount);
    box.position += this.musicBarHeight;
    if (box.position >= this.gridSize) {
      box.position = 0;
    }
  }

  playBoxTone(box, aliveCount) {
    if (!this.midiOutput || aliveCount === 0) return;
    const noteIndex = NOTE_CONFIG.findIndex((config) => config.id === box.id);
    const shouldPlay = aliveCount >= box.threshold;
    if (!shouldPlay) return;

    const noteVariations = [0, 1, 4, 7, 12];
    const noteOffset = noteVariations[Math.min(aliveCount - 1, noteVariations.length - 1)];
    const midiNote = Math.max(0, Math.min(127, box.midiNote + noteOffset));

    let velocity = 64;
    let duration = 500;
    if (noteIndex < 7) {
      velocity = Math.min(127, 60 + aliveCount * 4 + noteIndex * 2);
      duration = Math.max(200, 800 - noteIndex * 80);
    } else {
      velocity = Math.min(127, 70 + aliveCount * 5);
      duration = Math.max(100, 300 - (noteIndex - 7) * 40);
    }

    this.playMIDINote(midiNote, velocity, duration, box.channel - 1);
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
    try {
      if (!navigator.requestMIDIAccess) {
        throw new Error("Web MIDI API not supported");
      }
      this.midiAccess = await navigator.requestMIDIAccess();
      this.midiAccess.addEventListener("statechange", () => this.updateMIDIDeviceList());
      this.updateMIDIDeviceList();
    } catch (error) {
      console.warn("MIDI initialization failed", error);
      this.midiOutput = this.createConsoleMidiOutput();
      this.updateMIDIDeviceList();
      this.updateMIDIStatus("Console MIDI logger active (Web MIDI unavailable)");
    }
  }

  createConsoleMidiOutput() {
    return {
      name: "Console MIDI Logger",
      id: "console",
      send: (message) => {
        const [status, note, velocity] = message;
        const isNoteOn = (status & 0xf0) === 0x90;
        const channel = (status & 0x0f) + 1;
        const action = isNoteOn ? "Note ON" : "Note OFF";
        console.log(`${action}: Channel ${channel}, Note ${note}, Velocity ${velocity}`);
      }
    };
  }

  updateMIDIDeviceList() {
    const select = this.elements.midiOutputSelect;
    select.innerHTML = "";

    if (this.midiAccess) {
      const outputs = Array.from(this.midiAccess.outputs.values());
      if (outputs.length === 0) {
        const option = new Option("No MIDI outputs", "no-output");
        select.appendChild(option);
        this.midiOutput = this.createConsoleMidiOutput();
      } else {
        outputs.forEach((output) => {
          const option = new Option(output.name, output.id);
          select.appendChild(option);
        });
        if (!this.midiOutput || !outputs.find((output) => output.id === this.midiOutput.id)) {
          this.midiOutput = outputs[0];
          select.value = outputs[0].id;
        } else {
          select.value = this.midiOutput.id;
        }
      }
    } else {
      const option = new Option("Console MIDI Logger", "console");
      select.appendChild(option);
      this.midiOutput = this.createConsoleMidiOutput();
    }

    if (this.midiOutput) {
      this.updateMIDIStatus(`Connected to "${this.midiOutput.name}"`);
    }
  }

  selectMIDIDevice(deviceId) {
    if (!this.midiAccess) return;
    const output = Array.from(this.midiAccess.outputs.values()).find((device) => device.id === deviceId);
    if (output) {
      this.midiOutput = output;
      this.updateMIDIStatus(`Connected to "${output.name}"`);
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
    this.musicBoxes.forEach((box, index) => {
      const card = document.createElement("div");
      card.className = "note-card glass-panel";

      const header = document.createElement("header");
      const title = document.createElement("h3");
      title.textContent = box.label;
      const chip = document.createElement("span");
      chip.className = "note-chip";
      chip.textContent = `Channel ${box.channel}`;
      header.appendChild(title);
      header.appendChild(chip);

      const beatLabel = document.createElement("label");
      beatLabel.textContent = "Beats";
      const beatSelect = document.createElement("select");
      BEAT_OPTIONS.forEach((option) => {
        const opt = new Option(option.label, option.value, false, option.value === box.beats);
        beatSelect.appendChild(opt);
      });
      beatSelect.addEventListener("change", (event) => {
        box.beats = Number(event.target.value);
        if (this.isMusicRunning) {
          this.stopMusic();
          this.startMusic();
        }
      });

      const thresholdLabel = document.createElement("label");
      thresholdLabel.textContent = "Threshold";
      const thresholdSelect = document.createElement("select");
      THRESHOLD_OPTIONS.forEach((value) => {
        const opt = new Option(`${value} cell${value > 1 ? "s" : ""}`, value, false, value === box.threshold);
        thresholdSelect.appendChild(opt);
      });
      thresholdSelect.addEventListener("change", (event) => {
        box.threshold = Number(event.target.value);
      });

      beatLabel.appendChild(beatSelect);
      thresholdLabel.appendChild(thresholdSelect);
      card.appendChild(header);
      card.appendChild(beatLabel);
      card.appendChild(thresholdLabel);
      grid.appendChild(card);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CellularAutomataApp();
});
