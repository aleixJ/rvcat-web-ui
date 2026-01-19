<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { 
  getStoredExecutions, 
  deleteExecution, 
  renameExecution, 
  clearAllExecutions,
  getExecutionStats 
} from '@/utils/simulationStorage.js'
import HelpDialog from '@/components/helpDialog.vue'

// ============================================================================
// STATE
// ============================================================================
const executions = ref([])
const loading = ref(true)
const stats = ref({})
const sortBy = ref('timestamp')
const sortOrder = ref('desc')
const filterBy = ref('')
const editingNameId = ref(null)
const tempName = ref('')
const showHelp = ref(false)
const helpPosition = ref({ top: '50%', left: '50%' })
const infoIcon = ref(null)
const showUploadModal = ref(false)
const uploadMode = ref('merge')

// ============================================================================
// CONSTANTS
// ============================================================================
const NUMERIC_SORT_FIELDS = ['rob', 'iterations', 'instructions', 'cycles', 'ipc', 'cyclesPerIteration']
const STORAGE_KEY = 'rvcat_simulation_executions'

// ============================================================================
// COMPUTED
// ============================================================================
const filteredAndSortedExecutions = computed(() => {
  let result = [...executions.value]
  
  // Apply filter
  if (filterBy.value) {
    const filter = filterBy.value.toLowerCase()
    result = result.filter(e => 
      e.name.toLowerCase().includes(filter) ||
      e.processor.toLowerCase().includes(filter) ||
      e.program.toLowerCase().includes(filter)
    )
  }
  
  // Apply sort
  result.sort((a, b) => {
    const aVal = a[sortBy.value]
    const bVal = b[sortBy.value]
    
    let cmp = 0
    if (NUMERIC_SORT_FIELDS.includes(sortBy.value)) {
      cmp = parseFloat(aVal) - parseFloat(bVal)
    } else if (sortBy.value === 'timestamp') {
      cmp = new Date(aVal) - new Date(bVal)
    } else if (typeof aVal === 'string') {
      cmp = aVal.localeCompare(bVal)
    } else {
      cmp = aVal - bVal
    }
    
    return sortOrder.value === 'asc' ? cmp : -cmp
  })
  
  return result
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const handleError = (action, error) => {
  console.error(`Error ${action}:`, error)
  alert(`Error ${action}. Please try again.`)
}

const withConfirm = (message, action) => {
  if (confirm(message)) action()
}

// ============================================================================
// DATA MANAGEMENT
// ============================================================================
const loadExecutions = () => {
  loading.value = true
  try {
    executions.value = getStoredExecutions()
    stats.value = getExecutionStats()
  } catch (error) {
    handleError('loading executions', error)
  } finally {
    loading.value = false
  }
}

const handleDelete = (id) => withConfirm(
  'Are you sure you want to delete this execution?',
  () => {
    try {
      deleteExecution(id)
      loadExecutions()
    } catch (error) {
      handleError('deleting execution', error)
    }
  }
)

const handleClearAll = () => withConfirm(
  'Are you sure you want to delete all saved executions? This action cannot be undone.',
  () => {
    try {
      clearAllExecutions()
      loadExecutions()
    } catch (error) {
      handleError('clearing executions', error)
    }
  }
)

// ============================================================================
// NAME EDITING
// ============================================================================
const startEditName = (execution) => {
  editingNameId.value = execution.id
  tempName.value = execution.name
}

const cancelEditName = () => {
  editingNameId.value = null
  tempName.value = ''
}

const saveNewName = (id) => {
  if (!tempName.value.trim()) return
  try {
    renameExecution(id, tempName.value.trim())
    loadExecutions()
    cancelEditName()
  } catch (error) {
    handleError('renaming execution', error)
  }
}

// ============================================================================
// SORTING
// ============================================================================
const setSortBy = (column) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'desc'
  }
}

// ============================================================================
// DATE FORMATTING
// ============================================================================
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const diffMs = Date.now() - date
  
  if (diffMs < 0) return 'Future date'
  
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  
  if (diffSec < 60) return `${diffSec} sec ago`
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHr < 24) return `${diffHr} hr ago`
  
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = String(date.getFullYear()).slice(-2)
  return `${d}/${m}/${y}`
}

