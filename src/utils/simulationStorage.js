// Utility functions for managing simulation execution data in localStorage

const STORAGE_KEY = 'rvcat_simulation_executions';

/**
 * Get all saved simulation executions from localStorage
 * @returns {Array} Array of execution objects
 */
export function getStoredExecutions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading stored executions:', error);
    return [];
  }
}

/**
 * Save a new simulation execution to localStorage
 * @param {Object} execution - The execution data to save
 * @param {string} execution.processor - Processor name/type
 * @param {string} execution.program - Program name/code
 * @param {string} execution.rob - ROB configuration
 * @param {number} execution.iterations - Number of iterations
 * @param {number} execution.instructions - Number of instructions
 * @param {number} execution.cycles - Number of cycles
 * @param {number} execution.ipc - Instructions per cycle
 * @param {number} execution.cyclesPerIteration - Cycles per iteration
 * @param {string} execution.name - Optional custom name for the execution
 */
export function saveExecution(execution) {
  try {
    const executions = getStoredExecutions();
    
    // Add metadata
    const executionWithMetadata = {
      ...execution,
      id: generateExecutionId(),
      timestamp: new Date().toISOString(),
      name: execution.name || `Run ${executions.length + 1}`
    };
    
    executions.push(executionWithMetadata);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(executions));
    
    return executionWithMetadata;
  } catch (error) {
    console.error('Error saving execution:', error);
    throw error;
  }
}

/**
 * Delete a simulation execution by ID
 * @param {string} executionId - The ID of the execution to delete
 */
export function deleteExecution(executionId) {
  try {
    const executions = getStoredExecutions();
    const filtered = executions.filter(exec => exec.id !== executionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting execution:', error);
    throw error;
  }
}

/**
 * Update the name of a saved execution
 * @param {string} executionId - The ID of the execution to rename
 * @param {string} newName - The new name for the execution
 */
export function renameExecution(executionId, newName) {
  try {
    const executions = getStoredExecutions();
    const execution = executions.find(exec => exec.id === executionId);
    if (execution) {
      execution.name = newName;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(executions));
    }
  } catch (error) {
    console.error('Error renaming execution:', error);
    throw error;
  }
}

/**
 * Clear all stored executions
 */
export function clearAllExecutions() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing executions:', error);
    throw error;
  }
}

/**
 * Generate a unique ID for an execution
 * @returns {string} Unique execution ID
 */
function generateExecutionId() {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get execution statistics for comparison
 * @returns {Object} Statistics about saved executions
 */
export function getExecutionStats() {
  const executions = getStoredExecutions();
  
  if (executions.length === 0) {
    return {
      count: 0,
      avgIpc: 0,
      avgCycles: 0,
      avgCyclesPerIteration: 0
    };
  }
  
  const stats = executions.reduce((acc, exec) => {
    acc.totalIpc += exec.ipc || 0;
    acc.totalCycles += exec.cycles || 0;
    acc.totalCyclesPerIteration += exec.cyclesPerIteration || 0;
    return acc;
  }, { totalIpc: 0, totalCycles: 0, totalCyclesPerIteration: 0 });
  
  return {
    count: executions.length,
    avgIpc: (stats.totalIpc / executions.length).toFixed(2),
    avgCycles: Math.round(stats.totalCycles / executions.length),
    avgCyclesPerIteration: (stats.totalCyclesPerIteration / executions.length).toFixed(2)
  };
}