<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import HelpDialog from '@/components/helpDialog.vue';

// Instruction type definitions with subtypes
const instructionTypes = {
  'INT': ['ARITH', 'LOGIC', 'SHIFT'],
  'BRANCH': ['COND', 'UNCOND'],
  'MEM': ['STR.SP', 'STR.DP', 'LOAD.SP', 'LOAD.DP', 'VLOAD', 'VSTR'],
  'FLOAT': ['ADD.SP', 'ADD.DP', 'MUL.SP', 'MUL.DP', 'FMA', 'DIV', 'SQRT'],
  'VFLOAT': ['ADD', 'MUL', 'FMA', 'DIV']
};

// Program data
const programName = ref('');
const instructions = ref([]);
const originalProgramName = ref('');

// Computed iterations based on instruction count
const iterations = computed(() => instructions.value.length);

// Modal state
const showSaveModal = ref(false);
const saveModalName = ref('');
const saveModalError = ref('');
const saveToFile = ref(true);

// Help dialog state
const showHelp = ref(false);
const helpPosition = ref({ top: '50%', left: '50%' });
const infoIcon = ref(null);

// Initialize with empty instruction
function addInstruction() {
  instructions.value.push({
    text: '',
    type: '',
    mainType: '',
    subType: '',
    destin: '',
    source1: '',
    source2: '',
    source3: '',
    constant: ''
  });
}

function removeInstruction(index) {
  if (instructions.value.length > 1) {
    instructions.value.splice(index, 1);
  }
}

function moveInstructionUp(index) {
  if (index > 0) {
    const temp = instructions.value[index];
    instructions.value[index] = instructions.value[index - 1];
    instructions.value[index - 1] = temp;
  }
}

function moveInstructionDown(index) {
  if (index < instructions.value.length - 1) {
    const temp = instructions.value[index];
    instructions.value[index] = instructions.value[index + 1];
    instructions.value[index + 1] = temp;
  }
}

// Handle type selection
function onMainTypeChange(instruction) {
  instruction.subType = '';
  instruction.type = '';
}

function onSubTypeChange(instruction) {
  if (instruction.mainType && instruction.subType) {
    instruction.type = `${instruction.mainType}.${instruction.subType}`;
  }
}

// Get subtypes for selected main type
function getSubTypes(mainType) {
  return instructionTypes[mainType] || [];
}

// Create new program
function createNewProgram() {
  if (confirm('Create a new program? Any unsaved changes will be lost.')) {
    programName.value = 'new_program';
    originalProgramName.value = '';
    instructions.value = [];
    addInstruction();
  }
}

// Load existing program
async function loadProgram() {
  const selectEl = document.getElementById('programs-list');
  if (!selectEl || !selectEl.value) {
    alert('No program selected');
    return;
  }

  try {
    const programData = await getProgramJSON();
    
    programName.value = programData.name || selectEl.value;
    originalProgramName.value = programName.value;
    
    instructions.value = (programData.instruction_list || []).map(inst => {
      const [mainType, ...subTypeParts] = inst.type.split('.');
      const subType = subTypeParts.join('.');
      
      return {
        text: inst.text || '',
        type: inst.type || '',
        mainType: mainType || '',
        subType: subType || '',
        destin: inst.destin || '',
        source1: inst.source1 || '',
        source2: inst.source2 || '',
        source3: inst.source3 || '',
        constant: inst.constant || ''
      };
    });
    
    if (instructions.value.length === 0) {
      addInstruction();
    }
  } catch (err) {
    console.error('Failed to load program:', err);
    alert('Failed to load program');
  }
}

// Save program
function openSaveModal() {
  saveModalName.value = programName.value;
  saveModalError.value = '';
  saveToFile.value = true;
  showSaveModal.value = true;
}

