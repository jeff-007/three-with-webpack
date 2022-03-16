precision mediump float;
uniform vec3 uColor;
uniform sampler2D uTexture;

varying float vRandom;
varying vec2 vUv;

void main() {
    vec4 textureColor = texture2D(uTexture, vUv);
    gl_FragColor = textureColor;
//    gl_FragColor = vec4(0.5, vRandom, 1.0, 1.0);
//    gl_FragColor = vec4(uColor, 1.0);
}
