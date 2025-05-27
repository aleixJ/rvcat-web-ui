<script setup>
  import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";

  // --- existing reactive state ---
  const dispatch = ref(0);
  const retire = ref(0);
  const resources = reactive({});
  const name = ref("");
  const ports = ref({});
  const nBlocks = ref(0);
  const blkSize = ref(0);
  const mPenalty = ref(0);
  const mIssueTime = ref(0);
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

  // --- computed lists ---
  const availableInstructions = computed(() => Object.keys(resources));
  const portList = computed(() => Object.keys(ports.value));

  // --- modal state ---
  const showModalDown = ref(false);
  const showModalUp = ref(false);
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
      nBlocks.value = cfg.nBlocks;
      blkSize.value = cfg.blkSize;
      mIssueTime.value = cfg.mIssueTime;
      mPenalty.value = cfg.mPenalty;

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
        processorsListHandler = () => setTimeout( ()=> { updateProcessorSettings();},100);
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

  // --- detect modifications ---
  function shallowEq(a, b) {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (let k of ka) {
      if (a[k] !== b[k]) return false;
    }
    return true;
  }
  function portsEq(a, b) {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (let k of ka) {
      const arrA = a[k] || [], arrB = b[k] || [];
      if (arrA.length !== arrB.length) return false;
      for (let i = 0; i < arrA.length; i++) {
        if (arrA[i] !== arrB[i]) return false;
      }
    }
    return true;
  }
  const isModified = computed(() => {
    if (dispatch.value !== originalSettings.dispatch) return true;
    if (retire.value   !== originalSettings.retire)   return true;
    if (nBlocks.value   !== originalSettings.nBlocks)   return true;
    if (blkSize.value   !== originalSettings.blkSize)   return true;
    if (mPenalty.value   !== originalSettings.mPenalty)   return true;
    if (mIssueTime.value   !== originalSettings.mIssueTime)   return true;
    if (!shallowEq(resources, originalSettings.resources)) return true;
    if (!portsEq(ports.value, originalSettings.ports)) return true;
    return false;
  });

  // --- helpers and modal controls ---
  function getCurrentProcessorJSON() {
    const rports = {};
    Object.entries(ports.value).forEach(([port, instrs]) => {
      instrs.forEach(instr => {
        if (!rports[instr]) rports[instr] = [];
        rports[instr].push(port);
      });
    });
    return {
      name: modalName.value,
      stages: {
        dispatch: dispatch.value,
        execute:Object.keys(ports.value).length,
        retire: retire.value,
      },
      resources: { ...resources },
      ports: ports.value,
      rports: rports,
      cache: originalSettings.cache,
      nBlocks: nBlocks.value,
      blkSize: blkSize.value,
      mPenalty: mPenalty.value,
      mIssueTime: mIssueTime.value,
    };
  }

  function openModal() {
    modalName.value = name.value + "*";
    modalDownload.value = true;
    nameError.value = "";
    showModalDown.value = true;
  }

  function closeModal() {
    showModalDown.value = false;
    showModalUp.value = false;
  }


  async function confirmModal() {
    const list = document.getElementById("processors-list");
    if (list) {
      for (const opt of list.options) {
        if (opt.value === modalName.value) {
          nameError.value = "Name already exists. Please choose another one.";
          return;
        }
      }
    }
    const data = getCurrentProcessorJSON();
    await saveModifiedProcessor(data);

    //download JSON file
    if (modalDownload.value) {
      const jsonText = JSON.stringify(data, null, 2);

      // force a Save As... dialog if API is supported
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${modalName.value}.json`,
          types: [{
            description: 'JSON files',
            accept: { 'application/json': ['.json'] }
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonText);
        await writable.close();
      } else {
        // fallback: traditional anchor download
        const blob = new Blob([jsonText], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `${modalName.value}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
    name.value = modalName.value;
    showModalDown.value = false;
    showModalUp.value = false;
    setTimeout(()=>{list.value=name.value;
      reloadRvcat();
    },100);
  }

  // --- port add/delete ---
  function addPort() {
    const existing = portList.value.map(n => parseInt(n,10)).sort((a,b)=>a-b);
    let next = 0;
    for (; existing.includes(next); next++);
    ports.value[next] = [];
  }
  function removePort(port) {
    const idx = Number(port);
    delete ports.value[idx];

    //sort and reindex other ports
    const leftover = Object.entries(ports.value)
      .map(([k,v]) => [Number(k), v])
      .sort((a,b) => a[0] - b[0]);

    Object.keys(ports.value).forEach(k => delete ports.value[k]);
    leftover.forEach(([oldIdx, portArr], newIdx) => {
      ports.value[newIdx] = portArr;
    });
  }

  function togglePortInstruction(portNum, instruction, isChecked) {
    if (!ports.value[portNum]) ports.value[portNum] = [];
    if (isChecked) {
      if (!ports.value[portNum].includes(instruction))
        ports.value[portNum].push(instruction);
    } else {
      ports.value[portNum] = ports.value[portNum].filter(i => i !== instruction);
    }
  }

  function uploadProcessorConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {

        const data = JSON.parse(e.target.result);
        // === apply JSON to your reactive state ===
        dispatch.value = data.stages?.dispatch ?? dispatch.value;
        retire.value   = data.stages?.retire   ?? retire.value;
        name.value     = data.name             ?? name.value;
        nBlocks.value = data.nBlocks;
        blkSize.value = data.blkSize;
        mIssueTime.value = data.mIssueTime;
        mPenalty.value = data.mPenalty;

        // update resources
        Object.keys(resources).forEach(k => delete resources[k]);
        Object.entries(data.resources || {}).forEach(([k,v]) => {
          resources[k] = v;
        });

        // update ports
        ports.value = data.ports || {};

        // stash originalSettings if needed...
        Object.assign(originalSettings, {
          dispatch: data.stages?.dispatch ?? 0,
          retire:   data.stages?.retire   ?? 0,
          name:     data.name             ?? "",
          resources: JSON.parse(JSON.stringify(data.resources||{})),
          ports:     JSON.parse(JSON.stringify(data.ports||{})),
          rports:    JSON.parse(JSON.stringify(data.rports||{})),
          cache:     data.cache,
          nBlocks:   data.nBlocks,
          blkSize:   data.blkSize,
          mPenalty:  data.mPenalty,
          mIssueTime:data.mIssueTime,
        });

        // === now pop up the Save‐As dialog ===
        // strip extension from filename for default
        modalName.value = file.name.replace(/\.[^.]+$/, "");
        modalDownload.value = false;
        nameError.value = "";
        showModalUp.value = true;

      } catch (err) {
        console.error("Invalid JSON:", err);
        alert("Failed to load processor config. Please check the file.");
      }
    };
    reader.readAsText(file);
  }

  function decreaseLatency(key) {
    resources[key] = Math.max(1, resources[key] - 1);
  }

  function increaseLatency(key) {
    resources[key] = resources[key] + 1;
  }

