
/*************************************
项目名称：catch fmf
**************************************

[rewrite_local]
^https?:\/\/sealsuite\.bytedance\.com url script-response-body https://raw.githubusercontent.com/tiny1990/tiny1990.github.io/refs/heads/master/catch_cookie.js
[mitm]
hostname = sealsuite.bytedance.com

*************************************/
let requestBody = $request.body || '';
let responseBody = $response.body || '';
let requestHeaders = $request.headers;


console.log('请求头信息:', JSON.stringify(requestHeaders, null, 2));
console.log('Cookie:', requestHeaders['Cookie']);


$done({});
