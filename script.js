document.addEventListener('DOMContentLoaded', () => {
    const pokemonInfoContainer = document.getElementById('pokemon-info-container');
    const guessName = document.getElementById('guess-name');
    const submitGuess = document.getElementById('submit-guess');
    const playAgainButton = document.getElementById('play-again'); // Botón para jugar de nuevo

    let currentPokemon = null;
    let gameActive = false; // Para rastrear si el juego está en curso
    const validPokemonNames = [];

    // Función para obtener un Pokémon aleatorio de los 151 iniciales
    async function fetchRandomPokemon() {
        const pokemonId = Math.floor(Math.random() * 151) + 1; // ID entre 1 y 151
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/`);
        const data = await response.json();
        return {
            name: data.name.toLowerCase(),
            imageUrl: data.sprites.front_default,
            types: data.types.map(typeInfo => typeInfo.type.name), // Obtener tipos del Pokémon
            height: data.height, // Altura en decímetros
            weight: data.weight, // Peso en hectogramos
            speciesUrl: data.species.url // URL para obtener la información de evolución
        };
    }

    // Función para llenar el conjunto de nombres válidos de Pokémon
    async function loadValidPokemonNames() {
        for (let i = 1; i <= 151; i++) {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}/`);
            const data = await response.json();
            validPokemonNames.push(data.name.toLowerCase());
        }
    }

    // Función para obtener la etapa evolutiva del Pokémon ingresado
    async function fetchPokemonEvolutionStage(pokemonName) {
        const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}/`);
        const speciesData = await speciesResponse.json();
        const evolutionChainUrl = speciesData.evolution_chain.url;
        const chainResponse = await fetch(evolutionChainUrl);
        const chainData = await chainResponse.json();

        // Determinar la etapa evolutiva del Pokémon ingresado
        const stages = [];
        let current = chainData.chain;
        let stageNumber = 1;

        while (current) {
            stages.push({ name: current.species.name, stage: stageNumber });
            if (current.species.name === pokemonName) {
                return stageNumber; // Retornar la etapa del Pokémon ingresado
            }
            current = current.evolves_to[0]; // Solo se maneja la primera evolución
            stageNumber++;
        }
        return null; // Si no se encuentra la etapa
    }

    // Función para crear un cuadrado de contenido
    function createSquareContent(className, content, imageUrl = '', type = '') {
        const square = document.createElement('div');
        square.className = `square-content ${className}`;

        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = content;
            img.className = 'feedback-image';
            square.appendChild(img);
        }

        if (type) {
            const typeElement = document.createElement('div');
            typeElement.className = `type ${type}`;
            typeElement.textContent = type;
            square.appendChild(typeElement);
        }

        const text = document.createElement('p');
        text.textContent = content;
        square.appendChild(text);

        return square;
    }

    // Función para manejar un intento del usuario
    async function handleGuess() {
        if (!gameActive) return; // No hacer nada si el juego no está activo

        const guess = guessName.value.toLowerCase().trim();
        if (!validPokemonNames.includes(guess)) {
            alert('Nombre de Pokémon no válido.');
            return;
        }

        if (!currentPokemon) return; // Si no hay Pokémon actual, no hacer nada

        const { name, imageUrl, types, height, weight } = currentPokemon;

        // Obtener los datos del Pokémon ingresado
        const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${guess}/`);
        const pokemonJson = await pokemonData.json();

        // Crear cuadros para los atributos
        const result = document.createElement('div');
        result.className = 'attempt-container';

        // Verificar coincidencia y crear cuadros
        const isNameCorrect = guess === name;
        result.appendChild(createSquareContent(
            isNameCorrect ? 'correct' : 'incorrect',
            guess,
            pokemonJson.sprites.front_default
        ));

        // Agregar los tipos
        const typesData = pokemonJson.types.map(typeInfo => typeInfo.type.name);
        result.appendChild(createSquareContent(
            types[0] === typesData[0] ? 'correct' : 'incorrect',
            typesData[0] || 'N/A',
            '',
            typesData[0] || 'N/A'
        ));
        result.appendChild(createSquareContent(
            types[1] === typesData[1] ? 'correct' : 'incorrect',
            typesData[1] || 'N/A',
            '',
            typesData[1] || 'N/A'
        ));

        // Agregar altura
        result.appendChild(createSquareContent(
            height === pokemonJson.height ? 'correct' : 'incorrect',
            `Altura: ${pokemonJson.height / 10} m` // Convertir de decímetros a metros
        ));

        // Agregar peso
        result.appendChild(createSquareContent(
            weight === pokemonJson.weight ? 'correct' : 'incorrect',
            `Peso: ${pokemonJson.weight / 10} kg` // Convertir de hectogramos a kilogramos
        ));

        // Agregar etapa evolutiva
        const stage = await fetchPokemonEvolutionStage(guess);
        result.appendChild(createSquareContent(
            stage === (await fetchPokemonEvolutionStage(name)) ? 'correct' : 'incorrect',
            stage ? `Etapa ${stage}` : 'N/A'
        ));

        // Agregar el resultado al contenedor
        pokemonInfoContainer.appendChild(result);

        // Limpiar el campo de entrada
        guessName.value = '';

        if (guess === name) {
            alert('¡Correcto! Has adivinado el Pokémon.');
            gameActive = false;
            if (playAgainButton) {
                playAgainButton.classList.remove('hidden'); // Mostrar botón "Jugar de nuevo"
            }
        }
    }

    // Función para iniciar un nuevo juego
    async function startNewGame() {
        currentPokemon = await fetchRandomPokemon();
        gameActive = true;
        pokemonInfoContainer.innerHTML = ''; // Limpiar intentos anteriores
        guessName.value = ''; // Limpiar campo de entrada
        playAgainButton.classList.add('hidden'); // Ocultar botón "Jugar de nuevo"
    }

    // Inicializar el juego
    async function init() {
        await loadValidPokemonNames();
        await startNewGame();

        submitGuess.addEventListener('click', handleGuess);
        guessName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleGuess();
            }
        });
        playAgainButton.addEventListener('click', startNewGame);
    }

    init();
});
