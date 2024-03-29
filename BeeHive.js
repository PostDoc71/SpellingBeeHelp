'use strict';

(async () => {            // OUTER SHELL

    if (window.hiveLoaded) return;                  // Do not allow to launch more than once
    window.hiveLoaded = true;

    /* ----- Do not launch while on Welcome or Queen Bee pages ----- */
    await waitForCondition(
        document.getElementById('js-hook-pz-moment__welcome'),      // Welcome page
        document.getElementById('js-hook-pz-moment__congrats')      // Queen Bee page
    );
    function waitForCondition(welcome, queenBee) {
        return new Promise(resolveElement => {
            const checkForCondition = () => {           // both frames invisible
                if (welcome.clientHeight + queenBee.clientHeight === 0) {
                    resolveElement(true);
                } else {
                    setTimeout(checkForCondition, 10);
                }
            };
            checkForCondition();
        });
    }

    //======================================
    // MAIN CONSTANTS AND VARIABLES
    //======================================

    // System data
    const hintDiv = setUpHintDiv();             // initialize DOM
    const HintsHTML = await getHints();         // data from Spelling Bee page

    // Settings
    let ShowChar3 = false;                      // toggle: show 3-character hints
    let ShowBlankCells = false;                 // toggle: show/hide empty data cells           
    let ShowRemaining = false;                  // toggle: show remaining vs found words
    let SubTotalsAtTop = false;                 // toggle: placement of subtotal line
    let HideHints = false;                      // toggle: make hints invisible
    let SaveSetting = false;                    // toggle: save settings in cookies

    // Elements
    const El = {    
        MetaStats1: document.getElementById('metastats1'),
        MetaStats2: document.getElementById('metastats2'),
        MetaStats3: document.getElementById('metastats3'),
        MetaStats4: document.getElementById('metastats4'),
        TableHeader: document.getElementById('header'),
        Legend: document.getElementById('legend'),
        ContainerTables: document.getElementById('tablescontainer'),
        Table0: document.getElementById('table0'),
        Table1: document.getElementById('table1'),
        ContainerCheckbox: document.getElementById('checkboxcontainer'),
        Char3Container: document.getElementById('char3container'),
        ContainerT0Checkbox: document.getElementById('t0checkboxcontainer'),
        ShowChar3: document.getElementById('char3'),
        ShowBlankCells: document.getElementById('hideEmptyCells'),
        ShowRemaining: document.getElementById('showRemaining'),
        SubTotalsAtTop: document.getElementById('subTotalsAtTop'),
        HideHintsButton: document.getElementById('bh-hideHints'),
        SaveSettings: document.getElementById('saveSettings'),
        bhShare: document.getElementById('bh-share'),
        WordList: document.querySelector('.sb-wordlist-items-pag'),
        WelcomePage: document.querySelector('.pz-moment__button.primary'),
        QueenBeePage: document.getElementById('js-hook-pz-moment__congrats'),
     }

    // Table data
    let tblPtrObj = {           // Pointers into Table0 for each Char1 group
        rowHeader: 0,           // header row
        rowTotal: 0,            // total words in each column
        rowFound: 0,            // words found on each column
        rowStartData: 0,        // letter subtotals (in gray)
        rowEndData: 0,
        rowEndChar1: 0,         // last line
        total: 0,               // total number of words
        found: 0,               // found words
        sums() {
            for (let col = ColStart - 2; col <= ColEnd; col++) {  // summate columns
                if (col == ColStart - 1) continue;
                let sum = 0;
                for (let row = this.rowStartData; row <= this.rowEndData; row++) {
                    sum += Table[row][col];
                }
                Table[this.rowFound][col] = sum;
            }
            for (let row = this.rowStartData; row <= this.rowEndData; row++) {    //summate rows
                let sum = 0;
                for (let col = ColStart; col <= ColEnd; col++) {
                    sum += Table[row][col];
                }
                Table[row][2] = sum;
            }
            let row = this.rowFound;
            let sum = 0;
            for (let col = ColStart; col <= ColEnd; col++) {
                sum += Table[row][col];
            }
            Table[row][2] = sum;
        },
    };
    let Table = [];             // Main Table0 array
    let TablePtrs = [];         // Pointers into Table0
    let Char2Row = {};          // hash table: Char2 -> row
    const ColStart = 4;         // table data
    let ColEnd = 0;
    let ColIndex = [0, 0, 0, 3];
    let TableTotalRows = 0;
    let Cell = [];              // element references for Table0
    let Cell1 = [];             // element refs for Table1

    // Metastats
    let WordsTotal = 0;
    let WordsFound = 0;
    let PangramsTotal = 0;
    let PangramsFound = 0;
    let TotalPoints = 0;
    let GeniusScore = 0;

    let Char3Score = 0;
    
    // Words data
    let LetterList = "";        // needed to find pangrams
    let ProcessedWords = [];    // list of already tabulated words
    let RemainingWords = window.gameData.today.answers.map(x => x.toUpperCase()).sort();

//======================================
// MAIN PROGRAM
//======================================

    /* ----- Retrieve saved settings ----- */
    RetrieveSavedSettings();

    /* ----- Insert our HTML and data into Spelling Bee ----- */
    InitializeHints ();

    /* ----- Detect addition to Word List ----- */
    //       main activity during game play
    const observeWordList = new MutationObserver(() => {
        UpdateList();
    });
    observeWordList.observe(El.WordList, {childList: true});

    /* ----- Toggle showing 3-character hints ----- */
    El.ShowChar3.addEventListener('click', ToggleChar3);

    /* ----- Toggle hiding blank cells ----- */
    El.ShowBlankCells.addEventListener('click', ToggleHiddenCells);

    /* ----- Toggle remaining vs found words ----- */
    El.ShowRemaining.addEventListener('click', ToggleFoundRemaining);

    /* ----- Toggle placement of subtotal line ----- */
    El.SubTotalsAtTop.addEventListener('click', ToggleSubtotals);

    /* ----- Toggle hiding hints ----- */
    El.HideHintsButton.addEventListener('click', ToggleHints);

    /* ----- Toggle saving settings ----- */
    El.SaveSettings.addEventListener('click', ToggleSaveSettings);

    /* ----- Share this program ----- */
    El.bhShare.onclick = function() {
        window.open("https://postdoc71.github.io/SpellingBeeHelp/index.html",
        "bhWin", "top=50,left=100,width=750,height=650,scrollbars=yes,resizable=yes,toolbar=yes");
        return;
    }

    /* ----- Detect Queen Bee page pop-up ----- */
    //       and hide Bee Hive display
    const observeQBPage = new MutationObserver(() => {
        HideOnQBPopup();
    });
    observeQBPage.observe(El.QueenBeePage, {attributes: true});

//======================================
// SYSTEM DATA/FUNCTIONS
//======================================
  
    /* ----- Create DOM for Bee Hive HTML ----- */
    function setUpHintDiv() {
        const HTMLcontent = `
        <table>
            <td id="metastats1">Total points:&nbsp<br>Total words:&nbsp<br>Words Found:&nbsp</td>
            <td id="metastats2"></td>
            <td id="metastats3">Genius level:&nbsp<br>Total pangrams:&nbsp<br>Pangrams Found:&nbsp</td>
            <td id="metastats4"></td>
        </table>
        <br><table id="header"><tr>
            <td id="legend">Σ = <font color="mediumvioletred"><b>TOTAL words</b>
            <font color="black">&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp# = <b>FOUND words</b></td>
            </tr></table>
        <div id="tablescontainer">
            <table id="table0"></table><br>
            <table id="table1" hidden></table>
        </div>
        <div id="checkboxcontainer">
            <p id="char3container" class="inputs"><input id="char3" class="bh-hover" type="checkbox">&nbspHelp! - show 3-letter hints</input></p>
            <div id="t0checkboxcontainer">
                <p class="inputs"><input id="hideEmptyCells" class="bh-hover" type="checkbox">&nbsp* Show completed rows and columns</input></p>
                <p class="inputs"><input id="showRemaining" class="bh-hover" type="checkbox">&nbsp* Show number of words remaining</input></p>
                <p class="inputs"><input id="subTotalsAtTop" class="bh-hover" type="checkbox">&nbsp* Place subtotal line above letter tallies</input></p>
            </div>
        </div>
        <p class="inputs"><input id="bh-hideHints" class="bh-hover" type="checkbox">&nbsp* Hide hints</input></p>
        <p class="inputs"><input id="saveSettings" class="bh-hover" type="checkbox">&nbspSave * settings</input></p>
        <p class="inputs" style="margin-top: 3px"><button id="bh-defineBtn" class="bh-hover">Definitions</button></p>
        <p class="inputs" style="margin-top: 3px"><button id="bh-share" class="bh-hover">Share this program</button></p>
        <p class="inputs" id="bh-button"><br>Bee Hive Release 1.27<br><br></p>
        <div align='center' id="bh-counter" hidden>
            <a href='https://www.free-website-hit-counter.com'>
                <img src='https://www.free-website-hit-counter.com/c.php?d=5&id=146730&s=36' border='0' alt='Free Website Hit Counter'>
            </a><br / >
            <small><a href='https://www.free-website-hit-counter.com' title="Free Website Hit Counter">Free website hit counter</a></small>
        </div>
        <div id="bh-myModal" class="bh-modal">
            <div class="bh-modal-content">
                <div class="bh-modal-header">
                    <dl>    
                        <dt>&nbsp;Define<span class="bh-close bh-modal-item">&times;</span></dt>
                        <dt>&nbsp;</dt>
                    </dl>
                </div>
                <div id="bh-modal-list" style="border-top-style: 1px solid black;"></div>
            </div>
        </div>
        <style>
            #metastats1 {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 90%;
                width: 16ch;
                margin-left: 1ch;
                text-align: right;
            }
            #metastats2 {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 90%;
                text-align: right;
            }
            #metastats3 {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 90%;
                width: 21ch;
                margin-left: 1ch;
                text-align: right;
            }
            #metastats4 {
                font-family: Arial, Helvetica, sans-serif;
                margin-left: 1ch;
                font-size: 90%;
                text-align: left;
                width: 14ch;
            }
            #header td {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 90%;
            }
            #table0 {
                font-family: Arial, Helvetica, sans-serif;
                font-size: medium;
            }
            #table0 td {
                height: 1ch;
                width: 3ch;
                margin-left: 2ch;
                margin-right: 2ch;
                text-align: center;
                font-family: Arial, Helvetica, sans-serif;
                font-size: 90%;
            }
            #table1 {
                margin-left: 5ch;
                font-family: Arial, Helvetica, sans-serif;
                font-size: medium;
            }
            #table1 td {
                font-family: Arial, Helvetica, sans-serif;
                text-align: center;
                font-size: 90%;
                margin-left: 2ch;
                margin-right: 2ch;
            }
            .inputs {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 90%;
            }
            #bh-counter {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 80%;
                opacity: calc(30%);
            }
            .bh-hover:hover,
            .bh-hover:focus {
                background-color: gainsboro;
                text-decoration: none;
                cursor: pointer;
            }
            
            /* DICTIONARY Modal background */
            .bh-modal {
                display: none; /* Hidden by default */
                position: fixed; /* Stay in place */
                z-index: 99; /* Sit on top */
                padding-top: 60px; /* Location of the box */
                padding-right: 0px;
                left: 0;
                top: 0;
                width: 100%; /* Full width */
                height: 100%; /* Full height */
                overflow: auto; /* Enable scroll if needed */
                background-color: rgba(250,250,250,0.85); /* Black w/ opacity */
                font-size: 90%;
            }
            /* Modal Content */
            .bh-modal-content {
                background-color: rgb(255, 221, 0);
                margin-right: 0px;
                right: 0;
                padding: 7px;
                border: 2px solid #888;
                width: 18ch;
                float: right;
                overflow: auto;
            }
            
            /* Modal list items */
            .bh-modal-header {
                font-size: 16px;
                font-weight: bold;
                border-bottom-style: 2px solid;
            }
            .bh-modal-item:hover,
            .bh-modal-item:focus {
                background-color: beige;
                text-decoration: none;
                cursor: pointer;
            }
        
            /* The Close Button */
            .bh-close {
                color: DarkBlue;
                float: right;
                font-size: 28px;
                font-weight: bold;
            }
        </style>
        `;
        let gameScreen;
        gameScreen = document.getElementById('js-hook-pz-moment__game');
        const parent = gameScreen.parentElement;
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.append(gameScreen);
        parent.append(container);

        const hintDiv = document.createElement('div');
        hintDiv.style.padding = '10px';
        container.append(hintDiv);

        // Bee Hive HTML
        hintDiv.innerHTML = HTMLcontent;
        return hintDiv;
    }

    /* ----- Open Today's Hints page for data ----- */
    async function getHints() { 
        const hintsUrl = 'https://www.nytimes.com/' +
        window.gameData.today.printDate.replaceAll('-', '/') +
            '/crosswords/spelling-bee-forum.html';
        const hints = await fetch(hintsUrl).then(response => response.text()).then(html => {
            const div = document.createElement('div');
            div.innerHTML = html;                                       // translates string to DOM
            return div.querySelector('.interactive-body > div');
        });
        return hints;
    }

    /* ----- Open Rankings pop-up for GeniusScore ----- */
    async function getGeniusScore() {
        [...document.querySelectorAll(".pz-dropdown__button")][0].click();
        const dropDownList = await waitForElement('.pz-dropdown__list');
        [...document.querySelectorAll(".pz-dropdown__button")][2].click();
        const modalBody = await waitForElement('.sb-modal-body');
        const geniusElement =       // menus for logged-in and logged-out
            modalBody.querySelectorAll('.sb-modal-ranks__rank-points')[1];
            // || document.querySelector('.sb-modal-list li:last-of-type');
        let score = +geniusElement?.innerText.replace(/\D/g, '');
        alert(score);;
        document.querySelector('.sb-modal-close').click(); 
        return score;
        
        function waitForElement(selector) {
            return new Promise(resolveElement => {
                const checkForElement = () => {
                    let element = document.querySelector(selector);
                    if (element) {
                        resolveElement(element);
                    } else {
                        setTimeout(checkForElement, 10);
                    }
                };
                checkForElement();
            });
        }
    }

    /* ----- Saved Settings ----- */
    function RetrieveSavedSettings () {
        let setting = getSavedSetting(localStorage.beehiveSetting);
        if (setting) { 
            let blank = getSavedSetting(localStorage.beehiveBlank);
            let remain = getSavedSetting(localStorage.beehiveRemaining);
            let subTot = getSavedSetting(localStorage.beehiveSubtotal);
            let hideHint = getSavedSetting(localStorage.beehiveHideHints);
            El.SaveSettings.click();
            ToggleSaveSettings();
            if (blank) {
                El.ShowBlankCells.click();
                ToggleHiddenCells();
                localStorage.beehiveBlank = "true";
            } else {
                localStorage.beehiveBlank = "false";
            }
            if (remain) {
                El.ShowRemaining.click();
                ToggleFoundRemaining();
                localStorage.beehiveRemaining= "true";
            } else {
                localStorage.beehiveRemaining = "false";
            }
            if (subTot) {
                El.SubTotalsAtTop.click();
                SubTotalsAtTop = true;
                localStorage.beehiveSubtotal = "true";
            } else {
                localStorage.beehiveSubtotal = "false";
            }
            if (hideHint) {
                El.HideHintsButton.click();
                ToggleHints();
                localStorage.beehiveHideHints = "true";
            } else {
                localStorage.beehiveHideHints = "false";
            }
         } else {
            localStorage.beehiveBlank = "false";
            localStorage.beehiveRemaining = "false";
            localStorage.beehiveSubtotal = "false";
            localStorage.beehiveHideHints = "false";
            localStorage.beehiveSetting = "false";
         }
        return;
    }

    function getSavedSetting (setting) {
        if (setting == "true") return true;
        else return false;
    }
//======================================
// MAIN SUPPORTING FUNCTIONS: INITIALIZE HINTS/TABLES
//======================================

    // Read HINTS page and generate all tables/lists
    async function InitializeHints () {
        let temp;
        let wordLengths = [];       // word lengths, appended to header
        const paragraphs  = HintsHTML.querySelectorAll('p');

        // MetaStats (permanent)
        LetterList = paragraphs[1].textContent.replace(/\s/g, '').toUpperCase();
        temp = paragraphs[2].textContent.split(/[^0-9]+/);
            WordsTotal = +temp[1];
            TotalPoints = +temp[2];
            PangramsTotal = temp[3];
            GeniusScore = await getGeniusScore();
            Char3Score = ((TotalPoints - GeniusScore) * .25) + GeniusScore;
            alert(GeniusScore); alert(Char3Score);
            if (temp[4] > 0) PangramsTotal = PangramsTotal + ' (' + temp[4] + ' Perfect)';
            
        // char1Table (temporary data)
        let char1Table = [...HintsHTML.querySelectorAll('table tr')]
            .map(tr => [...tr.querySelectorAll('td')].map(x => x.textContent));  // ... convert iterable to array
        temp = char1Table[0].slice(1, -1).map(x => Number(x));
        for (let i = 0; i < temp.length; i++ ) wordLengths.push(temp[i]);
        char1Table.pop();                               // eliminate first and last rows
        char1Table.shift();
        char1Table.forEach(item => {
            item[0] = item[0][0].toUpperCase();
            for (let i = 1; i < item.length; i++) {     // convert '-' to '0'
                if (item[i] === '-') {item[i] = 0}
                else {item[i] = +item[i]};
            }
        })

        // char2Table (temporary data)
        let char2Table = [];                        // char2Table (temporary data)
        let char2Raw = paragraphs[4].textContent.split(/[^A-Za-z0-9]+/);
        let index = 1;
        let temp1 = [];
        let char = char2Raw[index][0];
        while (char2Raw[index] != '') {
            char2Raw[index] = char2Raw[index].toUpperCase();
            temp1.push(char2Raw[index]);
            temp1.push(+char2Raw[index + 1]);
            index += 2;
            if (char2Raw[index][0] != char) {
                char2Table.push(temp1);
                char = char2Raw[index][0];
                temp1 = [];
            }
        }

        // Header and Spacer row templates
        ColEnd = wordLengths.length + 3;
        let header = ['', '', '', ''];
        wordLengths.forEach(item => header.push(item));
        let spacer = ['', '', '', '',];
        spacer.length = ColEnd + 1;
        spacer.fill('', 4, ColEnd + 1);
        for (let i = 4; i < wordLengths.length + 4; i++) {  // ColIndex accounts for empty columns
            ColIndex[wordLengths[i - 4]] = i;
        }

       // Create Table, TablePtrs, Char2Row (permanent data)
        CreateTableData(char1Table, char2Table, header, spacer);
        CreateElTable0();
        FormatTable0();
        CreateElTable1();

        UpdateList();
        return;
    }

    // Permanent data: Table, TablePtrs, Char2Row 
    function CreateTableData (char1Table, char2Table, header, spacer) {
        let temp;
        let ch2Tally = 0;           // tally Char2 rows
        let indx = 0;               // iterates through TablePtrs and char1Table/char2Table
        let row = 3;
        for (let i = 0; i < char1Table.length; i++) {     // iterate over each char1Table row
            TablePtrs[indx] = Object.assign({}, tblPtrObj);      // Spacers and header
            TablePtrs[indx].total = Number(char1Table[indx][char1Table[indx].length - 1]);
            Table.push(spacer);
            Table.push(spacer);
            Table.push(header);
            TablePtrs[indx].rowHeader = row - 1;

            temp = ['', 'Σ', '#', 'Σ>'];                // Section stats line (rowTotal)
            temp.length = ColEnd + 1;
            for (let j = 4; j <=  ColEnd; j++) {
                temp[j] = char1Table[indx][j - 3];
            }
            Table.push(temp);
            TablePtrs[indx].rowTotal = row;
            row++;

            if (SubTotalsAtTop) {                       // TablePtrs.rowFound
                temp = ['Σ', TablePtrs[indx].total, 0, '#>'];
                temp.length = ColEnd + 1;
                Table.push(temp);
                TablePtrs[indx].rowFound = row;
                row++;
            }

            TablePtrs[indx].rowStartData = row;          // Char2 lines
            for (let j = 0; j < char2Table[indx].length; j++) {
                Char2Row[char2Table[indx][j]] = row;
                temp = [char2Table[indx][j], char2Table[indx][j + 1], 0, '#>'];
                Table.push(temp);
                ch2Tally++;
                row++;
                j++;
            }
            TablePtrs[indx].rowEndData = row -1;

            if (!SubTotalsAtTop) {                      // TablePtrs.rowFound
                temp = ['Σ', TablePtrs[indx].total, 0, '#>'];
                temp.length = ColEnd + 1;
                Table.push(temp);
                TablePtrs[indx].rowFound = row;
                row++;
            }

            TablePtrs[i].rowEndChar1 = row - 1;         // end of section

            // zero out tally area
            for (let row = TablePtrs[i].rowStartData; row <= TablePtrs[i].rowEndData; row++) {
                for (let col = ColStart; col <= ColEnd; col++) {
                    Table[row][col] = 0;
                }
            }

            row +=3;
            indx++;
        }

        Table.push(spacer);         // terminal line

        TableTotalRows = ch2Tally + (TablePtrs.length * 5) + 1;
        return;
    }

    function  CreateElTable0() {
        for (let y = 0; y < TableTotalRows; y++) {
            let rowObj = [];
            let rowEl = document.createElement('tr');
            for (let x = 0; x <= ColEnd; x++) {
                let cellEl = document.createElement('td');
                rowObj.push({element: cellEl});
                rowEl.appendChild(cellEl);
            }
            Cell.push(rowObj);
            El.Table0.appendChild(rowEl);
        }
        return;
    }
    
    function FormatTable0() {
        let row;
        TablePtrs.forEach(item => {
            row = item.rowTotal;
            for (let col = ColStart; col <= ColEnd; col++) {        // Total words
                Cell[row][col].element.style.color = 'mediumvioletred';
                Cell[row][col].element.style.fontWeight = 'bold';
            }
            row = item.rowFound;
            for (let col = ColStart; col <= ColEnd; col++) {        // Found words
                Cell[row][col].element.style.fontWeight = 'bold';
            }
                                                                    // Total & Found columns
            for (let row = item.rowStartData; row <= item.rowEndData; row++) {
                Cell[row][1].element.style.color = 'mediumvioletred';
                Cell[row][1].element.style.fontWeight = 'bold';
                Cell[row][2].element.style.fontWeight = 'bold';
            }
            Cell[item.rowFound][1].element.style.color = 'mediumvioletred';
            Cell[item.rowFound][1].element.style.fontWeight = 'bold';
            Cell[item.rowFound][2].element.style.fontWeight = 'bold';
                                                                    // center of table to gray
            for (let row = item.rowStartData; row <= item.rowEndData; row++) {
                for (let col = ColStart; col <= ColEnd; col++) {
                    Cell[row][col].element.style.backgroundColor = "whitesmoke";
                }
            }
            row = item.rowHeader - 2;                               // line zw sections, at top
            for (let col = 0; col <= ColEnd; col++) {
                Cell[row][col].element.style.borderBottom = "1px solid black";
            }
        })
        for (let col = 0; col <= ColEnd; col++) {                   // line at bottom of table
            Cell[TableTotalRows - 1][col].element.style.borderBottom = "1px solid black";
        }
        return;
    }

    function CreateElTable1() {
        for (let y = 0; y < 5; y++) {
            let rowObj = [];
            let rowEl = document.createElement('tr');
            for (let x = 0; x < 3; x++) {
                let cellEl = document.createElement('td');
                rowObj.push({element: cellEl});
                rowEl.appendChild(cellEl);
            }    
            Cell1.push(rowObj);
            El.Table1.appendChild(rowEl);
        }    
        El.Char3Container.setAttribute("hidden", '');
        Cell1[1][0].element.innerHTML = `Hint`;
        Cell1[1][0].element.style.borderBottom = "1px solid black";
        Cell1[1][1].element.innerHTML = `&nbsp&nbsp&nbsp`;
        Cell1[1][2].element.innerHTML = `Length`;
        Cell1[1][2].element.style.borderBottom = "1px solid black";
        Cell1[3][0].element.innerHTML = `&nbsp`;
        return;    
    }    
    
//======================================
// MAIN SUPPORTING FUNCTION:  UPDATE TABLES FROM FOUND WORDS
//======================================

    function UpdateList () {

        // Cull ProcessedWords from WordList => new words into processList
        let processList = [];
        let inputList = [...El.WordList.querySelectorAll('li')];
        if (inputList.length === 0) {
            inputList = [];
        } else {
            inputList = [...inputList].map(x => x.textContent.toUpperCase());
        }
        for (let i = 0; i < inputList.length; i++) {
            if (!ProcessedWords.includes(inputList[i])) {
                ProcessedWords.push(inputList[i]);
                processList.push(inputList[i]);
                RemainingWords.splice(RemainingWords.indexOf(inputList[i]), 1);    // update Remaining Word list
            }
        }

        // Tally new words
        for (let i = 0; i < processList.length; i++) {     // Tally input words
            Table[Char2Row[(processList[i].slice(0, 2))]][ColIndex[processList[i].length]]++;
            WordsFound++;
            let pangram = true;                            // check for Pangram
            for (let j = 0; j < LetterList.length; j++) {
                if (!processList[i].includes(LetterList[j])) {
                    pangram = false;
                    break;
                }
            }
            if (pangram) PangramsFound++;
        }
        TablePtrs.forEach(item => {                        // update sums
            item.sums();
            item.found = Table[item.rowFound][2];
        });

        DisplayMetaStats();
        if (+(document.querySelector(".sb-progress-value").innerText) >= 0)
            El.Char3Container.removeAttribute("hidden");
        if (ShowChar3) {
            Display3Char();
        } else {
            DisplayTable();
        }
        return;
    }

//======================================
// DISPLAY FUNCTIONS
//======================================

    async function DisplayMetaStats () {
        if (WordsTotal === WordsFound) {
            El.MetaStats3.innerHTML = 'QUEEN BEE:&nbsp<br>Total pangrams:&nbsp<br>Pangrams Found:&nbsp';
            GeniusScore = TotalPoints;
        }
        El.MetaStats2.innerHTML = TotalPoints + '<br>' + WordsTotal + `<br>` + WordsFound;
        El.MetaStats4.innerHTML = GeniusScore + '<br>' + PangramsTotal + `<br>` + PangramsFound;
        return;
    }

    function DisplayTable () {
        if (WordsFound === WordsTotal) {        // all pau
            CongratsQB();
            return;
        }

        // Map Table to HTML
        for (let i = 0; i < TableTotalRows; i++) {
            for (let j = 0; j <= ColEnd; j++) Cell[i][j].element.innerText = Table[i][j];
        }

        // Gray out and hide completed rows and columns
        TablePtrs.forEach(item => {
            for (let col = ColStart - 1; col <= ColEnd; col++) {
                for (let row = item.rowStartData; row <= item.rowEndData; row++)
                    Cell[row][col].element.removeAttribute("hidden", "");
            }

            // check for completed section
            if ((item.found === item.total) && (!Cell[item.rowHeader][0].element.hasAttribute("hidden"))) {
                for (let row = item.rowHeader - 2; row <= item.rowEndChar1; row++) {
                    for (let col = 0; col <= ColEnd; col++) {
                        Cell[row][col].element.style.color = "lightsteelblue";
                        if (!ShowBlankCells) Cell[row][col].element.setAttribute("hidden", "");
                    }
                }
            } else {
                // check for completed rows
                for (let row = item.rowStartData; row <= item.rowEndData; row++) {
                    if (Table[row][1] === Table[row][2]) {
                        for (let col =0; col <= ColEnd; col++) {
                            Cell[row][col].element.style.color = "lightsteelblue";
                            ShowBlankCells
                                ? Cell[row][col].element.removeAttribute("hidden")
                                : Cell[row][col].element.setAttribute("hidden", "");
                        }
                    }
                }
                // check for completed columns 
                for (let col = ColStart; col <= ColEnd; col++) {
                    if (Table[item.rowTotal][col] === Table[item.rowFound][col]) {
                        for (let row = item.rowHeader; row <= item.rowEndChar1; row++) {
                            Cell[row][col].element.style.color = "lightsteelblue";
                            ShowBlankCells
                                ? Cell[row][col].element.removeAttribute("hidden")
                                : Cell[row][col].element.setAttribute("hidden", "");
                    }
                    }
                }
            }
            // check for empty columns
            for (let col = ColStart; col <= ColEnd; col++) {
                if ((Table[item.rowTotal][col] === 0)) {
                    for (let row = item.rowHeader; row <= item.rowEndChar1; row++)
                    Cell[row][col].element.setAttribute("hidden", "");
                }
            }
            // Display FOUND vs REMAINING words
            if (ShowRemaining) {
                for (let col = ColStart - 1; col <= ColEnd; col++) {
                    for (let row = item.rowStartData; row <= item.rowEndData; row++)
                        Cell[row][col].element.setAttribute("hidden", "");
                }
                for (let col = ColStart; col <= ColEnd; col++)
                    Cell[item.rowFound][col].element.innerText = Table[item.rowTotal][col] - Table[item.rowFound][col];
                for (let row = item.rowStartData; row <= item.rowEndData; row++)
                    Cell[row][2].element.innerText = Table[row][1] - Table[row][2];
                Cell[item.rowFound][2].element.innerText = Table[item.rowFound][1] - Table[item.rowFound][2];
            }
        });

        return;
    }

    function Display3Char() {
        if (WordsFound === WordsTotal) {        // all pau
            CongratsQB();
        } else {
            let ch3 = ``;
            let len3 = ``;
            for (let i = 0; i < RemainingWords.length; i++) {
                ch3 += RemainingWords[i].slice(0, 3) + `<br>`;
                len3 += RemainingWords[i].length + `<br>`;
            }
            Cell1[2][0].element.innerHTML = ch3;
            Cell1[2][2].element.innerHTML = len3;
        }
        return;
    }

    function ToggleChar3 () {
        ShowChar3 = !ShowChar3;
        ShowChar3
            ? El.ContainerT0Checkbox.setAttribute("hidden", "")
            : El.ContainerT0Checkbox.removeAttribute("hidden");
        if (WordsFound === WordsTotal) {
            CongratsQB();
            return;
        }
        if (ShowChar3) {
            El.Table1.removeAttribute("hidden");
            El.Table0.setAttribute("hidden", "");
            El.Legend.innerHTML = 'REMAINING WORDS';
            Display3Char();
        } else {
            El.Table1.setAttribute("hidden", "");
            El.Table0.removeAttribute("hidden");
            if (ShowRemaining) {
                El.Legend.innerHTML = `Σ = <font color="mediumvioletred"><b>TOTAL words</b>
                <font color="black">&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp# = <strong><b>REMAINING words</b></strong>`;
            } else {
                El.Legend.innerHTML = `Σ = <font color="mediumvioletred"><b><strong>TOTAL</strong> words</b>
                <font color="black">&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp# = <b>FOUND words</b>`;
            }
            DisplayTable();
        }
        return;
    }

    function ToggleHiddenCells (KLUDGE) {     // DEBUG - KLUDGE patch
        ShowBlankCells = !ShowBlankCells; 
        ShowBlankCells ? localStorage.beehiveBlank = "true" : localStorage.beehiveBlank = "false";
        TablePtrs.forEach(item => {
            if (item.total === item.found) {         // No Char1
                for (let row = item.rowHeader - 2; row <= item.rowEndChar1; row++) {
                    for (let col = 0; col <= ColEnd; col++) 
                        ShowBlankCells ? Cell[row][col].element.removeAttribute("hidden") : Cell[row][col].element.setAttribute("hidden", "");
                }
            } else {        // Oherwise check for individual rows and columns
                // reset all cells to visible
                for (let row = item.rowTotal + 1; row <= item.rowEndChar1; row++) {
                    for (let col = 0; col <= ColEnd; col++) {
                        Cell[row][col].element.removeAttribute("hidden");
                    }
                }
                // toggle rows
                for (let row = item.rowStartData; row <= item.rowEndData; row++) {
                    if (Table[row][1] === Table[row][2]) {
                        for (let col =0; col <= ColEnd; col++)
                            ShowBlankCells ? Cell[row][col].element.removeAttribute("hidden") : Cell[row][col].element.setAttribute("hidden", "");
                    }
                }
                // toggle columns
                for (let col = ColStart; col <= ColEnd; col++) {
                    if (Table[item.rowFound][col] === Table[item.rowTotal][col]) {
                        for (let row = item.rowHeader; row <= item.rowEndChar1; row++)
                            ShowBlankCells ? Cell[row][col].element.setAttribute("hidden", "") : Cell[row][col].element.removeAttribute("hidden");
                    }
                }
            }
        });
        if (KLUDGE && !ShowChar3) DisplayTable();     // DEBUG
        return;
    }

    function ToggleFoundRemaining () {
        ShowRemaining = !ShowRemaining;
        ShowRemaining ? localStorage.beehiveRemaining = "true" : localStorage.beehiveRemaining = "false";
        if (!ShowChar3) {
            if (ShowRemaining) {
                El.Legend.innerHTML = `Σ = <font color="mediumvioletred"><b>TOTAL words</b>
                <font color="black">&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp# = <strong><b>REMAINING words</b></strong>`;
            } else {
                El.Legend.innerHTML = `Σ = <font color="mediumvioletred"><b><strong>TOTAL</strong> words</b>
                <font color="black">&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp# = <b>FOUND words</b>`;
            }
        }
        if (!ShowChar3 && (WordsTotal > 0)) DisplayTable ();
    return;
    }

    function ToggleSubtotals () {
        let chr;            // row increment/decrement
        let rowstart;
        let rowend;
        SubTotalsAtTop = !SubTotalsAtTop;
        SubTotalsAtTop ? localStorage.beehiveSubtotal = "true" : localStorage.beehiveSubtotal = "false";

        // Table and TablePtrs
        TablePtrs.forEach(item => {
            if (SubTotalsAtTop) {
                chr = -1;
                rowstart = item.rowEndChar1;
                rowend = item.rowStartData;
            } else {
                chr = 1;
                rowstart = item.rowFound;
                rowend = item.rowEndChar1;
            }
            
            // Move data rows
            const temp = Table[item.rowFound]
            for (let row = rowstart; row != rowend; row += chr) {
                Table[row] = Table[row + chr];
            }
            item.rowStartData -= chr;
            item.rowEndData -= chr;
            if (SubTotalsAtTop) {
                item.rowFound = item.rowTotal + 1;
            } else {
                item.rowFound = item.rowEndChar1;
            }
            Table[item.rowFound] = temp;

            // Fix format rowFound and tally area
            let datarow;
            SubTotalsAtTop ? datarow = item.rowEndChar1 : datarow = item.rowTotal + 1;
            for (let col = ColStart; col <= ColEnd; col++) {
                Cell[datarow][col].element.style.fontWeight = 'normal';
                Cell[datarow][col].element.style.backgroundColor = "whitesmoke";
                Cell[item.rowFound][col].element.style.fontWeight = 'bold';
                Cell[item.rowFound][col].element.style.backgroundColor = "white";
            }

            // Reset colors
            for (let row = item.rowTotal + 1; row <= item.rowEndChar1; row++) {
                for (let col = 2; col <= ColEnd; col++) {
                    Cell[row][col].element.style.color = 'black';
                }
            }
            for (let row = item.rowHeader + 1; row <= item.rowEndChar1; row++) {
                Cell[row][0].element.style.color = 'black';
                Cell[row][1].element.style.color = 'mediumvioletred';
            }
         })

        // Char2Row
        for (const char in Char2Row) {
            Char2Row[char] -= chr;
        }

        // DEBUG - patch to restore proper DisplayTable
        let KLUDGE = false;
        ToggleHiddenCells (KLUDGE);
        KLUDGE = true;
        ToggleHiddenCells (KLUDGE);
        //  if (!ShowChar3) DisplayTable ();

        return;
    }

    function ToggleHints () {
        HideHints = !HideHints;
        if (HideHints) {
            localStorage.beehiveHideHints = "true";
            El.TableHeader.setAttribute("hidden", "");
            El.ContainerTables.setAttribute("hidden", "");
            El.ContainerCheckbox.setAttribute("hidden", "");
        } else {
            localStorage.beehiveHideHints = "false";
            El.TableHeader.removeAttribute("hidden");
            El.ContainerTables.removeAttribute("hidden");
            El.ContainerCheckbox.removeAttribute("hidden");
            if (+(document.querySelector(".sb-progress-value").innerText) >= Char3Score) 
                El.Char3Container.removeAttribute("hidden");
            if (!ShowChar3) El.ContainerT0Checkbox.removeAttribute("hidden");
        }
        if ((WordsFound === WordsTotal) && WordsTotal > 0) CongratsQB();
        return;
    }
 
    function ToggleSaveSettings () {
        SaveSetting = !SaveSetting;
        SaveSetting ? localStorage.beehiveSetting = "true" : localStorage.beehiveSetting = "false";
        return;
    }

    function CongratsQB() {
        if (ShowChar3) {
            if ((+gameData.today.printDate.at(-1) % 5) === 1) {
                El.Legend.innerHTML = `LON LIV THE QUE!<br>&nbsp`;
            } else {
                El.Legend.innerHTML = `LONG LIVE THE QUEEN!<br>&nbsp`;
            }
        } else {
            El.Legend.innerHTML = `CONGRATULATIONS, YOUR MAJESTY!<br>&nbsp`;
        }
        El.Table0.setAttribute("hidden", "");
        El.Table1.setAttribute("hidden", "");
        El.TableHeader.removeAttribute("hidden");
    }

    function HideOnQBPopup () {
        if (El.QueenBeePage.clientHeight > 0) {
            hintDiv.style.visibility = 'hidden';
        } else {
            hintDiv.style.visibility = 'visible';
        }
        return;
    }

//======================================
// MODULE: DICTIONARY
//======================================

    let bhmodal = ``;                                               // Modal container
    const btn = document.getElementById("bh-defineBtn");            // Button to open the modal
    const span = document.getElementsByClassName("bh-close")[0];    // Close modal
    const bhmodalList = document.getElementById("bh-modal-list");   // Modal innerHTML
    let bhwin;

    btn.onclick = function() {              // Open the modal
        ProcessedWords.sort();
        bhmodal = document.getElementById("bh-myModal");
        bhmodal.style.display = "block";
        let temp = `<dl>`;
        // let temp = `<dl><dt>&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;</dt>`;
        for (let i = 0; i < ProcessedWords.length; i++)
        temp += `<dt class="bh-modal-item" onclick='window.open("https://www.merriam-webster.com/dictionary/` 
            + ProcessedWords[i] + `", "bhWin", "toolbar=yes,scrollbars=yes,resizable=yes,top=50,left=575,width=750,height=600")'>`
            + `&nbsp;` + ProcessedWords[i] + `</dt>`;
        temp += `</dl>`;
        bhmodalList.innerHTML = temp;
    return;
    }

    span.onclick = function() {             // Close the modal
        bhmodal.style.display = "none";
        bhwin = window.open("", "bhWin");
        bhwin.close();
    }
    window.onclick = function(event) {      // Close if clicked outside the modal
        if (event.target == bhmodal) {
            bhmodal.style.display = "none";
            bhwin = window.open("", "bhWin");
            bhwin.close();
        }
    }

//======================================
// MODULE: TOGGLE SHOW-COUNTER
//======================================

    let show = false;
    const counterEl = document.getElementById("bh-counter");
    document.getElementById("bh-button").onclick = function () {
        show = !show;
        show ? counterEl.removeAttribute("hidden") 
             : counterEl.setAttribute("hidden", "");
        return;
    }

})();   // end of outer shell function