
/*************************************
项目名称：catch fmf
**************************************/
let requestHeader = $request.headers || '';

$prefs.setValueForKey(requestHeader['Cookie'], "feiCookie");

$done({});
