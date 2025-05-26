<script setup>
  import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";

  // --- existing reactive state ---
  const dispatch = ref(0);
  const retire = ref(0);
  const resources = reactive({});
  const name = ref("");
  const ports = ref({});
  const portDropdownOpen = reactive({});
  const availableInstructions = computed(() => Object.keys(resources));
  const portList = computed(() => Object.keys(ports.value));

  let processorsListHandler;
  let lastRequestId = 0;

  const originalSettings = reactive({
    dispatch: 0,
    retire: 0,
    resources: {},
    name: "",
    ports: {},
    rports: {},
    cache: null,
    nBlocks: 0,
    blkSize: 0,
    mPenalty: 0,
    mIssueTime: 0,
  });

  // --- modal state ---
  const showModal = ref(false);
  const modalName = ref("");
  const modalDownload = ref(true);
  const nameError = ref("");

  // --- load & update processor settings ---
  const updateProcessorSettings = async () => {
    const thisId = ++lastRequestId;
    if (typeof getProcessorJSON !== "function") return;
    try {
      const cfg = await getProcessorJSON();
      if (thisId !== lastRequestId) return;

      dispatch.value = cfg.stages.dispatch;
      retire.value = cfg.stages.retire;
      name.value = cfg.name;
      ports.value = cfg.ports || {};

      // refresh resources
      Object.keys(resources).forEach(k => delete resources[k]);
      Object.entries(cfg.resources || {}).forEach(([k,v]) => {
        resources[k] = v;
      });

      // stash original
      Object.assign(originalSettings, {
        dispatch: cfg.stages.dispatch,
        retire: cfg.stages.retire,
        name: cfg.name,
        resources: JSON.parse(JSON.stringify(cfg.resources || {})),
        ports: JSON.parse(JSON.stringify(cfg.ports || {})),
        rports: JSON.parse(JSON.stringify(cfg.rports || {})),
        cache: cfg.cache,
        nBlocks: cfg.nBlocks,
        blkSize: cfg.blkSize,
        mPenalty: cfg.mPenalty,
        mIssueTime: cfg.mIssueTime,
      });
    } catch(e) {
      console.error("Failed to load processor JSON:", e);
    }
  };

  onMounted(() => {
    nextTick(() => {
      const list = document.getElementById("processors-list");
      if (list) {
        processorsListHandler = () => updateProcessorSettings();
        list.addEventListener("change", processorsListHandler);
      }
      updateProcessorSettings();
    });
  });
  onUnmounted(() => {
    const list = document.getElementById("processors-list");
    if (list && processorsListHandler) {
      list.removeEventListener("change", processorsListHandler);
    }
  });

  // --- helpers for JSON ---
  function getCurrentProcessorJSON() {
    return {
      name: modalName.value,
      stages: {
        dispatch: dispatch.value,
        retire: retire.value,
        execute: originalSettings.dispatch,
      },
      resources: { ...resources },
      ports: ports.value,
      rports: originalSettings.rports,
      cache: originalSettings.cache,
      nBlocks: originalSettings.nBlocks,
      blkSize: originalSettings.blkSize,
      mPenalty: originalSettings.mPenalty,
      mIssueTime: originalSettings.mIssueTime,
    };
  }

  // --- modal controls ---
  function openModal() {
    modalName.value = name.value + "*";
    modalDownload.value = true;
    nameError.value = "";
    showModal.value = true;
  }
  function closeModal() {
    showModal.value = false;
  }
  function confirmModal() {
    const list = document.getElementById("processors-list");
    if (list) {
      for (const opt of list.options) {
        if (opt.value === modalName.value && opt.value !== name.value) {
          nameError.value = "Name already exists. Choose another.";
          return;
        }
      }
    }
    const data = getCurrentProcessorJSON();
    saveModifiedProcessor(data);
    if (modalDownload.value) {
      const blob = new Blob([JSON.stringify(data, null,2)], { type:"application/json" });
      const url  = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${modalName.value}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    name.value = modalName.value;
    showModal.value = false;
  }

  // --- existing functions ---
  function togglePortInstruction(portNum, instruction, isChecked) {
    if (!ports.value[portNum]) ports.value[portNum] = [];
    if (isChecked) {
      if (!ports.value[portNum].includes(instruction))
        ports.value[portNum].push(instruction);
    } else {
      ports.value[portNum] =
        ports.value[portNum].filter(i => i !== instruction);
    }
  }
  function toggleDropdown(portNum) {
    portDropdownOpen[portNum] = !portDropdownOpen[portNum];
  }
  function downloadProcessorConfig() {
    const data = {
      name: name.value,
      stages: {
        dispatch: dispatch.value,
        retire: retire.value,
        execute: originalSettings.dispatch,
      },
      resources: { ...resources },
      ports: ports.value,
      rports: originalSettings.rports,
      cache: originalSettings.cache,
      nBlocks: originalSettings.nBlocks,
      blkSize: originalSettings.blkSize,
      mPenalty: originalSettings.mPenalty,
      mIssueTime: originalSettings.mIssueTime,
    };
    const blob = new Blob([JSON.stringify(data, null,2)],{type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name.value || "processor-config"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function uploadProcessorConfig(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        dispatch.value = data.stages?.dispatch ?? dispatch.value;
        retire.value   = data.stages?.retire   ?? retire.value;
        name.value     = data.name             ?? name.value;
        Object.keys(resources).forEach(k=>delete resources[k]);
        Object.entries(data.resources||{}).forEach(([k,v])=>{resources[k]=v});
        ports.value = data.ports || {};
        Object.assign(originalSettings, {
          dispatch: data.stages?.dispatch ?? 0,
          retire:   data.stages?.retire   ?? 0,
          name:     data.name             ?? "",
          resources: JSON.parse(JSON.stringify(data.resources||{})),
          ports:     JSON.parse(JSON.stringify(data.ports||{})),
          rports:    JSON.parse(JSON.stringify(data.rports||{})),
          cache:    data.cache,
          nBlocks:  data.nBlocks,
          blkSize:  data.blkSize,
          mPenalty: data.mPenalty,
          mIssueTime: data.mIssueTime,
        });
      } catch(err) {
        console.error("Invalid JSON:", err);
        alert("Failed to load processor config. Please check the file.");
      }
    };
    reader.readAsText(file);
  }
  function increaseLatency(key) {
    if (resources[key] < 100) resources[key]++;
  }
  function decreaseLatency(key) {
    if (resources[key] > 1) resources[key]--;
  }
</script>

<template>
  <div class="main">
    <div class="header">
      <h3>Processor Settings - {{ name }}</h3>
      <div>
        <button class="save-button" @click="openModal">
          Apply
        </button>
        <label class="save-button" style="cursor:pointer;">
          Upload
          <input
            type="file"
            accept=".json"
            @change="uploadProcessorConfig"
            style="display: none;"
          />
        </label>
        <button class="save-button" @click="downloadProcessorConfig">
          Download
        </button>
      </div>
    </div>
    <br/>
    <div>
      <div class="widths">
        <h4>Set Stage Widths</h4>
        <label for="dispatch-width"> Dispatch: </label>
        <input type="number" id="dispatch" name="dispatch-width" min="1" max="100" v-model="dispatch"/>
        <label for="retire-width"> Retire: </label>
        <input type="number" id="retire" name="retire-width" min="1" max="100" v-model="retire"/>
      </div>

      <h4>Instruction Latencies & Execution Ports</h4>
      <table class="instr-table" v-if="availableInstructions.length">
        <thead>
          <tr>
            <th>TYPE</th>
            <th>LATENCY</th>
            <th>EXECUTION PORTS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="instr in availableInstructions" :key="instr">
            <td>{{ instr }}</td>
            <td>
              <input type="number" min="1" max="100" v-model.number="resources[instr]"/>
            </td>
            <td>
              <span v-for="portNum in portList" :key="portNum" class="port-checkbox">
                <label>
                  <input type="checkbox" :checked="ports[portNum]?.includes(instr)" @change="togglePortInstruction(portNum, instr, $event.target.checked)"/>
                  P.{{ portNum }}
                </label>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-if="showModal" class="modal-overlay">
    <div class="modal">
      <button class="modal-close" @click="closeModal">×</button>
      <h4>Save Configuration As</h4>
      <label for="config-name">Name:</label>
      <input
        id="config-name"
        type="text"
        v-model="modalName"
      />
      <div v-if="nameError" class="error">{{ nameError }}</div>

      <label class="download-checkbox">
        <input type="checkbox" v-model="modalDownload" />
        Download JSON
      </label>

      <div class="modal-actions">
        <button class="save-button" @click="confirmModal">Apply</button>
        <button class="save-button" @click="closeModal">Cancel</button>
      </div>
    </div>
  </div>
</template>



<style scoped>
  .main {
    height: 100%;
    width: 100%;
    background: white;
    overflow: auto;
    padding: 5px;
    border-radius: 10px;
    position: relative;
  }
  .header {
    position: sticky;
    top: -5px;
    background: white;
    width: 100%;
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
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 17px;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 13px; width: 13px;
    left: 2px; bottom: 2px;
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
  .widths input {
    width: 30px; height: 13px; text-align: center;
  }
  .instr-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  .instr-table th,
  .instr-table td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
  }
  .port-checkbox {
    margin-right: 10px;
  }

  .ports-grid, .resources-grid, .latency-item, .port-item { /* existing styles */ }

  .save-button,
  .arrow-button {
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
  .arrow-button {
    background: #c5c5c5;
  }
  .save-button:hover {
    background: #006fb9;
  }
  .arrow-button:hover {
    background: #b1b1b1;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 300px;
    position: relative;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  }
  .modal-close {
    position: absolute;
    top: 8px; right: 8px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  .error {
    color: red;
    margin: 6px 0;
  }
  .download-checkbox {
    display: block;
    margin-top: 10px;
  }
  h3{
    margin:0;
  }
  h4{
    margin:5px;
  }
</style>