async function confirmSave() {
  const name = saveModalName.value.trim();
  
  if (!name) {
    saveModalError.value = 'Program name is required';
    return;
  }

  // Check if name already exists (do not allow duplicates)
  const selectEl = document.getElementById('programs-list');
  if (selectEl) {
    const nameExists = Array.from(selectEl.options).some(
      opt => opt.value === name
    );
    
    if (nameExists) {
      saveModalError.value = 'A program with this name already exists. Please choose another one.';
      return;
    }
  }

  // Build the program JSON
  const programData = {
    name: name,
    n: instructions.value.length,
    instruction_list: instructions.value.map(inst => ({
      type: inst.type,
      text: inst.text,
      destin: inst.destin,
      source1: inst.source1,
      source2: inst.source2,
      source3: inst.source3,
      constant: inst.constant
    }))
  };

  try {
    const jsonText = JSON.stringify(programData, null, 2);
    await saveNewProgram(jsonText);
    if (saveToFile.value) {
      try {
        await saveProgramJsonToFile(programData, name);
      } catch (fileErr) {
        if (fileErr?.name !== 'AbortError') {
          console.error('File save failed:', fileErr);
          saveModalError.value = 'Saved in app, but file save failed.';
          return;
        }
      }
    }
    
    programName.value = name;
    originalProgramName.value = name;
    showSaveModal.value = false;
    saveModalError.value = '';
    
    // Wait for program list to update and select the new program
    if (selectEl) {
      setTimeout(() => {
        selectEl.value = name;
        reloadRvcat();
      }, 200);
    }
    
  } catch (err) {
    console.error('Failed to save program:', err);
    saveModalError.value = 'Failed to save program';
  }
}

function cancelSave() {
  showSaveModal.value = false;
  saveModalError.value = '';
}

// Download program as JSON
async function downloadProgram() {
  const programData = {
    name: programName.value,
    n: instructions.value.length,
    instruction_list: instructions.value.map(inst => ({
      type: inst.type,
      text: inst.text,
      destin: inst.destin,
      source1: inst.source1,
      source2: inst.source2,
      source3: inst.source3,
      constant: inst.constant
    }))
  };

  try {
    await saveProgramJsonToFile(programData, programName.value || 'program');
  } catch (err) {
    if (err?.name !== 'AbortError') {
      console.error('Download failed:', err);
      alert('Could not save the JSON file.');
    }
  }
}

// Upload program from JSON
function uploadProgram() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.style.display = 'none';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const programData = JSON.parse(text);

      if (!programData.name) {
        alert("The JSON file must contain a 'name' field.");
        return;
      }

      const selectEl = document.getElementById('programs-list');
      if (selectEl) {
        const nameExists = Array.from(selectEl.options).some(opt => opt.value === programData.name);
        if (nameExists) {
          alert('A program with this name already exists. Please choose another name.');
          return;
        }
      }
      
      programName.value = programData.name || 'imported_program';
      originalProgramName.value = '';
      
      instructions.value = (programData.instruction_list || []).map(inst => {
        const [mainType, ...subTypeParts] = inst.type.split('.');
        const subType = subTypeParts.join('.');
        
        return {
          text: inst.text || '',
          type: inst.type || '',
          mainType: mainType || '',
          subType: subType || '',
          destin: inst.destin || '',
          source1: inst.source1 || '',
          source2: inst.source2 || '',
          source3: inst.source3 || '',
          constant: inst.constant || ''
        };
      });
      
      if (instructions.value.length === 0) {
        addInstruction();
      }
    } catch (err) {
      console.error('Failed to parse JSON file:', err);
      alert('Could not load program file.');
    }
  };
  
  document.body.appendChild(input);
  input.click();
  input.remove();
}

