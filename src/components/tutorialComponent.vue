<template>
  <div class="tutorial-system">
    
    <!-- Tutorial Overlay -->
    <div v-if="currentTutorial && isActive" class="tutorial-overlay">
      <!-- Tooltip -->
      <div class="tutorial-tooltip" :style="tooltipStyle">
        <div class="tutorial-content">
          <h3>{{ currentStep?.title }}</h3>
          <p>{{ currentStep?.description }}</p>
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
            <p class="tutorial-paused-info">{{ currentTutorial.name }}</p>
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
              <strong>{{ tutorial.name }}</strong>
              <p>{{ tutorial.description }}</p>
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
        // For button validation, we assume it can proceed until clicked
        return true
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
  
  isActive.value = true
  showTutorialMenu.value = false
  
  // Save current progress
  saveTutorialProgress()
  
  nextTick(async () => {
    await highlightCurrentStep()
  })
}

const nextStep = async () => {
  if (stepIndex.value < currentTutorial.value.steps.length - 1) {
    // Check validation if exists for current step
    if (currentStep.value.validation && !await validateCurrentStep()) {
      return // Don't advance if validation fails
    }
    
    stepIndex.value++
    
    // Save progress after advancing to next step
    saveTutorialProgress()
    
    await nextTick()
    await highlightCurrentStep()
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
  // For button validation, we'll check if the button exists and is enabled
  // In a real implementation, you might want to track actual clicks
  const selectors = validation.selector.split(', ')
  
  for (const selector of selectors) {
    const element = document.querySelector(selector.trim())
    if (element && !element.disabled) {
      // Simulate click detection - in a real app you'd track this
      return true
    }
  }
  
  showValidationMessage(validation.message)
  return false
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
    
    // Save progress after going to previous step
    saveTutorialProgress()
    
    await nextTick()
    await highlightCurrentStep()
  }
}

const highlightCurrentStep = async () => {
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
  
  // Save tutorial progress when closing with X button
  saveTutorialProgress()
  
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
  
  // Clear saved progress when stopping tutorial
  clearTutorialProgress()
  
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

onMounted(async () => {
  console.log('🎯 TutorialComponent mounted successfully!')
  document.addEventListener('click', handleClickOutside)
  await loadTutorials()
  
  // Restore progress after tutorials are loaded
  await restoreTutorialProgress()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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
</style>
