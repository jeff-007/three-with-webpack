import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

const cursor = {
  x: 0,
  y: 0
}
window.addEventListener('mousemove', (event) => {
  cursor.x = event.clientX / window.innerWidth - 0.5
  cursor.y = -(event.clientY / window.innerHeight - 0.5)
})

function init () {
  const container = document.getElementById('container');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer();

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  camera.position.set(0, 8, 12)
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // const textureLoader = new THREE.TextureLoader()

  const house = new THREE.Group()
  scene.add(house)

  // const walls = new THREE.Mesh(
  //   new THREE.BoxGeometry(1, 1, 1),
  //   new THREE.MeshStandardMaterial({ color: '#ac8e82' })
  // )
  // house.add(walls)

  const planeGeometry = new THREE.PlaneGeometry(20, 20);
  const planeMaterial = new THREE.MeshStandardMaterial({ color: '#a9c388' });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.y = 0;

  scene.add(plane);

  const pointColor = '#ffffff';
  const spotLight = new THREE.SpotLight(pointColor);
  spotLight.position.set(-40, 60, -10);
  spotLight.castShadow = true;
  // spotLight.shadow.camera.near = 2;
  // spotLight.shadow.camera.far = 200;
  // spotLight.shadow.camera.fov = 30;
  spotLight.target = plane;
  spotLight.distance = 0;
  spotLight.angle = 0.4;
  spotLight.intensity = 1
  scene.add(spotLight);

  // const hemisphereLight = new THREE.HemisphereLight(0x00ffff, 0x00ff00, 0.6)
  // hemisphereLight.position.set(0, 500, 0)
  // scene.add(hemisphereLight)

  // const guiOptions = {
  //   styleOption: {
  //     size: 0.8, // 字体大小
  //     height: 0.2, // 拉伸长度
  //     curveSegments: 30, // 图形拉伸时分段数
  //     bevelEnabled: true, // 设置斜角
  //     bevelThickness: 0.03, // 斜角深度
  //     bevelSize: 0.02, // 斜角高度
  //     bevelOffset: 0,
  //     bevelSegments: 4 // 斜角分段数
  //   },
  //   // 创建文字网格
  //   createText: (option) => {
  //     const textGeometry = new TextGeometry('Just do it!', {
  //       font: loadedFont,
  //       ...option
  //     })
  //     // 居中显示文字，先计算几何体边界（两种边界类型 box sphere）
  //     // computeBoundingBox、translate方法只应用在几何体对象上
  //     // 设置斜角的原因，文字几何体在x、y轴上的位移距离要先减去斜角高度，z轴上位移距离需要减去斜角深度
  //     textGeometry.computeBoundingBox()
  //     const { styleOption: { bevelSize, bevelThickness } } = guiOptions
  //     textGeometry.translate(
  //       -textGeometry.boundingBox.max.x * 0.5,
  //       -(textGeometry.boundingBox.max.y - bevelSize) * 0.5,
  //       -(textGeometry.boundingBox.max.z - bevelThickness) * 0.5
  //     )
  //     // 几何体的center方法基于bounding box实现
  //     // 上述居中写法等价于textGeometry.center()
  //     // textGeometry.center()
  //     // console.log(textGeometry.boundingBox)
  //     const textMaterial = new THREE.MeshMatcapMaterial({ matcap: matCapTexture })
  //     return new THREE.Mesh(textGeometry, textMaterial)
  //   },
  //   // 更新文字网格属性
  //   updateText: () => {
  //     scene.remove(text)
  //     const options = { ...guiOptions.styleOption }
  //     text = guiOptions.createText(options)
  //     scene.add(text)
  //   }
  // }
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
