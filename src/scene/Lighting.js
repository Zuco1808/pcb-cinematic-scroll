// scene/Lighting.js
import * as THREE from 'three';

export function setupLighting(scene) {
  // Ambient — bijelo, jako (bijela pozadina treba jake svjetla)
  const ambient = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambient);

  // Key light — čisto bijelo, odozgo-lijevo
  const keyLight = new THREE.SpotLight(0xffffff, 15);
  keyLight.position.set(-4, 8, 5);
  keyLight.target.position.set(0, 0, 0);
  keyLight.angle = Math.PI / 5;
  keyLight.penumbra = 0.3;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width  = 2048;
  keyLight.shadow.mapSize.height = 2048;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Fill — TRING plava, desno
  const fillLight = new THREE.PointLight(0x5FABDB, 5, 20);
  fillLight.position.set(6, 2, 4);
  scene.add(fillLight);

  // Rim — plavi odsjaj s pozadi
  const rimLight = new THREE.SpotLight(0x5FABDB, 8);
  rimLight.position.set(2, -2, -6);
  rimLight.target.position.set(0, 0, 0);
  rimLight.angle = Math.PI / 4;
  rimLight.penumbra = 0.5;
  scene.add(rimLight);
  scene.add(rimLight.target);

  // Underglow — zlatni ispod pločice (bakrene trace)
  const underglow = new THREE.PointLight(0xC8941A, 3, 10);
  underglow.position.set(0, -2, 0);
  scene.add(underglow);

  // Top light — čisto bijelo odozgo
  const topLight = new THREE.DirectionalLight(0xffffff, 3);
  topLight.position.set(0, 10, 0);
  scene.add(topLight);

  return { keyLight, fillLight, rimLight, underglow, topLight };
}
