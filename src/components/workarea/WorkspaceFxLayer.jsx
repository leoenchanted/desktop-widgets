import React, { useEffect, useRef } from 'react';

const THREE_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const MOBILE_QUERY = '(max-width: 720px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

let threeLoadPromise;

function loadThree() {
  if (window.THREE) {
    window.__workspaceThreeSource = window.__workspaceThreeSource || 'cdn';
    return Promise.resolve(window.THREE);
  }
  if (threeLoadPromise) return threeLoadPromise;

  threeLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-three-cdn="${THREE_CDN_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.THREE), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = THREE_CDN_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.dataset.threeCdn = THREE_CDN_URL;
    script.onload = () => {
      if (window.THREE) {
        window.__workspaceThreeSource = 'cdn';
        resolve(window.THREE);
      }
      else reject(new Error('Three.js CDN loaded without exposing window.THREE'));
    };
    script.onerror = reject;
    document.head.appendChild(script);
  }).catch(async (error) => {
    console.warn('Three.js CDN failed, falling back to bundled package', error);
    const module = await import('three');
    window.__workspaceThreeSource = 'bundle';
    return module;
  });

  return threeLoadPromise;
}

function getQualityScale() {
  const isMobile = window.matchMedia?.(MOBILE_QUERY).matches;
  const reduceMotion = window.matchMedia?.(REDUCED_MOTION_QUERY).matches;
  if (reduceMotion) return 0.38;
  if (isMobile) return 0.55;
  return 1;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function disposeNode(node) {
  node.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}

function buildStorm(THREE, scene, qualityScale, isGlobal) {
  const group = new THREE.Group();
  const rainCount = Math.max(isGlobal ? 4200 : 420, Math.round((isGlobal ? 11800 : 1350) * qualityScale));
  const spanX = isGlobal ? 1080 : 260;
  const topY = isGlobal ? 470 : 240;
  const bottomY = isGlobal ? -360 : -210;
  const spanZ = isGlobal ? 480 : 180;
  const positions = new Float32Array(rainCount * 6);
  const speeds = new Float32Array(rainCount);
  const lengths = new Float32Array(rainCount);

  for (let i = 0; i < rainCount; i += 1) {
    const x = randomRange(-spanX, spanX);
    const y = randomRange(bottomY, topY);
    const z = randomRange(-spanZ, isGlobal ? 140 : 100);
    const length = randomRange(isGlobal ? 20 : 10, isGlobal ? 44 : 22);
    const offset = i * 6;
    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
    positions[offset + 3] = x + randomRange(-2, 2);
    positions[offset + 4] = y - length;
    positions[offset + 5] = z;
    speeds[i] = randomRange(isGlobal ? 11.5 : 5.8, isGlobal ? 21 : 10.5);
    lengths[i] = length;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xcfeaff,
    transparent: true,
    opacity: isGlobal ? 0.46 : 0.22,
  });
  const rain = new THREE.LineSegments(geometry, material);
  group.add(rain);

  const cloudGeometry = new THREE.DodecahedronGeometry(18, 1);
  const cloudMaterial = new THREE.MeshLambertMaterial({
    color: 0x101722,
    transparent: true,
    opacity: 0.38,
  });
  const cloudGroup = new THREE.Group();
  const cloudCount = Math.max(isGlobal ? 16 : 5, Math.round((isGlobal ? 34 : 12) * qualityScale));
  for (let i = 0; i < cloudCount; i += 1) {
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.set(randomRange(-spanX, spanX), randomRange(isGlobal ? 155 : 86, isGlobal ? 245 : 130), randomRange(-spanZ, -30));
    cloud.scale.set(randomRange(2.2, isGlobal ? 8.2 : 4.8), randomRange(0.6, 1.1), randomRange(1.2, isGlobal ? 4.4 : 2.4));
    cloud.rotation.set(randomRange(-0.1, 0.1), randomRange(0, Math.PI), randomRange(-0.12, 0.12));
    cloudGroup.add(cloud);
  }
  group.add(cloudGroup);

  const flashLight = new THREE.PointLight(0xffffff, 0, isGlobal ? 1300 : 520);
  flashLight.position.set(0, isGlobal ? 260 : 135, 40);
  group.add(flashLight);
  scene.add(group);

  let flashLife = 0;

  return {
    update(elapsed) {
      const data = rain.geometry.attributes.position.array;
      for (let i = 0; i < rainCount; i += 1) {
        const offset = i * 6;
        data[offset + 1] -= speeds[i];
        data[offset + 4] = data[offset + 1] - lengths[i];
        data[offset] += Math.sin(elapsed * 1.6 + i) * 0.06;
        data[offset + 3] = data[offset] + 1.4;

        if (data[offset + 1] < bottomY) {
          data[offset] = randomRange(-spanX, spanX);
          data[offset + 1] = randomRange(topY - 70, topY + 30);
          data[offset + 2] = randomRange(-spanZ, isGlobal ? 140 : 100);
          data[offset + 3] = data[offset] + randomRange(-2, 2);
          data[offset + 4] = data[offset + 1] - lengths[i];
          data[offset + 5] = data[offset + 2];
        }
      }
      rain.geometry.attributes.position.needsUpdate = true;
      cloudGroup.rotation.y = Math.sin(elapsed * 0.08) * 0.08;

      if (flashLife <= 0 && Math.random() < (isGlobal ? 0.012 : 0.0045) * qualityScale) {
        flashLife = isGlobal ? 7 : 5;
        flashLight.position.x = randomRange(-spanX * 0.7, spanX * 0.7);
      }
      if (flashLife > 0) {
        flashLight.intensity = flashLife * (isGlobal ? 3.2 : 1.9);
        flashLife -= 1;
      } else {
        flashLight.intensity = 0;
      }
    },
    dispose() {
      disposeNode(group);
      scene.remove(group);
    },
  };
}