</script>

<template>
  <div class="main">
    <div class="header">
      <h3>Processor Settings - {{ name }}</h3>
      <div>
        <button class="save-button" @click="openModal" :disabled="!isModified">
          Apply Changes
        </button>
        <label class="save-button">Upload
          <input type="file" accept=".json" @change="uploadProcessorConfig" style="display: none;"/>
        </label>
      </div>
    </div>
    <br/>
    <div>

      <div class="widths">

        <div class="width-group">
          <span><strong> Dispatch width: </strong></span>
          <button type="button" class="latency-btn" @click="dispatch = Math.max(1, dispatch - 1)">−</button>
          <input type="number" id="dispatch-width" name="dispatch-width" min="1" v-model.number="dispatch" class="latency-input"/>
          <button type="button" class="latency-btn" @click="dispatch = (dispatch + 1)%100">+</button>
        </div>

        <div class="width-group">
          <span><b> Retire width: </b></span>
          <button type="button" class="latency-btn" @click="retire = Math.max(1, retire - 1)" >−</button>
          <input type="number" id="retire-width" name="retire-width" min="1" v-model.number="retire" class="latency-input"/>
          <button type="button" class="latency-btn" @click="retire = (retire + 1)%100">+</button>
        </div>
      </div>

      <br>
      <h4>Instruction Latencies & Execution Ports</h4>

      <!-- Ports toolbar: show existing ports and add/delete -->
      <div class="ports-toolbar">
        <span v-for="port in portList" :key="port" class="port-tag">
          P.{{ port }}
          <button class="delete-port" @click="removePort(port)" :title="`Remove P.${port}`">
            x
          </button>
        </span>
        <button v-if="portList.length < 10" class="add-port" @click="addPort">
          + Add Port
        </button>
      </div>

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
              <div class="latency-group">
                <button type="button" class="latency-btn" @click="decreaseLatency(instr)">−</button>
                <input type="number" v-model.number="resources[instr]" class="latency-input" min="1"/>
                <button type="button" class="latency-btn" @click="increaseLatency(instr)">+</button>
              </div>
            </td>
            <td>
              <span v-for="port in portList" :key="port" class="port-checkbox">
                <label>
                  <input type="checkbox" :checked="ports[port]?.includes(instr)" @change="togglePortInstruction(port, instr, $event.target.checked)"/>
                  P.{{ port }}
                </label>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <h4>Cache settings (work in progress)</h4>
      <div class="cache">
        <div class="cache-setting">
          <span> Number of Blocks: </span>
          <button type="button" class="latency-btn" @click="nBlocks = Math.max(0, nBlocks - 1)">−</button>
          <input type="number" id="nBlocks" name="nBlocks" min="1" v-model.number="nBlocks" class="latency-input"/>
          <button type="button" class="latency-btn" @click="nBlocks = (nBlocks + 1)%100">+</button>
        </div>
        <div class="cache-setting">
          <span> Block Size: </span>
          <button type="button" class="latency-btn" @click="blkSize = Math.max(1, blkSize - 1)">−</button>
          <input type="number" id="blkSize" name="blkSize" min="1" v-model.number="blkSize" class="latency-input"/>
          <button type="button" class="latency-btn" @click="blkSize = (blkSize + 1)%100">+</button>
        </div>
        <div class="cache-setting">
          <span> Miss Penalty: </span>
          <button type="button" class="latency-btn" @click="mPenalty = Math.max(1, mPenalty - 1)">−</button>
          <input type="number" id="mPenalty" name="mPenalty" min="1" v-model.number="mPenalty" class="latency-input"/>
          <button type="button" class="latency-btn" @click="mPenalty = (mPenalty + 1)%100">+</button>
        </div>
        <div class="cache-setting">
          <span> Miss Issue Time: </span>
          <button type="button" class="latency-btn" @click="mIssueTime = Math.max(1, mIssueTime - 1)">−</button>
          <input type="number" id="mIssueTime" name="mIssueTime" min="1" v-model.number="mIssueTime" class="latency-input"/>
          <button type="button" class="latency-btn" @click="mIssueTime = (mIssueTime + 1)%100">+</button>
        </div>
      </div>


    </div>
  </div>

  <!-- Modal Dialog -->
  <div v-if="showModalDown" class="modal-overlay">
    <div class="modal">
      <h4>Save Configuration As</h4>
      <label for="config-name">Name:</label>
      <input id="config-name" type="text" v-model="modalName"/>
      <div v-if="nameError" class="error">{{ nameError }}</div>

      <label class="download-checkbox">
        <input type="checkbox" v-model="modalDownload" />
        Download JSON file
        <span class="warning-wrapper" aria-label="Info">
          ⚠️
          <div class="tooltip-text">
            Saving a local copy is recommended as modified settings will not persist in your next session.
          </div>
        </span>
      </label>


      <div class="modal-actions">
        <button class="save-button" @click="confirmModal">Apply</button>
        <button class="save-button" @click="closeModal">Cancel</button>
      </div>
    </div>
  </div>

  <div v-if="showModalUp" class="modal-overlay">
    <div class="modal">
      <h4>Save Configuration As</h4>
      <label for="config-name">Name:</label>
      <input id="config-name" type="text" v-model="modalName"/>
      <div v-if="nameError" class="error">{{ nameError }}</div>
      <div class="modal-actions">
        <button class="save-button" @click="confirmModal">Save</button>
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
    padding-top:2px;
    top: -5px;
    left:0;
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
  .ports-toolbar {
    margin: 8px 0;
  }
  .port-tag {
    display: inline-block;
    background: #e3e3e3;
    border-radius: 4px;
    padding: 2px 6px;
    margin-right: 5px;
    font-size: 0.9em;
  }
  .delete-port {
    background: none;
    border: none;
    cursor: pointer;
    font-weight: bold;
  }
  .add-port {
    background: #4caf50;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
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
    margin-right: 5px;
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
    text-align:center;
  }
  .save-button:hover {
    background: #006fb9;
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
  h4{
    margin:5px;
    margin-left:0;
  }
  h3{
    margin:0;
    top:5px;
  }
  .save-button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .latency-group {
    display: inline-flex;
    align-items: center;
  }

  .latency-input {
    width: 3ch;
    padding: 2px;
    margin: 0 4px;
    text-align: center;
    font-size: 0.9em;
  }

  .latency-btn {
    background: #e0e0e0;
    border: 1px solid #b0b0b0;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    line-height: 1;
    text-align: center;
    font-size: 1.2em;
    cursor: pointer;
    user-select: none;
  }

  .latency-btn:hover {
    background: #d0d0d0;
  }

  .width-group {
    display: inline-flex;
    align-items: center;
    margin-right: 8px;
  }

  .cache-setting {
    display: inline-flex;
    align-items: center;
    margin-right: 8px;
  }


  /* Chrome, Safari, Edge, Opera */
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }
  strong{
    margin:0;
  }
  .warning-wrapper {
    position: relative;
    display: inline-block;
    cursor: default;
  }

  .tooltip-text {
    visibility: hidden;
    width: 240px;
    background-color: rgba(0, 0, 0, 0.9);
    color: #fff;
    text-align: left;
    border-radius: 4px;
    padding: 8px;
    font-size: 0.85em;
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translate(8px, -50%);
    white-space: normal;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  .warning-wrapper:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
  }


</style>
