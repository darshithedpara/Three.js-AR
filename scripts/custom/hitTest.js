let hitTestSource/*: XRHitTestSource*/;
let hitTestSourceRequested = false;

export function handleXRHitTest(
  renderer/*: WebGLRenderer*/,
  frame/*: XRFrame*/,
  onHitTestResultReady,
  onHitTestResultEmpty,
  removeChair,
) {
  const referenceSpace = renderer.xr.getReferenceSpace();
  const session = renderer.xr.getSession();

  let xrHitPoseMatrix/*: Float32Array | null | undefined*/;

  session.addEventListener("end", onSessionEnd);

  setupSource();

  if (hitTestSource) {
    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length) {
      const hit = hitTestResults[0];

      if (hit && hit !== null && referenceSpace) {
        const xrHitPose = hit.getPose(referenceSpace);

        if (xrHitPose) {
          xrHitPoseMatrix = xrHitPose.transform.matrix;
          onHitTestResultReady(xrHitPoseMatrix);
        }
      }
    } else {
      onHitTestResultEmpty();
    }
  }

  function setupSource() {
  if (session && hitTestSourceRequested === false) {
      session.requestReferenceSpace("viewer").then((referenceSpace) => {
        if (session) {
          session
            .requestHitTestSource({ space: referenceSpace })
            .then((source) => {
              hitTestSource = source;
            });
        }
      });

      hitTestSourceRequested = true;
    }
  }

  function onSessionEnd() {
    console.log('onSessionEnd called')
    hitTestSourceRequested = false;
    hitTestSource = null
    removeChair();
  }
}
