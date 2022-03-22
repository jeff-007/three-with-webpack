import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// 后期处理相关
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js'

import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import { SepiaShader } from 'three/examples/jsm/shaders/SepiaShader.js'
import { ColorifyShader } from 'three/examples/jsm/shaders/ColorifyShader.js'
import { MaskPass, ClearMaskPass } from 'three/examples/jsm/postprocessing/MaskPass.js'
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js'


function init () {
  const container = document.getElementById('container');
  const scene = new THREE.Scene();

  const gltfLoader = new GLTFLoader()
  const cubeTextureLoader = new THREE.CubeTextureLoader()
  // positive x and negative x
  const environment = cubeTextureLoader.load([
    '/textures/parliament/posx.jpg',
    '/textures/parliament/negx.jpg',
    '/textures/parliament/posy.jpg',
    '/textures/parliament/negy.jpg',
    '/textures/parliament/posz.jpg',
    '/textures/parliament/negz.jpg',
  ])
  environment.encoding = THREE.sRGBEncoding
  scene.background = environment
  // 直接设置scene的environment属性，该属性将自动将环境贴图作用在所有场景对象中，而不需要循环
  // scene.environment = environment

  const updateAllMaterials = () => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.envMap = environment
        child.material.envMapIntensity = guiOptions.envMapIntensity
        // update model toneMapping
        child.material.needsUpdate = true
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }

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

  const effectComposer = new EffectComposer(renderer)
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  effectComposer.setSize(window.innerWidth, window.innerHeight);

  // 添加第一个后期处理通道
  const renderPass = new RenderPass(scene, camera);
  effectComposer.addPass(renderPass)

  const dotScreenPass = new DotScreenPass()
  effectComposer.addPass(dotScreenPass)
  dotScreenPass.enabled = true

  // Some passed need extra work like the RGBShift pass
  // The RGBShift is available as a shader, we need to use it with a ShaderPass
  const rgbShiftPass = new ShaderPass(RGBShiftShader)
  effectComposer.addPass(rgbShiftPass)

  // 使用 EffectComposer 之后场景背景色变暗，是因为前述设置的 renderer.outputEncoding = THREE.sRGBEncoding 不再生效
  // because the render targets of EffectComposer encoding is not set right

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  gltfLoader.load('/models/DamagedHelmet/glTF/DamagedHelmet.gltf', (gltf) => {
    gltf.scene.scale.set(2, 2, 2)
    gltf.scene.position.set(0, 0, 0)
    scene.add(gltf.scene)
    gui.add(gltf.scene.rotation, 'y').min(-Math.PI).max(Math.PI).step(0.001).name('模型旋转Y')

    updateAllMaterials()
  })

  const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
  directionalLight.position.set(0.25, 3, -2.25)
  directionalLight.castShadow = true
  directionalLight.shadow.camera.far = 12
  directionalLight.shadow.mapSize.set(1024, 1024)
  directionalLight.shadow.normalBias = 0.01
  scene.add(directionalLight)

  // const lightHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
  // scene.add(lightHelper)

  // position and point the camera to the center of the scene
  camera.position.set(0, 0, 10)
  // camera.lookAt(new THREE.Vector3(0, 0, 0));

  // add the output of the renderer to the html element
  container.appendChild(renderer.domElement);

  const gui = new dat.GUI();
  const guiOptions = {
    envMapIntensity: 1.5
  }
  gui.add(directionalLight, 'intensity').min(0).max(10).step(0.001).name('方向光强度')
  gui.add(directionalLight.position, 'x').min(-5).max(5).step(0.001).name('方向光X')
  gui.add(directionalLight.position, 'y').min(-5).max(5).step(0.001).name('方向光Y')
  gui.add(directionalLight.position, 'z').min(-5).max(5).step(0.001).name('方向光Z')
  gui.add(guiOptions, 'envMapIntensity').min(0).max(10).step(0.001).name('模型环境贴图').onChange(updateAllMaterials)
  gui.add(renderer, 'toneMapping', {
    NoToneMapping: THREE.NoToneMapping,
    LinearToneMapping: THREE.LinearToneMapping,
    ReinhardToneMapping: THREE.ReinhardToneMapping,
    CineonToneMapping: THREE.CineonToneMapping,
    ACESFilmicToneMapping: THREE.ACESFilmicToneMapping
  }).onFinishChange((val) => {
    renderer.toneMapping = val
    updateAllMaterials()
  })
  gui.add(renderer, 'toneMappingExposure').min(1).max(10).step(0.001)

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
    stats.update();
    controls.update()

    requestAnimationFrame(render);
    // renderer.render(scene, camera);
    effectComposer.render()
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
