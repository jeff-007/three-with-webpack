import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

import flowLightVertex from '../../src/shaders/flowing-light/vertex.glsl'
import flowLightFragment from '../../src/shaders/flowing-light/fragment.glsl'

import portalVertex from '../../src/shaders/portal/vertex.glsl'
import portalFragment from '../../src/shaders/portal/fragment.glsl'

const radius = 5;
const cameraPositions = [
  { x: 5, y: -20, z: 200 },
  { x: 0.5, y: -2, z: 20 }
]; // 相机位置坐标
const group = new THREE.Group();
const groupDots = new THREE.Group();
const groupLines = new THREE.Group();
const groupHalo = new THREE.Group(); // 卫星环+小卫星
const aGroup = new THREE.Group();
const initFlag = true;
const WaveMeshArr = []; // 所有波动光圈集合
const planGeometry = new THREE.PlaneBufferGeometry(1, 1); // 默认在XOY平面上
const globalTextureLoader = new THREE.TextureLoader();
const map = new THREE.Object3D();
let globalScene, globalCamera, backgroundStars, loadedFont
const uniforms2 = {
  u_time: { value: 0.0 }
};

const textOptions = {
  styleOption: {
    size: 0.8, // 字体大小
    height: 0, // 拉伸长度
    curveSegments: 30, // 图形拉伸时分段数
    bevelEnabled: true, // 设置斜角
    bevelThickness: 0.03, // 斜角深度
    bevelSize: 0.02, // 斜角高度
    bevelOffset: 0,
    bevelSegments: 4 // 斜角分段数
  },
}

// 模拟的空间坐标 已经通过经纬度转换了
const posArr = [
  { x: -1.7049594735603837, y: 3.208354470512221, z: -3.4350509144786985 },
  { x: -2.1965610576118175, y: 2.1955955192304506, z: -3.9184792759587768 },
  { x: -2.2290975556080355, y: 2.6054406912933263, z: -3.639066211507457 },
  { x: 0.5738958419746141, y: -0.44114968930852216, z: 4.9473255920938985 },
  { x: -0.9326350073394328, y: 2.8399222968004114, z: -4.00812091773949 },
  { x: 3.469198597393574, y: 1.2295167303380952, z: -3.3842206934036057 },
  { x: -2.4019084876611916, y: -2.190220428765315, z: 3.7991801866087123 },
  { x: -2.49363689878109, y: -4.099696049856375, z: 1.4050862307450966 },
  { x: -2.3729307780326305, y: 2.840227787960863, z: 3.3618901878497454 },
  { x: -2.0636200279017873, y: 0.7444294629976027, z: -4.493027615657812 },
  { x: 0.47725894517680106, y: 2.4327372143508037, z: -4.34212085796347 },
  { x: -2.4777001955161246, y: -1.2092952460724242, z: 4.171163716394502 },
  { x: -0.03915748918627658, y: -0.008362945319338826, z: 4.999839672648135 },
  { x: 1.5223738738260317, y: -1.032865814102439, z: -4.649254348640267 },
  { x: -0.26640112020426315, y: -4.314854187280748, z: 2.5121830716848077 },
  { x: -4.031470206741836, y: -2.606648761952297, z: -1.3973654511134501 },
  { x: 0.8544382232162094, y: 1.5274953155132989, z: 4.683662390031124 },
  { x: 3.0409624989238546, y: 1.76433738825175, z: -3.555230043268055 },
  { x: -4.721251023266457, y: 1.2354922989397954, z: -1.0878177947459262 },
  { x: 2.1518961827021106, y: 3.891904027152385, z: -2.285262755638206 },
  { x: 0.8501960736517479, y: -2.851729208821255, z: -4.018060123480341 },
  { x: 2.5631840141785176, y: 4.263234820997851, z: -0.5048926326370041 },
  { x: -0.4580143454812531, y: -2.6523265200067385, z: 4.213714144386437 }
];

