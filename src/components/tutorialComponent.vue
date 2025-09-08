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
            <button @click="pauseTutorial" class="tutorial-btn tutorial-btn-pause" title="Pause Tutorial">
              ⏸️
            </button>
            <button @click="previousStep" :disabled="stepIndex === 0" class="tutorial-btn">
              Previous
            </button>
            <span class="tutorial-progress">
              {{ stepIndex + 1 }} / {{ currentTutorial.steps.length }}
            </span>
            <button v-if="stepIndex < currentTutorial.steps.length - 1" 
                    @click="nextStep" 
                    class="tutorial-btn tutorial-btn-primary">
              Next
            </button>
            <button v-else @click="completeTutorial" class="tutorial-btn tutorial-btn-primary">
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
          <button @click="resumeTutorial" class="tutorial-menu-item tutorial-resume-item">
            <div class="tutorial-item-content">
              <strong>▶️ Resume: {{ currentTutorial.name }}</strong>
              <p>Continue from step {{ stepIndex + 1 }} of {{ currentTutorial.steps.length }}</p>
            </div>
          </button>
          <button @click="closeTutorial" class="tutorial-menu-item tutorial-stop-item">
            <div class="tutorial-item-content">
              <strong>⏹️ Stop Current Tutorial</strong>
              <p>End the current tutorial and start fresh</p>
            </div>
          </button>
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

// State
const isActive = ref(false)
const showTutorialMenu = ref(false)
const showEditor = ref(false)
const currentTutorial = ref(null)
const stepIndex = ref(0)
const highlightElement = ref(null)
const availableTutorials = ref([])
const isLoading = ref(false)

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
        console.log(`🔍 Trying base path: "${basePath}"`)
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
    
    console.log('📚 Index loaded:', indexData)
    
    // Load each tutorial
    const tutorials = []
    for (const tutorialFile of indexData.tutorials) {
      console.log(`📖 Loading tutorial file: ${tutorialFile}`)
      
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
        name: '🧪 Basic Test',
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
  
  currentTutorial.value = tutorial
  stepIndex.value = 0
  isActive.value = true
  showTutorialMenu.value = false
  
  nextTick(() => {
    highlightCurrentStep()
  })
}

const nextStep = async () => {
  if (stepIndex.value < currentTutorial.value.steps.length - 1) {
    // Check validation if exists for current step
    if (currentStep.value.validation && !await validateCurrentStep()) {
      return // Don't advance if validation fails
    }
    
    // Execute step action if exists
    if (currentStep.value.action) {
      await currentStep.value.action()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait for transition
    }
    
    stepIndex.value++
    await nextTick()
    highlightCurrentStep()
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
    await nextTick()
    highlightCurrentStep()
  }
}

const highlightCurrentStep = () => {
  if (!currentStep.value?.selector) return
  
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
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const completeTutorial = () => {
  closeTutorial()
  // You could emit an event here to track tutorial completion
}

const toggleTutorial = () => {
  if (isActive.value) {
    // Pausar tutorial
    pauseTutorial()
  } else if (currentTutorial.value) {
    // Continue tutorial from where it left off
    resumeTutorial()
  }
}

const pauseTutorial = () => {
  isActive.value = false
  clearHighlight()
  // Don't clear currentTutorial or stepIndex to maintain state
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

const closeTutorial = () => {
  // Remove highlights from all elements
  document.querySelectorAll('.tutorial-highlighted').forEach(el => {
    el.classList.remove('tutorial-highlighted', 'tutorial-highlight-pulse')
  })
  
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

onMounted(() => {
  console.log('🎯 TutorialComponent mounted successfully!')
  document.addEventListener('click', handleClickOutside)
  loadTutorials()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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
  margin-bottom: 10px;
  padding-bottom: 10px;
}

.tutorial-resume-item {
  background: linear-gradient(135deg, #28a745, #20893e);
  color: white;
  border-color: #28a745;
}

.tutorial-resume-item:hover {
  background: linear-gradient(135deg, #218838, #1e7e34);
  border-color: #1e7e34;
}

.tutorial-stop-item {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border-color: #dc3545;
}

.tutorial-stop-item:hover {
  background: linear-gradient(135deg, #c82333, #bd2130);
  border-color: #bd2130;
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
