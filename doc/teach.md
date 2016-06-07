### 学习笔记

#### 前言
因为总是要使用翻译软件，所以准备弄一个chrome插件，方便自己平时使用。

#### 创建原始文件
创建一个文件夹translate, 再在根目录里创建src文件夹，用于存放源代码和资源, 例如icon.png。
然后 创建 manifest.json 来定义程序配置：

```
{  
  "manifest_version": 2,
  "name": "Translate",  
  "version": "0.0.1",  
  "author": "Yves",
  "description": "个人使用的chrome浏览器 翻译插件。",  
  "permissions": [
    "contextMenus",
    "http://api.fanyi.baidu.com/*"
  ],
  "content_scripts": [{
    "matches": ["*://*/*"],
    "css": [
      "/public/css/popup.css"
    ],
    "js": [
      "/public/js/jquery.min.js", 
      "/public/js/md5.js", 
      "/public/js/popup.js"
    ]
  }],
  "browser_action": {  
    "default_icon": "icon.png" ,
    "default_title": "翻译",
    "default_popup": "popup.html"
  }  
} 
```

其中 这部分代码是后面增加的 此时可以删掉

```
"permissions": [
    "contextMenus",
    "http://api.fanyi.baidu.com/*"
  ],
  "content_scripts": [{
    "matches": ["*://*/*"],
    "css": [
      "/public/css/popup.css"
    ],
    "js": [
      "/public/js/jquery.min.js", 
      "/public/js/md5.js", 
      "/public/js/popup.js"
    ]
  }],
```

其中name代表应用程序名，version代表版本号，description代表功能描述。
browser_action代表扩展图标段显示，它会定义图标地址、标题（也就是鼠标悬停提示）和默认的popup页面。
我们这里定义的popup页面为popup.html
然后开发我们的popup.html

```
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <link rel="stylesheet" type="text/css" href="/public/css/popup.css" />
</head>
<body id="popup_body">
    <div id="popup_container">
        <textarea id="from" placeholder="请输入要查询的内容"></textarea>
        <textarea id="to" readonly="readonly"></textarea>
    </div>
    <div id="footer_bar">
        <select id="selectbar">
            <option value="0">自动</option>
            <option value="1">英译汉</option>
            <option value="2">汉译英</option>
        </select>
        <a href="javascript:void(0);" class="trans_btn">翻&nbsp;&nbsp;译</a>
    </div>
</body>
</html>
```

以及css文件 来美化一下我们的页面：

```
#popup_body{min-width:400px;max-width:400px;margin:0;padding:0;background-color:#F9F9F9;-webkit-user-select:none;color:#bbb}
#popup_container{width:100%;height:100%;padding:10px;overflow:hidden}
#popup_container #from,#popup_container #to{float:left;width:184px;height:180px;border:1px solid #ccc;resize:none;outline:0}
#popup_container #from{border-radius:4px 0 0 4px}
#popup_container #to{border:1px solid #eee;border-left:0;background-color:#f0f0f0;border-radius:0 4px 4px 0}
#footer_bar{padding:0 10px 10px}
#footer_bar select{width:100px;background:#4898FC 0 0;color:#fff;font-size:12px;border:#1F82FF 1px solid;height:26px;vertical-align:middle;outline:0}
#footer_bar select:hover{background-color:#3A88F7}
#footer_bar .trans_btn{background-color:#4898FC;border-radius:5px;color:#fff;text-align:center;padding:6px 19px;font-size:12px;outline:0;text-decoration:none;vertical-align:middle;border:#1F82FF 1px solid;float:right;outline:0}
#footer_bar .trans_btn:hover{background-color:#3A88F7}
#footer_bar span{display:inline-block;vertical-align:bottom;margin-left:10px;text-align:right;font-size:12px}
#footer_bar span a{text-decoration:none;-webkit-transition:all .5s;color:#999}
#footer_bar span a:hover{color:#0093D9}
```

当我们这些写完之后，可以先测试一下。
至于如何调样式，可以直接打开html文件调试。

#### 第一次打包
首先打开Chrome-工具-扩展程序，展开开发人员模式，打到 打包扩展程序 按钮。
点击“打包扩展程序…”，弹出打包选择文件窗口，在扩展程序根目标中找到我们建立的文件夹（此处为src文件夹）。
点击确定，它会在根文件夹同一级生成src.crx和src.pem，
src.pem是程序签名文件，以新版本的开发中还需要这个文件，不要删除它。
把src.crx拖进Chrome窗体内，就会把这个应用安装在Chrome里。
如果打包失败，提示你签名文件已存在，那么去 translate 根目录下看一下 是不是crx文件没有创建成功，
然后把pem文件删掉，重新打包即可。

最后 我们就能够在chrome浏览器的右上角看到相应的icon，点击可出现对应的 popup 弹窗界面。

#### 完善功能
首先，前往百度翻译api平台，申请授权 拿到 对应的 appid 和 key，
然后，下载一个js sdk demo 做为一份参考
接着，在src下 将jquery.min.js和md5.js文件 复制到 public/js 下
然后开始写我们的相关代码 popup.js：

```
$(function () {
    var appid = 'your appid';
    var key = 'your key';
    var salt = new Date().getTime();
    var query = '';
    var from = 'auto';
    var to = 'auto';
    //错误对照表
    var errorMsg = {
        '52001': '请求超时, 请重试。',
        '52002': '系统错误, 请重试。',
        '52003': '未授权用户, 请检查您的appid是否正确。',
        '54000': '必填参数为空, 请检查是否少传参数。',
        '58000': '客户端IP非法, 请检查您填写的IP地址是否正确, 可修改您填写的服务器IP地址',
        '54001': '签名错误, 请请检查您的签名生成方法。',
        '54003': '访问频率受限, 请降低您的调用频率。',
        '58001': '译文语言方向不支持, 请检查译文语言是否在语言列表里。',
        '54004': '账户余额不足, 请前往管理控制台为账户充值。',
        '54005': '长query请求频繁, 请请降低长query的发送频率，3s后再试。'
    }
    //语言类型
    var language = {
        0: { from: 'auto', to: 'auto' },
        1: { from: 'auto', to: 'auto' },
        2: { from: 'auto', to: 'auto' }
    };

    $('.trans_btn').click(function () {
        translate($('#from').val(), $('#selectbar').val(), function (data) {
            var _text = '';
            if (data.error_code) {
                _text = errorMsg(_text);
            } else {
                _text = data.trans_result[0].dst;
            }
            $('#to').text(_text);
        });
    });

    //翻译接口
    function translate(query, type, callback) {
        if (query.replace(/\s+/g, '') === '') return;
        from = language[type].from;
        to = language[type].to;
        var str1 = appid + query + salt + key;
        var sign = MD5(str1);

        $.ajax({
            url: 'http://api.fanyi.baidu.com/api/trans/vip/translate',
            type: 'get',
            dataType: 'json',
            data: {
                q: query,
                appid: appid,
                salt: salt,
                from: from,
                to: to,
                sign: sign
            },
            success: function (data) {
                callback(data);
            }
        });
    }
});
```


注意 demo里 请求是 jsonp 的形式，在这里如果要打包成chrome插件的话 千万要改成json形式 否则报错。
因为 chrome不支持外部非https脚本，所以jsonp不可用，但是chrome扩展可以直接跨域，所以直接用json即可
最后 把上面说的 permissions 写入到 manifest.json 中，告知资源所在。

#### 下面 打包 发布 就可以用了
