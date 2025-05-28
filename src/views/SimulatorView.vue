<script setup>
import { ref, shallowRef, onMounted, nextTick } from 'vue';
import headerComponent from '@/components/headerComponent.vue';
import loadingComponent from '@/components/loadingComponent.vue';
import processorComponent from '@/components/processorComponent.vue';
import programComponent from '@/components/programComponent.vue';
import timelineComponent from '@/components/timelineComponent.vue';
import aboutComponent from '@/components/aboutComponent.vue';
import staticAnalysisComponent from '@/components/staticAnalysisComponent.vue';
import procSettingsComponent from '@/components/procSettingsComponent.vue';
import simulationComponent from '@/components/simulationComponent.vue';

// Modal & navigation state
const showLeaveModal    = ref(false);
const pendingKey        = ref(null);
const settingsCompInst  = ref(null);

// Map of component keys -> component definitions
const components = {
  timelineComponent,
  staticAnalysisComponent,
  aboutComponent,
  simulationComponent,
  procSettingsComponent
};

// Current view key & component
const currentKey       = ref('simulationComponent');
const currentComponent = shallowRef(components[currentKey.value]);

// Handle requests from header
function onRequestSwitch(key) {
  const nextComp = components[key];
  if (
    currentKey.value === 'procSettingsComponent' &&
    settingsCompInst.value?.canLeave?.()
  ) {
    pendingKey.value   = key;
    showLeaveModal.value = true;
  } else {
    currentKey.value       = key;
    currentComponent.value = nextComp;
  }
}

// Confirm or cancel navigation
function confirmLeave() {
  showLeaveModal.value = false;
  if (pendingKey.value) {
    currentKey.value       = pendingKey.value;
    currentComponent.value = components[pendingKey.value];
    pendingKey.value       = null;
  }
}
function cancelLeave() {
  showLeaveModal.value = false;
  pendingKey.value       = null;
}

onMounted(() => {
  nextTick(() => {
    if (typeof openLoadingOverlay === 'function') openLoadingOverlay();
    if (typeof initPyodide === 'function') initPyodide();
  });
});
</script>

<template>
  <body>
    <header>
      <headerComponent
        :activeView="currentKey"
        @requestSwitch="onRequestSwitch"
      />
    </header>

    <loadingComponent />

    <main class="container">
      <div class="grid-item processor">
        <processorComponent />
      </div>
      <div class="grid-item program">
        <programComponent />
      </div>
      <div class="grid-item results">
        <component
          :is="currentComponent"
          v-if="currentComponent"
          ref="settingsCompInst"
        />
        <div v-else>Component not found</div>
      </div>

      <div v-if="showLeaveModal" class="modal-overlay">
        <div class="modal">
          <p>
            Your processor settings have been modified. They will not be saved if
            you leave this page without applying your changes.
          </p>
          <p><b>Do you want to continue?</b></p>
          <div class="modal-actions">
            <button @click="confirmLeave" class="save-button">OK</button>
            <button @click="cancelLeave" class="save-button">Cancel</button>
          </div>
        </div>
      </div>
    </main>
  </body>
</template>



<style scoped>
.container {
  display: grid;
  grid-template-columns: 35% 64%;
  grid-auto-rows: 50%;
  width: 100vw;
  height: 95vh;
  grid-gap: 2vh;
  background: #e3e3e3;
  overflow: hidden;
  box-sizing: border-box;
}
.grid-item {
  position: relative;
  background: white;
  border-radius: 10px;
}
.processor { grid-column: 1; grid-row: 1; }
.program   { grid-column: 1; grid-row: 2; }
.results   { grid-column: 2; grid-row: 1 / 3; width: 99%; max-width: 99%; padding-bottom: 25px; }

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal         {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  position: relative;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.save-button   {
  background: #0085dd;
  color: white;
  border: none;
  padding: 4px 8px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  margin-right: 5px;
  text-align: center; }
.save-button:hover {
  background: #006fb9;
}
.save-button:active {
  background: #003f73;
}

</style>
