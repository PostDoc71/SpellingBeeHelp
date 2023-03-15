(() => {
'use strict';

//======================================
// LOAD PROGRAM IF CONDITIONS MET
//======================================

/* ----- Stop if under maintenance ----- */
// const oops = false;
const oops = true;
if (oops) {
    customAlert('Bee Hive temporarily out of order.  Back within an hour.', 'OOPS', 'Continue')

/* ----- Do not allow to launch more than once ----- */
} else if (window.hiveLoaded) {
    customAlert ('The Bee Hive program has already been loaded.  Please buzz on by (Apian-speak for continue).',
    'PLEASE NOTE', 'Continue');

/* ----- Launch only from NYT Spelling Bee website ----- */
} else if (document.URL === 'https://www.nytimes.com/puzzles/spelling-bee') {
    fetch('https://raw.githubusercontent.com/PostDoc71/SpellingBeeHelp/main/BeeHive.js').then(r => r.text()).then(t => eval(t))
} else {
    customAlert('This bookmarklet can only be launched from the NYT Spelling Bee main page.',
    'ATTENTION', 'OK');
}

function customAlert(text, title, button) {
    const d = document;
    if(d.getElementById("modalContainer")) return;

    let mObj = d.getElementsByTagName("body")[0].appendChild(d.createElement("div"));
    mObj.id = "modalContainer";
    mObj.style.height = d.documentElement.scrollHeight + "px";
    mObj.innerHTML = `    <style>
    #modalContainer {
        background-color:rgba(0, 0, 0, 0.15);
        position:absolute;
        width:100%;
        height:100%;
        top:0px;
        left:0px;
        z-index:10000;
        background-image:url(tp.png); /* required by MSIE to prevent actions on lower z-index elements */
    }
    #alertBox {
        position:relative;
        width:300px;
        min-height:100px;
        margin-top:50px;
        border:1px solid #666;
        background-color:#fff;
        background-repeat:no-repeat;
        background-position:20px 30px;
    }
    #modalContainer > #alertBox {
        position:fixed;
    }
    #alertBox h1 {
        margin:0;
        font:bold 1.0em verdana,arial;
        background-color:#3073BB;
        color:#FFF;
        border-bottom:1px solid #000;
        padding:2px 0 2px 5px;
    }
    #alertBox p {
        font:0.8em verdana,arial;
        height:50px;
        padding-left:5px;
        margin-top:7px;
        margin-left:25px;
        margin-right:15px;
    }
    #alertBox #closeBtn {
        display:block;
        position:relative;
        margin:5px auto;
        padding:7px;
        border:0 none;
        width:70px;
        font:0.8em verdana,arial;
        text-align:center;
        color:#FFF;
        background-color:#357EBD;
        border-radius: 3px;
        text-decoration:none;
    }
    </style>`;

    let alertObj = mObj.appendChild(d.createElement("div"));
    alertObj.id = "alertBox";
    if(d.all && !window.opera) alertObj.style.top = document.documentElement.scrollTop + "px";
    alertObj.style.left = (d.documentElement.scrollWidth - alertObj.offsetWidth)/2 + "px";
    alertObj.style.visiblity="visible";

    let h1 = alertObj.appendChild(d.createElement("h1"));
    h1.appendChild(d.createTextNode(title));

    let msg = alertObj.appendChild(d.createElement("p"));
    //msg.appendChild(d.createTextNode(text));
    msg.innerHTML = text;

    let btn = alertObj.appendChild(d.createElement("a"));
    btn.id = "closeBtn";
    btn.appendChild(d.createTextNode(button));
    btn.href = "#";
    btn.focus();
    btn.onclick = function() { removeCustomAlert();return false; }

    alertObj.style.display = "block";
    return;
    
    function removeCustomAlert() {
        document.getElementsByTagName("body")[0].removeChild(document.getElementById("modalContainer"));
    }
}

//======================================
// HIT COUNTER at bottom right corner
//======================================

const counterObj = document.getElementsByTagName("body")[0].appendChild(document.createElement("div"));
counterObj.innerHTML = `<div align='right' class="bh-counter">
<a href='https://www.free-website-hit-counter.com'>
<img src='https://www.free-website-hit-counter.com/c.php?d=5&id=146729&s=55' border='0' alt='Free Website Hit Counter'>
</a><br / >
<small><a href='https://www.free-website-hit-counter.com' title="Free Website Hit Counter">Free website hit counter</a></small>
</div>
<style>
.bh-counter {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 80%;
    opacity: calc(15%);
}
</style>
`;

})();
