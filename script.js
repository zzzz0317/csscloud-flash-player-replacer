// ==UserScript==
// @name         csscloud flash 播放器替换
// @namespace    https://home.asec01.net/
// @version      0.4-dev2
// @description  将 csscloud 的 flash 播放器换为 DPlayer
// @author       Zhe Zhang
// @match        http://view.csslcloud.net/api/view/*
// @match        https://view.csslcloud.net/api/view/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/1.9.0/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/flv.js/1.5.0/flv.min.js
// @resource     dPlayerCSS https://cdnjs.cloudflare.com/ajax/libs/dplayer/1.25.0/DPlayer.min.css
// @require      https://cdnjs.cloudflare.com/ajax/libs/dplayer/1.25.0/DPlayer.min.js
// ==/UserScript==
(function () {

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

    function playLive(u) {
        zzlog("playLive播放链接:\n" + u);
        dp = new DPlayer({
            container: document.getElementById('videoElement'),
            autoplay: true,
            live: true,
            danmaku: true,
            video: {
                url: u,
            },
        });
        zzlog("监听聊天框");
        var targetNode = document.getElementById('chat-list');
        var config = {attributes: true, childList: true, subtree: true};
        const mutationCallback = (mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type == "childList") {
                    // console.log("A child node has been added or removed.");
                    var nodeElem = mutation.addedNodes[1];
                    console.log(nodeElem);
                    var innerText = nodeElem.getElementsByClassName("peo-chat")[0].innerText;
                    console.log(innerText);
                    addDanmaku(innerText);
                }
            }
        };
        var observer = new MutationObserver(mutationCallback);
        observer.observe(targetNode, config);
    }

    var danmakuArray = []
    function playLink(u) {
        zzlog("playLink播放链接:\n" + u);
        dp = new DPlayer({
            container: document.getElementById('videoElement'),
            autoplay: true,
            live: false,
            danmaku: true,
            video: {
                url: u,
            },
        });
        // zzlog(danmakuArray);
        setInterval(function(){
            var currentTime = dp.video.currentTime
            var cTime = parseInt(currentTime);
            zzlog("dp.video.currentTime: " + currentTime + "\ncTime: " + cTime);
            danmakuArray.forEach(function(item) {
                //console.log(item);
                if (item.time == cTime){
                    addDanmaku(item.content);
                    var realTimeMsg = {
                        userid: item.userId,
                        username: item.userName,
                        msg: item.content,
                        time: item.time
                    };
                    on_cc_live_chat_msg(realTimeMsg);
                }
            })
            }, 1000);
    }

    function addDanmaku(t){
        const danmaku = {
            text: t,
            color: '#ffffff',
            type: 'right',
        };
        dp.danmaku.draw(danmaku);
    }

    const hijack = (obj, method, fun) => {
        let orig = obj[method]
        obj[method] = fun(orig)
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

    $(document).ready(function () {
        zzlog("Dom加载完成");
        var livePlayer = $('#doc-main');
        if (livePlayer.length == 1) {
            // $(livePlayer).html('<video id="videoElement" height="100%" width="100%" autoplay controls></video>');
            $(livePlayer).html('<div id="videoElement"></div>');
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
            }
        } else {
            zzlog("回放模式");
            GM_addStyle("#doc-main { height: 100%; }");
            var lmb = document.getElementsByClassName("l-m-b")[0];
            lmb.style.display = "none";

            $.ajax({
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
            $.ajax({
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
    })
})();
