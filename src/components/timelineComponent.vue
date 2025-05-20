<script setup>
  import { ref, onMounted, nextTick, onUnmounted} from 'vue';

  let processorsListHandler;
  let programsListHandler;
  const canvasWidth = 1200;
  const canvasHeight = 600;
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

  function toggleInstructions() {
    showInstructions.value = !showInstructions.value;
    if (timelineData.value) {
      drawTimeline(timelineData.value);
    }
  }

  function drawTimeline(data) {
    const canvas = timelineCanvas.value;
    const ctx = canvas.getContext('2d');

    // Strip ANSI escape sequences
    data = data.replace(/\x1b\[[0-9;]*m/g, '');

    // Configurations
    const cellWidth = 10;             // Width of each character cell
    const cellHeight = 18;            // Height between rows
    const xPadding = 20;              // Padding on the left
    const yPadding = 10;              // Padding on the top
    const fontSize = 16;

    // Setup canvas text style
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';
    ctx.imageSmoothingEnabled = false;

    const lines = data.split('\n');
    const interactiveCells = [];

    lines.forEach((line, rowIndex) => {
      let timelinePart = line;
      if (!showInstructions.value) {
        const rIndex = line.indexOf('R');
        if (rIndex !== -1) {
          // Include everything up to and including the first 'R'
          timelinePart = line.slice(0, rIndex + 1);
        }
      }

      for (let colIndex = 0; colIndex < timelinePart.length; colIndex++) {
        const char = timelinePart[colIndex];
        const x = xPadding + colIndex * cellWidth;
        const y = yPadding + rowIndex * cellHeight;

        ctx.fillText(char, x, y);

        // Store cell for interactivity
        interactiveCells.push({
          x,
          y,
          width: cellWidth,
          height: cellHeight,
          char,
          rowIndex,
          colIndex,
          cycle: colIndex,
          port: null,  // You can update this later from instruction parsing
          dependencies: null
        });
      }
    });

    // Hover info reset
    canvas.onmousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
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
            cycle: cell.cycle,
            port: cell.port || "N/A",
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
    setTimeout(async () => {
      getTimelineAndDraw();
    }, 100);
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
      <button @click="toggleInstructions" class="toggle-button">{{ showInstructions ? 'Hide' : 'Show' }} Instructions</button>
    </div>
    <div class="output-block-wrapper" id="simulation-output-container">
      <section class="simulation-results-controls" id="dependencies-controls">
        <div class="simulation-results-controls-item">
            <label for="dependencies-num-iters" style="margin-right: 10px;">Iterations:</label>
            <input class="input-simulation-result" type="number" id="dependencies-num-iters" name="dependencies-num-iters" min="1" max="50" value="1" @change="onIterationChange" >
        </div>
        <div>
        </div>
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
    top:-5px;
    background:white;
    width:100%;
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
</style>

<!--OLD VERSION

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
</script>

<template>
  <div class="main">
    <div class="header">
      <h3>Timeline</h3>
    </div>
        <div class="output-block-wrapper" id="simulation-output-container">
            <section class="simulation-results-controls" id="dependencies-controls">
                <div class="simulation-results-controls-item">
                    <label for="dependencies-num-iters" style="margin-right: 10px;">Iterations:</label>
                    <input class="input-simulation-result" type="number" id="dependencies-num-iters" name="dependencies-num-iters" min="1" max="50" value="1" onchange="lastExecutedCommand();" >
                </div>
                <div>
                </div>
            </section>
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
    top:-5px;
    background:white;
    width:100%;
  }
  h3 {
  margin: 0;
  }
</style>
-->
