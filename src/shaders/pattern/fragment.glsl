uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;

varying vec2 vUv;
varying float vElevation;

// glsl中没有内置的随机函数，可以通过以下函数实现
float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // mod求余函数
    // float strength = mod(vUv.y * 10.0, 1.0);

    // 避免使用if...else 会影响性能
    // float strength = mod(vUv.y * 10.0, 1.0);
    // strength = step(0.5, strength);

    // float strength = abs(vUv.x - 0.5);

    // 根据波浪高度动态改变波浪顶部和底部颜色
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    gl_FragColor = vec4(color, 1.0);

//    gl_FragColor = vec4(vUv.x * uDepthColor.r, vUv.y * uDepthColor.g,  0.5, 1.0);
}

