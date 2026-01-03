
const GROUPS = 12;
const PER = 12;
const MATCH = 4;

const DEBUG = true; // TODO: set false

let __errors = 0;
let __hints = [];
let __victory = false;

// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Load words from JSON file
    fetch('words.json')
        .then(response => response.json())
        .then(data => {
            populateGrid(data);
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
                
                button.addEventListener('click', function() {
                    this.classList.toggle('selected');
                });
                
                grid.appendChild(button);
            }
        });
});

function hookButtons(data){
    
    const btReset = document.getElementById('btReset');
    const btShuffle = document.getElementById('btShuffle');
    const btClear = document.getElementById('btClear');
    const btNewGame = document.getElementById('btNewGame');
    const btCheat = document.getElementById('btCheat');
    const grid = document.getElementById('grid');
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
    });
    btClear.addEventListener('click', () => {
        const validButtons = grid.querySelectorAll('.valid');
        validButtons.forEach(button => {
            button.remove();
        });
        updateButtons();
    });
    btNewGame.addEventListener('click', () => {
        populateGrid(data);
    });
    btCheat.addEventListener('click', () => {
        if(DEBUG){
            __victory = true; // lazy - you have to click something else
            updateButtons();
        }
    });
}

function populateGrid(data) {
    __errors = 0;
    __hints = [];
    __victory = false;
    document.getElementById('victory').classList.toggle("noDisp", true);

    const allGroupNames = Object.keys(data);
    const groupNames = shuffle(allGroupNames);
    let foundWords = [];
    let groupWords = {};
    let count = 0;
    for(let groupName of groupNames){
        const wordsFromGroup = data[groupName];
        const uniqueWords = shuffle(wordsFromGroup)
            .filter(word => !foundWords.includes(word));
        if(uniqueWords.length < PER) continue;
        groupWords[groupName] = uniqueWords.slice(0, PER);
        console.log(groupName, groupWords[groupName]);
        foundWords = foundWords.concat(groupWords[groupName]);
        count++;
        if(count >= GROUPS) break;
    }
    groupNames.forEach(groupName => {
        const wordsFromGroup = data[groupName];
        const hasDuplicates = wordsFromGroup.length !== [...new Set(wordsFromGroup)].length;
        if (hasDuplicates) {
            console.log(`Duplicate words found in group: ${groupName}`);
        }
    });
    const grid = document.getElementById('grid');
    let words = shuffle(foundWords);

    // Create 16x16 grid of buttons
    for (let i = 0; i < GROUPS * PER; i++) {
        const button = document.createElement('button');
        button.className = 'button';

        // Select a random word from our array, cycling through if needed
        const wordIndex = i % words.length;
        button.textContent = words[wordIndex];

        let clickHandler = e => {
            if(button.classList.contains('valid')) return;
            button.classList.toggle('selected');
            // Check if MATCH selected buttons form a valid word
            checkForValidWord(grid, groupWords);
            updateButtons();
            e.preventDefault();
        };

        // Add click event to toggle selection
        //button.addEventListener('touchstart', clickHandler);
        button.addEventListener('click', clickHandler);

        grid.appendChild(button);
    }
    updateButtons();
}

function checkForValidWord(grid, groups){
    if(DEBUG && __victory) { victory(groups); }
    const selectedButtons = Array.from(grid.querySelectorAll('.button.selected'))
    const selectedWords = selectedButtons.map(button => button.textContent);
    
    if(selectedWords.length != MATCH) return;

    // Check if all selected words belong to the same group
    let validGroup = null;
    for(const groupName of Object.keys(groups)){
        if(groups[groupName].includes(selectedWords[0])){
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
        
        if (grid.querySelectorAll('.button').length === grid.querySelectorAll('.button.valid').length){
            victory(groups);
        }
        else {
            showToast(validGroup);
        }
    } else {
        // Words are from different groups, remove highlighting
        selectedButtons.forEach(button => button.classList.remove('valid'));
        __errors++;
    }
}

function updateButtons(){
    const btReset = document.getElementById('btReset');
    const btShuffle = document.getElementById('btShuffle');
    const btClear = document.getElementById('btClear');
    const btNewGame = document.getElementById('btNewGame');
    const btCheat = document.getElementById('btCheat');
    const selectedButtons = Array.from(grid.querySelectorAll('.button.selected'));
    const validButtons = Array.from(grid.querySelectorAll('.button.valid'));
    btReset.classList.toggle('noDisp', selectedButtons.length === 0);
    btShuffle.classList.toggle('noDisp', selectedButtons.length > 0 || __victory);
    btClear.classList.toggle('noDisp', selectedButtons.length > 0 || validButtons.length === 0);
    btNewGame.classList.toggle('noDisp', !__victory);
    btCheat.classList.toggle('noDisp', !DEBUG || __victory);
}
updateButtons();

function shuffle(arr){
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

function victory(groups){
    __victory = true;
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
    if(score >= 70) grade = "C";
    if(score >= 77) grade = "C+";
    if(score >= 80) grade = "B-";
    if(score >= 83) grade = "B";
    if(score >= 87) grade = "B+";
    if(score >= 90) grade = "A-";
    if(score >= 93) grade = "A";
    if(score >= 97) grade = "A+";
    if(score >= 100) grade = "S+";
    document.getElementById('grade').innerText = grade;

    let divMain = document.getElementById('categories');
    divMain.innerHTML = '';

    for(const groupName of Object.keys(groups)){
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
