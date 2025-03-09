const CONFIG = {
  apiBaseUrl: "https://bible-api.deno.dev/api",
};

export interface Version {
  name: string;
  verse: string;
  uri: string;
  version: string;
}

export interface Book {
  names: string[];
  abrev: string;
  chapters: number;
  testament: string;
}

export interface ChapterData {
  vers: Array<{
    verse: string;
    number: number;
    id: number;
    study?: string;
  }>;
  chapter: number;
  name: string;
  num_chapters: number;
  testament: string;
}

// Función para obtener datos de la API
async function fetchFromAPI<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al obtener datos de la API: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error al obtener datos de la API:`, error);
    throw error;
  }
}

// Función para descargar un capítulo
export async function fetchChapter(version: string, book: string, chapter: number): Promise<ChapterData> {
  const url = `${CONFIG.apiBaseUrl}/read/${version}/${book}/${chapter}`;
  return fetchFromAPI<ChapterData>(url);
}

// Función para descargar múltiples capítulos en paralelo con límite de concurrencia
async function downloadChaptersInParallel(
  version: string,
  book: Book,
  concurrencyLimit: number = 5,
  onProgress: (progress: number) => void
): Promise<void> {
  const chaptersToDownload = Array.from({ length: book.chapters }, (_, i) => i + 1);

  // Función para descargar un capítulo específico
  const downloadChapter = async (chapter: number): Promise<void> => {
    try {
      const data = await fetchChapter(version, book.abrev, chapter);
      saveToLocalStorage(version, book.abrev, chapter, data);
      console.log(`Descargado y guardado: ${version}-${book.abrev}-${chapter}`);
    } catch (error) {
      console.error(`Error al descargar el capítulo ${chapter} del libro ${book.abrev}:`, error);
      throw error;
    }
  };

  // Función para manejar la concurrencia
  const runWithConcurrency = async (tasks: (() => Promise<void>)[], limit: number): Promise<void> => {
    const executing = new Set<Promise<void>>();

    for (const task of tasks) {
      const promise = task().then(() => {
        executing.delete(promise);
      });

      executing.add(promise);

      if (executing.size >= limit) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
  };

  // Crear tareas de descarga
  const tasks = chaptersToDownload.map((chapter, index) => {
    return () => {
      return downloadChapter(chapter).then(() => {
        const progress = Math.floor(((index + 1) / chaptersToDownload.length) * 100);
        onProgress(progress); // Actualizar el progreso
      });
    };
  });

  // Ejecutar tareas con límite de concurrencia
  await runWithConcurrency(tasks, concurrencyLimit);
}

// Función para descargar una versión completa de la Biblia
export async function preloadVersion(
  version: string,
  onProgress: (progress: number) => void
): Promise<void> {
  try {
    const books = await fetchBooks(version);
    let totalChapters = 0;

    // Calcular el número total de capítulos
    for (const book of books) {
      totalChapters += book.chapters;
    }

    let currentChapter = 0;

    // Descargar y guardar cada libro en paralelo
    for (const book of books) {
      await downloadChaptersInParallel(version, book, 5, (progress) => {
        const overallProgress = Math.floor((currentChapter + progress * book.chapters / 100) / totalChapters * 100);
        onProgress(overallProgress); // Actualizar el progreso general
      });

      currentChapter += book.chapters;
    }

    console.log(`Versión ${version} descargada y guardada en localStorage.`);
  } catch (error) {
    console.error(`Error durante la precarga de la versión ${version}:`, error);
    throw error;
  }
}

// Función para guardar datos en localStorage
function saveToLocalStorage(version: string, book: string, chapter: number, data: ChapterData): void {
  const key = `${version}-${book}-${chapter}`;
  const compressedData = JSON.stringify(data); // Comprimir datos
  localStorage.setItem(key, compressedData);
}

// Función para obtener datos de localStorage
export function getFromLocalStorage(version: string, book: string, chapter: number): ChapterData | null {
  const key = `${version}-${book}-${chapter}`;
  const compressedData = localStorage.getItem(key);
  return compressedData ? JSON.parse(compressedData) : null; // Descomprimir datos
}

// Función para obtener los libros de una versión específica
export async function fetchBooks(version: string): Promise<Book[]> {
  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}/books?version=${version}`);
    if (!response.ok) {
      throw new Error(`Error al obtener libros: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error al obtener libros para la versión ${version}:`, error);
    throw error;
  }
}

// Función para obtener las versiones de la Biblia
export async function fetchVersions(): Promise<Version[]> {
  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}/versions`);
    if (!response.ok) {
      throw new Error(`Error al obtener versiones: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error al obtener versiones:`, error);
    throw error;
  }
}