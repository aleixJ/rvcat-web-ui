<script setup>
  import { ref, computed} from 'vue';

  const props = defineProps({
    position: {
      type: Object,
      default: () => ({ top: '50%', left: '50%' }),
    },
    text: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    }
  });

  const emit    = defineEmits(['close']);
  const visible = ref(true);

  const positionStyle = computed(() => ({
    position: 'absolute',
    top: props.position.top,
    left: props.position.left,
  }));

  function close() {
    visible.value = false;
    emit('close');
  }
</script>

<template>
  <div v-if="visible" class="tutorial-overlay" @click.self="close">
    <div class="tutorial-dialog" :style="positionStyle">
      <b>Help - {{title}}</b>
      <button class="close-button" @click="close">x</button>
      <div class="dialog-content">{{ text }}</div>
    </div>
  </div>
</template>

<style scoped>
  .tutorial-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .tutorial-dialog {
    background: #fff;
    padding: 20px;
    border-radius: 0 8px 8px 8px;
    position: relative;
    max-width: 30%;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    border: none;
    font-size: 3vh;
    cursor: pointer;
  }

  .dialog-content {
    margin-top: 10px;
    text-align: justify;
  }
</style>
