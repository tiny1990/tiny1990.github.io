// Quantumult X - event-network
// 触发：网络切换（蜂窝<->Wi-Fi，Wi-Fi SSID 变化等）
// 用法：把要执行的动作写进 runWhenConnected()

const TARGET_SSIDS = ["Inspire Creativity-Guest"];
const LAST_KEY = "qx_last_wifi_ssid";

async function runWhenConnected(ssid) {
  // 示例 1：弹通知
  $notify("✅ 已连接指定 Wi-Fi", ssid, "开始执行自动任务…");

  // 示例 2：设置一个偏好值，供其它脚本读取
  $prefs.setValueForKey("connected", "wifi_profile_" + ssid);

  // 示例 3：发起一个内部请求（比如唤起家里 NAS / 刷个授权）
  try {
    const r = await $task.fetch({
      url: "http://192.168.1.2:8080/wakeup?from=quantumultx&ssid=" + encodeURIComponent(ssid),
      method: "GET",
      timeout: 8
    });
    console.log("[wifi_auto] fetch resp:", r.statusCode, (r.body || "").slice(0, 200));
  } catch (e) {
    console.log("[wifi_auto] fetch error:", e);
  }

  // TODO: 把你要执行的更多 JS 放在这里（改偏好、打 API、写日志等）
}

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

  // 去抖：同 SSID 不重复执行
  const last = $prefs.valueForKey(LAST_KEY) || "";
  if (last === ssid) {
    console.log("[wifi_auto] same SSID, skip:", ssid);
    return $done();
  }

  // 命中白名单才执行
  if (!TARGET_SSIDS.includes(ssid)) {
    console.log("[wifi_auto] SSID not in whitelist:", ssid);
    $prefs.setValueForKey(ssid, LAST_KEY); // 记录一下，避免来回抖动
    return $done();
  }

  // 记录当前 SSID 并执行任务
  $prefs.setValueForKey(ssid, LAST_KEY);
  Promise.resolve(runWhenConnected(ssid))
    .finally(() => $done());
})();
