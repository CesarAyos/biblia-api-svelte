// Configuración global para evitar valores duplicados y centralizar configuraciones
const CONFIG = {
  apiBaseUrl: "https://bible-api.deno.dev/api",
};

// Interfaz para las versiones de la Biblia
export interface Version {
  name: string; // Nombre de la versión
  verse: string; // Versículo representativo de la versión
  uri: string; // URI de la versión
  version: string; // Identificador de la versión
}

// Interfaz para un libro de la Biblia
export interface Book {
  names: string[]; // Lista de nombres para cada libro
  abrev: string; // Abreviatura del libro
  chapters: number; // Número total de capítulos
  testament: string; // Testamento (old o new)
}

// Interfaz para los datos de un capítulo
export interface ChapterData {
  vers: Array<{
    verse: string; // Texto del versículo
    number: number; // Número del versículo
    id: number; // ID del versículo
    study?: string; // Estudio opcional
  }>;
  chapter: number; // Número del capítulo
  name: string; // Nombre del libro
  num_chapters: number; // Número total de capítulos
  testament: string; // Testamento
}

// Tipo para los datos de búsqueda
export type SearchData = {
  data: Array<{
    id: number;
    verse: string;
    book: string;
    chapter: number;
    number: number;
  }>;
  pagination?: {
    page: number; // Página actual
    total_pages: number; // Número total de páginas
    total_results: number; // Total de resultados
  };
  total: number; // Total de resultados
  page: number; // Página actual
  take: number; // Resultados por página
};

