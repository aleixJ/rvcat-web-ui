<template>
  <div class="tutorial-editor-overlay">
    <div class="tutorial-editor">
      <!-- Simple header with title and close -->
      <div class="editor-header">
        <div class="header-left">
          <h2>Tutorial Editor</h2>
          <span v-if="hasSavedContent" class="draft-indicator"></span>
        </div>
        <div class="header-right">
          <button v-if="hasSavedContent" @click="clearDraft" class="clear-btn" title="Clear draft and start fresh">
            Clear Draft
          </button>
          <button @click="$emit('close')" class="close-btn">&times;</button>
        </div>
      </div>
      
      <!-- Main content area -->
      <div class="editor-content">
        <!-- Tutorial basic info -->
        <div class="section">
          <div class="form-group">
            <label>Tutorial Name <span class="required">*</span></label>
            <input v-model="tutorial.name" type="text" placeholder="Enter tutorial name">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="tutorial.description" placeholder="Brief description of the tutorial"></textarea>
          </div>
        </div>

        <!-- Steps section -->
        <div class="section">
          <h3>Steps & Questions</h3>
          <div v-for="(step, index) in tutorial.steps" :key="index" class="step-card" :class="{ 'question-card': step.type === 'question' }">
            <div class="step-header">
              <span class="step-number" :class="{ 'question-number': step.type === 'question' }">{{ index + 1 }}</span>
              <div class="step-type-selector">
                <label class="type-radio">
                  <input type="radio" v-model="step.type" value="step" @change="onStepTypeChange(step)">
                  <span>Step</span>
                </label>
                <label class="type-radio">
                  <input type="radio" v-model="step.type" value="question" @change="onStepTypeChange(step)">
                  <span>Question</span>
                </label>
              </div>
              <button @click="removeStep(index)" class="remove-btn">×</button>
            </div>
            
            <div class="form-group">
              <label>Title <span class="required">*</span></label>
              <input v-model="step.title" type="text" :placeholder="step.type === 'question' ? 'Question title' : 'Step title'">
            </div>
            
            <!-- Step-specific fields -->
            <template v-if="step.type === 'step'">
              <div class="form-group">
                <label>Description</label>
                <textarea v-model="step.description" placeholder="What happens in this step"></textarea>
              </div>
              
              <div class="form-group">
                <label>Step Image (optional)</label>
                <div class="image-upload-section">
                  <input type="file" accept="image/*" @change="(e) => handleStepImageUpload(e, step)" class="image-input">
                  <div v-if="step.stepImage" class="image-preview">
                    <img :src="step.stepImage" alt="Step image preview">
                    <button @click="step.stepImage = ''" class="remove-image-btn" type="button">× Remove</button>
                  </div>
                </div>
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
                  <option value="switchTo:processorEditorComponent">Go to Processor</option>
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
            </template>
            
            <!-- Question-specific fields -->
            <template v-else-if="step.type === 'question'">
              <div class="form-group">
                <label>Question Text <span class="required">*</span></label>
                <textarea v-model="step.questionText" placeholder="Enter your question here..."></textarea>
              </div>
              
              <div class="form-group">
                <label>Question Image (optional)</label>
                <div class="image-upload-section">
                  <input type="file" accept="image/*" @change="(e) => handleImageUpload(e, step)" class="image-input">
                  <div v-if="step.questionImage" class="image-preview">
                    <img :src="step.questionImage" alt="Question image preview">
                    <button @click="step.questionImage = ''" class="remove-image-btn" type="button">× Remove</button>
                  </div>
                </div>
              </div>
              
              <div class="form-group">
                <label>Answer Mode <span class="required">*</span></label>
                <div class="answer-mode-selector">
                  <label class="mode-radio">
                    <input type="radio" v-model="step.answerMode" value="single" @change="onAnswerModeChange(step)">
                    <span>Single-choice</span>
                  </label>
                  <label class="mode-radio">
                    <input type="radio" v-model="step.answerMode" value="multiple" @change="onAnswerModeChange(step)">
                    <span>Multiple-choice</span>
                  </label>
                </div>
              </div>
              
              <div class="answers-section">
                <h4>Answers (up to 6) <span class="required">*</span> - {{ step.answerMode === 'single' ? 'Only one must be correct' : 'At least one must be correct' }}</h4>
                <div v-for="(answer, ansIndex) in step.answers" :key="ansIndex" class="answer-card" :class="{ 'correct-answer': answer.isCorrect }">
                  <div class="answer-header">
                    <span class="answer-letter">{{ String.fromCharCode(65 + ansIndex) }}</span>
                    <label class="correct-checkbox">
                      <input type="checkbox" v-model="answer.isCorrect" @change="onCorrectAnswerChange(step, ansIndex)">
                      <span>Correct</span>
                    </label>
                    <button v-if="step.answers.length > 2" @click="removeAnswer(step, ansIndex)" class="remove-answer-btn">×</button>
                  </div>
                  
                  <div class="form-group">
                    <label>Answer Text <span class="required">*</span></label>
                    <input v-model="answer.text" type="text" placeholder="Answer option...">
                  </div>
                  
                  <div class="feedback-group">
                    <div class="form-group">
                      <label v-if="answer.isCorrect">✓ Explanation (shown when user selects this correct answer)</label>
                      <label v-else>✗ Explanation (shown when user selects this wrong answer)</label>
                      <input v-model="answer.explanation" type="text" :placeholder="answer.isCorrect ? 'Great! This is correct because...' : 'This is incorrect because...'">
                    </div>
                  </div>
                </div>
                
                <button v-if="step.answers.length < 6" @click="addAnswer(step)" class="add-answer-btn">+ Add Answer</button>
              </div>
            </template>
          </div>
          
          <div class="add-buttons">
            <button @click="addStep('step')" class="add-step-btn">+ Add Step</button>
            <button @click="addStep('question')" class="add-question-btn">+ Add Question</button>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button @click="previewTutorial" class="btn-primary">Preview</button>
          <button @click="uploadTutorial" class="btn-secondary">Upload</button>
          <button @click="downloadJSON" class="btn-secondary">Download</button>
          <button @click="finishTutorial" class="btn-success">Finish</button>
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
import { ref, reactive, watch, onMounted, computed } from 'vue'

