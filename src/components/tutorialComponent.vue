<template>
  <div class="tutorial-system">
    
    <!-- Tutorial Overlay for Steps -->
    <div v-if="currentTutorial && isActive && !isQuestionStep" class="tutorial-overlay">
      <!-- Tooltip -->
      <div class="tutorial-tooltip" :style="tooltipStyle">
        <div class="tutorial-content">
          <h3 v-html="currentStep?.title"></h3>
          <p class="step-description" v-html="currentStep?.description"></p>
          <div v-if="currentStep?.stepImage" class="step-image" @click="openLightbox(currentStep.stepImage)">
            <img :src="currentStep.stepImage" alt="Step image">
            <span class="image-hint">Click to enlarge</span>
          </div>
          <div class="tutorial-actions">
            <button @click="previousStep" :disabled="stepIndex === 0" class="tutorial-btn">
              Previous
            </button>
            <span class="tutorial-progress">
              {{ stepIndex + 1 }} / {{ currentTutorial.steps.length }}
            </span>
            <button v-if="stepIndex < currentTutorial.steps.length - 1" 
                    @click="nextStep" 
                    :disabled="!canProceed"
                    :class="['tutorial-btn', canProceed ? 'tutorial-btn-primary' : 'tutorial-btn-disabled']">
              Next
            </button>
            <button v-else 
                    @click="completeTutorial" 
                    :disabled="!canProceed"
                    :class="['tutorial-btn', canProceed ? 'tutorial-btn-primary' : 'tutorial-btn-disabled']">
              Finish
            </button>
          </div>
        </div>
        <button @click="closeTutorial" class="tutorial-close">&times;</button>
      </div>
    </div>

    <!-- Question Overlay (centered like tutorial editor) -->
    <div v-if="currentTutorial && isActive && isQuestionStep" class="question-overlay">
      <div class="question-panel">
        <button @click="closeTutorial" class="question-close">&times;</button>
        
        <div class="question-header">
          <span class="question-badge">Question {{ stepIndex + 1 }} / {{ currentTutorial.steps.length }}</span>
          <h2 v-html="currentStep?.title"></h2>
        </div>
        
        <div class="question-body">
          <p class="question-text" v-html="currentStep?.questionText"></p>
          
          <div v-if="currentStep?.questionImage" class="question-image" @click="openLightbox(currentStep.questionImage)">
            <img :src="currentStep.questionImage" alt="Question image">
            <span class="image-hint">Click to enlarge</span>
          </div>
          
          <div class="question-mode-info">
            <span v-if="currentStep?.answerMode === 'single'">Select ONE correct answer</span>
            <span v-else>Select ALL correct answers</span>
          </div>
          
          <div class="answers-list">
            <div v-for="(answer, index) in shuffledAnswers" :key="answer.originalIndex" class="answer-wrapper">
              <button 
                @click="selectAnswer(answer.originalIndex)"
                :class="getAnswerClass(answer.originalIndex)"
                :disabled="questionAnswered && isQuestionCorrect"
              >
                <span class="answer-letter">{{ String.fromCharCode(65 + index) }}</span>
                <span class="answer-text" v-html="answer.text"></span>
                <span v-if="questionAnswered && isQuestionCorrect && answer.isCorrect" class="answer-indicator correct">✓</span>
                <span v-if="questionAnswered && !isQuestionCorrect && selectedAnswers.includes(answer.originalIndex) && !answer.isCorrect" class="answer-indicator wrong">✗</span>
                <span v-if="questionAnswered && !isQuestionCorrect && selectedAnswers.includes(answer.originalIndex) && answer.isCorrect" class="answer-indicator partial-correct">✓</span>
              </button>
              <!-- Inline feedback below each answer -->
              <div v-if="questionAnswered && selectedAnswers.includes(answer.originalIndex) && answer.explanation" 
                   :class="['answer-feedback', answer.isCorrect ? 'feedback-correct' : 'feedback-wrong']"
                   v-html="answer.explanation">
              </div>
            </div>
          </div>
          
          <!-- Summary message section -->
          <div v-if="questionAnswered" class="feedback-section">
            <div v-if="isQuestionCorrect" class="feedback-box feedback-correct">
              <h4>✓ Correct!</h4>
            </div>
            <div v-else class="feedback-box feedback-wrong">
              <h4>✗ {{ getErrorMessage() }}</h4>
            </div>
          </div>
        </div>
        
        <div class="question-actions">
          <button @click="previousStep" :disabled="stepIndex === 0" class="tutorial-btn">
            Previous
          </button>
          
          <button v-if="!questionAnswered" 
                  @click="submitAnswer" 
                  :disabled="selectedAnswers.length === 0"
                  class="tutorial-btn tutorial-btn-primary">
            Submit Answer
          </button>
          
          <button v-else-if="!isQuestionCorrect"
                  @click="retryQuestion"
                  class="tutorial-btn tutorial-btn-retry">
            Try Again
          </button>
          
          <button v-else-if="stepIndex < currentTutorial.steps.length - 1" 
                  @click="nextStep" 
                  class="tutorial-btn tutorial-btn-primary">
            Next
          </button>
          <button v-else 
                  @click="completeTutorial" 
                  class="tutorial-btn tutorial-btn-primary">
            Finish
          </button>
        </div>
      </div>
    </div>

    <!-- Image Lightbox Popup -->
    <div v-if="showLightbox" class="lightbox-overlay" @click="closeLightbox">
      <div class="lightbox-content" @click.stop>
        <button class="lightbox-close" @click="closeLightbox">&times;</button>
        <img :src="lightboxImage" alt="Enlarged image">
      </div>
    </div>

    <!-- Tutorial Launcher Button -->
    <div v-if="!isActive" class="tutorial-launcher">
      <button @click="toggleTutorialMenu" class="tutorial-launcher-btn">
        <span class="tutorial-icon">?</span>
      </button>
      
      <!-- Tutorial Menu -->
      <div v-if="showTutorialMenu" class="tutorial-menu">
        <h4>Available Tutorials</h4>
        
        <!-- Show resume option if there's a paused tutorial -->
        <div v-if="currentTutorial" class="tutorial-paused-section">
          <div class="tutorial-paused-header">
            <h5>📚 Tutorial in Progress</h5>
            <p class="tutorial-paused-info" v-html="currentTutorial.name"></p>
          </div>
          
          <div class="tutorial-action-buttons">
            <button @click="resumeTutorial" class="tutorial-action-btn tutorial-resume-btn">
              <div class="tutorial-action-icon">▶️</div>
              <div class="tutorial-action-content">
                <strong>Resume</strong>
                <span>Step {{ stepIndex + 1 }} of {{ currentTutorial.steps.length }}</span>
              </div>
            </button>
            
            <button @click="stopTutorial" class="tutorial-action-btn tutorial-stop-btn">
              <div class="tutorial-action-icon">⏹️</div>
              <div class="tutorial-action-content">
                <strong>Stop</strong>
                <span>Start fresh</span>
              </div>
            </button>
          </div>
          
          <div class="tutorial-menu-separator"></div>
        </div>
        
        <div v-if="isLoading" class="tutorial-loading">
          Loading tutorials...
        </div>
        <div v-else class="tutorial-list">
          <button 
            v-for="tutorial in availableTutorials" 
            :key="tutorial.id"
            @click="startTutorial(tutorial.id)"
            class="tutorial-menu-item"
          >
            <div class="tutorial-item-content">
              <strong v-html="tutorial.name"></strong>
              <p v-html="tutorial.description"></p>
            </div>
          </button>
          
          <div class="tutorial-menu-separator"></div>
          
          <button @click="showEditor = true" class="tutorial-menu-item tutorial-create-item">
            <div class="tutorial-item-content">
              <strong>+ Create New Tutorial</strong>
              <p>Use the visual editor to create a custom tutorial</p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Tutorial Editor -->
    <tutorialEditor 
      v-if="showEditor" 
      @close="showEditor = false"
      @preview="previewCustomTutorial"
      @tutorialFinished="addFinishedTutorial"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import tutorialEditor from './tutorialEditor.vue'

