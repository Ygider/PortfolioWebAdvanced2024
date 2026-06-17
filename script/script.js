document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleButton');
    const pokemonContainer = document.getElementById('pokemonContainer');
    const pokemonTeam = document.getElementById('pokemonTeam');
    const rerollButton = document.getElementById('rerollButton');
    const clearTeamButton = document.getElementById('clearTeamButton');
    const introToggle = document.getElementById('introToggle');
    const introText = document.getElementById('introText');

    // Toggle visibility between the generator and the saved team
    toggleButton.addEventListener('click', function() {
        if (pokemonContainer.style.display === 'none') {
            pokemonContainer.style.display = 'block';
            pokemonTeam.style.display = 'none';
            rerollButton.style.display = '';
            toggleButton.textContent = 'Show Pokémon Team';
        } else {
            displayStoredPokemon();
            pokemonContainer.style.display = 'none';
            pokemonTeam.style.display = 'block';
            rerollButton.style.display = 'none';
            toggleButton.textContent = 'Choose Pokémon';
        }
    });

    // Manually roll a fresh set of 6 Pokémon
    rerollButton.addEventListener('click', () => getPokemonNames());

    // Empty the whole team
    clearTeamButton.addEventListener('click', function() {
        RemovePokemonTeam();
        displayStoredPokemon();
        updateTeamCount();
    });

    // Collapsible intro text
    introToggle.addEventListener('click', function() {
        const hidden = introText.hasAttribute('hidden');
        if (hidden) {
            introText.removeAttribute('hidden');
            introToggle.textContent = 'How does it work? ▴';
        } else {
            introText.setAttribute('hidden', '');
            introToggle.textContent = 'How does it work? ▾';
        }
    });

    updateTeamCount();
});

(function startUp() {
    getPokemonNames();
}())

function showLoader(show) {
    const loader = document.getElementById('loader');
    const pokemonContainer = document.getElementById('pokemonContainer');
    if (!loader) return;
    if (show) {
        loader.removeAttribute('hidden');
        pokemonContainer.style.visibility = 'hidden';
    } else {
        loader.setAttribute('hidden', '');
        pokemonContainer.style.visibility = 'visible';
    }
}

async function getPokemonNames() {
    const pokemonContainerTop = document.getElementById('pokemonContainerTop');
    const pokemonContainerBottom = document.getElementById('pokemonContainerBottom');
    pokemonContainerTop.innerHTML = '';
    pokemonContainerBottom.innerHTML = '';
    showLoader(true);

    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1017');
        const data = await response.json();
        const shuffledArray = shuffleArray(data.results);
        const firstSix = shuffledArray.slice(0, 6);
        // Build each of the six Pokémon and render it
        for (const element of firstSix) {
            let pokemon = {
                name: '',
                sprite: '',
                type: []
            }
            pokemon.name = element.name
            const url = element.url;
            const {sprite, types} = await getPokemonSpriteAndType(url)
            pokemon.sprite = sprite
            pokemon.type = types
            displayPokemon(pokemon);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        pokemonContainerTop.innerHTML = '<p style="text-align:center;color:#cf4747">Could not reach the PokéAPI. Please try again.</p>';
    } finally {
        showLoader(false);
    }
};

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