// Emits
const emit = defineEmits(['close', 'preview', 'tutorialFinished'])

// State
const tutorial = reactive({
  name: '',
  description: '',
  steps: []
})

const exportedContent = ref('')

// Auto-save functionality
const STORAGE_KEY = 'tutorial-editor-draft'

// Save tutorial data to localStorage whenever it changes
watch(tutorial, (newTutorial) => {
  if (newTutorial.name || newTutorial.description || newTutorial.steps.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTutorial))
  }
}, { deep: true })

// Load saved tutorial data on mount
onMounted(() => {
  const savedTutorial = localStorage.getItem(STORAGE_KEY)
  if (savedTutorial) {
    try {
      const parsedTutorial = JSON.parse(savedTutorial)
      tutorial.name = parsedTutorial.name || ''
      tutorial.description = parsedTutorial.description || ''
      tutorial.steps = parsedTutorial.steps || []
      
      // If no steps exist, add an empty one
      if (tutorial.steps.length === 0) {
        addStep()
      }
    } catch (err) {
      console.error('Failed to load saved tutorial:', err)
      addStep() // Add empty step as fallback
    }
  } else {
    addStep() // Add empty step for new tutorial
  }
})

// Clear saved data when tutorial is finished or explicitly cleared
const clearSavedData = () => {
  localStorage.removeItem(STORAGE_KEY)
}

// Computed property to check if there's saved content
const hasSavedContent = computed(() => {
  return tutorial.name || tutorial.description || tutorial.steps.some(step => 
    step.title || step.description || step.selector || step.questionText
  )
})

// Clear draft and start fresh
const clearDraft = () => {
  if (confirm('Are you sure you want to clear the current draft? This action cannot be undone.')) {
    tutorial.name = ''
    tutorial.description = ''
    tutorial.steps = []
    addStep() // Add one empty step
    clearSavedData()
  }
}