// Props
const props = defineProps({
  activeView: String
})

// Emits
const emit = defineEmits(['requestSwitch'])

// Local storage key for tutorial progress
const TUTORIAL_PROGRESS_KEY = 'rvcat-tutorial-progress'

// State
const isActive = ref(false)
const showTutorialMenu = ref(false)
const showEditor = ref(false)
const currentTutorial = ref(null)
const stepIndex = ref(0)
const highlightElement = ref(null)
const availableTutorials = ref([])
const isLoading = ref(false)
const originalScrollPosition = ref({ x: 0, y: 0 })
const validationState = ref({})

// Question-specific state
const selectedAnswers = ref([])
const questionAnswered = ref(false)
const shuffledAnswerIndices = ref([]) // Maps display index to original index

// Button click tracking for validation
const clickedButtons = ref(new Set())

// Lightbox state for image popup
const lightboxImage = ref('')
const showLightbox = ref(false)

const openLightbox = (imageSrc) => {
  lightboxImage.value = imageSrc
  showLightbox.value = true
}

const closeLightbox = () => {
  showLightbox.value = false
  lightboxImage.value = ''
}

// Shuffle answers using Fisher-Yates algorithm with Math.random()
const shuffleAnswers = () => {
  if (!currentStep.value || currentStep.value.type !== 'question') {
    shuffledAnswerIndices.value = []
    return
  }
  const answers = currentStep.value.answers || []
  const indices = answers.map((_, i) => i)
  // Fisher-Yates shuffle using Math.random()
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  shuffledAnswerIndices.value = indices
}

// Utility functions
const isElementVisible = (element) => {
  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight || document.documentElement.clientHeight
  const windowWidth = window.innerWidth || document.documentElement.clientWidth
  
  // Check if element is at least partially visible
  return (
    rect.top < windowHeight &&
    rect.bottom > 0 &&
    rect.left < windowWidth &&
    rect.right > 0
  )
}

const saveScrollPosition = () => {
  originalScrollPosition.value = {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  }
}

const restoreScrollPosition = () => {
  window.scrollTo({
    left: originalScrollPosition.value.x,
    top: originalScrollPosition.value.y,
    behavior: 'smooth'
  })
}

// Local Storage functions
const saveTutorialProgress = () => {
  if (currentTutorial.value) {
    const progressData = {
      tutorialId: currentTutorial.value.id,
      tutorialName: currentTutorial.value.name,
      stepIndex: stepIndex.value,
      totalSteps: currentTutorial.value.steps.length,
      timestamp: new Date().toISOString()
    }
    
    try {
      localStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(progressData))
      console.log('✅ Tutorial progress saved:', progressData)
    } catch (error) {
      console.error('❌ Error saving tutorial progress:', error)
    }
  }
}

const loadTutorialProgress = () => {
  try {
    const savedData = localStorage.getItem(TUTORIAL_PROGRESS_KEY)
    if (savedData) {
      const progressData = JSON.parse(savedData)
      console.log('Loaded tutorial progress:', progressData)
      return progressData
    }
  } catch (error) {
    console.error('❌ Error loading tutorial progress:', error)
  }
  return null
}

const clearTutorialProgress = () => {
  try {
    localStorage.removeItem(TUTORIAL_PROGRESS_KEY)
    console.log('Tutorial progress cleared')
  } catch (error) {
    console.error('❌ Error clearing tutorial progress:', error)
  }
}

