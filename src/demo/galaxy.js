import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

function init () {
  const container = document.getElementById('container');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5.5, 4, 4)
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

  const galaxyParameters = {
    options: {
      size: 0.02,
      sizeAttenuation: true,
      // transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
      // vertexColors: true
    },
    count: 100000,
    radius: 8, // 星云半径
    branches: 5, // 星云分支数
    spin: 1,
    randomness: 0.2,
    randomnessPower: 3, // 通过幂运算，每条分支上半径越大的地方粒子偏移越小, 使得粒子能够集中在中心位置
    insideColor: '#ff6030',
    outsideColor: '#1b3984'
  }

  let particleGeometry = null;
  let material = null;
  let points = null

  const generateGalaxy = () => {
    // 删除已添加的粒子，dispose清除已存在几何体、材质，remove清除网格
    if (points) {
      particleGeometry.dispose();
      material.dispose();
      scene.remove(points)
    }

    particleGeometry = new THREE.BufferGeometry()

    const positions = new Float32Array(galaxyParameters.count * 3)
    const colors = new Float32Array(galaxyParameters.count * 3)

    const colorInside = new THREE.Color(galaxyParameters.insideColor)
    const colorOutside = new THREE.Color(galaxyParameters.outsideColor)

    const angleUnit = Math.PI * 2 / (galaxyParameters.branches) // 星云分支的单位展开角度

    for (let i = 0; i < galaxyParameters.count; i++) {
      const i3 = i * 3;

      // 设置粒子位置
      const radius = Math.random() * galaxyParameters.radius
      const spinAngle = radius * galaxyParameters.spin // 每条分支上粒子的曲率半径，即同一条分支上半径越大的粒子旋转角度越大，最终形成分支向内弯曲的形状

      const branchDivide = i % galaxyParameters.branches // 根据初始化分支数，通过取余划分粒子所在分支
      const branchAngle = branchDivide * angleUnit // 当前粒子所在分支的展开角度

      const randomX = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
      const randomY = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
      const randomZ = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) // 粒子每个坐标分量的随机偏移量

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[i3 + 1] = 0 + randomY
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

      // 使用 Color 类中的lerp方法将内部颜色于外部颜色合并，并根据粒子所在半径大小设置融合程度（0-1）
      const mixedColor = colorInside.clone()
      mixedColor.lerp(colorOutside, radius / galaxyParameters.radius)

      // 设置粒子颜色
      colors[i3] = mixedColor.r // r
      colors[i3 + 1] = mixedColor.g // g
      colors[i3 + 2] = mixedColor.b // b
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    material = new THREE.PointsMaterial(galaxyParameters.options)
    points = new THREE.Points(particleGeometry, material)
    scene.add(points)
  }

  generateGalaxy()

  const gui = new dat.GUI({ closed: true })
  gui.add(galaxyParameters, 'count').min(100).max(500000).step(100).onFinishChange(generateGalaxy)
  gui.add(galaxyParameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
  gui.add(galaxyParameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
  gui.add(galaxyParameters, 'spin').min(-5).max(5).step(0.01).onFinishChange(generateGalaxy)
  gui.add(galaxyParameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
  gui.add(galaxyParameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
  gui.addColor(galaxyParameters, 'insideColor').onFinishChange(generateGalaxy)
  gui.addColor(galaxyParameters, 'outsideColor').onFinishChange(generateGalaxy)
  gui.add(galaxyParameters.options, 'size').min(0.001).max(0.08).step(0.001).onFinishChange(generateGalaxy)

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

    points.rotation.y = elapsedTime * 0.06

    stats.update();
    // 使用控件的enableDamping属性时，需要在每一帧中调用控件的update方法
    controls.update()
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  // 视口自适应调整
  function onResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize, false);
}

window.onload = init;
