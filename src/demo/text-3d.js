import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

function init () {
  const container = document.getElementById('container');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  // renderer.setClearColor(new THREE.Color('#ffffff'));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  let text;
  let loadedFont;

  // 添加调试面板
  // 通过控制面板调整文字属性，需要删除当前文字再新建
  const gui = new dat.GUI({ closed: true })
  const guiOptions = {
    styleOption: {
      size: 0.5, // 字体大小
      height: 0.2, // 拉伸长度
      curveSegments: 12, // 图形拉伸时分段数
      bevelEnabled: true, // 设置斜角
      bevelThickness: 0.03, // 斜角深度
      bevelSize: 0.02, // 斜角高度
      bevelOffset: 0,
      bevelSegments: 5 // 斜角分段数
    },
    // 创建文字网格
    createText: (option) => {
      const textGeometry = new TextGeometry('Hello three.js!', {
        font: loadedFont,
        ...option
      })
      const textMaterial = new THREE.MeshBasicMaterial({ wireframe: true })
      return new THREE.Mesh(textGeometry, textMaterial)
    },
    // 更新文字网格属性
    updateText: () => {
      scene.remove(text)
      const options = { ...guiOptions.styleOption }
      text = guiOptions.createText(options)
      scene.add(text)
    }
  }

  // 加载字体文件
  const fontLoader = new FontLoader()
  fontLoader.load('fonts/helvetiker_regular.typeface.json', (font) => {
    loadedFont = font
    text = guiOptions.createText(guiOptions.styleOption)
    scene.add(text)
    gui.add(guiOptions.styleOption, 'size', 0, 1, 0.02).onChange(val => {
      guiOptions.updateText()
    })
    gui.add(guiOptions.styleOption, 'height', 0, 1, 0.02).onChange(val => {
      guiOptions.updateText()
    })
    gui.add(guiOptions.styleOption, 'curveSegments', 0, 20, 1).onChange(val => {
      guiOptions.updateText()
    })
    gui.add(guiOptions.styleOption, 'bevelEnabled').onChange(val => {
      guiOptions.updateText()
    })
    gui.add(guiOptions.styleOption, 'bevelThickness', 0, 1, 0.02).onChange(val => {
      guiOptions.updateText()
    })
    gui.add(guiOptions.styleOption, 'bevelSize', 0, 1, 0.02).onChange(val => {
      guiOptions.updateText()
    })
    gui.add(guiOptions.styleOption, 'bevelSegments', 0, 20, 1).onChange(val => {
      guiOptions.updateText()
    })
  })
  camera.position.z = 2
  camera.lookAt(0, 0, 0)

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
