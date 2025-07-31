const RVCAT_HEADER = function() {
    let proc = currentProcessor();
    let prog = currentProgram();
    let res = `import rvcat\n`;
    if (proc !== undefined) {
      res += `rvcat._processor.load('${currentProcessor()}')\n`
    }
    if (prog !== undefined) {
      res += `rvcat._program.load('${currentProgram()}')\n`
      res += `rvcat._scheduler.init_scheduler(iterations=${currentIterations()}, window_size=${currentROBSize()})\n`
    }
    return res;
}

// PROGRAM
const GET_PROGRAM_JSON       = 'rvcat._program.json()'
const PROG_SHOW              = 'str(rvcat._program)'
const PROG_SHOW_DEPENDENCIES = `rvcat._program.show_dependencies()`
const PROG_SHOW_EXECUTION    = `rvcat._program.show_code()`
const PROG_SHOW_MEMORY       = `rvcat._program.show_memory_trace()`
const PROG_SHOW_STATIC_PERFORMANCE      = `rvcat._program.show_performance_analysis()`
const PROG_SHOW_CRITICAL_PATHS_GRAPHVIZ = `rvcat._program.show_graphviz()`
const GET_AVAIL_PROGRAMS = `import rvcat
rvcat.files.list_json(False)
`
function addNewProgram(config){
  return `rvcat._program.save(${JSON.stringify(config)})`;
}

// PROCESSOR
const SHOW_PROCESSOR   = 'rvcat._processor.json()'
const GET_AVAIL_PROCESSORS = `import rvcat
rvcat.files.list_json(True)
`
function addModifiedProcessor(config){
  return `rvcat._processor.save(${JSON.stringify(config)})`;
}

// RUN program
const RUN_PROGRAM_ANALYSIS = 'rvcat._scheduler.format_analysis_json()'
function show_timeline(num_iters) {
    return `rvcat._scheduler.format_timeline(niters=${num_iters})`
}
