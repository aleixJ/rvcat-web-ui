
<script setup>
  import { ref, onMounted, nextTick, onUnmounted} from 'vue';

  let processorsListHandler;
  let programsListHandler;
  const canvasWidth = 1200;
  const canvasHeight = 10000;
  const showInstructions = ref(true);
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

  function drawTimeline(data) {
    const canvas = timelineCanvas.value;
    const ctx    = canvas.getContext('2d');

    const cellWidth   = 14;
    const cellHeight  = 20;
    const xPadding    = 20;
    const yPadding    = 10;
    const fontSize    = 14;
    const fontYOffset = 3;

    // 1) Split raw lines:
    const rawLines = data.split('\n');

    // 1a) Find the header line (the one that is only spaces + digits + spaces),
    //     record where it starts and how wide it is.
    let headerStart  = null;
    let headerLength = null;
    let headerMask   = null;  // an array of booleans, one per character of header
    let cycleCount   = 0;     // number of 'true' entries in headerMask

    for (const line of rawLines) {
      // Check if this line is purely [spaces][digits and spaces][spaces]
      const m = line.match(/^(\s*)([0-9 ]+)(\s*)$/);
      if (m) {
        //  - m[1] is all leading spaces
        //  - m[2] is something like "0 1 2 3 4 5 …"
        //  - m[3] is trailing spaces
        headerStart  = m[1].length;         // index where the first digit appears
        headerLength = m[2].length;         // how many characters (digits+spaces) the header has

        // Build a mask: headerMask[i]===true if line[i] is a digit, false if it's a space.
        headerMask = Array.from(
          line.slice(headerStart, headerStart + headerLength),
          ch => /\d/.test(ch)
        );
        cycleCount = headerMask.filter(b => b).length; // count of digit‐columns
        break;
      }
    }

    // If we never found a header, abort drawing:
    if (headerStart === null) {
      console.error("drawTimeline: no header line (digits+spaces) found.");
      return;
    }

    // 2) Build processedLines
    const processedLines = rawLines.map(line => {

      // Header lines
      const headerMatch = line.match(/^(\s*)([0-9 ]+)(\s*)$/);
      if (headerMatch) {
        const prefix = headerMatch[1];
        const middle = headerMatch[2].replace(/ /g, "");
        const suffix = headerMatch[3];
        return prefix + middle + suffix;
      }

      // Port usage lines
      if (line.trim().startsWith("P.")) {

        const labelPart = line.slice(0, headerStart);
        let rest = line.slice(headerStart);

        if (rest.length < headerLength) {
          rest = rest + " ".repeat(headerLength - rest.length);
        }

        let collapsedTimeline = "";
        for (let i = 0; i < headerLength; i++) {
          if (headerMask[i]) {
            collapsedTimeline += rest[i] || " ";
          }
        }

        if (rest.length > headerLength) {
          collapsedTimeline += rest.slice(headerLength);
        }

        return labelPart + collapsedTimeline;
      }

      // Instruction lines
      const instrMatch = line.match(/^(\s*\[[^\]]+\]\s*)(.*)$/);
      if (instrMatch) {

        const labelPart = line.slice(0, headerStart);
        let   rest      = line.slice(headerStart);

        if (rest.length < headerLength) {
          rest = rest + " ".repeat(headerLength - rest.length);
        }
        let retireRawIdx = rest.indexOf("R");

        let afterRetireIdx = retireRawIdx + 1;
        if (rest.charAt(afterRetireIdx) === "\x1b") {
          // Attempt to match "\x1b[<digits>m" right after retireRawIdx
          const ansiMatch = rest.slice(afterRetireIdx).match(/^\x1b\[(\d+)m/);
          if (ansiMatch) {
            afterRetireIdx += ansiMatch[0].length;
          }
        }

        let timelineRaw   = rest.slice(0, afterRetireIdx);
        let commentSuffix = rest.slice(afterRetireIdx);
        commentSuffix = commentSuffix.replace(/^\s*/, " ");

        //    Parse `timelineRaw` into arrays of visible characters + color flags.
        //    track when color = red (“\x1b[91m”) vs normal (“\x1b[0m”).
        const chars = [];
        const isRed = [];
        let   idx    = 0;
        let   color  = null; // "red" or null

        while (idx < timelineRaw.length && chars.length < headerLength) {
          if (timelineRaw[idx] === "\x1b") {
            // Match an ANSI sequence like "\x1b[91m" or "\x1b[0m"
            const ansiMatch = timelineRaw.slice(idx).match(/^\x1b\[(\d+)m/);
            if (ansiMatch) {
              if (ansiMatch[1] === "91") {
                color = "red";
              } else if (ansiMatch[1] === "0") {
                color = null;
              }
              idx += ansiMatch[0].length;
              continue;
            } else {
              // Malformed escape? Skip one char to avoid infinite loop.
              idx++;
              continue;
            }
          }
          // Otherwise, it’s a visible char:
          chars.push(timelineRaw[idx]);
          isRed.push(color === "red");
          idx++;
        }

        // If we didn’t collect headerLength visible chars, pad with spaces:
        while (chars.length < headerLength) {
          chars.push(" ");
          isRed.push(false);
        }

        // 6) Count how many columns the header wants to drop:
        //    falseCount = number of false entries in headerMask.
        const falseCount = headerMask.reduce((sum, keep) => sum + (keep ? 0 : 1), 0);

        // 7) Build a “keepFlags” array of length = headerLength.
        //    For each i where headerMask[i] === false, we try to remove a space.
        //    If chars[i] !== " ", we must skip removing here and find the next space
        //    in a false position. We never remove non-spaces.
        const keepFlags = new Array(headerLength).fill(true);
        let   toRemove  = falseCount;

        // First pass: for each i where headerMask[i]===false, if chars[i]===" " and we still need to remove,
        // mark keepFlags[i]=false and decrement toRemove. If chars[i] !== " ", leave keepFlags[i]=true.
        for (let i = 0; i < headerLength && toRemove > 0; i++) {
          if (!headerMask[i]) {
            if (chars[i] === " ") {
              keepFlags[i] = false;
              toRemove--;
            }
            // If chars[i] !== " ", we skip removing at this position.
          }
        }

        // If we still haven’t removed enough (because some false positions had non-space),
        // do a second pass over any remaining false positions to find more spaces:
        if (toRemove > 0) {
          for (let i = 0; i < headerLength && toRemove > 0; i++) {
            if (!headerMask[i] && keepFlags[i] && chars[i] === " ") {
              keepFlags[i] = false;
              toRemove--;
            }
          }
        }

        // 8) Now build the collapsed timeline by keeping exactly those chars where keepFlags[i]===true.
        //    Wrap in ANSI `[91m ... 0m` if isRed[i] was true.
        let collapsedTimeline = "";
        for (let i = 0; i < headerLength; i++) {
          if (keepFlags[i]) {
            const ch = chars[i];
            if (isRed[i]) {
              collapsedTimeline += "\x1b[91m" + ch + "\x1b[0m";
            } else {
              collapsedTimeline += ch;
            }
          }
        }
        // At this point, `collapsedTimeline` has exactly `headerLength - falseCount === cycleCount`
        // visible characters (each possibly wrapped in ANSI).

        // 9) Reassemble: label + collapsedTimeline + one space + commentSuffix.
        return labelPart + collapsedTimeline + " " + commentSuffix;
      }


      // 2D) Case D: Anything else (collapse only spaces that sit between two non-spaces)
      return line.replace(/(\S) +(\S)/g, "$1$2");
    });

    // 3) Use processedLines for measuring/drawing (unchanged from before):
    const measureLines = processedLines.map(raw => {
      let line = raw;
      if (!showInstructions.value) {
        const rIndex = line.indexOf("R");
        if (rIndex !== -1) line = line.slice(0, rIndex + 1);
      }
      return line.replace(/\x1b\[91m/g, "").replace(/\x1b\[0m/g, "");
    });

    const maxCols = measureLines.reduce((max, l) => Math.max(max, l.length), 0);
    canvas.width  = xPadding * 2 + maxCols * cellWidth;
    canvas.height = yPadding * 2 + measureLines.length * cellHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font               = `${fontSize}px monospace`;
    ctx.textBaseline       = "top";
    ctx.imageSmoothingEnabled = false;

    const interactiveCells = [];

    processedLines.forEach((raw, rowIndex) => {
      let line = raw;
      if (!showInstructions.value) {
        const rIndex = line.indexOf("R");
        if (rIndex !== -1) line = line.slice(0, rIndex + 1);
      }

      const y = yPadding + rowIndex * cellHeight;
      let   x = xPadding;
      let   color = "#000";

      for (let i = 0; i < line.length; i++) {
        // ANSI handling (unchanged)
        if (line[i] === "\x1b") {
          if (line.substr(i, 5) === "\x1b[91m") { color = "red"; i += 4; continue; }
          if (line.substr(i, 4) === "\x1b[0m")   { color = "#000"; i += 3; continue; }
        }

        // Draw each “cell”:
        ctx.fillStyle   = "#fff";
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth   = 1;
        ctx.fillRect(x, y, cellWidth, cellHeight);
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        ctx.fillStyle = color;
        ctx.fillText(line[i], x + 2, y + fontYOffset);

        interactiveCells.push({
          x, y,
          width:  cellWidth,
          height: cellHeight,
          char:   line[i],
          rowIndex,
          colIndex: i
        });

        x += cellWidth;
      }
    });

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
            x: mouseX + 10,
            y: mouseY + 10,
            cycle: cell.colIndex,
            port:  cell.port || "N/A",
            dependencies: cell.dependencies || "N/A"
          };
          break;
        }
      }
    };
  }


  async function getTimelineAndDraw() {
    if (typeof getTimeline === "function") {
      timelineData.value = await getTimeline();
      drawTimeline(timelineData.value);
    }
  }

  function onIterationChange() {
    getTimelineAndDraw();
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
      <h3>Timeline (work in progress)</h3>
      <div class="timeline-controls">
        <div class="simulation-results-controls-item">
          <label for="dependencies-num-iters" style="margin-right: 10px;">
            Iterations:
          </label>
          <div class="iterations-group">
            <button type="button" class="iterations-btn" @click="changeIterations(-1)">−</button>
            <input class="input-simulation-result iterations-input" type="number" id="dependencies-num-iters" name="dependencies-num-iters" min="1" max="50" value="1" onchange="lastExecutedCommand();"/>
            <button type="button" class="iterations-btn" @click="changeIterations(1)">+</button>
          </div>
        </div>
        <button @click="toggleInstructions" class="toggle-button">{{ showInstructions ? 'Hide' : 'Show' }} Instructions</button>
      </div>

    </div>
    <div class="output-block-wrapper" id="simulation-output-container">
      <section class="simulation-results-controls" id="dependencies-controls">
      </section>
      <canvas ref="timelineCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
      <div v-if="hoverInfo" class="tooltip" :style="{ top: hoverInfo.y + 'px', left: hoverInfo.x + 'px' }">
        <div><strong>Cycle:</strong> {{ hoverInfo.cycle }}</div>
        <div><strong>Port:</strong> {{ hoverInfo.port }}</div>
        <div><strong>Dependencies:</strong> {{ hoverInfo.dependencies }}</div>
        <p><b>This does not work properly yet</b></p>
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
    position: absolute;
    background: #f9f9f9;
    border: 1px solid #ccc;
    padding: 8px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 10;
    font-size: 12px;
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
<!--
<script setup>
  import { onMounted, nextTick } from "vue";
  onMounted(() => {
    nextTick(() => {
      if (typeof getTimeline === "function") {
        getTimeline();
      } else {
        console.error("simulation-output element not found.");
      }
    });
  });

  function changeIterations(delta) {
    const input = document.getElementById("dependencies-num-iters");
    let val = parseInt(input.value, 10) || 1;
    const min = parseInt(input.min, 10) || 1;
    const max = parseInt(input.max, 10) || Infinity;
    val = Math.min(Math.max(val + delta, min), max);
    input.value = val;

    lastExecutedCommand();
  }
</script>

<template>
  <div class="main">
    <div class="header">
      <h3>Timeline</h3>
      <section class="simulation-results-controls" id="dependencies-controls">
        <div class="simulation-results-controls-item">
          <label for="dependencies-num-iters" style="margin-right: 10px;">
            Iterations:
          </label>
          <div class="iterations-group">
            <button type="button" class="iterations-btn" @click="changeIterations(-1)">−</button>
            <input class="input-simulation-result iterations-input" type="number" id="dependencies-num-iters" name="dependencies-num-iters" min="1" max="50" value="1" onchange="lastExecutedCommand();"/>
            <button type="button" class="iterations-btn" @click="changeIterations(1)">+</button>
          </div>
        </div>
      </section>
    </div>
        <div class="output-block-wrapper" id="simulation-output-container">
            <div class="output-block" id="simulation-output">
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
    left:0;
    background:white;
    width:100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h3 {
  margin: 0;
  }
  .iterations-group {
    display: inline-flex;
    align-items: center;
    gap: 4px;
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

  .iterations-btn {
    background: #e0e0e0;
    border: 1px solid #b0b0b0;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    line-height: 1;
    text-align: center;
    font-size: 1.2em;
    cursor: pointer;
    user-select: none;
  }
  .iterations-btn:hover {
    background: #d0d0d0;
  }

</style>-->

