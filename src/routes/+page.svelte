<script lang="ts">
	import { onMount } from 'svelte';
	import {
		fetchVersions,
		fetchBooks,
		fetchChapter,
		preloadVersion,
		getFromLocalStorage
	} from '../api/fetchData';
	import type { Version, Book, ChapterData } from '../api/fetchData';
	import { writable } from 'svelte/store';

	// Variables principales
	let versions: Version[] = [];
	let selectedVersion: string | null = null;
	let books: Book[] = [];
	let selectedBook: string | null = null;
	let bookDetails: Book | null = null;
	let loadingVersions = false;

	// Variables del componente Chapter
	let selectedChapter: number | null = null;
	let chapterData: ChapterData | null = null;
	let isLoading = false;
	let error: string | null = null;
	let feedbackMessage: string | null = null;
	let selectedVerses: { number: number; text: string; color?: string }[] = [];
	let showModal = false;
	let buttonsVisible = false;
	let selectionTimeout: number | null = null;
	let selectedColor: string | null = null;
	let showColorPicker = false;
	let loadingDownload = false;
	let downloadProgress = 0;
	let statusMessage = '';

	const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];

	// Verificar disponibilidad de localStorage
	function isLocalStorageAvailable() {
		try {
			const testKey = '_test_';
			localStorage.setItem(testKey, 'test');
			localStorage.removeItem(testKey);
			return true;
		} catch (e) {
			return false;
		}
	}

	// Inicializar darkMode
	const darkMode = writable(false);

	if (isLocalStorageAvailable()) {
		// Leer el estado inicial desde localStorage
		const storedValue = JSON.parse(localStorage.getItem('darkMode') || 'false');
		darkMode.set(storedValue);

		// Actualizar localStorage cuando el store cambie
		darkMode.subscribe((value) => {
			localStorage.setItem('darkMode', JSON.stringify(value));
		});
	}

	// Alternar tema
	function toggleTheme() {
		darkMode.update((mode) => !mode);
	}

	// Carga de versiones al montar el componente
	onMount(async () => {
		try {
			loadingVersions = true;
			versions = await fetchVersions();
			console.log('Versiones cargadas:', versions);
		} catch (err) {
			console.error(`Error al cargar versiones: ${(err as Error).message}`);
		} finally {
			loadingVersions = false;
		}
	});

	// Cargar libros cuando se selecciona una versión
	$: if (selectedVersion) {
		console.log('Versión seleccionada:', selectedVersion);
		loadBooks(selectedVersion);
	}

	async function loadBooks(version: string) {
		try {
			books = await fetchBooks(version);
			console.log('Libros cargados:', books);
		} catch (err) {
			console.error(`Error al cargar libros: ${(err as Error).message}`);
		}
	}

	// Actualizar detalles del libro seleccionado
	$: if (selectedBook) {
		console.log('Libro seleccionado:', selectedBook);
		bookDetails = books.find((book) => book.abrev === selectedBook) || null;
	}

	// Funciones del componente Chapter
	function loadMarkedVerses() {
		const storedVerses = localStorage.getItem(`markedVerses-${selectedBook}-${selectedChapter}`);
		if (storedVerses) {
			selectedVerses = JSON.parse(storedVerses);
		}
	}

	function goToVerse(verseNumber: number) {
		closeModal();
		setTimeout(() => {
			const verseElement = document.getElementById(`verse-${verseNumber}`);
			if (verseElement) {
				verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 100);
	}

	function saveMarkedVerses() {
		localStorage.setItem(
			`markedVerses-${selectedBook}-${selectedChapter}`,
			JSON.stringify(selectedVerses)
		);
	}

	async function loadChapter() {
		if (!selectedBook || !selectedChapter || !selectedVersion) {
			error = 'Por favor selecciona un libro, versión y capítulo válidos.';
			return;
		}

		isLoading = true;
		chapterData = null;
		error = null;
		selectedVerses = [];
		feedbackMessage = null;

		// Asegúrate de que selectedBook y selectedVersion no sean null
		if (selectedVersion && selectedBook) {
			const cachedData = getFromLocalStorage(
				selectedVersion, // Ahora es seguro porque se verifica que no es null
				selectedBook.toLowerCase(), // Ahora es seguro porque se verifica que no es null
				selectedChapter
			);

			if (cachedData) {
				chapterData = cachedData;
				loadMarkedVerses();
				showModal = true;
				isLoading = false;
				return;
			}

			try {
				chapterData = await fetchChapter(
					selectedVersion, // Ahora es seguro porque se verifica que no es null
					selectedBook.toLowerCase(), // Ahora es seguro porque se verifica que no es null
					selectedChapter
				);
				saveToLocalStorage(
					selectedVersion,
					selectedBook.toLowerCase(),
					selectedChapter,
					chapterData
				);
				loadMarkedVerses();
				showModal = true;
			} catch (err) {
				const errorObj = err as Error;
				error = errorObj.message || 'Error al cargar el capítulo.';
			} finally {
				isLoading = false;
			}
		}
	}

	function saveToLocalStorage(version: string, book: string, chapter: number, data: any) {
    const key = `${version}-${book}-${chapter}`; // Crear una clave única
    localStorage.setItem(key, JSON.stringify(data)); // Guardar los datos en localStorage
}

	function toggleVerseSelection(verseNumber: number, verseText: string) {
		if (!selectedColor) {
			feedbackMessage = 'Selecciona un color antes de marcar un versículo.';
			setTimeout(() => (feedbackMessage = null), 3000);
			return;
		}

		const index = selectedVerses.findIndex((v) => v.number === verseNumber);

		if (index >= 0) {
			selectedVerses.splice(index, 1);
		} else {
			selectedVerses.push({ number: verseNumber, text: verseText, color: selectedColor });
		}

		selectedVerses = [...selectedVerses];
		buttonsVisible = selectedVerses.length > 0;
		saveMarkedVerses();

		if (selectionTimeout) clearTimeout(selectionTimeout);
		selectionTimeout = window.setTimeout(() => {
			buttonsVisible = true;
		}, 1000);
	}

	function copySelectedVerses() {
		if (selectedVerses.length > 0) {
			const textToCopy = selectedVerses
				.map(
					(v) =>
						`${selectedBook || 'Libro desconocido'} (${
							selectedVersion || 'Versión desconocida'
						}), Capítulo ${selectedChapter || 'N/A'}, Versículo ${v.number}: ${v.text}`
				)
				.join('\n');
			navigator.clipboard.writeText(textToCopy).then(() => {
				feedbackMessage = 'Texto copiado al portapapeles.';
				setTimeout(() => (feedbackMessage = null), 3000);
			});
		}
	}

	function shareSelectedVersesViaWhatsApp() {
		if (selectedVerses.length > 0) {
			const textToShare = selectedVerses
				.map(
					(v) =>
						`${selectedBook || 'Libro desconocido'} (${
							selectedVersion || 'Versión desconocida'
						}), Capítulo ${selectedChapter || 'N/A'}, Versículo ${v.number}: ${v.text}`
				)
				.join('\n');
			const shareURL = `https://wa.me/?text=${encodeURIComponent(textToShare)}`;
			window.open(shareURL, '_blank');
		}
	}

	function closeModal() {
		showModal = false;
	}

	function selectColor(color: string) {
		selectedColor = color;
		showColorPicker = false;
	}
</script>

<div
	class="form-select form-select-sm {$darkMode
		? 'bg-dark text-warning-emphasis border-warning'
		: 'bg-light text-dark border-dark'}"
>
	<!-- Barra de navegación -->
	<div class:dark-mode={$darkMode}>
		<nav class="navbar navbar-expand-lg {$darkMode ? 'bg-dark' : 'bg-light'} shadow">
			<div class="container-fluid">
				<!-- Logo y título -->
				<p class="navbar-brand {$darkMode ? 'text-warning-emphasis' : 'text-dark'} fs-3 fw-bold">
					<i class="bi bi-book"></i> Biblia <strong>{selectedVersion || ''}</strong>
				</p>

				<!-- Botón de hamburguesa para móviles -->
				<button
					class="navbar-toggler"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#navbarContent"
					aria-controls="navbarContent"
					aria-expanded="false"
					aria-label="Toggle navigation"
				>
					<span class="p-2 m-2 {$darkMode ? 'text-warning-emphasis' : 'text-dark'}"
						><strong>Menu</strong></span
					>
				</button>

				<!-- Botón de alternancia de tema -->
				<button
					on:click={toggleTheme}
					class="btn {$darkMode ? 'btn-outline-warning' : 'btn-outline-dark'} ms-2"
				>
					{#if $darkMode}
						🌞
					{:else}
						🌑
					{/if}
				</button>
			</div>
		</nav>

		<!-- Contenido colapsable -->
		<div class="collapse navbar-collapse" id="navbarContent">
			<ul class="navbar-nav me-auto mb-2 mb-lg-0">
				<li class="nav-item">
					<div class="d-flex flex-column flex-lg-row align-items-center">
						<!-- Selector de versión -->
						<select
							class="form-select form-select-sm {$darkMode
								? 'bg-dark text-warning-emphasis border-warning'
								: 'bg-light text-dark border-dark'} me-2 mb-2 mb-lg-0"
							bind:value={selectedVersion}
						>
							<option value="" disabled selected>Elige una versión</option>
							{#each versions as version}
								<option value={version.version}>{version.name}</option>
							{/each}
						</select>

						<!-- Selector de libros -->
						{#if selectedVersion && books.length > 0}
							<p class="{$darkMode ? 'text-warning-emphasis' : 'text-dark'} me-2 mb-2 mb-lg-0">
								Libro:
							</p>
							<select
								class="form-select form-select-sm {$darkMode
									? 'bg-dark text-warning-emphasis border-warning'
									: 'bg-light text-dark border-dark'}"
								bind:value={selectedBook}
							>
								<option value="" disabled selected>Elige un libro</option>
								{#each books as book}
									<option value={book.abrev}>{book.names[0]}</option>
								{/each}
							</select>
						{:else if selectedVersion}
							<span
								class="spinner-border {$darkMode ? 'text-warning' : 'text-dark'} spinner-border-sm"
								role="status"
							></span>
						{:else}
							<p class={$darkMode ? 'text-warning-emphasis' : 'text-dark'}>
								Selecciona una versión primero
							</p>
						{/if}
					</div>
				</li>
			</ul>
		</div>

		<!-- Selector de capítulo -->
		{#if selectedBook && bookDetails}
			<div class="chapter-dropdown">
				<select
					class="form-select form-select-sm {$darkMode
						? 'bg-dark text-warning-emphasis border-warning'
						: 'bg-light text-dark border-dark'}"
					bind:value={selectedChapter}
					on:change={loadChapter}
					disabled={isLoading}
				>
					<option value="" disabled selected>Selecciona un capítulo</option>
					{#each Array(bookDetails.chapters)
						.fill(0)
						.map((_, i) => i + 1) as chapter}
						<option value={chapter}>Capítulo {chapter}</option>
					{/each}
				</select>
			</div>
		{/if}

		<div>
			{#if chapterData && chapterData.vers?.length > 0}
				<ul class="verse-list">
					{#each chapterData.vers as verse}
						<li id="verse-{verse.number}" class="verse-item">
							<button
								type="button"
								class="verse-list {$darkMode
									? 'bg-dark text-warning-emphasis border-warning'
									: 'bg-light text-dark border-dark'}  {selectedVerses.find(
									(v) => v.number === verse.number
								)
									? 'selected'
									: ''}"
								style="border: none; outline: none; background-color: {selectedVerses.find(
									(v) => v.number === verse.number
								)?.color || 'transparent'}"
								on:click={() => toggleVerseSelection(verse.number, verse.verse)}
							>
								<strong class="verse-number">{verse.number}:</strong>
								{verse.verse}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Botones flotantes -->
		<div class="floating-buttons position-fixed bottom-0 start-0 pb-5">
			<div class="d-flex flex-column gap-2">
				<!-- Botón de colores -->
				<button
					class="btn rounded-circle bg-transparent"
					style="font-size: 18px;"
					on:click={() => (showColorPicker = !showColorPicker)}
				>
					🎨
				</button>

				<!-- Selector de colores -->
				{#if showColorPicker}
					<div class="d-flex flex-column gap-2 p-2 bg-transparent rounded shadow">
						{#each colors as color}
							<button
								class="btn rounded-circle"
								aria-label="arial"
								style="width: 20px; height: 20px; background-color: {color};"
								on:click={() => selectColor(color)}
							></button>
						{/each}
					</div>
				{/if}

				<!-- Botón de copiar -->
				<button
					class="btn rounded-circle bg-transparent"
					on:click={copySelectedVerses}
					style="font-size: 18px;"
					disabled={selectedVerses.length === 0}
				>
					📋
				</button>

				<!-- Botón de WhatsApp -->
				<button
					class="btn btn-whatsapp rounded-circle bg-transparent"
					on:click={shareSelectedVersesViaWhatsApp}
					style="font-size: 18px;"
					disabled={selectedVerses.length === 0}
				>
					👨‍🚀
				</button>
			</div>
		</div>
	</div>

	<!-- Modal -->
	{#if showModal}
		<div class="modal">
			<div class="modal-content">
				{#if chapterData}
					<ul class="modal-verse-list">
						{#each chapterData.vers as verse}
							<li class="modal-verse-item">
								<button
									class="form-select form-select-sm {$darkMode
										? 'bg-dark text-warning-emphasis border-warning'
										: 'bg-light text-dark border-dark'}"
									type="button"
									on:click={() => goToVerse(verse.number)}
								>
									Versículo {verse.number}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Estilos -->
<style>
	:root {
		--bg-color: white;
		--text-color: black;
	}

	.dark-mode {
		--bg-color: black;
		--text-color: white;
	}

	.navbar {
		padding: 1rem;
	}

	.floating-buttons {
		z-index: 1000;
	}

	.verse-list {
		list-style: none;
		padding: 0;
	}

	.verse-item {
		margin: 0.5rem 0;
	}

	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.modal-content {
		background: transparent;
		padding: 1rem;
		border-radius: 0.5rem;
		max-width: 90%;
		max-height: 90%;
		overflow-y: auto;
	}

</style>
