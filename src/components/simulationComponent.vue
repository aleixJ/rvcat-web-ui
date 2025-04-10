<script setup>
  import { onMounted, nextTick } from "vue";
  onMounted(() => {
    nextTick(() => {
      if (typeof programShowPerfAnnotations === "function") {
        programShowPerfAnnotations();
      } else {
        console.error("performace-annotations element not found.");
      }
      if (typeof reloadRvcat === "function") {
        reloadRvcat();
      } else {
        console.error("simulation-graph element not found.");
      }

    });
  });
</script>

<template>
  <div class="main">
    <div class="header">
      <h3>Simulation</h3>
    </div>
    <div id="simulation-graph"></div>
    <form id="simulator-form">
          <label for="iterations">Number of Iterations:</label>
          <input type="number" id="num-iters" name="iterations" min="1" max="3000" value="200" >

          <label for="rob-size">ROB Size:</label>
          <input type="number" id="rob-size" name="rob-size" min="1" max="1000" value="100" >
          <div class="simulation-inline-output">
              <div class="simulation-inline-item">
                  <label for="instructions">Instructions:</label>
                  <span id="instructions-output">?</span>
              </div>
              <div class="simulation-inline-item">
                  <label for="cycles">Cycles:</label>
                  <span id="cycles-output">?</span>
              </div>
              <div class="simulation-inline-item">
                  <label for="IPC">IPC:</label>
                  <span id="IPC-output">?</span>
              </div>
              <div class="simulation-inline-item">
                  <label for="cycles-per-iteration">Cycles per iteration:</label>
                  <span id="cycles-per-iteration-output">?</span>
              </div>
          </div>
          <button id="run-simulation-button" type="button" onclick="getSchedulerAnalysis();">
              <div id="run-simulation-spinner" class="spinner-small" style="display: none;"></div>
              <div id="run-simulation-text">Run simulation</div></button>
      </form>
    <code id="performace-annotations"></code>

  </div>

</template>

<style scoped>
  .main{
    height: 100%;
    width: 100%;
    background: white;
    overflow: auto;
    padding: 5px;
    border-radius: 10px;
    position: relative;
  }
  h3 {
    margin: 0;
  }
  .header{
    position:sticky;
    top:-5px;
    background:white;
    width:100%;
  }
  .simulation-graph{
    display:block;
    width:70%;
    margin:auto;
  }
  .spinner-small {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #868686;
    border-radius: 50%;
    width: 15px;
    height: 15px;
    animation: spin 1s linear infinite;
    margin: auto;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
