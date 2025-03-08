<script lang="ts">
	import { fetchChapter } from '../api/fetchData.js';
	import type { ChapterData, Book } from '../api/fetchData.js';

	export let selectedBook: string;
	export let selectedVersion: string;
	export let bookDetails: Book | null = null;
	let selectedChapter: number | null = null;
	let chapterData: ChapterData | null = null;
	let isLoading = false;
	let error: string | null = null;
	let feedbackMessage: string | null = null;
	let selectedVerses: { number: number; text: string }[] = [];
	let showModal = false; // Controla la visibilidad del modal
	let buttonsEnabled = false;
	let buttonsVisible = false; // Controla la visibilidad de los botones
	let selectionTimeout: number | null = null; // Referencia al temporizador

	function goToVerse(verseNumber: number) {
		const verseElement = document.getElementById(`verse-${verseNumber}`);
		if (verseElement) {
			verseElement.scrollIntoView({ behavior: 'smooth' }); // Desplázate suavemente
			closeModal(); // Cierra el modal después de desplazarse
		} else {
			console.error(`El versículo ${verseNumber} no se encontró.`);
		}
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

		try {
			chapterData = await fetchChapter(
				selectedVersion,
				selectedBook.toLowerCase(),
				selectedChapter
			);
			// Abre el modal tras cargar los datos del capítulo
			showModal = true;
		} catch (err) {
			const errorObj = err as Error;
			error = errorObj.message || 'Error al cargar el capítulo.';
		} finally {
			isLoading = false;
		}
	}

	function toggleVerseSelection(verseNumber: number, verseText: string) {
		const index = selectedVerses.findIndex((v) => v.number === verseNumber);

		if (index >= 0) {
			selectedVerses.splice(index, 1);
			selectedVerses = [...selectedVerses];
			buttonsVisible = selectedVerses.length > 0; // Actualiza visibilidad solo si hay versículos seleccionados
			if (selectionTimeout) clearTimeout(selectionTimeout); // Limpia el temporizador
		} else {
			selectedVerses.push({ number: verseNumber, text: verseText });
			selectedVerses = [...selectedVerses];

			buttonsVisible = false; // Oculta botones inicialmente
			if (selectionTimeout) clearTimeout(selectionTimeout); // Resetea temporizador previo
			selectionTimeout = window.setTimeout(() => {
				buttonsVisible = true; // Muestra botones tras 1 segundo
			}, 1000); // 1000 ms = 1 segundo
		}
	}

	function copySelectedVerses() {
		if (selectedVerses.length > 0) {
			// Retraso de 1 segundo antes de ejecutar la lógica de copiar
			setTimeout(() => {
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
					setTimeout(() => (feedbackMessage = null), 3000); // Mensaje temporal
				});
			}, 1000); // Retraso de 1 segundo
		} else {
			feedbackMessage = 'Selecciona al menos un versículo para copiar.';
			setTimeout(() => (feedbackMessage = null), 3000); // Mensaje temporal
		}
	}

	function shareSelectedVersesViaWhatsApp() {
		if (selectedVerses.length > 0) {
			// Retraso de 1 segundo antes de ejecutar la lógica de compartir
			setTimeout(() => {
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
			}, 1000); // Retraso de 1 segundo
		} else {
			feedbackMessage = 'Selecciona al menos un versículo para compartir.';
			setTimeout(() => (feedbackMessage = null), 3000); // Mensaje temporal
		}
	}

	function closeModal() {
		showModal = false;
	}
</script>

<main>
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

	{#if isLoading}
		<div class="loader-container">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	{/if}

	{#if chapterData && chapterData.vers?.length > 0}
		

		{#if buttonsVisible && selectedVerses.length > 0}
			<div id="actions" class="overflow-auto sticky-actions d-flex justify-content-center">
				<button on:click={copySelectedVerses} class="btn btn-primary">Copiar</button>
				<button on:click={shareSelectedVersesViaWhatsApp} class="btn btn-success">WhatsApp</button>
				<p class="feedback-message mt-2">{feedbackMessage}</p>
			</div>
		{/if}

		<ul class="verse-list">
			{#each chapterData.vers as verse}
				<li id="verse-{verse.number}" class="verse-item">
					<button
						type="button"
						class="verse-btn {selectedVerses.find((v) => v.number === verse.number)
							? 'selected'
							: ''}"
						on:click={() => toggleVerseSelection(verse.number, verse.verse)}
					>
						<strong class="verse-number">{verse.number}:</strong>
						{verse.verse}
					</button>
				</li>
			{/each}
		</ul>
	{/if}

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

<style>
	.chapter-dropdown {
		padding: 10px;
		margin: 0 auto;
		text-align: center;
	}

	.loader-container {
		margin-top: 200px;
	}

	.verse-item {
		margin-bottom: 5px;
	}

	.verse-btn {
		all: unset;
		cursor: pointer;
		background-color: #212529;
		color: #f8f9fa;
		padding: 8px;
		border-radius: 4px;
		width: 100%;
		display: block;
		text-align: left;
	}
	.verse-btn:hover {
		background-color: #495057;
	}
	.verse-btn.selected {
		background-color: #198754;
		color: #fff;
	}

	/* Modal estilos */
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background-color: rgba(255, 255, 255, 0);
		padding: 20px;
		border-radius: 8px;
		max-width: 600px;
		width: 90%;
		text-align: center;
	}

	.modal-verse-list {
		max-height: 300px;

		padding: 0;
		list-style: none;
		margin: 20px 0;
	}

	.modal-verse-item button {
		all: unset;
		cursor: pointer;
		display: block;
		width: 100%;
		padding: 8px;
		margin-bottom: 5px;
		background-color: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 4px;
	}
	.modal-verse-item button:hover {
		background-color: #e9ecef;
	}

	.close-btn {
		margin-top: 20px;
		padding: 10px 20px;
		background-color: #dc3545;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}
	.close-btn:hover {
		background-color: #c82333;
	}
	.sticky-actions {
		position: sticky;
		top: 5px;
		z-index: 1000;
		padding: 10px;
	}

	@media (max-width: 768px) {
		.sticky-actions {
			flex-wrap: wrap;
			gap: 10px;
			justify-content: center; /* Centra los botones de acciones en pantallas móviles */
		}

		.verse-btn {
			text-align: center;
		}

		.modal-content {
			padding: 15px;
			font-size: 14px; /* Ajusta el tamaño de texto para pantallas más pequeñas */
		}

		.modal-verse-list {
			max-width: auto;
		}
		.verse-list {
			padding: 0 10px; /* Ajusta el padding para pantallas pequeñas */
		}

		.verse-btn {
			text-align: center; /* Centra el texto para pantallas más pequeñas */
			font-size: 14px; /* Ajusta el tamaño del texto */
		}

		.verse-item {
			margin-bottom: 8px;
		}
	}
</style>
