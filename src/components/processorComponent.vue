<template>
  <div class="pipeline-display">
    <div class="pipeline-header">
      <h3>Processor Pipeline</h3>
      <select id="processors-list" name="processor-name" onchange="reloadRvcat();">
        <!-- <option value="model1">Model 1</option> -->
      </select>
    </div>

    <div class="processor-info">
      <div class="pipeline-img" id="pipeline-graph"></div>
      <table>
        <thead>
          <tr>
            <th>Port Number</th>
            <th>Supported Instructions</th>
          </tr>
        </thead>
        <tbody id="processor-info-table-body"></tbody>
      </table>
    </div>

    <div class="scale-container">
      <div class="color-scale"></div>
    </div>
  </div>
</template>

<style scoped>
.pipeline-display {
  height: 100%;
  width: 100%;
  background: white;
  overflow: auto;
  padding: 5px;
  border-radius: 10px;
  position: relative;
}

/* Header Flexbox */
.pipeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

h3 {
  margin: 0;
}

table{
  display:none;
}
.scale-container {
  display: flex;
  justify-content: center; /* Center horizontally */
}
.color-scale {
  width: 30%;
  height: 10px;
  background: linear-gradient(to right, #00FF00, #FFFF00, #FF0000);
  border-radius: 5px;
  position: relative;
}
</style>
