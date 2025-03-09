<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchVersions, fetchBooks, fetchSearch, preloadVersion } from '../api/fetchData';
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
	let statusMessage = '';
	let loadingVersions = false;
  
	// Callback para actualizar el progreso
	const setProgress = (value: number): void => {
	  progress = value;
	  console.log(`Progreso actual: ${progress}%`);
	};
  
	// Cargar las versiones disponibles al montar el componente
	onMount(async () => {
	  try {
		loadingVersions = true;
		versions = await fetchVersions();
		console.log('Versiones cargadas:', versions);
	  } catch (err) {
		error = `Error al cargar versiones: ${(err as Error).message}`;
		console.error(error);
	  } finally {
		loadingVersions = false;
	  }
	});
  
	// Cargar libros cuando se selecciona una versión
	$: if (selectedVersion) {
	  loadBooks(selectedVersion);
	}
  
	async function loadBooks(version: string) {
	  try {
		books = await fetchBooks(version);
		console.log('Libros cargados:', books);
	  } catch (err) {
		error = `Error al cargar libros: ${(err as Error).message}`;
		console.error(error);
	  }
	}
  
	// Actualizar detalles del libro seleccionado
	$: if (selectedBook) {
	  bookDetails = books.find((book) => book.abrev === selectedBook) || null;
	}
  
	// Manejar la búsqueda
	async function handleSearch() {
	  if (!searchQuery.trim() || !selectedVersion) {
		alert('Por favor, selecciona una versión y escribe un término de búsqueda.');
		return;
	  }
  
	  try {
		loadingSearch = true;
		searchResults = { data: [], total: 0, page: 1, take: 100 };
		currentPage = 1;
  
		const response = await fetchSearch(selectedVersion, searchQuery, 100, currentPage);
		searchResults.data = response.data;
		searchResults.total = response.total;
	  } catch (err) {
		error = `Error al realizar la búsqueda: ${(err as Error).message}`;
		console.error(error);
	  } finally {
		loadingSearch = false;
	  }
	}
  
	// Descargar una versión específica
	async function downloadVersion(version: string) {
	  try {
		loading = true;
		selectedVersion = version;
		statusMessage = `Descargando la versión ${version}...`;
		await preloadVersion(version, setProgress);
		statusMessage = `Versión ${version} descargada correctamente.`;
	  } catch (err) {
		error = `Error al descargar la versión ${version}: ${(err as Error).message}`;
		statusMessage = 'Error al descargar la versión.';
		console.error(error);
	  } finally {
		loading = false;
	  }
	}
  </script>
  
  <!-- Barra de navegación -->
  <nav class="navbar navbar-expand-lg bg-dark shadow">
	<div class="container-fluid">
	  <p class="navbar-brand text-warning-emphasis fs-3 fw-bold">
		<i class="bi bi-book"></i> Biblia <strong>{selectedVersion || ''}</strong>
	  </p>
  
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
  
	  <div class="collapse navbar-collapse" id="navbarSupportedContent">
		<ul class="navbar-nav me-auto mb-2 mb-lg-0">
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
			  {:else if loadingVersions}
				<li>
				  <p class="dropdown-item">Cargando versiones...</p>
				</li>
			  {:else if versions.length > 0}
				{#each versions as version}
				  <li class="d-flex justify-content-between align-items-center">
					<button
					  class="dropdown-item text-warning-emphasis"
					  on:click={() => (selectedVersion = version.version)}
					>
					  {version.name}
					</button>
					<button
					  class="btn btn-sm btn-warning me-2"
					  on:click={() => downloadVersion(version.version)}
					  disabled={loading && selectedVersion === version.version}
					>
					  {loading && selectedVersion === version.version ? 'Descargando...' : 'Descargar'}
					</button>
				  </li>
				{/each}
			  {:else}
				<li>
				  <p class="dropdown-item">No se encontraron versiones disponibles.</p>
				</li>
			  {/if}
			</ul>
		  </li>
  
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