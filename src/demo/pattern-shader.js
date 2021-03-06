import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import vertex from '../../src/shaders/pattern/vertex.glsl'
import fragment from '../../src/shaders/pattern/fragment.glsl'

function init () {
  const container = document.getElementById('container');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  // renderer.setClearColor(new THREE.Color('#ffffff', 1.0));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // make realistic render
  renderer.physicallyCorrectLights = true
  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.toneMapping = THREE.ReinhardToneMapping

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  camera.position.set(1.5, 1.8, 1.4)
  // camera.lookAt(new THREE.Vector3(0, 0, 0));
  const guiOptions = {
    depthColor: '#186691',
    surfaceColor: '#9bd8ff',
  }
  const gui = new dat.GUI();

  const textureLoader = new THREE.TextureLoader()

  const geometry = new THREE.PlaneBufferGeometry(3, 3, 50, 50)

  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    uniforms: {
      uBigWavesElevation: { value: 0.18 },
      uBigWaveFrequency: { value: new THREE.Vector2(4, 1.5) },
      uTime: { value: 0 },
      uWaveSpeed: { value: 0.75 },
      uDepthColor: { value: new THREE.Color(guiOptions.depthColor) },
      uSurfaceColor: { value: new THREE.Color(guiOptions.surfaceColor) },
      uColorOffset: { value: 0.08 },
      uColorMultiplier: { value: 5 }
    }
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI * 0.5
  scene.add(mesh)

  // use a 3D perlin noise to make the waves change in time

  gui.add(material.uniforms.uBigWavesElevation, 'value').min(0).max(1).step(0.001).name('????????????');
  gui.add(material.uniforms.uBigWaveFrequency.value, 'x').min(0).max(50).step(0.01).name('x??????????????????');
  gui.add(material.uniforms.uBigWaveFrequency.value, 'y').min(0).max(50).step(0.01).name('z??????????????????');
  gui.add(material.uniforms.uWaveSpeed, 'value').min(0).max(10).step(0.001).name('????????????');

  gui.add(material.uniforms.uColorOffset, 'value').min(0).max(1).step(0.001).name('uColorOffset');
  gui.add(material.uniforms.uColorMultiplier, 'value').min(0).max(10).step(0.001).name('uColorMultiplier');


  gui.addColor(guiOptions, 'depthColor').name('??????????????????').onChange((e) => {
    material.uniforms.uDepthColor.value.set(e);
  })
  gui.addColor(guiOptions, 'surfaceColor').onChange((e) => {
    material.uniforms.uSurfaceColor.value.set(e);
  })


  // add the output of the renderer to the html element
  container.appendChild(renderer.domElement);

  function initStats() {
    const stats = new Stats();

    stats.setMode(0); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    document.getElementById('stats-output').appendChild(stats.domElement);

    return stats;
  }
  const stats = initStats();

  const clock = new THREE.Clock()

  render();

  function render() {
    const elapsedTime = clock.getElapsedTime()

    material.uniforms.uTime.value = elapsedTime;

    stats.update();
    controls.update()

    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }
  // resize the viewport
  function onResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize, false);
}

window.onload = init;
