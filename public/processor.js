/* SAMPLE

digraph {
    edge [headport="w"]
    rankdir="LR";
    Fetch:e1 -> Dispatch:w1;
    Fetch:e2 -> Dispatch:w2;
    Fetch:e3 -> Dispatch:w3;
    Fetch:e4 -> Dispatch:w4;

    Dispatch:e1 -> P0;
    Dispatch:e2 -> P1;
    Dispatch:e3 -> P2;
    Dispatch:e4 -> P3;

     subgraph cluster_0 {
        rankdir="LR";
        node [shape=box3d];
        P0 [shape=box3d,height=0.15];
        P1 [shape=box3d,height=0.15];
        P2 [shape=box3d,height=0.15];
        P3 [shape=box3d,height=0.15];

        label = "Execute";
    }

    P0:e -> WriteBack:w1;
    P1:e -> WriteBack:w2;
    P2:e -> WriteBack:w3;
    P3:e -> WriteBack:w4;

    WriteBack:e1 -> Retire:w1;
    WriteBack:e2 -> Retire:w2;
    WriteBack:e3 -> Retire:w3;
    WriteBack:e4 -> Retire:w4;

    Retire:e1 -> Ret:w1;
    Retire:e2 -> Ret:w2;
    Retire:e3 -> Ret:w3;
    Retire:e4 -> Ret:w4;
    Retire:e5 -> Ret:w5;
    Retire:e6 -> Ret:w6;
    Retire:e6 -> Ret:w6;
    Retire:e6 -> Ret:w6;

    WriteBack[shape=box,height=1.5,width=1.5,label="Write Back"]
    Dispatch[shape=box,height=1.5,width=1.5]
    Retire[shape=box,height=1.5,width=1.5]

    Fetch[style=invis,shape=box,height=1]

    Ret[style=invis,shape=box,height=1.5]
}


*/

const PROCESSOR_GRAPH_PREAMBLE = `digraph {
    edge [headport="w"]
    rankdir="LR";
`

function construct_reduced_processor_dot(dispatch_width, num_ports, retire_width) {
    let dot_code = PROCESSOR_GRAPH_PREAMBLE;
    // --- DISPATCH ---
    dot_code += `
    node [fontsize=8, fontname="Arial"];
    Fetch[style=invis,shape=box,height=0.6,width=0.1,fixedsize=true]
    `
    dot_code += `Dispatch[shape=box,height=0.6,width=0.6,fixedsize=true,label="D\nw=${dispatch_width}"]\n`
    dot_code += `Fetch -> Dispatch\n`

    // --- EXECUTE ---
    dot_code += `subgraph cluster_execute {
      rankdir="LR";`

    let shown_ports=[]
    if(num_ports>=4){
      shown_ports=[0,1,2,num_ports-1];
      for (let i = 0; i < 3; i++) {
        dot_code += `P${i} [shape=box3d,height=0.2,width=0.4,fixedsize=true];\n`
      }
      if(num_ports>4){
        dot_code += `"..." [shape=plaintext,height=0.05,width=0.4,fixedsize=true,fontsize=14];\n`
      }
      dot_code += `P${num_ports-1} [shape=box3d,height=0.2,width=0.4,fixedsize=true];\n`
    }
    else{
      for (let i = 0; i < num_ports; i++) {
        dot_code += `P${i} [shape=box3d,height=0.2,width=0.4,fixedsize=true];\n`
        shown_ports.push(i);
      }
    }

    dot_code += `label = "Execute";
    }\n`

    for (let i in shown_ports) {
        dot_code += `Dispatch:e${i} -> P${shown_ports[i]}\n`
    }

    // --- WRITEBACK ---
    dot_code += `
    WriteBack[shape=box,height=0.6,width=0.6,fixedsize=true,label="WB\nw=${num_ports}"]
    `
    for (let i in shown_ports) {
        dot_code += `P${shown_ports[i]}:e -> WriteBack:w${i}\n`
    }

    // --- RETIRE ---
    dot_code += `Retire[shape=box,height=0.6,width=0.6,fixedsize=true,label="RET\nw=${retire_width}"]`

    dot_code += `
    Ret[style=invis,shape=box,height=1.5,width=0.1,fixedsize=true]
    `

    dot_code += `WriteBack -> Retire\n`

    dot_code += `Retire -> Ret\n`

    return dot_code + `}`
}


function construct_full_processor_dot(dispatch_width, num_ports, retire_width, usage=null) {
  let dot_code = PROCESSOR_GRAPH_PREAMBLE;

  // Colorscale from green to red
  let color = [
      "#00FF00",
      "#33FF00",
      "#66FF00",
      "#99FF00",
      "#CCFF00",
      "#FFFF00",
      "#FFCC00",
      "#FF9900",
      "#FF6600",
      "#FF3300",
      "#FF0000"
  ];

  console.log("Usage:");
  console.log(usage);

  // --- DISPATCH ---
  dot_code += `
  Fetch[style=invis,shape=box,height=1]
  `
  if (usage !== null) {
      let dispatch_color = color[Math.floor(usage.dispatch / 10)];
      dot_code += `Dispatch[shape=box,height=0.6,width=0.6,label="Dispatch\nw=${dispatch_width}\n", style=filled, fillcolor="${dispatch_color}", tooltip="Usage: ${usage.dispatch.toFixed(1)}%"]\n`
  } else {
      dot_code += `Dispatch[shape=box,height=0.6,width=0.6,label="Dispatch\nw=${dispatch_width}"]\n`
  }
  for (let i = 0; i < dispatch_width; i++) {
      dot_code += `Fetch:e${i} -> Dispatch:w${i}\n`
  }

  // --- EXECUTE ---
  dot_code += `subgraph cluster_execute {
      rankdir="LR";
  `
  for (let i = 0; i < num_ports; i++) {
      if (usage !== null) {
          let execute_color = color[Math.floor(usage.ports[i] / 10)];
          dot_code += `P${i} [shape=box3d,height=0.2,width=0.4, style=filled, fillcolor="${execute_color}", tooltip="Usage: ${usage.ports[i].toFixed(1)}%"];\n`
      } else {
          dot_code += `P${i} [shape=box3d,height=0.2,width=0.4];\n`
      }
  }

  dot_code += `label = "Execute";
  }\n`

  for (let i=0; i<num_ports; i++) {
      dot_code += `Dispatch:e${i} -> P${i}\n`
  }

  // --- WRITEBACK ---
  dot_code += `
  WriteBack[shape=box,height=0.6,width=0.6,label="Write Back\nw=${num_ports}"]
  `
  for (let i = 0; i < num_ports; i++) {
      dot_code += `P${i}:e -> WriteBack:w${i}\n`
  }

  // --- RETIRE ---
  if (usage !== null) {
      let retire_color = color[Math.floor(usage.retire / 10)];
      dot_code += `Retire[shape=box,height=0.6,width=0.6,label="Retire\nw=${retire_width}", style=filled, fillcolor="${retire_color}", tooltip="Usage: ${usage.retire.toFixed(1)}%"]`
  } else {
      dot_code += `Retire[shape=box,height=0.6,width=0.6,label="Retire\nw=${retire_width}"]`
  }

  dot_code += `
  Ret[style=invis,shape=box,height=0.6]
  `
  for (let i = 0; i < num_ports; i++) {
      dot_code += `WriteBack:e${i} -> Retire:w${i}\n`
  }
  for (let i = 0; i < retire_width; i++) {
      dot_code += `Retire:e${i} -> Ret:w${i}\n`
  }

  return dot_code + `}`
}
