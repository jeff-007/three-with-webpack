varying vec2 vUv;
varying vec3 vColor;

// glsl中没有内置的随机函数，可以通过以下函数实现
float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // 使用 Points 生成的粒子系统，因为每个粒子都类似于一个平面，不能直接使用uv，可以使用gl_PointCoord
    // gl_PointCoord 表示在 (1, 1) 坐标系内位置的坐标

    // 绘制圆形粒子形状
    // get the distance between gl_PointCoord and the center
    // apply a step function to get 0.0 if the distance is below 0.5, and 1.0 if the distance is above 0.5
    // invert the value

    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    // 使用 1 / x 函数进行透明度衰减，距离中心点越远衰减越多
    // 并将曲线向y轴负方向平移，使得边缘位置的透明度为0（中心点坐标设置为了(0.5, 0.5)）
    float strength = 0.05 / distanceToCenter - 0.05 * 2.0;
//    // strength = step(0.5, strength);
//
//
//    strength = 1.0 - strength;
//
//    // 粒子边缘模糊处理
//    strength = pow(strength, 15.0);
//
//    // 最终颜色，根据明亮度strength，将vColor和黑色混合
//    vec3 color = mix(vec3(0.0), vColor, strength);

    gl_FragColor = vec4(1.0, 1.0, 1.0, strength);
}

