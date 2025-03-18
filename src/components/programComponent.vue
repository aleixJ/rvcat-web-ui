<template>
  <div class="program_info">
    <h3>Simulation</h3>
      <form id="simulator-form">
          <label for="programs-list">Program:</label>
          <select id="programs-list" name="assembly-code" onchange="reloadRvcat();">
              <!-- <option value="loop1">Loop 1</option> -->
          </select>



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
    <section class="main-box code-block">
      <h3>Program and performance annotations</h3>
        <pre>
          <code id="rvcat-asm-code">LOADING</code>
        </pre>
    </section>
  </div>

</template>

<style scoped>
.program_info{
  height:100%;
  width:100%;
  background: white;
  overflow:auto;
  padding:5px;
  border-radius: 10px;
}

h3 {
  margin: 0;
}
</style>
