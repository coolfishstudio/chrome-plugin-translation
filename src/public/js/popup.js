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
            dataType: 'jsonp',
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