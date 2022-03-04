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

  // renderer.setClearColor(new THREE.Color('#ffffff'));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // const axesHelper = new THREE.AxesHelper()
  // scene.add(axesHelper)

  const textureLoader = new THREE.TextureLoader()
  const matCapTexture = textureLoader.load('/textures/matcaps/3.png')
  const donutTexture = textureLoader.load('/textures/matcaps/1.png')

  let text;
  let loadedFont;

  // 添加调试面板
  // 通过控制面板调整文字属性，需要删除当前文字再新建
  const gui = new dat.GUI({ closed: true })
  const guiOptions = {
    styleOption: {
      size: 0.8, // 字体大小
      height: 0.2, // 拉伸长度
      curveSegments: 30, // 图形拉伸时分段数
      bevelEnabled: true, // 设置斜角
      bevelThickness: 0.03, // 斜角深度
      bevelSize: 0.02, // 斜角高度
      bevelOffset: 0,
      bevelSegments: 4 // 斜角分段数
    },
    // 创建文字网格
    createText: (option) => {
      const textGeometry = new TextGeometry('Just do it!', {
        font: loadedFont,
        ...option
      })
      // 居中显示文字，先计算几何体边界（两种边界类型 box sphere）
      // computeBoundingBox、translate方法只应用在几何体对象上
      // 设置斜角的原因，文字几何体在x、y轴上的位移距离要先减去斜角高度，z轴上位移距离需要减去斜角深度
      textGeometry.computeBoundingBox()
      const { styleOption: { bevelSize, bevelThickness } } = guiOptions
      textGeometry.translate(
        -textGeometry.boundingBox.max.x * 0.5,
        -(textGeometry.boundingBox.max.y - bevelSize) * 0.5,
        -(textGeometry.boundingBox.max.z - bevelThickness) * 0.5
      )
      // 几何体的center方法基于bounding box实现
      // 上述居中写法等价于textGeometry.center()
      // textGeometry.center()
      // console.log(textGeometry.boundingBox)
      const textMaterial = new THREE.MeshMatcapMaterial({ matcap: matCapTexture })
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

  // 随机donut几何体
  const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45);
  const donutMaterial = new THREE.MeshMatcapMaterial({ matcap: donutTexture })
  for (let i = 0; i < 100; i++) {
    const donut = new THREE.Mesh(donutGeometry, donutMaterial)

    donut.position.x = (Math.random() - 0.5) * 12
    donut.position.y = (Math.random() - 0.5) * 12
    donut.position.z = (Math.random() - 0.5) * 12

    donut.rotation.x = Math.random() * Math.PI
    donut.rotation.y = Math.random() * Math.PI

    // 等比例缩放
    const scale = Math.random()
    donut.scale.set(scale, scale, scale)
    scene.add(donut)
  }

  camera.position.z = 4
  text && camera.lookAt(text.position)

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
  let step = 0

  render();

  function render() {
    const elapsedTime = clock.getElapsedTime()
    stats.update();

    camera.position.x = Math.cos(step) * 8
    camera.position.y = Math.sin(step) * 8
    step += 0.005
    step %= Math.PI * 2;

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
