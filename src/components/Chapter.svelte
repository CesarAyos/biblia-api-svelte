<script lang="ts">
	import { fetchChapter } from '../api/fetchData.js';
	import type { ChapterData, Book } from '../api/fetchData.js';

	let darkMode = false; // false para blanco, true para negro

	export let selectedBook: string; // Recibe la abreviatura del libro seleccionado
	export let selectedVersion: string; // Recibe la versión seleccionada
	export let bookDetails: Book | null = null; // Recibe los detalles del libro, incluyendo `chapters`

	let selectedChapter: number | null = null;
	let chapterData: ChapterData | null = null;
	let error: string | null = null;
	let isLoading = false;

	// Cargar los datos del capítulo seleccionado
	async function loadChapter() {
		if (!selectedBook || !selectedChapter || !selectedVersion) return;
		try {
			isLoading = true;
			error = null;
			chapterData = null;

			// Lógica para cargar datos
			chapterData = await fetchChapter(
				selectedVersion,
				selectedBook.toLowerCase(),
				selectedChapter
			);

			console.log(chapterData); // Verifica la estructura de los datos
		} catch (err) {
			error = (err as Error).message;
		} finally {
			isLoading = false;
		}
	}
</script>

<main>
	<!-- Botones para seleccionar capítulos -->
	<div class="overflow-x-auto mt-4">
		{#if bookDetails}
			<section class="d-flex flex-nowrap overflow-auto p-3">
				{#each Array(bookDetails.chapters)
					.fill(0)
					.map((_, i) => i + 1) as chapter}
					<div class="d-inline-block mx-2">
						<button
							type="button"
							on:click={() => {
								selectedChapter = chapter;
								loadChapter();
							}}
							disabled={isLoading}
							class="btn btn-primary"
							style="min-width: 130px;"
						>
							Capítulo {chapter}
						</button>
					</div>
				{/each}
			</section>
		{/if}
	</div>

	<!-- Indicador de carga -->
	{#if isLoading}
		<div class="d-flex justify-content-center" style="margin-top: 200px;">
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
		</div>
	{/if}

	<!-- Mostrar versículos -->
	{#if chapterData && chapterData.vers?.length > 0}
		<h3 class="text-center">Capítulo {selectedChapter}</h3>
		<ul>
			{#each chapterData.vers as verse}
				<li>
					<strong>{verse.number}:</strong>
					{verse.verse}
				</li>
			{/each}
		</ul>
	{:else if chapterData && !chapterData.vers?.length}
		<p>No hay versículos disponibles para este capítulo.</p>
	{/if}

	<!-- Manejo de errores -->
	{#if error}
		<p style="color: red;">Error: {error}</p>
	{/if}
</main>
