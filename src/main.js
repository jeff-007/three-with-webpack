import './css/index.css'

// import './demo/haunted-house'

import './demo/galaxy'


// 全屏操作
const container = document.getElementById('container');
window.addEventListener('dblclick', () => {
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement
  if (!fullscreenElement) {
    container.requestFullscreen() || container.webkitFullscreenElement()
  } else {
    document.exitFullscreen() || document.webkitExitFullscreen()
  }
})
