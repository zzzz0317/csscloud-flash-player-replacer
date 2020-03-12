// ==UserScript==
// @name         csscloud flash 播放器替换
// @namespace    https://home.asec01.net/
// @version      0.4-dev9
// @description  将 csscloud 的 flash 播放器换为 DPlayer
// @author       Zhe Zhang
// @license      MIT
// @supportURL   https://github.com/zzzz0317/csscloud-flash-player-replacer/
// @icon         https://github.com/zzzz0317/csscloud-flash-player-replacer/raw/master/favicon_csscloud.ico
// @match        http://view.csslcloud.net/api/view/*
// @match        https://view.csslcloud.net/api/view/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/1.9.0/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/flv.js/1.5.0/flv.min.js
// @resource     dPlayerCSS https://cdnjs.cloudflare.com/ajax/libs/dplayer/1.25.0/DPlayer.min.css
// @require      https://cdnjs.cloudflare.com/ajax/libs/dplayer/1.25.0/DPlayer.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/Base64/1.1.0/base64.min.js
// ==/UserScript==

var jq = jQuery.noConflict();

(function () {

    var zzValue = {
        "name": "ZZ 的播放器替换脚本",
        "projectLink": "https://github.com/zzzz0317/csscloud-flash-player-replacer/",
        "mainMsg": "欢迎使用 ZZ 的 csscloud 播放器替换脚本",
        "mainMsgShowTime": 5000
    };

    var playerSettings = {
        'showNameInDanmaku': false
    };

    function readPlayerSettings() {
        var v = GM_getValue('playerSettings');
        if (v != undefined){
            playerSettings = v;
        }else{
            savePlayerSettings();
        }
        // console.log(playerSettings);
    }

    function savePlayerSettings() {
        GM_setValue('playerSettings', playerSettings);
    }

    function setPlayerSettings(item, value) {
        playerSettings[item] = value;
        savePlayerSettings();
    }

    function getQueryVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) {
                return pair[1];
            }
        }
        return (false);
    }

    var dp;
    var dpContextMenu = [
        {
            text: getZZValue("name"),
            link: getZZValue("projectLink"),
        },
        {
            text: '开关弹幕发送者显示',
            click: (player) => {
                setPlayerSettings("showNameInDanmaku", !playerSettings.showNameInDanmaku);
                if(playerSettings.showNameInDanmaku){
                    player.notice("打开弹幕发送者显示")
                }else{
                    player.notice("关闭弹幕发送者显示")
                }
            },
        },
        {
            text: '复制视频链接到剪贴板',
            click: (player) => {
                zzlog("视频链接:\n" + player.options.video.url);
                GM_setClipboard(player.options.video.url);
            },
        },
        {
            text: '输出播放器信息到控制台',
            click: (player) => {
                console.log(player);
            },
        },
        {
            text: '--------------------'
        },
    ];

    function playLive(u) {
        zzlog("监听聊天框");
        var targetNode = document.getElementById('chat-list');
        var config = {attributes: true, childList: true, subtree: true};
        const mutationCallback = (mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type == "childList") {
                    // console.log("A child node has been added or removed.");
                    var nodeElem = mutation.addedNodes[1];
                    console.log(nodeElem);
                    var displayContent = nodeElem.getElementsByClassName("peo-chat")[0].getElementsByClassName("chat-content")[0].innerHTML;
                    if (playerSettings.showNameInDanmaku){
                        var displayName = nodeElem.getElementsByClassName("peo-names")[0].innerText;
                        addDanmaku(displayName + " : " + displayContent);
                    }else{
                        addDanmaku(displayContent);
                    }
                }
            }
        };
        var observer = new MutationObserver(mutationCallback);
        observer.observe(targetNode, config);

        zzlog("playLive播放链接:\n" + u);
        dp = new DPlayer({
            container: document.getElementById('videoElement'),
            autoplay: true,
            live: true,
            volume: 1,
            danmaku: true,
            contextmenu: dpContextMenu,
            apiBackend: {
                read: function (endpoint, callback) {
                    // console.log('Pretend to connect WebSocket');
                    // callback();
                    endpoint.success();
                },
                send: function (endpoint, danmakuData, callback) {
                    observer.disconnect();
                    console.log(endpoint);
                    zzlog("发送弹幕: " + endpoint.data.text);
                    jq("#chatContent").val(endpoint.data.text);
                    sendChatMsg();
                    endpoint.success();
                    setTimeout(function () {
                        observer.observe(targetNode, config);
                    }, 200);
                },
            },
            video: {
                url: u,
            },
        });
        dp.on('pause', function () {
            dp.play();
            dp.notice("直播，请不要暂停", 1000);
        });

        setTimeout(function () {
            var catchFrame = false;

            function readLoop() {
                var maxDelay = 8;
                var catchFrameSpeed = 1.5;
                var currentTime = dp.video.currentTime;
                var bufferedEnd = dp.video.buffered.end(0);
                var bufferedLength = dp.video.buffered.length;
                var delayTime = bufferedEnd - currentTime;
                zzlog("延迟定时检测\n" + "dp.video.currentTime: " + currentTime +
                    "\ndp.video.buffered.end(0): " + bufferedEnd +
                    "\ndp.video.buffered.length: " + bufferedLength);
                if (bufferedLength > 0 && delayTime > maxDelay) {
                    zzlog("延迟" + delayTime + "秒，追帧");
                    dp.speed(catchFrameSpeed);
                    catchFrame = true;
                    setTimeout(function () {
                        dp.speed(1);
                        catchFrame = false;
                        zzlog("追帧完成\n" + "dp.video.currentTime: " + dp.video.currentTime +
                            "\ndp.video.buffered.end(0): " + dp.video.buffered.end(0) +
                            "\ndp.video.buffered.length: " + dp.video.buffered.length);
                    }, (delayTime - 3) * 1000);
                    // dp.video.currentTime = bufferedEnd - 3;
                }
            }

            setInterval(function () {
                if (catchFrame) {
                    zzlog("正在追帧，取消本次追帧检测");
                } else {
                    readLoop();
                }
            }, 10000);

        }, 10000);
        zzWelcomeDanmaku();
    }

    var danmakuArray = [];

    function playLink(u) {
        zzlog("playLink播放链接:\n" + u);
        dp = new DPlayer({
            container: document.getElementById('videoElement'),
            autoplay: true,
            live: false,
            volume: 1,
            danmaku: true,
            contextmenu: dpContextMenu,
            apiBackend: {
                read: function (endpoint, callback) {
                    // console.log('Pretend to connect WebSocket');
                    // callback();
                    endpoint.success();
                },
                send: function (endpoint, danmakuData, callback) {
                    endpoint.success();
                },
            },
            video: {
                url: u,
            },
        });

        function readLoop() {
            var currentTime = dp.video.currentTime;
            var cTime = parseInt(currentTime);
            //zzlog("dp.video.currentTime: " + currentTime + "\ncTime: " + cTime);
            danmakuArray.forEach(function (item) {
                //console.log(item);
                if (item.time == cTime) {
                    if(playerSettings.showNameInDanmaku){
                        addDanmaku(item.userName + " : " + showEm(item.content));
                    }else{
                        addDanmaku(showEm(item.content));
                    }
                    var realTimeMsg = {
                        userid: item.userId,
                        username: item.userName,
                        msg: item.content,
                        time: item.time
                    };
                    on_cc_live_chat_msg(realTimeMsg);
                }
            })
        }

        var readInter;
        dp.on('pause', function () {
            zzlog('播放暂停');
            clearInterval(readInter);
        });
        dp.on('play', function () {
            zzlog('播放');
            readInter = setInterval(function () {
                readLoop()
            }, 1000);
        });
        zzWelcomeDanmaku();
    }

    function addDanmaku(t) {
        const danmaku = {
            text: t,
            color: '#ffffff',
            type: 'right',
        };
        dp.danmaku.draw(danmaku);
    }

    function zzlog(t) {
        console.log("%cZZ csscloud userscript\n%c" + t, "font-weight:bold", "");
    }

    function zzWelcome() {
        console.log("\n" +
            "%cZZ Injected\n" +
            "%c\n欢迎使用 ZZ 的 csscloud 播放器替换脚本\n" +
            "项目主页：https://github.com/zzzz0317/csscloud-flash-player-replacer/\n" +
            "作者主页：https://home.asec01.net/\n", "font-size:20pt", "")
    }

    function zzWelcomeDanmaku() {
        // const danmaku = {
        //     text: "欢迎使用 ZZ 的 csscloud 播放器替换脚本",
        //     color: '#ffffff',
        //     type: 'bottom'
        // };
        // dp.danmaku.opacity(1);
        // dp.danmaku.draw(danmaku);
        dp.notice(getZZValue("mainMsg"), getZZValue("mainMsgShowTime"));
    }

    function refreshZZValue() {
        var v = GM_getValue('zzValue');
        if (v != undefined){
            zzValue = v;
        }
        jq.ajax({
            method: 'GET',
            url: '//www.zhangzhe-tech.cn/copyright-files/csscloud-flash-player-replacer.json',
            data: {
                rand: Math.ceil(Math.random() * 1000)
            },
            success: function (data) {
                console.log(data);
                zzValue = data.data;
                GM_setValue('zzValue', zzValue);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                zzlog("refreshValueError: " + textStatus + " " + jqXHR.status + " " + errorThrown);
            }
        });
    }

    function getZZValue(item) {
        var v = "";
        try {
            v = zzValue[item];
        } catch (err) {
            v = "Unknown value";
            zzlog("getValueError: " + err.description);
        }
        return v;
    }

    'use strict';
    zzWelcome();
    zzlog("初始化");
    var isHttps = 'https:' == document.location.protocol ? true : false;
    var roomId = getQueryVariable("roomid");
    var recordId = getQueryVariable("recordid");
    var liveId = getQueryVariable("liveid");
    var userId = getQueryVariable("userid");
    zzlog("roomId: " + roomId);
    zzlog("recordId: " + recordId);
    zzlog("liveId: " + recordId);
    zzlog("userId: " + userId);
    zzlog("isHttps: " + isHttps);
    readPlayerSettings();
    jq(document).ready(function () {
        zzlog("Dom加载完成");
        var livePlayer = jq('#doc-main');
        if (livePlayer.length == 1) {
            // jq(livePlayer).html('<video id="videoElement" height="100%" width="100%" autoplay controls></video>');
            jq(livePlayer).html('<div id="videoElement"></div>');
        }
        var dPlayerCSS = GM_getResourceText("dPlayerCSS");
        GM_addStyle(dPlayerCSS);
        GM_addStyle(".videoElement { width: 100%; height: 100%; }");
        GM_addStyle(".dplayer { width: 100%; height: 100%; }");
        GM_addStyle(".video-middle { background-color: black; }");

        if (recordId == false) {
            if (roomId == false) {
                zzlog("参数错误 - 未获取到roomid和recordId");
            } else {
                zzlog("直播模式");
                playLive('//stream-ali1.csslcloud.net/src/' + roomId + '.flv');
                // playLive('//cm15-c110-2.play.bokecc.com/flvs/ca/QxIQ5/uv8BibO6WS-90.mp4?t=1583932530&key=2C52134A9753E58590BC88CB8B8525EB&tpl=20&tpt=230');
            }
        } else {
            zzlog("回放模式");
            GM_addStyle("#doc-main { height: 100%; }");
            var lmb = document.getElementsByClassName("l-m-b")[0];
            lmb.style.display = "none";

            jq.ajax({
                method: 'GET',
                url: '//view.csslcloud.net/api/vod/v2/play/h5',
                data: {
                    recordid: recordId,
                    userid: userId
                },
                success: function (data) {
                    //console.log(data);
                    var linkObj = data["video"][0];
                    var link = "";
                    if (isHttps) {
                        link = linkObj["secureplayurl"];
                    } else {
                        link = linkObj["playurl"];
                    }
                    playLink(link);
                }
            });
            jq.ajax({
                method: 'GET',
                url: '//view.csslcloud.net/api/view/replay/chatqa/info',
                data: {
                    roomid: roomId,
                    liveid: liveId,
                    recordid: recordId,
                    userid: userId
                },
                success: function (data) {
                    // console.log(data);
                    danmakuArray = data.datas.meta.chatLog;
                }
            });

        }
    });
    refreshZZValue();
})();
