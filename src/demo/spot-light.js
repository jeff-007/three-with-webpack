import * as THREE from 'three'
import * as dat from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import gsap from 'gsap'

function init () {
  const container = document.getElementById('container');
  const stopMovingLight = false;
  // create a scene to hold all elements,such as objects,cameras and lights
  const scene = new THREE.Scene();
  // create a camera,which defines where to look at
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  // create a render and set the size
  const renderer = new THREE.WebGLRenderer();

  // renderer.setClearColor(new THREE.Color('#ffffff', 1.0));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // const axesHelper = new THREE.AxesHelper(2)
  // scene.add(axesHelper);

  // create and position the plane
  const planeGeometry = new THREE.PlaneGeometry(100, 40, 1, 1);
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;

  plane.rotation.x = -0.5 * Math.PI;
  plane.position.x = 15;
  plane.position.y = 0;
  plane.position.z = 0;

  scene.add(plane);

  // create a cube
  const cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
  const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff3333 });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.castShadow = true;

  // position the cube
  cube.position.x = -4;
  cube.position.y = 3;
  cube.position.z = 0;

  // add the cube to the scene
  scene.add(cube);

  const sphereGeometry = new THREE.SphereGeometry(4, 20, 20);
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x7777ff });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

  // position the sphere
  sphere.position.x = 20;
  sphere.position.y = 0;
  sphere.position.z = 2;
  sphere.castShadow = true;

  // add the sphere to the scene
  scene.add(sphere);

  // position and point the camera to the center of the scene
  camera.position.set(-35, 30, 25)
  camera.lookAt(new THREE.Vector3(10, 0, 0));

  // add subtle ambient lighting
  const ambiColor = '#1c1c1c';
  const ambientLight = new THREE.AmbientLight(ambiColor);
  scene.add(ambientLight);

  // add spotlight for a bit of light
  const spotLight0 = new THREE.SpotLight(0xcccccc);
  spotLight0.position.set(-40, 30, -10);
  spotLight0.lookAt(plane);
  scene.add(spotLight0);

  // const target = new THREE.Object3D();
  // target.position = new THREE.Vector3(5, 0, 0);

  const pointColor = '#ffffff';
  const spotLight = new THREE.SpotLight(pointColor);
  spotLight.position.set(-40, 60, -10);
  spotLight.castShadow = true;
  spotLight.shadow.camera.near = 2;
  spotLight.shadow.camera.far = 200;
  spotLight.shadow.camera.fov = 30;
  spotLight.target = plane;
  spotLight.distance = 0;
  spotLight.angle = 0.4;

  scene.add(spotLight);

  // add a small sphere simulating the pointlight
  const sphereLight = new THREE.SphereGeometry(0.2);
  const sphereLightMaterial = new THREE.MeshBasicMaterial({ color: 0xac6c25 });
  const sphereLightMesh = new THREE.Mesh(sphereLight, sphereLightMaterial);
  sphereLightMesh.castShadow = true;

  sphereLightMesh.position.x = 3;
  sphereLightMesh.position.y = 20;
  sphereLightMesh.position.z = 3;

  scene.add(sphereLightMesh);

  // const group = new THREE.Group();
  // scene.add(group)
  // group.add(cube, sphere)

  // animate cube with gsap libs
  gsap.to(cube.position, { duration: 4, delay: 2, x: 4 })

  // add the output of the renderer to the html element
  container.appendChild(renderer.domElement);

  // call the render function
  let step = 0;

  // used to determine the switch point for the light animation
  let invert = 1;
  let phase = 0;

  const controls = {
    rotationSpeed: 0.03,
    bouncingSpeed: 0.03,
    ambientColor: ambiColor,
    pointColor: pointColor,
    intensity: 1,
    distance: 0,
    exponent: 30,
    angle: 0.1,
    debug: false,
    castShadow: true,
    onlyShadow: false,
    target: 'Plane',
    stopMovingLight: false
  }

  const gui = new dat.GUI();

  gui.add(controls, 'ambientColor').onChange((e) => {
    ambientLight.color = new THREE.Color(e);
  })

  gui.add(controls, 'target', ['Plane', 'Sphere', 'Cube']).onChange(function (e) {
    console.log(e);
    switch (e) {
      case 'Plane':
        spotLight.target = plane;
        break;
      case 'Sphere':
        spotLight.target = sphere;
        break;
      case 'Cube':
        spotLight.target = cube;
        break;
    }
  });

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
  render();

  function render() {
    const elapsedTime = clock.getElapsedTime()
    stats.update();
    // rotate the cube around its axes
    cube.rotation.x += controls.rotationSpeed;
    cube.rotation.y += controls.rotationSpeed;
    cube.rotation.z += controls.rotationSpeed;

    // bounce the sphere up and down
    step += controls.bouncingSpeed;
    sphere.position.x = 20 + (10 * (Math.cos(step)));
    sphere.position.y = 2 + (10 * Math.abs(Math.sin(step)));

    // move the light simulation
    if (!stopMovingLight) {
      if (phase > 2 * Math.PI) {
        invert = invert * -1;
        phase -= 2 * Math.PI;
      } else {
        phase += controls.rotationSpeed;
      }
      sphereLightMesh.position.z = +(7 * (Math.sin(phase)));
      sphereLightMesh.position.x = +(14 * (Math.cos(phase)));
      sphereLightMesh.position.y = 10;

      if (invert < 0) {
        const pivot = 14;
        sphereLightMesh.position.x = (invert * (sphereLightMesh.position.x - pivot)) + pivot;
      }

      spotLight.position.copy(sphereLightMesh.position);
    }

    // render using requestAnimationFrame
    requestAnimationFrame(render);

    renderer.render(scene, camera);
  }
}

window.onload = init;
