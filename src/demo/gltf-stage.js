import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertex from '../../src/shaders/fireflies/vertex.glsl'
import firefliesFragment from '../../src/shaders/fireflies/fragment.glsl'

import portalVertex from '../../src/shaders/portal/vertex.glsl'
import portalFragment from '../../src/shaders/portal/fragment.glsl'

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

  const gui = new dat.GUI();
  const guiOptions = {
    clearColor: '#201919',
    portalColorStart: '#000000',
    portalColorEnd: '#d1b9b3',
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
  const portalLightMaterial = new THREE.ShaderMaterial({
    vertexShader: portalVertex,
    fragmentShader: portalFragment,
    uniforms: {
      uTime: { value: 0 },
      uColorStart: { value: new THREE.Color(guiOptions.portalColorStart) },
      uColorEnd: { value: new THREE.Color(guiOptions.portalColorEnd) }
    }
  });

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

    gltf.scene.position.set(0, -0.3, 0)
    scene.add(gltf.scene)
  })

  // 添加萤火效果
  const firefliesGeometry = new THREE.BufferGeometry();
  const firefliesCount = 30;
  const positionArray = new Float32Array(firefliesCount * 3);
  const scaleArray = new Float32Array(firefliesCount);

  for (let i = 0; i < firefliesCount; i++) {
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4;
    positionArray[i * 3 + 1] = Math.random() * 1.5;
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;

    scaleArray[i] = Math.random()
  }

  firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
  firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

  // const firefliesMaterial = new THREE.PointsMaterial({
  //   size: 0.1,
  //   sizeAttenuation: true
  // })

  const firefliesMaterial = new THREE.ShaderMaterial({
    vertexShader: firefliesVertex,
    fragmentShader: firefliesFragment,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uPixelRadio: { value: Math.min(window.devicePixelRatio, 2) },
      uSize: { value: 200 },
      uTime: { value: 0 }
    }
  })

  const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
  scene.add(fireflies)


  // camera.position.set(2.9, 2.7, 4.6)
  camera.position.set(0, 2.5, 4.4)
  camera.lookAt(new THREE.Vector3(10, 0, 0));

  container.appendChild(renderer.domElement);

  gui.addColor(guiOptions, 'clearColor').onChange((val) => {
    renderer.setClearColor(val)
  })
  gui.addColor(guiOptions, 'portalColorStart').onChange((val) => {
    portalLightMaterial.uniforms.uColorStart.value.set(val)
  })
  gui.addColor(guiOptions, 'portalColorEnd').onChange((val) => {
    portalLightMaterial.uniforms.uColorEnd.value.set(val)
  })
  gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(400).step(1).name('fireflySize')

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

    // 更新顶点着色器中的时间生成浮动动画效果
    firefliesMaterial.uniforms.uTime.value = elapsedTime

    portalLightMaterial.uniforms.uTime.value = elapsedTime

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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    firefliesMaterial.uniforms.uPixelRadio.value = Math.min(window.devicePixelRatio, 2)
  }
  window.addEventListener('resize', onResize, false);
}

window.onload = init;
