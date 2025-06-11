<template>
  <div class="blur-overlay" id="blur-overlay-item"></div>
    <div class="overlay" id="loading-overlay">
      <div class="spinner"></div>
      <p id="loading-overlay-message">Initializing</p>
      <p>Please wait, this process can take several seconds</p>
  </div>
</template>

<style scoped>
.blur-overlay {
    position: fixed;
    display: none;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgb(65, 65, 65, 0.5);
    z-index: 10;
    backdrop-filter: blur(5px);
}
.overlay {
    position: fixed;
    display: none;
    margin: auto;
    width: fit-content;
    height: fit-content;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.4);
    z-index: 100;
    border-radius: 15px;
    border: 2px solid #506c8666;
    padding: 2%;
    padding-right: 5%;
    padding-left: 5%;
}

#loading-overlay p {
    margin: auto;
    font-weight: bold;
    text-align: center;
    font-size: 2.5vh;
}

/* Spinner animation */
.spinner {
    border: 12px solid #f3f3f3;
    border-top: 12px solid #007bff;
    border-radius: 50%;
    width: 80px;
    height: 80px;
    animation: spin 1s linear infinite;
    margin: auto;
    margin-bottom: 20px;
}

.spinner-small {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #868686;
    border-radius: 50%;
    width: 15px;
    height: 15px;
    animation: spin 1s linear infinite;
    margin: auto;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

</style>
