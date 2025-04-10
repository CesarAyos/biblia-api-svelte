<script lang="ts">
    export let selectedVersion: string;
    export let selectedBook: string;
    export let selectedChapter: string;
    export let onVersionChange: (version: string) => void;
    export let onBookChange: (book: string) => void;
    export let onChapterChange: (chapter: string) => void;
    
    const versions = ["DHH94I", "DHHS94", "LBLA", "NBLA", "NTV", "NVI", "RVA2015", "RVC", "RVR1960", "TLA", "TLAI"];
    const books = ["GEN", "EXO", "LEV", "NUM", "DEU"];
  </script>
  
  <pattern>Versión:</pattern>
  <select bind:value={selectedVersion} on:change={(e) => onVersionChange((e.target as HTMLSelectElement).value)}>
    {#each versions as version}
      <option value={version}>{version}</option>
    {/each}
  </select>
  
  <p>Libro:</p>
  <select bind:value={selectedBook} on:change={(e) => onBookChange((e.target as HTMLSelectElement).value)}>
    {#each books as book}
      <option value={book}>{book}</option>
    {/each}
  </select>
  
  {#if selectedBook}
    <p>Capítulo:</p>
    <select bind:value={selectedChapter} on:change={(e) => onChapterChange((e.target as HTMLSelectElement).value)}>
      {#each Array(50).fill(0).map((_, i) => i + 1) as chapter}
        <option value={chapter}>{chapter}</option>
      {/each}
    </select>
  {/if}
  