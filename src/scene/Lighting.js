import * as THREE from 'three';
export function setupLighting(scene) {
  // Ambient — toplo bijelo, jako za svijetlu scenu
  const ambient = new THREE.AmbientLight(0xeef6fc, 2.2);
  scene.add(ambient);

  // Key light — čisto bijelo odozgo-lijevo
  const keyLight = new THREE.SpotLight(0xffffff, 14);
  keyLight.position.set(-5, 9, 6);
  keyLight.target.position.set(0, 0, 0);
  keyLight.angle = Math.PI / 5;
  keyLight.penumbra = 0.35;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.radius = 3;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Fill — TRING plava, desno
  const fillLight = new THREE.PointLight(0x5FABDB, 3.5, 22);
  fillLight.position.set(7, 3, 5);
  scene.add(fillLight);

  // Rim — hladna plava s pozadi, naglašava ivice
  const rimLight = new THREE.SpotLight(0x7ec8e3, 5);
  rimLight.position.set(3, -1, -7);
  rimLight.target.position.set(0, 0, 0);
  rimLight.angle = Math.PI / 4;
  rimLight.penumbra = 0.6;
  scene.add(rimLight);
  scene.add(rimLight.target);

  // Underglow — zlatni ispod pločice (bakrene trace)
  const underglow = new THREE.PointLight(0xC8941A, 2.0, 9);
  underglow.position.set(0, -2.5, 0);
  scene.add(underglow);

  // Top directional — ravnomjerno odozgo
  const topLight = new THREE.DirectionalLight(0xffffff, 4);
  topLight.position.set(0, 10, 3);
  topLight.castShadow = false;
  scene.add(topLight);

  return { keyLight, fillLight, rimLight, underglow, topLight };
}
