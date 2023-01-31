(async () => {            // OUTER SHELL
    'use strict';
    
//======================================
// LOAD PROGRAM AFTER CONDITIONS MET
//======================================

    /* ----- Do not allow to launch more than once ----- */
    if (window.hiveLoaded) {
        alert('Bee Hive program has already been loaded.\nPlease buzz on by (apian for continue).');
        return;
    }
    window.hiveLoaded = true;

    /* ----- Do not launch while on Welcome or Queen Bee pages ----- */
    await waitForCondition(
        document.getElementById('js-hook-pz-moment__welcome'),      // Welcome page
        document.getElementById('js-hook-pz-moment__congrats'));    // Queen Bee page
    main();

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
// MAIN FUNCTION
//======================================

async function main() {

    //--------------------------------------
    // MAIN CONSTANTS AND VARIABLES
    //--------------------------------------

    // System data
    // const devicePhone = detectPhoneDevice();    // DEBUG: either should work
    // const devicePhone = (window.orientation === 'undefined') ? false : true;
    const devicePhone = false;
    const HintsHTML = await getHints();         // data from Spelling Bee page
    const hintDiv = setUpHintDiv();             // initialize DOM

    const El = {
        MetaStats1: document.getElementById('metastats1'),
        MetaStats2: document.getElementById('metastats2'),
        MetaStats3: document.getElementById('metastats3'),
        MetaStats4: document.getElementById('metastats4'),
        Table: document.getElementById('table0'),
        TableHeader: document.getElementById('header'),
        HideBlankCells: document.getElementById('hideEmptyCells'),
        // ShowRemaining: document.getElementById('showRemaining'),
        // <br><input id="showRemaining" type="checkbox">Show number of words remaining</input>
        WordList: document.querySelector('.sb-wordlist-items-pag'),
        OpeningPage: document.querySelector('.pz-moment__button.primary'),
        QueenBeePage: document.querySelector('.pz-moment__close'),
     }

    // Table data
    let Char1Obj = {            // Char1List obj
        char1: '',
        rowHeader: 0,           // header row
        rowTotal: 0,            // total words in each column
        rowFound: 0,            // words found on each column
        rowStartData: 0,        // letter subtotals (in gray)
        rowEndData: 0,
        rowEndChar1: 0,         // last line
        count: [],              // word length subtotals
        total: 0,               // total number of words
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
    let Table = [];             // Main Table array
    let Cell = [];              // element references for Table
    const ColStart = 4;         // table data
    let ColEnd = 0;
    let ColIndex = [0, 0, 0, 3];
    let TableTotalRows = 0;
    let Char1List = [];         // Pointers into Table
    let Char2Row = {};          // hash table: Char2 -> row
    let HideBlankCells = false;

    // Metastats
    let WordsTotal = 0;
    let WordsFound = 0;
    let PangramsTotal = 0;
    let PangramsFound = 0;
    let TotalPoints = 0;
    let GeniusScore = await getGeniusScore();
    
    // Words data
    let LetterList = "";        // needed to find pangrams
    let ProcessedWords = [];    // list of already tabulated words

    // -------------------------------------
    // MAIN PROGRAM
    // -------------------------------------

    /* ----- Insert our HTML and data into Spelling Bee ----- */
    InitializeHints ();

    /* ----- Detect addition to Word List ----- */
    //       main activity during game play
    const observer = new MutationObserver(() => {
        UpdateList();
    });
    observer.observe(El.WordList, {childList: true});

    /* ----- Toggle hiding blank cells ----- */
    El.HideBlankCells.addEventListener('click', ToggleHiddenCells);

//======================================
// GET SYSTEM DATA
//======================================

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

    /* ----- Detect device ----- */
    // function detectPhoneDevice () {
    //     if (navigator.userAgent.match(/Android/i)
    //     || navigator.userAgent.match(/webOS/i)
    //     || navigator.userAgent.match(/iPhone/i)
    //     || navigator.userAgent.match(/iPad/i)
    //     || navigator.userAgent.match(/iPod/i)
    //     || navigator.userAgent.match(/BlackBerry/i)
    //     || navigator.userAgent.match(/Windows Phone/i)) {
    //        return true ;
    //     } else {
    //        return false ;
    //     }
    //  }

    /* ----- Open Rankings pop-up for data ----- */
    async function getGeniusScore() {
        [...document.querySelectorAll(".pz-dropdown__menu-item")][1].click();
        let element = await waitForElement('.sb-modal-list');
        let score = element.querySelectorAll('li')[8].innerText.replace(/\D/g, '');        
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

    /* ----- Create DOM for our added HTML ----- */
    function setUpHintDiv() {
        let gameScreen;
        if (devicePhone) {
            gameScreen = document.querySelector('#portal-game-moments');
        } else { 
            gameScreen = document.querySelector('.pz-game-screen');
        }
        const parent = gameScreen.parentElement;
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.append(gameScreen);
        parent.append(container);

        const hintDiv = document.createElement('div');
        hintDiv.style.padding = '10px';
        container.append(hintDiv);

        // Our added HTML
        hintDiv.innerHTML = `
        <input id="hideEmptyCells" type="checkbox">Hide empty data cells</input>
        <br><table id="header"><tr><td>Σ = total words&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp# = words found</tr></td></table>
        <table id="table0">
        </table><br>
        <table>
            <td id="metastats1">Total points:&nbsp<br>Total words:&nbsp<br>Words Found:&nbsp</td>
            <td id="metastats2"></td>
            <td id="metastats3">Genius level:&nbsp<br>Total pangrams:&nbsp<br>Pangrams Found:&nbsp</td>
            <td id="metastats4"></td>
        </table>
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
            #table0 {
                margin-left: 3ch;
                font-family: Arial, Helvetica, sans-serif;
                font-size: medium;
            }

            #table0 td {
                height: 1ch;
                width: 3ch;
                margin-left: 5ch;
                margin-right: 5ch;
                text-align: center;
            }
            #header td {
                padding-top: 4px;
            }
        </style>
        `;
        return hintDiv;
    }

//======================================
// MAIN SUPPORTING FUNCTION: INITIALIZE HINTS
//======================================

    // -------------------------------------
    // Read HINTS page and generate all tables/lists
    // -------------------------------------

    function InitializeHints () {
        let temp;
        let wordLengths = [];       // word lengths, appended to header
        const paragraphs  = HintsHTML.querySelectorAll('p');

        // MetaStats
        LetterList = paragraphs[1].textContent.replace(/\s/g, '').toUpperCase();
        temp = paragraphs[2].textContent.split(/[^0-9]+/);
            WordsTotal = +temp[1];
            TotalPoints = temp[2];
            PangramsTotal = temp[3];
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

       // Create Char1List, Char2Row, and Table (permanent data)
        GetCharLists(char1Table, char2Table, header, spacer);

        CreateHTMLTable();           
        UpdateList();
            return;
    }

    // Permanent data: Char1List, Char2Row, and Table
    function GetCharLists (char1Table, char2Table, header, spacer) {
        let char2Obj = {                            // char2List obj
            char2: '',
            row: 0,
        };
        let char2List = [];
        let temp;
        let ch2Indx = 0;                            // iterates through char2List
        let chTableIndx = 0;                        // iterates through Char1List and char1Table/char2Table
        let row = 3;
        for (let i = 0; i < char1Table.length; i++) {     // iterate over each char1Table row
            Char1List[chTableIndx] = Object.assign({}, Char1Obj);   // Char1 line
            Char1List[chTableIndx].char1 = char1Table[chTableIndx][0];
            Char1List[chTableIndx].total = Number(char1Table[chTableIndx][char1Table[chTableIndx].length - 1]);
            Table.push(spacer);
            Table.push(spacer);
            Table.push(header);
            Char1List[chTableIndx].rowHeader = row - 1;
            temp = ['', 'Σ', '#', 'Σ>'];
            temp.length = ColEnd + 1;
            for (let j = 4; j <=  ColEnd; j++) {                    // Char1 stats line (rowTotal)
                temp[j] = char1Table[chTableIndx][j - 3];
            }
            Table.push(temp);
            Char1List[chTableIndx].rowTotal = row;
            row++;
            Char1List[chTableIndx].rowStartData = row;
            for (let j = 0; j < char2Table[chTableIndx].length; j++) {  // Char2 lines
                char2List[ch2Indx] = Object.assign({}, char2Obj);
                char2List[ch2Indx].row = row;
                char2List[ch2Indx].char2 = char2Table[chTableIndx][j];
                j++;
                temp = [char2List[ch2Indx].char2, char2Table[chTableIndx][j], 0, '#>'];
                Table.push(temp);
                ch2Indx++;
                row++;
            }
            Char1List[chTableIndx].rowEndData = row -1;
            temp = ['Σ', Char1List[chTableIndx].total, 0, '#>'];    // Char1List.rowFound
            temp.length = ColEnd + 1;
            Table.push(temp);
            Char1List[chTableIndx].rowFound = row;
            Char1List[i].rowEndChar1 = row;
            for (let row = Char1List[i].rowStartData; row <= Char1List[i].rowEndData; row++) {
                for (let col = ColStart; col <= ColEnd; col++) {    // zero out tally area
                    Table[row][col] = 0;
                }
            }
            row +=4;
            chTableIndx++;
        }
        Table.push(spacer);
        char2List.forEach(item => Char2Row[item.char2] = item.row); // hash table: Char2 -> Row
        TableTotalRows = char2List.length + (Char1List.length * 5) + 1;
        return;
    }

    function CreateHTMLTable() {
        for (let y = 0; y < TableTotalRows; y++) {
            let rowObj = [];
            let rowEl = document.createElement('tr');
            for (let x = 0; x <= ColEnd; x++) {
                let cellEl = document.createElement('td');
                rowObj.push({element: cellEl});
                rowEl.appendChild(cellEl);
            }
            Cell.push(rowObj);
            El.Table.appendChild(rowEl);
        }
        // Cell colors
        let row;
        for (let i = 0; i < Char1List.length; i++) {
            row = Char1List[i].rowTotal;
            for (let col = ColStart; col <= ColEnd; col++) {        // Total words
                Cell[row][col].element.style.color = 'mediumvioletred';
                Cell[row][col].element.style.fontWeight = 'bold';
            }
            row = Char1List[i].rowFound;
            for (let col = ColStart; col <= ColEnd; col++) {        // Found words
                Cell[row][col].element.style.fontWeight = 'bold';
            }
                                                                    // Column data
            for (let row = Char1List[i].rowStartData; row <= Char1List[i].rowEndData; row++) {
                Cell[row][1].element.style.color = 'mediumvioletred';
                Cell[row][1].element.style.fontWeight = 'bold';
                Cell[row][2].element.style.fontWeight = 'bold';
            }
            Cell[Char1List[i].rowFound][1].element.style.color = 'mediumvioletred';
            Cell[Char1List[i].rowFound][1].element.style.fontWeight = 'bold';
            Cell[Char1List[i].rowFound][2].element.style.fontWeight = 'bold';
                                                                    // center of table to gray
            for (let row = Char1List[i].rowStartData; row <= Char1List[i].rowEndData; row++) {
                for (let col = ColStart; col <= ColEnd; col++) {
                    Cell[row][col].element.style.backgroundColor = "whitesmoke";
                }
            }
            row = Char1List[i].rowHeader - 2;
            for (let col = 0; col <= ColEnd; col++) {
                Cell[row][col].element.style.borderBottom = "1px solid black";
            }
        }
        for (let col = 0; col <= ColEnd; col++) {
            Cell[TableTotalRows - 1][col].element.style.borderBottom = "1px solid black";
        }
        return;
    }

//======================================
// MAIN SUPPORTING FUNCTION:  UPDATE TABLES FROM FOUND WORDS
//======================================

    // -------------------------------------
    function UpdateList () {
    // -------------------------------------
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
        Char1List.forEach(item => {item.sums()});             // summate columns and rows
        DisplayMetaStats();
        DisplayTable();
        return;
    }
    
//======================================
// DISPLAY FUNCTIONS
//======================================

    function DisplayMetaStats () {
        if (WordsTotal === WordsFound) {
            El.MetaStats3.innerHTML = 'QUEEN BEE:&nbsp<br>Total pangrams:&nbsp<br>Pangrams Found:&nbsp';
            GeniusScore = TotalPoints;
        }
        El.MetaStats2.innerHTML = TotalPoints + '<br>' + WordsTotal + `<br>` + WordsFound;
        El.MetaStats4.innerHTML = GeniusScore + '<br>' + PangramsTotal + `<br>` + PangramsFound;
        return;
    }

    function DisplayTable () {
        // Map Table to HTML
        for (let i = 0; i < TableTotalRows; i++) {
            for (let j = 0; j <= ColEnd; j++) Cell[i][j].element.innerText = Table[i][j];
        }
        // Gray out and hide completed rows and columns
        Char1List.forEach(item => {
            // check for completed rows
            for (let row = item.rowStartData; row <= item.rowEndData; row++) {
                if (Table[row][1] === Table[row][2]) {
                    for (let col =0; col <= ColEnd; col++) {
                        Cell[row][col].element.style.color = "lightsteelblue";
                        if (HideBlankCells) {
                            Cell[row][col].element.setAttribute("hidden", "");
                        } else {
                            Cell[row][col].element.removeAttribute("hidden");
                        }
                    }
                }
            }
            // check for completed columns 
            for (let col = ColStart; col <= ColEnd; col++) {
                if (Table[item.rowTotal][col] === Table[item.rowFound][col]) {
                    for (let row = item.rowHeader; row <= item.rowEndChar1; row++) {
                        Cell[row][col].element.style.color = "lightsteelblue"; 
                        if (HideBlankCells) {
                            Cell[row][col].element.setAttribute("hidden", "");
                        } else {
                            Cell[row][col].element.removeAttribute("hidden");
                        }
                    }
                }
                // empty column
                if (Table[item.rowTotal][col] === 0) {
                    for (let row = item.rowHeader; row <= item.rowEndChar1; row++) 
                        Cell[row][col].element.setAttribute("hidden", "");
                }
            }
            // remove/gray out section if Char1 complete
            let row = item.rowFound;
            if (Table[row][1] === Table[row][2]) {
                for (let col =0; col <= ColEnd; col++) {
                    Cell[row][col].element.style.color = "lightsteelblue";
                    if (HideBlankCells) {
                        Cell[row][col].element.setAttribute("hidden", "");
                    } else {
                        Cell[row][col].element.removeAttribute("hidden");
                    }
                }
                for (let col = 1; col <= 3; col++) {
                    Cell[item.rowTotal][col].element.style.color = "lightsteelblue";
                    if (HideBlankCells) Cell[row][col].element.setAttribute("hidden", "");
                }
            }
        });
        // DEBUG: FIX rowFound EMPTY COLUMN ELIMINATION
        Char1List.forEach(item => {
            for (let col = ColStart; col <= ColEnd; col++) {
                if (Table[item.rowTotal][col] === 0) {
                    Cell[item.rowFound][col].element.setAttribute("hidden", "");
                }
            }
        })
        return;
    }

    function ToggleHiddenCells () {
        HideBlankCells = HideBlankCells ? false : true; 
        Char1List.forEach(item => {
            if (item.total === Table[item.rowFound][2]) {         // No Char1
                for (let row = item.rowHeader - 2; row <= item.rowEndChar1; row++) {
                    for (let col = 0; col <= ColEnd; col++) 
                        HideBlankCells ? Cell[row][col].element.setAttribute("hidden", "") : Cell[row][col].element.removeAttribute("hidden");
                }
            } else {        // otherwise check for individual rows and columns
                // toggle rows
                for (let row = item.rowStartData; row <= item.rowEndData; row++) {
                    if (Table[row][1] === Table[row][2]) {
                        for (let col =0; col <= ColEnd; col++)
                            HideBlankCells ? Cell[row][col].element.setAttribute("hidden", "") : Cell[row][col].element.removeAttribute("hidden");
                    }
                }
                let roww = item.rowFound;
                if (Table[roww][1] === Table[roww][2]) {
                    for (let col =0; col <= ColEnd; col++)
                        HideBlankCells ? Cell[roww][col].element.setAttribute("hidden", "") : Cell[roww][col].element.removeAttribute("hidden");
                }
                // toggle columns
                for (let col = ColStart; col <= ColEnd; col++) {
                    if (Table[item.rowFound][col] === Table[item.rowTotal][col]) {
                        for (let row = item.rowHeader; row <= item.rowEndChar1; row++)
                            HideBlankCells ? Cell[row][col].element.setAttribute("hidden", "") : Cell[row][col].element.removeAttribute("hidden");
                    }
                }
            }
        });
        DisplayTable();
        return;
    }

}       // end of main function
})();   // end of outer shell function
