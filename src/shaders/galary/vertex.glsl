uniform float uSize;
uniform float uTime;

// 当使用 ShaderMaterial 材质并且设置了 vertexColors 为true时，可以直接使用color属性不需要再设置
attribute float aScale;

varying vec2 vUv;
varying vec3 vColor;

void main() {
    // position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // 粒子圆周运动
    // 获取粒子距离系统中心点的角度和距离
    float angle = atan(modelPosition.x, modelPosition.z);
    // 根据传入的时间以及粒子到中心的距离增加旋转角
    float distanceToCenter = length(modelPosition.xz);
    // 下一时间角度偏移量
    float angleOffset = (1.0 / distanceToCenter) * uTime * 0.2;
    angle += angleOffset;
    // 更新粒子位置
    modelPosition.x = distanceToCenter * cos(angle);
    modelPosition.z = distanceToCenter * sin(angle);

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
    vUv = uv;
    vColor = color;

    // 尺寸 gl_PointSize设置的是片段fragment的大小
    // 粒子在像素比为 1 的屏幕上会比在像素比为 2 的屏幕上大两倍
    gl_PointSize = uSize * aScale;
    gl_PointSize *= (1.0 / -viewPosition.z);

}