// Función para obtener datos de la API
async function fetchFromAPI<T>(url: string): Promise<T> {
  console.log(`Descargando datos desde la API: ${url}`);
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

// Función para obtener las versiones de la Biblia
export async function fetchVersions(): Promise<Version[]> {
  console.log("Obteniendo versiones desde la API...");
  const versions = await fetchFromAPI<Version[]>(`${CONFIG.apiBaseUrl}/versions`);
  console.log("Versiones obtenidas:", versions);

  // Eliminar el filtro para devolver todas las versiones
  return versions;
}
// Función para obtener los libros de una versión
export async function fetchBooks(version: string): Promise<Book[]> {
  return fetchFromAPI<Book[]>(`${CONFIG.apiBaseUrl}/books?version=${version}`);
}

// Función para obtener un capítulo
export async function fetchChapter(version: string, book: string, chapter: number): Promise<ChapterData> {
  const cachedData = getFromLocalStorage(version, book, chapter);
  if (cachedData) {
    console.log(`Datos obtenidos del localStorage: ${version}-${book}-${chapter}`);
    return cachedData;
  }

  const url = `${CONFIG.apiBaseUrl}/read/${version}/${book}/${chapter}`;
  const data = await fetchFromAPI<ChapterData>(url);
  saveToLocalStorage(version, book, chapter, data);
  return data;
}

// Función para realizar búsquedas
export async function fetchSearch(version: string, query: string, take: number = 10, page: number = 1): Promise<SearchData> {
  if (!version || !query) {
    throw new Error("Los parámetros 'version' y 'query' son obligatorios.");
  }

  const url = `${CONFIG.apiBaseUrl}/read/${version}/search?q=${encodeURIComponent(query)}&take=${take}&page=${page}`;
  return fetchFromAPI<SearchData>(url);
}

// Función para descargar múltiples capítulos en paralelo con límite de concurrencia
async function downloadChaptersInParallel(
  version: string,
  book: Book,
  concurrencyLimit: number = 5
): Promise<void> {
  const chaptersToDownload = Array.from({ length: book.chapters }, (_, i) => i + 1);

  // Función para descargar un capítulo específico
  const downloadChapter = async (chapter: number): Promise<void> => {
    try {
      const data = await fetchChapter(version, book.abrev, chapter);
      saveToLocalStorage(version, book.abrev, chapter, data); // Guardar en localStorage
      console.log(`Descargado y guardado capítulo ${chapter} del libro ${book.abrev} (${version})`);
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
  const tasks = chaptersToDownload.map(chapter => () => downloadChapter(chapter));

  // Ejecutar tareas con límite de concurrencia
  await runWithConcurrency(tasks, concurrencyLimit);
}

// Función para precargar toda la Biblia con paralelismo
export async function preloadFullBible(setProgress: (progress: number) => void): Promise<void> {
  try {
    const versions = await fetchVersions(); // Obtener todas las versiones
    let totalChapters = 0;

    // Calcular el número total de capítulos
    for (const version of versions) {
      const books = await fetchBooks(version.version);
      for (const book of books) {
        totalChapters += book.chapters;
      }
    }

    let currentChapter = 0;

    // Descargar y guardar cada capítulo en paralelo
    for (const version of versions) {
      const books = await fetchBooks(version.version);

      for (const book of books) {
        await downloadChaptersInParallel(version.version, book); // Descargar capítulos

        // Actualizar progreso
        currentChapter += book.chapters;
        const progress = Math.floor((currentChapter / totalChapters) * 100);
        setProgress(progress); // Llamada al callback para actualizar el progreso
      }
    }

    console.log("Toda la Biblia ha sido descargada y guardada en localStorage.");
  } catch (error) {
    console.error("Error durante la precarga de la Biblia:", error);
    throw error; // Relanzar el error para manejarlo en initializeApp
  }
}

// Función para inicializar la aplicación
export async function initializeApp(
  setProgress: (progress: number) => void
): Promise<void> {
  console.log("Iniciando la aplicación...");

  try {
    const versionsToDownload = await fetchVersions(); // Obtener solo las versiones filtradas

    for (const versionData of versionsToDownload) {
      console.log(`Precargando la versión ${versionData.version}...`);
      await preloadVersion(versionData.version, setProgress);
    }

    console.log("Descarga completada.");
  } catch (error) {
    console.error("Error durante la inicialización de la aplicación:", error);
    throw error;
  }
}

// Función para limpiar el localStorage antes de descargar una nueva versión
function clearLocalStorage(): void {
  localStorage.clear();
  console.log("localStorage limpiado.");
}


// Función para precargar una versión específica
export async function preloadVersion(
  version: string,
  setProgress: (progress: number) => void
): Promise<void> {
  try {
    clearLocalStorage(); // Limpiar localStorage antes de descargar

    const books = await fetchBooks(version); // Obtener los libros de la versión seleccionada
    let totalChapters = 0;

    // Calcular el número total de capítulos
    for (const book of books) {
      totalChapters += book.chapters;
    }

    let currentChapter = 0;

    // Descargar y guardar cada capítulo en paralelo
    for (const book of books) {
      await downloadChaptersInParallel(version, book); // Descargar capítulos

      // Actualizar progreso
      currentChapter += book.chapters;
      const progress = Math.floor((currentChapter / totalChapters) * 100);
      setProgress(progress); // Llamada al callback para actualizar el progreso
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
  const compressedData = compressData(data);
  localStorage.setItem(key, compressedData);
}

// Función para obtener datos de localStorage
function getFromLocalStorage(version: string, book: string, chapter: number): ChapterData | null {
  const key = `${version}-${book}-${chapter}`;
  const compressedData = localStorage.getItem(key);
  return compressedData ? decompressData(compressedData) : null;
}

// Función para mostrar un selector de versiones
export async function showVersionSelector(): Promise<string> {
  const versions = await fetchVersions(); // Obtener todas las versiones disponibles

  // Aquí podrías implementar la lógica para mostrar un selector de versiones en la UI
  // Por simplicidad, asumimos que el usuario selecciona la primera versión
  const selectedVersion = versions[0].version; // Cambia esto según la lógica de tu UI

  return selectedVersion;
}

// Función para inicializar la aplicación con la versión seleccionada
// Función principal para inicializar la aplicación con la versión seleccionada
export async function initializeAppWithSelectedVersion(
  setProgress: (progress: number) => void
): Promise<void> {
  console.log("Iniciando la aplicación con la versión seleccionada...");

  try {
    const selectedVersion = await showVersionSelector(); // Mostrar selector de versiones
    console.log(`Versión seleccionada: ${selectedVersion}`);

    // Precargar solo la versión seleccionada
    await preloadVersion(selectedVersion, setProgress);

    console.log("Descarga completada.");
  } catch (error) {
    console.error("Error durante la inicialización de la aplicación:", error);
    throw error;
  }
}

// Función para comprimir datos antes de guardar en localStorage
function compressData(data: ChapterData): string {
  // Aquí podrías usar una librería de compresión como LZString
  return JSON.stringify(data); // Por ahora, simplemente convertimos a JSON
}

// Función para descomprimir datos al leer de localStorage
function decompressData(compressedData: string): ChapterData {
  return JSON.parse(compressedData); // Por ahora, simplemente parseamos el JSON
}

