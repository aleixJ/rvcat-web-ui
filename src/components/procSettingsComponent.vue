<script setup>
  import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from "vue";

  let dispatch = ref(0);
  let retire = ref(0);
  let resources = reactive({});
  let name = ref("");
  let ports = ref({});
  let availableInstructions = [];
  let portDropdownOpen = ref({});

  let processorsListHandler;

  let originalSettings = reactive({
    dispatch: 0,
    retire: 0,
    resources: {},
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
      Object.keys(resources).forEach(k => delete resources[k]);
      Object.entries(processorSettings.resources).forEach(([k, v]) => {
        resources[k] = v;
      });
      availableInstructions  = Object.keys(resources);

      // Store a deep copy of the original resources
      originalSettings.dispatch = processorSettings.stages.dispatch;
      originalSettings.retire = processorSettings.stages.retire;
      originalSettings.name = processorSettings.name;
      originalSettings.resources = JSON.parse(JSON.stringify(processorSettings.resources));
      originalSettings.ports = JSON.parse(JSON.stringify(processorSettings.ports));
    }
  };

  function getCurrentProcessorJSON() {
    return {
      name: name.value,
      stages: {
        dispatch: dispatch.value,
        retire: retire.value,
        execute: originalSettings.dispatch,
      },
      resources: resources,
      ports: ports.value,
      rports: originalSettings.rports,
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

    const currentKeys = Object.keys(resources);
    const originalKeys = Object.keys(originalSettings.resources);
    if (currentKeys.length !== originalKeys.length){
      if (typeof setModifiedProcessor === "function") {
        setModifiedProcessor(getCurrentProcessorJSON());
      }
    }

    for (let key of currentKeys) {
      if (resources[key] !== originalSettings.resources[key]) {
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

  function togglePortInstruction(portNum, instruction, isChecked) {
    if (!ports.value[portNum]) {
      ports.value[portNum] = [];
    }
    if (isChecked) {
      if (!ports.value[portNum].includes(instruction)) {
        ports.value[portNum].push(instruction);
      }
    } else {
      ports.value[portNum] = ports.value[portNum].filter(i => i !== instruction);
    }
  }

  function toggleDropdown(portNum) {
    portDropdownOpen.value[portNum] = !portDropdownOpen.value[portNum];
  }

  function downloadProcessorConfig() {
    const data = getCurrentProcessorJSON();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.name || "processor-config"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function uploadProcessorConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validate and apply config
        if (data && typeof data === 'object') {
          dispatch.value = data.stages?.dispatch ?? dispatch.value;
          retire.value = data.stages?.retire ?? retire.value;
          name.value = data.name ?? name.value;

          // Replace latencies
          Object.keys(latencies).forEach(k => delete latencies[k]);
          Object.entries(data.resources || {}).forEach(([k, v]) => {
            latencies[k] = v;
          });

          ports.value = data.ports ?? {};
          originalSettings.dispatch = data.stages?.dispatch ?? 0;
          originalSettings.retire = data.stages?.retire ?? 0;
          originalSettings.name = data.name ?? "";
          originalSettings.latencies = JSON.parse(JSON.stringify(data.resources || {}));
          originalSettings.ports = JSON.parse(JSON.stringify(data.ports || {}));
          originalSettings.rports = JSON.parse(JSON.stringify(data.rports || {}));
        }
      } catch (err) {
        console.error("Invalid JSON:", err);
        alert("Failed to load processor config. Please check the file.");
      }
    };

    reader.readAsText(file);
  }



</script>

<template>
  <div class="main">
    <div class="header">
      <h3>Processor Settings - {{name}}</h3>
      <div>
        <label class="save-button" style="cursor:pointer;">
          Upload
          <input type="file" accept=".json" @change="uploadProcessorConfig" style="display: none;">
        </label>
        <button class="save-button" @click="downloadProcessorConfig">
          Download
        </button>
      </div>
    </div>
  <br/>
    <div >
      <label class="switch">
        <input type="checkbox" checked>
        <span class="slider round"></span>

      </label> Use advanced scheduler
      <div class="widths">
        <h4>Set Stage Widths</h4>
        <label for="dispatch-width"> Dispatch: </label>
        <input type="number" id="dispatch" name="dispatch-width" min="1" max="100" v-model="dispatch">
        <label for="retire-width"> Retire: </label>
        <input type="number" id="retire" name="retire-width" min="1" max="100" v-model="retire">
      </div>

      <h4>Set Instruction Latencies</h4>
      <div v-if="resources" class="resources-grid">
        <div v-for="(value, key) in resources" :key="key" class="latency-item">
          <label :for="key">{{ key }}</label>
          <input type="number" :id="key" min="1" max="100" v-model="resources[key]">
        </div>
      </div>

      <h4>Configure Ports</h4>
      <div v-if="ports" class="ports-grid">
        <div v-for="(units, portNum) in ports" :key="portNum" class="port-item">
          <div class="port-header">
            <label><b>Port {{ portNum }}</b></label>
            <button @click="toggleDropdown(portNum)" class="arrow-button">
              <img
                :src="portDropdownOpen[portNum] ? 'img/hide.png' : 'img/show.png'"
                alt="toggle"
                class="toggle-icon"
              />
            </button>
          </div>

          <div>
            <div v-if="portDropdownOpen[portNum]" class="dropdown-panel">
              <div
                v-for="instruction in availableInstructions"
                :key="instruction"
                class="checkbox-item"
              >
                <label>
                  <input
                    type="checkbox"
                    :checked="ports[portNum]?.includes(instruction)"
                    @change="togglePortInstruction(portNum, instruction, $event.target.checked)"
                  />
                  {{ instruction }}
                </label>
              </div>
            </div>

            <p v-if="!portDropdownOpen[portNum]"><strong>Selected:</strong> {{ ports[portNum]?.join(', ') || 'None' }}</p>
          </div>

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
  .port-header{
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
  .resources-grid {
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

  .arrow-button {
    background: #c5c5c5;
    border: none;
    padding: 4px 8px;
    font-size: 14px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    margin-right: 5px;
  }

  .arrow-button:hover {
    background: #b1b1b1;
  }

  .arrow-button:active {
    outline: none;
    background: #8d8c8c;
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
