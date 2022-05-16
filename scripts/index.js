// import { WebGLRenderer } from "./three/renderers/WebGLRenderer.js";
import * as THREE from "./three/three.module.js";
import { ARButton } from "./three/jsm/webxr/ARButton.js";
import { createScene } from "./custom/scene.js";
import {
  browserHasImmersiveArCompatibility,
  displayIntroductionMessage,
  displayUnsupportedBrowserMessage, hideARButton, showARButton,
} from "./custom/domUtils.js";


function initializeXRApp() {
  const { devicePixelRatio, innerHeight, innerWidth } = window;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);

  renderer.xr.enabled = true;

  document.body.appendChild(renderer.domElement);

  displayIntroductionMessage();

  createScene(renderer);
}

async function start() {
  const isImmersiveArSupported = await browserHasImmersiveArCompatibility();

  isImmersiveArSupported
    ? initializeXRApp()
    : displayUnsupportedBrowserMessage();
}

start().then(r => console.log("Started..."));

