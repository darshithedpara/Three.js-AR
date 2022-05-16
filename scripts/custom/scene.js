import { GLTFLoader } from "../three/jsm/loaders/GLTFLoader.js";
// import { DRACOLoader } from "../three/jsm/loaders/DRACOLoader.js";
import { handleXRHitTest } from "./hitTest.js";
import * as THREE from "./../three/three.module.js";
import * as TWEEN from "./../tween.js"
import {hidePercentage, showARButton, showPercentage, stopPreloadAnimation, updatePercentage} from "./domUtils.js";
import {ARButton} from "../three/jsm/webxr/ARButton.js";

function createPlaneMarker() {
  // const planeMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const planeMarkerMaterial = new THREE.MeshPhongMaterial( {
      color: 0x156289,
      emissive: 0x072534,
      side: THREE.DoubleSide,
      flatShading: true
    } );

  const planeMarkerGeometry = new THREE.RingGeometry(0.14, 0.15, 16).rotateX(
    -Math.PI / 2,
  );

  const planeMarker = new THREE.Mesh(planeMarkerGeometry, planeMarkerMaterial);

  planeMarker.matrixAutoUpdate = false;

  return planeMarker;
}

export function createScene(renderer/*: WebGLRenderer*/, callback = null) {
  console.log('createScene called.')
  const scene = new THREE.Scene();
  let isObjectAddedInScene = false;

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.02,
    20,
  );

  /**
   * Add some simple ambient lights to illuminate the model.
   */
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
  console.log('light added to the scene.')

  /**
   * Load the gLTF model and assign result to variable.
   */
  const gltfLoader = new GLTFLoader();
  // const gltfLoader = new DRACOLoader();

  let Glb3dModel/*: Object3D*/;

  gltfLoader.load("../models/chair.glb", (gltf/*: GLTF*/) => {
    console.log('gltf', gltf)
    Glb3dModel = gltf.scene.children[0];
    console.log('models loading completed.!', Glb3dModel)
    stopPreloadAnimation();
    }, function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      const text = '3d Model downloading : ' + (xhr.loaded / xhr.total * 100).toFixed(0) + ' %'
      showPercentage()
      updatePercentage(text)
      if ( (xhr.loaded / xhr.total * 100) >= 100 ) {
        hidePercentage()
        document.body.appendChild(
          ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] }),
        );
      }
    },
    // called when loading has errors
    function (error) {
      console.log('An error happened');
      stopPreloadAnimation();
    });

  /**
   * Create the plane marker to show on tracked surfaces.
   */
  const planeMarker/*: Mesh*/ = createPlaneMarker();
  scene.add(planeMarker);
  console.log('planeMarker added to the scene.')

  /**
   * Setup the controller to get input from the XR space.
   */
  const controller = renderer.xr.getController(0);
  scene.add(controller);
  console.log('controller added to the scene.')

  controller.addEventListener("select", onSelect);

  /**
   * The onSelect function is called whenever we tap the screen
   * in XR mode.
   */
  function onSelect() {
    // console.log('onSelect Called.')
    if (planeMarker.visible && ! isObjectAddedInScene) {
      const model = Glb3dModel.clone();

      // Place the model on the spot where the marker is showing.
      model.position.setFromMatrixPosition(planeMarker.matrix);
      console.log('model', model)
      console.log('model.scale', model.scale)
      model.name = 'chair'
      model.scale.set(0.2,0.2,0.2)

      new TWEEN.Tween( model.scale ).onStart(() => {
              console.log('chair animation started..')
            }).onComplete(() => {
              console.log('chair animation completed..')
            })
            .to({
                  x: 1,
                  y: 1,
                  z: 1,
              }, 1500)
            .easing( TWEEN.Easing.Bounce.InOut )
            .start();

      // Rotate the model randomly to give a bit of variation.
      // model.rotation.y = Math.random() * (Math.PI * 2);
      model.rotation.y = 0.30;
      model.visible = true;

      isObjectAddedInScene = true;
      planeMarker.visible = false;
      scene.add(model);
    }
  }

  /**
   * Called whenever a new hit test result is ready.
   */
  function onHitTestResultReady(hitPoseTransformed/*: Float32Array*/) {
    // console.log('onHitTestResultReady Called.')
    if (hitPoseTransformed && !isObjectAddedInScene) {
      planeMarker.visible = true;
      planeMarker.matrix.fromArray(hitPoseTransformed);
    }
  }

  /**
   * Called whenever the hit test is empty/unsuccesful.
   */
  function onHitTestResultEmpty() {
    // console.log('onHitTestResultEmpty Called.')
    planeMarker.visible = false;
  }

  function removeChair() {
    const selectedObject = scene.getObjectByName('chair');
    if (selectedObject) {
      isObjectAddedInScene = false;
      scene.remove( selectedObject );
      renderer.render(scene, camera);
    }
  }

  /**
   * The main render loop.
   *
   * This is where we perform hit-tests and update the scene
   * whenever anything changes.
   */
  const renderLoop = (timestamp/*: any*/, frame = null/*: XRFrame*/) => {
    if (renderer.xr.isPresenting) {
      if (frame) {
        handleXRHitTest(
          renderer,
          frame,
          onHitTestResultReady,
          onHitTestResultEmpty,
          removeChair
        );
      }

      renderer.render(scene, camera);
    }
    TWEEN.update();
  };

  renderer.setAnimationLoop(renderLoop);
}



