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

import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

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

  console.log(mergeBufferGeometries)

  const textureLoader = new THREE.TextureLoader()
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

  console.log('renderer info', renderer.info)

  // renderer.setClearColor(new THREE.Color('#ffffff', 1.0));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // make realistic render
  renderer.physicallyCorrectLights = true
  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.toneMapping = THREE.ReinhardToneMapping
  renderer.toneMappingExposure = 1.5
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 使用 mergeBufferGeometries 合并渲染几何体
  // const geometries = []
  // for (let i = 0; i < 50; i++) {
  //   const geometry = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5)
  //   geometry.translate(
  //     (Math.random() - 0.5) * 10,
  //     (Math.random() - 0.5) * 10,
  //     (Math.random() - 0.5) * 10
  //   )
  //   geometries.push(geometry)
  // }
  //
  // const mergeGeometry = mergeBufferGeometries(geometries)
  // const newMaterial = new THREE.MeshNormalMaterial()
  // const newMesh = new THREE.Mesh(mergeGeometry, newMaterial)
  // scene.add(newMesh)

  // 使用 InstancedMesh 创建网格
  const geometry = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5)
  const newMaterial = new THREE.MeshNormalMaterial()
  // 创建50个实例
  const newMesh = new THREE.InstancedMesh(geometry, newMaterial, 50)
  // 如果需要在每一帧中动态修改InstancedMesh中的矩阵
  newMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  console.log(newMesh)
  scene.add(newMesh)

  for (let i = 0; i < 50; i++) {
    // 通过欧拉角生成旋转四元数
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(
      (Math.random() - 0.5) * Math.PI * 2,
      (Math.random() - 0.5) * Math.PI * 2,
      0
    ))

    // 设置位置信息
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    )

    const matrix = new THREE.Matrix4()
    // 矩阵应用四元数进行旋转
    matrix.makeRotationFromQuaternion(quaternion)

    // 矩阵应用位置向量
    matrix.setPosition(position)
    newMesh.setMatrixAt(i, matrix)
  }

  // 使用 EffectComposer 之后场景背景色变暗，是因为前述设置的 renderer.outputEncoding = THREE.sRGBEncoding 不再生效
  // because the render targets of EffectComposer encoding is not set right
  // 渲染目标的设置可参考 node_modules/three/examples/jsm/postprocessing/EffectComposer.js 中的 WebGLRenderTarget
  // 若需要在添加后期处理通道后依然支持渲染器中的 antialias 效果，可使用 WebGLMultipleRenderTargets 替代 WebGLRenderTarget

  // 如果像素率等于1，并且浏览器支持 WebGL2，使用 WebGLMultipleRenderTargets，其余使用 WebGLRenderTarget
  let RenderTargetClass = null
  if (renderer.getPixelRatio() === 1 && renderer.capabilities.isWebGL2) {
    RenderTargetClass = THREE.WebGLMultipleRenderTargets
  } else {
    RenderTargetClass = THREE.WebGLRenderTarget
  }

  const renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      encoding: THREE.sRGBEncoding
    }
  )
  console.log(renderer.capabilities)

  // 第二个参数传入自定义的渲染目标（render target）
  const effectComposer = new EffectComposer(renderer, renderTarget)
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  effectComposer.setSize(window.innerWidth, window.innerHeight);

  // 添加第一个后期处理通道
  const renderPass = new RenderPass(scene, camera);
  effectComposer.addPass(renderPass)

  const dotScreenPass = new DotScreenPass()
  dotScreenPass.enabled = false
  effectComposer.addPass(dotScreenPass)

  // Some passed need extra work like the RGBShift pass
  // The RGBShift is available as a shader, we need to use it with a ShaderPass
  const rgbShiftPass = new ShaderPass(RGBShiftShader)
  rgbShiftPass.enabled = false
  effectComposer.addPass(rgbShiftPass)

  // 创建自定义后期处理通道
  // 新建成功后，还需加载前一个通道的处理结果（texture）
  // 在uniforms中添加tDiffuse属性，EffectComposer会自动将其更新为前一个通道的处理结果;
  // 然后通过texture2D方法，获取 tDiffuse 纹理上的像素颜色
  const TintShader = {
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uNormalMap: { value: null }
    },
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        vUv = uv;
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform sampler2D uNormalMap;
      uniform float uTime;
      
      varying vec2 vUv;
      
      void main() {
      
        // 正弦函数后期通道动效
        // vec2 newUv = vec2(
        //   vUv.x,
        //   vUv.y + sin(vUv.x * 10.0 + uTime) * 0.1
        // );
        // vec4 color = texture2D(tDiffuse, newUv);
        //
        // gl_FragColor = color;
        
        // 将法线纹理贴图的rgb值设置为-1到1范围；
        vec3 normalColor = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
        
        vec2 newUv = vUv + normalColor.xy * 0.02;
        vec4 color = texture2D(tDiffuse, newUv);
        
        gl_FragColor = color;
      }
    `
  }
  const tintPass = new ShaderPass(TintShader);
  tintPass.material.uniforms.uNormalMap.value = textureLoader.load('/textures/bricks/plaster-normal.jpg')

  // effectComposer.addPass(tintPass)



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
    requestAnimationFrame(render);
    stats.update();
    controls.update()
    // renderer.render(scene, camera);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime()

    tintPass.material.uniforms.uTime.value = elapsedTime

    effectComposer.render(elapsedTime);
  }
  // resize the viewport
  function onResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // update effect composer
    effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    effectComposer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize, false);
}

window.onload = init;
