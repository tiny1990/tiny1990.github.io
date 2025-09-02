// wifi_trigger.js
// 注意事项：脚本中如需使用通知等功能，请确保Quantumult X的通知权限已开启

if ($network.wifi.ssid === 'Inspire Creativity-Guest') {
    $notification.post('Wi-Fi连接触发', '已连接到目标Wi-Fi', '正在执行预设操作') // 发送通知（可选）
    // 这里可以添加其他需要执行的命令，例如调用HTTP API、修改变量等
    // 例如：$httpAPI('GET', '/v1/execute/something'); 
} else {
    // 可选：当离开这个Wi-Fi或其他情况时执行的操作
    // console.log("当前Wi-Fi不是目标Wi-Fi或未连接Wi-Fi");
}

$done({});
