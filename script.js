
const GROUPS = 12;
const PER = 12;
const MATCH = 4;
const CHUNK_COUNT = PER / MATCH;

const DEBUG = false; // TODO: set false

let __errors = 0;
let __hints = [];
let __victory = false;
let __gameGroups = {};
let __progress = {};
let __validWords = [];

// State management functions
function saveGameState() {
    try {
        // Get current grid button order and states
        const grid = document.getElementById('grid');
        const buttons = Array.from(grid.querySelectorAll('.button'));
        const gridState = buttons.map(button => ({
            text: button.textContent,
            valid: button.classList.contains('valid'),
            hint: button.getAttribute('title') || null
        }));
        
        const gameState = {
            errors: __errors,
            hints: __hints,
            gameGroups: __gameGroups,
            progress: __progress,
            validWords: __validWords,
            gridState: gridState,
            timestamp: Date.now()
        };
        localStorage.setItem('lexlaceGameState', JSON.stringify(gameState));
    } catch (error) {
        console.error('Failed to save game state:', error);
    }
}

function loadGameState() {
    try {
        const savedState = localStorage.getItem('lexlaceGameState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            return gameState;
        }
    } catch (error) {
        console.error('Failed to load game state:', error);
    }
    return null;
}

function clearGameState() {
    try {
        localStorage.removeItem('lexlaceGameState');
    } catch (error) {
        console.error('Failed to clear game state:', error);
    }
}

// script.js
document.addEventListener('DOMContentLoaded', function () {
    // Load words from JSON file
    fetch('words.json')
        .then(response => response.json())
        .then(data => {
            // Check for saved game state first
            const savedState = loadGameState();
            if (savedState) {
                showToast('Game restored from previous session');
                populateGrid(data, savedState);
            } else {
                populateGrid(data);
            }
            hookButtons(data);
        })
        .catch(error => {
            console.error('Error loading words:', error);

            // Fallback: create a grid with placeholder text if JSON fails
            const grid = document.getElementById('grid');
            for (let i = 0; i < GROUPS * PER; i++) {
                const button = document.createElement('button');
                button.className = 'button';
                button.textContent = `Word ${i + 1}`;

                button.addEventListener('click', function () {
                    this.classList.toggle('selected');
                });

                grid.appendChild(button);
            }
        });
});

function hookButtons(data) {

    const btHelp = document.getElementById('btHelp');
    const btReset = document.getElementById('btReset');
    const btShuffle = document.getElementById('btShuffle');
    const btClear = document.getElementById('btClear');
    const btNewGame = document.getElementById('btNewGame');
    const btHint = document.getElementById('btHint');
    const btCheat = document.getElementById('btCheat');
    const grid = document.getElementById('grid');
    let soj = document.getElementById('soj');
    btHelp.addEventListener('click', () => {
        let pop = document.getElementById('popHelp');
        if (pop.matches(':popover-open')) return; // already visible - dismiss
        let container = document.getElementById('categoryList');
        container.innerHTML = '';
        for (const groupName of Object.keys(__gameGroups)) {
            const div = document.createElement('li');
            let disp = "???";
            if (__progress[groupName] > 0) {
                disp = groupName + ' ' + __progress[groupName] + '/' + CHUNK_COUNT;
            }
            if(__progress[groupName] >= CHUNK_COUNT) div.classList.add('complete');
            div.textContent = disp;
            container.appendChild(div);
        }
        pop.showPopover();
        soj.classList.toggle('noDisp', false);
    });
    soj.addEventListener('click', () => soj.classList.toggle('noDisp', true));
    btReset.addEventListener('click', () => {
        const buttons = grid.querySelectorAll('.button');
        buttons.forEach(button => {
            button.classList.remove('selected');
        });
        updateButtons();
    });
    btShuffle.addEventListener('click', () => {
        const buttons = Array.from(grid.querySelectorAll('.button'));
        shuffle(buttons);
        grid.innerHTML = '';
        buttons.forEach(button => grid.appendChild(button));
        updateButtons();
        saveGameState();
    });
btClear.addEventListener('click', () => {
        const validButtons = grid.querySelectorAll('.button.valid');
        validButtons.forEach(button => {
            button.remove();
        });
        updateButtons();
        saveGameState();
    });
    btNewGame.addEventListener('click', () => {
        clearGameState();
        populateGrid(data);
    });
    btHint.addEventListener('click', () => {
        const selectedButtons = Array.from(grid.querySelectorAll('.button.selected'))
        if (selectedButtons.length != 1) return;
        let word = selectedButtons[0].textContent;
        for (const groupName of Object.keys(__gameGroups)) {
            if (__gameGroups[groupName].includes(word)) {
                showToast(groupName);
                if (!__hints.includes(word)) {
                    __hints.push(word);
                    selectedButtons[0].setAttribute('title', groupName);
                    // Save game state after hint
                    saveGameState();
                }
                break;
            }
        }
    });
    btCheat.addEventListener('click', () => {
        if (DEBUG) {
            __victory = true; // lazy - you have to click something else
            updateButtons();
        }
    });

    document.getElementById('toast').addEventListener('click', () => {
        toast.classList.remove('show');
    });
}

