<script setup>
  import { ref, onMounted, computed, nextTick } from 'vue';
  import { 
    getStoredExecutions, 
    deleteExecution, 
    renameExecution, 
    clearAllExecutions,
    getExecutionStats 
  } from '@/utils/simulationStorage.js';
  import HelpDialog from '@/components/helpDialog.vue';

  // Component state
  const executions = ref([]);
  const loading = ref(true);
  const stats = ref({});
  const sortBy = ref('timestamp');
  const sortOrder = ref('desc');
  const filterBy = ref('');
  const editingNameId = ref(null);
  const tempName = ref('');
  const showHelp = ref(false);
  const helpPosition = ref({ top: '50%', left: '50%' });
  const infoIcon = ref(null);

  // Computed properties
  const filteredAndSortedExecutions = computed(() => {
    let result = [...executions.value];
    
    // Apply filter
    if (filterBy.value) {
      const filter = filterBy.value.toLowerCase();
      result = result.filter(exec => 
        exec.name.toLowerCase().includes(filter) ||
        exec.processor.toLowerCase().includes(filter) ||
        exec.program.toLowerCase().includes(filter)
      );
    }
    
    // Apply sort
    result.sort((a, b) => {
      const aVal = a[sortBy.value];
      const bVal = b[sortBy.value];
      
      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else {
        comparison = aVal - bVal;
      }
      
      return sortOrder.value === 'asc' ? comparison : -comparison;
    });
    
    return result;
  });

  // Methods
  function loadExecutions() {
    loading.value = true;
    try {
      executions.value = getStoredExecutions();
      stats.value = getExecutionStats();
    } catch (error) {
      console.error('Error loading executions:', error);
    } finally {
      loading.value = false;
    }
  }

  function handleDelete(executionId) {
    if (confirm('Are you sure you want to delete this execution?')) {
      try {
        deleteExecution(executionId);
        loadExecutions();
      } catch (error) {
        console.error('Error deleting execution:', error);
        alert('Error deleting execution. Please try again.');
      }
    }
  }

  function startEditName(execution) {
    editingNameId.value = execution.id;
    tempName.value = execution.name;
  }

  function cancelEditName() {
    editingNameId.value = null;
    tempName.value = '';
  }

  function saveNewName(executionId) {
    if (tempName.value.trim()) {
      try {
        renameExecution(executionId, tempName.value.trim());
        loadExecutions();
        editingNameId.value = null;
        tempName.value = '';
      } catch (error) {
        console.error('Error renaming execution:', error);
        alert('Error renaming execution. Please try again.');
      }
    }
  }

  function handleClearAll() {
    if (confirm('Are you sure you want to delete all saved executions? This action cannot be undone.')) {
      try {
        clearAllExecutions();
        loadExecutions();
      } catch (error) {
        console.error('Error clearing executions:', error);
        alert('Error clearing executions. Please try again.');
      }
    }
  }

  function setSortBy(column) {
    if (sortBy.value === column) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy.value = column;
      sortOrder.value = 'desc';
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
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

  // Lifecycle
  onMounted(() => {
    loadExecutions();
  });
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
</template>

<style scoped>
.main {
  height: 100%;
  width: 100%;
  background: white;
  overflow: auto;
  padding: 15px 40px 15px 15px;
  border-radius: 10px;
  position: relative;
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
  border-radius: 6px;
  border: 1px solid #ddd;
  margin-right: 20px;
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
}
</style>
