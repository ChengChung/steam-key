'use strict';

(function () {

    "use strict";

    var allTexts = {
        'text_panel_tip': '温馨提示：请确保网页使用HTTPS连接以保证您的账号安全！',
        'text_connecting_server': '正在连接服务器...',
        'text_connected_server': '已连接到服务器',
        'text_logging_on': '登录中，请稍候...',
        'text_logged_on': '您已成功登录，Steam名称：',
        'text_logon_failed': '登录失败，原因：',
        "text_input_incorrect": '喵！请输入正确的信息！',
        'text_server_disconnected': '已和服务器断开连接，请刷新本网页',
        'warn_input_authcode': '请重新输入手机或邮箱验证码！',
        'alert_server_disconnected': '已和服务器断开连接！'
    };

    var allErrors = {
        'InvalidPassword': '无效的密码',
        'TwoFactorCodeMismatch': '安全令错误',
        'Limited account': '受限用户暂无法使用',
        'AuthCodeError': '验证码有误'
    };

    if (checkWebSocket()) {
        //alert("Your browser supports WebSocket!");
    } else {
        alert("Your browser doesn't support WebSocket!");
    }

    $('#panel_status').text(allTexts['text_connecting_server']);
    $('.panel-body').text(allTexts['text_panel_tip']);

    var ws = void 0;
    doWebSocket();

    var waitForAuthCode = false;
    var loggedIn = false;

    function checkWebSocket() {
        return 'WebSocket' in window;
    }

    function doWebSocket() {
        var protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        var urlPath = location.pathname;
		var dir = urlPath.substr(0, urlPath.lastIndexOf('/')+1);
        ws = new WebSocket(protocol + '//' + location.host + dir + 'ws');

        ws.onopen = function () {
            setInterval(function () {
                return ws.send(JSON.stringify({ action: 'hello' }));
            }, 30 * 1000);
        };

        ws.onmessage = function (data) {
            var recvData = void 0;
            try {
                recvData = JSON.parse(data.data);
            } catch (err) {
                return;
            }

            if (recvData.action === 'connect') {
                $('#panel_status').text(allTexts['text_connected_server'] + ('(' + recvData.server + ')'));

                $('.form-horizontal').fadeIn();
                return;
            } // recvData.action == connect

            if (recvData.action === 'logOn') {

                $('#buttonLogOn').fadeIn();
                $('.progress').fadeOut();

                if (recvData.result === 'success') {
                    loggedIn = true;
                    waitForAuthCode = false;
                    $('#accountInfo').fadeOut();
                    $('.panel-body').text(allTexts['text_logged_on'] + recvData.detail.name + '，IP地区：' + recvData.detail.country);
                    $('.my-alipay').fadeIn();
                    $('#buttonLogOn').fadeOut();
                } else if (recvData.result === 'failed') {
                    var errMsg = allErrors[recvData.message] || recvData.message;
                    $('.panel-body').text(allTexts['text_logon_failed'] + errMsg);
                    ws.close();
                }
            } // recvData.action == logOn

            else if (recvData.action === 'authCode') {
                $('#form_username').fadeOut();
                $('#form_password').fadeOut();
                $('#form_authcode').fadeIn();
                $('.progress').fadeOut();
                $('#buttonLogOn').fadeIn();
                $('.panel-body').text(allTexts['warn_input_authcode']);

                waitForAuthCode = true;
            } // recvData.action == authCode
        };

        ws.onclose = function () {
            $('#panel_status').text(allTexts['text_server_disconnected']);
            $('.form-horizontal').fadeOut();
        };
    }

    function wsLogon() {
        var username = $('#inputUsername').val().trim();
        var password = $('#inputPassword').val().trim();
        var authcode = $('#inputCode').val().trim();

        if (isBlank(username) || isBlank(password)) {
            $('.panel-body').text(allTexts['text_input_incorrect']);
            return;
        }

        $('#buttonLogOn').fadeOut();
        $('.progress').fadeIn();
        // noinspection JSJQueryEfficiency
        $('.panel-body').text(allTexts['text_logging_on']);

        var data = JSON.stringify({
            action: 'logOn',
            username: username,
            password: password,
            authcode: authcode,
            mode: 'keepOnline'
        });
        ws.send(data);
    }

    function wsAuthCode() {
        var authCode = $('#inputCode').val().trim();

        if (authCode === null || authCode.trim() === '') {
            return;
        }

        ws.send(JSON.stringify({
            action: 'authCode',
            authCode: authCode.trim()
        }));

        $('#buttonLogOn').fadeOut();
        $('#form_authcode').fadeOut();
        $('.progress').fadeIn();
    }

    function isBlank(str) {
        return str.trim() === '';
    }

    $('#buttonLogOn').click(function () {
        if (waitForAuthCode) {
            wsAuthCode();
        } else {
            wsLogon();
        }
    });
})();