<template>
  <div class="tutorial-editor">
    <div class="editor-header">
      <h3>Tutorial Editor</h3>
      <button @click="$emit('close')" class="close-btn">&times;</button>
    </div>
    
    <div class="editor-content">
      <div class="tutorial-info">
        <label>
          Tutorial Name:
          <input v-model="tutorial.name" type="text" placeholder="Navigation Tour">
        </label>
        <label>
          Description:
          <textarea v-model="tutorial.description" placeholder="Tutorial description"></textarea>
        </label>
      </div>

      <div class="steps-section">
        <h4>Tutorial Steps</h4>
        <div v-for="(step, index) in tutorial.steps" :key="index" class="step-editor">
          <div class="step-header">
            <span>Step {{ index + 1 }}</span>
            <button @click="removeStep(index)" class="remove-step-btn">Remove</button>
          </div>
          
          <label>
            Title:
            <input v-model="step.title" type="text" placeholder="Step title">
          </label>
          
          <label>
            Description:
            <textarea v-model="step.description" placeholder="Detailed description"></textarea>
          </label>
          
          <label>
            CSS Selector:
            <input v-model="step.selector" type="text" placeholder=".css-class">
            <small>Selectable elements: {{ getSelectableElements() }}</small>
          </label>
          
          <label>
            Tooltip position:
            <select v-model="step.position">
              <option value="bottom">Bottom</option>
              <option value="top">Top</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
          
          <label>
            Action (optional):
            <select v-model="step.action">
              <option value="">No action</option>
              <option value="switchTo:simulationComponent">Go to Simulation</option>
              <option value="switchTo:staticAnalysisComponent">Go to Static Analysis</option>
              <option value="switchTo:timelineComponent">Go to Timeline</option>
              <option value="switchTo:procSettingsComponent">Go to Settings</option>
            </select>
          </label>

          <!-- Validation Section -->
          <div class="validation-section">
            <h5>Validation (optional)</h5>
            <label>
              Validation type:
              <select v-model="step.validationType">
                <option value="">No validation</option>
                <option value="program_selected">Program selected</option>
                <option value="architecture_selected">Architecture selected</option>
                <option value="input_value">Exact input value</option>
                <option value="input_value_min">Minimum input value</option>
                <option value="button_clicked">Button clicked</option>
              </select>
            </label>

            <div v-if="step.validationType" class="validation-details">
              <label v-if="step.validationType === 'program_selected'">
                Program name:
                <input v-model="step.validationValue" type="text" placeholder="rec">
              </label>

              <label v-if="step.validationType === 'architecture_selected'">
                Architecture name:
                <input v-model="step.validationValue" type="text" placeholder="baseline">
              </label>

              <label v-if="step.validationType === 'input_value'">
                Expected exact value:
                <input v-model="step.validationValue" type="text" placeholder="200">
              </label>

              <label v-if="step.validationType === 'input_value' || step.validationType === 'input_value_min'">
                Input selector:
                <input v-model="step.validationSelector" type="text" placeholder="input[name*='rob']">
              </label>

              <label v-if="step.validationType === 'input_value_min'">
                Minimum value:
                <input v-model="step.validationMinValue" type="number" placeholder="100">
              </label>

              <label v-if="step.validationType === 'button_clicked'">
                Button selector:
                <input v-model="step.validationSelector" type="text" placeholder="button:contains('Run')">
              </label>

              <label>
                Error message:
                <input v-model="step.validationMessage" type="text" placeholder="Perform the required action to continue">
              </label>
            </div>
          </div>
        </div>
        
        <button @click="addStep" class="add-step-btn">Add Step</button>
      </div>

      <div class="editor-actions">
        <button @click="previewTutorial" class="preview-btn">Preview</button>
        <button @click="exportAsJSON" class="export-btn">Export JSON</button>
        <button @click="downloadJSON" class="export-btn">Download JSON</button>
      </div>

      <div v-if="exportedContent" class="export-result">
        <h4>JSON Content:</h4>
        <textarea v-model="exportedContent" readonly rows="10"></textarea>
        <p>Copy this content and save it as a <code>.json</code> file in the <code>public/tutorials/</code> folder, then add it to <code>index.json</code></p>
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
.tutorial-editor {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.editor-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.editor-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.tutorial-info {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.tutorial-info label {
  display: block;
  margin-bottom: 15px;
  font-weight: bold;
  color: #333;
}

.tutorial-info input,
.tutorial-info textarea {
  display: block;
  width: 100%;
  margin-top: 5px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

.tutorial-info textarea {
  height: 60px;
  resize: vertical;
}

.steps-section {
  padding: 20px;
}

.steps-section h4 {
  margin: 0 0 20px 0;
  color: #333;
}

.step-editor {
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 15px;
  padding: 15px;
  background: #fafafa;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.step-header span {
  font-weight: bold;
  color: #333;
}

.remove-step-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.remove-step-btn:hover {
  background: #c82333;
}

.step-editor label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  color: #555;
}

.step-editor input,
.step-editor textarea,
.step-editor select {
  display: block;
  width: 100%;
  margin-top: 3px;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-family: inherit;
  font-size: 14px;
}

.step-editor textarea {
  height: 50px;
  resize: vertical;
}

.step-editor small {
  display: block;
  margin-top: 3px;
  color: #666;
  font-size: 11px;
}

.add-step-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.add-step-btn:hover {
  background: #218838;
}

.editor-actions {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  background: #f8f9fa;
}

.preview-btn,
.export-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.preview-btn {
  background: #007acc;
  color: white;
}

.preview-btn:hover {
  background: #005999;
}

.export-btn {
  background: #6c757d;
  color: white;
}

.export-btn:hover {
  background: #5a6268;
}

.export-result {
  padding: 20px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.export-result h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.export-result textarea {
  width: 100%;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.export-result code {
  background: #e9ecef;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.validation-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.validation-section h5 {
  margin: 0 0 10px 0;
  color: #555;
  font-size: 14px;
}

.validation-details {
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.validation-details label {
  margin-bottom: 8px;
  font-size: 13px;
}

.validation-details input,
.validation-details select {
  font-size: 13px;
  padding: 4px;
}
</style>
