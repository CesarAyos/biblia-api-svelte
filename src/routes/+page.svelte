<script lang="ts">
	import { onMount } from 'svelte';
	import type { Book, Chapter, ChapterItem } from '../typs';
	import { writable } from 'svelte/store';

	export const searchResults = writable<SearchResult[]>([]);

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
	let showCopiedMessage = false;
	let copiedMessageTimeout: number;

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

	// Control de tamaño de fuente
	let fontSize = 16;
	const minFontSize = 12;
	const maxFontSize = 24;
	const step = 1;

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
		'GEN',
		'EXO',
		'LEV',
		'NUM',
		'DEU',
		'JOS',
		'JDG',
		'RUT',
		'1SA',
		'2SA',
		'1KI',
		'2KI',
		'1CH',
		'2CH',
		'EZR',
		'NEH',
		'EST',
		'JOB',
		'PSA',
		'PRO',
		'ECC',
		'SNG',
		'ISA',
		'JER',
		'LAM',
		'EZK',
		'DAN',
		'HOS',
		'JOL',
		'AMO',
		'OBA',
		'JON',
		'MIC',
		'NAM',
		'HAB',
		'ZEP',
		'HAG',
		'ZEC',
		'MAL',
		'MAT',
		'MRK',
		'LUK',
		'JHN',
		'ACT',
		'ROM',
		'1CO',
		'2CO',
		'GAL',
		'EPH',
		'PHP',
		'COL',
		'1TH',
		'2TH',
		'1TI',
		'2TI',
		'TIT',
		'PHM',
		'HEB',
		'JAS',
		'1PE',
		'2PE',
		'1JN',
		'2JN',
		'3JN',
		'JUD',
		'REV'
	];

	let totalBooks = books.length;

	// Mapa de capítulos por libro
	const bookChapters: Record<string, number> = {
		GEN: 50,
		EXO: 40,
		LEV: 27,
		NUM: 36,
		DEU: 34,
		JOS: 24,
		JDG: 21,
		RUT: 4,
		'1SA': 31,
		'2SA': 24,
		'1KI': 22,
		'2KI': 25,
		'1CH': 29,
		'2CH': 36,
		EZR: 10,
		NEH: 13,
		EST: 10,
		JOB: 42,
		PSA: 150,
		PRO: 31,
		ECC: 12,
		SNG: 8,
		ISA: 66,
		JER: 52,
		LAM: 5,
		EZK: 48,
		DAN: 12,
		HOS: 14,
		JOL: 3,
		AMO: 9,
		OBA: 1,
		JON: 4,
		MIC: 7,
		NAM: 3,
		HAB: 3,
		ZEP: 3,
		HAG: 2,
		ZEC: 14,
		MAL: 4,
		MAT: 28,
		MRK: 16,
		LUK: 24,
		JHN: 21,
		ACT: 28,
		ROM: 16,
		'1CO': 16,
		'2CO': 13,
		GAL: 6,
		EPH: 6,
		PHP: 4,
		COL: 4,
		'1TH': 5,
		'2TH': 3,
		'1TI': 6,
		'2TI': 4,
		TIT: 3,
		PHM: 1,
		HEB: 13,
		JAS: 5,
		'1PE': 5,
		'2PE': 3,
		'1JN': 5,
		'2JN': 1,
		'3JN': 1,
		JUD: 1,
		REV: 22
	};

	// Mapa de nombres completos de los libros
	const bookFullNames: Record<string, string> = {
		GEN: 'Génesis',
		EXO: 'Éxodo',
		LEV: 'Levítico',
		NUM: 'Números',
		DEU: 'Deuteronomio',
		JOS: 'Josué',
		JDG: 'Jueces',
		RUT: 'Rut',
		'1SA': '1 Samuel',
		'2SA': '2 Samuel',
		'1KI': '1 Reyes',
		'2KI': '2 Reyes',
		'1CH': '1 Crónicas',
		'2CH': '2 Crónicas',
		EZR: 'Esdras',
		NEH: 'Nehemías',
		EST: 'Ester',
		JOB: 'Job',
		PSA: 'Salmos',
		PRO: 'Proverbios',
		ECC: 'Eclesiastés',
		SNG: 'Cantares',
		ISA: 'Isaías',
		JER: 'Jeremías',
		LAM: 'Lamentaciones',
		EZK: 'Ezequiel',
		DAN: 'Daniel',
		HOS: 'Oseas',
		JOL: 'Joel',
		AMO: 'Amós',
		OBA: 'Abdías',
		JON: 'Jonás',
		MIC: 'Miqueas',
		NAM: 'Nahúm',
		HAB: 'Habacuc',
		ZEP: 'Sofonías',
		HAG: 'Hageo',
		ZEC: 'Zacarías',
		MAL: 'Malaquías',
		MAT: 'Mateo',
		MRK: 'Marcos',
		LUK: 'Lucas',
		JHN: 'Juan',
		ACT: 'Hechos',
		ROM: 'Romanos',
		'1CO': '1 Corintios',
		'2CO': '2 Corintios',
		GAL: 'Gálatas',
		EPH: 'Efesios',
		PHP: 'Filipenses',
		COL: 'Colosenses',
		'1TH': '1 Tesalonicenses',
		'2TH': '2 Tesalonicenses',
		'1TI': '1 Timoteo',
		'2TI': '2 Timoteo',
		TIT: 'Tito',
		PHM: 'Filemón',
		HEB: 'Hebreos',
		JAS: 'Santiago',
		'1PE': '1 Pedro',
		'2PE': '2 Pedro',
		'1JN': '1 Juan',
		'2JN': '2 Juan',
		'3JN': '3 Juan',
		JUD: 'Judas',
		REV: 'Apocalipsis'
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

		markBibleAsDownloaded();
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

	// Control de tamaño de fuente
	function increaseFontSize() {
		if (fontSize < maxFontSize) {
			fontSize += step;
			applyFontSize();
		}
	}

	function decreaseFontSize() {
		if (fontSize > minFontSize) {
			fontSize -= step;
			applyFontSize();
		}
	}

	function applyFontSize() {
		document.documentElement.style.setProperty('--bible-font-size', `${fontSize}px`);
		localStorage.setItem('bibleFontSize', fontSize.toString());
	}

	// Copiar versículo
	let pressTimer: number;
	let pressedVerse: HTMLElement | null = null;

	function handleVersePressStart(event: MouseEvent | TouchEvent, verseNumber: number, verseText: string) {
		pressedVerse = event.currentTarget as HTMLElement;
		pressTimer = window.setTimeout(() => {
			copyVerse(verseNumber, verseText);
			pressedVerse?.classList.add('verse-copied');
			setTimeout(() => {
				pressedVerse?.classList.remove('verse-copied');
				pressedVerse = null;
			}, 2000);
		}, 1000); // 1 segundo para activar la copia
	}

	function handleVersePressEnd() {
		if (pressTimer) {
			clearTimeout(pressTimer);
		}
	}

	function copyVerse(verseNumber: number, verseText: string) {
		const bookName = getBookFullName(selectedBook);
		const textToCopy = `${bookName} ${selectedChapter}:${verseNumber} - ${verseText}`;
		
		navigator.clipboard.writeText(textToCopy).then(() => {
			showCopiedMessage = true;
			clearTimeout(copiedMessageTimeout);
			copiedMessageTimeout = window.setTimeout(() => {
				showCopiedMessage = false;
			}, 2000);
		}).catch(err => {
			console.error('Error al copiar:', err);
		});
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
		const savedSize = localStorage.getItem('bibleFontSize');
		if (savedSize) {
			fontSize = parseInt(savedSize);
			applyFontSize();
		}
		checkOnlineStatus();
		checkDownloadStatus();
		window.addEventListener('online', checkOnlineStatus);
		window.addEventListener('offline', checkOnlineStatus);
		loadBible(selectedVersion, selectedBook);

		return () => {
			window.removeEventListener('online', checkOnlineStatus);
			window.removeEventListener('offline', checkOnlineStatus);
		};
	});

	function markBibleAsDownloaded() {
		localStorage.setItem('bibleDownloaded', 'true');
		isBibleDownloaded = true;
	}

	function checkDownloadStatus() {
		const downloaded = localStorage.getItem('bibleDownloaded') === 'true';
		isBibleDownloaded = downloaded;
	}

	type SearchResult = {
		book: string;
		chapter: string;
		verse: string;
		text: string;
	};

	async function searchVerses(searchTerm: string) {
		if (!searchTerm.trim()) {
			searchResults.set([]);
			return;
		}

		const results: SearchResult[] = [];

		for (const book of books) {
			try {
				const url = `/${selectedVersion}/${book}.json`;
				let bookData: Book | null = null;

				if (isOnline) {
					const response = await fetch(url);
					if (!response.ok) throw new Error(`Error ${response.status}`);
					bookData = await response.json();
				} else {
					const cache = await caches.open('bible-cache');
					const cachedResponse = await cache.match(url);
					if (cachedResponse) {
						bookData = await cachedResponse.json();
					} else {
						console.warn(`Libro no disponible offline: ${book}`);
						continue;
					}
				}

				bookData?.chapters.forEach((chapter) => {
					chapter.items.forEach((item) => {
						if (item.type === 'verse') {
							const verseText = item.lines?.join(' ') || '';
							if (verseText.toLowerCase().includes(searchTerm.toLowerCase())) {
								results.push({
									book: getBookFullName(book),
									chapter: chapter.chapter_usfm.replace(/\D/g, ''),
									verse: item.verse_numbers?.join(', ') || '',
									text: verseText
								});
							}
						}
					});
				});
			} catch (error) {
				console.error(`Error cargando el libro ${book}:`, error);
			}
		}

		searchResults.set(results);
	}

	function handleSearch() {
		searchVerses(searchTerm);
	}
