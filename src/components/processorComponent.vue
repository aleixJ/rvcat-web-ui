<template>
  <div class="pipeline-display">
    <div class="pipeline-header">
      <h3>Processor Pipeline</h3>
      <div id="settings-div">
        <button id="download-button" class="processor-button"><img src="/img/down.png"></button>
        <button id="upload-button" class="processor-button"><img src="/img/up.png"></button>
        <button id="settings-button" class="processor-button" @click="$emit('switchComponent','procSettingsComponent');"><img src="/img/settings.png"></button>

        <select id="processors-list" name="processor-name" onchange="reloadRvcat();">
        <!-- <option value="model1">Model 1</option> -->
        </select>
        <div>
          <label for="rob-size"> ROB Size:</label>
          <input type="number" id="rob-size" name="rob-size" min="1" max="1000" value="100" >
        </div>
      </div>

    </div>

    <div class="processor-info">
      <div class="pipeline-img" id="pipeline-graph"></div>
    </div>
  </div>
</template>

<style scoped>
.pipeline-display {
  height: 100%;
  width: 100%;
  background: white;
  overflow: hidden;
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

.processor-info {
  display: flex;
  justify-content: center;
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
#settings-div{
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}
.processor-button {
  background: #0085dd;
  color: white;
  border: none;
  padding: 4px 8px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.processor-button:hover {
  background: #006fb9;
  color: white;
}

.processor-button:active {
  outline: none;
  background: #003f73;
  color: white;
}
</style>
