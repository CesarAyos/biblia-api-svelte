<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchVersions, fetchBooks, fetchSearch } from '../api/fetchData.js';
	import type { Version, Book, SearchData } from '../api/fetchData.js';
	import Chapter from '../components/Chapter.svelte';

	// Variables principales
	let versions: Version[] = [];
	let selectedVersion: string | null = null; // La versión seleccionada
	let books: Book[] = [];
	let selectedBook: string | null = null; // El libro seleccionado
	let bookDetails: Book | null = null; // Detalles del libro seleccionado
	let searchQuery: string = ''; // Consulta de búsqueda
	let searchResults: SearchData | null = null; // Resultados de búsqueda
	let error: string | null = null; // Mensaje de error
	let loadingSearch = false; // Estado de carga
	let darkMode = false; // Estado del modo oscuro
	let currentPage = 0; // Página actual de búsqueda

	// Cargar las versiones al montar el componente
	onMount(async () => {
		try {
			error = null; // Reiniciar error
			versions = await fetchVersions();
		} catch (err) {
			error = (err as Error).message;
		}
		darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		document.body.classList.toggle('dark-mode', darkMode);

		initializeDarkMode();
	});

	// Función para cargar los libros según la versión seleccionada
	async function loadBooks() {
		if (!selectedVersion) {
			error = 'Por favor, selecciona una versión válida.';
			return;
		}

		try {
			error = null; // Limpiar errores
			books = await fetchBooks(selectedVersion);
			selectedBook = null;
			bookDetails = null;
		} catch (err) {
			error = (err as Error).message;
		}
	}

	// Actualizar detalles del libro seleccionado
	$: if (selectedBook) {
		bookDetails = books.find((book) => book.abrev === selectedBook) || null;
	}

	// Función para alternar el modo oscuro
	function toggleDarkMode() {
		darkMode = !darkMode;
		document.body.classList.toggle('dark-mode', darkMode);
		localStorage.setItem('darkMode', darkMode.toString());
	}

	function initializeDarkMode() {
		const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const userPreference = localStorage.getItem('darkMode');
		darkMode = userPreference ? userPreference === 'true' : systemPrefersDark;

		console.log('Modo oscuro activado:', darkMode); // Agregar un log para depuración

		if (darkMode) {
			document.body.classList.add('dark-mode');
		} else {
			document.body.classList.remove('dark-mode');
		}
	}

	// Función para realizar búsquedas
	async function handleSearch() {
		if (!searchQuery.trim() || !selectedVersion) {
			alert('Por favor, selecciona una versión y escribe un término de búsqueda.');
			return;
		}

		try {
			loadingSearch = true; // Mostrar el estado de carga
			searchResults = { data: [], total: 0, page: 1, take: 100 };
			currentPage = 0; // Reiniciar progreso

			const totalPages = 50; // Límite de páginas
			const promises = Array.from({ length: totalPages }, (_, index) => {
				const page = index + 1; // Página actual
				return fetchSearch(selectedVersion!, searchQuery, 100, page);
			});

			const responses = await Promise.all(promises);

			responses.forEach((response, index) => {
				currentPage = index + 1; // Actualizar la página actual
				if (response.data.length > 0) {
					searchResults!.data.push(...response.data); // Agregar resultados
				}
			});
		} catch (err) {
			error = `Error al realizar la búsqueda: ${(err as Error).message}`;
		} finally {
			loadingSearch = false; // Terminar el estado de carga
		}
	}
</script>