// Load tutorials
const loadTutorials = async () => {
  console.log('🔄 Loading tutorials...')
  try {
    isLoading.value = true
    console.log('isLoading set to true')
    
    // Try multiple paths
    const basePaths = ['', '/rvcat-web-ui']
    let indexData = null
    let workingBasePath = null
    
    for (const basePath of basePaths) {
      try {
        console.log(`Trying base path: "${basePath}"`)
        const indexResponse = await fetch(`${basePath}/tutorials/index.json`)
        console.log(`Index response status: ${indexResponse.status}`)
        
        if (indexResponse.ok) {
          indexData = await indexResponse.json()
          workingBasePath = basePath
          console.log(`✅ Index loaded successfully with base path: "${basePath}"`)
          break
        }
      } catch (e) {
        console.log(`❌ Failed with base path "${basePath}":`, e.message)
      }
    }
    
    if (!indexData) {
      throw new Error('Could not load tutorial index from any base path')
    }
    
    console.log('Index loaded:', indexData)
    
    // Load each tutorial
    const tutorials = []
    for (const tutorialFile of indexData.tutorials) {
      console.log(`Loading tutorial file: ${tutorialFile}`)
      
      try {
        const tutorialResponse = await fetch(`${workingBasePath}/tutorials/${tutorialFile}`)
        console.log(`Tutorial response status: ${tutorialResponse.status}`)
        
        if (!tutorialResponse.ok) {
          console.error(`❌ Failed to load tutorial: ${tutorialFile}, status: ${tutorialResponse.status}`)
          continue
        }
        
        const tutorial = await tutorialResponse.json()
        console.log(`✅ Loaded tutorial: ${tutorial.name}`)
        
        // Process actions in steps
        tutorial.steps = tutorial.steps.map(step => {
          if (step.action && typeof step.action === 'string') {
            const [actionType, param] = step.action.split(':')
            if (actionType === 'switchTo') {
              step.action = () => emit('requestSwitch', param)
            }
          }
          return step
        })
        
        tutorials.push(tutorial)
      } catch (tutorialError) {
        console.error('Error loading individual tutorial:', tutorialFile, tutorialError)
      }
    }
    
    availableTutorials.value = tutorials
    console.log('All tutorials loaded successfully:', tutorials.length)
  } catch (error) {
    console.error('Error loading tutorials:', error)
    // Fallback tutorials
    availableTutorials.value = [
      {
        id: 'fallback-tutorial',
        name: '⚠️ Error - Fallback Tutorial',
        description: 'Error loading tutorials. This is a test tutorial.',
        steps: [
          {
            title: 'Loading Error',
            description: 'Tutorials could not be loaded correctly, but this system works.',
            selector: '.header-title',
            position: 'bottom'
          }
        ]
      },
      {
        id: 'test-basic',
        name: 'Basic Test',
        description: 'Test tutorial to verify functionality',
        steps: [
          {
            title: 'Test OK',
            description: 'If you see this, the tutorial system works correctly.',
            selector: '.header-title',
            position: 'bottom'
          }
        ]
      }
    ]
    console.log('Using fallback tutorials')
  } finally {
    isLoading.value = false
    console.log('Loading finished. isLoading:', isLoading.value)
    console.log('Final availableTutorials count:', availableTutorials.value.length)
    console.log('Available tutorial names:', availableTutorials.value.map(t => t.name))
  }
}

// Computed
const currentStep = computed(() => {
  if (!currentTutorial.value || stepIndex.value >= currentTutorial.value.steps.length) {
    return null
  }
  return currentTutorial.value.steps[stepIndex.value]
})

// Check if current step is a question
const isQuestionStep = computed(() => {
  return currentStep.value?.type === 'question'
})

// Check if question is answered correctly
const isQuestionCorrect = computed(() => {
  if (!currentStep.value || currentStep.value.type !== 'question') return false
  
  const answers = currentStep.value.answers || []
  const correctIndices = answers.map((a, i) => a.isCorrect ? i : -1).filter(i => i !== -1)
  
  if (currentStep.value.answerMode === 'single') {
    // Single mode: exactly one correct answer must be selected
    return selectedAnswers.value.length === 1 && 
           correctIndices.includes(selectedAnswers.value[0])
  } else {
    // Multiple mode: all correct answers must be selected and no wrong ones
    const hasAllCorrect = correctIndices.every(i => selectedAnswers.value.includes(i))
    const hasNoWrong = selectedAnswers.value.every(i => correctIndices.includes(i))
    return hasAllCorrect && hasNoWrong
  }
})

// Shuffled answers for display
const shuffledAnswers = computed(() => {
  if (!currentStep.value || currentStep.value.type !== 'question') return []
  const answers = currentStep.value.answers || []
  if (shuffledAnswerIndices.value.length === 0) return answers.map((a, i) => ({ ...a, originalIndex: i }))
  return shuffledAnswerIndices.value.map(originalIndex => ({
    ...answers[originalIndex],
    originalIndex
  }))
})

const canProceed = computed(() => {
  if (!currentStep.value || !currentStep.value.validation) return true
  
  // Use reactive validation state that updates in real-time
  const validation = currentStep.value.validation
  const stepKey = `${currentTutorial.value?.id || 'unknown'}-${stepIndex.value}`
  
  // Force reactivity by accessing validationState
  validationState.value
  
  try {
    switch (validation.type) {
      case 'program_selected': {
        const selectedProgram = document.querySelector('#programs-list')?.value
        return selectedProgram === validation.value
      }
      case 'architecture_selected': {
        const selectedArch = document.querySelector('#processors-list')?.value
        return selectedArch === validation.value
      }
      case 'input_value': {
        const input = document.querySelector(validation.selector)
        return input?.value === validation.value
      }
      case 'input_value_min': {
        const input = document.querySelector(validation.selector)
        const value = parseInt(input?.value)
        return !isNaN(value) && value >= validation.minValue
      }
      case 'button_clicked': {
        // Check if this specific button was clicked
        const selector = validation.selector?.trim()
        return selector && clickedButtons.value.has(selector)
      }
      default:
        return true
    }
  } catch (error) {
    console.warn('Error checking validation state:', error)
    return true // Default to allowing progression if check fails
  }
})

