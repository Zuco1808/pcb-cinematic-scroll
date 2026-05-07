// scene/Lighting.js
import * as THREE from 'three';

export function setupLighting(scene) {
  // Ambient — minimalan
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  // Key Light — hladno bijela, odozgo-lijevo
  const keyLight = new THREE.SpotLight(0xffffff, 12);
  keyLight.position.set(-4, 6, 4);
  keyLight.target.position.set(0, 0, 0);
  keyLight.angle = Math.PI / 6;
  keyLight.penumbra = 0.4;
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width  = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far  = 20;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // Fill Light — topla, desno
  const fillLight = new THREE.PointLight(0x5FABDB, 4.0, 20);
  fillLight.position.set(5, 1, 3);
  scene.add(fillLight);

  // Rim Light — naglašava ivice komponenti
  const rimLight = new THREE.SpotLight(0x5FABDB, 6);
  rimLight.position.set(2, -1, -5);
  rimLight.target.position.set(0, 0, 0);
  rimLight.angle = Math.PI / 4;
  rimLight.penumbra = 0.6;
  scene.add(rimLight);
  scene.add(rimLight.target);

  // PCB Underglow — zelenkasto ispod pločice
  const underglow = new THREE.PointLight(0x5FABDB, 2.5, 10);
  underglow.position.set(0, -1.5, 0);
  scene.add(underglow);

  // Accent — plavi odsjaj s pozadi
  const accent = new THREE.PointLight(0x3d8ec2, 2.5, 15);
  accent.position.set(-3, 2, -6);
  scene.add(accent);

  return { keyLight, fillLight, rimLight, underglow, accent };
}
