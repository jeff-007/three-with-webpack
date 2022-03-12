import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

function init () {
  const container = document.getElementById('container');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();

  // renderer.setClearColor(new THREE.Color('#ffffff', 1.0));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  // const axesHelper = new THREE.AxesHelper(2)
  // scene.add(axesHelper);

  // dracoLoader配合wasm使用
  // const dracoLoader = new DRACOLoader()
  // dracoLoader.setDecoderPath('/draco')
  //
  // const gltfLoader = new GLTFLoader()
  // gltfLoader.setDRACOLoader(dracoLoader)

  const gltfLoader = new GLTFLoader()
  // gltfLoader.load('/models/Fox/glTF/Fox.gltf', (gltf) => {
  //   // 当模型中的场景有多个子节点需要添加时（scene.children长度大于1）,添加到当前场景时，需要先拷贝一份，否则执行scene.add后，被添加的元素会从模型场景中移除，导致循环添加时会缺少部分元素未被正确添加
  //   const childrenCopy = [...gltf.scene.children];
  //   for (const child of childrenCopy) {
  //     scene.add(child)
  //   }
  // })

  let mixer = null
  gltfLoader.load('/models/Fox/glTF/Fox.gltf', (gltf) => {
    // 创建动画合成器，接收模型场景图作为参数
    console.log('gltf', gltf)
    mixer = new THREE.AnimationMixer(gltf.scene)
    // 添加动画剪辑至合成器
    const action = mixer.clipAction(gltf.animations[1])
    // 播放动画
    action.play()

    gltf.scene.scale.set(0.35, 0.35, 0.35)
    scene.add(gltf.scene)
  })

  // create and position the plane
  const planeGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  plane.rotation.x = -0.5 * Math.PI;
  scene.add(plane);

  // position and point the camera to the center of the scene
  camera.position.set(-54, 83, 85)
  camera.lookAt(new THREE.Vector3(10, 0, 0));

  // add subtle ambient lighting
  const ambiColor = '#1c1c1c';
  const ambientLight = new THREE.AmbientLight(ambiColor, 0.5);
  scene.add(ambientLight);

  const spotLight = new THREE.SpotLight('#97a0a5');
  spotLight.position.set(-40, 30, -10);
  spotLight.castShadow = true;
  spotLight.shadow.camera.near = 2;
  spotLight.shadow.camera.far = 400;
  spotLight.shadow.camera.fov = 40;
  spotLight.target = plane;
  spotLight.angle = 0.8;
  scene.add(spotLight);

  // const target = new THREE.Object3D();
  // target.position = new THREE.Vector3(5, 0, 0);

  // add the output of the renderer to the html element
  container.appendChild(renderer.domElement);

  const gui = new dat.GUI();

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

    // 更新动画合成器
    mixer && mixer.update(deltaTime)

    stats.update();
    controls.update()

    // step += guiOptions.bouncingSpeed;
    // sphere.position.x = 20 + (10 * (Math.cos(step)));
    // sphere.position.y = 2 + (10 * Math.abs(Math.sin(step)));

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
