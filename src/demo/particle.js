import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

function init () {
  const container = document.getElementById('container');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5.5, 3.8, 7.2)
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer();
  // renderer.setClearColor('#262837')
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // renderer.shadowMap.enabled = true
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  const textureLoader = new THREE.TextureLoader()

  const particleTexture = textureLoader.load('textures/particles/snowflake2.png')

  const particleGeometry = new THREE.BufferGeometry()
  const count = 50000

  const position = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    position[i] = (Math.random() - 0.5) * 15
  }
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(position, 3))

  // const particleGeometry = new THREE.SphereBufferGeometry(4, 32, 32)
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.08,
    sizeAttenuation: true,
    color: '#0099ff',
    transparent: true,
    alphaMap: particleTexture
  })
  const particles = new THREE.Points(particleGeometry, particleMaterial)
  scene.add(particles)

  // 环境光
  // const ambiColor = '#b9d5ff';
  // const ambientLight = new THREE.AmbientLight(ambiColor);
  // ambientLight.intensity = 0.12
  // scene.add(ambientLight);

  container.appendChild(renderer.domElement);

  function initStats() {
    const stats = new Stats();

    stats.setMode(0); // 0: fps, 1: ms
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

    stats.update();
    // 使用控件的enableDamping属性时，需要在每一帧中调用控件的update方法
    controls.update()
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  // 全屏操作
  window.addEventListener('dblclick', () => {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement
    if (!fullscreenElement) {
      container.requestFullscreen() || container.webkitFullscreenElement()
    } else {
      document.exitFullscreen() || document.webkitExitFullscreen()
    }
  })

  // 视口自适应调整
  function onResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize, false);
}

window.onload = init;
