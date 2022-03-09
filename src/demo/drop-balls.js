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

  // 加载音频文件
  const hitSound = new Audio('/audio/cat.ogg')
  const playHitSound = (collision) => {
    // 通过collision对象中contact的 getImpactVelocityAlongNormal() 方法获取碰撞强度
    const impactStrength = collision.contact.getImpactVelocityAlongNormal()
    if (impactStrength < 5) return
    hitSound.volume = Math.random()
    hitSound.currentTime = 0
    hitSound.play()
  }

  // const axesHelper = new THREE.AxesHelper(2)
  // scene.add(axesHelper);

  // create and position the plane
  const planeGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  plane.rotation.x = -0.5 * Math.PI;
  scene.add(plane);

  // 创建物理场景
  const world = new CANNON.World()
  // 切换碰撞检测方式 NaiveBroadphase => SAPBroadphase
  world.broadphase = new CANNON.SAPBroadphase(world)
  world.allowSleep = true
  // 设置重力，接收一个Vec3变量
  world.gravity.set(0, -9.82, 0)
  // three.js中通过添加mesh向场景中添加对象，在物理场景中则是添加Body
  // Bodies are objects that will fall and collide with other bodies
  console.log(world)

  // 可以通过设置物理场景中物体的材质来改变物体的摩擦、弹动等效果
  // 首先定义需要实现动画效果的材质（在创建Body时为其material属性赋值）,所传参数只是方便标记当前材质无实际意义
  // 然后创建ContactMaterial，设置上述定义的材质在接触时的效果（设置摩擦，弹跳等）
  // const concreteMaterial = new CANNON.Material('concrete')
  // const plasticMaterial = new CANNON.Material('plastic')
  // const concretePlasticContactMaterial = new CANNON.ContactMaterial(
  //   concreteMaterial,
  //   plasticMaterial,
  //   {
  //     friction: 0.1,
  //     restitution: 0.7
  //   }
  // )
  // world.addContactMaterial(concretePlasticContactMaterial)

  // 也可以将 concreteMaterial、plasticMaterial改为defaultMaterial，减少变量名的引用
  const defaultMaterial = new CANNON.Material('default')
  const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
      friction: 0.1,
      restitution: 0.7
    }
  )
  world.addContactMaterial(defaultContactMaterial)
  world.defaultContactMaterial = defaultContactMaterial

  // 创建多个物体
  // 保存需要在render中更新坐标的对象，一个mesh对应一个body
  const objectsToUpdate = []
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x7777ff })
  const createSphere = (radius, position) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 20), sphereMaterial)
    mesh.castShadow = true
    mesh.position.copy(position)
    scene.add(mesh)

    // 创建shape，类似于three中的geometry
    const shape = new CANNON.Sphere(radius)
    // 创建Body，传入质量、位置信息
    const body = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(-10, 20, 0),
      shape,
      // material: defaultMaterial
    })
    body.position.copy(position)
    world.addBody(body)

    objectsToUpdate.push({
      mesh,
      body
    })
  }

  createSphere(4, { x: -10, y: 30, z: 0 })

  // 添加立方体
  const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x7777ff })
  const createBox = (size, position) => {
    const { width, height, depth } = size
    const mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(width, height, depth), boxMaterial)
    mesh.castShadow = true
    mesh.position.copy(position)
    scene.add(mesh)

    // 创建shape，类似于three中的geometry
    const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))
    // 创建Body，传入质量、位置信息
    const body = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(-10, 20, 0),
      shape
      // material: defaultMaterial
    })
    body.position.copy(position)

    // 监听盒子碰撞事件、添加撞击音频
    // 监听到的碰撞事件中包含碰撞强度等信息，可根据该属性调整声音强弱
    body.addEventListener('collide', playHitSound)

    world.addBody(body)

    objectsToUpdate.push({
      mesh,
      body
    })
  }

  // 使用Plane shape创建一个新Body模拟地面
  // set the mass to 0 so that the body is static
  const floorShape = new CANNON.Plane();
  const floorBody = new CANNON.Body();
  // floorBody.material = defaultMaterial
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

  const gui = new dat.GUI();
  const guiOptions = {
    createSpheres: () => {
      if (objectsToUpdate.length >= 200) return
      const position = {
        x: (Math.random() - 0.5) * 10,
        y: 30,
        z: (Math.random() - 0.5) * 10
      }
      createSphere(Math.random() * 4, position)
    },
    createBoxes: () => {
      if (objectsToUpdate.length >= 200) return
      const size = {
        width: Math.random() * 6,
        height: Math.random() * 6,
        depth: Math.random() * 6
      }
      const position = {
        x: (Math.random() - 0.5) * 10,
        y: 30,
        z: (Math.random() - 0.5) * 10
      }
      createBox(size, position)
    }
  }
  gui.add(guiOptions, 'createSpheres')
  gui.add(guiOptions, 'createBoxes')

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

    // 时间步长(time step)可设置为1/60，渲染频率为60fps
    world.step(1 / 60, deltaTime * 2, 3)

    // 多物体通过循环渲染
    // three中object的位置、旋转与对应物理世界中的body同步
    for (const object of objectsToUpdate) {
      object.mesh.position.copy(object.body.position)
      object.mesh.quaternion.copy(object.body.quaternion)
      object.body.applyForce(new CANNON.Vec3(-0.01, 0, -0.01), object.body.position)
    }

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
