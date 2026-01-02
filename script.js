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
            for (let i = 0; i < 256; i++) {
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
    const groupNames = Object.keys(data);
    const groupWords = groupNames.map(name => data[name]);
    const words = groupWords.flat();
    const grid = document.getElementById('grid');

    // Create 16x16 grid of buttons
    for (let i = 0; i < 256; i++) {
        const button = document.createElement('button');
        button.className = 'button';

        // Select a random word from our array, cycling through if needed
        const wordIndex = i % words.length;
        button.textContent = words[wordIndex];

        // Add click event to toggle selection
        button.addEventListener('click', function () {
            if(this.classList.contains('valid')) return;
            this.classList.toggle('selected');
            // Check if 4 selected buttons form a valid word
            checkForValidWord(grid, data);
        });

        grid.appendChild(button);
    }
}

function checkForValidWord(grid, data){
    const groupNames = Object.keys(data);
    const selectedButtons = Array.from(grid.querySelectorAll('.button.selected'))
    const selectedWords = selectedButtons.map(button => button.textContent);
    
    if(selectedWords.length != 4) return;

    // Check if all selected words belong to the same group
    let validGroup = null;
    for (const groupName of groupNames) {
        if (data[groupName].includes(selectedWords[0])) {
            validGroup = groupName;
            break;
        }
    }

    selectedButtons.forEach(button => {
        button.classList.remove('selected');
    });
    
    if (!validGroup) return; // No valid group found for first word

    // Check that all selected words belong to the same group
    const allFromSameGroup = selectedWords.every(word => data[validGroup].includes(word));

    if (allFromSameGroup) {
        // All words are from the same group, highlight them
        selectedButtons.forEach(button => button.classList.add('valid'));
    } else {
        // Words are from different groups, remove highlighting
        selectedButtons.forEach(button => button.classList.remove('valid'));
    }
}