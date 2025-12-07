const GET_AVAIL_PROGRAMS = `import json, rvcat
_prog = getattr(rvcat, '_program', None)
_files = getattr(rvcat, 'files', None)
_result = []
if _prog is not None and hasattr(_prog, 'list_programs_json'):
  _result = _prog.list_programs_json()
elif _files is not None:
  _result = _files.list_json(False)
_result if isinstance(_result, str) else json.dumps(_result)
`

const GET_AVAIL_PROCESSORS = `import json, rvcat
_proc = getattr(rvcat, '_processor', None)
_files = getattr(rvcat, 'files', None)
_result = []
if _proc is not None and hasattr(_proc, 'list_processors_json'):
  _result = _proc.list_processors_json()
elif _files is not None:
  _result = _files.list_json(True)
_result if isinstance(_result, str) else json.dumps(_result)
`

// SHOW program
const PROG_SHOW = `import json, rvcat
_prog = getattr(rvcat, '_program', None)
str(_prog) if _prog is not None else ''
`

const PROG_SHOW_DEPENDENCIES = `import rvcat
_prog = getattr(rvcat, '_program', None)
_func = None
for _name in ('show_dependencies',):
  _func = getattr(_prog, _name, None)
  if callable(_func):
    break
_func() if callable(_func) else ''
`

const PROG_SHOW_DEPENDENCIES_GRAPHVIZ = `import rvcat
_prog = getattr(rvcat, '_program', None)
_func = None
for _name in ('get_dependencies_grapviz', 'show_graphviz'):
  _func = getattr(_prog, _name, None)
  if callable(_func):
    break
_func(num_iters=3) if callable(_func) else ''
`

function prog_show_dependencies_graphviz(num_iters) {
  return `import rvcat
_prog = getattr(rvcat, '_program', None)
_func = None
for _name in ('get_dependencies_grapviz', 'show_graphviz'):
  _func = getattr(_prog, _name, None)
  if callable(_func):
    break
_func(num_iters=${num_iters}) if callable(_func) else ''
`;
}

function getCriticalPathsGraph(num_iters, constants, read_only, internal, latency) {
  const pyConst    = constants ? "True" : "False";
  const pyReadOnly = read_only ? "True" : "False";
  const pyInternal = internal ? "True" : "False";
  const pyLatency  = latency ? "True" : "False";

  return `import rvcat
_result = ''
_prog = getattr(rvcat, '_program', None)
if _prog is not None:
  _func = getattr(_prog, 'get_recurrent_paths_graphviz', None)
  if callable(_func):
    try:
      _result = _func(num_iters=${num_iters}, constants=${pyConst}, read_only=${pyReadOnly}, internal=${pyInternal}, latency=${pyLatency})
    except TypeError:
      try:
        _result = _func(${num_iters})
      except TypeError:
        _result = _func()
  else:
    _alt = getattr(_prog, 'show_graphviz', None)
    if callable(_alt):
      _result = _alt(num_iters=${num_iters}, show_const=${pyConst}, show_readonly=${pyReadOnly}, show_internal=${pyInternal}, show_latency=${pyLatency})
_result
`;
}

const PROG_SHOW_CRITICAL_PATHS_GRAPHVIZ = `import rvcat
_prog = getattr(rvcat, '_program', None)
_func = None
for _name in ('get_recurrent_paths_graphviz', 'show_graphviz'):
  _func = getattr(_prog, _name, None)
  if callable(_func):
    break
_func() if callable(_func) else ''
`

const PROG_SHOW_ANNOTATED = `import rvcat
_prog = getattr(rvcat, '_program', None)
_func = None
for _name in ('annotate_action', 'show_code'):
  _func = getattr(_prog, _name, None)
  if callable(_func):
    break
_func() if callable(_func) else ''
`

const PROG_SHOW_EXECUTION = `import rvcat
_prog = getattr(rvcat, '_program', None)
_func = None
for _name in ('annotate_execution', 'show_code'):
  _func = getattr(_prog, _name, None)
  if callable(_func):
    break
_func() if callable(_func) else ''
`

const PROG_SHOW_MEMORY = `import rvcat
_prog = getattr(rvcat, '_program', None)
_func = None
for _name in ('show_memory_trace',):
  _func = getattr(_prog, _name, None)
  if callable(_func):
    break
_func() if callable(_func) else ''
`

