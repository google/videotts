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

var $ = q => document.querySelector(q);
var synth = window.speechSynthesis;

var code = $("#code-template").innerText.trim();
var voiceMap = { };

function populateVoiceList() {
  var voices = synth.getVoices();

  var sortedGroups = [];
  var voiceGroups = { }
  for(i = 0; i < voices.length ; i++) {
    var v = voices[i];
    if (voiceGroups[v.lang]) {
      voiceGroups[v.lang].push(v);
    } else {
      voiceGroups[v.lang] = [v];
      sortedGroups.push(voiceGroups[v.lang]);
    }
  }

  var voiceSelect = $('select');
  var selectedIndex = voiceSelect.selectedIndex < 0 ? 0 : voiceSelect.selectedIndex;
  voiceSelect.innerHTML = '<option value="null">Default</option>';

  voiceMap = { }
  for(i = 0; i < sortedGroups.length ; i++) {
    var group = sortedGroups[i];
    var optgroup = document.createElement("optgroup");
    optgroup.setAttribute('label', group[0].lang);

    for (j = 0; j < group.length; j++) {
      var option = document.createElement('option');
      option.textContent = group[j].name;
      
      var key = group[j].lang + "::" + group[j].name;
      option.setAttribute('value', key);
      voiceMap[key] = group[j];

      optgroup.appendChild(option);

    }
    voiceSelect.appendChild(optgroup);
  }
  voiceSelect.selectedIndex = selectedIndex;
}
populateVoiceList();
if (synth.onvoiceschanged !== undefined) {
  synth.onvoiceschanged = populateVoiceList;
}

document.querySelectorAll("input[type=range]").forEach(el => {
  el.onchange = el.oninput = e =>  el.parentNode.previousSibling.innerHTML = el.value;
});

function playTts() {
  window.speechSynthesis.cancel();

  var speech = new SpeechSynthesisUtterance($('#sample-text').value);
  speech.rate = parseFloat($('#rate').value);
  speech.pitch = parseFloat($('#pitch').value);
  speech.voice = voiceMap[$('select').value];
  window.speechSynthesis.speak(speech);
}

function updateLink() {
  var link = location.href.substring(0, location.href.lastIndexOf("/")+1) + "/tts.js";
  var rate = parseFloat($('#rate').value);
  var pitch = parseFloat($('#pitch').value);
  var factor = parseFloat($('#volume-factor').value);
  var voice = voiceMap[$('select').value]?.voiceURI;
  var script = `javascript:${code}(${factor},${pitch},${rate},'${voice}');`
  $("#bookmarklet").href = script;
}

document.querySelectorAll("#pitch, #rate, #voice-list").forEach(el =>  el.addEventListener("change", playTts))
document.querySelectorAll("#pitch, #rate, #volume-factor, #voice-list").forEach(el => el.addEventListener("change", updateLink))
updateLink();