function setupNewGame(data) {
    const allGroupNames = Object.keys(data);
    const groupNames = shuffle(allGroupNames);
    let foundWords = [];
    let groupWords = {};
    let count = 0;
    for (let groupName of groupNames) {
        const wordsFromGroup = data[groupName];
        const uniqueWords = shuffle(wordsFromGroup)
            .filter(word => !foundWords.includes(word));
        if (uniqueWords.length < PER) continue;
        groupWords[groupName] = uniqueWords.slice(0, PER);
        __progress[groupName] = 0;
        console.log(groupName, groupWords[groupName]);
        foundWords = foundWords.concat(groupWords[groupName]);
        count++;
        if (count >= GROUPS) break;
    }
    __gameGroups = groupWords;
    
    // Check for duplicates
    Object.keys(__gameGroups).forEach(groupName => {
        const wordsFromGroup = __gameGroups[groupName];
        const hasDuplicates = wordsFromGroup.length !== [...new Set(wordsFromGroup)].length;
        if (hasDuplicates) {
            console.log(`Duplicate words found in group: ${groupName}`);
        }
    });
}

function createButton(text, grid, isValid = false, hint = null) {
    const button = document.createElement('button');
    button.className = 'button';
    button.textContent = text;
    
    if (isValid) {
        button.classList.add('valid');
    }
    
    if (hint) {
        button.setAttribute('title', hint);
    }

    let clickHandler = e => {
        if (button.classList.contains('valid')) return;
        button.classList.toggle('selected');
        // Check if MATCH selected buttons form a valid word
        checkForValidWord(grid, __gameGroups);
        updateButtons();
        e.preventDefault();
    };

    button.addEventListener('click', clickHandler);
    return button;
}

function populateGrid(data, savedState = null) {
    // reset state
    if (savedState) {
        __errors = savedState.errors;
        __hints = savedState.hints;
        __victory = false;
        __gameGroups = savedState.gameGroups;
        __progress = savedState.progress;
        __validWords = savedState.validWords || [];
    } else {
        __errors = 0;
        __hints = [];
        __victory = false;
        __gameGroups = {};
        __progress = {};
        __validWords = [];
        setupNewGame(data);
    }
    document.getElementById('victory').classList.toggle("noDisp", true);
    
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    
    if (savedState && savedState.gridState) {
        // Restore exact grid order and states
        savedState.gridState.forEach(buttonState => {
            const button = createButton(buttonState.text, grid, buttonState.valid, buttonState.hint);
            grid.appendChild(button);
        });
    } else {
        // Create new shuffled grid
        const foundWords = Object.values(__gameGroups).flat();
        let words = shuffle(foundWords);

        // Create 16x16 grid of buttons
        for (let i = 0; i < GROUPS * PER; i++) {
            const wordIndex = i % words.length;
            const button = createButton(words[wordIndex], grid);
            grid.appendChild(button);
        }
    }
    updateButtons();
}

