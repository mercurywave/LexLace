
const GROUPS = 12;
const PER = 12;
const MATCH = 4;

// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Load words from JSON file
    fetch('words.json')
        .then(response => response.json())
        .then(data => {
            populateGrid(data);
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

function populateGrid(data) {
    const allGroupNames = Object.keys(data);
    const groupNames = shuffle(allGroupNames).slice(0, GROUPS);
    let foundWords = [];
    let groupWords = {};
    groupNames.forEach(groupName => {
        const wordsFromGroup = data[groupName];
        const uniqueWords = shuffle(wordsFromGroup)
            .filter(word => !foundWords.includes(word));
        groupWords[groupName] = uniqueWords.slice(0, PER);
        foundWords = foundWords.concat(groupWords[groupName]);
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

        // Add click event to toggle selection
        button.addEventListener('click', function () {
            if(this.classList.contains('valid')) return;
            this.classList.toggle('selected');
            // Check if MATCH selected buttons form a valid word
            checkForValidWord(grid, groupWords);
        });

        grid.appendChild(button);
    }
}

function checkForValidWord(grid, groups){
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
    } else {
        // Words are from different groups, remove highlighting
        selectedButtons.forEach(button => button.classList.remove('valid'));
    }
}

function shuffle(arr){
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}