<script setup>
  import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from "vue";

  let dispatch = ref(0);
  let retire = ref(0);
  let latencies = reactive({});
  let name = ref("");
  let ports = ref({});

  let processorsListHandler;

  let originalSettings = reactive({
    dispatch: 0,
    retire: 0,
    latencies: {},
    name: "",
  });


  onMounted(() => {
    nextTick(() => {
      const processorsList = document.getElementById("processors-list");
      if (processorsList) {
        processorsListHandler = () => {
          setTimeout(() => {
            updateProcessorSettings();
            if (typeof resetProcessor === "function") {
              resetProcessor();
            }
          }, 100); // 100 ms delay
        };
        processorsList.addEventListener("change", processorsListHandler);
      }
      updateProcessorSettings();
      if (typeof resetProcessor === "function") {
        resetProcessor();
      }

    });
  });

  onUnmounted(() => {
    const processorsList = document.getElementById("processors-list");
    if (processorsList && processorsListHandler) {
      processorsList.removeEventListener("change", processorsListHandler);
    }
  });

  const updateProcessorSettings = async () => {
    if (typeof getProcessorJSON === "function") {
      const processorSettings = await getProcessorJSON();

      dispatch.value = processorSettings.stages.dispatch;
      retire.value = processorSettings.stages.retire;
      name.value = processorSettings.name;
      ports.value = processorSettings.ports;
      Object.keys(latencies).forEach(k => delete latencies[k]);
      Object.entries(processorSettings.resources).forEach(([k, v]) => {
        latencies[k] = v;
      });

      // Store a deep copy of the original latencies
      originalSettings.dispatch = processorSettings.stages.dispatch;
      originalSettings.retire = processorSettings.stages.retire;
      originalSettings.name = processorSettings.name;
      originalSettings.latencies = JSON.parse(JSON.stringify(processorSettings.resources));
      originalSettings.ports = JSON.parse(JSON.stringify(processorSettings.ports));
    }
  };

  function getCurrentProcessorJSON() {
    return {
      name: name.value,
      stages: {
        dispatch: dispatch.value,
        retire: retire.value,
        execute: originalSettings.dispatch, // assuming `execute` isn't editable
      },
      resources: { latencies },
      ports: ports.value,
      rports: originalSettings.rports, // assuming unchanged
      cache: null,
      nBlocks: 0,
      blkSize: 8,
      mPenalty: 16,
      mIssueTime: 8
    };
  }

  const checkModifiedProcessor = computed(() => {
    if (
      dispatch.value !== originalSettings.dispatch ||
      retire.value !== originalSettings.retire ||
      name.value !== originalSettings.name
    ) {
      if (typeof setModifiedProcessor === "function") {
        setModifiedProcessor(getCurrentProcessorJSON())
      }
    }

    const currentKeys = Object.keys(latencies);
    const originalKeys = Object.keys(originalSettings.latencies);
    if (currentKeys.length !== originalKeys.length){
      if (typeof setModifiedProcessor === "function") {
        setModifiedProcessor(getCurrentProcessorJSON());
      }
    }

    for (let key of currentKeys) {
      if (latencies[key] !== originalSettings.latencies[key]) {
        if (typeof setModifiedProcessor === "function") {
          setModifiedProcessor(getCurrentProcessorJSON());
        }
      }
    }

    return false;
  });

  import { watchEffect } from "vue";

  watchEffect(() => {
    if (checkModifiedProcessor.value) {
      console.log("Processor settings have been modified.");
      // You can also trigger UI updates or enable Save buttons here
    }
  });

</script>

<template>
  <div class="main">
    <div class="header">
      <h3>Processor Settings - {{name}}</h3>

      <button class="save-button"><img src="/img/save.png"></button>
    </div>
  <br/>
    <div >
      <label class="switch">
        <input type="checkbox" checked>
        <span class="slider round"></span>

      </label> Use advanced scheduler
      <div class="widths">
        <h4>Set Widths</h4>
        <label for="dispatch-width"> Dispatch: </label>
        <input type="number" id="dispatch" name="dispatch-width" min="1" max="100" v-model="dispatch">
        <label for="retire-width"> Retire: </label>
        <input type="number" id="retire" name="retire-width" min="1" max="100" v-model="retire">
      </div>

      <h4>Set Instruction Latencies</h4>
      <div v-if="latencies" class="latencies-grid">
        <div v-for="(value, key) in latencies" :key="key" class="latency-item">
          <label :for="key">{{ key }}</label>
          <input type="number" :id="key" min="1" max="100" v-model="latencies[key]">
        </div>
      </div>

      <h4>Configure Ports</h4>
      <div v-if="ports" class="ports-grid">
        <div v-for="(units, portNum) in ports" :key="portNum" class="port-item">
          <label>Port {{ portNum }}</label>
          <ul>
            <li v-for="unit in units" :key="unit">{{ unit }}</li>
          </ul>
        </div>
      </div>
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
  .header{
    position:sticky;
    top:-5px;
    background:white;
    width:100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .switch {
    position: relative;
    display: inline-block;
    width: 30px;
    height: 17px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 17px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 13px;
    width: 13px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #2196F3;
  }

  input:checked + .slider:before {
    transform: translateX(13px);
  }
  .latencies-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    margin-top: 10px;
  }
  /* Each latency item styled as a grey box with rounded corners */
  .latency-item {
    background-color: white;
    border: 3px solid #e3e3e3;
    border-radius: 8px;
    padding: 10px;
    text-align: center;
  }
  .latency-item label {
    display: block;
    margin-bottom: 5px;
  }
  .latency-item input {
    width: 30px;
    height: 13px;
    text-align: center;
  }
  .widths input {
    width: 30px;
    height: 13px;
    text-align: center;
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }

  .save-button {
    background: #0085dd;
    color: white;
    border: none;
    padding: 4px 8px;
    font-size: 14px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    margin-right: 5px;
  }

  .save-button:hover {
    background: #006fb9;
    color: white;
  }

  .save-button:active {
    outline: none;
    background: #003f73;
    color: white;
  }

  .ports-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
}
.port-item {
  background-color: white;
  border: 3px solid #e3e3e3;
  border-radius: 8px;
  padding: 10px;
  text-align: left;
}
.port-item ul {
  margin: 5px 0 0 0;
  padding-left: 20px;
}

</style>
