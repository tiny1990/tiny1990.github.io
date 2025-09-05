// === 可配项 ===
const TARGET_SSIDS = ["Inspire Creativity-Guest"];   // 你要监听的 Wi-Fi 名
const TEST_URLS = [
  "http://www.gstatic.com/generate_204"
];
const FIX_URL = "https://example.com/auto-recover"; // 不通时要请求的链接
const TEST_TIMEOUT_MS = 5000;
const NOTIFY = true;                                 // 是否通知

// === 工具函数 ===
function getSSID() {
  try { return $network?.wifi?.ssid || ""; } catch (_) { return ""; }
}
async function checkOnce(url) {
  try {
    const r = await $task.fetch({ url, method: "GET", timeout: TEST_TIMEOUT_MS });
    // 只要能拿到 204 或 200 就认为“通”
    return r && (r.statusCode === 204 || r.statusCode === 200);
  } catch (e) { return false; }
}
async function isOnline() {
  for (const u of TEST_URLS) {
    if (await checkOnce(u)) return true;
  }
  return false;
}
async function hitFix() {
  try { await $task.fetch({ url: FIX_URL, method: "GET", timeout: TEST_TIMEOUT_MS }); }
  catch (_) { /* 忽略 */ }
}

// === 主逻辑 ===
(async () => {
  const ssid = getSSID();
  if (!ssid || !TARGET_SSIDS.includes(ssid)) {
    return $done();
  }

  const ok = await isOnline();
  if (ok) {
    NOTIFY && $notify("Wi-Fi 连通性良好 ✅", ssid, "网络自检通过");
    return $done();
  }

  // 不通 → 触发你的修复链接
  await hitFix();
  // 再复检一次
  const ok2 = await isOnline();
  if (NOTIFY) {
    $notify(
      ok2 ? "已尝试修复并恢复 ✅" : "尝试修复失败 ❌",
      ssid,
      ok2 ? "触发 FIX_URL 后网络可用" : "FIX_URL 已触发，仍不可用，请手动检查"
    );
  }
  $done();
})();
