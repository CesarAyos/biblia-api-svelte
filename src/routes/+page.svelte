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
		'EZE',
		'DAN',
		'HOS',
		'JOE',
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
		'LK',
		'JHN',
		'HCH',
		'ROM',
		'1CO',
		'2CO',
		'GAL',
		'EF',
		'FIL',
		'COL',
		'1TE',
		'2TE',
		'1PE',
		'2PE',
		'1JN',
		'2JN',
		'3JN',
		'JUD',
		'APC'
	];
	const chapters = Array(50)
		.fill(0)
		.map((_, i) => (i + 1).toString());

	// Cargar datos de la Biblia
	async function loadBible(version: string, book: string) {
		try {
			isLoading = true;
			const response = await fetch(`/${version}/${book}.json`);
			if (!response.ok) throw new Error(`Error ${response.status}: Archivo no encontrado`);

			bibleData = await response.json();
			selectedVerse = null;
		} catch (error) {
			console.error('Error cargando la Biblia:', error);
			bibleData = null;
		} finally {
			isLoading = false;
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
		if (!search) return options;
		return options.filter((option) => option.toLowerCase().includes(search.toLowerCase()));
	}

	// Filtrar versículos por número o contenido
	function filterVerses(verses: string[], search: string, chapterData: Chapter | null): string[] {
		if (!search || !chapterData) return verses;

		return chapterData.items
			.filter(
				(item) =>
					item.type === 'verse' &&
					(item.verse_numbers.some((v) => v.toString().includes(search)) ||
						item.lines.some((line) => line.toLowerCase().includes(search.toLowerCase())))
			)
			.map((item) => item.verse_numbers[0].toString());
	}

	// Obtener versículos actuales
	function getCurrentVerses() {
		if (!currentChapter) return [];
		return (
			currentChapter.items
				?.filter((item) => item.type === 'verse')
				?.map((item) => item.verse_numbers[0].toString()) || []
		);
	}

	// Efectos reactivos
	$: if (bibleData && selectedChapter) {
		currentChapter =
			bibleData?.chapters?.find((ch) => ch.chapter_usfm?.endsWith(selectedChapter)) || null;
	}

	$: filteredVersions = filterOptions(versions, activeTab === 'version' ? searchTerm : '');
	$: filteredBooks = filterOptions(books, activeTab === 'book' ? searchTerm : '');
	$: filteredChapters = filterOptions(chapters, activeTab === 'chapter' ? searchTerm : '');
	$: currentVerses = getCurrentVerses();
	$: filteredVerses = filterVerses(
		currentVerses,
		activeTab === 'verse' ? searchTerm : '',
		currentChapter
	);

	// Carga inicial
	onMount(() => {
		loadBible(selectedVersion, selectedBook);
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
								<span class="d-block d-md-inline">{bibleData.name}</span>
								<span class="d-none d-md-inline mx-2">-</span>
								<span class="d-block d-md-inline">{selectedVersion}</span>
								<span class="d-none d-md-inline mx-2">-</span>
								<span class="d-block d-md-inline">Capítulo {selectedChapter}</span>
							{:else}
								Selecciona un libro y capítulo
							{/if}
						</h2>
					</div>

					<div class="card-body bg-light">
						<!-- Selector compacto con tabs -->
						<div class="d-flex justify-content-center mb-4">
							<button
								class="btn btn-primary dropdown-toggle"
								on:click={() => {
									showSelectorDropdown = !showSelectorDropdown;
									searchTerm = '';
									if (showSelectorDropdown) {
										if (!selectedBook) activeTab = 'book';
										else if (!selectedChapter) activeTab = 'chapter';
										else activeTab = 'verse';
									}
								}}
							>
								<i class="bi bi-gear-fill me-2"></i>Seleccionar
							</button>
						</div>

						{#if showSelectorDropdown}
							<div class="selector-dropdown shadow-lg">
								<div class="search-box p-2 bg-light border-bottom">
									<input
										type="text"
										class="form-control"
										placeholder="Buscar en {activeTab === 'version'
											? 'versiones'
											: activeTab === 'book'
												? 'libros'
												: activeTab === 'chapter'
													? 'capítulos'
													: 'versículos'}..."
										bind:value={searchTerm}
										autofocus
									/>
								</div>

								<!-- Tabs de navegación -->
								<ul class="nav nav-tabs">
									<li class="nav-item">
										<button
											class="nav-link {activeTab === 'version' ? 'active' : ''}"
											on:click={() => {
												activeTab = 'version';
												searchTerm = '';
											}}
										>
											Versión
										</button>
									</li>
									<li class="nav-item">
										<button
											class="nav-link {activeTab === 'book' ? 'active' : ''}"
											on:click={() => {
												activeTab = 'book';
												searchTerm = '';
											}}
										>
											Libro
										</button>
									</li>
									<li class="nav-item">
										<button
											class="nav-link {activeTab === 'chapter' ? 'active' : ''}"
											on:click={() => {
												activeTab = 'chapter';
												searchTerm = '';
											}}
											disabled={!selectedBook}
										>
											Capítulo
										</button>
									</li>
									<li class="nav-item">
										<button
											class="nav-link {activeTab === 'verse' ? 'active' : ''}"
											on:click={() => {
												activeTab = 'verse';
												searchTerm = '';
											}}
											disabled={!selectedChapter || !currentChapter}
										>
											Versículo
										</button>
									</li>
								</ul>

								<div class="dropdown-options">
									{#if activeTab === 'version'}
										{#if filteredVersions.length === 0 && searchTerm}
											<div class="text-center p-3 text-muted">
												No se encontraron versiones que coincidan con "{searchTerm}"
											</div>
										{:else}
											{#each filteredVersions as version}
												<div
													class="dropdown-option {selectedVersion === version ? 'active' : ''}"
													on:click={() => {
														handleVersionChange(version);
														activeTab = 'book';
														searchTerm = '';
													}}
												>
													{version}
												</div>
											{/each}
										{/if}
									{:else if activeTab === 'book'}
										{#if filteredBooks.length === 0 && searchTerm}
											<div class="text-center p-3 text-muted">
												No se encontraron libros que coincidan con "{searchTerm}"
											</div>
										{:else}
											{#each filteredBooks as book}
												<div
													class="dropdown-option {selectedBook === book ? 'active' : ''}"
													on:click={() => {
														handleBookChange(book);
														activeTab = 'chapter';
														searchTerm = '';
													}}
												>
													{book}
												</div>
											{/each}
										{/if}
									{:else if activeTab === 'chapter'}
										{#if filteredChapters.length === 0 && searchTerm}
											<div class="text-center p-3 text-muted">
												No se encontraron capítulos que coincidan con "{searchTerm}"
											</div>
										{:else}
											{#each filteredChapters as chapter}
												<div
													class="dropdown-option {selectedChapter === chapter ? 'active' : ''}"
													on:click={() => {
														handleChapterChange(chapter);
														activeTab = 'verse';
														searchTerm = '';
													}}
												>
													Capítulo {chapter}
												</div>
											{/each}
										{/if}
									{:else if activeTab === 'verse'}
										{#if filteredVerses.length === 0 && searchTerm}
											<div class="text-center p-3 text-muted">
												No se encontraron versículos que coincidan con "{searchTerm}"
											</div>
										{:else if currentVerses.length === 0}
											<div class="text-center p-3 text-muted">
												No hay versículos disponibles en este capítulo
											</div>
										{:else}
											<div
												class="dropdown-option {selectedVerse === null ? 'active' : ''}"
												on:click={() => handleVerseChange(null)}
											>
												Todos los versículos
											</div>
											{#each searchTerm ? filteredVerses : currentVerses as verse}
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
									{/if}
								</div>
							</div>
						{/if}

						{#if bibleData && currentChapter}
							<div class="bg-white p-4 rounded shadow-sm bible-content">
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
	.bg-gradient-primary {
		background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
		min-height: 100vh;
	}

	.verse {
		transition: all 0.3s ease;
		line-height: 1.8;
	}

	.verse:hover {
		background-color: #e9f5ff !important;
		transform: translateX(3px);
	}

	.verse-number {
		font-size: 0.8em;
		top: -0.5em;
	}

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

	.bible-content {
		position: relative;
		z-index: 1;
	}

	.nav-tabs {
		padding: 0 15px;
		border-bottom: 1px solid #dee2e6;
	}

	.nav-link {
		cursor: pointer;
		border: none;
		background: none;
		padding: 10px 15px;
		color: #495057;
	}

	.nav-link.active {
		color: #0d6efd;
		border-bottom: 2px solid #0d6efd;
		font-weight: bold;
	}

	.nav-link.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

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

	@media (max-width: 768px) {
		.bible-text {
			font-size: 1rem !important;
		}

		.selector-dropdown {
			width: 95%;
			max-height: 60vh;
			top: 80px;
		}

		.nav-tabs {
			font-size: 0.8rem;
			display: flex;
			flex-wrap: nowrap;
			overflow-x: auto;
		}

		.nav-link {
			padding: 8px 10px;
			white-space: nowrap;
		}
	}
</style>
