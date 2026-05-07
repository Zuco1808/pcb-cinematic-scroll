import * as THREE from 'three';
export function setupLighting(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 2.0);
  scene.add(ambient);
  const keyLight = new THREE.SpotLight(0xffffff, 18);
  keyLight.position.set(-4, 8, 5);
  keyLight.target.position.set(0, 0, 0);
  keyLight.angle = Math.PI/5; keyLight.penumbra = 0.3;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = keyLight.shadow.mapSize.height = 2048;
  scene.add(keyLight); scene.add(keyLight.target);
  const fillLight = new THREE.PointLight(0x5FABDB, 4, 20);
  fillLight.position.set(6, 2, 4); scene.add(fillLight);
  const rimLight = new THREE.SpotLight(0x5FABDB, 6);
  rimLight.position.set(2, -2, -6); rimLight.target.position.set(0, 0, 0);
  rimLight.angle = Math.PI/4; rimLight.penumbra = 0.5;
  scene.add(rimLight); scene.add(rimLight.target);
  const underglow = new THREE.PointLight(0xC8941A, 2.5, 10);
  underglow.position.set(0, -2, 0); scene.add(underglow);
  const topLight = new THREE.DirectionalLight(0xffffff, 5);
  topLight.position.set(0, 10, 2); scene.add(topLight);
  return { keyLight, fillLight, rimLight, underglow, topLight };
}