<!-- Barra de navegación -->
<nav class="navbar navbar-expand-lg bg-body-tertiary">
	<div class="container-fluid">
		<h1 class="text-center">BIBLIA <strong>{selectedVersion || ''}</strong></h1>
		<button
			class="navbar-toggler"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#navbarSupportedContent"
			aria-controls="navbarSupportedContent"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon"></span>
		</button>

		<div class="collapse navbar-collapse" id="navbarSupportedContent">
			<ul class="navbar-nav me-auto mb-2 mb-lg-0">
				<!-- Selector de versiones -->
				<li class="nav-item">
					<div class="d-flex justify-content-center p-4">
						{#if error}
							<p style="color: red;">Error: {error}</p>
						{:else}
							<label class="text-dark">
								SELECCIONA UNA VERSIÓN: <br />
								<select bind:value={selectedVersion} on:change={loadBooks}>
									<option value="" disabled selected>Elige una versión</option>
									{#each versions as version}
										<option value={version.version}>{version.name}</option>
									{/each}
								</select>
							</label>
						{/if}
					</div>
				</li>

				<!-- Selector de libros -->
				<li class="nav-item">
					<div class="d-flex justify-content-center p-4">
						{#if selectedVersion && books.length > 0}
							<label class="text-dark">
								SELECCIONA UN LIBRO: <br />
								<select bind:value={selectedBook}>
									<option value="" disabled selected>Elige un libro</option>
									{#each books as book}
										<option value={book.abrev}>{book.names[0]}</option>
									{/each}
								</select>
							</label>
						{:else if selectedVersion}
							<div class="spinner-border text-primary" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
							<div class="spinner-border text-secondary" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
							<div class="spinner-border text-success" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
							<div class="spinner-border text-danger" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
							<div class="spinner-border text-warning" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
							<div class="spinner-border text-info" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
							<div class="spinner-border text-light" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
							<div class="spinner-border text-dark" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
						{/if}
					</div>
				</li>

				<!-- Botón de modo oscuro -->
				<li class="nav-item">
					<div>
						<button on:click={toggleDarkMode} class="btn btn-primary">
							{darkMode ? 'Claro' : 'Oscuro'}
						</button>
					</div>
				</li>
			</ul>

			<!-- Barra de búsqueda -->
			<div class="d-flex justify-content-center">
				<input type="text" placeholder="Buscar" bind:value={searchQuery} />
				<button on:click={handleSearch} class="btn btn-primary">Buscar</button>
			</div>
		</div>
	</div>
</nav>
<!-- Mensaje de bienvenida -->
{#if !selectedVersion && !selectedBook && !searchResults}
	<div class="welcome-message">
		<h2>Bienvenidos a la Biblia Interactiva</h2>
		<p>Por favor, selecciona una versión o busca un versículo para comenzar.</p>
	</div>
{/if}

{#if selectedBook && bookDetails && selectedVersion}
	<Chapter {selectedBook} {selectedVersion} {bookDetails} />
{/if}

<!-- Resultados y mensajes -->
<main>
	<div class="resultados">
		{#if loadingSearch}
			<div class="d-flex justify-content-center" style="margin-top: 200px;">
				<div class="spinner-grow text-primary m-2" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
				<div class="spinner-grow text-secondary m-2" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
				<div class="spinner-grow text-success m-2" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
				<div class="spinner-grow text-danger m-2" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
				<div class="spinner-grow text-warning m-2" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
				<div class="spinner-grow text-info m-2" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
				<div class="spinner-grow text-light m-2" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
				<div class="spinner-grow text-dark m-2" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
			</div>
		{:else if searchResults && searchResults.data.length > 0}
			<h3>Resultados de la búsqueda:</h3>
			<ul>
				{#each searchResults.data as result}
					<li class="versiculo">
						<strong>{result.book} {result.chapter}:{result.number}</strong> - {result.verse}
					</li>
				{/each}
			</ul>
		{:else if searchQuery && searchResults && searchResults.data.length === 0}
			<p>No se encontraron resultados para "{searchQuery}".</p>
		{/if}
	</div>
</main>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap');

	.welcome-message {
		text-align: center;
		margin-top: 50px;
		padding: 20px;
		background-color: var(--background-color, white);
		color: var(--text-color, black);
		border-radius: 10px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.welcome-message h2 {
		font-size: 2rem;
		color: var(--accent-color, #ff9050);
	}

	.welcome-message p {
		font-size: 1.2rem;
		margin-top: 10px;
	}

	:global(:root) {
		--background-color: white;
		--text-color: black;
	}

	:global(body.dark-mode) {
		--background-color: #1e1e2f;
		--text-color: #e0e0e0;
	}

	:global(body) {
		background-color: var(--background-color);
		color: var(--text-color);
		transition:
			background-color 0.5s,
			color 0.5s;
	}

	:global(.versiculo, .libro, .resultados) {
		background-color: var(--background-color);
		color: var(--text-color);
		transition:
			background-color 0.5s,
			color 0.5s;
	}

	:global(select),
	:global(button) {
		border: none;
		border-radius: 8px;
		box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
		padding: 10px 15px;
		font-size: 1rem;
		cursor: pointer;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}

	:global(select:hover),
	:global(button:hover) {
		transform: translateY(-2px);
		box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.15);
	}

	:global(label) {
		color: black; /* Asegura que el texto sea negro en modo claro */
	}

	:global(body.dark-mode label) {
		color: var(--text-color, white); /* Ajusta el color para el modo oscuro */
	}

	:global(h1) {
		background: linear-gradient(90deg, #ff6550, #ff9050);
		background-clip: text; /* Standard property for broader compatibility */
		-webkit-background-clip: text; /* Webkit-specific for Chrome and Safari */
		-webkit-text-fill-color: transparent; /* Makes the text transparent to show the gradient */
		font-size: 2.5rem;
		text-align: center;
		margin-bottom: 20px;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(select option) {
		animation: fadeIn 0.5s ease-in-out;
	}

	button:hover {
		opacity: 0.8;
	}
</style>