function init () {
  const container = document.getElementById('container');
  globalScene = new THREE.Scene();
  globalCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();

  // renderer.setClearColor(new THREE.Color('#ffffff', 1.0));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = THREE.PCFShadowMap;

  globalCamera.position.set(0.5, -2, 20);
  globalCamera.lookAt(0, 3, 0);

  globalScene.background = new THREE.Color(0x020924);
  globalScene.fog = new THREE.Fog(0x020924, 200, 1000);

  // 网格
  const grid = new THREE.GridHelper(2, 10, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  globalScene.add(grid);


  const controls = new OrbitControls(globalCamera, renderer.domElement)
  controls.enableDamping = true;
  controls.enableZoom = true;
  // 是否自动旋转
  controls.autoRotate = false;
  controls.autoRotateSpeed = 2;
  controls.enablePan = true;

  const gui = new dat.GUI();
  const guiOptions = {
    clearColor: '#201919',
    portalColorStart: '#000000',
    portalColorEnd: '#d1b9b3'
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

  // 修正色值
  // 在blender中保存纹理图片时，设置的保存格式为RGB，需要设置贴图以及renderer对应的编码格式
  // bakedTexture.encoding = THREE.sRGBEncoding
  // renderer.outputEncoding = THREE.sRGBEncoding

  const gltfLoader = new GLTFLoader()
  // gltfLoader.load('/models/Fox/glTF/Fox.gltf', (gltf) => {
  //   // 当模型中的场景有多个子节点需要添加时（scene.children长度大于1）,添加到当前场景时，需要先拷贝一份，否则执行scene.add后，被添加的元素会从模型场景中移除，导致循环添加时会缺少部分元素未被正确添加
  //   const childrenCopy = [...gltf.scene.children];
  //   for (const child of childrenCopy) {
  //     scene.add(child)
  //   }
  // })

  container.appendChild(renderer.domElement);

  gui.addColor(guiOptions, 'clearColor').onChange((val) => {
    renderer.setClearColor(val)
  })

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

    globalAnimate()

    // step += guiOptions.bouncingSpeed;
    // sphere.position.x = 20 + (10 * (Math.cos(step)));
    // sphere.position.y = 2 + (10 * Math.abs(Math.sin(step)));

    requestAnimationFrame(render);
    renderer.render(globalScene, globalCamera);
  }
  // resize the viewport
  function onResize () {
    globalCamera.aspect = window.innerWidth / window.innerHeight;
    globalCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // firefliesMaterial.uniforms.uPixelRadio.value = Math.min(window.devicePixelRatio, 2)
  }
  window.addEventListener('resize', onResize, false);
}

// 初始化灯光
function initLight() {
  const ambientLight = new THREE.AmbientLight(0xcccccc, 1.1);
  globalScene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
  directionalLight.position.set(1, 0.1, 0).normalize();
  const directionalLight2 = new THREE.DirectionalLight(0xff2ffff, 0.2);
  directionalLight2.position.set(1, 0.1, 0.1).normalize();
  globalScene.add(directionalLight);
  globalScene.add(directionalLight2);
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
  hemiLight.position.set(0, 1, 0);
  globalScene.add(hemiLight);
  const directionalLight3 = new THREE.DirectionalLight(0xffffff);
  directionalLight3.position.set(1, 500, -20);
  directionalLight3.castShadow = true;
  directionalLight3.shadow.camera.top = 18;
  directionalLight3.shadow.camera.bottom = -10;
  directionalLight3.shadow.camera.left = -52;
  directionalLight3.shadow.camera.right = 12;
  globalScene.add(directionalLight3);
}

function initEarth() {
  // 地球
  globalTextureLoader.load('/textures/examples/earth-2.jpg', (texture) => {
    const globeGeometry = new THREE.SphereGeometry(radius, 100, 100);
    const globeMaterial = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    group.rotation.set(0.5, 2.9, 0.1);
    group.add(globeMesh);
    globalScene.add(group);
  });
}

// 卫星效果
function initSatellite() {
  // 光环
  globalTextureLoader.load('/textures/examples/halo.png', (texture) => {
    const geometry = new THREE.PlaneGeometry(14, 14);// 矩形平面
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    groupHalo.add(mesh);
  });

  // 添加环绕文字
  const fontLoader = new FontLoader()
  fontLoader.load('/fonts/FangSong_Regular.json', (font) => {
    loadedFont = font
    let text = createText(textOptions.styleOption)
    text.position.set(6, 0, 0)
    text.rotation.set(Math.PI / 2, Math.PI / 2, Math.PI)
    groupHalo.add(text);
    // text = guiOptions.createText(textOptions.styleOption)
    // scene.add(text)
  })

  // 卫星
  globalTextureLoader.load('/textures/examples/small-earth.png', (texture) => {
    const p1 = new THREE.Vector3(-7, 0, 0);// 顶点1坐标
    const p2 = new THREE.Vector3(7, 0, 0);// 顶点2坐标
    const points = [p1, p2];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.PointsMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      size: 1, // 点对象像素尺寸
      depthWrite: false
    });// 材质对象
    const earthPoints = new THREE.Points(geometry, material);// 点模型对象
    groupHalo.add(earthPoints);// 点对象添加到场景中
  });


  groupHalo.rotation.set(1.9, 0.5, 1);
  globalScene.add(groupHalo);
}

