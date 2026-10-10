// User-confirmed project identity. Keep portfolio content independent of dashboard state.
export const project = {
  name: 'Sentinel-IoT',
  university: 'Bahria University',
  team: ['Abdullah Bin Zubair Hashmi', 'Wajahat Ali Tariq'],
  supervisor: 'Dr Usman Hashmi',
  coSupervisor: 'Dr Farman Ali',
  // Set to '/models/sentinel-core.glb' after adding your Blender export.
  modelUrl: null,
};
export const chapterStates = [
  { top: 'SENTINEL / NEURAL CORE', side: '13 CONNECTED DOMAINS', bottom: 'EXPLAINABLE INDUSTRIAL SECURITY', status: 'System in balance', color: '#ff7768' },
  { top: 'OBSERVE / TELEMETRY', side: 'NETWORK · SENSORS · HOSTS', bottom: 'THIRTEEN SOURCES / ONE PIPELINE', status: 'Signals connected', color: '#b3df93' },
  { top: 'INVESTIGATE / ANOMALY', side: 'UNEXPECTED ACTIVITY', bottom: 'ILLUSTRATIVE INTRUSION', status: 'A pattern has changed', color: '#ff7768' },
  { top: 'DETECT / CONFORMER', side: 'CONVOLUTION + ATTENTION', bottom: 'TEN STEPS / TWO PREDICTION HEADS', status: 'Detection meets context', color: '#f4c66c' },
  { top: 'EXPLAIN / SALIENCY', side: 'FEATURE INFLUENCE', bottom: 'AN ALERT WITH AN EXPLANATION', status: 'Evidence comes into focus', color: '#b4a0fa' },
  { top: 'RESPOND / OPERATOR CONTROL', side: 'CONTAINMENT DEMONSTRATION', bottom: 'ASSESS / CONFIRM / RESPOND', status: 'Protect what matters', color: '#8cdbcd' },
  { top: 'RECORD / GOVERNANCE', side: 'TRACEABLE RESPONSE', bottom: 'CONTROL MAPPINGS / AUDIT TRAIL', status: 'A record for review', color: '#b3df93' },
  { top: 'SENTINEL / SYSTEM', side: 'DETECTION / EXPLANATION / RESPONSE', bottom: 'THE RESEARCH PROTOTYPE', status: 'The complete picture', color: '#ff7768' },
  { top: 'SENTINEL / THE PEOPLE', side: 'BAHRIA UNIVERSITY', bottom: 'ABDULLAH + WAJAHAT / FINAL YEAR PROJECT', status: 'The story comes together', color: '#ff7768' },
  { top: 'SENTINEL / DOWNLOADS', side: 'HOST · CLIENT · DASHBOARD', bottom: 'WINDOWS / SETUP + LAUNCH', status: 'Choose your package', color: '#8cdbcd' },
];

const modelForms=[
  ['Sentinel core','An assembled three-dimensional processor inside a circular orbit of thirteen telemetry nodes.'],
  ['Connected constellation','The same processor opens into a constellation, with telemetry nodes arranged in three connected clusters.'],
  ['Disrupted spiral','The processor fragments and the telemetry nodes stretch into a disrupted three-dimensional spiral.'],
  ['Conformer tower','The processor layers separate into a tall Conformer tower, surrounded by a helical flow of telemetry nodes.'],
  ['Feature landscape','The layers become upright evidence panels and the coloured features rise into a three-dimensional saliency chart.'],
  ['Containment shield','Processor panels and telemetry nodes assemble into a shield surrounded by a containment boundary.'],
  ['Evidence folio','The processor layers transform into stacked evidence pages, with a linked row of telemetry records beneath.'],
  ['Connected architecture','The model becomes a connected architecture of horizontal processing tiers and rows of telemetry nodes.'],
  ['Sentinel signature','All components return to an assembled Sentinel processor, completing the story beside the project team.'],
  ['Deployment arrows','The same processor, telemetry nodes and light arcs form three arrows: left for the host installer, right for the client installer, and down for the dashboard launcher.'],
];
chapterStates.forEach((state,i)=>{state.form=modelForms[i][0];state.description=modelForms[i][1];state.status=modelForms[i][0];});
