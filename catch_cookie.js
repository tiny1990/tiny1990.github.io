/*************************************
项目名称：catch fmf
**************************************

[rewrite_local]
^https?:\/\/.*fmfmobile\.icloud\.com(\.cn)?\/ url script-response-body https://raw.githubusercontent.com/tiny1990/tiny1990.github.io/refs/heads/master/catch.js
[mitm]
hostname = *fmfmobile.icloud.com,*fmfmobile.icloud.com.cn

*************************************/
let requestBody = $request.body || '';
let responseBody = $response.body || '';
let requestCookie = $request.cookie;

console.log($request.headers);


$done({});
