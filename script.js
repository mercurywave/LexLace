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
            this.classList.toggle('selected');
        });

        grid.appendChild(button);
    }
}