</script>

<button id="theme-toggle" class="btn btn-outline-secondary" aria-label="dark"
	><i class="fa-solid fa-circle-half-stroke"></i></button
>

<div class="d-flex bg-body justify-content-center m-2 scroll z-2">
	<input type="text" bind:value={searchTerm} placeholder="Buscar en la biblia" />
	<button class="btn btn-warning" on:click={handleSearch}>Buscar</button>
</div>

<div class="container bg-body text-body z-3">
	{#if $searchResults.length > 0}
		<ul class="list-group" role="list" aria-live="polite">
			{#each $searchResults as result}
				<li class="list-group-item bg-body text-body" role="listitem">
					<strong>{result.book} {result.chapter}:{result.verse}</strong> - {result.text}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<main
	class="container-fluid bg-body text-body py-4 bg-gradient-primary"
	style="padding-top: 60px; padding-bottom: 60px; font-size: var(--bible-font-size)"
>
	<div class="row justify-content-center">
		<div class="col-12 col-lg-10">
			{#if isLoading}
				<div class="text-center py-5">
					<div class="spinner-border text-body" style="width: 3rem; height: 3rem;" role="status">
						<span class="visually-hidden">Cargando...</span>
					</div>
					<p class="h4 text-body mt-3">Cargando nueva versión...</p>
				</div>
			{:else}
				<div class="card shadow-lg mb-4">
					<div class="card-header bg- textbody-white py-2 scroll2 z-3">
						<div class="d-flex flex-wrap align-items-center justify-content-between">
							<div class="d-flex align-items-center">
								{#if bibleData && selectedChapter}
									<span class="fw-bold me-2">{getBookFullName(selectedBook)}</span>
									<span class="separator d-none d-md-inline me-2">|</span>
									<span class="badge bg-body text-body me-2">{selectedVersion}</span>

									{#if compareMode}
										<span class="text-body me-2">vs</span>
										<span class="badge bg-secondary me-2">{secondVersion}</span>
									{/if}

									<span class="separator d-none d-md-inline me-2">|</span>
									<span class="me-2"
										>Capítulo <span class="badge bg-info">{selectedChapter}</span></span
									>

									{#if selectedVerse}
										<span class="separator d-none d-md-inline me-2">|</span>
										<span>Versículo <span class="badge bg-success">{selectedVerse}</span></span>
									{/if}
								{:else}
									<span class="fst-italic">Selecciona un libro y capítulo</span>
								{/if}
							</div>
							
							<!-- <div class="font-size-controls">
								<button
									class="btn btn-sm btn-outline-secondary"
									on:click={decreaseFontSize}
									aria-label="Reducir tamaño de fuente"
								>
									<i class="fa-solid fa-font fa-sm"></i> <i class="fa-solid fa-minus fa-xs"></i>
								</button>

								<span class="mx-2">{fontSize}px</span>

								<button
									class="btn btn-sm btn-outline-secondary"
									on:click={increaseFontSize}
									aria-label="Aumentar tamaño de fuente"
								>
									<i class="fa-solid fa-font fa-sm"></i> <i class="fa-solid fa-plus fa-xs"></i>
								</button>
							</div> -->
						</div>
					</div>

					<div class="card-body bg-body">
						<!-- Sección de descarga offline -->
						{#if !isBibleDownloaded && isOnline}
							<div class="offline-section mb-4 p-3 bg-body rounded shadow-sm">
								<h5 class="mb-3">
									<i class="bi bi-download me-2"></i> Descargar para uso offline
								</h5>
								<p class="text-body mb-3">
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
									<small class="text-body">
										Descargando... {downloadedBooks} de {totalBooks * versions.length} libros
									</small>
								{:else}
									<button class="btn btn-success w-100" on:click={downloadBibleForOffline}>
										<i class="bi bi-cloud-arrow-down me-2"></i>
										Descargar Biblia completa
									</button>
								{/if}
							</div>
						{/if}

						<!-- Selector y botón de comparación -->
						<div class="d-flex justify-content-center mb-3">
							<button
								class="btn btn-primary btn-floating-selector"
								aria-label="Selector de versión"
								on:click={() => {
									showSelectorDropdown = !showSelectorDropdown;
									searchTerm = '';
								}}
							>
								<i class="fa-solid fa-cross"></i>
							</button>

							<button
								class="btn {compareMode ? 'btn-outline-danger' : 'btn-outline-primary'}"
								on:click={toggleCompareMode}
							>
								{#if compareMode}
									<i class="bi bi-x-circle me-2"></i>Salir de comparación
								{:else}
									<i class="bi bi-file-diff me-2"> Comparar versiones</i>
								{/if}
							</button>
						</div>

						<!-- Selector de segunda versión cuando esté en modo comparación -->
						{#if compareMode && showSelectorDropdown === false}
							<div class="mb-3">
								<p class="form-label text-body">Comparar con:</p>
								<select
									class="form-select bg-body text-body"
									bind:value={secondVersion}
									on:change={() => loadSecondBible(secondVersion, selectedBook)}
								>
									{#each versions.filter((v) => v !== selectedVersion) as version}
										<option value={version}>{version}</option>
									{/each}
								</select>
							</div>
						{/if}

						{#if showSelectorDropdown}
							<div class="selector-dropdown shadow-lg bg-body">
								<div class="search-box p-2 bg-body border-bottom">
									<!-- svelte-ignore a11y_autofocus -->
									<input
										type="text"
										class="form-control bg-body text-body"
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

								<div class="dropdown-options bg-body">
									{#if activeTab === 'version'}
										{#each filteredVersions as version}
											<button
												class="dropdown-option {selectedVersion === version ? 'active' : ''}"
												on:click={() => {
													handleVersionChange(version);
													activeTab = 'book';
												}}
												on:keydown={(e) =>
													e.key === 'Enter' &&
													(() => {
														handleVersionChange(version);
														activeTab = 'book';
													})()}
												role="option"
												aria-selected={selectedVersion === version}
											>
												{version}
											</button>
										{/each}
									{:else if activeTab === 'book'}
										{#each filteredBooks as book}
											<button
												class="dropdown-option {selectedBook === book ? 'active' : ''}"
												on:click={() => {
													handleBookChange(book);
													activeTab = 'chapter';
												}}
												on:keydown={(e) =>
													e.key === 'Enter' &&
													(() => {
														handleBookChange(book);
														activeTab = 'chapter';
													})()}
												role="option"
												aria-selected={selectedBook === book}
											>
												{getBookFullName(book)}
											</button>
										{/each}
									{:else if activeTab === 'chapter'}
										{#each getChaptersForCurrentBook() as chapter}
											{#if searchTerm === '' || chapter.includes(searchTerm)}
												<button
													class="dropdown-option {selectedChapter === chapter ? 'active' : ''}"
													on:click={() => {
														handleChapterChange(chapter);
														activeTab = 'verse';
													}}
													on:keydown={(e) =>
														e.key === 'Enter' &&
														(() => {
															handleChapterChange(chapter);
															activeTab = 'verse';
														})()}
													role="option"
													aria-selected={selectedChapter === chapter}
												>
													Capítulo {chapter}
												</button>
											{/if}
										{/each}
									{:else if activeTab === 'verse'}
										<button
											class="dropdown-option {selectedVerse === null ? 'active' : ''}"
											on:click={() => handleVerseChange(null)}
											on:keydown={(e) => e.key === 'Enter' && handleVerseChange(null)}
											role="option"
											aria-selected={selectedVerse === null}
										>
											Todos los versículos
										</button>
										{#each filteredVerses as verse}
											<button
												class="dropdown-option {selectedVerse?.toString() === verse
													? 'active'
													: ''}"
												on:click={() => handleVerseChange(parseInt(verse))}
												on:keydown={(e) => e.key === 'Enter' && handleVerseChange(parseInt(verse))}
												role="option"
												aria-selected={selectedVerse?.toString() === verse}
											>
												Versículo {verse}
											</button>
										{/each}
									{/if}
								</div>
							</div>
						{/if}

						<!-- Contenido bíblico -->
						{#if bibleData && currentChapter}
							<div class="bg-body p-4 rounded shadow-sm bible-content">
								{#if compareMode && secondCurrentChapter}
									<!-- Modo comparación - dos columnas -->
									<div class="row">
										<div class="col-md-6 pe-md-3 border-end">
											<h5 class="text-center text-primary mb-3">{selectedVersion}</h5>
											<div class="bible-text fs-5 scroll-sync">
												{#each currentChapter?.items as item}
													{#if item.type === 'verse'}
														<div
															class="verse mb-3 p-3 bg-body rounded {selectedVerse?.toString() ===
															item.verse_numbers[0].toString()
																? 'verse-difference'
																: ''}"
															id={'verse-' + item.verse_numbers[0]}
															on:mousedown={(e) => handleVersePressStart(e, item.verse_numbers[0], item.lines?.join(' ') || '')}
															on:mouseup={handleVersePressEnd}
															on:mouseleave={handleVersePressEnd}
															on:touchstart={(e) => handleVersePressStart(e, item.verse_numbers[0], item.lines?.join(' ') || '')}
															on:touchend={handleVersePressEnd}
														>
															<sup class="verse-number badge bg-primary me-2"
																>{item.verse_numbers.join(', ')}</sup
															>
															<span class="verse-text text-body">{item.lines?.join(' ') || ''}</span
															>
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
															class="verse mb-3 p-3 bg-body rounded {selectedVerse?.toString() ===
															item.verse_numbers[0].toString()
																? 'verse-difference'
																: ''}"
															id={'verse2-' + item.verse_numbers[0]}
															on:mousedown={(e) => handleVersePressStart(e, item.verse_numbers[0], item.lines?.join(' ') || '')}
															on:mouseup={handleVersePressEnd}
															on:mouseleave={handleVersePressEnd}
															on:touchstart={(e) => handleVersePressStart(e, item.verse_numbers[0], item.lines?.join(' ') || '')}
															on:touchend={handleVersePressEnd}
														>
															<sup class="verse-number badge bg-primary me-2"
																>{item.verse_numbers.join(', ')}</sup
															>
															<span class="verse-text text-body">{item.lines?.join(' ') || ''}</span
															>
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
													class="verse mb-3 p-3 bg-body rounded"
													id={'verse-' + item.verse_numbers[0]}
													on:mousedown={(e) => handleVersePressStart(e, item.verse_numbers[0], item.lines?.join(' ') || '')}
													on:mouseup={handleVersePressEnd}
													on:mouseleave={handleVersePressEnd}
													on:touchstart={(e) => handleVersePressStart(e, item.verse_numbers[0], item.lines?.join(' ') || '')}
													on:touchend={handleVersePressEnd}
												>
													<sup class="verse-number badge bg-primary me-2"
														>{item.verse_numbers.join(', ')}</sup
													>
													<span class="verse-text text-body">{item.lines?.join(' ') || ''}</span>
												</div>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							<div class="text-center py-5">
								<i class="bi bi-book fs-1 text-body"></i>
								<p class="h4 text-body mt-3">
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

{#if showCopiedMessage}
	<div class="copied-message">
		Versículo copiado al portapapeles
	</div>
{/if}

<style>
	:root {
		--bible-font-size: 16px; /* Valor por defecto */
	}

	.bible-content {
		font-size: var(--bible-font-size);
	}

	.bible-text {
		font-size: var(--bible-font-size);
		line-height: calc(var(--bible-font-size) * 1.6);
	}

	.verse-number {
		font-size: calc(var(--bible-font-size) * 0.8);
	}

	/* Estilos para los controles */
	.font-size-controls {
		background-color: var(--bs-body-bg);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.font-size-controls button {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Estilos para versículos */
	.verse {
		transition: all 0.3s ease;
		line-height: 1.8;
		background-color: var(--bs-light-bg-subtle);
		position: relative;
	}

	.verse:hover {
		background-color: var(--bs-primary-bg-subtle) !important;
		transform: translateX(3px);
	}

	.verse-copied {
		background-color: var(--bs-success-bg-subtle) !important;
		border-left: 3px solid var(--bs-success);
	}

	.verse-number {
		font-size: 0.8em;
		position: relative;
		top: -0.5em;
	}

	/* Mensaje de copiado */
	.copied-message {
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		background-color: var(--bs-success);
		color: white;
		padding: 10px 20px;
		border-radius: 4px;
		z-index: 2000;
		animation: fadeInOut 2s ease-in-out;
	}

	@keyframes fadeInOut {
		0% { opacity: 0; }
		20% { opacity: 1; }
		80% { opacity: 1; }
		100% { opacity: 0; }
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
		background-color: var(--bs-body-bg);
		color: var(--bs-body-color);
		border-radius: 8px;
		z-index: 1000;
		overflow: hidden;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		border: 1px solid var(--bs-border-color);
	}

	.dropdown-options button {
		background: none;
		border: none;
		width: 100%;
		text-align: left;
		padding: 10px 20px;
		cursor: pointer;
		color: inherit;
	}

	.dropdown-options button:focus {
		outline: 2px solid var(--bs-primary);
		outline-offset: -2px;
	}

	.search-box {
		position: sticky;
		top: 0;
		z-index: 10;
		background-color: var(--bs-body-bg);
		border-bottom: 1px solid var(--bs-border-color);
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
		color: var(--bs-body-color);
	}

	.dropdown-option:hover {
		background-color: var(--bs-tertiary-bg);
	}

	.dropdown-option.active {
		background-color: var(--bs-primary-bg-subtle);
		font-weight: bold;
	}

	@keyframes highlight {
		0% {
			background-color: var(--bs-primary-bg-subtle);
		}
		100% {
			background-color: inherit;
		}
	}

	/* Sección offline */
	.offline-section {
		border-left: 4px solid var(--bs-success);
		background-color: var(--bs-body-bg);
	}

	/* Progress bar */
	.progress {
		height: 1.5rem;
		border-radius: 0.25rem;
		background-color: var(--bs-secondary-bg);
	}

	.progress-bar {
		background-color: var(--bs-success);
		font-size: 0.8rem;
		line-height: 1.5rem;
	}

	/* Estilos para el modo de comparación */
	.scroll-sync {
		height: 60vh;
		overflow-y: auto;
		scroll-behavior: smooth;
	}

	.scroll {
		position: sticky;
		top: 0;
		left: 0;
		width: 100%;
		z-index: 1000;
		background-color: var(--bs-body-bg);
		padding: 0.5rem;
		margin: 0;
		border-bottom: 1px solid var(--bs-border-color);
	}

	/* Elimina el margen (m-2) del div contenedor para móviles */
	@media (max-width: 768px) {
		.scroll {
			position: sticky;
			top: 0;
			left: 0;
			width: 100%;
			padding: 0.5rem;
			margin: 0 !important;
		}

		.scroll input {
			width: 70% !important;
		}
	}

	.scroll2 {
		position: sticky;
		top: auto;
		bottom: 0;
		left: 0;
		width: 100%;
		z-index: 1000;
		background-color: var(--bs-body-bg);
		border-top: 1px solid var(--bs-border-color);
		padding: 0.5rem;
	}

	/* Ajustes específicos para móvil */
	@media (max-width: 768px) {
		.scroll2 {
			position: fixed;
			bottom: 0;
			left: 0;
			width: 100%;
			padding: 0.5rem;
			font-size: 0.8rem;
		}

		.card-header {
			padding: 0.5rem !important;
		}

		.card-header .badge {
			font-size: 0.7rem;
		}

		.card-header .separator {
			display: none;
		}
	}

	/* Asegura que el contenido principal no quede oculto */
	main {
		padding-bottom: 60px;
		padding-top: 60px;
	}

	/* Ajusta el z-index del dropdown para que aparezca sobre todo */
	.selector-dropdown {
		z-index: 1100;
		top: 60px !important;
	}

	/* Botón flotante del selector */
	.btn-floating-selector {
		position: fixed;
		bottom: 70px;
		right: 20px;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		font-size: 1.5rem;
		z-index: 1050;
	}

	@media (max-width: 768px) {
		.btn-floating-selector {
			bottom: 80px;
			right: 15px;
			width: 50px;
			height: 50px;
			font-size: 1.2rem;
		}
	}

	.verse-difference {
		background-color: var(--bs-warning-bg-subtle);
		border-left: 3px solid var(--bs-warning);
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
		box-shadow: var(--bs-box-shadow-sm);
	}

	.shadow-lg {
		box-shadow: var(--bs-box-shadow-lg);
	}

	.rounded {
		border-radius: var(--bs-border-radius);
	}

	.separator {
		opacity: 0.6;
	}
</style>