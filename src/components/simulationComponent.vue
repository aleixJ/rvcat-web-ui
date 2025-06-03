<script setup>
  import { onMounted, nextTick, ref } from "vue";

  const iterations = ref(200);

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
          <button id="run-button" class="run-button" onclick="getSchedulerAnalysis();">Run</button>
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

    <div class="content">
      <div id="simulation-running" style="display: none;"><p>Simulation on course...</p></div>
      <div id="simulation-graph" class="simulation-img" style="display: none"></div>
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
  .content{
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 10%;
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

  .run-button {
    background: #0085dd;
    color: white;
    border: none;
    padding: 4px 8px;
    font-size: 14px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
  }

  .run-button:hover {
    background: #006fb9;
    color: white;
  }

  .run-button:active {
    outline: none;
    background: #003f73;
    color: white;
  }
  .scale-container {
    width: 30%;
    margin: 0 auto;
    margin-top: 2%;
    text-align: center;
    display:block;
  }


  .color-scale {
    width: 100%;
    height: 10px;
    background: linear-gradient(to right, #00FF00, #FFFF00, #FF0000);
    border-radius: 5px;
    position: relative;
  }

/* Optional labels for the scale */
  .scale-labels {
    width:100%;
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 16px;
    font-family: Arial, sans-serif;
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

</style>
