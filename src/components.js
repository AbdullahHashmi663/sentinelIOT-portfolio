// The labels describe the research prototype and the teaching model separately.
// Anchors resolve to scene objects; telemetry indices follow scene.js nodeNames.
export const modelComponents = [
  {
    id: 'core', title: 'Sentinel core', short: 'One shared detection pipeline',
    description: 'This assembly illustrates Sentinel’s software detection pipeline. Its chip-like appearance is a visual metaphor for the research system.',
    group: 'Intelligence', anchor: 'core',
  },
  {
    id: 'base', title: 'Core foundation', short: 'The platform beneath the layers',
    description: 'The base visually supports the processing layers as the model transforms. It is a decorative part of this 3D teaching model.',
    group: 'Story visuals', anchor: 'base',
  },
  {
    id: 'lid', title: 'Processor casing', short: 'A frame for the intelligence',
    description: 'The casing opens and moves to make the processing story easier to follow. Its geometry is a visual design element.',
    group: 'Story visuals', anchor: 'lid',
  },
  {
    id: 'beacon', title: 'Decision beacon', short: 'A visible symbol of model output',
    description: 'The glowing diamond gives the software’s prediction a visible focal point. Its light and movement are storytelling effects.',
    group: 'Intelligence', anchor: 'beacon',
  },
  {
    id: 'pins', title: 'Connection pins', short: 'A chip-inspired visual detail',
    description: 'These gold pins complete the processor silhouette. They are decorative and do not represent physical interfaces used by the prototype.',
    group: 'Story visuals', anchor: 'pins',
  },
  {
    id: 'input', title: 'Input projection', short: 'Prepare features for processing',
    description: 'The input stage maps feature sequences into the representation used by the model. Each sequence contains ten time steps.',
    group: 'Intelligence', anchor: 'layer:0',
  },
  {
    id: 'convolution', title: 'Convolution', short: 'Find local patterns',
    description: 'Convolution captures nearby changes within a feature sequence. This plate illustrates that stage of the Conformer architecture.',
    group: 'Intelligence', anchor: 'layer:1',
  },
  {
    id: 'attention', title: 'Self-attention', short: 'Connect events over time',
    description: 'Self-attention relates events across the sequence to provide temporal context. The separated plate makes that processing stage visible.',
    group: 'Intelligence', anchor: 'layer:2',
  },
  {
    id: 'prediction', title: 'Prediction heads', short: 'Detect an anomaly and classify it',
    description: 'Two prediction heads produce a binary anomaly decision and a forensic attack classification. One visual plate represents both outputs.',
    group: 'Intelligence', anchor: 'layer:3',
  },
  {
    id: 'network', title: 'Network traffic', short: 'TON_IoT network domain',
    description: 'This node represents network-traffic records from the TON_IoT research dataset. The portfolio shows an illustrated source, rather than a live network feed.',
    group: 'Telemetry', anchor: 'node:0',
  },
  {
    id: 'fridge', title: 'Fridge sensor', short: 'TON_IoT IoT domain',
    description: 'This node represents the Fridge sensor domain in TON_IoT. It is one of seven IoT sources illustrated around the core.',
    group: 'Telemetry', anchor: 'node:1',
  },
  {
    id: 'gps', title: 'GPS tracker', short: 'TON_IoT IoT domain',
    description: 'This node represents the GPS_Tracker domain in TON_IoT. Its movement in the scene is part of the visual story.',
    group: 'Telemetry', anchor: 'node:2',
  },
  {
    id: 'garage', title: 'Garage door', short: 'TON_IoT IoT domain',
    description: 'This node represents the Garage_Door sensor domain in TON_IoT. The model places this source alongside other IoT telemetry.',
    group: 'Telemetry', anchor: 'node:3',
  },
  {
    id: 'modbus', title: 'Modbus telemetry', short: 'TON_IoT industrial IoT domain',
    description: 'This node represents the Modbus domain in TON_IoT. The intrusion chapter highlights it in a simulated incident.',
    group: 'Telemetry', anchor: 'node:4',
  },
  {
    id: 'motion', title: 'Motion light', short: 'TON_IoT IoT domain',
    description: 'This node represents the Motion_Light sensor domain in TON_IoT. It illustrates a separate source entering the shared analysis pipeline.',
    group: 'Telemetry', anchor: 'node:5',
  },
  {
    id: 'thermostat', title: 'Thermostat', short: 'TON_IoT IoT domain',
    description: 'This node represents the Thermostat sensor domain in TON_IoT. Its connecting path illustrates how sensor records reach the core.',
    group: 'Telemetry', anchor: 'node:6',
  },
  {
    id: 'weather', title: 'Weather sensor', short: 'TON_IoT IoT domain',
    description: 'This node represents the Weather sensor domain in TON_IoT. It completes the seven illustrated IoT sources.',
    group: 'Telemetry', anchor: 'node:7',
  },
  {
    id: 'linux-disk', title: 'Linux disk', short: 'TON_IoT host domain',
    description: 'This node represents Linux_Disk host records in TON_IoT. Host activity adds another view alongside network and sensor data.',
    group: 'Telemetry', anchor: 'node:8',
  },
  {
    id: 'linux-memory', title: 'Linux memory', short: 'TON_IoT host domain',
    description: 'This node represents Linux_Memory host records in TON_IoT. It is one of five host domains included in the research pipeline.',
    group: 'Telemetry', anchor: 'node:9',
  },
  {
    id: 'linux-process', title: 'Linux processes', short: 'TON_IoT host domain',
    description: 'This node represents Linux_Process host records in TON_IoT. It illustrates the process-activity source within the host group.',
    group: 'Telemetry', anchor: 'node:10',
  },
  {
    id: 'windows-7', title: 'Windows 7 host', short: 'TON_IoT host domain',
    description: 'This node represents Windows_7 host records in TON_IoT. The label identifies a dataset domain used by the research prototype.',
    group: 'Telemetry', anchor: 'node:11',
  },
  {
    id: 'windows-10', title: 'Windows 10 host', short: 'TON_IoT host domain',
    description: 'This node represents Windows_10 host records in TON_IoT. Together, the host nodes complete the thirteen illustrated telemetry domains.',
    group: 'Telemetry', anchor: 'node:12',
  },
  {
    id: 'paths', title: 'Signal paths', short: 'Sources connect to the core',
    description: 'The thin lines connect telemetry sources to the processing assembly. They illustrate data flow through the software pipeline.',
    group: 'Telemetry', anchor: 'path:0',
  },
  {
    id: 'packets', title: 'Travelling signals', short: 'A visual trace of incoming records',
    description: 'The moving points help you follow signals toward the core. Their timing is animated for the story and does not show live packet traffic.',
    group: 'Telemetry', anchor: 'packet:0',
  },
  {
    id: 'arcs', title: 'Transforming arcs', short: 'The outline follows each chapter',
    description: 'Seven light arcs rearrange into an orbit, helix, shield, evidence frame and three download arrows. These shapes visually connect the chapters.',
    group: 'Story visuals', anchor: 'orbit',
  },
  {
    id: 'context', title: 'Context rings', short: 'A symbol of temporal context',
    description: 'The intersecting rings illustrate how the model considers a sequence of events. They are a visual metaphor for context across ten time steps.',
    group: 'Story visuals', anchor: 'gyro',
  },
  {
    id: 'threat', title: 'Illustrative threat', short: 'Follow the simulated incident',
    description: 'The red marker introduces unexpected activity at an industrial node. This animation is a demonstration; no attack is sent to a network.',
    group: 'Story visuals', anchor: 'threat',
  },
  {
    id: 'saliency', title: 'Feature influence', short: 'See why an input matters',
    description: 'The rising bars illustrate gradient saliency: input features that influence a prediction. Their heights are illustrative; real attributions depend on the input.',
    group: 'Intelligence', anchor: 'saliency',
  },
  {
    id: 'shield', title: 'Containment boundary', short: 'An operator-guided response',
    description: 'The wireframe boundary visualizes a proposed containment response. Actions in this portfolio are simulated and do not isolate real devices.',
    group: 'Story visuals', anchor: 'shield',
  },
  {
    id: 'evidence', title: 'Audit record', short: 'Keep the investigation traceable',
    description: 'The record symbol illustrates the link between an alert, its explanation and the proposed response. The research prototype supports audit records for review.',
    group: 'Intelligence', anchor: 'evidence',
  },
];

// Three guided labels per chapter keep the centred scene easy to read.
// The complete component catalogue remains available for deeper inspection.
export const chapterComponents = [
  ['core', 'beacon', 'arcs'],
  ['network', 'paths', 'packets'],
  ['modbus', 'threat', 'paths'],
  ['input', 'convolution', 'attention'],
  ['saliency', 'prediction', 'network'],
  ['shield', 'threat', 'modbus'],
  ['evidence', 'base', 'paths'],
  ['input', 'attention', 'prediction'],
  ['core', 'lid', 'pins'],
  ['arcs', 'paths', 'core'],
];
