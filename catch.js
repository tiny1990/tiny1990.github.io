/*************************************
项目名称：catch respobse
下载地址：a
脚本作者：a
电报频道：a
使用声明：a

**************************************

[rewrite_local]
^https?:\/\/.*binpan.me url script-response-body https://raw.githubusercontent.com/chxm1023/Rewrite/main/mojitianqi.js https://gist.githubusercontent.com/tiny1990/d59e1e1d436700a1ca408b765055405c/raw/cb039d065dfe78cd505bc371406313a1b2986325/gistfile1.txt

[mitm]
hostname = *binpan.me

*************************************/


console.log($response.body);

$done({});
