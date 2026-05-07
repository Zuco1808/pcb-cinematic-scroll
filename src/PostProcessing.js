// PostProcessing.js
import * as THREE from 'three';
import { EffectComposer }   from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }       from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass }  from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass }       from 'three/examples/jsm/postprocessing/OutputPass.js';

export function setupPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  // 1. Base render
  composer.addPass(new RenderPass(scene, camera));

  // 2. Bloom — PCB glow i reflekcije
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.30,   // strength — light theme
    0.35,   // radius
    0.90    // threshold
  );
  composer.addPass(bloom);

  // 3. Output (color space correction)
  composer.addPass(new OutputPass());

  return { composer, bloom };
}
