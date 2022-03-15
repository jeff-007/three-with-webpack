// projectionMatrix: transform the coordinates into the clip space coordinates;
// viewMatrix: apply transformation relative to the camera(position, rotation, field of view, near, far);
// modelMatrix: apply transformation relative to the Mesh(position, rotation, scale);
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

attribute vec3 position;
attribute float aRandom;

varying float vRandom;


void main() {
//    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    modelPosition.z += sin(modelPosition.x * aRandom) * 0.5;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
    vRandom = aRandom;
}
