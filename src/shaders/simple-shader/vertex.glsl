// projectionMatrix: transform the coordinates into the clip space coordinates;
// viewMatrix: apply transformation relative to the camera(position, rotation, field of view, near, far);
// modelMatrix: apply transformation relative to the Mesh(position, rotation, scale);
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
// 通过外部js传入的变量
uniform vec2 uFrequency;
uniform float uTime;

attribute vec3 position;
attribute float aRandom;
// 接收uv坐标用于渲染纹理贴图
attribute vec2 uv;

varying float vRandom;
varying vec2 vUv;



void main() {
//    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    // 使用外部传入的属性 attribute 或者 uniform
    modelPosition.z += sin(modelPosition.x * aRandom + uTime) * 0.2;
    modelPosition.z += sin(modelPosition.y * uFrequency.y + uTime) * 0.2;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
    vRandom = aRandom;
    vUv = uv;
}
