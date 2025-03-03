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
    let currentPage = 0; // Página actual de búsqueda

    // Cargar las versiones al montar el componente
    onMount(async () => {
        try {
            error = null; // Reiniciar error
            versions = await fetchVersions();
        } catch (err) {
            error = (err as Error).message;
        }
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
<nav class="navbar navbar-expand-lg bg-light"> 
    <div class="container-fluid">
        <h1 class="text-center text-warning-emphasis">BIBLIA <strong>{selectedVersion || ''}</strong></h1>
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
                            <label class="text-warning-emphasis">
                                SELECCIONA UNA VERSIÓN: <br />
                                <select bind:value={selectedVersion} on:change={loadBooks}>
                                    <option value="" disabled selected>Elige una versión</option>
                                    {#each versions as version}
                                        <option class="text-warning-emphasis" value={version.version}>{version.name}</option>
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
                            <label class="text-warning-emphasis">
                                SELECCIONA UN LIBRO: <br />
                                <select bind:value={selectedBook}>
                                    <option value="" disabled selected>Elige un libro</option>
                                    {#each books as book}
                                        <option class="text-warning-emphasis" value={book.abrev}>{book.names[0]}</option>
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
            </ul>

            <!-- Barra de búsqueda -->
            <div class="d-flex justify-content-center">
                <input type="text" placeholder="Buscar" bind:value={searchQuery} />
                <button on:click={handleSearch} class="btn btn-warning">Buscar</button>
            </div>
        </div>
    </div>
</nav>

<!-- Mensaje de bienvenida -->
{#if !selectedVersion && !selectedBook && !searchResults}
    <div class="text-center mt-5 p-4 text-warning-emphasis">
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
            <h3 class="text-warning-emphasis">Resultados de la búsqueda:</h3>
            <ul>
                {#each searchResults.data as result}
                    <li class="versiculo text-white">
                        <strong class="text-warning-emphasis">{result.book} {result.chapter}:{result.number}</strong> - {result.verse}
                    </li>
                {/each}
            </ul>
        {:else if searchQuery && searchResults && searchResults.data.length === 0}
            <p>No se encontraron resultados para "{searchQuery}".</p>
        {/if}
    </div>
</main>
