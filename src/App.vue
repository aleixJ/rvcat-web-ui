
<template>
    <RouterView />
</template>

<style>
  body {
    width: 100vf;
    height: 100vh;
    max-width: 100vf;
    max-height: 100vh;
    font-family: Lato, sans-serif;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #e3e3e3;
  }
  ::-webkit-scrollbar {
    width: 5px;
    height:5px;
  }
  ::-webkit-scrollbar-track {
    width:10px;
    background:none;
  }
  ::-webkit-scrollbar-thumb {
    background:rgb(167, 167, 167);
    border-radius:10px;
    height:20px;
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
</style>
