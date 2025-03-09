<script lang="ts">
	import { fetchChapter, preloadVersion, getFromLocalStorage } from '../api/fetchData';
	import type { ChapterData, Book } from '../api/fetchData';

	// Propiedades del componente
	export let selectedBook: string;
	export let selectedVersion: string;
	export let bookDetails: Book;
	export let selectedChapter: number | null = null; // Asegúrate de que selectedChapter esté definido

	// Variables de estado
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

	// Cargar versículos marcados desde localStorage
	function loadMarkedVerses() {
		const storedVerses = localStorage.getItem(`markedVerses-${selectedBook}-${selectedChapter}`);
		if (storedVerses) {
			selectedVerses = JSON.parse(storedVerses);
		}
	}

	function goToVerse(verseNumber: number) {
		const verseElement = document.getElementById(`verse-${verseNumber}`);
		if (verseElement) {
			verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			closeModal(); // Cerrar el modal después de navegar al versículo
		} else {
			console.error(`El versículo ${verseNumber} no se encontró.`);
		}
	}

	// Guardar versículos marcados en localStorage
	function saveMarkedVerses() {
		localStorage.setItem(
			`markedVerses-${selectedBook}-${selectedChapter}`,
			JSON.stringify(selectedVerses)
		);
	}

	// Guardar datos en localStorage
	function saveToLocalStorage(version: string, book: string, chapter: number, data: ChapterData): void {
		const key = `${version}-${book}-${chapter}`;
		const compressedData = JSON.stringify(data); // Comprimir datos
		localStorage.setItem(key, compressedData);
	}

	// Cargar un capítulo desde el localStorage o la API
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

		// Intentar cargar desde localStorage
		const cachedData = getFromLocalStorage(
			selectedVersion,
			selectedBook.toLowerCase(),
			selectedChapter
		);
		if (cachedData) {
			console.log(
				`Datos obtenidos del localStorage: ${selectedVersion}-${selectedBook}-${selectedChapter}`
			);
			chapterData = cachedData;
			loadMarkedVerses();
			showModal = true;
			isLoading = false;
			return;
		}

		// Si no hay datos en localStorage, hacer la solicitud a la API
		try {
			chapterData = await fetchChapter(
				selectedVersion,
				selectedBook.toLowerCase(),
				selectedChapter
			);
			saveToLocalStorage(selectedVersion, selectedBook.toLowerCase(), selectedChapter, chapterData);
			loadMarkedVerses();
			showModal = true;
		} catch (err) {
			const errorObj = err as Error;
			error = errorObj.message || 'Error al cargar el capítulo.';
		} finally {
			isLoading = false;
		}
	}

	// Descargar una versión completa de la Biblia
	async function downloadVersion() {
		try {
			loadingDownload = true;
			statusMessage = `Descargando la versión ${selectedVersion}...`;
			await preloadVersion(selectedVersion, (progress) => {
				downloadProgress = progress;
			});
			statusMessage = `Versión ${selectedVersion} descargada correctamente.`;
		} catch (err) {
			const errorObj = err as Error;
			statusMessage = `Error al descargar la versión ${selectedVersion}: ${errorObj.message}`;
			console.error(statusMessage);
		} finally {
			loadingDownload = false;
		}
	}

	// Seleccionar o deseleccionar un versículo
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

		selectedVerses = [...selectedVerses]; // Actualizar el estado
		buttonsVisible = selectedVerses.length > 0;
		saveMarkedVerses();

		if (selectionTimeout) clearTimeout(selectionTimeout);
		selectionTimeout = window.setTimeout(() => {
			buttonsVisible = true;
		}, 1000);
	}

	// Copiar versículos seleccionados al portapapeles
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
		} else {
			feedbackMessage = 'Selecciona al menos un versículo para copiar.';
			setTimeout(() => (feedbackMessage = null), 3000);
		}
	}

	// Compartir versículos seleccionados por WhatsApp
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
		} else {
			feedbackMessage = 'Selecciona al menos un versículo para compartir.';
			setTimeout(() => (feedbackMessage = null), 3000);
		}
	}

	// Cerrar el modal
	function closeModal() {
		showModal = false;
	}

	// Seleccionar un color
	function selectColor(color: string) {
		selectedColor = color;
		showColorPicker = false;
	}
</script>

<main>
	<!-- Botón para descargar la versión seleccionada -->
	<button class="btn btn-warning" on:click={downloadVersion} disabled={loadingDownload}>
		{loadingDownload ? `Descargando... ${downloadProgress}%` : 'Descargar Biblia'}
	</button>

	<!-- Mensaje de estado de la descarga -->
	{#if statusMessage}
		<div class="alert alert-info mt-3">
			{statusMessage}
		</div>
	{/if}

	<!-- Selector de capítulo -->
	<div class="chapter-dropdown">
		{#if bookDetails}
			<select
				class="form-select form-select-sm bg-dark text-warning-emphasis border-warning"
				id="versionDropdown"
				data-bs-toggle="dropdown"
				bind:value={selectedChapter}
				on:change={loadChapter}
				disabled={isLoading}
			>
				<option class="text-warning text-center fs-4" value="" disabled selected
					>Selecciona un capítulo</option
				>
				{#each Array(bookDetails.chapters)
					.fill(0)
					.map((_, i) => i + 1) as chapter}
					<option class="text-warning-emphasis text-center fs-4" value={chapter}
						>Capítulo {chapter}</option
					>
				{/each}
			</select>
		{/if}
	</div>

	<!-- Indicador de carga -->
	{#if isLoading}
		<div class="loader-container">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{/if}

	<!-- Lista de versículos -->
	{#if chapterData && chapterData.vers?.length > 0}
		<ul class="verse-list">
			{#each chapterData.vers as verse}
				<li id="verse-{verse.number}" class="verse-item">
					<button
						type="button"
						class="verse-btn {selectedVerses.find((v) => v.number === verse.number)
							? 'selected'
							: ''}"
						style:background-color={selectedVerses.find((v) => v.number === verse.number)?.color ||
							'transparent'}
						on:click={() => toggleVerseSelection(verse.number, verse.verse)}
					>
						<strong class="verse-number">{verse.number}:</strong>
						{verse.verse}
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<!-- Botón flotante para seleccionar colores -->
	<div class="floating-color-picker">
		<button class="color-picker-btn" on:click={() => (showColorPicker = !showColorPicker)}>
			🎨
		</button>
		{#if showColorPicker}
			<div class="color-options">
				{#each colors as color}
					<button
						class="color-option"
						aria-label="Seleccionar color"
						style:background-color={color}
						on:click={() => selectColor(color)}
					></button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Modal -->
	{#if showModal}
		<div class="modal">
			<div class="modal-content">
				<button class="close-btn" on:click={() => closeModal()}>Cerrar</button>
				{#if chapterData}
					<ul class="modal-verse-list">
						{#each chapterData.vers as verse}
							<li class="modal-verse-item">
								<button
									class="form-select form-select-sm bg-dark text-warning-emphasis border-warning"
									type="button"
									on:click={() => goToVerse(verse.number)}
								>
									Versículo {verse.number}
								</button>
							</li>
						{/each}
					</ul>
				{:else}
					<p>No hay datos disponibles para los versículos.</p>
				{/if}
			</div>
		</div>
	{/if}
</main>