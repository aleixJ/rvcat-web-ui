<template>
  <div class="main">
    <h3>Simulation Results</h3>
        <div class="tabs">
            <button class="tab-button" id="dependencies-output" onclick="showDependenciesGraph();">Dependencies</button>
            <button class="tab-button" id="critical-paths-output" onclick="showCriticalPathsGraph();">Recurrent paths</button>
            <button class="tab-button" id="timeline-output" onclick="getTimeline();">Timeline</button>
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
</style>
