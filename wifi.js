// Quantumult X - event-network
// 触发：网络切换（蜂窝<->Wi-Fi，Wi-Fi SSID 变化等）
// 用法：把要执行的动作写进 runWhenConnected()

const TARGET_SSIDS = ["Inspire Creativity-Guest"];
const LAST_KEY = "qx_last_wifi_ssid";

(function main() {
  // Quantumult X 在事件脚本里提供 $network
  const net = $network || {};
  const isWiFi = !!net.wifi;
  const ssid = (net.ssid || "").trim();

  if (!isWiFi || !ssid) {
    // 从 Wi-Fi 断开或未知 SSID
    $notify("ℹ️ 网络变化", "", `当前非 Wi-Fi 或未知 SSID：${ssid || "N/A"}`);
    $prefs.setValueForKey("", LAST_KEY);
    return $done();
  }
  console.log(ssid);
  
  // 命中白名单才执行
  if (!TARGET_SSIDS.includes(ssid)) {
    console.log("[wifi_auto] SSID not in whitelist:", ssid);
    $prefs.setValueForKey(ssid, LAST_KEY); // 记录一下，避免来回抖动
    return $done();
  }

 $done();
})();
