/*************************************
项目名称：catch cookie
**************************************

[rewrite_local]
^https://sealsuite\.bytedance\.com url script-response-body https://raw.githubusercontent.com/tiny1990/tiny1990.github.io/refs/heads/master/catch_cookie.js
[mitm]
hostname = sealsuite.bytedance.com

*************************************/
console.log("FM数据捕获成功：" + timestamp);

$done({});
