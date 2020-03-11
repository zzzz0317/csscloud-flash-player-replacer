// ==UserScript==
// @name         csscloud flash 播放器替换
// @namespace    https://home.asec01.net/
// @version      0.3-2
// @description  将 csscloud 的 flash 播放器换为 flvjs
// @author       Zhe Zhang
// @match        http://view.csslcloud.net/api/view/*
// @match        https://view.csslcloud.net/api/view/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/flv.js/1.5.0/flv.min.js
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

    function playLink(u, t) {
        zzlog("播放链接:\n" + u);
        if (flvjs.isSupported()) {
            var videoElement = document.getElementById('videoElement');
            var flvPlayer = flvjs.createPlayer({
                type: t,
                url: u
            });
            flvPlayer.attachMediaElement(videoElement);
            flvPlayer.load();
            flvPlayer.play();
        }
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
    zzlog("roomId: " + roomId);
    zzlog("recordId: " + recordId);
    zzlog("isHttps: " + isHttps);

    $(document).ready(function () {
        zzlog("Dom加载完成，替换播放器");
        var livePlayer = $('#doc-main');
        if (livePlayer.length == 1) {
            $(livePlayer).html('<video id="videoElement" height="100%" width="100%" autoplay controls></video>');
        }
        zzlog("替换完成");

        if (recordId == false) {
            if (roomId == false) {
                zzlog("参数错误 - 未获取到roomid和recordId");
            } else {
                zzlog("直播模式");
                playLink('//stream-ali1.csslcloud.net/src/' + roomId + '.flv', "flv");
            }
        } else {
            zzlog("回放模式");
            var userId = getQueryVariable("userid");
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
                    playLink(link, "mp4");
                }
            });
        }
    })
})();
