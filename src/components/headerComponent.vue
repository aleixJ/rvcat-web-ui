<script setup>
// Props
const props = defineProps({
  activeView: {
    type: String,
    required: true
  }
});
// Emitted event
const emit = defineEmits([ 'requestSwitch' ]);
</script>

<template>
  <div id="top">
    <div class="header-title">
      <img src="/img/favicon.png" class="title-img">
      <h1>RVCAT-WEB</h1>
    </div>
    <nav>
      <ul>
        <li>
          <button
            class="blue-button"
            :class="{ active: activeView === 'simulationComponent' }"
            @click="emit('requestSwitch', 'simulationComponent')"
          >
            Simulation
          </button>
        </li>
        <li>
          <button
            class="blue-button"
            :class="{ active: activeView === 'staticAnalysisComponent' }"
            @click="emit('requestSwitch', 'staticAnalysisComponent')"
          >
            Static Analysis
          </button>
        </li>
        <li>
          <button
            class="blue-button"
            :class="{ active: activeView === 'timelineComponent' }"
            @click="emit('requestSwitch', 'timelineComponent')"
          >
            Timeline
          </button>
        </li>
        <li>
          <button
            class="blue-button"
            :class="{ active: activeView === 'comparisonComponent' }"
            @click="emit('requestSwitch', 'comparisonComponent')"
          >
            Comparison
          </button>
        </li>
        <li>
          <button
            class="blue-button"
            :class="{ active: activeView === 'programEditorComponent' }"
            @click="emit('requestSwitch', 'programEditorComponent')"
          >
            Program
          </button>
        </li>
        <li>
          <button
            class="blue-button"
            :class="{ active: activeView === 'procSettingsComponent' }"
            @click="emit('requestSwitch', 'procSettingsComponent')"
          >
            Settings
          </button>
        </li>
        <li>
          <button
            class="blue-button"
            :class="{ active: activeView === 'aboutComponent' }"
            @click="emit('requestSwitch', 'aboutComponent')"
          >
            About
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
#top {
  width: 100vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #007acc;
  color: white;
  padding: 12px 25px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  min-height: 60px;
}

h1 {
  margin: 0;
  font-size: 32px;
}

nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
}
nav ul li {
  margin: 0 5px;
}
.title-img {
  height: 40px;
}
.header-title {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