const tooltipStyle = computed(() => {
  // Force reactivity on window changes (resize, zoom, scroll)
  tooltipPositionTrigger.value
  
  if (!highlightElement.value || !currentStep.value) return { display: 'none' }
  
  const rect = highlightElement.value.getBoundingClientRect()
  const position = currentStep.value.position || 'bottom'
  const tooltipWidth = 300
  const tooltipHeight = 200 // Approx estimation
  
  let top, left
  
  // Better centering for select and input elements
  const isSelectOrInput = highlightElement.value.tagName === 'SELECT' || 
                         highlightElement.value.tagName === 'INPUT'
  
  switch (position) {
    case 'top':
      top = rect.top - tooltipHeight - 15
      left = rect.left + (rect.width / 2) - (tooltipWidth / 2)
      break
    case 'bottom':
      top = rect.bottom + 15
      left = rect.left + (rect.width / 2) - (tooltipWidth / 2)
      break
    case 'left':
      top = rect.top + (rect.height / 2) - (tooltipHeight / 2)
      left = rect.left - tooltipWidth - 15
      break
    case 'right':
      top = rect.top + (rect.height / 2) - (tooltipHeight / 2)
      left = rect.right + 15
      // For selects and inputs, slightly adjust vertical position
      if (isSelectOrInput) {
        top = rect.top + (rect.height / 2) - (tooltipHeight / 3)
      }
      break
    default:
      top = rect.bottom + 15
      left = rect.left + (rect.width / 2) - (tooltipWidth / 2)
  }
  
  // Ensure tooltip stays within viewport with better margins
  const margin = 25
  if (left < margin) left = margin
  if (left > window.innerWidth - tooltipWidth - margin) {
    left = window.innerWidth - tooltipWidth - margin
  }
  if (top < margin) top = margin
  if (top > window.innerHeight - tooltipHeight - margin) {
    top = window.innerHeight - tooltipHeight - margin
  }
  
  return {
    top: `${top}px`,
    left: `${left}px`
  }
})

// Methods
const startTutorial = (tutorialId) => {
  const tutorial = availableTutorials.value.find(t => t.id === tutorialId)
  if (!tutorial) return
  
  // Save current scroll position before starting tutorial
  saveScrollPosition()
  
  currentTutorial.value = tutorial
  
  // Check if there's saved progress for this tutorial
  const savedProgress = loadTutorialProgress()
  if (savedProgress && savedProgress.tutorialId === tutorialId) {
    // Resume from saved step
    stepIndex.value = savedProgress.stepIndex
    console.log(`🔄 Auto-resuming tutorial "${tutorial.name}" from step ${savedProgress.stepIndex + 1}`)
  } else {
    // Start from beginning
    stepIndex.value = 0
    console.log(`🎯 Starting tutorial "${tutorial.name}" from the beginning`)
  }
  
  // Reset question state
  selectedAnswers.value = []
  questionAnswered.value = false
  
  // Reset button click tracking and set up listeners
  clickedButtons.value = new Set()
  setupButtonClickTracking()
  
  isActive.value = true
  showTutorialMenu.value = false
  
  // Shuffle answers if starting on a question step
  nextTick(() => {
    shuffleAnswers()
  })
  
  // Save current progress
  saveTutorialProgress()
  
  nextTick(async () => {
    await highlightCurrentStep()
  })
}

const nextStep = async () => {
  if (stepIndex.value < currentTutorial.value.steps.length - 1) {
    // Check validation if exists for current step (non-question steps)
    if (currentStep.value.type !== 'question' && currentStep.value.validation && !await validateCurrentStep()) {
      return // Don't advance if validation fails
    }
    
    stepIndex.value++
    
    // Reset question state for new step
    selectedAnswers.value = []
    questionAnswered.value = false
    shuffleAnswers()
    
    // Save progress after advancing to next step
    saveTutorialProgress()
    
    await nextTick()
    await highlightCurrentStep()
  }
}

// Question handling methods
const selectAnswer = (index) => {
  if (questionAnswered.value) return
  
  if (currentStep.value.answerMode === 'single') {
    // Single mode: replace selection
    selectedAnswers.value = [index]
  } else {
    // Multiple mode: toggle selection
    const idx = selectedAnswers.value.indexOf(index)
    if (idx === -1) {
      selectedAnswers.value.push(index)
    } else {
      selectedAnswers.value.splice(idx, 1)
    }
  }
}

const submitAnswer = () => {
  if (selectedAnswers.value.length === 0) return
  questionAnswered.value = true
}

const retryQuestion = () => {
  // Reset question state to allow user to try again
  selectedAnswers.value = []
  questionAnswered.value = false
}

const getAnswerClass = (index) => {
  const classes = ['answer-option']
  
  if (selectedAnswers.value.includes(index)) {
    classes.push('selected')
  }
  
  if (questionAnswered.value) {
    const answer = currentStep.value.answers[index]
    if (isQuestionCorrect.value) {
      // Fully correct - show all correct answers in green
      if (answer.isCorrect) {
        classes.push('correct')
      }
    } else {
      // Not fully correct
      if (selectedAnswers.value.includes(index)) {
        if (answer.isCorrect) {
          // Selected a correct answer (partial correct for multiple mode)
          classes.push('partial-correct')
        } else {
          // Selected a wrong answer
          classes.push('wrong')
        }
      }
    }
  }
  
  return classes
}

const getErrorMessage = () => {
  if (!currentStep.value || !questionAnswered.value || isQuestionCorrect.value) return ''
  
  const answers = currentStep.value.answers || []
  const correctIndices = answers.map((a, i) => a.isCorrect ? i : -1).filter(i => i !== -1)
  
  // Check what went wrong
  const selectedCorrect = selectedAnswers.value.filter(i => correctIndices.includes(i))
  const selectedWrong = selectedAnswers.value.filter(i => !correctIndices.includes(i))
  
  if (currentStep.value.answerMode === 'single') {
    // Single mode - wrong answer selected
    return 'Incorrect answer. Try again!'
  } else {
    // Multiple mode
    if (selectedWrong.length > 0 && selectedCorrect.length === 0) {
      return 'Wrong answer selected. Try again!'
    } else if (selectedWrong.length > 0 && selectedCorrect.length > 0) {
      return 'You selected some correct answers, but also wrong ones. Try again!'
    } else if (selectedCorrect.length > 0 && selectedCorrect.length < correctIndices.length) {
      return 'Not all correct answers selected. Try again!'
    } else {
      return 'Try again!'
    }
  }
}

