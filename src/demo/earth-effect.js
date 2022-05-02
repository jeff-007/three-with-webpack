import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

import firefliesVertex from '../../src/shaders/fireflies/vertex.glsl'
import firefliesFragment from '../../src/shaders/fireflies/fragment.glsl'

import portalVertex from '../../src/shaders/portal/vertex.glsl'
import portalFragment from '../../src/shaders/portal/fragment.glsl'

const radius = 5;
const cameraPositions = [
  { x: 5, y: -20, z: 200 },
  { x: 0.5, y: -2, z: 20 }
]; // 相机位置坐标
const group = new THREE.Group();
const groupDots = new THREE.Group();
const groupLines = new THREE.Group();
const groupHalo = new THREE.Group(); // 卫星环+小卫星
const aGroup = new THREE.Group();
const initFlag = false;
const WaveMeshArr = []; // 所有波动光圈集合
const planGeometry = new THREE.PlaneBufferGeometry(1, 1); // 默认在XOY平面上
const globalTextureLoader = new THREE.TextureLoader();
const map = new THREE.Object3D();
let globalScene, globalCamera

function init () {
  const container = document.getElementById('container');
  globalScene = new THREE.Scene();
  globalCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();

  // renderer.setClearColor(new THREE.Color('#ffffff', 1.0));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = THREE.PCFShadowMap;

  globalCamera.position.set(0.5, -2, 20);
  globalCamera.lookAt(0, 3, 0);

  globalScene.background = new THREE.Color(0x020924);
  globalScene.fog = new THREE.Fog(0x020924, 200, 1000);

  // 网格
  const grid = new THREE.GridHelper(2, 10, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  globalScene.add(grid);


  const controls = new OrbitControls(globalCamera, renderer.domElement)
  controls.enableDamping = true;
  controls.enableZoom = true;
  // 是否自动旋转
  controls.autoRotate = false;
  controls.autoRotateSpeed = 2;
  controls.enablePan = true;

  const gui = new dat.GUI();
  const guiOptions = {
    clearColor: '#201919',
    portalColorStart: '#000000',
    portalColorEnd: '#d1b9b3'
  }
  // renderer.setClearColor(guiOptions.clearColor)

  // const axesHelper = new THREE.AxesHelper(2)
  // scene.add(axesHelper);

  // dracoLoader配合wasm使用
  // const dracoLoader = new DRACOLoader()
  // dracoLoader.setDecoderPath('/draco')
  //
  // const gltfLoader = new GLTFLoader()
  // gltfLoader.setDRACOLoader(dracoLoader)

  // 性能优化
  // 使用spector.js查看性能，可安装浏览器插件或者通过github安装到项目中
  // 将所有baked对象合并到一个几何体中，仅需调用一次渲染函数完成场景渲染，提高性能
  // 可以先在blender中，将相机光源以及发光材质除外的物体全部复制到一个集合（collection）中，并合并

  // 修正色值
  // 在blender中保存纹理图片时，设置的保存格式为RGB，需要设置贴图以及renderer对应的编码格式
  // bakedTexture.encoding = THREE.sRGBEncoding
  // renderer.outputEncoding = THREE.sRGBEncoding

  const gltfLoader = new GLTFLoader()
  // gltfLoader.load('/models/Fox/glTF/Fox.gltf', (gltf) => {
  //   // 当模型中的场景有多个子节点需要添加时（scene.children长度大于1）,添加到当前场景时，需要先拷贝一份，否则执行scene.add后，被添加的元素会从模型场景中移除，导致循环添加时会缺少部分元素未被正确添加
  //   const childrenCopy = [...gltf.scene.children];
  //   for (const child of childrenCopy) {
  //     scene.add(child)
  //   }
  // })

  container.appendChild(renderer.domElement);

  gui.addColor(guiOptions, 'clearColor').onChange((val) => {
    renderer.setClearColor(val)
  })

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
  let oldElapsedTime = 0

  render();

  function render() {
    // 计算本次渲染距上一次渲染所用的时间
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    stats.update();
    controls.update()

    // step += guiOptions.bouncingSpeed;
    // sphere.position.x = 20 + (10 * (Math.cos(step)));
    // sphere.position.y = 2 + (10 * Math.abs(Math.sin(step)));

    requestAnimationFrame(render);
    renderer.render(globalScene, globalCamera);
  }
  // resize the viewport
  function onResize () {
    globalCamera.aspect = window.innerWidth / window.innerHeight;
    globalCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // firefliesMaterial.uniforms.uPixelRadio.value = Math.min(window.devicePixelRatio, 2)
  }
  window.addEventListener('resize', onResize, false);
}

// 初始化灯光
function initLight() {
  const ambientLight = new THREE.AmbientLight(0xcccccc, 1.1);
  globalScene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
  directionalLight.position.set(1, 0.1, 0).normalize();
  const directionalLight2 = new THREE.DirectionalLight(0xff2ffff, 0.2);
  directionalLight2.position.set(1, 0.1, 0.1).normalize();
  globalScene.add(directionalLight);
  globalScene.add(directionalLight2);
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
  hemiLight.position.set(0, 1, 0);
  globalScene.add(hemiLight);
  const directionalLight3 = new THREE.DirectionalLight(0xffffff);
  directionalLight3.position.set(1, 500, -20);
  directionalLight3.castShadow = true;
  directionalLight3.shadow.camera.top = 18;
  directionalLight3.shadow.camera.bottom = -10;
  directionalLight3.shadow.camera.left = -52;
  directionalLight3.shadow.camera.right = 12;
  globalScene.add(directionalLight3);
}

function initEarth() {
  // 地球
  globalTextureLoader.load('/textures/examples/earth_2.jpg', (texture) => {
    const globeGeometry = new THREE.SphereGeometry(radius, 100, 100);
    const globeMaterial = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    group.rotation.set(0.5, 2.9, 0.1);
    group.add(globeMesh);
    globalScene.add(group);
  });
}

window.onload = () => {
  init()
  initLight()
  initEarth()
};
