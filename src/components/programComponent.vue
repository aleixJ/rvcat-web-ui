<script setup>

  import {onMounted, onUnmounted, nextTick } from "vue";

  let processorsListHandler=null;

  onMounted(() => {
    nextTick(() => {
      const list = document.getElementById("processors-list");
      if (list) {
        processorsListHandler = () => setTimeout( ()=> { updateProcessorSettings();},100);
        list.addEventListener("change", processorsListHandler);
      }
      reloadRvcat();
    });
  });
  onUnmounted(() => {
    const list = document.getElementById("processors-list");
    if (list && processorsListHandler) {
      list.removeEventListener("change", processorsListHandler);
    }
  });

  async function downloadProgram(){
    let data= await getProgramJSON();
    const jsonText = JSON.stringify(data, null, 2);
    // force a Save As... dialog if API is supported
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: `${document.getElementById('programs-list').value}.json`,
        types: [{
          description: 'JSON files',
          accept: { 'application/json': ['.json'] }
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonText);
      await writable.close();

    } else {
      // fallback: traditional anchor download
      const blob = new Blob([jsonText], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `${document.getElementById('programs-list').value}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

  }
  //TODO: SHOW MODAL AND ASK FOR NAME (CHECK IF IT'S NOT REPEATED)
  function uploadProgram() {

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.style.display = "none";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        saveNewProgram(text);
      } catch (err) {
        console.error("Failed to read JSON file:", err);
        alert("Could not load program file.");
      }
    };
    document.body.appendChild(input);
    input.click();
    // clean up
    input.remove();
  }

</script>

<template>
  <div class="program_info">
    <div class="program-header">
      <h3>Program</h3>
      <div id="settings-div">
        <button id="download-button" class="program-button" @click="downloadProgram">Download</button>
        <button id="upload-button" class="program-button" @click="uploadProgram">Upload</button>
        <select id="programs-list" name="assembly-code" onchange="reloadRvcat();">
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
  left:0;
}
.main-box{
  overflow:auto;
  max-height:70%;
  margin-top:5px;
  background:#e3e3e3;
  border-radius:10px;
  padding:5px;
}

h3 {
  margin: 0;
}
.program-button {
  background: #0085dd;
  color: white;
  border: none;
  padding: 4px 8px;
  font-size: 14px;
  border-radius: 6px;
  margin-right:3px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.program-button:hover {
  background: #006fb9;
  color: white;
}

.program-button:active {
  outline: none;
  background: #003f73;
  color: white;
}
</style>
