<script setup>
  import { onMounted, nextTick } from "vue";
  onMounted(() => {
    nextTick(() => {
      if (typeof showFullProcessor === "function") {
        showFullProcessor();
      } else {
        console.error("simulation-graph element not found.");
      }
    });
  });
</script>

<template>
  <div class="main">
    <h3>Simulation</h3>

    <div id="simulation-graph">

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
  h3 {
  margin: 0;
  }
</style>
