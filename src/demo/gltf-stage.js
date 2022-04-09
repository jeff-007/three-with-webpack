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

  // 性能优化
  // 使用spector.js查看性能，可安装浏览器插件或者通过github安装到项目中
  // 将所有baked对象合并到一个几何体中，仅需调用一次渲染函数完成场景渲染，提高性能
  // 可以先在blender中，将相机光源以及发光材质除外的物体全部复制到一个集合（collection）中，并合并

  // 加载baked纹理贴图
  const textureLoader = new THREE.TextureLoader()
  const bakedTexture = textureLoader.load('/textures/baked/stage.jpg')
  // baked纹理未正确显示，大概率是被翻转了，设置flip进行修正
  bakedTexture.flipY = false

  // 修正色值
  // 在blender中保存纹理图片时，设置的保存格式为RGB，需要设置贴图以及renderer对应的编码格式
  bakedTexture.encoding = THREE.sRGBEncoding
  renderer.outputEncoding = THREE.sRGBEncoding

  const gltfLoader = new GLTFLoader()
  // gltfLoader.load('/models/Fox/glTF/Fox.gltf', (gltf) => {
  //   // 当模型中的场景有多个子节点需要添加时（scene.children长度大于1）,添加到当前场景时，需要先拷贝一份，否则执行scene.add后，被添加的元素会从模型场景中移除，导致循环添加时会缺少部分元素未被正确添加
  //   const childrenCopy = [...gltf.scene.children];
  //   for (const child of childrenCopy) {
  //     scene.add(child)
  //   }
  // })

  // 通用baked材质
  const bakedMaterial = new THREE.MeshBasicMaterial({
    map: bakedTexture
  })

  // 照明背景材质
  const portalLightMaterial = new THREE.MeshBasicMaterial({ color: '0xffffe5' });


  // 照明灯材质
  const poleLightMaterial = new THREE.MeshBasicMaterial({ color: '0xffffe5' })

  gltfLoader.load('/models/stage/glTF-Binary/stage.glb', (gltf) => {
    console.log(gltf)
    // 为模型中的每个对象添加材质,并应用baked纹理贴图
    // gltf.scene.traverse((child) => {
    //   child.material = bakedMaterial
    // })

    // 合并优化后的场景不再需要遍历
    const bakedMesh = gltf.scene.children.find(child => child.name === 'Cube011')

    // 单独设置照明对象材质，添加发光效果
    // 照明背景通过着色器添加效果
    const portalLightMesh = gltf.scene.children.find(child => child.name === 'poleBackgroud')
    const poleLightAMesh = gltf.scene.children.find(child => child.name === 'poleLightA')
    const poleLightBMesh = gltf.scene.children.find(child => child.name === 'poleLightB')

    bakedMesh.material = bakedMaterial
    portalLightMesh.material = portalLightMaterial
    poleLightAMesh.material = poleLightBMesh.material = poleLightMaterial

    gltf.scene.position.set(0, -0.2, 0)
    scene.add(gltf.scene)
  })

  // camera.position.set(2.9, 2.7, 4.6)
  camera.position.set(0, 2.0, 5.6)
  camera.lookAt(new THREE.Vector3(10, 0, 0));

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
