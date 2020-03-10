// ==UserScript==
// @name         csscloud flash 播放器替换
// @namespace    https://home.asec01.net/
// @version      0.3-beta
// @description  将csscloud的flash播放器换为flvjs
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
        zzlog("播放链接:" + u);
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
        console.log("zz csscloud script:\n" + t);
    }

    'use strict';
    console.log("zz csscloud script load");
    var isHttps = 'https:' == document.location.protocol ? true : false;

    var livePlayer = $('#video-middle');
    if (livePlayer.length == 1) {
        //$(livePlayer).html('<iframe src="https://publicfiles.zhangzhe-tech.cn/csscloud-player/player.html?roomid=' + getQueryVariable("roomid") + '" height="100%" width="100%" frameBorder="0"></iframe>');
        $(livePlayer).html('<video id="videoElement" height="100%" width="100%" autoplay controls></video>');
    }
    window.onload = function () {
        zzlog("window.onload");
        var roomId = getQueryVariable("roomid");
        var recordId = getQueryVariable("recordid");
        if (roomId == false) {
            zzlog("参数错误 - 未获取到roomid");
        } else {
            if (recordId == false) {
                zzlog("直播模式");
                playLink('https://stream-ali1.csslcloud.net/src/' + roomId + '.flv', "flv");
            } else {
                zzlog("回放模式")
                var userId = getQueryVariable("userid");
                $.ajax({
                    method: 'GET',
                    url: 'http://view.csslcloud.net/api/vod/v2/play/h5',
                    data: {
                        recordid: recordId,
                        userid: userId
                    },
                    success: function (data) {
                        console.log(data);
                        //var infoObj = JSON.parse(data);
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
        }
    }
})();
