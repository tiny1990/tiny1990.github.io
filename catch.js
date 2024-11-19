/*************************************
项目名称：catch respobse
**************************************

[rewrite_local]
^https?:\/\/.*binpan.me\/assets\/search_data\.json url script-response-body https://raw.githubusercontent.com/tiny1990/tiny1990.github.io/refs/heads/master/catch.js

[mitm]
hostname = *binpan.me

*************************************/
let requestBody = $request.body || '';
let responseBody = $response.body || '';

// 构造要发送的数据
let payload = {
    request: {
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
