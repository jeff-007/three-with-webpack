import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import simpleVertex from '../../src/shaders/simple-shader/vertex.glsl'
import simpleFragment from '../../src/shaders/simple-shader/fragment.glsl'

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

  camera.position.set(0, 0, 2.2)
  // camera.lookAt(new THREE.Vector3(0, 0, 0));

  const textureLoader = new THREE.TextureLoader()
  const fragTexture = textureLoader.load('/textures/matcaps/1.png')

  const geometry = new THREE.PlaneBufferGeometry(1, 1, 32, 32)
  const count = geometry.attributes.position.count
  const randoms = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    randoms[i] = Math.random()
  }

  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))

  // const material = new THREE.MeshBasicMaterial({
  //   side: THREE.DoubleSide
  // })
  const material = new THREE.RawShaderMaterial({
    vertexShader: simpleVertex,
    fragmentShader: simpleFragment,
    side: THREE.DoubleSide,
    // wireframe: true,
    uniforms: {
      uFrequency: { value: new THREE.Vector2(0.8, 5) },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#0099ff') },
      uTexture: { value: fragTexture }
    }
  })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  // add the output of the renderer to the html element
  container.appendChild(renderer.domElement);

  const gui = new dat.GUI();
  const guiOptions = {}
  // ??????gui?????????uniform??????????????? uFrequency ??????????????????????????????vec2??????
  gui.add(material.uniforms.uFrequency.value, 'x').min(0.1).max(2).step(0.01).name('????????? uFrequency')

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
    material.uniforms.uTime.value = elapsedTime

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
