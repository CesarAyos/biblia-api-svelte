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
        } else {
            selectedVerses.push({ number: verseNumber, text: verseText });
        }
        selectedVerses = [...selectedVerses];
    }

    function copySelectedVerses() {
        if (selectedVerses.length > 0) {
            const textToCopy = selectedVerses
                .map(
                    (v) =>
                        `${selectedBook || 'Libro desconocido'} (${selectedVersion || 'Versión desconocida'}), Capítulo ${selectedChapter || 'N/A'}, Versículo ${v.number}: ${v.text}`
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

    function shareSelectedVersesViaWhatsApp() {
        if (selectedVerses.length > 0) {
            const textToShare = selectedVerses
                .map(
                    (v) =>
                        `${selectedBook || 'Libro desconocido'} (${selectedVersion || 'Versión desconocida'}), Capítulo ${selectedChapter || 'N/A'}, Versículo ${v.number}: ${v.text}`
                )
                .join('\n');
            const shareURL = `https://wa.me/?text=${encodeURIComponent(textToShare)}`;
            window.open(shareURL, '_blank');
        } else {
            feedbackMessage = 'Selecciona al menos un versículo para compartir.';
            setTimeout(() => (feedbackMessage = null), 3000);
        }
    }
</script>

<main>
    <div class="overflow-x-auto mt-4">
        {#if bookDetails}
            <section class="chapter-container">
                {#each Array(bookDetails.chapters).fill(0).map((_, i) => i + 1) as chapter}
                    <button
                        type="button"
                        on:click={() => {
                            selectedChapter = chapter;
                            loadChapter();
                        }}
                        disabled={isLoading}
                        class="chapter-btn"
                    >
                        Capítulo {chapter}
                    </button>
                {/each}
            </section>
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
        <div class="sticky-container">
            <h3 class="text-center text-warning-emphasis">Capítulo {selectedChapter}</h3>

            {#if selectedVerses.length > 0}
                <div id="actions" class="actions-container">
                    <button on:click={copySelectedVerses} class="btn btn-primary">Copiar</button>
                    <button on:click={shareSelectedVersesViaWhatsApp} class="btn btn-success">WhatsApp</button>
                    <p class="feedback-message">{feedbackMessage}</p>
                </div>
            {/if}
        </div>

        <ul class="verse-list scroll-container">
            {#each chapterData.vers as verse}
                <li class="verse-item">
                    <button
                        type="button"
                        class="verse-btn {selectedVerses.find((v) => v.number === verse.number) ? 'selected' : ''}"
                        on:click={() => toggleVerseSelection(verse.number, verse.verse)}
                    >
                        <strong class="verse-number">{verse.number}:</strong> {verse.verse}
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</main>


  
<style>
	.sticky-container {
    position: sticky;
    top: 0; /* Mantenerse pegado a la parte superior */
    background-color: #f8f9fa;
    z-index: 10;
    padding: 10px;
    border-bottom: 1px solid #dee2e6;
}

.scroll-container {
    max-height: 400px; /* Altura máxima del contenedor de versículos */
    overflow-y: auto; /* Activar desplazamiento vertical */
    padding: 10px;
    background-color: #fefefe;
    border: 1px solid #dee2e6;
    border-radius: 8px;
}

.chapter-container {
    display: flex;
    gap: 10px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 8px;
}
.chapter-btn {
    min-width: 130px;
    padding: 8px;
    border: none;
    border-radius: 5px;
    background-color: #ffc107;
    color: #212529;
    cursor: pointer;
}
.chapter-btn:hover {
    background-color: #e0a800;
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

</style>
  