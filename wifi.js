(function main() {
  console.log("test");
  runWhenConnected("aaa");
  // ==============================

  $done();
})();

// 在这里定义你想执行的动作
function runWhenConnected(ssid) {
  // 例如发送通知
  $notify("已连接到指定 Wi-Fi", "", `SSID: ${ssid}`);
  // 这里可以写任何你需要的逻辑
}
