<script lang="ts">
	import { onMount } from 'svelte';
	import {
		fetchVersions,
		fetchBooks,
		fetchSearch,
		getFromIndexedDB,
		fetchChapter,
		preloadFullBible,
		isBibleFullyDownloaded,
		validateDownloadComplete,
		initializeApp // Añade esta línea
	} from '../api/fetchData';
	import type { Version, Book, SearchData } from '../api/fetchData';
	import Chapter from '../components/Chapter.svelte';

	// Variables principales
	let versions: Version[] = [];
	let selectedVersion: string | null = null;
	let books: Book[] = [];
	let selectedBook: string | null = null;
	let bookDetails: Book | null = null;
	let searchQuery: string = '';
	let searchResults: SearchData | null = null;
	let error: string | null = null;
	let loadingSearch = false;
	let currentPage = 0;
	let progress = 0;
	let loading = false;
	let statusMessage = 'Haz clic en iniciar para comenzar la descarga';
	let alreadyDownloaded = false;

	// Callback para actualizar el progreso
	const setProgress = (value: number): void => {
		progress = value;
		console.log(`Progreso actual: ${progress}%`);
	};

	// Verificar si ya se descargó al montar el componente
	onMount(async () => {
		const downloadState = localStorage.getItem('bibleDownloaded');
		alreadyDownloaded = downloadState === 'true';
		if (alreadyDownloaded) {
			statusMessage = 'Disculpa por la espera!';
		}

		// Inicializar la aplicación
		try {
			await initializeApp(setProgress);
			statusMessage = 'La aplicación está lista para usar sin conexión.';
		} catch (err) {
			error = `Error al inicializar la aplicación: ${(err as Error).message}`;
			statusMessage = 'Error durante la inicialización. Intenta nuevamente.';
		}
	});

	// Cargar las versiones disponibles al montar el componente
	onMount(async () => {
		try {
			error = null; // Reinicia errores
			versions = await fetchVersions();
		} catch (err) {
			error = `Error al cargar versiones: ${(err as Error).message}`;
		}
	});

	// Función para cargar los libros según la versión seleccionada
	async function loadBooks() {
		if (!selectedVersion) {
			error = 'Por favor, selecciona una versión válida.';
			return;
		}

		try {
			error = null; // Limpia errores
			books = await fetchBooks(selectedVersion);
			selectedBook = null;
			bookDetails = null;
		} catch (err) {
			error = `Error al cargar libros: ${(err as Error).message}`;
		}
	}

	// Actualizar detalles del libro seleccionado
	$: if (selectedBook) {
		bookDetails = books.find((book) => book.abrev === selectedBook) || null;
	}

	// Función para realizar búsquedas
	async function handleSearch() {
		if (!searchQuery.trim() || !selectedVersion) {
			alert('Por favor, selecciona una versión y escribe un término de búsqueda.');
			return;
		}

		try {
			loadingSearch = true;
			searchResults = { data: [], total: 0, page: 1, take: 100 };
			currentPage = 0;

			const totalPages = 50; // Límite arbitrario de páginas
			const promises = Array.from({ length: totalPages }, (_, index) => {
				const page = index + 1; // Página actual
				return fetchSearch(selectedVersion!, searchQuery, 100, page);
			});

			const responses = await Promise.all(promises);

			responses.forEach((response, index) => {
				currentPage = index + 1; // Actualiza la página actual
				if (response.data.length > 0) {
					searchResults!.data.push(...response.data); // Agrega resultados
				}
			});
		} catch (err) {
			error = `Error al realizar la búsqueda: ${(err as Error).message}`;
		} finally {
			loadingSearch = false; // Finaliza la carga
		}
	}

	// Función para simular la descarga
	async function simulateDownload() {
		loading = true;
		progress = 0;
		statusMessage = 'La descarga puede tardar unos minutos...';

		try {
			await preloadFullBible((value: number) => {
				progress = value; // Actualiza el progreso dinámicamente
			});

			const isComplete = await validateDownloadComplete(); // Verificar descarga completa
			if (isComplete) {
				statusMessage = '¡Descarga completa y validada!';
				alreadyDownloaded = true;
				localStorage.setItem('bibleDownloaded', 'true');
			} else {
				statusMessage = 'Error: algunos datos pueden faltar. Intenta nuevamente.';
			}
		} catch (error) {
			console.error('Error durante la descarga:', error);
			statusMessage = 'Error durante la descarga.';
		} finally {
			loading = false;
		}
	}
</script>

