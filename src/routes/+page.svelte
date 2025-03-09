<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchVersions, fetchBooks, preloadVersion } from '../api/fetchData';
	import type { Version, Book } from '../api/fetchData';
	import Chapter from '../components/Chapter.svelte';
	

	// Variables principales
	let versions: Version[] = [];
	let selectedVersion: string | null = null;
	let books: Book[] = [];
	let selectedBook: string | null = null;
	let bookDetails: Book | null = null;
	let loadingVersions = false;
	let loadingDownload = false;
	let downloadProgress = 0;
	let statusMessage = '';

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

	// Función para descargar una versión
	async function downloadVersion(version: string) {
		try {
			loadingDownload = true;
			statusMessage = `Descargando la versión ${version}...`;
			await preloadVersion(version, (progress) => {
				downloadProgress = progress;
			});
			statusMessage = `Versión ${version} descargada correctamente.`;
		} catch (err) {
			statusMessage = `Error al descargar la versión ${version}: ${(err as Error).message}`;
			console.error(statusMessage);
		} finally {
			loadingDownload = false;
		}
	}
</script>

<!-- Barra de navegación -->
<nav class="navbar navbar-expand-lg bg-dark shadow">
	<div class="container-fluid">
		<p class="navbar-brand text-warning-emphasis fs-3 fw-bold">
			<i class="bi bi-book"></i> Biblia <strong>{selectedVersion || ''}</strong>
		</p>

		<div class="collapse navbar-collapse">
			<ul class="navbar-nav me-auto mb-2 mb-lg-0">
				<li class="nav-item">
					<div class="d-flex align-items-center">
						<!-- Selector de versión -->
						<select
							class="form-select form-select-sm bg-dark text-warning-emphasis border-warning me-2"
							bind:value={selectedVersion}
						>
							<option value="" disabled selected>Elige una versión</option>
							{#each versions as version}
								<option value={version.version}>{version.name}</option>
							{/each}
						</select>

						<!-- Selector de libros -->
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
		</div>
	</div>
	<div class="dropdown open">
		<button
			class="btn btn-warning dropdown-toggle"
			type="button"
			id="triggerId"
			data-bs-toggle="dropdown"
			aria-haspopup="true"
			aria-expanded="false"
		>
			Descargar una version
		</button>
		<div class="dropdown-menu" aria-labelledby="triggerId">
			<!-- Lista de versiones con botón de descarga -->
			<div class="">
				<ul class="list-group">
					{#each versions as version}
						<li
							class="list-group-item bg-dark text-warning-emphasis d-flex justify-content-between align-items-center"
						>
							<span>{version.name}</span>
							<button
								class="btn btn-outline-warning btn-sm"
								on:click={() => downloadVersion(version.version)}
								disabled={loadingDownload}
							>
								{loadingDownload && version.version === selectedVersion
									? `Descargando... ${downloadProgress}%`
									: 'Descargar'}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</nav>

<!-- Mensaje de estado de la descarga -->
{#if statusMessage}
	<div class="alert alert-info mt-3">
		{statusMessage}
	</div>
{/if}

<!-- Componente del libro seleccionado -->
{#if selectedBook && bookDetails && selectedVersion}
	<Chapter {selectedBook} {selectedVersion} {bookDetails} />
{/if}
