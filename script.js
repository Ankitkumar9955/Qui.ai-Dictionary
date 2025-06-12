const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;
const wordInput = document.getElementById('word-input');
const searchButton = document.getElementById('search-button');
const spellButton = document.getElementById('spell-button');
const resultsDisplay = document.getElementById('results-display');
const statusMessage = document.getElementById('status-message');

let currentWordData = null; // Stores the entire word data for spell option

// --- Theme Toggle Logic ---
function loadTheme() {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }
}
loadTheme();
themeToggle.addEventListener('click', () => {
    if (htmlElement.classList.contains('dark')) {
        htmlElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        htmlElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
});

// --- Utility Functions ---
function showLoading(message = "Loading...") {
    statusMessage.innerHTML = `<span class="loading-dots text-accent"><span>.</span><span>.</span><span>.</span></span> <span class="text-primary">${message}</span>`;
    resultsDisplay.innerHTML = ''; // Clear previous results
    spellButton.disabled = true;
}

function hideLoading() {
    statusMessage.textContent = '';
}

function showError(message) {
    statusMessage.textContent = message;
    statusMessage.classList.add('text-red-500', 'font-semibold');
}

function clearResults() {
    resultsDisplay.innerHTML = '';
    statusMessage.textContent = 'Start by typing a word and clicking Search!';
    statusMessage.classList.remove('text-red-500', 'font-semibold');
    spellButton.disabled = true;
    currentWordData = null;
}

// --- Dictionary Search Function ---
async function searchWord() {
    const word = wordInput.value.trim();
    if (!word) {
        showError("Please enter a word to search.");
        clearResults(); // Clear any previous results
        return;
    }

    clearResults(); // Clear existing content before new search
    showLoading("Searching for '" + word + "'...");

    const dictionaryApiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

    try {
        const response = await fetch(dictionaryApiUrl);
        if (!response.ok) {
            if (response.status === 404) {
                showError(`"${word}" not found in dictionary. Please check your spelling.`);
            } else {
                showError(`Error fetching definition: ${response.status} ${response.statusText}`);
                console.error('Dictionary API error:', response.status, response.statusText);
            }
            return;
        }

        const data = await response.json();
        currentWordData = data[0]; // Store the first entry for spell

        if (!currentWordData) {
            showError(`"${word}" not found in dictionary.`);
            return;
        }

        renderWordData(currentWordData);
        hideLoading();
        spellButton.disabled = false;

    } catch (error) {
        console.error("Error fetching dictionary data:", error);
        showError("Could not fetch dictionary data. Please check your internet connection.");
    }
}

function renderWordData(data) {
    resultsDisplay.innerHTML = ''; // Clear display for new word

    const wordElement = document.createElement('h2');
    wordElement.className = 'text-4xl font-bold mb-2 word-display';
    wordElement.textContent = data.word;
    resultsDisplay.appendChild(wordElement);

    if (data.phonetic) {
        const phoneticElement = document.createElement('p');
        phoneticElement.className = 'text-xl text-gray-600 dark:text-gray-300 mb-4';
        phoneticElement.textContent = data.phonetic;
        resultsDisplay.appendChild(phoneticElement);
    }

    data.meanings.forEach(meaning => {
        const partOfSpeechElement = document.createElement('h3');
        partOfSpeechElement.className = 'text-2xl font-semibold mt-4 mb-2 text-primary';
        partOfSpeechElement.textContent = meaning.partOfSpeech;
        resultsDisplay.appendChild(partOfSpeechElement);

        const definitionsList = document.createElement('ul');
        definitionsList.className = 'list-disc list-inside space-y-2 ml-4 text-primary';
        meaning.definitions.forEach((def, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${def.definition}`;
            if (def.example) {
                const exampleSpan = document.createElement('span');
                exampleSpan.className = 'block text-sm text-gray-500 dark:text-gray-400 italic';
                exampleSpan.textContent = `"${def.example}"`;
                listItem.appendChild(exampleSpan);
            }
            definitionsList.appendChild(listItem);
        });
        resultsDisplay.appendChild(definitionsList);
    });
}

// --- Spell the Word Function ---
async function spellWord() {
    if (!currentWordData || !currentWordData.word) {
        showError("No word loaded to spell.");
        return;
    }

    // Try to find an audio pronunciation
    const audioUrl = currentWordData.phonetics.find(p => p.audio)?.audio;

    if (audioUrl) {
        try {
            const audio = new Audio(audioUrl);
            await audio.play();
        } catch (e) {
            console.error("Error playing audio:", e);
            // Fallback to text-to-speech if audio fails
            speakText(currentWordData.word);
        }
    } else {
        // Fallback to text-to-speech
        speakText(currentWordData.word);
    }
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Set language for better pronunciation
        speechSynthesis.speak(utterance);
    } else {
        // Using alert only as a fallback for missing browser feature, not for core app errors.
        // In a production app, you might use a custom modal for this.
        alert("Your browser does not support text-to-speech.");
    }
}

// --- Event Listeners ---
searchButton.addEventListener('click', searchWord);
wordInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchWord();
    }
});
spellButton.addEventListener('click', spellWord);

// Initial state cleanup
clearResults();
