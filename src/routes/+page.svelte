<script lang="ts">
	import { onMount } from 'svelte';
	import type { Book, Chapter } from '../typs';

	// Estado de la aplicación
	let selectedVersion = 'RVR1960';
	let selectedBook = 'GEN';
	let selectedChapter = '1';
	let selectedVerse: number | null = null;
	let bibleData: Book | null = null;
	let currentChapter: Chapter | null = null;
	let isLoading = false;
	let showSelectorDropdown = false;
	let searchTerm = '';
	let activeTab: 'version' | 'book' | 'chapter' | 'verse' = 'version';

	// Nuevas variables para la descarga
	let downloadProgress = 0;
	let isDownloading = false;
	let downloadedBooks = 0;
	let isOnline = true;
	let isBibleDownloaded = false;

	// Variables para comparación
	let compareMode = false;
	let secondVersion = 'NVI';
	let secondBibleData: Book | null = null;
	let secondCurrentChapter: Chapter | null = null;

	// Listas de selección
	const versions = [
		'DHH94I',
		'DHHS94',
		'LBLA',
		'NBLA',
		'NTV',
		'NVI',
		'RVA2015',
		'RVC',
		'RVR1960',
		'TLA',
		'TLAI'
	];
	
	const books = [
		'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
		'1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
		'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
		'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT',
		'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP',
		'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE',
		'2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
	];

	let totalBooks = books.length;

	// Mapa de capítulos por libro
	const bookChapters: Record<string, number> = {
		'GEN': 50, 'EXO': 40, 'LEV': 27, 'NUM': 36, 'DEU': 34,
		'JOS': 24, 'JDG': 21, 'RUT': 4, '1SA': 31, '2SA': 24,
		'1KI': 22, '2KI': 25, '1CH': 29, '2CH': 36, 'EZR': 10,
		'NEH': 13, 'EST': 10, 'JOB': 42, 'PSA': 150, 'PRO': 31,
		'ECC': 12, 'SNG': 8, 'ISA': 66, 'JER': 52, 'LAM': 5,
		'EZK': 48, 'DAN': 12, 'HOS': 14, 'JOL': 3, 'AMO': 9,
		'OBA': 1, 'JON': 4, 'MIC': 7, 'NAM': 3, 'HAB': 3,
		'ZEP': 3, 'HAG': 2, 'ZEC': 14, 'MAL': 4, 'MAT': 28,
		'MRK': 16, 'LUK': 24, 'JHN': 21, 'ACT': 28, 'ROM': 16,
		'1CO': 16, '2CO': 13, 'GAL': 6, 'EPH': 6, 'PHP': 4,
		'COL': 4, '1TH': 5, '2TH': 3, '1TI': 6, '2TI': 4,
		'TIT': 3, 'PHM': 1, 'HEB': 13, 'JAS': 5, '1PE': 5,
		'2PE': 3, '1JN': 5, '2JN': 1, '3JN': 1, 'JUD': 1,
		'REV': 22
	};

	// Mapa de nombres completos de los libros
	const bookFullNames: Record<string, string> = {
		'GEN': 'Génesis', 'EXO': 'Éxodo', 'LEV': 'Levítico', 'NUM': 'Números', 'DEU': 'Deuteronomio',
		'JOS': 'Josué', 'JDG': 'Jueces', 'RUT': 'Rut', '1SA': '1 Samuel', '2SA': '2 Samuel',
		'1KI': '1 Reyes', '2KI': '2 Reyes', '1CH': '1 Crónicas', '2CH': '2 Crónicas', 'EZR': 'Esdras',
		'NEH': 'Nehemías', 'EST': 'Ester', 'JOB': 'Job', 'PSA': 'Salmos', 'PRO': 'Proverbios',
		'ECC': 'Eclesiastés', 'SNG': 'Cantares', 'ISA': 'Isaías', 'JER': 'Jeremías', 'LAM': 'Lamentaciones',
		'EZK': 'Ezequiel', 'DAN': 'Daniel', 'HOS': 'Oseas', 'JOL': 'Joel', 'AMO': 'Amós',
		'OBA': 'Abdías', 'JON': 'Jonás', 'MIC': 'Miqueas', 'NAM': 'Nahúm', 'HAB': 'Habacuc',
		'ZEP': 'Sofonías', 'HAG': 'Hageo', 'ZEC': 'Zacarías', 'MAL': 'Malaquías', 'MAT': 'Mateo',
		'MRK': 'Marcos', 'LUK': 'Lucas', 'JHN': 'Juan', 'ACT': 'Hechos', 'ROM': 'Romanos',
		'1CO': '1 Corintios', '2CO': '2 Corintios', 'GAL': 'Gálatas', 'EPH': 'Efesios', 'PHP': 'Filipenses',
		'COL': 'Colosenses', '1TH': '1 Tesalonicenses', '2TH': '2 Tesalonicenses', '1TI': '1 Timoteo',
		'2TI': '2 Timoteo', 'TIT': 'Tito', 'PHM': 'Filemón', 'HEB': 'Hebreos', 'JAS': 'Santiago',
		'1PE': '1 Pedro', '2PE': '2 Pedro', '1JN': '1 Juan', '2JN': '2 Juan', '3JN': '3 Juan',
		'JUD': 'Judas', 'REV': 'Apocalipsis'
	};

	// Función para obtener los capítulos del libro actual
	function getChaptersForCurrentBook(): string[] {
		const chapterCount = bookChapters[selectedBook] || 1;
		return Array.from({ length: chapterCount }, (_, i) => (i + 1).toString());
	}

	// Función para obtener el nombre completo del libro
	function getBookFullName(bookCode: string): string {
		return bookFullNames[bookCode] || bookCode;
	}

	// Verificar conexión a internet
	function checkOnlineStatus() {
		isOnline = navigator.onLine;
	}

	// Descargar toda la Biblia para almacenamiento offline
	async function downloadBibleForOffline() {
		isDownloading = true;
		downloadedBooks = 0;
		downloadProgress = 0;

		try {
			const cache = await caches.open('bible-cache');

			for (const version of versions) {
				for (const book of books) {
					const url = `/${version}/${book}.json`;

					const cachedResponse = await cache.match(url);
					if (!cachedResponse) {
						try {
							const response = await fetch(url);
							if (response.ok) {
								await cache.put(url, response.clone());
							}
						} catch (error) {
							console.error(`Error descargando ${version}/${book}:`, error);
						}
					}

					downloadedBooks++;
					downloadProgress = Math.floor((downloadedBooks / (versions.length * books.length)) * 100);
				}
			}

			isBibleDownloaded = true;
			alert('¡Descarga completada! La Biblia está ahora disponible offline.');
		} catch (error) {
			console.error('Error en la descarga:', error);
			alert('Hubo un error durante la descarga. Por favor intenta nuevamente.');
		} finally {
			isDownloading = false;
		}
	}

	// Cargar la segunda versión para comparación
	async function loadSecondBible(version: string, book: string) {
		try {
			const url = `/${version}/${book}.json`;
			
			if (isOnline) {
				const response = await fetch(url);
				if (!response.ok) throw new Error(`Error ${response.status}`);
				secondBibleData = await response.json();
			} else {
				const cache = await caches.open('bible-cache');
				const cachedResponse = await cache.match(url);
				if (cachedResponse) {
					secondBibleData = await cachedResponse.json();
				} else {
					throw new Error('Libro no disponible offline');
				}
			}
		} catch (error) {
			console.error('Error cargando segunda versión:', error);
			secondBibleData = null;
		}
	}

	// Cargar datos de la Biblia
	async function loadBible(version: string, book: string) {
		try {
			isLoading = true;
			const url = `/${version}/${book}.json`;

			// Cargar versión principal
			if (isOnline) {
				const response = await fetch(url);
				if (!response.ok) throw new Error(`Error ${response.status}`);
				bibleData = await response.json();
			} else {
				const cache = await caches.open('bible-cache');
				const cachedResponse = await cache.match(url);
				if (cachedResponse) {
					bibleData = await cachedResponse.json();
				} else {
					throw new Error('Libro no disponible offline');
				}
			}

			// Si está en modo comparación, cargar segunda versión
			if (compareMode) {
				await loadSecondBible(secondVersion, book);
			}

			selectedVerse = null;
		} catch (error) {
			console.error('Error cargando la Biblia:', error);
			bibleData = null;
			secondBibleData = null;
		} finally {
			isLoading = false;
		}
	}

	// Alternar modo de comparación
	function toggleCompareMode() {
		compareMode = !compareMode;
		if (compareMode) {
			loadSecondBible(secondVersion, selectedBook);
		}
	}

	// Manejar cambios de selección
	function handleVersionChange(version: string) {
		selectedVersion = version;
		loadBible(selectedVersion, selectedBook);
	}

	function handleBookChange(book: string) {
		selectedBook = book;
		selectedChapter = '1';
		loadBible(selectedVersion, selectedBook);
		activeTab = 'chapter';
	}

	function handleChapterChange(chapter: string) {
		selectedChapter = chapter;
		activeTab = 'verse';
	}

	function handleVerseChange(verse: number | null) {
		selectedVerse = verse;
		if (verse) {
			scrollToVerse();
		}
		showSelectorDropdown = false;
	}

	// Desplazamiento a versículo
	function scrollToVerse() {
		if (selectedVerse) {
			const verseElement = document.getElementById(`verse-${selectedVerse}`) as HTMLElement;
			if (verseElement) {
				verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
				verseElement.classList.add('highlight-verse');
				setTimeout(() => {
					verseElement.classList.remove('highlight-verse');
				}, 2000);
			}
		}
	}

	// Filtrar opciones basadas en búsqueda
	function filterOptions(options: string[], search: string): string[] {
		return options.filter((option) => option.toLowerCase().includes(search.toLowerCase()));
	}

	// Efectos reactivos
	$: if (bibleData && selectedChapter) {
		currentChapter =
			bibleData?.chapters?.find((ch) => ch.chapter_usfm?.endsWith(selectedChapter)) || null;
	}

	$: if (secondBibleData && selectedChapter) {
		secondCurrentChapter =
			secondBibleData?.chapters?.find((ch) => ch.chapter_usfm?.endsWith(selectedChapter)) || null;
	}

	$: filteredVersions = filterOptions(versions, searchTerm);
	$: filteredBooks = filterOptions(books, searchTerm);
	$: filteredChapters = filterOptions(getChaptersForCurrentBook(), searchTerm);
	$: verses =
		currentChapter?.items
			?.filter((item) => item.type === 'verse')
			?.map((item) => item.verse_numbers[0].toString()) || [];
	$: filteredVerses = filterOptions(verses, searchTerm);

	// Carga inicial
	onMount(() => {
		checkOnlineStatus();
		window.addEventListener('online', checkOnlineStatus);
		window.addEventListener('offline', checkOnlineStatus);

		// Carga inicial
		loadBible(selectedVersion, selectedBook);

		return () => {
			window.removeEventListener('online', checkOnlineStatus);
			window.removeEventListener('offline', checkOnlineStatus);
		};
	});
