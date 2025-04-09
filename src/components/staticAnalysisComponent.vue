<script setup>
  import { onMounted, nextTick } from "vue";
  onMounted(() => {
    nextTick(() => {
      if (typeof showCriticalPathsGraph === "function") {
        showCriticalPathsGraph();
      } else {
        console.error("simulation-output element not found.");
      }
    });
  });
</script>

<template>
  <div class="main">
    <div class="header">
      <h3>Static Analysis</h3>
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