// Methods
const addStep = (type = 'step') => {
  if (type === 'question') {
    tutorial.steps.push({
      type: 'question',
      title: '',
      questionText: '',
      questionImage: '', // Optional base64 encoded image
      answerMode: 'single',
      answers: [
        { text: '', isCorrect: true, explanation: '' },
        { text: '', isCorrect: false, explanation: '' }
      ]
    })
  } else {
    tutorial.steps.push({
      type: 'step',
      title: '',
      description: '',
      stepImage: '', // Optional base64 encoded image
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
}

const onStepTypeChange = (step) => {
  if (step.type === 'question') {
    // Initialize question fields if not present
    if (!step.questionText) step.questionText = ''
    if (!step.answerMode) step.answerMode = 'single'
    if (!step.answers || step.answers.length === 0) {
      step.answers = [
        { text: '', isCorrect: true, explanation: '' },
        { text: '', isCorrect: false, explanation: '' }
      ]
    }
  } else {
    // Initialize step fields if not present
    if (!step.description) step.description = ''
    if (!step.selector) step.selector = ''
    if (!step.position) step.position = 'bottom'
    if (!step.action) step.action = ''
    if (!step.validationType) step.validationType = ''
  }
}

const onCorrectAnswerChange = (step, changedIndex) => {
  if (step.answerMode === 'single' && step.answers[changedIndex].isCorrect) {
    // For single answer mode, uncheck all other answers
    step.answers.forEach((answer, index) => {
      if (index !== changedIndex) {
        answer.isCorrect = false
      }
    })
  }
  
  // Ensure at least one answer is correct
  ensureOneCorrectAnswer(step)
}

const onAnswerModeChange = (step) => {
  if (step.answerMode === 'single') {
    // When switching to single-choice, keep only the first correct answer
    const correctIndices = step.answers
      .map((a, i) => a.isCorrect ? i : -1)
      .filter(i => i !== -1)
    
    if (correctIndices.length > 1) {
      // Keep only the first correct answer, uncheck the rest
      step.answers.forEach((answer, index) => {
        if (index !== correctIndices[0]) {
          answer.isCorrect = false
        }
      })
    }
  }
  // Ensure at least one answer is correct
  ensureOneCorrectAnswer(step)
}

const ensureOneCorrectAnswer = (step) => {
  const hasCorrect = step.answers.some(a => a.isCorrect)
  if (!hasCorrect && step.answers.length > 0) {
    // If no correct answer, make the first one correct
    step.answers[0].isCorrect = true
  }
}

// Handle image upload and convert to base64
const handleImageUpload = (event, step) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Check file size (limit to 500KB to keep JSON manageable)
  if (file.size > 500 * 1024) {
    alert('Image is too large. Please use an image smaller than 500KB.')
    event.target.value = ''
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    step.questionImage = e.target.result // This is the base64 encoded string
  }
  reader.readAsDataURL(file)
}

// Handle step image upload and convert to base64
const handleStepImageUpload = (event, step) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Check file size (limit to 500KB to keep JSON manageable)
  if (file.size > 500 * 1024) {
    alert('Image is too large. Please use an image smaller than 500KB.')
    event.target.value = ''
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    step.stepImage = e.target.result // This is the base64 encoded string
  }
  reader.readAsDataURL(file)
}

const addAnswer = (step) => {
  if (step.answers.length < 6) {
    step.answers.push({
      text: '',
      isCorrect: false,
      explanation: ''
    })
  }
}

const removeAnswer = (step, index) => {
  if (step.answers.length > 2) {
    step.answers.splice(index, 1)
    // Ensure at least one answer remains correct after removal
    ensureOneCorrectAnswer(step)
  }
}

const removeStep = (index) => {
  tutorial.steps.splice(index, 1)
}

const getSelectableElements = () => {
  // Return some common selectors users might want to use
  return '.header-title, .processor, .program, .results, button:contains("text")'
}

const previewTutorial = () => {
  const validationErrors = validateTutorial()
  if (validationErrors.length > 0) {
    alert('Please fix the following errors:\n\n' + validationErrors.join('\n'))
    return
  }
  
  const tutorialData = {
    id: tutorial.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: tutorial.name,
    description: tutorial.description,
    steps: tutorial.steps.filter(step => step.title && (step.type === 'question' || step.selector)).map(step => {
      // Handle question type
      if (step.type === 'question') {
        const questionStep = {
          type: 'question',
          title: step.title,
          questionText: step.questionText,
          answerMode: step.answerMode,
          answers: step.answers.filter(a => a.text).map(answer => ({
            text: answer.text,
            isCorrect: answer.isCorrect,
            explanation: answer.explanation || ''
          }))
        }
        if (step.questionImage) {
          questionStep.questionImage = step.questionImage
        }
        return questionStep
      }
      
      // Handle step type
      const previewStep = {
        type: 'step',
        title: step.title,
        description: step.description,
        selector: step.selector,
        position: step.position
      }
      
      if (step.stepImage) {
        previewStep.stepImage = step.stepImage
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

const uploadTutorial = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.style.display = 'none'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const tutorialData = JSON.parse(text)
      
      // Validate the uploaded tutorial
      if (!tutorialData.name || !tutorialData.steps || !Array.isArray(tutorialData.steps)) {
        alert('Invalid tutorial file format')
        return
      }
      
      // Load the tutorial data into the editor
      tutorial.name = tutorialData.name || ''
      tutorial.description = tutorialData.description || ''
      tutorial.steps = []
      
      // Convert steps to editor format
      tutorialData.steps.forEach(step => {
        if (step.type === 'question') {
          // Handle question type
          const editorStep = {
            type: 'question',
            title: step.title || '',
            questionText: step.questionText || '',
            questionImage: step.questionImage || '',
            answerMode: step.answerMode || 'single',
            answers: (step.answers || []).map(answer => ({
              text: answer.text || '',
              isCorrect: answer.isCorrect || false,
              explanation: answer.explanation || ''
            }))
          }
          
          // Ensure at least 2 answers
          while (editorStep.answers.length < 2) {
            editorStep.answers.push({
              text: '',
              isCorrect: false,
              explanation: ''
            })
          }
          
          // Ensure at least one answer is correct
          if (!editorStep.answers.some(a => a.isCorrect)) {
            editorStep.answers[0].isCorrect = true
          }
          
          tutorial.steps.push(editorStep)
        } else {
          // Handle step type
          const editorStep = {
            type: 'step',
            title: step.title || '',
            description: step.description || '',
            stepImage: step.stepImage || '',
            selector: step.selector || '',
            position: step.position || 'bottom',
            action: step.action || '',
            validationType: '',
            validationValue: '',
            validationSelector: '',
            validationMinValue: '',
            validationMessage: ''
          }
          
          // Handle validation if present
          if (step.validation) {
            editorStep.validationType = step.validation.type || ''
            editorStep.validationMessage = step.validation.message || ''
            editorStep.validationValue = step.validation.value || ''
            editorStep.validationSelector = step.validation.selector || ''
            editorStep.validationMinValue = step.validation.minValue || ''
          }
          
          tutorial.steps.push(editorStep)
        }
      })
      
      alert('Tutorial loaded successfully!')
    } catch (err) {
      console.error('Failed to load tutorial:', err)
      alert('Failed to load tutorial file. Please check the file format.')
    }
  }
  
  document.body.appendChild(input)
  input.click()
  document.body.removeChild(input)
}

// Validate all mandatory fields
const validateTutorial = () => {
  const errors = []
  
  // Check tutorial name
  if (!tutorial.name || !tutorial.name.trim()) {
    errors.push('• Tutorial Name is required')
  }
  
  // Check if there's at least one step
  if (tutorial.steps.length === 0) {
    errors.push('• At least one step or question is required')
  }
  
  // Validate each step
  tutorial.steps.forEach((step, index) => {
    const stepNum = index + 1
    
    // Title is required for all steps/questions
    if (!step.title || !step.title.trim()) {
      errors.push(`• Step ${stepNum}: Title is required`)
    }
    
    if (step.type === 'question') {
      // Question-specific validations
      if (!step.questionText || !step.questionText.trim()) {
        errors.push(`• Step ${stepNum}: Question Text is required`)
      }
      
      if (!step.answerMode) {
        errors.push(`• Step ${stepNum}: Answer Mode is required`)
      }
      
      // Check answers
      const validAnswers = step.answers?.filter(a => a.text && a.text.trim()) || []
      if (validAnswers.length < 2) {
        errors.push(`• Step ${stepNum}: At least 2 answers with text are required`)
      }
      
      // Check correct answers based on mode
      const correctAnswers = step.answers?.filter(a => a.isCorrect && a.text && a.text.trim()) || []
      if (step.answerMode === 'single') {
        if (correctAnswers.length !== 1) {
          errors.push(`• Step ${stepNum}: Single-choice mode requires exactly one correct answer`)
        }
      } else {
        if (correctAnswers.length === 0) {
          errors.push(`• Step ${stepNum}: At least one answer must be marked as correct`)
        }
      }
    } else {
      // Step-specific validations - selector is required for steps
      if (!step.selector || !step.selector.trim()) {
        errors.push(`• Step ${stepNum}: CSS Selector is required`)
      }
    }
  })
  
  return errors
}

const finishTutorial = () => {
  const validationErrors = validateTutorial()
  if (validationErrors.length > 0) {
    alert('Please fix the following errors:\n\n' + validationErrors.join('\n'))
    return
  }
  
  // Download the tutorial file before finishing
  downloadJSON()
  
  const tutorialData = {
    id: tutorial.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: tutorial.name,
    description: tutorial.description,
    steps: tutorial.steps.filter(step => step.title && (step.type === 'question' || step.selector)).map(step => {
      // Handle question type
      if (step.type === 'question') {
        const questionStep = {
          type: 'question',
          title: step.title,
          questionText: step.questionText,
          answerMode: step.answerMode,
          answers: step.answers.filter(a => a.text).map(answer => ({
            text: answer.text,
            isCorrect: answer.isCorrect,
            explanation: answer.explanation || ''
          }))
        }
        if (step.questionImage) {
          questionStep.questionImage = step.questionImage
        }
        return questionStep
      }
      
      // Handle step type
      const finishedStep = {
        type: 'step',
        title: step.title,
        description: step.description,
        selector: step.selector,
        position: step.position
      }
      
      if (step.stepImage) {
        finishedStep.stepImage = step.stepImage
      }
      
      if (step.action) {
        finishedStep.action = step.action
      }
      
      if (step.validationType) {
        finishedStep.validation = {
          type: step.validationType,
          message: step.validationMessage || 'Complete this action to continue'
        }
        
        switch (step.validationType) {
          case 'program_selected':
          case 'architecture_selected':
            finishedStep.validation.value = step.validationValue
            break
          case 'input_value':
            finishedStep.validation.selector = step.validationSelector
            finishedStep.validation.value = step.validationValue
            break
          case 'input_value_min':
            finishedStep.validation.selector = step.validationSelector
            finishedStep.validation.minValue = parseInt(step.validationMinValue)
            break
          case 'button_clicked':
            finishedStep.validation.selector = step.validationSelector
            break
        }
      }
      
      return finishedStep
    })
  }
  
  // Emit the finished tutorial to add it to the menu
  emit('tutorialFinished', tutorialData)
  
  // Clear saved data since tutorial is finished
  clearSavedData()
  
  alert('Tutorial finished! It has been added to the tutorial menu.')
  emit('close')
}

const downloadJSON = () => {
  const validationErrors = validateTutorial()
  if (validationErrors.length > 0) {
    alert('Please fix the following errors:\n\n' + validationErrors.join('\n'))
    return
  }
  
  const tutorialData = {
    id: tutorial.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: tutorial.name,
    description: tutorial.description,
    steps: tutorial.steps.filter(step => step.title && (step.type === 'question' || step.selector)).map(step => {
      // Handle question type
      if (step.type === 'question') {
        const questionStep = {
          type: 'question',
          title: step.title,
          questionText: step.questionText,
          answerMode: step.answerMode,
          answers: step.answers.filter(a => a.text).map(answer => ({
            text: answer.text,
            isCorrect: answer.isCorrect,
            explanation: answer.explanation || ''
          }))
        }
        if (step.questionImage) {
          questionStep.questionImage = step.questionImage
        }
        return questionStep
      }
      
      // Handle step type
      const exportStep = {
        type: 'step',
        title: step.title,
        description: step.description,
        selector: step.selector,
        position: step.position
      }
      
      if (step.stepImage) {
        exportStep.stepImage = step.stepImage
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

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.editor-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
}

.draft-indicator {
  background: #10b981;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.clear-btn {
  background: #ef4444;
  color: white;
  border: none;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background: #dc2626;
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

.required {
  color: #ef4444;
  font-weight: 600;
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
}

.add-step-btn:hover {
  background: #059669;
}

.add-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.add-question-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-question-btn:hover {
  background: #7c3aed;
}

/* Step type selector */
.step-type-selector {
  display: flex;
  gap: 16px;
}

.type-radio {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.type-radio input {
  width: auto;
  margin: 0;
  cursor: pointer;
}

/* Question card styles */
.question-card {
  background: #f5f3ff;
  border-color: #8b5cf6;
}

.question-number {
  background: #8b5cf6 !important;
}

/* Answer mode selector */
.answer-mode-selector {
  display: flex;
  gap: 24px;
  margin-top: 8px;
}

.mode-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.mode-radio input {
  width: auto;
  margin: 0;
  cursor: pointer;
}

/* Image upload section */
.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-input {
  padding: 8px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.image-input:hover {
  border-color: #3b82f6;
}

.image-preview {
  position: relative;
  display: inline-block;
  max-width: 300px;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.remove-image-btn:hover {
  background: #dc2626;
}

/* Answers section */
.answers-section {
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.answers-section h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.answer-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.answer-card.correct-answer {
  background: #ecfdf5;
  border-color: #10b981;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.answer-letter {
  background: #6b7280;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
}

.correct-answer .answer-letter {
  background: #10b981;
}

.correct-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  margin-left: auto;
}

.correct-checkbox input {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.remove-answer-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.remove-answer-btn:hover {
  background: #dc2626;
}

.feedback-group {
  margin-top: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  border: 1px dashed #d1d5db;
}

.feedback-group .form-group {
  margin-bottom: 12px;
}

.feedback-group .form-group:last-child {
  margin-bottom: 0;
}

.feedback-group label {
  font-size: 12px;
  color: #6b7280;
}

.add-answer-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: block;
  width: 100%;
}

.add-answer-btn:hover {
  background: #4b5563;
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

.btn-success {
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-success:hover {
  background: #059669;
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
