<template>
  <div class="program_info">
    <div class="program-header">
      <h3>Program</h3>
      <div id="settings-div">
        <select id="programs-list" name="assembly-code" onchange="reloadRvcat();">
            <!-- <option value="loop1">Loop 1</option> -->
        </select>
      </div>
    </div>
    <section class="main-box code-block">
        <pre>
          <code id="rvcat-asm-code">LOADING</code>
        </pre>
    </section>
  </div>

</template>

<style scoped>
.program_info{
  height:100%;
  width:100%;
  background: white;
  overflow:hidden;
  padding:5px;
  border-radius: 10px;
}
.program-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  position:sticky;
}
#rvcat-asm-code{
  overflow:auto;
}

h3 {
  margin: 0;
}
</style>
