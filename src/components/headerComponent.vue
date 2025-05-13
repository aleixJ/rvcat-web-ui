<script setup>
import { ref } from "vue";

const activeComponent = ref("timelineComponent");

const switchComponent = (component) => {
  activeComponent.value = component;
};

</script>

<template>
  <div id="top">
    <div>
      <h1>RVCAT-Web</h1>
    </div>
    <nav>
      <ul>
        <li>
          <button class="tab-button"
          :class="{ active: activeComponent === 'procSettingsComponent' }"
          @click="$emit('switchComponent','procSettingsComponent'); switchComponent('procSettingsComponent');">
          Settings
          </button>
        </li>
        <li>
          <button
            class="tab-button"
            :class="{ active: activeComponent === 'staticAnalysisComponent' }"
            @click="$emit('switchComponent', 'staticAnalysisComponent'); switchComponent('staticAnalysisComponent');">
            Static Analysis
          </button>
        </li>
        <li>
          <button
            class="tab-button"
            :class="{ active: activeComponent === 'simulationComponent' }"
            @click="$emit('switchComponent', 'simulationComponent'); switchComponent('simulationComponent');">
            Simulation
          </button>
        </li>
        <li>
          <button
            class="tab-button"
            :class="{ active: activeComponent === 'timelineComponent' }"
            @click="$emit('switchComponent', 'timelineComponent'); switchComponent('timelineComponent');">
            Timeline
          </button>
        </li>
        <li>
          <button
            class="tab-button"
            :class="{ active: activeComponent === 'aboutComponent' }"
            @click="$emit('switchComponent', 'aboutComponent'); switchComponent('aboutComponent');">
            About
          </button>
        </li>

      </ul>
    </nav>
  </div>
</template>

<style scoped>
#top {
  height: 5vh;
  max-height: 40px;
  width: 100vw;
  padding: 0.6%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #007acc;
  color: white;
  padding: 15px 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

h1 {
  margin: 0;
  font-size: 20px;
}

nav {
  display: flex;
  align-items: center;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
}

ul li {
  margin: 0 5px;
}

/* Improved button styling */
.tab-button {
  background: #0085dd;
  color: white;
  border: none;
  padding: 4px 8px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.tab-button:hover {
  background: #006fb9;
  color: white;
}

.tab-button.active {
  outline: none;
  background: #003f73;
  color: white;
}
</style>