// ============================================================================
// HELP DIALOG
// ============================================================================
const openHelp = () => {
  nextTick(() => {
    const el = infoIcon.value
    if (!el) return
    const r = el.getBoundingClientRect()
    helpPosition.value = { top: `${r.bottom}px`, left: `${r.right}px` }
    showHelp.value = true
  })
}

const closeHelp = () => { showHelp.value = false }

// ============================================================================
// EXPORT
// ============================================================================
const exportToCSV = async () => {
  try {
    const headers = ['name', 'processor', 'program', 'rob', 'iterations', 'instructions', 'cycles', 'ipc', 'cyclesPerIteration', 'timestamp']
    const csvRows = [
      headers.join(','),
      ...filteredAndSortedExecutions.value.map(e => 
        headers.map(h => `"${String(e[h]).replace(/"/g, '""')}"`).join(',')
      )
    ]
    const csv = csvRows.join('\n')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `executions_${timestamp}.csv`

    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'CSV files', accept: { 'text/csv': ['.csv'] } }]
      })
      const writable = await handle.createWritable()
      await writable.write(csv)
      await writable.close()
    } else {
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    handleError('exporting to CSV', error)
  }
}

// ============================================================================
// DOWNLOAD / UPLOAD
// ============================================================================
const downloadExecutions = async () => {
  try {
    const json = JSON.stringify(executions.value, null, 2)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `executions_${timestamp}.json`

    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON files', accept: { 'application/json': ['.json'] } }]
      })
      const writable = await handle.createWritable()
      await writable.write(json)
      await writable.close()
    } else {
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    handleError('downloading executions', error)
  }
}

const openUploadDialog = () => {
  if (executions.value.length > 0) {
    showUploadModal.value = true
  } else {
    document.getElementById('execution-file-upload').click()
  }
}

const confirmUpload = () => {
  showUploadModal.value = false
  document.getElementById('execution-file-upload').click()
}

const cancelUpload = () => {
  showUploadModal.value = false
  uploadMode.value = 'merge'
}

const uploadExecutions = (event) => {
  const inputEl = event.target
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const uploaded = JSON.parse(e.target.result)
      
      if (!Array.isArray(uploaded)) {
        alert('Invalid file format. Expected an array of executions.')
        return
      }

      if (uploadMode.value === 'replace') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(uploaded))
      } else {
        const existing = getStoredExecutions()
        const existingIds = new Set(existing.map(x => x.id))
        const newExecs = uploaded.filter(x => !existingIds.has(x.id))
        const skipped = uploaded.length - newExecs.length
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, ...newExecs]))
        
        if (skipped > 0) {
          alert(`Merged ${newExecs.length} execution(s). Skipped ${skipped} duplicate(s).`)
        }
      }

      loadExecutions()
      uploadMode.value = 'merge'
    } catch (err) {
      console.error('Invalid JSON:', err)
      alert('Failed to load executions file. Please check the file format.')
    }
    inputEl.value = ''
  }
  reader.readAsText(file)
}

// ============================================================================
// LIFECYCLE
// ============================================================================
onMounted(loadExecutions)
</script>