function buildGalaxy(THREE, scene, qualityScale, isGlobal) {
  const group = new THREE.Group();
  const starCount = Math.max(isGlobal ? 2400 : 1400, Math.round((isGlobal ? 8200 : 4200) * qualityScale));
  const maxRadius = isGlobal ? 720 : 430;
  const positions = new Float32Array(starCount * 3);
  const shifts = new Float32Array(starCount);

  for (let i = 0; i < starCount; i += 1) {
    const radius = Math.sqrt(Math.random()) * maxRadius;
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius * 0.62 + randomRange(isGlobal ? -170 : -120, isGlobal ? 170 : 120);
    positions[i * 3 + 2] = randomRange(isGlobal ? -620 : -420, isGlobal ? 220 : 180);
    shifts[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('shift', new THREE.BufferAttribute(shifts, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute float shift;
      uniform float time;
      varying float vLife;
      void main() {
        vLife = 0.36 + 0.64 * sin(time * 1.45 + shift);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 1.7 * (220.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vLife;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        gl_FragColor = vec4(0.74, 0.9, 1.0, vLife * (1.0 - d));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const stars = new THREE.Points(geometry, material);
  group.add(stars);
  scene.add(group);

  return {
    update(elapsed) {
      material.uniforms.time.value = elapsed;
      group.rotation.y = elapsed * 0.025;
      group.rotation.z = Math.sin(elapsed * 0.08) * 0.03;
    },
    dispose() {
      disposeNode(group);
      scene.remove(group);
    },
  };
}

function buildMatrix(THREE, scene, qualityScale, isGlobal) {
  const group = new THREE.Group();
  const streamCount = Math.max(isGlobal ? 800 : 420, Math.round((isGlobal ? 2400 : 1050) * qualityScale));
  const spanX = isGlobal ? 640 : 250;
  const topY = isGlobal ? 300 : 220;
  const bottomY = isGlobal ? -300 : -230;
  const spanZ = isGlobal ? 360 : 250;
  const positions = new Float32Array(streamCount * 6);
  const speeds = new Float32Array(streamCount);
  const lengths = new Float32Array(streamCount);

  for (let i = 0; i < streamCount; i += 1) {
    const x = randomRange(-spanX, spanX);
    const y = randomRange(bottomY, topY);
    const z = randomRange(-spanZ, isGlobal ? 150 : 120);
    const length = randomRange(8, 26);
    const offset = i * 6;
    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
    positions[offset + 3] = x;
    positions[offset + 4] = y - length;
    positions[offset + 5] = z;
    speeds[i] = randomRange(1.4, 4.2);
    lengths[i] = length;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0x9dfac9,
    transparent: true,
    opacity: 0.32,
  });
  const streams = new THREE.LineSegments(geometry, material);
  group.add(streams);
  scene.add(group);

  return {
    update() {
      const data = streams.geometry.attributes.position.array;
      for (let i = 0; i < streamCount; i += 1) {
        const offset = i * 6;
        data[offset + 1] -= speeds[i];
        data[offset + 4] = data[offset + 1] - lengths[i];
        if (data[offset + 1] < bottomY) {
          data[offset] = randomRange(-spanX, spanX);
          data[offset + 1] = randomRange(topY - 60, topY + 35);
          data[offset + 2] = randomRange(-spanZ, isGlobal ? 150 : 120);
          data[offset + 3] = data[offset];
          data[offset + 4] = data[offset + 1] - lengths[i];
          data[offset + 5] = data[offset + 2];
        }
      }
      streams.geometry.attributes.position.needsUpdate = true;
    },
    dispose() {
      disposeNode(group);
      scene.remove(group);
    },
  };
}

function buildMagma(THREE, scene, qualityScale, isGlobal) {
  const group = new THREE.Group();
  const particleCount = Math.max(isGlobal ? 620 : 360, Math.round((isGlobal ? 1800 : 980) * qualityScale));
  const spanX = isGlobal ? 620 : 250;
  const bottomY = isGlobal ? -300 : -220;
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];

  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = randomRange(-spanX, spanX);
    positions[i * 3 + 1] = randomRange(bottomY + 10, bottomY + 80);
    positions[i * 3 + 2] = randomRange(isGlobal ? -340 : -220, isGlobal ? 120 : 80);
    velocities.push({
      x: randomRange(-0.55, 0.55),
      y: randomRange(2.2, 6.2),
      z: randomRange(-0.35, 0.35),
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffb26d,
    size: 2.2,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(geometry, material);
  group.add(particles);
  scene.add(group);

  return {
    update(elapsed) {
      const data = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i += 1) {
        const offset = i * 3;
        const velocity = velocities[i];
        data[offset] += velocity.x + Math.sin(elapsed + i) * 0.025;
        data[offset + 1] += velocity.y;
        data[offset + 2] += velocity.z;
        velocity.y -= 0.055;

        if (data[offset + 1] < bottomY) {
          data[offset] = randomRange(-spanX, spanX);
          data[offset + 1] = randomRange(bottomY + 10, bottomY + 75);
          data[offset + 2] = randomRange(isGlobal ? -340 : -220, isGlobal ? 120 : 80);
          velocity.x = randomRange(-0.55, 0.55);
          velocity.y = randomRange(2.2, 6.2);
          velocity.z = randomRange(-0.35, 0.35);
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
      group.rotation.z = Math.sin(elapsed * 0.12) * 0.035;
    },
    dispose() {
      disposeNode(group);
      scene.remove(group);
    },
  };
}

function buildSystem(mode, THREE, scene, qualityScale, isGlobal) {
  if (mode === 'storm') return buildStorm(THREE, scene, qualityScale, isGlobal);
  if (mode === 'matrix') return buildMatrix(THREE, scene, qualityScale, isGlobal);
  if (mode === 'magma') return buildMagma(THREE, scene, qualityScale, isGlobal);
  return buildGalaxy(THREE, scene, qualityScale, isGlobal);
}

const WorkspaceFxLayer = ({ enabled, mode, scope = 'panel' }) => {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const isGlobal = scope === 'global';

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host || !enabled) return undefined;

    let cancelled = false;
    let animationId = 0;
    let renderer;
    let scene;
    let camera;
    let clock;
    let fxSystem;
    let resizeObserver;
    let hidden = document.hidden;

    const handleVisibility = () => {
      hidden = document.hidden;
    };

    loadThree().then((THREE) => {
      if (cancelled) return;

      const qualityScale = getQualityScale();
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1400);
      camera.position.set(0, 18, 160);
      clock = new THREE.Clock();

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: qualityScale > 0.6,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: import.meta.env.DEV,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, qualityScale < 0.6 ? 1.25 : 1.75));

      const ambient = new THREE.AmbientLight(0x9cc9ff, 0.22);
      scene.add(ambient);
      const keyLight = new THREE.PointLight(0xc7e7ff, 0.45, 460);
      keyLight.position.set(0, 60, 90);
      scene.add(keyLight);

      fxSystem = buildSystem(mode, THREE, scene, qualityScale, isGlobal);

      const resize = () => {
        if (!renderer || !camera) return;
        const rect = host.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();
      document.addEventListener('visibilitychange', handleVisibility);

      const animate = () => {
        if (cancelled) return;
        animationId = requestAnimationFrame(animate);
        if (hidden || !renderer || !scene || !camera || !fxSystem) return;
        const elapsed = clock.getElapsedTime();
        fxSystem.update(elapsed);
        renderer.render(scene, camera);
      };
      animate();
    }).catch((error) => {
      console.error('Failed to load workspace WebGL effects', error);
    });

    return () => {
      cancelled = true;
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      if (fxSystem) fxSystem.dispose();
      if (renderer) {
        renderer.clear(true, true, true);
        renderer.dispose();
      }
    };
  }, [enabled, mode, isGlobal]);

  return (
    <div
      ref={hostRef}
      className={isGlobal ? 'workspace-fx-layer workspace-fx-layer-global' : 'workspace-fx-layer'}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="workspace-fx-canvas" />
    </div>
  );
};

export default WorkspaceFxLayer;