// Validation logic
const validateCurrentStep = async () => {
  const validation = currentStep.value.validation
  if (!validation) return true
  
  try {
    switch (validation.type) {
      case 'program_selected':
        return validateProgramSelected(validation)
        
      case 'architecture_selected':
        return validateArchitectureSelected(validation)
        
      case 'input_value':
        return validateInputValue(validation)
        
      case 'input_value_min':
        return validateInputValueMin(validation)
        
      case 'button_clicked':
        return validateButtonClicked(validation)
        
      default:
        console.warn('Unknown validation type:', validation.type)
        return true
    }
  } catch (error) {
    console.error('Validation error:', error)
    showValidationMessage(validation.message || 'Hi ha hagut un error en la validació')
    return false
  }
}

const validateProgramSelected = (validation) => {
  // Utilitza l'ID específic del selector de programes
  const element = document.querySelector('#programs-list')
  
  if (!element) {
    console.error('No s\'ha trobat l\'element #programs-list')
    showValidationMessage(validation.message)
    return false
  }
  
  const currentValue = element.value
  console.log(`Programa actual seleccionat: "${currentValue}", esperem: "${validation.value}"`)
  
  if (currentValue === validation.value) {
    return true
  }
  
  showValidationMessage(validation.message)
  return false
}

const validateArchitectureSelected = (validation) => {
  // Utilitza l'ID específic del selector d'arquitectures
  const element = document.querySelector('#processors-list')
  
  if (!element) {
    console.error('No s\'ha trobat l\'element #processors-list')
    showValidationMessage(validation.message)
    return false
  }
  
  const currentValue = element.value
  console.log(`Arquitectura actual seleccionada: "${currentValue}", esperem: "${validation.value}"`)
  
  if (currentValue === validation.value) {
    return true
  }
  
  showValidationMessage(validation.message)
  return false
}

const validateInputValue = (validation) => {
  const element = document.querySelector(validation.selector)
  
  if (!element) {
    console.error(`No s'ha trobat l'element amb selector: ${validation.selector}`)
    showValidationMessage(validation.message)
    return false
  }
  
  const currentValue = element.value
  console.log(`Valor actual de l'input: "${currentValue}", esperem: "${validation.value}"`)
  
  if (currentValue === validation.value) {
    return true
  }
  
  showValidationMessage(validation.message)
  return false
}

const validateInputValueMin = (validation) => {
  const element = document.querySelector(validation.selector)
  
  if (element && parseInt(element.value) >= validation.minValue) {
    return true
  }
  
  showValidationMessage(validation.message)
  return false
}

const validateButtonClicked = (validation) => {
  // Check if the button was clicked using our tracking
  const selector = validation.selector?.trim()
  
  if (!selector) {
    console.warn('No selector provided for button_clicked validation')
    return true
  }
  
  // Check if this button was clicked
  if (clickedButtons.value.has(selector)) {
    return true
  }
  
  // Also check if button exists and try to find it
  const element = document.querySelector(selector)
  if (!element) {
    console.warn(`Button not found: ${selector}`)
    showValidationMessage(validation.message || `Button not found: ${selector}`)
    return false
  }
  
  showValidationMessage(validation.message || 'Please click the button to continue')
  return false
}

// Set up click tracking for buttons used in validation
const setupButtonClickTracking = () => {
  // Remove any existing listeners first
  cleanupButtonClickTracking()
  
  // Find all button selectors used in current tutorial validations
  if (!currentTutorial.value?.steps) return
  
  const buttonSelectors = new Set()
  currentTutorial.value.steps.forEach(step => {
    if (step.validation?.type === 'button_clicked' && step.validation.selector) {
      buttonSelectors.add(step.validation.selector.trim())
    }
  })
  
  // Add click listeners to track button clicks
  buttonSelectors.forEach(selector => {
    try {
      const button = document.querySelector(selector)
      if (button) {
        const handler = () => {
          clickedButtons.value.add(selector)
          // Trigger reactivity update for canProceed
          validationState.value = { ...validationState.value, [selector]: true }
        }
        button.addEventListener('click', handler)
        // Store reference for cleanup
        button._tutorialClickHandler = handler
      }
    } catch (e) {
      console.warn(`Could not set up click tracking for: ${selector}`, e)
    }
  })
}

// Clean up click tracking listeners
const cleanupButtonClickTracking = () => {
  document.querySelectorAll('[_tutorialClickHandler]').forEach(el => {
    if (el._tutorialClickHandler) {
      el.removeEventListener('click', el._tutorialClickHandler)
      delete el._tutorialClickHandler
    }
  })
}

