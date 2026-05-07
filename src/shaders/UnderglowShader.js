// shaders/UnderglowShader.js

export const underglowVert = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv    = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPosition = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const underglowFrag = /* glsl */`
  uniform float uTime;
  uniform vec3  uGlowColor;
  uniform float uGlowIntensity;
  uniform float uEdgePower;
  uniform vec3  uBaseColor;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - dot(vNormal, viewDir), uEdgePower);

    float pulse = sin(uTime * 1.8) * 0.12 + 0.88;

    // UV-based glow pattern (PCB trace simulation)
    float gridX = abs(sin(vUv.x * 20.0)) * 0.5;
    float gridY = abs(sin(vUv.y * 20.0)) * 0.5;
    float traceGlow = max(gridX, gridY) * 0.15;

    vec3 glowContrib  = uGlowColor * fresnel * uGlowIntensity * pulse;
    vec3 traceContrib = uGlowColor * traceGlow;
    vec3 finalColor   = uBaseColor + glowContrib + traceContrib;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

import * as THREE from 'three';

export function createUnderglowMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader:   underglowVert,
    fragmentShader: underglowFrag,
    uniforms: {
      uTime:          { value: 0 },
      uGlowColor:     { value: new THREE.Color(0x5FABDB) },
      uGlowIntensity: { value: 0.5 },
      uEdgePower:     { value: 2.8 },
      uBaseColor:     { value: new THREE.Color(0x1a5c8a) },
    },
    side: THREE.FrontSide,
  });
}