<template>
  <div class="main">
    <div class="header">
      <div class="section-title-and-info">
        <span ref="infoIcon" class="info-icon" @click="openHelp" title="Show help">
          <img src="/img/info.png" class="info-img">
        </span>
        <h3>Execution Comparison</h3>
      </div>
      <div class="header-actions">
        <input 
          v-model="filterBy" 
          type="text" 
          placeholder="Filter by name, processor, or program..."
          class="filter-input"
        >
        <input id="execution-file-upload" type="file" accept=".json" @change="uploadExecutions" style="display: none;"/>
        <button @click="openUploadDialog" class="blue-button">
          Upload
        </button>
        <button @click="downloadExecutions" class="green-button" :disabled="executions.length === 0">
          Download
        </button>
        <button @click="exportToCSV" class="purple-button" :disabled="executions.length === 0">
          Export CSV
        </button>
        <button @click="handleClearAll" class="red-button" :disabled="executions.length === 0">
          Clear All
        </button>
      </div>
    </div>

    <!-- Statistics Overview -->
    <div v-if="executions.length > 0" class="stats-overview">
      <div class="stat-item">
        <label>Total Executions:</label>
        <span>{{ stats.count }}</span>
      </div>
      <div class="stat-item">
        <label>Average IPC:</label>
        <span>{{ stats.avgIpc }}</span>
      </div>
      <div class="stat-item">
        <label>Average Cycles:</label>
        <span>{{ stats.avgCycles }}</span>
      </div>
      <div class="stat-item">
        <label>Average Cyc/Iter:</label>
        <span>{{ stats.avgCyclesPerIteration }}</span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>Loading executions...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="executions.length === 0" class="empty-state">
      <p>No saved executions found.</p>
      <p>Run a simulation and click "Save" to start comparing executions.</p>
    </div>

    <!-- Executions table -->
    <div v-else class="executions-table-container">
      <table class="executions-table">
        <thead>
          <tr>
            <th></th>
            <th @click="setSortBy('name')" class="sortable">
              Name 
              <span v-if="sortBy === 'name'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="setSortBy('processor')" class="sortable">
              Processor
              <span v-if="sortBy === 'processor'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="setSortBy('program')" class="sortable">
              Program
              <span v-if="sortBy === 'program'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="setSortBy('rob')" class="sortable">
              ROB
              <span v-if="sortBy === 'rob'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="setSortBy('iterations')" class="sortable">
              Iterations
              <span v-if="sortBy === 'iterations'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="setSortBy('instructions')" class="sortable">
              Instructions
              <span v-if="sortBy === 'instructions'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="setSortBy('cycles')" class="sortable">
              Cycles
              <span v-if="sortBy === 'cycles'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="setSortBy('ipc')" class="sortable">
              IPC
              <span v-if="sortBy === 'ipc'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="setSortBy('cyclesPerIteration')" class="sortable">
              Cyc/Iter
              <span v-if="sortBy === 'cyclesPerIteration'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="setSortBy('timestamp')" class="sortable">
              Date
              <span v-if="sortBy === 'timestamp'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="execution in filteredAndSortedExecutions" :key="execution.id">
            <td>
              <button @click="handleDelete(execution.id)" class="delete-btn" title="Delete execution">
                <img src="/img/delete.png" alt="Delete" class="delete-icon">
              </button>
            </td>
            <td>
              <div v-if="editingNameId === execution.id" class="edit-name-container">
                <input 
                  v-model="tempName" 
                  @keyup.enter="saveNewName(execution.id)"
                  @keyup.escape="cancelEditName"
                  class="edit-name-input"
                  ref="editInput"
                >
                <button @click="saveNewName(execution.id)" class="save-btn">✓</button>
                <button @click="cancelEditName" class="cancel-btn">✕</button>
              </div>
              <div v-else @click="startEditName(execution)" class="editable-name" title="Click to edit name">
                {{ execution.name }}
                <span class="edit-icon">✎</span>
              </div>
            </td>
            <td>{{ execution.processor }}</td>
            <td>{{ execution.program }}</td>
            <td>{{ execution.rob }}</td>
            <td>{{ execution.iterations }}</td>
            <td>{{ execution.instructions }}</td>
            <td>{{ execution.cycles }}</td>
            <td>{{ execution.ipc.toFixed(2) }}</td>
            <td>{{ execution.cyclesPerIteration.toFixed(2) }}</td>
            <td>{{ formatDate(execution.timestamp) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Filtered results info -->
    <div v-if="filterBy && executions.length > 0" class="filter-info">
      Showing {{ filteredAndSortedExecutions.length }} of {{ executions.length }} executions
    </div>
  </div>

  <HelpDialog 
    v-if="showHelp" 
    :position="helpPosition"
    text="Compare saved simulation executions side by side. Click on column headers to sort, use the filter box to search, and click on execution names to rename them (look for the edit icon ✎). Save executions from the Simulation tab to build your comparison dataset."
    title="Execution Comparison"
    @close="closeHelp"
  />

  <!-- Upload Mode Modal -->
  <div v-if="showUploadModal" class="modal-overlay" @click="cancelUpload">
    <div class="modal-content" @click.stop>
      <h3>Upload Executions</h3>
      <p>You have {{ executions.length }} saved execution(s). How would you like to handle the uploaded data?</p>
      
      <div class="upload-options">
        <label class="radio-option">
          <input type="radio" v-model="uploadMode" value="merge" />
          <div class="option-content">
            <strong>Merge</strong>
            <span>Add uploaded executions to existing ones</span>
          </div>
        </label>
        
        <label class="radio-option">
          <input type="radio" v-model="uploadMode" value="replace" />
          <div class="option-content">
            <strong>Replace</strong>
            <span>Delete existing executions and replace with uploaded ones</span>
          </div>
        </label>
      </div>
      
      <div class="modal-actions">
        <button @click="cancelUpload" class="cancel-button">Cancel</button>
        <button @click="confirmUpload" class="confirm-button">Continue</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main {
  height: 100%;
  width: 100%;
  background: white;
  overflow-y: auto;
  overflow-x: auto;
  padding: 15px 40px 15px 15px;
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.header {
  position: sticky;
  top: -15px;
  left: 0;
  background: white;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  padding-right: 20px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 15px;
  z-index: 20;
  flex-shrink: 0;
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

h3 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 20px;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 250px;
}

.red-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.red-button:hover:not(:disabled) {
  background-color: #c82333;
}

.red-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.stats-overview {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  margin-right: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-item label {
  font-weight: bold;
  font-size: 12px;
  color: #666;
}

.stat-item span {
  font-size: 18px;
  color: #333;
}

.loading-state, .empty-state {
  text-align: center;
  color: #666;
  padding: 40px 20px;
}

.empty-state p:first-child {
  font-size: 18px;
  margin-bottom: 10px;
}

.executions-table-container {
  overflow-x: auto;
  overflow-y: auto;
  border-radius: 6px;
  border: 1px solid #ddd;
  margin-right: 20px;
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 300px);
}

.executions-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

.executions-table th,
.executions-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.executions-table th {
  background: #f8f9fa;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 10;
}

.executions-table tbody tr:hover {
  background: #f8f9fa;
}

.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable:hover {
  background: #e9ecef;
}

.sort-indicator {
  margin-left: 5px;
  font-size: 12px;
}

.editable-name {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px dashed transparent;
}

.editable-name:hover {
  background: #e9ecef;
  border-bottom: 1px dashed #007acc;
}

.edit-icon {
  opacity: 0;
  margin-left: 8px;
  font-size: 12px;
  color: #007acc;
  transition: opacity 0.2s;
}

.editable-name:hover .edit-icon {
  opacity: 1;
}

.edit-name-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-name-input {
  padding: 2px 6px;
  border: 1px solid #007acc;
  border-radius: 3px;
  font-size: 14px;
  min-width: 100px;
}

.save-btn, .cancel-btn {
  padding: 2px 6px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.save-btn {
  background: #28a745;
  color: white;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background: #f8d7da;
}

.delete-icon {
  width: 16px;
  height: 16px;
}

.filter-info {
  margin-top: 10px;
  text-align: center;
  color: #666;
  font-size: 14px;
  flex-shrink: 0;
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

.purple-button {
  background-color: #6f42c1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.purple-button:hover:not(:disabled) {
  background-color: #5a32a3;
}

.purple-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 20px;
}

.modal-content p {
  margin: 0 0 20px 0;
  color: #666;
  line-height: 1.5;
}

.upload-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.radio-option input[type="radio"] {
  margin-top: 3px;
  cursor: pointer;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-content strong {
  color: #333;
  font-size: 15px;
}

.option-content span {
  color: #666;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: #5a6268;
}

.confirm-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.confirm-button:hover {
  background-color: #0056b3;
}
</style>