async function getPokemonSpriteAndType(url){
    try {
        const response = await fetch(url);
        const data = await response.json();
        const sprite = data.sprites.other["official-artwork"].front_default;

        const type = data.types.length
        let types = [];
        if (type === 1) {
            types.push(data.types[0].type.name);
        } else {
            types.push(data.types[0].type.name);
            types.push(data.types[1].type.name);
        }

        return {sprite, types}
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function displayPokemon (pokemon){
    const pokemonContainerTop = document.getElementById('pokemonContainerTop');
    const pokemonContainerBottom = document.getElementById('pokemonContainerBottom');
    const pokemonElement = document.createElement('div');
    pokemonElement.classList.add('pokemon');
    pokemonElement.innerHTML = `
            <p>${pokemon.name}</p>
            <img src="${pokemon.sprite}" alt="${pokemon.name}">
    `;
    const typesElement = document.createElement('div');
    typesElement.classList.add('types');

    // Display Pokémon type icon(s)
    pokemon.type.forEach(type => {
        const typeContainer = document.createElement('div');
        typeContainer.classList.add('type-container');

        const typeImage = document.createElement('img');
        typeImage.src = `pokemonTypes/${type}.avif`;
        typeImage.alt = type;
        typeImage.width = 64;
        typeImage.height = 32;
        typeContainer.appendChild(typeImage);
        typesElement.appendChild(typeContainer);
    });
    pokemonElement.appendChild(typesElement);

    if (pokemonContainerTop.childElementCount < 3) {
        pokemonContainerTop.appendChild(pokemonElement);
    } else {
        pokemonContainerBottom.appendChild(pokemonElement);
    }

    // "Add to my team" button
    const button = document.createElement('div');
    const a = document.createElement('a');
    button.appendChild(a);
    a.textContent = 'Add to my team';
    button.className = "addAnimation";
    button.classList.add('pokemon-button');

    button.addEventListener('click', () => {
        addPokemon(pokemon);
    });
    pokemonElement.appendChild(button);
}

function addPokemon(...pokemons) {
    if (typeof(Storage) !== "undefined") {
        let storedPokemon = JSON.parse(localStorage.getItem('pokemonList')) || [];
        if (storedPokemon.some(p => p.name === pokemons[0].name)) {
            alert(`${pokemons[0].name} is already on your team`);
            return false;
        }
        if (storedPokemon.length + pokemons.length > 6) {
            alert("Your team is full (6 Pokémon). Remove one first.");
            return false;
        }
        storedPokemon = [...storedPokemon, ...pokemons];
        localStorage.setItem('pokemonList', JSON.stringify(storedPokemon));
        pokemons.forEach(pokemon => console.log(`${pokemon.name} has been added to local storage.`));
    } else {
        console.error("Local storage is not supported in this browser.");
    }
    updateTeamCount();
    getPokemonNames();
}

function RemovePokemonTeam() {
    if (typeof(Storage) !== "undefined") {
        localStorage.removeItem('pokemonList');
        console.log('Pokémon team has been refreshed.');
    } else {
        console.error("Local storage is not supported in this browser.");
    }
}

function removePokemonByName(name) {
    if (typeof(Storage) !== "undefined") {
        let storedPokemon = JSON.parse(localStorage.getItem('pokemonList')) || [];

        // Find index of the pokemon
        const index = storedPokemon.findIndex(pokemon => pokemon.name === name);

        if (index !== -1) {
            // Remove the pokemon from the array
            storedPokemon.splice(index, 1);
            // Update local storage with the modified list
            localStorage.setItem('pokemonList', JSON.stringify(storedPokemon));
            console.log(`Pokemon with name ${name} has been removed from local storage.`);
        } else {
            console.log(`Pokemon with name ${name} not found in local storage.`);
        }
    } else {
        console.error("Local storage is not supported in this browser.");
    }
}

function displayStoredPokemon() {
    const storedPokemon = JSON.parse(localStorage.getItem('pokemonList')) || [];
    const pokemonTeamTop = document.getElementById('pokemonTeamTop');
    const pokemonTeamBottom = document.getElementById('pokemonTeamBottom');
    const emptyTeamMsg = document.getElementById('emptyTeamMsg');
    pokemonTeamTop.innerHTML = '';
    pokemonTeamBottom.innerHTML = '';

    if (emptyTeamMsg) {
        emptyTeamMsg.hidden = storedPokemon.length !== 0;
    }

    storedPokemon.forEach(pokemon => {
        const pokemonElement = document.createElement('div');
        pokemonElement.classList.add('pokemon');
        pokemonElement.innerHTML = `
            <p>${pokemon.name}</p>
            <img src="${pokemon.sprite}" alt="${pokemon.name}">
        `;
        const typesElement = document.createElement('div');
        typesElement.classList.add('types');

        // Display Pokémon type icon(s)
        pokemon.type.forEach(type => {
            const typeContainer = document.createElement('div');
            typeContainer.classList.add('type-container');

            const typeImage = document.createElement('img');
            typeImage.src = `pokemonTypes/${type}.avif`;
            typeImage.alt = type;
            typeImage.width = 64;
            typeImage.height = 32;
            typeContainer.appendChild(typeImage);
            typesElement.appendChild(typeContainer);
        });
        pokemonElement.appendChild(typesElement);

        // Remove button
        const removeButton = document.createElement('div');
        const a = document.createElement('a');
        removeButton.appendChild(a);
        a.textContent = 'Remove from my team';
        removeButton.className = "removeAnimation";
        removeButton.classList.add('pokemon-button');

        removeButton.addEventListener('click', function() {
            removePokemonByName(pokemon.name);
            displayStoredPokemon();
            updateTeamCount();
        });
        pokemonElement.appendChild(removeButton);

        // Display 3 on top and 3 on the bottom
        if (pokemonTeamTop.childElementCount < 3) {
            pokemonTeamTop.appendChild(pokemonElement);
        } else {
            pokemonTeamBottom.appendChild(pokemonElement);
        }
    });
}

function updateTeamCount() {
    const teamCount = document.getElementById('teamCount');
    if (!teamCount) return;
    const storedPokemon = JSON.parse(localStorage.getItem('pokemonList')) || [];
    teamCount.textContent = `Team ${storedPokemon.length} / 6`;
}

async function searchPokemonByName(pokemonName){
    let searchDisplay = document.getElementById("searchPokemon");
    searchDisplay.innerHTML = '';

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        const data = await response.json();
        let pokemon = {
            name: data.name,
            sprite: data.sprites.other["official-artwork"].front_default,
            type: []
        }
        const searchPokemon = document.createElement('img');
        searchPokemon.src = pokemon.sprite;
        searchPokemon.alt = pokemon.name;
        searchDisplay.appendChild(searchPokemon);
    }
    catch (error){
        alert('Pokémon not found');
        console.log('Error fetching data:', error);
    }
}

// Button: search Pokémon by name
document.getElementById('searchButton').addEventListener('click', function(e) {
    e.preventDefault();
    const pokemonName = document.getElementById('searchInput').value.toLowerCase().trim();
    if (pokemonName) {
        searchPokemonByName(pokemonName);
    }
});

displayStoredPokemon();
