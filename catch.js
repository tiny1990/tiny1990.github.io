/*************************************
项目名称：catch fmf
**************************************

[rewrite_local]
^https?:\/\/metrics\.icloud\.com/ url script-response-body https://raw.githubusercontent.com/tiny1990/tiny1990.github.io/refs/heads/master/catch.js

[mitm]
hostname = metrics.icloud.com

*************************************/
let requestBody = $request.body || '';
let responseBody = $response.body || '';
// let requestUrl = $request.url;

console.error('request', requestBody);
console.error('response', responseBody);

// // 构造要发送的数据
// let payload = {
//     request: {
//         url: requestUrl,
//         body: requestBody
//     },
//     response: {
//         body: responseBody
//     }
// };

// const request = {
//     url: 'http://pi.binpan.me:18081/body',
//     method: 'POST', // HTTP请求方法
//     headers: {
//         'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(payload)
// };

// let encodedMessage = encodeURIComponent(requestUrl);
// const push = {
//     url: `https://api.day.app/a5Lo8N2zpRrjFUSrtez47a/FMF/${encodedMessage}?group=FMF`,
//     method: 'GET' // HTTP请求方法
// };


// $task.fetch(request).catch(error => {
//     console.error('请求失败:', error);
// });
// $task.fetch(push).catch(error => {
//     console.error('请求失败:', error);
// });

$done({});
