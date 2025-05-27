<script setup>
  import { ref, onMounted, nextTick, onUnmounted } from "vue";

  let processorsListHandler;
  let programsListHandler;
  const showAnnotations = ref(false);
  const showFullScreen = ref(false);

  function openFullScreen() {
    showFullScreen.value = true;
    // after DOM updates, clone the existing SVG into the popup
    nextTick(() => {
      const src = document.getElementById("simulation-output");
      const dst = document.getElementById("simulation-output-full");
      if (src && dst) {
        dst.innerHTML = "";
        dst.appendChild(src.querySelector("svg").cloneNode(true));
      }
    });
  }

  function closeFullScreen() {
    showFullScreen.value = false;
  }

  function toggleAnnotations() {
    showAnnotations.value = !showAnnotations.value;

    if (showAnnotations.value) {
      if (typeof programShowPerfAnnotations === "function") {
        nextTick(() => {
          programShowPerfAnnotations();
        });
      } else {
        console.error("programShowPerfAnnotations function not found.");
      }
    }
  }

  onMounted(() => {
    nextTick(() => {
      const processorsList = document.getElementById("processors-list");
      if (processorsList) {
        processorsListHandler = () => {
          setTimeout(() => {
            if (showAnnotations.value && typeof programShowPerfAnnotations === "function") {
              programShowPerfAnnotations();
            }
          }, 100);
        };
        processorsList.addEventListener("change", processorsListHandler);
      }
      const programsList = document.getElementById("programs-list");
      if (programsList) {
        programsListHandler = () => {
          setTimeout(() => {
            if (showAnnotations.value && typeof programShowPerfAnnotations === "function") {
              programShowPerfAnnotations();
            }
          }, 100);
        };
        programsList.addEventListener("change", programsListHandler);
      }

      if (typeof showCriticalPathsGraph === "function") {
        showCriticalPathsGraph();
      } else {
        console.error("simulation-output element not found.");
      }
    });
  });

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
      <h3>Static Analysis</h3>
    </div>

    <div class="annotations-wrapper">
      <div class="annotations-header" @click="toggleAnnotations">
        <span class="arrow">{{ showAnnotations ? '▼' : '▶' }}</span>
        <span class="title"><b>Performance Annotations</b></span>
      </div>

      <Transition name="fold" appear>
        <pre v-show="showAnnotations" id="performance-annotations" class="annotations-box"></pre>
      </Transition>
    </div>
    <div class="output-block-wrapper" id="simulation-output-container">
      <div class="graph-header">
        <button class="fullscreen-button" @click="openFullScreen">
          <img src="/img/fullscreen.png">
        </button>
        <h4>Recurrent Paths Graph</h4>
      </div>
      <div class="output-block" id="simulation-output"></div>
    </div>
  </div>
  <div v-if="showFullScreen" class="fullscreen-overlay">
    <div class="fullscreen-content">
      <div class="fullscreen-header">
        <h3>Recurrent Paths Graph</h3>
        <button class="close-btn" @click="closeFullScreen">×</button>
      </div>
      <div class="output-block" id="simulation-output-full"></div>
    </div>
  </div>
</template>

<style scoped>
  .main {
    height: 100%;
    width: 100%;
    background: white;
    overflow: auto;
    padding: 5px;
    border-radius: 10px;
  }
  .header {
    position: sticky;
    padding-top:2px;
    top: -5px;
    left:0;
    background: white;
    width: 100%;
  }
  h3 {
    margin: 0;
  }
  .annotations-wrapper {
    margin-top: 5px;
  }
  .annotations-header {
    cursor: pointer;
    background-color: #f0f0f0;
    padding: 4px 8px;
    border-radius: 5px 5px 0 0;
    font-family: monospace;
    display: flex;
    align-items: center;
    font-size: 14px;
  }
  .annotations-header .arrow {
    margin-right: 5px;
  }
  .annotations-box {
    white-space: pre-wrap;
    background: #f0f0f0;
    padding: 10px;
    border-radius: 0 0 5px 5px;
    font-family: monospace;
    margin-top: 0;
    font-size: 13px;
  }

  /* Folding animation */
  .fold-enter-active, .fold-leave-active {
    transition: max-height 0.3s ease, opacity 0.3s ease;
    overflow: hidden;
  }
  .fold-enter-from, .fold-leave-to {
    max-height: 0;
    opacity: 0;
  }
  .fold-enter-to, .fold-leave-from {
    max-height: 500px;
    opacity: 1;
  }

  .fullscreen-button {
    background: #0085dd;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    margin-right: 5px;
    text-align:center;
  }
  .fullscreen-button:hover {
    background: #006fb9;
  }
  .fullscreen-button:active {
    outline: none;
    background: #003f73;
    color: white;
  }

  /* The full-screen overlay */
  .fullscreen-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .fullscreen-content {
    background: white;
    margin: 10px;                   /* space from viewport edges */
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
    width: 90%;
    height: 90%;

    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  }

  .fullscreen-content .close-btn {
    align-self: flex-end;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    margin-bottom: 8px;
  }

  .fullscreen-content .output-block {
    flex: 1;
    overflow: hidden;
  }

  .fullscreen-content .output-block svg {
    width: 100%;
    height: 100%;
  }

  .graph-header {
    display: inline-flex;
    align-items: center;
    gap: 0.5em; /* space between button and title */
  }

  .graph-header h4{
    margin-top:20px;
  }
  .fullscreen-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .fullscreen-title {
    margin: 0;
    font-size: 1.2em;
    font-weight: 500;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5em;
    line-height: 1;
    cursor: pointer;
    padding: 4px;
  }



</style>
