async function setup() {
    const patchExportURL = "rnbo_export/rnbodelay.export.json";
  
    // Create AudioContext
    const WAContext = window.AudioContext || window.webkitAudioContext;
    const context = new WAContext();
  
    // Create gain node and connect it to audio output
    const outputNode = context.createGain();
    outputNode.connect(context.destination);
  
    // Fetch the exported patcher
    let response, patcher;
    try {
      response = await fetch(patchExportURL);
      patcher = await response.json();
  
      if (!window.RNBO) {
        // Load RNBO script dynamically
        // Note that you can skip this by knowing the RNBO version of your patch
        // beforehand and just include it using a <script> tag
        await loadRNBOScript(patcher.desc.meta.rnboversion);
      }
    } catch (err) {
      const errorContext = {
        error: err
      };
      if (response && (response.status >= 300 || response.status < 200)) {
        (errorContext.header = `Couldn't load patcher export bundle`),
          (errorContext.description =
            `Check app.js to see what file it's trying to load. Currently it's` +
            ` trying to load "${patchExportURL}". If that doesn't` +
            ` match the name of the file you exported from RNBO, modify` +
            ` patchExportURL in app.js.`);
      }
      if (typeof guardrails === "function") {
        guardrails(errorContext);
      } else {
        throw err;
      }
      return;
    }
  
    // Create the device
    let device;
    try {
      device = await RNBO.createDevice({ context, patcher });
    } catch (err) {
      if (typeof guardrails === "function") {
        guardrails({ error: err });
      } else {
        throw err;
      }
      return;
    }

    device.node.connect(outputNode);

    const onOff = device.parametersById.get("on/off");

    context.suspend();
    document.getElementById("start-button").onclick = (e) => {
      if (document.getElementById("start-button").innerHTML == "Start Audio") {
        context.resume();
        onOff.value = 1;
        document.getElementById("start-button").innerHTML = "Stop Audio";
      } else {
        context.suspend();
        onOff.value = 0;
        document.getElementById("start-button").innerHTML = "Start Audio";
      }
    }

    device.parameters.forEach(parameter => {
        // Each parameter has an ID as well as a name. The ID will include
        // the full path to the parameter, including the names of any parent
        // patchers if the parameter is in a subpatcher. So if the path contains
        // any "/" characters, you know that it's not a top level parameter.
    
        // Uncomment this line to include only top level parameters.
        // if (parameter.id.includes("/")) return;
    
        console.log(parameter.id);
        console.log(parameter.name);
    });

}

setup();