function createText(options) {
  const matCapTexture = globalTextureLoader.load('/textures/matcaps/3.png')
  const textGeometry = new TextGeometry('你好世界', {
    font: loadedFont,
    ...options
  })
  // 居中显示文字，先计算几何体边界（两种边界类型 box sphere）
  // computeBoundingBox、translate方法只应用在几何体对象上
  // 设置斜角的原因，文字几何体在x、y轴上的位移距离要先减去斜角高度，z轴上位移距离需要减去斜角深度
  textGeometry.computeBoundingBox()
  const { styleOption: { bevelSize, bevelThickness } } = textOptions
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
}

// 地球光晕
function initEarthSprite() {
  const texture = globalTextureLoader.load('/textures/examples/earth-aperture.png');
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(radius * 3, radius * 3, 1);
  group.add(sprite);
}

// 背景星空
function initPoints() {
  const texture = globalTextureLoader.load('/textures/examples/gradient.png');
  const positions = [];
  const colors = [];
  const geometry = new THREE.BufferGeometry();
  for (let i = 0; i < 10000; i++) {
    const vertex = new THREE.Vector3();
    vertex.x = Math.random() * 2 - 1;
    vertex.y = Math.random() * 2 - 1;
    vertex.z = Math.random() * 2 - 1;
    positions.push(vertex.x, vertex.y, vertex.z);
    const color = new THREE.Color();
    color.setHSL(Math.random() * 0.2 + 0.5, 0.55, Math.random() * 0.25 + 0.55);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const starsMaterial = new THREE.PointsMaterial({
    map: texture,
    size: 1,
    transparent: true,
    opacity: 1,
    vertexColors: true, // true：且该几何体的colors属性有值，则该粒子会舍弃第一个属性--color，而应用该几何体的colors属性的颜色
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  backgroundStars = new THREE.Points(geometry, starsMaterial);
  backgroundStars.scale.set(300, 300, 300);
  globalScene.add(backgroundStars);
}

// 中国地图区域描边高亮
function initGeoJson() {
  const loader = new THREE.FileLoader();
  loader.load('/json/geography/china.json', (data) => {
    const jsonData = JSON.parse(data);
    initMap(jsonData);
  });
  loader.load('/json/geography/china-outline.json', (data) => {
    const jsonData = JSON.parse(data);
    outLineMap(jsonData);
  });
}

function initMap(chinaJson) {
  // 遍历省份构建模型
  chinaJson.features.forEach(elem => {
    // 新建一个省份容器：用来存放省份对应的模型和轮廓线
    const province = new THREE.Object3D();
    const coordinates = elem.geometry.coordinates;
    coordinates.forEach(multiPolygon => {
      multiPolygon.forEach(polygon => {
        // 区别于 gltf-stage.js 示例中的萤火效果demo，这里未直接申明Float32Array变量，而是声明一个普通数组positions，然后在添加位置信息时使用Float32BufferAttribute属性
        // 声明Float32Array变量时需要传入数组长度，并且不能使用普通数组的push等方法
        // 经纬度转换为球面坐标
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0XF19553 });
        const positions = [];
        const linGeometry = new THREE.BufferGeometry();
        for (let i = 0; i < polygon.length; i++) {
          const pos = lglt2xyz(polygon[i][0], polygon[i][1]);
          positions.push(pos.x, pos.y, pos.z);
        }
        linGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const line = new THREE.Line(linGeometry, lineMaterial);
        province.add(line);
      });
    });
    map.add(province);
  });
  group.add(map);
}

function outLineMap(json) {
  json.features.forEach(elem => {
    // 新建一个省份容器：用来存放省份对应的模型和轮廓线
    const province = new THREE.Object3D();
    const coordinates = elem.geometry.coordinates;
    coordinates.forEach(multiPolygon => {
      multiPolygon.forEach(polygon => {
        // 这里的坐标要做2次使用：1次用来构建模型，1次用来构建轮廓线
        if (polygon.length > 200) {
          const v3ps = [];
          for (let i = 0; i < polygon.length; i++) {
            const pos = lglt2xyz(polygon[i][0], polygon[i][1]);
            v3ps.push(pos);
          }
          // CatmullRomCurve3 使用Catmull-Rom算法，从一系列的点创建一条平滑的三维样条曲线，接收一个数组，数组中每一项是一个vector3对象
          const curve = new THREE.CatmullRomCurve3(v3ps, false);
          const color = new THREE.Vector3(0.5999758518718452, 0.7798940272761521, 0.6181903838257632);
          const flyLine = initFlyLine(curve, {
            speed: 0.4,
            // color: randomVec3Color(),
            color: color,
            number: 3, // 同时跑动的流光数量
            length: 0.2, // 流光线条长度
            size: 3 // 粗细
          }, 5000);
          province.add(flyLine);
        }
      });
    });
    map.add(province);
  });
  group.add(map);
}

// curve {THREE.Curve} 路径
// matSetting {Object} 材质配置项
// pointsNumber {Number} 点的个数 越多越细致
function initFlyLine(curve, matSetting, pointsNumber) {
  const points = curve.getPoints(pointsNumber); // 根据传入的点个数将曲线分段
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const length = points.length;
  const percents = new Float32Array(length);
  for (let i = 0; i < points.length; i += 1) {
    percents[i] = (i / length);
  }
  geometry.addAttribute('percent', new THREE.BufferAttribute(percents, 1));
  const lineMaterial = initLineMaterial(matSetting);
  const flyLine = new THREE.Points(geometry, lineMaterial);
  return flyLine;
}

function initLineMaterial(setting) {
  const number = setting ? (Number(setting.number) || 1.0) : 1.0;
  const speed = setting ? (Number(setting.speed) || 1.0) : 1.0;
  const length = setting ? (Number(setting.length) || 0.5) : 0.5;
  const size = setting ? (Number(setting.size) || 3.0) : 3.0;
  const color = setting ? setting.color || new THREE.Vector3(0, 1, 1) : new THREE.Vector3(0, 1, 1);
  const singleUniforms = {
    u_time: uniforms2.u_time,
    number: { type: 'f', value: number },
    speed: { type: 'f', value: speed },
    length: { type: 'f', value: length },
    size: { type: 'f', value: size },
    color: { type: 'v3', value: color }
  };
  const lineMaterial = new THREE.ShaderMaterial({
    uniforms: singleUniforms,
    vertexShader: flowLightVertex,
    fragmentShader: flowLightFragment,
    transparent: true
    // blending:THREE.AdditiveBlending,
  });
  return lineMaterial;
}

// 初始化点和曲线
function initDotAndFly() {
  // 创建标注点（即地球表面飞线起始点），然后将场景图添加到group中进行渲染显示
  setRandomDot(groupDots);
  group.add(groupDots);
  // 曲线
  const animateDots = [];
  groupDots.children.forEach(elem => {
    if (groupDots.children[0].position.x == elem.position.x) {
      return true;
    }
    // groupDots children中的每个mesh都通过  mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3) 处理，调整了当前点在球面的法线方向
    const line = addLines(groupDots.children[0].position, elem.position);
    groupLines.add(line.lineMesh);
    animateDots.push(line.curve.getPoints(100)); // 这个是里面球
  });
  group.add(groupLines);
  console.log('animateDots', animateDots)
  // 添加动画
  for (let i = 0; i < animateDots.length; i++) {
    const aGeo = new THREE.SphereGeometry(0.03, 0.03, 0.03);
    const aMater = new THREE.MeshPhongMaterial({ color: '#F8D764' });
    const aMesh = new THREE.Mesh(aGeo, aMater);
    aGroup.add(aMesh);
  }
  let vIndex = 0;
  // 曲线上动画实现原理：将animateDots中每条生成的曲线100等分，并且每条曲线创建一个动画小球
  // 然后通过定时器每隔0.02s在100等分的坐标点之间按照顺序移动动画小球
  function animateLine() {
    aGroup.children.forEach((elem, index) => {
      const v = animateDots[index][vIndex];
      elem.position.set(v.x, v.y, v.z);
    });
    vIndex++;
    if (vIndex > 100) {
      vIndex = 0;
    }
    setTimeout(animateLine, 20);
  }
  group.add(aGroup);
  animateLine();
}

// 形参group指向全局变量groupDots
// 添加地球表面飞线起始点
function setRandomDot(group) {
  const texture = globalTextureLoader.load('/textures/examples/label.png');
  const texture2 = globalTextureLoader.load('/textures/examples/label-aperture.png');
  posArr.forEach(pos => {
    const dotMesh = createPointMesh(pos, texture);
    const waveMesh = createWaveMesh(pos, texture2);
    group.add(dotMesh);
    group.add(waveMesh);
    WaveMeshArr.push(waveMesh);
  });
}

function createPointMesh(pos, texture) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true, // 使用背景透明的png贴图，注意开启透明计算
    // side: THREE.DoubleSide, //双面可见
    depthWrite: false // 禁止写入深度缓冲区数据
  });
  const mesh = new THREE.Mesh(planGeometry, material);
  const size = radius * 0.04;// 矩形平面Mesh的尺寸
  mesh.scale.set(size, size, size);// 设置mesh大小
  // 设置mesh位置
  mesh.position.set(pos.x, pos.y, pos.z);
  // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
  const coordVec3 = new THREE.Vector3(pos.x, pos.y, pos.z).normalize();
  // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
  const meshNormal = new THREE.Vector3(0, 0, 1);
  // 四元数属性.quaternion表示mesh的旋转
  // setFromUnitVectors(vFrom, vTo): Sets this quaternion to the rotation required to rotate direction vector vFrom to direction vector vTo.
  // vFrom and vTo are assumed to be normalized.
  mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);
  return mesh;
}