<!-- Barra de navegación -->
<nav class="navbar navbar-expand-lg bg-dark shadow">
	<div class="container-fluid">
		<!-- Logo or Title -->
		<p class="navbar-brand text-warning-emphasis fs-3 fw-bold">
			<i class="bi bi-book"></i> Biblia <strong>{selectedVersion || ''}</strong>
		</p>

		<!-- Mobile Toggle Button -->
		<button
			class="navbar-toggler border-warning"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#navbarSupportedContent"
			aria-controls="navbarSupportedContent"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon text-warning"></span>
		</button>

		<!-- Navbar Content -->
		<div class="collapse navbar-collapse" id="navbarSupportedContent">
			<ul class="navbar-nav me-auto mb-2 mb-lg-0">
				<!-- Version Selector -->
				<li class="nav-item dropdown">
					<button
						class="nav-link dropdown-toggle text-warning-emphasis fw-bold"
						id="versionDropdown"
						data-bs-toggle="dropdown"
						aria-expanded="false"
					>
						Selecciona Versión
					</button>
					<ul class="dropdown-menu">
						{#if error}
							<li>
								<p style="color: red;" class="dropdown-item">Error: {error}</p>
							</li>
						{:else if versions.length > 0}
							{#each versions as version}
								<li>
									<button
										class="dropdown-item text-warning-emphasis"
										on:click={() => {
											selectedVersion = version.version;
											loadBooks(); // Carga los libros al seleccionar una versión
										}}
									>
										{version.name}
									</button>
								</li>
							{/each}
						{:else}
							<li>
								<p class="dropdown-item">Cargando versiones...</p>
							</li>
						{/if}
					</ul>
				</li>

				<!-- Book Selector -->
				<li class="nav-item">
					<div class="d-flex align-items-center">
						{#if selectedVersion && books.length > 0}
							<p class="text-warning-emphasis me-2">Libro:</p>
							<select
								class="form-select form-select-sm bg-dark text-warning-emphasis border-warning"
								bind:value={selectedBook}
							>
								<option value="" disabled selected>Elige un libro</option>
								{#each books as book}
									<option value={book.abrev}>{book.names[0]}</option>
								{/each}
							</select>
						{:else if selectedVersion}
							<span class="spinner-border text-warning spinner-border-sm" role="status"></span>
						{:else}
							<p class="text-warning-emphasis">Selecciona una versión primero</p>
						{/if}
					</div>
				</li>
			</ul>

			<!-- Search Bar -->
			<form class="d-flex">
				<input
					class="form-control me-2 bg-dark text-warning-emphasis border-warning"
					type="search"
					placeholder="Buscar"
					aria-label="Search"
					bind:value={searchQuery}
				/>
				<button class="btn btn-outline-warning" type="button" on:click={handleSearch}>
					<i class="bi bi-search"></i> Buscar
				</button>
			</form>
		</div>
	</div>
</nav>

<!-- Mensaje de bienvenida -->
{#if !selectedVersion && !selectedBook && !searchResults}
	<div class="text-center mt-5 p-4 text-warning-emphasis">
		<h2>Bienvenidos a la Biblia Interactiva</h2>
		<p>Por favor, selecciona una versión o busca un versículo para comenzar.</p>
	</div>

	<h4 class="text-center mt-5 p-4 text-warning-emphasis">
		Si le das Descargar, se guardará en tu caché para que puedas usar la app de manera offline.
	</h4>
	<p class="text-center mt-5 p-4 text-warning-emphasis">{statusMessage}</p>

	<div class="d-flex justify-content-center mb-4">
		{#if !alreadyDownloaded}
			<button on:click={simulateDownload} disabled={loading || alreadyDownloaded}>
				{loading
					? `Descargando... ${progress}%`
					: alreadyDownloaded
						? 'Descarga completada'
						: 'Iniciar descarga'}
			</button>

			{#if error}
				<p style="color: red;">{error}</p>
			{/if}

			<p>{statusMessage}</p>
		{:else}
			<span class="text-success">¡La descarga está completa!</span>
		{/if}
	</div>

	{#if loading}
		<div class="progress">
			<div
				class="progress-bar progress-bar-striped progress-bar-animated bg-warning"
				role="progressbar"
				aria-valuenow={progress}
				aria-valuemin="0"
				aria-valuemax="100"
				style="width: {progress}%;color:black;"
			>
				{progress}%
			</div>
		</div>
	{/if}
{/if}

<!-- Componente del libro seleccionado -->
{#if selectedBook && bookDetails && selectedVersion}
	<Chapter {selectedBook} {selectedVersion} {bookDetails} />
{/if}

<!-- Resultados y mensajes -->
<main>
	<div class="resultados">
		{#if loadingSearch}
			<div class="d-flex justify-content-center" style="margin-top: 200px;">
				<div class="spinner-grow text-primary m-2" role="status"></div>
				<div class="spinner-grow text-secondary m-2" role="status"></div>
				<div class="spinner-grow text-success m-2" role="status"></div>
				<div class="spinner-grow text-warning m-2" role="status"></div>
			</div>
		{:else if searchResults && searchResults.data.length > 0}
			<h3 class="text-warning-emphasis mt-3">Resultados de la búsqueda:</h3>
			<ul>
				{#each searchResults.data as result}
					<li class="versiculo text-white">
						<strong class="text-warning-emphasis"
							>{result.book} {result.chapter}:{result.number}</strong
						>
						- {result.verse}
					</li>
				{/each}
			</ul>
		{:else if searchQuery && searchResults && searchResults.data.length === 0}
			<p>No se encontraron resultados para "{searchQuery}".</p>
		{/if}
	</div>
</main>
