precision mediump float;
uniform vec3 uColor;
uniform sampler2D uTexture;

varying float vRandom;
varying vec2 vUv;
varying float vElevation;

void main() {
    vec4 textureColor = texture2D(uTexture, vUv);
//    通过传入的 vElevation 值修改纹理颜色，增加明暗效果
    textureColor.rgb *= vElevation * 2.0 + 0.68;
    gl_FragColor = textureColor;
//    gl_FragColor = vec4(0.5, vRandom, 1.0, 1.0);
//    gl_FragColor = vec4(uColor, 1.0);
}
