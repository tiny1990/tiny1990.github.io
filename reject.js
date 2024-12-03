[rewrite_local]
^http://17\.188\.\d{1,3}\.\d{1,3}(/.*)?$ url script-response-body https://raw.githubusercontent.com/tiny1990/tiny1990.github.io/refs/heads/master/reject.js

[mitm]
hostname = 17.188.*.*
*************************************/
let requestBody = $request.body || '';
let responseBody = $response.body || '';
let requestUrl = $request.url;

 console.error('请求失败:', requestBody);

$done({});
