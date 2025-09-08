<template>
  <div class="tutorial-editor-overlay">
    <div class="tutorial-editor">
      <!-- Simple header with title and close -->
      <div class="editor-header">
        <h2>Tutorial Editor</h2>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <!-- Main content area -->
      <div class="editor-content">
        <!-- Tutorial basic info -->
        <div class="section">
          <div class="form-group">
            <label>Tutorial Name</label>
            <input v-model="tutorial.name" type="text" placeholder="Enter tutorial name">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="tutorial.description" placeholder="Brief description of the tutorial"></textarea>
          </div>
        </div>

        <!-- Steps section -->
        <div class="section">
          <h3>Steps</h3>
          <div v-for="(step, index) in tutorial.steps" :key="index" class="step-card">
            <div class="step-header">
              <span class="step-number">{{ index + 1 }}</span>
              <button @click="removeStep(index)" class="remove-btn">×</button>
            </div>
            
            <div class="form-group">
              <label>Title</label>
              <input v-model="step.title" type="text" placeholder="Step title">
            </div>
            
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="step.description" placeholder="What happens in this step"></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>CSS Selector</label>
                <input v-model="step.selector" type="text" placeholder=".button, #element">
              </div>
              
              <div class="form-group">
                <label>Position</label>
                <select v-model="step.position">
                  <option value="bottom">Bottom</option>
                  <option value="top">Top</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>Action (optional)</label>
              <select v-model="step.action">
                <option value="">No action</option>
                <option value="switchTo:simulationComponent">Go to Simulation</option>
                <option value="switchTo:staticAnalysisComponent">Go to Static Analysis</option>
                <option value="switchTo:timelineComponent">Go to Timeline</option>
                <option value="switchTo:procSettingsComponent">Go to Settings</option>
              </select>
            </div>

            <!-- Validation Section -->
            <div v-if="step.validationType" class="validation-card">
              <h4>Validation</h4>
              <div class="form-group">
                <label>Type</label>
                <select v-model="step.validationType">
                  <option value="">No validation</option>
                  <option value="program_selected">Program selected</option>
                  <option value="architecture_selected">Architecture selected</option>
                  <option value="input_value">Exact input value</option>
                  <option value="input_value_min">Minimum input value</option>
                  <option value="button_clicked">Button clicked</option>
                </select>
              </div>

              <div v-if="step.validationType" class="validation-details">
                <div v-if="step.validationType === 'program_selected'" class="form-group">
                  <label>Program name</label>
                  <input v-model="step.validationValue" type="text" placeholder="rec">
                </div>

                <div v-if="step.validationType === 'architecture_selected'" class="form-group">
                  <label>Architecture name</label>
                  <input v-model="step.validationValue" type="text" placeholder="baseline">
                </div>

                <div v-if="step.validationType === 'input_value'" class="form-group">
                  <label>Expected value</label>
                  <input v-model="step.validationValue" type="text" placeholder="200">
                </div>

                <div v-if="step.validationType === 'input_value' || step.validationType === 'input_value_min'" class="form-group">
                  <label>Input selector</label>
                  <input v-model="step.validationSelector" type="text" placeholder="input[name*='rob']">
                </div>

                <div v-if="step.validationType === 'input_value_min'" class="form-group">
                  <label>Minimum value</label>
                  <input v-model="step.validationMinValue" type="number" placeholder="100">
                </div>

                <div v-if="step.validationType === 'button_clicked'" class="form-group">
                  <label>Button selector</label>
                  <input v-model="step.validationSelector" type="text" placeholder="button:contains('Run')">
                </div>

                <div class="form-group">
                  <label>Error message</label>
                  <input v-model="step.validationMessage" type="text" placeholder="Complete this action to continue">
                </div>
              </div>
            </div>
            
            <div v-else class="form-group">
              <label>Validation</label>
              <select v-model="step.validationType">
                <option value="">No validation</option>
                <option value="program_selected">Program selected</option>
                <option value="architecture_selected">Architecture selected</option>
                <option value="input_value">Exact input value</option>
                <option value="input_value_min">Minimum input value</option>
                <option value="button_clicked">Button clicked</option>
              </select>
            </div>
          </div>
          
          <button @click="addStep" class="add-step-btn">+ Add Step</button>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button @click="previewTutorial" class="btn-primary">Preview</button>
          <button @click="exportAsJSON" class="btn-secondary">Export JSON</button>
          <button @click="downloadJSON" class="btn-secondary">Download</button>
        </div>

        <!-- Export result -->
        <div v-if="exportedContent" class="export-section">
          <h3>Generated JSON</h3>
          <textarea v-model="exportedContent" readonly></textarea>
          <p class="export-note">Save this as a .json file in public/tutorials/ and add to index.json</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// Emits
const emit = defineEmits(['close', 'preview'])

// State
const tutorial = reactive({
  name: '',
  description: '',
  steps: []
})

const exportedContent = ref('')

// Methods
const addStep = () => {
  tutorial.steps.push({
    title: '',
    description: '',
    selector: '',
    position: 'bottom',
    action: '',
    validationType: '',
    validationValue: '',
    validationSelector: '',
    validationMinValue: '',
    validationMessage: ''
  })
}

const removeStep = (index) => {
  tutorial.steps.splice(index, 1)
}

const getSelectableElements = () => {
  // Return some common selectors users might want to use
  return '.header-title, .processor, .program, .results, button:contains("text")'
}