function createWaveMesh(pos, texture) {
  const material = new THREE.MeshBasicMaterial({
    color: 0x22ffcc,
    map: texture,
    transparent: true, // 使用背景透明的png贴图，注意开启透明计算
    opacity: 1.0,
    // side: THREE.DoubleSide, //双面可见
    depthWrite: false // 禁止写入深度缓冲区数据
  });
  const mesh = new THREE.Mesh(planGeometry, material);
  // var coord = lon2xyz(R*1.001, lon, lat)
  const size = radius * 0.055;// 矩形平面Mesh的尺寸
  mesh.size = size;// 自顶一个属性，表示mesh静态大小
  mesh.scale.set(size, size, size);// 设置mesh大小
  mesh._s = Math.random() * 1.0 + 1.0;// 自定义属性._s表示mesh在原始大小基础上放大倍数  光圈在原来mesh.size基础上1~2倍之间变化
  mesh.position.set(pos.x, pos.y, pos.z);
  // mesh姿态设置
  // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
  const coordVec3 = new THREE.Vector3(pos.x, pos.y, pos.z).normalize();
  // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
  const meshNormal = new THREE.Vector3(0, 0, 1);
  // 四元数属性.quaternion表示mesh的角度状态
  // .setFromUnitVectors();计算两个向量之间构成的四元数值
  mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);
  return mesh;
}

