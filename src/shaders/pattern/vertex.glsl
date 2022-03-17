uniform float uBigWavesElevation; // 波浪高度
uniform vec2 uBigWaveFrequency; // 波浪频率
uniform float uTime; // 波浪动画时间
uniform float uWaveSpeed; // 波浪速度

varying vec2 vUv;
varying float vElevation;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float eleOnX = sin(modelPosition.x * uBigWaveFrequency.x + uTime * uWaveSpeed); // x方向波浪曲线，uTime增加动画
    float eleOnZ = sin(modelPosition.z * uBigWaveFrequency.y + uTime * uWaveSpeed); // x方向波浪曲线

    float elevation = (eleOnX * eleOnZ) * uBigWavesElevation;

    modelPosition.y += elevation;

    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    vUv = uv;
    vElevation = elevation;
}
