<script lang="ts">
  import { onMount } from 'svelte';
  import type { Book, Chapter } from '../typs';

  // Props
  export let selectedVersion: string;
  export let selectedBook: string;
  export let selectedChapter: string;
  export let onVersionChange: (version: string) => void;
  export let onBookChange: (book: string) => void;
  export let onChapterChange: (chapter: string) => void;
  
  // Datos bíblicos
  let bibleData: Book | null = null;
  let currentChapter: Chapter | null = null;
  let isLoading: boolean = false;
  let selectedVerse: number | null = null;

  // Listas de selección
  const versions = ["DHH94I", "DHHS94", "LBLA", "NBLA", "NTV", "NVI", "RVA2015", "RVC", "RVR1960", "TLA", "TLAI"];
  const books = ["GEN", "EXO", "LEV", "NUM", "DEU"];

  // Función para cargar los datos de la Biblia
  async function loadBible(version: string, book: string) {
    try {
      isLoading = true;
      const response = await fetch(`/${version}/${book}.json`);
      if (!response.ok) throw new Error(`Error ${response.status}: Archivo no encontrado`);

      bibleData = await response.json();
      selectedVerse = null;
    } catch (error) {
      console.error("Error cargando la Biblia:", error);
      bibleData = null;
    } finally {
      isLoading = false;
    }
  }

  // Actualizar el capítulo actual
  $: if (bibleData && selectedChapter) {
    currentChapter = bibleData?.chapters?.find((ch) => ch.chapter_usfm?.endsWith(selectedChapter)) || null;
  }

  // Función para desplazar al versículo seleccionado
  function scrollToVerse() {
    setTimeout(() => {
      if (selectedVerse) {
        const verseElement = document.getElementById(`verse-${selectedVerse}`);
        verseElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }

  // Cargar la Biblia cuando cambian los parámetros
  $: if (selectedVersion && selectedBook) {
    loadBible(selectedVersion, selectedBook);
  }
</script>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f9f9f9;
    -webkit-text-size-adjust: 100%;
  }
  
  .bible-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .header {
    position: sticky;
    top: 0;
    background-color: #4a6fa5;
    color: white;
    padding: 12px 15px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    z-index: 100;
  }
  
  .header h2 {
    margin: 0;
    font-size: 1.2rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .selectors {
    position: sticky;
    top: 60px;
    background-color: #f0f0f0;
    padding: 12px 15px;
    border-bottom: 1px solid #ddd;
    z-index: 99;
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  @media (min-width: 480px) {
    .selectors {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  .selector-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .selector-group label {
    font-weight: 600;
    font-size: 0.9rem;
    color: #555;
  }
  
  select {
    width: 100%;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    background-color: white;
    font-size: 16px;
    -webkit-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 1em;
  }
  
  .content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 15px;
  }
  
  .verse {
    margin-bottom: 20px;
    padding: 15px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    line-height: 1.7;
  }
  
  .verse-number {
    color: #4a6fa5;
    font-weight: bold;
    margin-right: 5px;
  }
  
  .loading {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
    padding: 20px;
    color: #666;
    text-align: center;
  }
  
  .loading p {
    margin: 0;
    font-size: 1.1rem;
  }
  
  @media (min-width: 768px) {
    .header h2 {
      font-size: 1.4rem;
    }
  }
</style>

<div class="bible-container">
  {#if isLoading}
    <div class="loading">
      <p>Cargando nueva versión...</p>
    </div>
  {:else}
    <div class="header">
      <h2>
        {#if bibleData && selectedChapter}
          {bibleData.name} - {selectedVersion} - Capítulo {selectedChapter}
        {:else}
          Selecciona un libro y capítulo
        {/if}
      </h2>
    </div>
    
    <div class="selectors">
      <div class="selector-group">
        <label for="version">Versión:</label>
        <select 
          id="version" 
          bind:value={selectedVersion} 
          on:change={() => onVersionChange(selectedVersion)}
        >
          {#each versions as version}
            <option value={version}>{version}</option>
          {/each}
        </select>
      </div>
      
      <div class="selector-group">
        <label for="book">Libro:</label>
        <select 
          id="book" 
          bind:value={selectedBook} 
          on:change={() => onBookChange(selectedBook)}
        >
          {#each books as book}
            <option value={book}>{book}</option>
          {/each}
        </select>
      </div>
      
      {#if selectedBook}
        <div class="selector-group">
          <label for="chapter">Capítulo:</label>
          <select 
            id="chapter" 
            bind:value={selectedChapter} 
            on:change={() => onChapterChange(selectedChapter)}
          >
            {#each Array(50).fill(0).map((_, i) => i + 1) as chapter}
              <option value={chapter}>{chapter}</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
    
    {#if bibleData && currentChapter}
      <div class="content">
        {#each currentChapter?.items as item}
          {#if item.type === 'verse'}
            <div class="verse" id={"verse-" + item.verse_numbers[0]}>
              <span class="verse-number">{item.verse_numbers.join(', ')}</span>
              <span>{item.lines.join(' ')}</span>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div class="loading">
        <p>{selectedBook ? "Selecciona un capítulo" : "Selecciona un libro"}</p>
      </div>
    {/if}
  {/if}
</div>