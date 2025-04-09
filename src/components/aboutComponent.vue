<template>
  <div class='main'>
    <div class="header">
      <h3>About</h3>
    </div>

      <p>
          RVCAT (RISC-V Code Analysis Tool) is a simulation tool for the performance analysis of small programs from a computer architecture educational standpoint.
      </p>
      <p>
          RVCAT and its web interface (RVCAT-Web) have been developed on
          the Computer Architecture and Operating Systems Department of
          the Universitat Autònoma de Barcelona (UAB) by Saul Adserias,
          Quim Aguado Puig, and Juan C. Moure.
      </p>
      <p>
          The simulator and web interface are still under active
          development. If you find any bugs or want to help improving the
          tools (for example, as part of a final degree project), please
          contact your professors.
      </p>

    </div>
</template>

<style scoped>
  .main{
    height: 100%;
    width: 100%;
    background: white;
    overflow: auto;
    padding: 5px;
    border-radius: 10px;
    position: relative;
  }
  .header{
    position:sticky;
    top:-5px;
    background:white;
    width:100%;
  }
  h3 {
  margin: 0;
  }
</style>
