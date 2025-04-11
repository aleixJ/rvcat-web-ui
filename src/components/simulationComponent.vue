<script setup>
  import { onMounted, nextTick } from "vue";
  onMounted(() => {
    nextTick(() => {

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
      <div class="iters-run">
        <div class="iterations-config">
          <label for="iterations"> Iterations:</label>
          <input type="number" id="num-iters" name="iterations" min="1" max="3000" value="200" >
        </div>

        <div id="run-simulation-button">
          <button id="run-button" class="run-button" onclick="getSchedulerAnalysis();"><img src="/img/run.png"></button>
          <div id="run-simulation-spinner" class="spinner-small" style="display: none;"></div>
        </div>
      </div>
    </div>
    <div class="content">
      <div id="simulation-graph"></div>
      <div id="simulation-results-info">
        <div class="simulation-inline-output">
            <div class="simulation-inline-item">
                <label for="instructions"><b>Instructions: </b></label>
                <span id="instructions-output">?</span>
            </div>
            <div class="simulation-inline-item">
                <label for="cycles"><b>Cycles: </b></label>
                <span id="cycles-output">?</span>
            </div>
            <div class="simulation-inline-item">
                <label for="IPC"><b>IPC: </b></label>
                <span id="IPC-output">?</span>
            </div>
            <div class="simulation-inline-item">
                <label for="cycles-per-iteration"><b>Cycles per iteration: </b></label>
                <span id="cycles-per-iteration-output">?</span>
            </div>
        </div>
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
    top:-5px;
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
    justify-content: left;
    align-items: center;
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
</style>
