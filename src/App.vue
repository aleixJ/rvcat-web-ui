<template>
    <RouterView />
</template>

<style>
  body {
    width: 100vf;
    height: 100vh;
    max-width: 100vf;
    max-height: 100vh;
    font-family: 'Trebuchet MS', sans-serif;
    font-size: 2.5vh;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #e3e3e3;
  }
  ::-webkit-scrollbar {
    width: 0.75vh;
    height:0.75vh;
  }
  ::-webkit-scrollbar-track {
    width:10px;
    background:none;
  }
  ::-webkit-scrollbar-thumb {
    background:rgb(167, 167, 167);
    border-radius:10px;
    height:0.75vh;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: #8b8b8b;
  }

  .output-block svg {
    width: 100% !important;
    max-height: 100% !important;
  }

  .pipeline-img svg {
    width:100%;
    height:auto;
  }

  .simulation-img svg {
    width:100%;
    max-height:50%;
  }

  h3 {
    margin: 0;
    font-size: 3.5vh;
  }

  h4{
    font-size: 2.75vh;
  }

  .blue-button {
    background: #0085dd;
    color: white;
    border: none;
    padding: 0.5vh 1vh;
    font-size: 2.5vh;
    border-radius: 1vh;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
  }
  .blue-button:hover {
    background: #006fb9;
  }
  .blue-button.active {
    background: #003f73;
  }
  .blue-button[disabled] {
    opacity: 0.5;
    cursor:default;
  }

  .gray-button {
    background: #e0e0e0;
    border: 1px solid #b0b0b0;
    border-radius: 4px;
    width: 3.5vh;
    height: 3.5vh;
    line-height: 1;
    text-align: center;
    font-size: 2.5vh;
    cursor: pointer;
    user-select: none;
  }

  .gray-button:hover {
    background: #d0d0d0;
  }

  input {
    font-size: 2.5vh;
  }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal         {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 30%;
    position: relative;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    background: rgba(255,255,255);
    z-index: 1000;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  .error {
    color: red;
    margin: 6px 0;
  }

  /* Folding animation */
  .fold-enter-active, .fold-leave-active {
    transition: max-height 0.3s ease, opacity 0.3s ease;
    overflow: hidden;
  }
  .fold-enter-from, .fold-leave-to {
    max-height: 0;
    opacity: 0;
  }
  .fold-enter-to, .fold-leave-from {
    max-height: 500px;
    opacity: 1;
  }

  .info-img {
    height:2.5vh;
  }

  .info-icon {
    cursor: pointer;
    user-select: none;
    margin-top:0.75vh;
  }
  .section-title-and-info{
    display:flex;
    gap:5px;
  }

  /* Tutorial system styles */
  .tutorial-highlight-pulse {
    animation: tutorial-pulse 2s infinite ease-in-out;
  }

  @keyframes tutorial-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 122, 204, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(0, 122, 204, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 122, 204, 0);
    }
  }

  .tutorial-highlighted {
    position: relative;
    z-index: 10001 !important;
    border: 3px solid #007acc !important;
    border-radius: 6px !important;
    box-shadow: 0 0 20px rgba(0, 122, 204, 0.5) !important;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    transform: scale(1.02) !important;
  }

  /* Specific styles for different element types in tutorials */
  .tutorial-highlighted.header-title {
    color: #333 !important;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  }

  .tutorial-highlighted button {
    color: #333 !important;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    transform: scale(1.05) !important;
  }

  .tutorial-highlighted select {
    background: white !important;
    color: #333 !important;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    transform: scale(1.03) !important;
  }

  @keyframes tutorial-message-appear {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
</style>