// 添加飞线, v0 起点 v3 终点
function addLines(v0, v3) {
  // 计算起点和终点的夹角
  const angle = (v0.angleTo(v3) * 1.8) / Math.PI / 0.1; // 0 ~ Math.PI
  const aLen = angle * 0.4;
  const hLen = angle * angle * 12;
  const p0 = new THREE.Vector3(0, 0, 0);
  // 以场景中心为射线起点，v0和v3中心点为方向发射一条射线
  const rayLine = new THREE.Ray(p0, getVCenter(v0.clone(), v3.clone()));
  // 顶点坐标
  const vtop = rayLine.at(hLen / rayLine.at(1, new THREE.Vector3()).distanceTo(p0), new THREE.Vector3());

  // 控制点坐标
  const v1 = getLenVcetor(v0.clone(), vtop, aLen);
  const v2 = getLenVcetor(v3.clone(), vtop, aLen);
  // 绘制三维三次贝赛尔曲线
  const curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3);
  const geometry = new LineGeometry();
  const points = curve.getSpacedPoints(50);
  const positions = [];
  const colors = [];
  const color = new THREE.Color();
  /**
   * HSL中使用渐变
   * h — hue value between 0.0 and 1.0
   * s — 饱和度 between 0.0 and 1.0
   * l — 亮度 between 0.0 and 1.0
   */
  for (let j = 0; j < points.length; j++) {
    // color.setHSL( .31666+j*0.005,0.7, 0.7); //绿色
    color.setHSL(0.81666 + j, 0.88, 0.715 + j * 0.0025); // 粉色
    colors.push(color.r, color.g, color.b);
    positions.push(points[j].x, points[j].y, points[j].z);
  }
  // LineGeometry 中的 setPositions 方法设置通过传入的位置数组设置几何体的位置数据，内部使用Float32Array
  geometry.setPositions(positions);
  geometry.setColors(colors);
  const matLine = new LineMaterial({
    linewidth: 0.0006,
    vertexColors: true,
    dashed: false
  });

  return {
    curve: curve,
    lineMesh: new Line2(geometry, matLine)
  };
}

