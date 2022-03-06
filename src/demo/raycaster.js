import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// 获取正交化的鼠标坐标
const cursor = new THREE.Vector2();
window.addEventListener('mousemove', (event) => {
  cursor.x = event.clientX / window.innerWidth * 2 - 1
  cursor.y = -(event.clientY / window.innerHeight) * 2 + 1
})

// 监听网格点击
let currentIntersect = null
window.addEventListener('click', (event) => {
  if (currentIntersect) {
    console.log(currentIntersect.object)
  }
})


function init () {
  const container = document.getElementById('container');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 7)
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
  const rayCaster = new THREE.Raycaster()

  const generator = (options) => {
    const { size, material } = options
    const sphereGeometry = new THREE.SphereBufferGeometry(size.radius, size.width, size.height)
    const sphereMaterial = new THREE.MeshBasicMaterial(material)
    return new THREE.Mesh(sphereGeometry, sphereMaterial)
  }
  const object1 = generator({
    size: {
      radius: 0.5,
      widthSeg: 16,
      heightSeg: 16
    },
    material: {
      color: '#ff0088'
    }
  })
  const object2 = generator({
    size: {
      radius: 0.5,
      widthSeg: 16,
      heightSeg: 16
    },
    material: {
      color: '#ff0088'
    }
  })
  const object3 = generator({
    size: {
      radius: 0.5,
      widthSeg: 16,
      heightSeg: 16
    },
    material: {
      color: '#ff0088'
    }
  })
  object1.position.x = -2
  object3.position.x = 2
  scene.add(object1, object2, object3)

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

    object1.position.y = Math.sin(elapsedTime * 0.5)
    object2.position.y = Math.sin(elapsedTime * 0.5)
    object3.position.y = Math.sin(elapsedTime * 0.5)

    rayCaster.setFromCamera(cursor, camera)

    for (const object of scene.children) {
      object.material.color.set('#ff0088')
    }

    const intersects = rayCaster.intersectObjects(scene.children);
    for (let i = 0; i < intersects.length; i++) {
      intersects[i].object.material.color.set('#0000ff');
    }

    // 鼠标悬停开始、结束判断
    if (intersects.length) {
      if (!currentIntersect) {
        console.log('mouse enter')
      }
      currentIntersect = intersects[0]
    } else {
      if (currentIntersect) {
        console.log('mouse leave')
      }
      currentIntersect = null
    }

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
