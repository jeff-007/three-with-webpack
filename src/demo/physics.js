import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import CANNON from 'cannon'

function init () {
  const container = document.getElementById('container');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();

  // renderer.setClearColor(new THREE.Color('#ffffff', 1.0));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  // const axesHelper = new THREE.AxesHelper(2)
  // scene.add(axesHelper);

  // create and position the plane
  const planeGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  plane.rotation.x = -0.5 * Math.PI;
  scene.add(plane);

  const sphereGeometry = new THREE.SphereGeometry(4, 20, 20);
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x7777ff });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.castShadow = true;
  scene.add(sphere);

  // 创建物理场景
  const world = new CANNON.World()
  // 设置重力，接收一个Vec3变量
  world.gravity.set(0, -9.82, 0)
  // three.js中通过添加mesh向场景中添加对象，在物理场景中则是添加Body
  // Bodies are objects that will fall and collide with other bodies
  console.log(world)

  // 可以通过设置物理场景中物体的材质来改变物体的摩擦、弹动等效果
  // 首先定义需要实现动画效果的材质（在创建Body时为其material属性赋值）,所传参数只是方便标记当前材质无实际意义
  // 然后创建ContactMaterial，设置上述定义的材质在接触时的效果（设置摩擦，弹跳等）
  const concreteMaterial = new CANNON.Material('concrete')
  const plasticMaterial = new CANNON.Material('plastic')
  const concretePlasticContactMaterial = new CANNON.ContactMaterial(
    concreteMaterial,
    plasticMaterial,
    {
      friction: 0.1,
      restitution: 0.7
    }
  )
  world.addContactMaterial(concretePlasticContactMaterial)
  // 也可以将 concreteMaterial、plasticMaterial改为defaultMaterial，减少变量名的引用
  // const defaultMaterial = new CANNON.Material('default')
  // const defaultPlasticContactMaterial = new CANNON.ContactMaterial(
  //   defaultMaterial,
  //   defaultMaterial,
  //   {
  //     friction: 0.1,
  //     restitution: 0.7
  //   }
  // )

  // 创建shape，类似于three中的geometry
  const sphereShape = new CANNON.Sphere(4)
  // 创建Body，传入质量、位置信息
  const sphereBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(-10, 20, 0),
    shape: sphereShape,
    material: plasticMaterial
  })

  // 通过applyForce或者applyLocalForce给球体施加力
  // 第一个参数使用向量表示力，第二个参数表示力的作用点
  sphereBody.applyLocalForce(new CANNON.Vec3(300, 0, 0), new CANNON.Vec3(0, 0, 0))

  // 将创建好的Body添加至world
  world.addBody(sphereBody)

  // 使用Plane shape创建一个新Body模拟地面
  // set the mass to 0 so that the body is static
  const floorShape = new CANNON.Plane();
  const floorBody = new CANNON.Body();
  floorBody.material = concreteMaterial
  floorBody.mass = 0
  floorBody.addShape(floorShape)
  // CANNON中的旋转只能通过四元数Quaternion实现，具体方法详见文档
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)
  world.addBody(floorBody)

  // position and point the camera to the center of the scene
  camera.position.set(-54, 83, 85)
  camera.lookAt(new THREE.Vector3(10, 0, 0));

  // add subtle ambient lighting
  const ambiColor = '#1c1c1c';
  const ambientLight = new THREE.AmbientLight(ambiColor, 0.5);
  scene.add(ambientLight);

  const spotLight = new THREE.SpotLight('#97a0a5');
  spotLight.position.set(-40, 30, -10);
  spotLight.castShadow = true;
  spotLight.shadow.camera.near = 2;
  spotLight.shadow.camera.far = 400;
  spotLight.shadow.camera.fov = 40;
  spotLight.target = plane;
  spotLight.angle = 0.8;
  scene.add(spotLight);

  // const target = new THREE.Object3D();
  // target.position = new THREE.Vector3(5, 0, 0);

  // add the output of the renderer to the html element
  container.appendChild(renderer.domElement);

  const guiOptions = {
    ambientColor: ambiColor,
  }

  const gui = new dat.GUI();

  gui.addColor(guiOptions, 'ambientColor').onChange((e) => {
    ambientLight.color = new THREE.Color(e)
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
  // let deltaTime = 0

  render();

  function render() {
    // 计算本次渲染距上一次渲染所用的时间
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    // 在每一帧渲染时，使用applyForce模拟风的作用
    // 第二个参数表示力的作用点
    sphereBody.applyForce(new CANNON.Vec3(-0.5, 0, -0.5), sphereBody.position)

    // 更新CANNON.js的world以及three.js中的场景
    // 使用step方法更新world step原理详见 https://gafferongames.com/post/fix_your_timestep/
    // 时间步长(time step)可设置为1/60，渲染频率为60fps
    world.step(1 / 60, deltaTime * 2, 3)
    // 将物理场景中的物体每一帧坐标同步到three中的网格
    sphere.position.copy(sphereBody.position)

    stats.update();
    controls.update()

    // step += guiOptions.bouncingSpeed;
    // sphere.position.x = 20 + (10 * (Math.cos(step)));
    // sphere.position.y = 2 + (10 * Math.abs(Math.sin(step)));

    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }
  // resize the viewport
  function onResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize, false);
}

window.onload = init;
