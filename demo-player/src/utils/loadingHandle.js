export default function loadingHandle (is = true) {
  let online = true;
  if (window.loadingTimer) {
    clearTimeout(window.loadingTimer)
    window.loadingTimer = null
  }

  if( is ) {
    window.MiniApp && window.MiniApp.showLoading({ title: "加载中" });
    window.loadingTimer = setTimeout(() => {
      if (!online) {
        window.MiniApp && window.MiniApp.hideLoading();
        window.MiniApp && window.MiniApp.showToast({ title: '网络错误!', icon: 'error', duration: 1000 });
      }
    }, 1000 * 30);
  } else {
    window.MiniApp && window.MiniApp.hideLoading();
  }
  
  window.addEventListener('offline',  function() {
    online = false;
  });

  window.addEventListener('online',  function() {
    online = true;
  });
}