async function saveProgramJsonToFile(programData, name) {
  const jsonText = JSON.stringify(programData, null, 2);
  const suggested = `${name || 'program'}.json`;

  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: suggested,
      types: [{
        description: 'JSON files',
        accept: { 'application/json': ['.json'] }
      }],
    });
    const writable = await handle.createWritable();
    await writable.write(jsonText);
    await writable.close();
  } else {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggested;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

function openHelp() {
  nextTick(() => {
    const el = infoIcon.value;
    if (el) {
      const r = el.getBoundingClientRect();
      helpPosition.value = {
        top: `${r.bottom}px`,
        left: `${r.right}px`
      };
      showHelp.value = true;
    }
  });
}

function closeHelp() {
  showHelp.value = false;
}

onMounted(() => {
  // Initialize with one empty instruction
  if (instructions.value.length === 0) {
    addInstruction();
  }
});
</script>

<template>
  <div class="program-editor">
    <div class="editor-header">
      <div class="section-title-and-info">
        <span ref="infoIcon" class="info-icon" @click="openHelp" title="Show help">
          <img src="/img/info.png" class="info-img">
        </span>
        <h3>Program</h3>
      </div>
      <div class="header-actions">
        <button class="blue-button" @click="createNewProgram">New</button>
        <button class="blue-button" @click="loadProgram">Load from List</button>
        <button class="blue-button" @click="uploadProgram">Upload</button>
        <button class="blue-button" @click="openSaveModal">Save</button>
        <button class="green-button download-btn" @click="downloadProgram">Download Program</button>
      </div>
    </div>

    <div class="program-info">
      <div class="info-row">
        <label>Program Name:</label>
        <input type="text" v-model="programName" class="name-input" />
      </div>
      <div class="info-row">
        <label>Instructions:</label>
        <span class="instruction-count">{{ iterations }}</span>
      </div>
    </div>

    <div class="instructions-section">
      <div class="section-header">
        <h4>Instructions</h4>
        <button class="blue-button small add-btn" @click="addInstruction">+ Add Instruction</button>
      </div>

      <div class="table-container">
        <table class="instructions-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th style="width: 200px;">Text</th>
              <th style="width: 120px;">Type</th>
              <th style="width: 120px;">Subtype</th>
              <th style="width: 80px;">Destin</th>
              <th style="width: 80px;">Source1</th>
              <th style="width: 80px;">Source2</th>
              <th style="width: 80px;">Source3</th>
              <th style="width: 80px;">Constant</th>
              <th style="width: 100px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(inst, index) in instructions" :key="index">
              <td>{{ index + 1 }}</td>
              <td>
                <input type="text" v-model="inst.text" class="table-input" />
              </td>
              <td>
                <select v-model="inst.mainType" @change="onMainTypeChange(inst)" class="table-select">
                  <option value="">Select...</option>
                  <option v-for="type in Object.keys(instructionTypes)" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
              </td>
              <td>
                <select 
                  v-model="inst.subType" 
                  @change="onSubTypeChange(inst)" 
                  :disabled="!inst.mainType"
                  class="table-select"
                >
                  <option value="">Select...</option>
                  <option 
                    v-for="subtype in getSubTypes(inst.mainType)" 
                    :key="subtype" 
                    :value="subtype"
                  >
                    {{ subtype }}
                  </option>
                </select>
              </td>
              <td>
                <input type="text" v-model="inst.destin" class="table-input" />
              </td>
              <td>
                <input type="text" v-model="inst.source1" class="table-input" />
              </td>
              <td>
                <input type="text" v-model="inst.source2" class="table-input" />
              </td>
              <td>
                <input type="text" v-model="inst.source3" class="table-input" />
              </td>
              <td>
                <input type="text" v-model="inst.constant" class="table-input" />
              </td>
              <td class="actions-cell">
                <button 
                  @click="moveInstructionUp(index)" 
                  :disabled="index === 0"
                  class="action-btn"
                  title="Move up"
                >
                  ▲
                </button>
                <button 
                  @click="moveInstructionDown(index)" 
                  :disabled="index === instructions.length - 1"
                  class="action-btn"
                  title="Move down"
                >
                  ▼
                </button>
                <button 
                  @click="removeInstruction(index)" 
                  :disabled="instructions.length === 1"
                  class="action-btn delete"
                  title="Delete"
                >
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Save Modal -->
    <div v-if="showSaveModal" class="modal-overlay">
      <div class="modal">
        <h4>Save Program As</h4>
        <label for="save-name">Name:</label>
        <input id="save-name" type="text" v-model="saveModalName" />
        <label class="checkbox-row">
          <input type="checkbox" v-model="saveToFile" />
          <span>Save JSON file</span>
        </label>
        <div v-if="saveModalError" class="error">{{ saveModalError }}</div>
        <div class="modal-actions">
          <button class="blue-button" @click="confirmSave">Save</button>
          <button class="blue-button" @click="cancelSave">Cancel</button>
        </div>
      </div>
    </div>

    <HelpDialog v-if="showHelp" :position="helpPosition"
    text="The program editor allows you to create and modify instruction sequences for simulation. Each instruction has a type (with subtypes), operands (destination and sources), and optional constants. Programs are saved in JSON format and can be uploaded, downloaded, or loaded from the programs list. The instruction count automatically updates as you add or remove instructions."
    title="Program Editor"
    @close="closeHelp"
    />
  </div>
</template>

<style scoped>
.program-editor {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 15px 40px 35px 15px;
  background: white;
  overflow: hidden;
  border-radius: 10px;
}

.download-btn {
  margin-right: 20px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #007acc;
}

.editor-header h3 {
  margin: 0;
  color: #333;
}

.section-title-and-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.info-img {
  width: 20px;
  height: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.program-info {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 5px;
  margin-right: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-row label {
  font-weight: bold;
  white-space: nowrap;
}

.name-input {
  width: 200px;
  padding: 5px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 14px;
}

.instruction-count {
  font-weight: bold;
  color: #007acc;
  font-size: 16px;
  padding: 5px 8px;
}

.instructions-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  margin-right: 20px;
}

.section-header h4 {
  margin: 0;
  color: #333;
}

.table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-right: 20px;
  max-height: calc(100vh - 300px);
}

.instructions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.instructions-table thead {
  position: sticky;
  top: 0;
  background: #007acc;
  color: white;
  z-index: 1;
}

.instructions-table th {
  padding: 10px 5px;
  text-align: left;
  font-weight: bold;
  border: 1px solid #005a9e;
}

.instructions-table td {
  padding: 5px;
  border: 1px solid #ddd;
  vertical-align: middle;
}

.instructions-table tbody tr:nth-child(even) {
  background: #f9f9f9;
}

.instructions-table tbody tr:hover {
  background: #e8f4fd;
}

.table-input,
.table-select {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 13px;
  box-sizing: border-box;
}

.table-select:disabled {
  background: #f0f0f0;
  cursor: not-allowed;
}

.actions-cell {
  text-align: center;
  white-space: nowrap;
}

.action-btn {
  padding: 3px 8px;
  margin: 0 2px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn:hover:not(:disabled) {
  background: #e8f4fd;
  border-color: #007acc;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.delete {
  color: #d32f2f;
}

.action-btn.delete:hover:not(:disabled) {
  background: #ffebee;
  border-color: #d32f2f;
}

.blue-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.blue-button:hover {
  background-color: #0056b3;
}

.green-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.green-button:hover:not(:disabled) {
  background-color: #218838;
}

.green-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.blue-button.small {
  padding: 5px 12px;
  font-size: 13px;
}

.add-btn {
  margin-right: 20px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  min-width: 400px;
}

.modal h4 {
  margin: 0 0 15px 0;
  color: #007acc;
}

.modal label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
  font-weight: normal;
}

.checkbox-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.modal input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.error {
  color: #d32f2f;
  font-size: 13px;
  margin-bottom: 10px;
  padding: 8px;
  background: #ffebee;
  border-radius: 4px;
}
</style>