const PROG_SHOW_STATIC_PERFORMANCE = `import rvcat
_prog = getattr(rvcat, '_program', None)
_func = None
for _name in ('show_static_performance_analysis', 'show_performance_analysis'):
  _func = getattr(_prog, _name, None)
  if callable(_func):
    break
_func() if callable(_func) else ''
`

const SHOW_TIMELINE = `import rvcat
_sched = getattr(rvcat, '_scheduler', None)
_func = getattr(_sched, 'format_timeline', None)
_func() if callable(_func) else ''
`

function show_timeline(num_iters) {
  return `import rvcat
_sched = getattr(rvcat, '_scheduler', None)
_func = getattr(_sched, 'format_timeline', None)
_func(niters=${num_iters}) if callable(_func) else ''
`;
}

// SHOW processor
const SHOW_PROCESSOR = `import rvcat
_proc = getattr(rvcat, '_processor', None)
_func = getattr(_proc, 'json', None)
_func() if callable(_func) else ''
`

const GET_PROGRAM_JSON = `import rvcat
_prog = getattr(rvcat, '_program', None)
_func = getattr(_prog, 'json', None)
_func() if callable(_func) else ''
`

// SHOW isa
const SHOW_ISA = `import rvcat
_isa = getattr(rvcat, '_isa', None)
str(_isa) if _isa is not None else ''
`

// RUN program
const RUN_PROGRAM_PREAMBLE = function() {
  return `import rvcat
_sched = getattr(rvcat, '_scheduler', None)
if _sched is not None:
  if hasattr(_sched, 'load_program'):
    _sched.load_program(rvcat._program, iterations=${currentIterations()}, window_size=${currentROBSize()})
  elif hasattr(_sched, 'init'):
    _sched.init(iterations=${currentIterations()}, window_size=${currentROBSize()})
`;
}

const RUN_PROGRAM_TIMELINE = `import rvcat
_sched = getattr(rvcat, '_scheduler', None)
_func = getattr(_sched, 'format_timeline', None)
_func() if callable(_func) else ''
`

const RUN_PROGRAM_ANALYSIS = `import rvcat
_sched = getattr(rvcat, '_scheduler', None)
_func = getattr(_sched, 'format_analysis_json', None)
_func() if callable(_func) else ''
`

const RUN_PROGRAM_MEMTRACE = `import rvcat
_sched = getattr(rvcat, '_scheduler', None)
_func = getattr(_sched, 'format_memtrace', None)
_func() if callable(_func) else ''
`

function addModifiedProcessor(config){
  const payload = JSON.stringify(config);
  return `import json, rvcat
_cfg = json.loads(${JSON.stringify(payload)})
_proc = getattr(rvcat, '_processor', None)
if _proc is not None:
  if hasattr(_proc, 'import_processor_json'):
    _proc.import_processor_json(json.dumps(_cfg))
  else:
    rvcat.files.export_json(_cfg, _cfg.get('name', ''), True)
`;
}

function addNewProgram(config){
  const payload = JSON.stringify(config);
  return `import json, rvcat
_cfg = json.loads(${JSON.stringify(payload)})
_prog = getattr(rvcat, '_program', None)
if _prog is not None:
  if hasattr(_prog, 'import_program_json'):
    _prog.import_program_json(json.dumps(_cfg))
  else:
    rvcat.files.export_json(_cfg, _cfg.get('name', ''), False)
`;
}

const RVCAT_HEADER = function() {
  let proc = currentProcessor();
  let prog = currentProgram();
  let res = `import rvcat\n`;
  if (proc) {
    res += `if hasattr(rvcat._processor, 'load_processor'):\n    rvcat._processor.load_processor('${proc}')\nelse:\n    rvcat._processor.load('${proc}')\n`;
  }

  if (prog) {
    res += `if hasattr(rvcat._program, 'load_program'):\n    rvcat._program.load_program('${prog}')\nelse:\n    rvcat._program.load('${prog}')\n`;
    if (proc) {
    res += `if hasattr(rvcat._scheduler, 'load_program'):\n    rvcat._scheduler.load_program(rvcat._program, iterations=${currentIterations()}, window_size=${currentROBSize()})\nelif hasattr(rvcat._scheduler, 'init'):\n    rvcat._scheduler.init(iterations=${currentIterations()}, window_size=${currentROBSize()})\n`;
    }
  }

  return res;
}
