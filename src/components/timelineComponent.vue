
<script setup>
  import { ref, onMounted, nextTick, onUnmounted} from 'vue';

  let processorsListHandler;
  let programsListHandler;
  const canvasWidth = 1200;
  const canvasHeight = 10000;
  const showInstructions = ref(true);
  const showPorts = ref(true);
  const hoverInfo = ref(null);
  const timelineCanvas = ref(null);
  let timelineData = ref(null);

  onMounted(() => {
    nextTick(async () => {
      const processorsList = document.getElementById("processors-list");
      if (processorsList) {
        processorsListHandler = () => {
          setTimeout(async () => {
            getTimelineAndDraw()
          }, 100);
        };
        processorsList.addEventListener("change", processorsListHandler);
      }
      const programsList = document.getElementById("programs-list");
      if (programsList) {
        programsListHandler = () => {
          setTimeout(async () => {
            getTimelineAndDraw()
          }, 100);
        };
        programsList.addEventListener("change", programsListHandler);
      }
      getTimelineAndDraw()
    });
  });

   function changeIterations(delta) {
    const input = document.getElementById("dependencies-num-iters");
    let val = parseInt(input.value, 10) || 1;
    const min = parseInt(input.min, 10) || 1;
    const max = parseInt(input.max, 10) || Infinity;
    val = Math.min(Math.max(val + delta, min), max);
    input.value = val;

    getTimelineAndDraw();
  }

  function toggleInstructions() {
    showInstructions.value = !showInstructions.value;
    if (timelineData.value) {
      drawTimeline(timelineData.value);
    }
  }

  function togglePorts() {
    showPorts.value = !showPorts.value;
    if (timelineData.value) {
      drawTimeline(timelineData.value);
    }
  }

  function drawTimeline(data) {
    const canvas = timelineCanvas.value;
    const ctx    = canvas.getContext('2d');
    const cellW   = 14;
    const cellH   = 20;
    const padX    = 20;
    const padY    = 10;
    const fontSize = 14;
    const fontYOffset = 3;

    // Split raw lines and extract port info
    const rawLines = data.split('\n');
    const rowPorts = extractRowInfo(rawLines);

    // Parse header (to find headerStart, headerMask, cycleCount)
    const { headerStart, headerMask, cycleCount } = parseHeader(rawLines);
    if (headerStart === null) {
      console.error("drawTimeline: no header line found.");
      return;
    }
    const headerLen = headerMask.length;

    // Produce processed lines
    const processed = rawLines.map(line =>
      collapseLine(line, headerStart, headerLen, headerMask)
    );

    // Filter out port rows, compute visibleRows[]
    const visibleRows = filterVisibleRows(processed, rowPorts, showPorts.value);

    // Measure & resize canvas based on visibleRows and show/hide instructions
    const measured = measureLines(visibleRows, showInstructions.value);
    canvas.width  = padX * 2 + measured.maxCols * cellW;
    canvas.height = padY * 2 + visibleRows.length * cellH;

    // Draw each row + build interactiveCells
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';
    ctx.imageSmoothingEnabled = false;

    const interactiveCells = [];
    visibleRows.forEach(({ raw, portNumber, type }, rowIndex) => {
    drawOneRow({
      ctx,
      raw,
      port: portNumber,
      instrType: type,
      rowIndex,
      padX, padY, cellW, cellH,
      headerStart, cycleCount,
      fontYOffset,
      showInstructions: showInstructions.value,
      interactiveCells
    });
  });

    // Attach mousemove to show hover info
    attachHover(canvas, interactiveCells, headerStart);
  }


  // get the esecution port of each instruction
  function extractRowInfo(rawLines) {
    const idToType = {};    // will map instrID → mnemonic string

    return rawLines.map(line => {
      // Get instruction number
      const idMatch = line.match(/^\s*\[\s*\d+\s*,\s*(\d+)\s*\]/);
      const instrID = idMatch ? idMatch[1] : null;

      // Get port and instruction type
      const m = line.match(/\(P\.(\d+)\)(?:\s*([A-Za-z0-9_.]+))?/);
      const portNumber = m ? m[1] : null;
      let type = (m && m[2]) ? m[2] : null;

      // Store type if instruction does have it
      if (instrID !== null && type !== null) {
        idToType[instrID] = type;
      }

      // Reuse type if not in first
      if (instrID !== null && type === null && idToType[instrID]) {
        type = idToType[instrID];
      }

      return { instrID, portNumber, type };
    });
  }



  // Parse header to get its beggining, end and deleted whitespaces
  function parseHeader(lines) {

    let headerStart = null;
    let headerMask  = null;
    let cycleCount  = 0;

    for (const line of lines) {
      const m = line.match(/^(\s*)([0-9 ]+)(\s*)$/);
      if (!m) continue;

      headerStart = m[1].length;
      const digitsSeq = m[2];
      headerMask = Array.from(digitsSeq, ch => /\d/.test(ch));
      cycleCount = headerMask.filter(b => b).length;
      break;
    }

    return {
      headerStart,
      headerMask: headerMask || [],
      cycleCount
    };
  }


  // Collapse lines to delete single whitespaces and align graph
  function collapseLine(origLine, headerStart, headerLen, headerMask) {
    let line = origLine;

    // Reposition [] labels to start of line
    const firstBracket = line.indexOf('[');
    if (firstBracket !== -1) {
      const closeBracket = line.indexOf(']', firstBracket);
      if (closeBracket !== -1) {
        const pre = line.slice(0, firstBracket);
        const core = line.slice(firstBracket, closeBracket + 1);
        const post = line.slice(closeBracket + 1);
        line = core + pre + post;
      }
    }

    // Case A: Header line (remove spaces in between digits)
    const headerMatch = line.match(/^(\s*)([0-9 ]+)(\s*)$/);
    if (headerMatch) {
      const prefix = headerMatch[1];
      const middle = headerMatch[2].replace(/ /g, "");
      const suffix = headerMatch[3];
      return prefix + middle + suffix;
    }

    // Case B: Port‐usage line (remove spaces in same positions as header)
    if (line.trim().startsWith("P") || line.trim().startsWith("MM")) {
      let labelPart = line.slice(0, headerStart);
      let rest = line.slice(headerStart);
      if (rest.length < headerLen) {
        rest += " ".repeat(headerLen - rest.length);
      }
      labelPart = labelPart.replace(/\bP\.(\d)\b/, "P$1 ");
      let collapsed = "";
      for (let i = 0; i < headerLen; i++) {
        if (headerMask[i]) {
          collapsed += rest[i] || " ";
        }
      }
      if (rest.length > headerLen) {
        collapsed += rest.slice(headerLen);
      }
      return labelPart + collapsed;
    }

    // Case C: Instruction line (remove spaces in same positions as header(ignoring ANSI labels))
    const instrMatch = line.match(/^(\s*\[[^\]]+\]\s*)(.*)$/);
    if (instrMatch) {
      let labelPart = line.slice(0, headerStart);
      let rest = line.slice(headerStart);
      if (rest.length < headerLen) {
        rest += " ".repeat(headerLen - rest.length);
      }

      // Find first “R” position (raw index)
      let retireIdx = rest.indexOf("R");
      if (retireIdx === -1) retireIdx = rest.length - 1;

      // Advance past any ANSI after the “R”
      let afterRetire = retireIdx + 1;
      if (rest.charAt(afterRetire) === "\x1b") {
        const ansiMatch = rest.slice(afterRetire).match(/^\x1b\[(\d+)m/);
        if (ansiMatch) afterRetire += ansiMatch[0].length;
      }

      const timelineRaw = rest.slice(0, afterRetire);
      let comment = rest.slice(afterRetire).replace(/^\s*/, " ");

      // Collect exactly headerLen visible chars, tracking red ANSI
      const chars = [];
      const isRed = [];
      let idx = 0;
      let currColor = null;
      while (idx < timelineRaw.length && chars.length < headerLen) {
        if (timelineRaw[idx] === "\x1b") {
          const ansiMatch = timelineRaw.slice(idx).match(/^\x1b\[(\d+)m/);
          if (ansiMatch) {
            currColor = (ansiMatch[1] === "91") ? "red" : null;
            idx += ansiMatch[0].length;
            continue;
          }
          idx++;
          continue;
        }
        chars.push(timelineRaw[idx]);
        isRed.push(currColor === "red");
        idx++;
      }
      while (chars.length < headerLen) {
        chars.push(" ");
        isRed.push(false);
      }

      // Determine how many false‐columns to drop under headerMask=false
      const falseCount = headerMask.reduce((s, keep) => s + (keep ? 0 : 1), 0);
      const keepFlags = new Array(headerLen).fill(true);
      let toRemove = falseCount;
      for (let i = 0; i < headerLen && toRemove > 0; i++) {
        if (!headerMask[i] && chars[i] === " ") {
          keepFlags[i] = false;
          toRemove--;
        }
      }
      if (toRemove > 0) {
        for (let i = 0; i < headerLen && toRemove > 0; i++) {
          if (!headerMask[i] && keepFlags[i] && chars[i] === " ") {
            keepFlags[i] = false;
            toRemove--;
          }
        }
      }

      // Rebuild collapsed timeline (with ANSI for red)
      let collapsed = "";
      for (let i = 0; i < headerLen; i++) {
        if (keepFlags[i]) {
          const ch = chars[i];
          collapsed += isRed[i] ? `\x1b[91m${ch}\x1b[0m` : ch;
        }
      }
      const idP = comment.indexOf("(");
      if (idP !== -1) {
        comment = comment.slice(0, idP).trimEnd();
      }

      if (comment.length > 1) {
        const firstChar = comment.charAt(0);
        const restChars = comment.slice(1).replace(/ /g, "");
        comment = firstChar + restChars;
      }

      const idxBracket = labelPart.indexOf('[');
      if (idxBracket !== -1 && labelPart[idxBracket + 1] === ' ') {
        // Remove only the single space immediately after “[”
        labelPart =
          labelPart.slice(0, idxBracket + 1) +
          labelPart.slice(idxBracket + 2);
      }
      return labelPart + " " + collapsed + " " + comment;
    }

    // Case D: Anything else
    return line;
  }


  function filterVisibleRows(processedLines, rowInfo, showPorts) {
    const visible = [];
    for (let i = 0; i < processedLines.length; i++) {
      const line = processedLines[i];
      const { instrID, portNumber, type } = rowInfo[i];

      if (!showPorts) {
        const t = line.trim();
        if (t.startsWith("P") || t.startsWith("MM") || i === 0) {
          continue;
        }
      }
      visible.push({
        raw:        line,
        instrID,
        portNumber,
        type
      });
    }
    return visible;
  }




  // Remove instructions if necessary and compute canvas size
  function measureLines(visibleRows, showInstructions) {
    const cleaned = visibleRows.map(({ raw }) => {
      let line = raw;
      if (!showInstructions) {
        const rIdx = line.indexOf("R");
        if (rIdx > -1) line = line.slice(0, rIdx + 1);
      }
      return line.replace(/\x1b\[91m/g, "").replace(/\x1b\[0m/g, "");
    });
    const maxCols = cleaned.reduce((mx, l) => Math.max(mx, l.length), 0);
    return { maxCols, lines: cleaned };
  }


  // Draw row of timeline canvas element
  function drawOneRow({
    ctx, raw, port, instrType, rowIndex,
    padX, padY, cellW, cellH,
    headerStart, cycleCount,fontYOffset,
    interactiveCells
  }) {
    // Compute visible‐column indices of first “D” and first “R”
    const { dVisIdx, rVisIdx } = computeDandRIdxs(raw);

    // Compute background color based on iteration number
    let iteration = -1;
    const m = raw.match(/^\s*\[\s*(\d+),/);
    if (m) iteration = parseInt(m[1], 10);
    const rowBg = iteration >= 0 ? `hsl(${(iteration * 80) % 360}, 50%, 90%)` : "#ffffff";

    // Draw each character
    let visCol = 0;
    let x = padX;
    const y = padY + rowIndex * cellH;
    let currColor = "#000";

    for (let i = 0; i < raw.length; ) {
      // Handle ANSI sequences to change character color
      if (raw[i] === "\x1b") {
        const ansiMatch = raw.slice(i).match(/^\x1b\[(\d+)m/);
        if (ansiMatch) {
          currColor = ansiMatch[1] === "91" ? "red" : "#000";
          i += ansiMatch[0].length;
          continue;
        }
        i++;
        continue;
      }

      visCol++;
      const colIdxVis = visCol - 1;
      const ch = raw[i];

      // Draw grid
      if (colIdxVis >= headerStart && colIdxVis < headerStart + cycleCount) {
        ctx.fillStyle   = rowBg;
        ctx.strokeStyle = "#bbb";
        ctx.lineWidth   = 1;
        ctx.fillRect(x, y, cellW, cellH);
        ctx.strokeRect(x, y, cellW, cellH);

        // Register interactive cell
        if (colIdxVis >= dVisIdx && colIdxVis <= rVisIdx) {
          interactiveCells.push({
            x, y,
            width:      cellW,
            height:     cellH,
            char:       ch,
            rowIndex,
            colIndexVis: colIdxVis,
            port,
            instrType,
            state:      charToState(ch)
          });
        }
      }

      // Draw char
      ctx.fillStyle = currColor;
      ctx.fillText(ch, x + 2, y + fontYOffset);

      i++;
      x += cellW;
    }
  }


  // Get index of D and R (start and end of this line's interactive cells) ignoring ANSI
  function computeDandRIdxs(raw) {
    let dVisIdx = Infinity;
    let rVisIdx = -1;
    let tmpVis = 0;
    let i = 0;

    while (i < raw.length) {
      if (raw[i] === "\x1b") {
        const ansiMatch = raw.slice(i).match(/^\x1b\[(\d+)m/);
        if (ansiMatch) {
          i += ansiMatch[0].length;
          continue;
        }
        i++;
        continue;
      }
      const ch = raw[i];
      if (ch === "D" && dVisIdx === Infinity) {
        dVisIdx = tmpVis;
      }
      if (ch === "R" && rVisIdx === -1) {
        rVisIdx = tmpVis;
      }
      tmpVis++;
      i++;
    }

    return { dVisIdx, rVisIdx };
  }


  // Attach hover event to cell
  function attachHover(canvas, interactiveCells, headerStart) {
    canvas.onmousemove = e => {
      const rect   = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      hoverInfo.value = null;

      for (const cell of interactiveCells) {
        if (
          mouseX >= cell.x &&
          mouseX <= cell.x + cell.width &&
          mouseY >= cell.y &&
          mouseY <= cell.y + cell.height
        ) {
          hoverInfo.value = {
            x: e.clientX + 10,
            y: e.clientY + 10,
            cycle:       cell.colIndexVis - headerStart,
            port:        cell.port || "N/A",
            state:       cell.state || "N/A",
            type:        cell.instrType || "N/A"
          };
          break;
        }
      }
    };
  }

  // Get state from char in cell
  function charToState(ch) {
    let msg = "This instruction is "
    switch (ch) {
      case "E": msg += "being executed."; break;
      case "R": msg += "being retired."; break;
      case "D": msg += "being dispatched."; break;
      case "-": msg += "waiting to be retired."; break;
      case "W": msg += "on write back stage."; break;
      case ".": msg += "waiting for execution due to dependencies."; break;
      case "*": msg += "waiting for execution due to occupied ports."; break;
      case "!": msg += "on a cache miss."; break;
      case "2": msg += "on a secondary cache miss."; break;
      default:  msg = "N/A"; break;
    }
    return msg;
  }



  async function getTimelineAndDraw() {
    if (typeof getTimeline === "function") {
      timelineData.value = await getTimeline();
      drawTimeline(timelineData.value);
    }
  }


  onUnmounted(() => {
    const processorsList = document.getElementById("processors-list");
    if (processorsList && processorsListHandler) {
      processorsList.removeEventListener("change", processorsListHandler);
    }

    const programsList = document.getElementById("programs-list");
    if (programsList && programsListHandler) {
      programsList.removeEventListener("change", programsListHandler);
    }
  });

</script>


<template>
  <div class="main">
    <div class="header">
      <h3>Timeline</h3>
      <div class="timeline-controls">
        <div class="simulation-results-controls-item">
          <label for="dependencies-num-iters" style="margin-right: 2px;">
            Iterations:
          </label>
          <div class="iterations-group">
            <button type="button" class="iterations-btn" @click="changeIterations(-1)">−</button>
            <input class="input-simulation-result iterations-input" type="number" id="dependencies-num-iters" name="dependencies-num-iters" min="1" max="50" value="1" @change="getTimelineAndDraw"/>
            <button type="button" class="iterations-btn" @click="changeIterations(1)">+</button>
          </div>
        </div>
        <button @click="toggleInstructions" class="toggle-button">{{ showInstructions ? 'Hide' : 'Show' }} Instructions</button>
        <button @click="togglePorts" class="toggle-button">{{ showPorts ? 'Hide' : 'Show' }} Ports</button>
      </div>

    </div>
    <div class="output-block-wrapper" id="simulation-output-container">
      <section class="simulation-results-controls" id="dependencies-controls">
      </section>
      <canvas ref="timelineCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
      <div v-if="hoverInfo" class="tooltip" :style="{ top: hoverInfo.y + 'px', left: hoverInfo.x + 'px' }">
        <div><strong>Cycle: </strong> {{ hoverInfo.cycle }}</div>
        <div><strong>Port: </strong> P{{ hoverInfo.port }}</div>
        <div><strong>Type: </strong> {{ hoverInfo.type }}</div>
        <div>{{ hoverInfo.state }}</div>
      </div>
    </div>
  </div>
</template>


<style scoped>
  .main{
    height:100%;
    width:100%;
    background: white;
    overflow:auto;
    padding:5px;
    border-radius: 10px;
  }
  .header{
    position:sticky;
    padding-top:2px;
    top:-5px;
    background:white;
    width:100%;
    left:0;
  }
  h3 {
  margin: 0;
  }
  .tooltip {
    position: fixed;
    background: #f9f9f9;
    border: 1px solid #ccc;
    padding: 8px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 10;
    font-size: 12px;
    width: 10%;
  }
  .toggle-button {
    background: #0085dd;
    color: white;
    border: none;
    padding: 4px 8px;
    font-size: 14px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    margin-right: 5px;
    margin-bottom: 5px;
  }

  .toggle-button:hover {
    background: #006fb9;
    color: white;
  }

  .toggle-button:active {
    outline: none;
    background: #003f73;
    color: white;
  }

  .header{
    position:sticky;
    top:-5px;
    background:white;
    width:100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .timeline-controls {
    display:flex;

  }

  .iterations-group {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-right:5px;
  }

  .iterations-input {
    width: 3ch;
    padding: 2px;
    text-align: center;
    -moz-appearance: textfield;
  }
  .iterations-input::-webkit-outer-spin-button,
  .iterations-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

</style>
