import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import gsap from 'gsap'

// const cursor = {
//   x: 0,
//   y: 0
// }
// window.addEventListener('mousemove', (event) => {
//   cursor.x = event.clientX / window.innerWidth - 0.5
//   cursor.y = -(event.clientY / window.innerHeight - 0.5)
// })

function init () {
  const container = document.getElementById('container');
  // create a scene to hold all elements,such as objects,cameras and lights
  const scene = new THREE.Scene();
  // create a camera,which defines where to look at
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  // create a render and set the size
  const renderer = new THREE.WebGLRenderer();

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  // renderer.setClearColor(new THREE.Color('#ffffff'));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 添加调试面板
  const gui = new dat.GUI({ closed: true })
  const guiOptions = {
    moveOnY: 0,
    visible: true,
    wireframe: false,
    color: 0xff0000,
    spin: () => {
      gsap.to(cube.rotation, { duration: 1, y: cube.rotation.y + 2 })
    }
  }

  // create a cube
  const cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1, 2, 2, 2);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: guiOptions.color });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  scene.add(cube);

  // position the cube
  // cube.position.set(0, 0, 0)

  // position and point the camera to the center of the scene
  camera.position.z = 2
  camera.lookAt(cube.position)

  // add the output of the renderer to the html element
  container.appendChild(renderer.domElement);

  gui.addColor(guiOptions, 'color').onChange(val => {
    cube.material.color = new THREE.Color(val)
    // cube.material.color.set(val)
  })

  // 可以设置调整范围以及调整步长
  gui.add(guiOptions, 'moveOnY', -3, 3, 0.02).onChange(val => {
    cube.position.y = val
  })
  // gui.add(guiOptions, 'moveOnY').min(-3).max(3).step(0.02)

  gui.add(guiOptions, 'visible').onChange(val => {
    cube.visible = val
  })

  gui.add(guiOptions, 'wireframe').onChange(val => {
    cube.material.wireframe = val
  })

  gui.add(guiOptions, 'spin')

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
    // 原生js事件实现鼠标旋转mesh
    // camera.position.x = Math.sin(cursor.x * Math.PI * 2) * 3
    // camera.position.Z = Math.cos(cursor.x * Math.PI * 2) * 3
    // camera.lookAt(cube.position)

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
