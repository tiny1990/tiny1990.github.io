/*************************************
项目名称：catch respobse
下载地址：a
脚本作者：a
电报频道：a
使用声明：a

**************************************

[rewrite_local]
^https?:\/\/.*binpan.me url script-response-body https://raw.githubusercontent.com/tiny1990/tiny1990.github.io/refs/heads/master/catch.js

[mitm]
hostname = *binpan.me

*************************************/


console.log($response.body);

$done({});
