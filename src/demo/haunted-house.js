import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

function init () {
  const container = document.getElementById('container');
  const scene = new THREE.Scene();
  const fog = new THREE.Fog('#262837', 1, 28)
  scene.fog = fog

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5.5, 3.8, 7.2)
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer();
  renderer.setClearColor('#262837')
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  const textureLoader = new THREE.TextureLoader()

  const house = new THREE.Group()
  scene.add(house)

  // 地面
  const grassColorTexture = textureLoader.load('/textures/grass_large.jpg')
  grassColorTexture.repeat.set(2, 2)
  grassColorTexture.wrapS = grassColorTexture.wrapT = THREE.RepeatWrapping
  const planeGeometry = new THREE.PlaneBufferGeometry(20, 20);
  const planeMaterial = new THREE.MeshStandardMaterial({
    map: grassColorTexture,
    side: THREE.DoubleSide,
  });

  planeMaterial.onBeforeCompile = (shader) => {
    console.log(shader.vertexShader)
    shader.uniforms.uTime = { value: 0 }
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
        #include <common>
        uniform float uTime;
        mat2 get2dRotateMatrix(float _angle)
        {
            return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
        }
      `
    )
  }

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.y = 0;

  scene.add(plane);

  // 房屋尺寸大小
  const wallSize = {
    width: 4,
    height: 2.5,
    depth: 4
  }

  // 房屋围墙
  const bricksColorTexture = textureLoader.load('/textures/bricks/stone.jpg')
  const bricksRoughTexture = textureLoader.load('/textures/bricks/stone-bump.jpg')
  const walls = new THREE.Mesh(
    new THREE.BoxBufferGeometry(wallSize.width, wallSize.height, wallSize.depth),
    new THREE.MeshStandardMaterial({
      map: bricksColorTexture,
      // aoMap: bricksRoughTexture,
      // normalMap: bricksRoughTexture,
      bumpMap: bricksRoughTexture
    })
  )
  // walls.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(walls.geometry.attributes.uv.array, 2))
  walls.position.y = wallSize.height / 2 + 0.01
  walls.castShadow = true
  house.add(walls)

  // 屋顶
  const roofSize = {
    width: 3.5,
    height: 1,
    depth: 4
  }
  const roof = new THREE.Mesh(
    new THREE.ConeBufferGeometry(roofSize.width, roofSize.height, roofSize.depth),
    new THREE.MeshStandardMaterial({ color: '#b35f45' })
  )
  roof.position.y = wallSize.height + roofSize.height / 2
  roof.rotation.y = Math.PI * 0.25
  house.add(roof)

  // 门
  const door = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1, 1.4),
    new THREE.MeshStandardMaterial({ color: '#aa7b7b' })
  )
  console.log('geometry', door.geometry)

  // door.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(door.geometry.attributes.uv.array, 2))

  door.position.y = 0.7;
  door.position.z = wallSize.depth / 2 + 0.01
  house.add(door)

  // 灌木
  const bushGeometry = new THREE.SphereBufferGeometry(1, 16, 16)
  const bushMaterial = new THREE.MeshStandardMaterial({ color: '#89c854' })

  const bush1 = new THREE.Mesh(bushGeometry, bushMaterial)
  bush1.scale.set(0.5, 0.5, 0.5)
  bush1.position.set(0.8, 0.2, 2.2)
  bush1.castShadow = true

  const bush2 = new THREE.Mesh(bushGeometry, bushMaterial)
  bush2.scale.set(0.25, 0.25, 0.25)
  bush2.position.set(1.4, 0.1, 2.1)
  bush2.castShadow = true

  const bush3 = new THREE.Mesh(bushGeometry, bushMaterial)
  bush3.scale.set(0.4, 0.4, 0.4)
  bush3.position.set(-0.9, 0.1, 2.2)
  bush3.castShadow = true

  house.add(bush1, bush2, bush3)

  // 墓碑
  const graves = new THREE.Group()
  scene.add(graves)

  const graveGeometry = new THREE.BoxBufferGeometry(0.6, 0.8, 0.2)
  const graveMaterial = new THREE.MeshStandardMaterial({ color: '#b2b6b1' })

  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 3 + Math.random() * 6
    const x = Math.sin(angle) * radius
    const z = Math.cos(angle) * radius
    const grave = new THREE.Mesh(graveGeometry, graveMaterial)
    grave.castShadow = true
    grave.position.set(x, 0.3, z)
    grave.rotation.y = (Math.random() - 0.5) * 0.4
    grave.rotation.z = (Math.random() - 0.5) * 0.2
    graves.add(grave)
  }

  const ghost1 = new THREE.PointLight('#ff00ff', 2, 3)
  const ghost2 = new THREE.PointLight('#00ffff', 2, 3)
  const ghost3 = new THREE.PointLight('#ffff00', 2, 3)
  ghost1.castShadow = true
  ghost2.castShadow = true
  ghost3.castShadow = true
  scene.add(ghost1, ghost2, ghost3)

  // 模拟月光
  const pointColor = '#b9d5ff';
  const directLight = new THREE.DirectionalLight(pointColor);
  directLight.position.set(4, 5, -2);
  directLight.shadow.camera.near = 2;
  directLight.shadow.camera.far = 200;
  directLight.shadow.camera.fov = 30;
  directLight.target = plane;
  directLight.distance = 0;
  directLight.angle = 0.4;
  directLight.intensity = 0.12
  directLight.castShadow = true;
  scene.add(directLight);

  // 环境光
  const ambiColor = '#b9d5ff';
  const ambientLight = new THREE.AmbientLight(ambiColor);
  ambientLight.intensity = 0.12
  scene.add(ambientLight);

  // 门上灯光
  const doorLight = new THREE.PointLight('#fb540e', 1, 10)
  doorLight.position.set(0, 2.2, 2.7)
  doorLight.castShadow = true
  doorLight.shadow.mapSize.width = 256
  doorLight.shadow.mapSize.height = 256
  doorLight.shadow.camera.far = 7
  house.add(doorLight)

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

    // ghost 动画
    const ghost1Angle = elapsedTime * 0.5
    ghost1.position.x = Math.cos(ghost1Angle) * 4
    ghost1.position.z = Math.sin(ghost1Angle) * 4
    ghost1.position.y = Math.sin(elapsedTime * 3)

    const ghost2Angle = -elapsedTime * 0.32
    ghost2.position.x = Math.cos(ghost2Angle) * 5
    ghost2.position.z = Math.sin(ghost2Angle) * 5
    ghost2.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5)

    const ghost3Angle = -elapsedTime * 0.18
    ghost3.position.x = Math.cos(ghost3Angle) * (Math.sin(elapsedTime * 0.32) + 7)
    ghost3.position.z = Math.sin(ghost3Angle) * (Math.sin(elapsedTime * 0.5) + 7)
    ghost3.position.y = Math.sin(elapsedTime * 5) + Math.sin(elapsedTime * 2)

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
