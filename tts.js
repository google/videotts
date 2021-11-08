// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function() {
    if (window.toggleVideoTTS) {
        window.toggleVideoTTS();
        return;
    }

    const configMap = {
        "netflix.com": {
            rowEl: ".PlayerControlsNeo__button-control-row",
            buttonCss: "PlayerControls--control-element nfp-button-control",
            captionContainer: ".player-timedtext"
        },
        "youtube.com": {
            rowEl: ".ytp-left-controls",
            buttonCss: "ytp-button",
            captionContainer: ".ytp-caption-window-container"
        },
        "tubitv.com": {
            rowEl: "header .Container",
            buttonCss: "huzxe",
            captionContainer: "#captionsComponent"
        },
        "funimation.com": {
            rowEl: ".video-player-controls__time-stamp",
            buttonCss: "align-center justify-center mx-2",
            captionContainer: ".vjs-text-track-display"
        },
        "rapid-cloud.ru": {
            rowEl: ".jw-button-container",
            buttonCss: "jw-icon jw-icon-inline jw-button-color jw-reset",
            captionContainer: ".jw-captions"
        }
    }

    var rate = 1;
    var pitch = 1;
    var volumeFactor = .1;
    var voiceUri = undefined;

    var getConfig = host => {
        host = host.substring(host.lastIndexOf(".", host.lastIndexOf(".") - 1) + 1);
        return configMap[host];
    }

    function getPageUrl(page) {
        var script = document.currentScript;
        if (!script) {
            var scripts = document.getElementsByTagName('script');
            script = scripts[scripts.length - 1];
        }
        return new URL(page, script.getAttribute('src'));
    };

    var config = getConfig(window.location.host);

    if (!config) {
        // Find iframe
        var matchingFrames = [];
        document.querySelectorAll("iframe").forEach(el => {
            var src = el.getAttribute("src");
            try {
                if (getConfig(new URL(src).host)) {
                    matchingFrames.push(el);
                }
            } catch (e) {
                // Ignore
            }
        });
        if (matchingFrames.length == 1) {
            var el = matchingFrames[0];
            window.open(el.getAttribute("src"));
            el.setAttribute("src", getPageUrl("iframe.html").href);
        } else {
            alert("Script is not supported on " + window.location.host);
        }
        return;
    }

    var $ = function(q) { return document.querySelector(q); }
    var voice = null;
    function loadVoice() {
        voice = window.speechSynthesis.getVoices().filter(v => v.voiceURI == voiceUri)[0];
    }
    loadVoice();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoice);
  
    var buttonRow = $(config.rowEl);
    var disabled = false;
    var button = document.createElement("button");
    button.className = config.buttonCss;
    button.innerText = "Tts";
  
    window.toggleVideoTTS = button.onclick = function() {
        disabled = !disabled;
        applyTTSState();
        button.style.textDecoration = disabled ? "line-through" : "";
    }
    buttonRow.appendChild(button);
  
    function queueText(text) {
        var oldVolume;
        var speech = new SpeechSynthesisUtterance(text);
        speech.rate = rate;
        speech.pitch = pitch;
        speech.voice = voice;
        speech.onstart = function() {
            oldVolume = $("video").volume;
            $("video").volume = oldVolume * volumeFactor;
        }
        speech.onend = function() {
            $("video").volume = oldVolume;
        }
        window.speechSynthesis.speak(speech);
    }
  
    var lastText = "";
  
    // Enable TTS
    var observer = new MutationObserver(function() {
      var text = $(config.captionContainer).innerText;
      if (lastText != text) {
          lastText = text;
          queueText(text);
      }
    });
  
    function applyTTSState() {
        if (disabled) {
            observer.disconnect();
            window.speechSynthesis.cancel();
        } else {
            observer.observe(document, { attributes: false, childList: true, subtree: true });
        }
    }
    applyTTSState();

    // Preference watcher
    var isNumber = value => typeof value === 'number' && isFinite(value);
    function parsePref(pref) {
        var ttsSettings = { };
        try {
            ttsSettings = JSON.parse(pref);
        } catch (e) {
            console.log("Error parsing settings", e);
            ttsSettings = { }
        }
        rate = isNumber(ttsSettings.rate) ? ttsSettings.rate : rate;
        pitch = isNumber(ttsSettings.pitch) ? ttsSettings.pitch : pitch;
        volumeFactor = isNumber(ttsSettings.factor) ? ttsSettings.factor : volumeFactor;
        if (voiceUri != ttsSettings.voice) {
            voiceUri = ttsSettings.voice;
            loadVoice();
        }
    }

    var watcherUrl = getPageUrl("prefwatcher.html");
    var watcher=document.createElement('iframe');
    watcher.setAttribute("height","0");
    watcher.setAttribute("width","0");
    watcher.style.display = "none";
    watcher.src = watcherUrl.href;
    document.body.appendChild(watcher);
    window.addEventListener('message', (event) => {
        if (event.origin == watcherUrl.origin) {
            parsePref(event.data);
        }
    });
})();
