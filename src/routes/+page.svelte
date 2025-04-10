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
		'GEN', // Génesis
		'EXO', // Éxodo
		'LEV', // Levítico
		'NUM', // Números
		'DEU', // Deuteronomio
		'JOS', // Josué
		'JDG', // Jueces
		'RUT', // Rut
		'1SA', // 1 Samuel
		'2SA', // 2 Samuel
		'1KI', // 1 Reyes
		'2KI', // 2 Reyes
		'1CH', // 1 Crónicas
		'2CH', // 2 Crónicas
		'EZR', // Esdras
		'NEH', // Nehemías
		'EST', // Ester
		'JOB', // Job
		'PSA', // Salmos
		'PRO', // Proverbios
		'ECC', // Eclesiastés
		'SNG', // Cantares
		'ISA', // Isaías
		'JER', // Jeremías
		'LAM', // Lamentaciones
		'EZK', // Ezequiel
		'DAN', // Daniel
		'HOS', // Oseas
		'JOL', // Joel
		'AMO', // Amós
		'OBA', // Abdías
		'JON', // Jonás
		'MIC', // Miqueas
		'NAM', // Nahúm
		'HAB', // Habacuc
		'ZEP', // Sofonías
		'HAG', // Hageo
		'ZEC', // Zacarías
		'MAL', // Malaquías
		'MAT', // Mateo
		'MRK', // Marcos
		'LUK', // Lucas
		'JHN', // Juan
		'ACT', // Hechos
		'ROM', // Romanos
		'1CO', // 1 Corintios
		'2CO', // 2 Corintios
		'GAL', // Gálatas
		'EPH', // Efesios
		'PHP', // Filipenses
		'COL', // Colosenses
		'1TH', // 1 Tesalonicenses
		'2TH', // 2 Tesalonicenses
		'1TI', // 1 Timoteo
		'2TI', // 2 Timoteo
		'TIT', // Tito
		'PHM', // Filemón
		'HEB', // Hebreos
		'JAS', // Santiago
		'1PE', // 1 Pedro
		'2PE', // 2 Pedro
		'1JN', // 1 Juan
		'2JN', // 2 Juan
		'3JN', // 3 Juan
		'JUD', // Judas
		'REV' // Apocalipsis
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
		return options.filter((option) => option.toLowerCase().includes(search.toLowerCase()));
	}

	// Efectos reactivos
	$: if (bibleData && selectedChapter) {
		currentChapter =
			bibleData?.chapters?.find((ch) => ch.chapter_usfm?.endsWith(selectedChapter)) || null;
	}

	$: filteredVersions = filterOptions(versions, searchTerm);
	$: filteredBooks = filterOptions(books, searchTerm);
	$: filteredChapters = filterOptions(chapters, searchTerm);
	$: verses =
		currentChapter?.items
			?.filter((item) => item.type === 'verse')
			?.map((item) => item.verse_numbers[0].toString()) || [];
	$: filteredVerses = filterOptions(verses, searchTerm);

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
										placeholder="Buscar..."
										bind:value={searchTerm}
										autofocus
									/>
								</div>

								<!-- Tabs de navegación -->
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
												{book}
											</div>
										{/each}
									{:else if activeTab === 'chapter'}
										{#each filteredChapters as chapter}
											<div
												class="dropdown-option {selectedChapter === chapter ? 'active' : ''}"
												on:click={() => {
													handleChapterChange(chapter);
													activeTab = 'verse';
												}}
											>
												Capítulo {chapter}
											</div>
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
	}

	.nav-link {
		cursor: pointer;
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
		}

		.nav-tabs {
			font-size: 0.8rem;
		}
	}
</style>
