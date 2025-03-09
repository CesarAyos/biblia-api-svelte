<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchVersions, fetchBooks } from '../api/fetchData';
	import type { Version, Book } from '../api/fetchData';
	import Chapter from '../components/Chapter.svelte';

	// Variables principales
	let versions: Version[] = [];
	let selectedVersion: string | null = null;
	let books: Book[] = [];
	let selectedBook: string | null = null;
	let bookDetails: Book | null = null;
	let loadingVersions = false;

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
</script>

<!-- Barra de navegación -->
<nav class="navbar navbar-expand-lg bg-dark shadow">
	<div class="container-fluid">
		<!-- Logo y título -->
		<p class="navbar-brand text-warning-emphasis fs-3 fw-bold">
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
			<span class="p-2 m-2 text-warning-emphasis"><strong>Menu</strong></span>
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
					class="form-select form-select-sm bg-dark text-warning-emphasis border-warning me-2 mb-2 mb-lg-0"
					bind:value={selectedVersion}
				>
					<option value="" disabled selected>Elige una versión</option>
					{#each versions as version}
						<option value={version.version}>{version.name}</option>
					{/each}
				</select>

				<!-- Selector de libros -->
				{#if selectedVersion && books.length > 0}
					<p class="text-warning-emphasis me-2 mb-2 mb-lg-0">Libro:</p>
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

<!-- Componente del libro seleccionado -->
{#if selectedBook && bookDetails && selectedVersion}
	<Chapter {selectedBook} {selectedVersion} {bookDetails} />
{/if}