function initLightPillar() {
  const texture = globalTextureLoader.load('/textures/examples/label.png');
  const datas = [
    {
      lng: 86.39895905468748, lat: 45.15923349468924 // 合肥
    },
    {
      lng: 106.54041, lat: 29.40268 // 重庆
    }
  ];
  datas.forEach(function (obj) {
    const pos = lglt2xyz(obj.lng, obj.lat);
    const LightPillar = createLightPillar(pos);
    groupDots.add(LightPillar);
    const waveMesh = createLightWaveMesh(pos, texture);
    LightPillar.add(waveMesh);
  });
}

function createLightPillar(pos) {
  const height = radius * 0.1;// 光柱高度，和地球半径相关，这样调节地球半径，光柱尺寸跟着变化
  const geometry = new THREE.PlaneBufferGeometry(radius * 0.05, height); // 默认在XOY平面上
  geometry.rotateX(Math.PI / 2);// 光柱高度方向旋转到z轴上
  geometry.translate(0, 0, height / 2);// 平移使光柱底部与XOY平面重合
  const material = new THREE.MeshBasicMaterial({
    map: globalTextureLoader.load('/textures/examples/pillar.png'),
    color: 0x44ffaa, // 光柱颜色，光柱map贴图是白色，可以通过color调节颜色
    transparent: true, // 使用背景透明的png贴图，注意开启透明计算
    side: THREE.DoubleSide, // 双面可见
    depthWrite: false // 是否对深度缓冲区有任何的影响
  });
  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  // 两个光柱交叉叠加
  group.add(mesh, mesh.clone().rotateZ(Math.PI / 2));// 几何体绕x轴旋转了，所以mesh旋转轴变为z
  group.position.set(pos.x, pos.y, pos.z);// 设置mesh位置
  const coordVec3 = new THREE.Vector3(pos.x, pos.y, pos.z).normalize();
  const meshNormal = new THREE.Vector3(0, 0, 1);
  // 四元数属性.quaternion表示mesh的角度状态
  // .setFromUnitVectors();计算两个向量之间构成的四元数值
  group.quaternion.setFromUnitVectors(meshNormal, coordVec3);
  return group;
}

