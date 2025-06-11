<script setup>
  import { onMounted, nextTick, ref, watch } from "vue";

  function getCookie(name) {
    const re = new RegExp(
      "(?:^|; )" +
        name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") +
        "=([^;]*)"
    );
    const match = document.cookie.match(re);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days = 30) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; max-age=${maxAge}; path=/`;
  }

  const iterations = ref(parseInt(getCookie("simulationIterations")) || 200);
  watch(iterations, (v) => setCookie("simulationIterations", v));


  onMounted(() => {
    nextTick(() => {

      if (typeof reloadRvcat === "function") {
        reloadRvcat();
      } else {
        console.error("simulation-graph element not found.");
      }

    });
  });

  function changeIterations(delta) {
    const min = 1;
    const max = 3000;
    let v = iterations.value + delta;
    if (v < min) v = min;
    if (v > max) v = max;
    iterations.value = v;
  }
</script>

<template>
  <div class="main">
    <div class="header">
      <h3>Simulation</h3>
      <div class="iters-run">
        <div class="iterations-group">
          Iterations:
          <button type="button" class="iterations-btn" @click="changeIterations(-1)">−</button>
          <input type="number" id="num-iters" class="iterations-input" name="iterations" min="1" max="3000" v-model.number="iterations">
          <button type="button" class="iterations-btn" @click="changeIterations(1)">+</button>
        </div>
        <div id="run-simulation-button">
          <button id="run-button" class="blue-button" onclick="getSchedulerAnalysis();">Run</button>
          <div id="run-simulation-spinner" class="spinner-small" style="display: none;"></div>
        </div>
      </div>
    </div>

    <!-- Move this section here -->
    <div id="simulation-results-info" class="results-info">
      <div class="row">
        <div class="simulation-inline-item">
          <label for="instructions"><b>Instructions:</b></label>
          <span id="instructions-output">?</span>
        </div>
        <div class="simulation-inline-item">
          <label for="cycles"><b>Cycles:</b></label>
          <span id="cycles-output">?</span>
        </div>
      </div>
      <div class="row">
        <div class="simulation-inline-item">
          <label for="cycles-per-iteration"><b>Cycles per iteration:</b></label>
          <span id="cycles-per-iteration-output">?</span>
        </div>
        <div class="simulation-inline-item">
          <label for="IPC"><b>IPC:</b></label>
          <span id="IPC-output">?</span>
        </div>
      </div>
    </div>
    <div class="sim-running-msg">
      <div id="simulation-running"><p>Simulation on course...</p></div>
    </div>

    <div id="graph-section" class="graph-section" style="display: none;">
        <h4>Processor Bottlenecks</h4>
        <div id="simulation-graph" class="simulation-img"></div>
    </div>
    <div id="critical-path-section" class="critical-path-section" style="display: none;">
      <h4>Critical Execution Path</h4>
      <div id="critical-path">

      </div>
    </div>

    <div class="scale-container">
      <div class="color-scale"></div>
      <div class="scale-labels">
        <span>Underutilized</span>
        <span></span>
        <span>Saturated</span>
      </div>
    </div>
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
  #run-button{
    display:block;
    cursor:pointer;
    left: 3px;
  }
  h3 {
    margin: 0;
  }
  h4 {
    text-align: center;
    width: 100%;
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
  .iters-run{
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap:5px;
  }
  #num-iters{
    width:45px;
  }
  .graph-section{
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .sim-running-msg {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
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

  .scale-container {
    width: 50%;
    margin: 0 auto;
    margin-top: 2%;
    text-align: center;
    display:block;
  }

  .color-scale {
    width: 100%;
    height: 10px;
    background: linear-gradient(to right, white, #6bff6b, #ffc400, #ce0000);
    border-radius: 5px;
    border: 1px solid black;
    position: relative;
  }

/* Optional labels for the scale */
  .scale-labels {
    width:100%;
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 2.75vh;
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

  .results-info {
    width: 100%;
    margin-top: 10px;
    font-family: Arial, sans-serif;
  }

  .results-info .row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 5px;
  }

  .simulation-inline-item {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 10px;
    background: #f0f0f0;
    border-radius: 6px;
  }

  .simulation-inline-item label {
    flex: 1;
    margin-right: 10px;
  }

  .simulation-inline-item span {
    text-align: right;
    flex-shrink: 0;
    min-width: 60px;
  }

  .critical-path-section{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50%;
    max-width: 80%;
    margin: 0 auto;
    gap: 5px;
  }
</style>