const showValidationMessage = (message) => {
  // Create a temporary message overlay
  const messageDiv = document.createElement('div')
  messageDiv.className = 'tutorial-validation-message'
  messageDiv.textContent = message
  messageDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ff6b6b;
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10002;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: tutorial-message-appear 0.3s ease-out;
  `
  
  document.body.appendChild(messageDiv)
  
  setTimeout(() => {
    messageDiv.remove()
  }, 3000)
}

const previousStep = async () => {
  if (stepIndex.value > 0) {
    stepIndex.value--
    
    // Reset question state for new step
    selectedAnswers.value = []
    questionAnswered.value = false
    shuffleAnswers()
    
    // Save progress after going to previous step
    saveTutorialProgress()
    
    await nextTick()
    await highlightCurrentStep()
  }
}

const highlightCurrentStep = async () => {
  // Skip highlighting for question steps (they show centered overlay)
  if (currentStep.value?.type === 'question') {
    // Clear any existing highlights
    document.querySelectorAll('.tutorial-highlighted').forEach(el => {
      el.classList.remove('tutorial-highlighted', 'tutorial-highlight-pulse')
    })
    highlightElement.value = null
    return
  }
  
  if (!currentStep.value?.selector) return
  
  // Execute step action if exists (for current step)
  if (currentStep.value.action) {
    try {
      await currentStep.value.action()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 300)) // Wait for transition
    } catch (error) {
      console.error('Error executing step action:', error)
    }
  }
  
  // Remove previous highlights
  document.querySelectorAll('.tutorial-highlighted').forEach(el => {
    el.classList.remove('tutorial-highlighted', 'tutorial-highlight-pulse')
  })
  
  // Simple selector handling - you might want to make this more robust
  let element
  
  if (currentStep.value.selector.includes(':contains(')) {
    // Handle :contains() pseudo-selector
    const match = currentStep.value.selector.match(/^([^:]+):contains\("([^"]+)"\)$/)
    if (match) {
      const [, baseSelector, text] = match
      const elements = document.querySelectorAll(baseSelector)
      element = Array.from(elements).find(el => el.textContent.includes(text))
    }
  } else {
    element = document.querySelector(currentStep.value.selector)
  }
  
  if (element) {
    highlightElement.value = element
    element.classList.add('tutorial-highlighted', 'tutorial-highlight-pulse')
    
    // Only scroll if element is not visible
    if (!isElementVisible(element)) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
  
  // Set up validation listeners for this step
  await nextTick() // Wait for DOM updates
  setupValidationListeners()
}

const completeTutorial = async () => {
  // Check validation if exists for current step (last step)
  if (currentStep.value.validation && !await validateCurrentStep()) {
    return // Don't complete if validation fails
  }
  
  // Clean up validation listeners
  cleanupValidationListeners()
  
  // Clean up button click tracking
  cleanupButtonClickTracking()
  clickedButtons.value = new Set()
  
  // Clear progress when tutorial is completed
  clearTutorialProgress()
  
  // Remove highlights
  document.querySelectorAll('.tutorial-highlighted').forEach(el => {
    el.classList.remove('tutorial-highlighted', 'tutorial-highlight-pulse')
  })
  
  // Restore original scroll position
  restoreScrollPosition()
  
  // Reset tutorial state
  isActive.value = false
  currentTutorial.value = null
  stepIndex.value = 0
  highlightElement.value = null
  
  // You could emit an event here to track tutorial completion
}

const toggleTutorial = () => {
  if (isActive.value) {
    // Close tutorial (save state)
    closeTutorial()
  } else if (currentTutorial.value) {
    // Continue tutorial from where it left off
    resumeTutorial()
  }
}

const clearHighlight = () => {
  // Remove highlights from all elements
  document.querySelectorAll('.tutorial-highlighted').forEach(el => {
    el.classList.remove('tutorial-highlighted', 'tutorial-highlight-pulse')
  })
  highlightElement.value = null
}

const resumeTutorial = () => {
  if (currentTutorial.value) {
    // Save current scroll position before resuming tutorial
    saveScrollPosition()
    
    isActive.value = true
    showTutorialMenu.value = false
    nextTick(() => {
      highlightCurrentStep()
    })
  }
}

const toggleTutorialMenu = () => {
  showTutorialMenu.value = !showTutorialMenu.value
}

const previewCustomTutorial = (tutorialData) => {
  showEditor.value = false
  showTutorialMenu.value = false
  
  // Process actions in the custom tutorial
  tutorialData.steps = tutorialData.steps.map(step => {
    if (step.action && typeof step.action === 'string') {
      const [actionType, param] = step.action.split(':')
      if (actionType === 'switchTo') {
        step.action = () => emit('requestSwitch', param)
      }
    }
    return step
  })
  
  currentTutorial.value = tutorialData
  stepIndex.value = 0
  isActive.value = true
  
  nextTick(() => {
    highlightCurrentStep()
  })
}

const addFinishedTutorial = (tutorialData) => {
  // Process actions in the finished tutorial
  tutorialData.steps = tutorialData.steps.map(step => {
    if (step.action && typeof step.action === 'string') {
      const [actionType, param] = step.action.split(':')
      if (actionType === 'switchTo') {
        step.action = () => emit('requestSwitch', param)
      }
    }
    return step
  })
  
  // Add the tutorial to the available tutorials list
  availableTutorials.value.push(tutorialData)
  
  console.log(`Added new tutorial: ${tutorialData.name}`)
  console.log('Available tutorials:', availableTutorials.value.map(t => t.name))
}

const closeTutorial = () => {
  // Remove highlights from all elements
  document.querySelectorAll('.tutorial-highlighted').forEach(el => {
    el.classList.remove('tutorial-highlighted', 'tutorial-highlight-pulse')
  })
  
  // Clean up validation listeners
  cleanupValidationListeners()
  
  // Clean up button click tracking
  cleanupButtonClickTracking()
  
  // Save tutorial progress when closing with X button
  saveTutorialProgress()
  
  // Reset question state
  selectedAnswers.value = []
  questionAnswered.value = false
  
  // Restore original scroll position
  restoreScrollPosition()
  
  isActive.value = false
  clearHighlight()
  // Don't clear currentTutorial or stepIndex to maintain state for resume
}

const stopTutorial = () => {
  // Remove highlights from all elements
  document.querySelectorAll('.tutorial-highlighted').forEach(el => {
    el.classList.remove('tutorial-highlighted', 'tutorial-highlight-pulse')
  })
  
  // Clean up validation listeners
  cleanupValidationListeners()
  
  // Clean up button click tracking
  cleanupButtonClickTracking()
  clickedButtons.value = new Set()
  
  // Clear saved progress when stopping tutorial
  clearTutorialProgress()
  
  // Reset question state
  selectedAnswers.value = []
  questionAnswered.value = false
  
  // Restore original scroll position
  restoreScrollPosition()
  
  // Completely stop and reset tutorial
  isActive.value = false
  currentTutorial.value = null
  stepIndex.value = 0
  highlightElement.value = null
}

// Handle clicks outside tutorial menu
const handleClickOutside = (event) => {
  if (showTutorialMenu.value) {
    const tutorialMenu = document.querySelector('.tutorial-menu')
    const launcherBtn = document.querySelector('.tutorial-launcher-btn')
    
    if (tutorialMenu && !tutorialMenu.contains(event.target) && 
        launcherBtn && !launcherBtn.contains(event.target)) {
      showTutorialMenu.value = false
    }
  }
}

const restoreTutorialProgress = async () => {
  const savedProgress = loadTutorialProgress()
  if (savedProgress && availableTutorials.value.length > 0) {
    // Find the tutorial by ID
    const tutorial = availableTutorials.value.find(t => t.id === savedProgress.tutorialId)
    if (tutorial) {
      console.log(`🔄 Restoring tutorial progress: ${savedProgress.tutorialName} (Step ${savedProgress.stepIndex + 1}/${savedProgress.totalSteps})`)
      
      currentTutorial.value = tutorial
      stepIndex.value = savedProgress.stepIndex
      // Don't set isActive to true - let the user decide to resume
      
      return true
    } else {
      console.log('⚠️ Saved tutorial not found in available tutorials, clearing progress')
      clearTutorialProgress()
    }
  }
  return false
}

// Validation state management
let validationEventListeners = []

const setupValidationListeners = () => {
  // Clean up existing listeners first
  cleanupValidationListeners()
  
  if (!currentStep.value?.validation) return
  
  const validation = currentStep.value.validation
  const triggerValidationUpdate = () => {
    // Force reactivity by updating validationState
    validationState.value = { ...validationState.value, timestamp: Date.now() }
  }
  
  let selectors = []
  
  switch (validation.type) {
    case 'program_selected':
      selectors = ['#programs-list']
      break
    case 'architecture_selected':
      selectors = ['#processors-list']
      break
    case 'input_value':
    case 'input_value_min':
      selectors = [validation.selector]
      break
  }
  
  // Add event listeners to relevant elements
  selectors.forEach(selector => {
    const element = document.querySelector(selector)
    if (element) {
      const events = ['change', 'input', 'keyup']
      events.forEach(eventType => {
        element.addEventListener(eventType, triggerValidationUpdate)
        validationEventListeners.push({ element, eventType, handler: triggerValidationUpdate })
      })
    }
  })
}

const cleanupValidationListeners = () => {
  validationEventListeners.forEach(({ element, eventType, handler }) => {
    element.removeEventListener(eventType, handler)
  })
  validationEventListeners = []
}

// Force tooltip position update
const tooltipPositionTrigger = ref(0)
const forceTooltipUpdate = () => {
  tooltipPositionTrigger.value++
}

// Handle window resize and zoom changes
const handleWindowChange = () => {
  if (isActive.value && highlightElement.value) {
    forceTooltipUpdate()
  }
}

onMounted(async () => {
  console.log('🎯 TutorialComponent mounted successfully!')
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleWindowChange)
  window.addEventListener('scroll', handleWindowChange, true) // Capture scroll events
  
  await loadTutorials()
  
  // Restore progress after tutorials are loaded
  await restoreTutorialProgress()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleWindowChange)
  window.removeEventListener('scroll', handleWindowChange, true)
  cleanupValidationListeners()
})
</script>

<style scoped>
.tutorial-system {
  position: relative;
  z-index: 9999;
}

.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
  z-index: 9999;
  pointer-events: none;
  transition: opacity 0.3s ease-in-out;
}

.tutorial-tooltip {
  position: absolute;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  padding: 0;
  width: 300px;
  max-width: calc(100vw - 40px);
  z-index: 10001;
  pointer-events: all;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  animation: tutorial-tooltip-appear 0.4s ease-out forwards;
}

.tutorial-content {
  padding: 20px;
}

.tutorial-content h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 18px;
}

.tutorial-content p {
  margin: 0 0 20px 0;
  color: #666;
  line-height: 1.5;
  font-size: 14px;
}

.tutorial-content :deep(code) {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 13px;
}

.tutorial-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.tutorial-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform: translateY(0);
}

.tutorial-btn:hover:not(:disabled) {
  background: #f5f5f5;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tutorial-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tutorial-btn-primary {
  background: #007acc;
  color: white;
  border-color: #007acc;
}

.tutorial-btn-primary:hover:not(:disabled) {
  background: #005999;
  transform: translateY(-1px);
  box-shadow: 0 2px 12px rgba(0, 122, 204, 0.3);
}

.tutorial-btn-disabled {
  background: #cccccc !important;
  color: #666666 !important;
  border-color: #cccccc !important;
  cursor: not-allowed !important;
  opacity: 0.7;
}

.tutorial-btn-disabled:hover {
  background: #cccccc !important;
  transform: none !important;
  box-shadow: none !important;
}

.tutorial-progress {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.tutorial-close {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  line-height: 1;
}

.tutorial-close:hover {
  color: #333;
}

.tutorial-launcher {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
}

.tutorial-launcher-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #007acc;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 122, 204, 0.4);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tutorial-launcher-btn:hover {
  background: #005999;
  transform: scale(1.1);
}

.tutorial-icon {
  font-size: 24px;
  font-weight: bold;
}

.tutorial-btn-pause {
  background: #ff6b35 !important;
  border: none;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  min-width: auto;
}

.tutorial-btn-pause:hover {
  background: #e5552d !important;
}

.tutorial-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  padding: 20px;
  width: 320px;
  max-height: 400px;
  overflow-y: auto;
}

.tutorial-menu h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.tutorial-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tutorial-menu-item {
  background: none;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.tutorial-menu-item:hover {
  background: #f5f5f5;
  border-color: #007acc;
}

.tutorial-item-content strong {
  display: block;
  color: #333;
  margin-bottom: 5px;
  font-size: 14px;
}

.tutorial-item-content p {
  margin: 0;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.tutorial-loading {
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.tutorial-menu-separator {
  height: 1px;
  background: #eee;
  margin: 10px 0;
}

.tutorial-create-item {
  background: linear-gradient(135deg, #007acc, #0056b3);
  color: white;
  border-color: #007acc;
}

.tutorial-create-item:hover {
  background: linear-gradient(135deg, #005999, #004085);
  border-color: #005999;
}

.tutorial-paused-section {
  border-bottom: 2px solid #eee;
  margin-bottom: 15px;
  padding-bottom: 15px;
}

.tutorial-paused-header {
  text-align: center;
  margin-bottom: 15px;
}

.tutorial-paused-header h5 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.tutorial-paused-info {
  margin: 0;
  color: #666;
  font-size: 13px;
  font-style: italic;
}

.tutorial-action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
}

.tutorial-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tutorial-action-icon {
  font-size: 20px;
  line-height: 1;
}

.tutorial-action-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tutorial-action-content strong {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

.tutorial-action-content span {
  font-size: 11px;
  opacity: 0.8;
  line-height: 1.2;
}

.tutorial-resume-btn {
  background: linear-gradient(135deg, #28a745, #20893e);
  color: white;
}

.tutorial-resume-btn:hover {
  background: linear-gradient(135deg, #218838, #1e7e34);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
}

.tutorial-stop-btn {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
}

.tutorial-stop-btn:hover {
  background: linear-gradient(135deg, #c82333, #bd2130);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}

.tutorial-create-item .tutorial-item-content strong {
  color: white;
}

.tutorial-create-item .tutorial-item-content p {
  color: rgba(255, 255, 255, 0.9);
}

@keyframes tutorial-tooltip-appear {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Question Overlay Styles */
.question-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.question-panel {
  background: white;
  border-radius: 14px;
  width: 100%;
  max-width: 550px;
  max-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s ease-out;
  position: relative;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.question-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  line-height: 1;
  z-index: 10;
  transition: color 0.2s;
}

.question-close:hover {
  color: #333;
}

.question-header {
  padding: 18px 24px 14px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.question-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 10px;
}

.question-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.question-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.question-text {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  margin: 0 0 16px 0;
}

.question-text :deep(code) {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.question-image {
  margin-bottom: 16px;
  text-align: center;
  cursor: pointer;
  position: relative;
}

.question-image img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.question-image:hover img {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.question-image .image-hint,
.step-image .image-hint {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
  opacity: 0.7;
}

.question-image:hover .image-hint,
.step-image:hover .image-hint {
  opacity: 1;
}

/* Step image in tooltip */
.step-image {
  margin: 12px 0;
  text-align: center;
  cursor: pointer;
  position: relative;
}

.step-image img {
  max-width: 100%;
  max-height: 150px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.step-image:hover img {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Lightbox popup */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  animation: fadeIn 0.2s ease-out;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-content img {
  max-width: 90vw;
  max-height: 90vh;
  width: auto;
  height: auto;
  min-width: 200px;
  min-height: 200px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  background: white;
}

.lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
  padding: 8px;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.lightbox-close:hover {
  opacity: 1;
}

.question-mode-info {
  background: #f5f3ff;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.answer-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.answer-option:hover:not(:disabled) {
  border-color: #8b5cf6;
  background: #faf5ff;
}

.answer-option.selected {
  border-color: #8b5cf6;
  background: #f5f3ff;
}

.answer-option.correct {
  border-color: #10b981;
  background: #ecfdf5;
}

.answer-option.partial-correct {
  border-color: #10b981;
  background: #ecfdf5;
}

.answer-option.wrong {
  border-color: #ef4444;
  background: #fef2f2;
}

.answer-option:disabled {
  cursor: default;
}

.answer-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.answer-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #e5e7eb;
  color: #374151;
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  flex-shrink: 0;
}

.answer-option.selected .answer-letter {
  background: #8b5cf6;
  color: white;
}

.answer-option.correct .answer-letter,
.answer-option.partial-correct .answer-letter {
  background: #10b981;
  color: white;
}

.answer-option.wrong .answer-letter {
  background: #ef4444;
  color: white;
}

.answer-text {
  flex: 1;
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
}

.answer-text :deep(code) {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.answer-indicator {
  font-size: 16px;
  font-weight: bold;
}

.answer-indicator.correct {
  color: #10b981;
}

.answer-indicator.partial-correct {
  color: #10b981;
}

.answer-indicator.wrong {
  color: #ef4444;
}

.answer-feedback {
  margin-top: 6px;
  margin-left: 40px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
  animation: fadeIn 0.3s ease-out;
}

.answer-feedback :deep(code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.answer-feedback.feedback-correct {
  background: #ecfdf5;
  color: #065f46;
  border-left: 3px solid #10b981;
}

.answer-feedback.feedback-wrong {
  background: #fef2f2;
  color: #991b1b;
  border-left: 3px solid #ef4444;
}

.feedback-section {
  margin-top: 16px;
  animation: fadeIn 0.3s ease-out;
}

.feedback-box {
  padding: 12px 16px;
  border-radius: 8px;
}

.feedback-box h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.feedback-correct {
  background: #ecfdf5;
  border: 1px solid #10b981;
}

.feedback-correct h4 {
  color: #059669;
}

.feedback-wrong {
  background: #fef2f2;
  border: 1px solid #ef4444;
}

.feedback-wrong h4 {
  color: #dc2626;
}

.feedback-item {
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
  margin-bottom: 6px;
  padding-left: 14px;
  position: relative;
}

.feedback-item::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #6b7280;
}

.feedback-item:last-child {
  margin-bottom: 0;
}

.question-actions {
  padding: 14px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  background: #f9fafb;
}

.tutorial-btn-retry {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.tutorial-btn-retry:hover:not(:disabled) {
  background: #d97706;
  transform: translateY(-1px);
  box-shadow: 0 2px 12px rgba(245, 158, 11, 0.3);
}
</style>
