(() => {
    'use strict';
    
//======================================
// LOAD PROGRAM AFTER CONDITIONS MET
//======================================

/* ----- Do not allow to launch more than once ----- */
if (window.hiveLoaded) {
    alert('The Bee Hive program has already been loaded.');
// customAlert ('The Bee Hive program has already been loaded.  Please buzz on by (Apian language for continue).',
// 'PLEASE NOTE', 'Continue');

/* ----- Launch only from NYT Spelling Bee website ----- */
} else if (document.URL === 'https://www.nytimes.com/puzzles/spelling-bee') {
    fetch('https://raw.githubusercontent.com/PostDoc71/SpellingBeeHelp/main/BeeHive.js').then(r => r.text()).then(t => eval(t))
} else {
    alert('This bookmarklet can only be launched from NYT Spelling Bee main page.');
    // customAlert('This bookmarklet can only be launched from NYT Spelling Bee main page.',
    // 'ATTENTION', 'OK');
}

// function customAlert(text, title, button) {
//     const d = document;
//     if(d.getElementById("modalContainer")) return;

//     let mObj = d.getElementsByTagName("body")[0].appendChild(d.createElement("div"));
//     mObj.id = "modalContainer";
//     mObj.style.height = d.documentElement.scrollHeight + "px";

//     let alertObj = mObj.appendChild(d.createElement("div"));
//     alertObj.id = "alertBox";
//     if(d.all && !window.opera) alertObj.style.top = document.documentElement.scrollTop + "px";
//     alertObj.style.left = (d.documentElement.scrollWidth - alertObj.offsetWidth)/2 + "px";
//     alertObj.style.visiblity="visible";

//     let h1 = alertObj.appendChild(d.createElement("h1"));
//     h1.appendChild(d.createTextNode(title));

//     let msg = alertObj.appendChild(d.createElement("p"));
//     //msg.appendChild(d.createTextNode(text));
//     msg.innerHTML = text;

//     let btn = alertObj.appendChild(d.createElement("a"));
//     btn.id = "closeBtn";
//     btn.appendChild(d.createTextNode(button));
//     btn.href = "#";
//     btn.focus();
//     btn.onclick = function() { removeCustomAlert();return false; }

//     alertObj.style.display = "block";
//     return;
    
//     function removeCustomAlert() {
//         document.getElementsByTagName("body")[0].removeChild(document.getElementById("modalContainer"));
//     }
//  }
})();