function checkForValidWord(grid, groups) {
    if (DEBUG && __victory) { victory(groups); }
    const selectedButtons = Array.from(grid.querySelectorAll('.button.selected'));
    const selectedWords = selectedButtons.map(button => button.textContent);

    if (selectedButtons.length == 1) {
        // save you a click if you already asked for a hint
        let title = selectedButtons[0].title; // bit of a hack to rely on the title
        if (title) {
            showToast(title);
        }
    }

    if (selectedWords.length != MATCH) return;

    // Check if all selected words belong to the same group
    let validGroup = null;
    for (const groupName of Object.keys(groups)) {
        if (groups[groupName].includes(selectedWords[0])) {
            validGroup = groupName;
            break;
        }
    }

    selectedButtons.forEach(button => {
        button.classList.remove('selected');
    });

    if (!validGroup) return; // No valid group found for first word

    // Check that all selected words belong to the same group
    const allFromSameGroup = selectedWords.every(word => groups[validGroup].includes(word));

    if (allFromSameGroup) {

        // All words are from the same group, highlight them
        selectedButtons.forEach(button => button.classList.add('valid'));

        // Add matched words to validWords array
        selectedWords.forEach(word => {
            if (!__validWords.includes(word)) {
                __validWords.push(word);
            }
        });

        __progress[validGroup]++;

        // Save game state after successful match
        saveGameState();

        if (grid.querySelectorAll('.button').length === grid.querySelectorAll('.button.valid').length) {
            victory(groups);
        }
        else {
            showToast(validGroup + ' ' + __progress[validGroup] + '/' + CHUNK_COUNT);
        }
    } else {
        // Words are from different groups - show error animation
        selectedButtons.forEach(button => {
            button.classList.add('error');
            button.classList.remove('selected');
        });
        
        // Increment error counter immediately
        __errors++;
        
        // Save game state after error
        saveGameState();
        
        // Remove error animation after 500ms
        setTimeout(() => {
            selectedButtons.forEach(button => {
                button.classList.remove('error');
            });
        }, 500);
    }
}

function updateButtons() {
    const btHelp = document.getElementById('btHelp');
    const btReset = document.getElementById('btReset');
    const btShuffle = document.getElementById('btShuffle');
    const btClear = document.getElementById('btClear');
    const btNewGame = document.getElementById('btNewGame');
    const btHint = document.getElementById('btHint');
    const btCheat = document.getElementById('btCheat');
    const selectedButtons = Array.from(grid.querySelectorAll('.button.selected'));
    const validButtons = Array.from(grid.querySelectorAll('.button.valid'));
    btReset.classList.toggle('noDisp', selectedButtons.length === 0);
    btShuffle.classList.toggle('noDisp', selectedButtons.length > 0 || __victory);
    btClear.classList.toggle('noDisp', selectedButtons.length > 0 || validButtons.length === 0);
    btNewGame.classList.toggle('noDisp', !__victory);
    btHint.classList.toggle('noDisp', selectedButtons.length === 0 || __victory);
    btHint.disabled = (selectedButtons.length != 1);
    btCheat.classList.toggle('noDisp', !DEBUG || __victory);
    btHelp.classList.toggle('noDisp', __victory);
}
updateButtons();

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    // Hide toast after specified duration
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function victory(groups) {
    __victory = true;
    clearGameState(); // Clear saved state on victory
    const grid = document.getElementById('grid');
    grid.innerHTML = ''; // Clear the board
    const victory = document.getElementById('victory');
    victory.classList.toggle("noDisp", false);

    const divMistakes = document.getElementById('mistakes');
    divMistakes.innerText = __errors;

    const divHints = document.getElementById('hints');
    divHints.innerText = __hints.length;

    let score = (200 - __errors - __hints.length * 5) / 2;
    let grade = "-";
    if (score >= 70) grade = "C";
    if (score >= 77) grade = "C+";
    if (score >= 80) grade = "B-";
    if (score >= 83) grade = "B";
    if (score >= 87) grade = "B+";
    if (score >= 90) grade = "A-";
    if (score >= 93) grade = "A";
    if (score >= 97) grade = "A+";
    if (score >= 100) grade = "S+";
    document.getElementById('grade').innerText = grade;

    let divMain = document.getElementById('categories');
    divMain.innerHTML = '';

    for (const groupName of Object.keys(groups)) {
        const words = groups[groupName];

        const h2 = document.createElement('h2');
        h2.textContent = groupName;
        divMain.appendChild(h2);

        const container = document.createElement('div');
        container.className = 'categories-list';
        words.forEach(word => {
            const span = document.createElement('span');
            span.className = 'clue';
            span.textContent = word;
            container.appendChild(span);
        });
        divMain.appendChild(container);
    }


    updateButtons();
}
