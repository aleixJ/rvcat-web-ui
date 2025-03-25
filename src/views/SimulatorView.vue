<script setup>
  import headerComponent from '@/components/headerComponent.vue';
  import loadingComponent from '@/components/loadingComponent.vue';
  import processorComponent from '@/components/processorComponent.vue';
  import programComponent from '@/components/programComponent.vue';
  import timelineComponent from '@/components/timelineComponent.vue';
  import aboutComponent from '@/components/aboutComponent.vue';
  import staticAnalysisComponent from '@/components/staticAnalysisComponent.vue';

  import { shallowRef, onMounted, nextTick } from "vue";

  const components = {
  timelineComponent,
  staticAnalysisComponent,
  aboutComponent
};

  const currentComponent = shallowRef(timelineComponent);

  // Function to switch components
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
              <processorComponent />
           </div>
           <div class="grid-item program">
              <programComponent />
           </div>
           <div class="grid-item results">
            <component :is="currentComponent" />
           </div>

      </main>

      <!-- Output Section -->


      <footer>
          <p>The RVCAT developers © 2024</p>
      </footer>


  </body>
</template>

<style scoped>
.container{
  margin:0.5vh;
  display:grid;
  grid-template-columns:1.5fr 2fr;
  grid-auto-rows:50%;
  width:100vf;
  height:95vh;
  grid-gap:2vh;
  background:#e3e3e3;
  overflow:hidden;
  box-sizing: border-box;
}
.grid_item{
  background: white;
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
}

</style>