const previewTutorial = () => {
  if (!tutorial.name || tutorial.steps.length === 0) {
    alert('Add at least a name and one step to preview')
    return
  }
  
  const tutorialData = {
    id: tutorial.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: tutorial.name,
    description: tutorial.description,
    steps: tutorial.steps.filter(step => step.title && step.selector).map(step => {
      const previewStep = {
        title: step.title,
        description: step.description,
        selector: step.selector,
        position: step.position
      }
      
      if (step.action) {
        previewStep.action = step.action
      }
      
      if (step.validationType) {
        previewStep.validation = {
          type: step.validationType,
          message: step.validationMessage || 'Complete this action to continue'
        }
        
        switch (step.validationType) {
          case 'program_selected':
          case 'architecture_selected':
            previewStep.validation.value = step.validationValue
            break
          case 'input_value':
            previewStep.validation.selector = step.validationSelector
            previewStep.validation.value = step.validationValue
            break
          case 'input_value_min':
            previewStep.validation.selector = step.validationSelector
            previewStep.validation.minValue = parseInt(step.validationMinValue)
            break
          case 'button_clicked':
            previewStep.validation.selector = step.validationSelector
            break
        }
      }
      
      return previewStep
    })
  }
  
  emit('preview', tutorialData)
}

const exportAsJSON = () => {
  if (!tutorial.name || tutorial.steps.length === 0) {
    alert('Add at least a name and one step before exporting')
    return
  }
  
  const tutorialData = {
    id: tutorial.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: tutorial.name,
    description: tutorial.description,
    steps: tutorial.steps.filter(step => step.title && step.selector).map(step => {
      const exportStep = {
        title: step.title,
        description: step.description,
        selector: step.selector,
        position: step.position
      }
      
      if (step.action) {
        exportStep.action = step.action
      }
      
        if (step.validationType) {
          exportStep.validation = {
            type: step.validationType,
            message: step.validationMessage || 'Complete this action to continue'
          }
          
          switch (step.validationType) {
          case 'program_selected':
          case 'architecture_selected':
            exportStep.validation.value = step.validationValue
            break
          case 'input_value':
            exportStep.validation.selector = step.validationSelector
            exportStep.validation.value = step.validationValue
            break
          case 'input_value_min':
            exportStep.validation.selector = step.validationSelector
            exportStep.validation.minValue = parseInt(step.validationMinValue)
            break
          case 'button_clicked':
            exportStep.validation.selector = step.validationSelector
            break
        }
      }
      
      return exportStep
    })
  }
  
  exportedContent.value = JSON.stringify(tutorialData, null, 2)
}

const downloadJSON = () => {
  if (!tutorial.name || tutorial.steps.length === 0) {
    alert('Add at least a name and one step before downloading')
    return
  }
  
  const tutorialData = {
    id: tutorial.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: tutorial.name,
    description: tutorial.description,
    steps: tutorial.steps.filter(step => step.title && step.selector).map(step => {
      const exportStep = {
        title: step.title,
        description: step.description,
        selector: step.selector,
        position: step.position
      }
      
      if (step.action) {
        exportStep.action = step.action
      }
      
      if (step.validationType) {
        exportStep.validation = {
          type: step.validationType,
          message: step.validationMessage || 'Complete this action to continue'
        }
        
        switch (step.validationType) {
          case 'program_selected':
          case 'architecture_selected':
            exportStep.validation.value = step.validationValue
            break
          case 'input_value':
            exportStep.validation.selector = step.validationSelector
            exportStep.validation.value = step.validationValue
            break
          case 'input_value_min':
            exportStep.validation.selector = step.validationSelector
            exportStep.validation.minValue = parseInt(step.validationMinValue)
            break
          case 'button_clicked':
            exportStep.validation.selector = step.validationSelector
            break
        }
      }
      
      return exportStep
    })
  }
  
  // Create and download JSON file
  const jsonContent = JSON.stringify(tutorialData, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${tutorialData.id}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Initialize with one empty step
addStep()
</script>

<style scoped>
.tutorial-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.tutorial-editor {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin: auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 30px;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 12px 12px 0 0;
  background: #f9fafb;
}

.editor-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.section {
  padding: 30px 30px;
  border-bottom: 1px solid #f3f4f6;
}

.section:last-child {
  border-bottom: none;
}

.section h3 {
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 140px;
  gap: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  transition: border-color 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  height: 90px;
  resize: vertical;
  line-height: 1.5;
}

.step-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 24px 24px;
  margin-bottom: 20px;
  position: relative;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.step-number {
  background: #3b82f6;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
}

.remove-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background: #dc2626;
}

.validation-card {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 20px 20px;
  margin-top: 20px;
}

.validation-card h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  text-align: center;
}

.validation-details {
  margin-top: 16px;
}

.add-step-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: block;
  margin: 20px auto 0 auto;
}

.add-step-btn:hover {
  background: #059669;
}

.actions {
  padding: 30px 30px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  gap: 16px;
  border-radius: 0 0 12px 12px;
  justify-content: center;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background: #4b5563;
}

.export-section {
  padding: 30px 30px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.export-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  text-align: center;
}

.export-section textarea {
  width: 100%;
  height: 140px;
  padding: 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  background: #f3f4f6;
  color: #374151;
  resize: vertical;
  line-height: 1.4;
  box-sizing: border-box;
}

.export-note {
  margin: 12px 0 0 0;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}
</style>