function createLightWaveMesh(pos, texture) {
  const geometry = new THREE.PlaneBufferGeometry(1, 1); // 默认在XOY平面上
  const material = new THREE.MeshBasicMaterial({
    color: 0x22ffcc,
    map: texture,
    transparent: true, // 使用背景透明的png贴图，注意开启透明计算
    // side: THREE.DoubleSide, //双面可见
    depthWrite: false // 禁止写入深度缓冲区数据
  });
  const mesh = new THREE.Mesh(geometry, material);
  const size = radius * 0.05;// 矩形平面Mesh的尺寸
  mesh.scale.set(size, size, size);// 设置mesh大小
  return mesh;
}

function globalAnimate() {
  if (initFlag) {
    // 光环
    groupHalo.rotation.z += 0.01;
    group.rotation.y += 0.001;
    // 所有曲线起始点的波动光圈都有自己的透明度和大小状态
    // 一个波动光圈透明度变化过程是：0~1~0反复循环
    if (WaveMeshArr.length) {
      WaveMeshArr.forEach(function (mesh) {
        mesh._s += 0.007;
        mesh.scale.set(mesh.size * mesh._s, mesh.size * mesh._s, mesh.size * mesh._s);
        if (mesh._s <= 1.5) {
          // mesh._s=1，透明度=0 mesh._s=1.5，透明度=1
          mesh.material.opacity = (mesh._s - 1) * 2;
        } else if (mesh._s > 1.5 && mesh._s <= 2) {
          // mesh._s=1.5，透明度=1 mesh._s=2，透明度=0
          mesh.material.opacity = 1 - (mesh._s - 1.5) * 2;
        } else {
          mesh._s = 1.0;
        }
      });
    }
  }
  if (backgroundStars) {
    backgroundStars.rotation.y += 0.0001;
  }
  uniforms2.u_time.value += 0.007;
}

// 计算v1,v2 的中点
function getVCenter(v1, v2) {
  const v = v1.add(v2);
  //  divideScalar(s) 将该向量除以标量s
  return v.divideScalar(2);
}

// 计算V1，V2向量固定长度的点
// lerp ( v : Vector3, alpha : Float )
// v - Vector3 to interpolate towards.
// alpha - interpolation factor, typically in the closed interval [0, 1].
// Linearly interpolate between this vector and v, where alpha is the percent distance along the line - alpha = 0 will be this vector, and alpha = 1 will be v.
function getLenVcetor(v1, v2, len) {
  const v1v2Len = v1.distanceTo(v2);
  return v1.lerp(v2, len / v1v2Len);
}

// three中自带的经纬度转换
// 经纬度转换成球面坐标
function lglt2xyz(lng, lat) {
  const theta = (90 + lng) * (Math.PI / 180);
  const phi = (90 - lat) * (Math.PI / 180);
  return (new THREE.Vector3()).setFromSpherical(new THREE.Spherical(radius, phi, theta));
}

window.onload = () => {
  init()
  initLight()
  initEarth()
  initSatellite()
  initEarthSprite()
  initPoints()
  initGeoJson()
  initDotAndFly()
  initLightPillar()
};
