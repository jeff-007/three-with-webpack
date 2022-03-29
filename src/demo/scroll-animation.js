import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const cursor = {
  x: 0,
  y: 0
}
window.addEventListener('mousemove', (event) => {
  cursor.x = event.clientX / window.innerWidth - 0.5
  cursor.y = -(event.clientY / window.innerHeight - 0.5)
})

// Use Three.js as a background of a classic HTML page;
// Make the camera translate to follow the scroll;
// Add a parallax animation based on the cursor position;
// Trigger some animation when arriving at the corresponding sections
function init () {
  const bodyDom = document.querySelector('body')
  bodyDom.style.overflow = 'auto'
  bodyDom.style.background = '#1e1a20'

  const domBox = document.createElement('div')
  domBox.classList.add('scroll-box')
  for (let i = 0; i < 4; i++) {
    const dom = document.createElement('p')
    dom.classList.add('scroll-text')
    dom.innerText = `SECTION-${i + 1}`
    domBox.appendChild(dom)
  }
  bodyDom.appendChild(domBox)

  let scrollY = window.scrollY
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY
  })

  const container = document.getElementById('container');
  const scene = new THREE.Scene();

  const cameraGroup = new THREE.Group()
  scene.add(cameraGroup)


  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 5)
  cameraGroup.add(camera)
  // camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer({
    alpha: true
  });
  // renderer.setClearColor('#262837')
  // renderer.setClearAlpha(0.5)
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // renderer.shadowMap.enabled = true
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // const controls = new OrbitControls(camera, renderer.domElement)
  // controls.enableDamping = true

  const objectDistance = 6
  const material = new THREE.MeshToonMaterial({ color: '#ffeded' })
  const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.4, 16, 60),
    material
  )
  const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(1.4, 2, 32),
    material
  )
  const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.3, 0.35, 100, 16),
    material
  )

  mesh1.position.y = 0;
  mesh2.position.y = -objectDistance
  mesh3.position.y = -objectDistance * 2

  mesh1.position.x = -2
  mesh2.position.x = 2
  mesh3.position.x = -2
  const sectionMeshes = [mesh1, mesh2, mesh3]
  scene.add(mesh1, mesh2, mesh3)

  const directionalLight = new THREE.DirectionalLight('#ffffff', 0.7)
  directionalLight.position.set(1, 1, 0)
  scene.add(directionalLight)

  const textureLoader = new THREE.TextureLoader()
  const rayCaster = new THREE.Raycaster()

  container.appendChild(renderer.domElement);

  function initStats() {
    const stats = new Stats();

    stats.setMode(0); // 0: fps, 1: ms
    stats.domElement.style.position = 'fixed';
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

    // 网格添加动画
    for (const mesh of sectionMeshes) {
      mesh.rotation.set(elapsedTime * 0.25, elapsedTime * 0.05, 0)
    }

    camera.position.y = -window.scrollY / window.innerHeight * objectDistance

    // 根据鼠标位置，水平、垂直移动相机，实现视差效果
    const parallaxX = cursor.x;
    const parallaxY = -cursor.y;

    // 使用group分组，解决鼠标视差效果和鼠标滚动切换效果得冲突
    // group分组上实现视差效果，group内部实现滚动切换
    // 添加视差缓动过渡效果，即每一帧只移动当前坐标到目标点间距离得10%
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 0.1
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 0.1

    stats.update();
    // 使用控件的enableDamping属性时，需要在每一帧中调用控件的update方法
    // controls.update()
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
