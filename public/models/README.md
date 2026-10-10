# Three.js and Blender handoff

The first version uses an original procedural Three.js model from src/scene.js.
A validated browser export is included here as sentinel-iot-core.glb.

In the portfolio, open **Explore the 3D model** and select **Export model for Blender**.
Import sentinel-iot-core.glb in Blender through File → Import → glTF 2.0.

Named objects include Sentinel_Core, Input_Projection, Convolution, Self_Attention,
Prediction_Heads, Telemetry_Orbit, Source_00_Network through Source_12_Windows_10,
Containment_Boundary and Audit_Record.

To replace the central processor with a Blender asset:

1. Export your central core as glTF Binary (.glb), with materials and transforms applied.
2. Save it here as sentinel-core.glb.
3. Change modelUrl in src/project.js to '/models/sentinel-core.glb'.
4. The loader centers and scales the asset; the 13-node orbit and incident story stay procedural.

For independently animated Blender layers, keep the named objects above and extend
the named object bindings in src/scene.js. The default imported model replaces the
central core; its geometry is not automatically separated into layers.

No Blender installation is required to view this portfolio.
