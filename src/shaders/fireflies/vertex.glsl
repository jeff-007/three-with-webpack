uniform float uPixelRadio;
uniform float uSize;
uniform float uTime;

// 为每个粒子添加随机放大倍数
attribute float aScale;

// 当使用 ShaderMaterial 材质并且设置了 vertexColors 为true时，可以直接使用color属性不需要再设置
varying vec2 vUv;
varying vec3 vColor;

void main() {
    // position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // 通过渲染时间生成浮动动画效果
    modelPosition.y += sin(uTime + modelPosition.x * 100.0) * aScale * 0.2;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
    vUv = uv;

    // 尺寸 gl_PointSize设置的是片段fragment的大小
    // 粒子在像素比为 1 的屏幕上会比在像素比为 2 的屏幕上大两倍
    gl_PointSize = uSize * aScale * uPixelRadio;

    // 增加粒子近大远小的效果
    gl_PointSize *= (1.0 / -viewPosition.z);
}
