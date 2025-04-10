<script setup>
import { shallowRef, onMounted, nextTick } from "vue";
import headerComponent from '@/components/headerComponent.vue';
import loadingComponent from '@/components/loadingComponent.vue';
import processorComponent from '@/components/processorComponent.vue';
import programComponent from '@/components/programComponent.vue';
import timelineComponent from '@/components/timelineComponent.vue';
import aboutComponent from '@/components/aboutComponent.vue';
import staticAnalysisComponent from '@/components/staticAnalysisComponent.vue';
import procSettingsComponent from '@/components/procSettingsComponent.vue';
import simulationComponent from '@/components/simulationComponent.vue';

// List of available components.
const components = {
  timelineComponent,
  staticAnalysisComponent,
  aboutComponent,
  simulationComponent,
  procSettingsComponent
};

// Initially show timelineComponent.
const currentComponent = shallowRef(timelineComponent);

// Function to switch components from header
const switchComponent = (component) => {
  currentComponent.value = components[component];
};

onMounted(() => {
  nextTick(() => {
    if (typeof openLoadingOverlay === "function") {
      openLoadingOverlay();
    } else {
      console.error("loading-overlay element not found.");
    }
    if (typeof initPyodide === "function") {
      initPyodide();
    } else {
      console.error("initPyodide is not defined.");
    }
  });
});
</script>

<template>
  <body>
    <header>
      <headerComponent @switchComponent="switchComponent" />
    </header>
    <loadingComponent />

    <main class="container">
      <!-- Processor Pipeline -->
      <div class="grid-item processor">
        <!-- Listen to changeProcessor event from processorComponent -->
        <processorComponent @switchComponent="switchComponent"/>
      </div>
      <div class="grid-item program">
        <programComponent />
      </div>
      <div class="grid-item results">
        <!-- Attach ref to dynamic component -->
        <component
          :is="currentComponent"
          v-if="currentComponent"
        />
        <div v-else>Component not found</div>
      </div>
    </main>
  </body>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-columns: 1.5fr 2fr;
  grid-auto-rows: 50%;
  width: 100vw;
  height: 95vh;
  grid-gap: 2vh;
  background: #e3e3e3;
  overflow: hidden;
  box-sizing: border-box;
}
.grid-item {
  position:relative;
  background: white;
  border-radius: 10px;
}
.processor {
  grid-column: 1;
  grid-row: 1;
}
.program {
  grid-column: 1;
  grid-row: 2;
}
.results {
  grid-column: 2;
  grid-row: 1 / 3; /* Span both rows */
  width:99%;
  max-width:99%;
}
</style>
