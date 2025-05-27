<script setup>
  import { ref, onMounted, nextTick, onUnmounted } from "vue";

  let processorsListHandler;
  let programsListHandler;
  const showAnnotations = ref(false);

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
        <pre
          v-show="showAnnotations"
          id="performance-annotations"
          class="annotations-box"
        ></pre>
      </Transition>
    </div>
    <div class="output-block-wrapper" id="simulation-output-container">
      <div class="output-block" id="simulation-output"></div>
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

</style>
