import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

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
const initFlag = false;
const WaveMeshArr = []; // 所有波动光圈集合
const planGeometry = new THREE.PlaneBufferGeometry(1, 1); // 默认在XOY平面上
const globalTextureLoader = new THREE.TextureLoader();
const map = new THREE.Object3D();
let globalScene, globalCamera, backgroundStars
let uniforms2 = {
  u_time: { value: 0.0 }
};

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
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0XF19553 }); // 0x3BFA9E
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
};