</script>

<main class="container-fluid py-4 bg-gradient-primary">
    <div class="row justify-content-center">
        <div class="col-12 col-lg-10">
            {#if isLoading}
                <div class="text-center py-5">
                    <div class="spinner-border text-light" style="width: 3rem; height: 3rem;" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="h4 text-light mt-3">Cargando nueva versión...</p>
                </div>
            {:else}
                <div class="card shadow-lg mb-4">
                    <div class="card-header bg-dark text-white py-3">
                        <h2 class="h4 mb-0 text-center">
                            {#if bibleData && selectedChapter}
                                <span class="d-block d-md-inline">{getBookFullName(selectedBook)}</span>
                                <span class="d-none d-md-inline mx-2">-</span>
                                <span class="d-block d-md-inline">{selectedVersion}</span>
                                {#if compareMode}
                                    <span class="d-none d-md-inline mx-2">vs</span>
                                    <span class="d-block d-md-inline">{secondVersion}</span>
                                {/if}
                                <span class="d-none d-md-inline mx-2">-</span>
                                <span class="d-block d-md-inline">Capítulo {selectedChapter}</span>
                                {#if selectedVerse}
                                    <span class="d-none d-md-inline mx-2">-</span>
                                    <span class="d-block d-md-inline">Versículo {selectedVerse}</span>
                                {/if}
                            {:else}
                                Selecciona un libro y capítulo
                            {/if}
                        </h2>
                    </div>

                    <div class="card-body bg-light">
                        <!-- Sección de descarga offline -->
                        {#if !isBibleDownloaded && isOnline}
                            <div class="offline-section mb-4 p-3 bg-white rounded shadow-sm">
                                <h5 class="mb-3">
                                    <i class="bi bi-download me-2"></i> Descargar para uso offline
                                </h5>
                                <p class="text-muted mb-3">
                                    Descarga toda la Biblia para poder acceder a ella sin conexión a internet.
                                </p>

                                {#if isDownloading}
                                    <div class="progress mb-2">
                                        <div
                                            class="progress-bar progress-bar-striped progress-bar-animated"
                                            role="progressbar"
                                            style="width: {downloadProgress}%"
                                            aria-valuenow={downloadProgress}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        >
                                            {downloadProgress}%
                                        </div>
                                    </div>
                                    <small class="text-muted">
                                        Descargando... {downloadedBooks} de {totalBooks * versions.length} libros
                                    </small>
                                {:else}
                                    <button
                                        class="btn btn-success w-100"
                                        on:click={downloadBibleForOffline}
                                    >
                                        <i class="bi bi-cloud-arrow-down me-2"></i>
                                        Descargar Biblia completa
                                    </button>
                                {/if}
                            </div>
                        {/if}

                        <!-- Selector y botón de comparación -->
                        <div class="d-flex justify-content-between mb-3">
                            <button
                                class="btn btn-primary dropdown-toggle"
                                on:click={() => {
                                    showSelectorDropdown = !showSelectorDropdown;
                                    searchTerm = '';
                                }}
                            >
                                <i class="bi bi-gear-fill me-2"></i>Seleccionar
                            </button>
                            
                            <button 
                                class="btn {compareMode ? 'btn-outline-danger' : 'btn-outline-primary'}"
                                on:click={toggleCompareMode}
                            >
                                {#if compareMode}
                                    <i class="bi bi-x-circle me-2"></i>Salir de comparación
                                {:else}
                                    <i class="bi bi-file-diff me-2"></i>Comparar versiones
                                {/if}
                            </button>
                        </div>

                        <!-- Selector de segunda versión cuando esté en modo comparación -->
                        {#if compareMode && showSelectorDropdown === false}
                            <div class="mb-3">
                                <label class="form-label">Comparar con:</label>
                                <select 
                                    class="form-select" 
                                    bind:value={secondVersion}
                                    on:change={() => loadSecondBible(secondVersion, selectedBook)}
                                >
                                    {#each versions.filter(v => v !== selectedVersion) as version}
                                        <option value={version}>{version}</option>
                                    {/each}
                                </select>
                            </div>
                        {/if}

                        {#if showSelectorDropdown}
                            <div class="selector-dropdown shadow-lg">
                                <div class="search-box p-2 bg-light border-bottom">
                                    <input
                                        type="text"
                                        class="form-control"
                                        placeholder="Buscar..."
                                        bind:value={searchTerm}
                                        autofocus
                                    />
                                </div>

                                <ul class="nav nav-tabs">
                                    <li class="nav-item">
                                        <button
                                            class="nav-link {activeTab === 'version' ? 'active' : ''}"
                                            on:click={() => (activeTab = 'version')}
                                        >
                                            Versión
                                        </button>
                                    </li>
                                    <li class="nav-item">
                                        <button
                                            class="nav-link {activeTab === 'book' ? 'active' : ''}"
                                            on:click={() => (activeTab = 'book')}
                                        >
                                            Libro
                                        </button>
                                    </li>
                                    <li class="nav-item">
                                        <button
                                            class="nav-link {activeTab === 'chapter' ? 'active' : ''}"
                                            on:click={() => (activeTab = 'chapter')}
                                            disabled={!selectedBook}
                                        >
                                            Capítulo
                                        </button>
                                    </li>
                                    <li class="nav-item">
                                        <button
                                            class="nav-link {activeTab === 'verse' ? 'active' : ''}"
                                            on:click={() => (activeTab = 'verse')}
                                            disabled={!selectedChapter || !currentChapter}
                                        >
                                            Versículo
                                        </button>
                                    </li>
                                </ul>

                                <div class="dropdown-options">
                                    {#if activeTab === 'version'}
                                        {#each filteredVersions as version}
                                            <div
                                                class="dropdown-option {selectedVersion === version ? 'active' : ''}"
                                                on:click={() => {
                                                    handleVersionChange(version);
                                                    activeTab = 'book';
                                                }}
                                            >
                                                {version}
                                            </div>
                                        {/each}
                                    {:else if activeTab === 'book'}
                                        {#each filteredBooks as book}
                                            <div
                                                class="dropdown-option {selectedBook === book ? 'active' : ''}"
                                                on:click={() => {
                                                    handleBookChange(book);
                                                    activeTab = 'chapter';
                                                }}
                                            >
                                                {getBookFullName(book)}
                                            </div>
                                        {/each}
                                    {:else if activeTab === 'chapter'}
                                        {#each getChaptersForCurrentBook() as chapter}
                                            {#if searchTerm === '' || chapter.includes(searchTerm)}
                                                <div
                                                    class="dropdown-option {selectedChapter === chapter ? 'active' : ''}"
                                                    on:click={() => {
                                                        handleChapterChange(chapter);
                                                        activeTab = 'verse';
                                                    }}
                                                >
                                                    Capítulo {chapter}
                                                </div>
                                            {/if}
                                        {/each}
                                    {:else if activeTab === 'verse'}
                                        <div
                                            class="dropdown-option {selectedVerse === null ? 'active' : ''}"
                                            on:click={() => handleVerseChange(null)}
                                        >
                                            Todos los versículos
                                        </div>
                                        {#each filteredVerses as verse}
                                            <div
                                                class="dropdown-option {selectedVerse?.toString() === verse
                                                    ? 'active'
                                                    : ''}"
                                                on:click={() => handleVerseChange(parseInt(verse))}
                                            >
                                                Versículo {verse}
                                            </div>
                                        {/each}
                                    {/if}
                                </div>
                            </div>
                        {/if}

                        <!-- Contenido bíblico -->
                        {#if bibleData && currentChapter}
                            <div class="bg-white p-4 rounded shadow-sm bible-content">
                                {#if compareMode && secondCurrentChapter}
                                    <!-- Modo comparación - dos columnas -->
                                    <div class="row">
                                        <div class="col-md-6 pe-md-3 border-end">
                                            <h5 class="text-center text-primary mb-3">{selectedVersion}</h5>
                                            <div class="bible-text fs-5 scroll-sync">
                                                {#each currentChapter?.items as item}
                                                    {#if item.type === 'verse'}
                                                        <div
                                                            class="verse mb-3 p-3 bg-light rounded {selectedVerse?.toString() === item.verse_numbers[0].toString() ? 'verse-difference' : ''}"
                                                            id={'verse-' + item.verse_numbers[0]}
                                                        >
                                                            <sup class="verse-number badge bg-primary me-2"
                                                                >{item.verse_numbers.join(', ')}</sup
                                                            >
                                                            <span class="verse-text">{item.lines.join(' ')}</span>
                                                        </div>
                                                    {/if}
                                                {/each}
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-6 ps-md-3">
                                            <h5 class="text-center text-primary mb-3">{secondVersion}</h5>
                                            <div class="bible-text fs-5 scroll-sync">
                                                {#each secondCurrentChapter?.items as item}
                                                    {#if item.type === 'verse'}
                                                        <div
                                                            class="verse mb-3 p-3 bg-light rounded {selectedVerse?.toString() === item.verse_numbers[0].toString() ? 'verse-difference' : ''}"
                                                            id={'verse2-' + item.verse_numbers[0]}
                                                        >
                                                            <sup class="verse-number badge bg-primary me-2"
                                                                >{item.verse_numbers.join(', ')}</sup
                                                            >
                                                            <span class="verse-text">{item.lines.join(' ')}</span>
                                                        </div>
                                                    {/if}
                                                {/each}
                                            </div>
                                        </div>
                                    </div>
                                {:else}
                                    <!-- Modo normal - una sola versión -->
                                    <div class="bible-text fs-5">
                                        {#each currentChapter?.items as item}
                                            {#if item.type === 'verse'}
                                                <div
                                                    class="verse mb-3 p-3 bg-light rounded"
                                                    id={'verse-' + item.verse_numbers[0]}
                                                >
                                                    <sup class="verse-number badge bg-primary me-2"
                                                        >{item.verse_numbers.join(', ')}</sup
                                                    >
                                                    <span class="verse-text">{item.lines.join(' ')}</span>
                                                </div>
                                            {/if}
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <div class="text-center py-5">
                                <i class="bi bi-book fs-1 text-muted"></i>
                                <p class="h4 text-muted mt-3">
                                    {selectedBook ? 'Selecciona un capítulo' : 'Selecciona un libro'}
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    </div>
</main>

<style>
    /* Estilos principales */
    .bg-gradient-primary {
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        min-height: 100vh;
    }

    /* Estilos para versículos */
    .verse {
        transition: all 0.3s ease;
        line-height: 1.8;
        background-color: #f8f9fa;
    }

    .verse:hover {
        background-color: #e9f5ff !important;
        transform: translateX(3px);
    }

    .verse-number {
        font-size: 0.8em;
        position: relative;
        top: -0.5em;
    }

    /* Selector dropdown */
    .selector-dropdown {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        top: 100px;
        width: 90%;
        max-width: 500px;
        max-height: 70vh;
        background: white;
        border-radius: 8px;
        z-index: 1000;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
    }

    .search-box {
        position: sticky;
        top: 0;
        z-index: 10;
        background-color: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
    }

    .dropdown-options {
        overflow-y: auto;
        flex-grow: 1;
        padding: 10px 0;
    }

    .dropdown-option {
        padding: 10px 20px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .dropdown-option:hover {
        background-color: #f0f7ff;
    }

    .dropdown-option.active {
        background-color: #e0f0ff;
        font-weight: bold;
    }

    /* Efecto de resaltado */
    .highlight-verse {
        animation: highlight 2s ease;
        background-color: #e0f0ff;
        box-shadow: 0 0 0 2px #a0c4ff;
    }

    @keyframes highlight {
        0% {
            background-color: #e0f0ff;
        }
        100% {
            background-color: inherit;
        }
    }

    /* Sección offline */
    .offline-section {
        border-left: 4px solid #28a745;
        background-color: #ffffff;
    }

    /* Progress bar */
    .progress {
        height: 1.5rem;
        border-radius: 0.25rem;
        background-color: #e9ecef;
    }

    .progress-bar {
        background-color: #28a745;
        font-size: 0.8rem;
        line-height: 1.5rem;
    }

    /* Estilos para el modo de comparación */
    .scroll-sync {
        height: 60vh;
        overflow-y: auto;
        scroll-behavior: smooth;
    }

    .verse-difference {
        background-color: #fff8e1;
        border-left: 3px solid #ffc107;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .bible-text {
            font-size: 1rem !important;
        }

        .selector-dropdown {
            width: 95%;
            max-height: 60vh;
            top: 80px;
        }

        .nav-tabs .nav-item {
            font-size: 0.8rem;
            padding: 0.25rem;
        }

        .scroll-sync {
            height: 40vh;
        }
    }

    /* Clases de utilidad */
    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .shadow-sm {
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }

    .shadow-lg {
        box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
    }

    .rounded {
        border-radius: 0.25rem;
    }
</style>