// Quantumult X - event-network
// 当连接到指定 SSID 时：连通性检测 → 若不通则请求 FIX_URL → 再次复检
// 放置位置：作为 “事件脚本(event-network)” 触发
// 依赖：Quantumult X 环境（$task, $notify, $network, $done）

// === 可配项 ===
const TARGET_SSIDS = ["Inspire Creativity-Guest"];  // 需要监听的 Wi-Fi SSID
const TEST_URLS = [
  "http://www.gstatic.com/generate_204"
];
const FIX_URL = "https://example.com/auto-recover"; // 不通时请求的链接
const TEST_TIMEOUT_MS = 5000;
const NOTIFY = true;              // 是否通知
const RETRIES = 1;                // 连通性复检的重试次数（每次不同 URL 轮询）

// === 工具函数 ===
function getSSID() {
  try { return $network && $network.wifi && $network.wifi.ssid || ""; }
  catch (_) { return ""; }
}

async function checkOnce(url) {
  try {
    const r = await $task.fetch({ url, method: "GET", timeout: TEST_TIMEOUT_MS });
    // 返回 204 或 200 视为连通
    return !!(r && (r.statusCode === 204 || r.statusCode === 200));
  } catch (e) {
    return false;
  }
}

async function isOnline() {
  // 轮询 TEST_URLS，只要命中一个即认为“通”
  for (const u of TEST_URLS) {
    if (await checkOnce(u)) return true;
  }
  return false;
}

async function hitFix() {
  try {
    await $task.fetch({ url: FIX_URL, method: "GET", timeout: TEST_TIMEOUT_MS });
  } catch (_) {
    // 忽略 FIX 请求异常
  }
}

// === 主逻辑 ===
(async function main() {
  const ssid = getSSID();
  if (!ssid || !TARGET_SSIDS.includes(ssid)) {
    // 非目标 Wi-Fi，不处理
    return $done();
  }

  // 第一次连通性检测
  let ok = await isOnline();

  if (ok) {
    if (NOTIFY) $notify("Wi-Fi 连通性良好 ✅", ssid, "网络自检通过");
    return $done();
  }

  // 不通 → 触发你的修复链接
  await hitFix();

  // 复检（可配置重试次数）
  for (let i = 0; i <= RETRIES; i++) {
    ok = await isOnline();
    if (ok) break;
  }

  if (NOTIFY) {
    $notify(
      ok ? "已尝试修复并恢复 ✅" : "尝试修复失败 ❌",
      ssid,
      ok ? "触发 FIX_URL 后网络可用" : "FIX_URL 已触发，仍不可用，请手动检查或登录门户"
    );
  }
  $done();
})();
