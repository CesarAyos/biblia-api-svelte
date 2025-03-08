// Configuración global para evitar valores duplicados y centralizar configuraciones
const CONFIG = {
  dbName: "BibleCache",
  cacheObjectStore: "cache",
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

// Función para abrir la base de datos de IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Verificar si estamos en el navegador
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("indexedDB no está disponible en este entorno."));
      return;
    }

    const request = indexedDB.open(CONFIG.dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CONFIG.cacheObjectStore)) {
        db.createObjectStore(CONFIG.cacheObjectStore, { keyPath: "key" });
        console.log("Almacén de objetos 'cache' creado");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Función para guardar datos en IndexedDB
async function saveToIndexedDB(key: string, data: any): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(CONFIG.cacheObjectStore, "readwrite");
    const store = transaction.objectStore(CONFIG.cacheObjectStore);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`Guardado en IndexedDB: clave=${key}`, data);
        resolve();
      };
      transaction.onerror = () => {
        console.error("Error en la transacción de IndexedDB:", transaction.error);
        reject(transaction.error);
      };
      store.put({ key, data, timestamp: Date.now() });
    });
  } catch (error) {
    console.error("Error inesperado guardando en IndexedDB:", error);
    throw error;
  }
}

// Función para recuperar datos de IndexedDB
export async function getFromIndexedDB(key: string): Promise<any | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(CONFIG.cacheObjectStore, "readonly");
    const store = transaction.objectStore(CONFIG.cacheObjectStore);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        console.log(`Recuperado de IndexedDB (clave=${key}):`, request.result);
        resolve(request.result ? request.result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error recuperando de IndexedDB con clave=${key}:`, error);
    return null;
  }
}

// Función para obtener datos de la API y guardar en IndexedDB si no existe
async function fetchAndCache<T>(key: string, url: string): Promise<T> {
  const cachedData = await getFromIndexedDB(key);
  if (cachedData) {
    console.log(`Datos obtenidos desde la caché (clave=${key})`);
    return cachedData;
  }

  console.log(`Descargando datos desde la API: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener datos de la API: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  await saveToIndexedDB(key, data); // Guardar en IndexedDB
  return data;
}

// Función para obtener las versiones de la Biblia
export async function fetchVersions(): Promise<Version[]> {
  const url = `${CONFIG.apiBaseUrl}/versions`;
  return fetchAndCache<Version[]>("bible_versions", url);
}

// Función para obtener los libros de una versión
export async function fetchBooks(version: string): Promise<Book[]> {
  const url = `${CONFIG.apiBaseUrl}/books?version=${version}`;
  return fetchAndCache<Book[]>(`books_${version}`, url);
}

// Función para obtener un capítulo
export async function fetchChapter(version: string, book: string, chapter: number): Promise<ChapterData> {
  const url = `${CONFIG.apiBaseUrl}/read/${version}/${book}/${chapter}`;
  const data = await fetchAndCache<ChapterData>(`chapter_${version}_${book}_${chapter}`, url);

  // Guardar versículos individuales en IndexedDB
  await saveChapterToIndexedDB(`chapter_${version}_${book}_${chapter}`, data.vers);

  return data;
}

// Función para realizar búsquedas
export async function fetchSearch(version: string, query: string, take: number = 10, page: number = 1): Promise<SearchData> {
  if (!version || !query) {
    throw new Error("Los parámetros 'version' y 'query' son obligatorios.");
  }

  const url = `${CONFIG.apiBaseUrl}/read/${version}/search?q=${encodeURIComponent(query)}&take=${take}&page=${page}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error al realizar la búsqueda: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Función para guardar capítulos en IndexedDB
async function saveChapterToIndexedDB(chapterKey: string, verses: any[]): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(CONFIG.cacheObjectStore, "readwrite");
    const store = transaction.objectStore(CONFIG.cacheObjectStore);

    for (const verse of verses) {
      const key = `${chapterKey}_verse_${verse.number}`;
      store.put({ key, data: verse, timestamp: Date.now() });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`Capítulo completo guardado con versículos individuales: ${chapterKey}`);
        resolve();
      };
      transaction.onerror = () => {
        console.error("Error en la transacción de IndexedDB:", transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error("Error inesperado al guardar versículos en IndexedDB:", error);
    throw error;
  }
}

// Función para descargar múltiples capítulos en paralelo con límite de concurrencia
async function downloadChaptersInParallel(version: string, book: Book, concurrencyLimit: number = 5): Promise<void> {
  const chaptersToDownload = Array.from({ length: book.chapters }, (_, i) => i + 1);

  // Función para descargar un capítulo específico
  const downloadChapter = async (chapter: number): Promise<void> => {
    const cacheKey = `chapter_${version}_${book.abrev}_${chapter}`;
    const cachedData = await getFromIndexedDB(cacheKey);

    if (!cachedData) {
      try {
        await fetchChapter(version, book.abrev, chapter);
        console.log(`Guardado capítulo ${chapter} del libro ${book.abrev} (${version})`);
      } catch (error) {
        console.error(`Error al guardar el capítulo ${chapter} del libro ${book.abrev}:`, error);
      }
    }
  };

  // Función para manejar la concurrencia
  const runWithConcurrency = async (tasks: (() => Promise<void>)[], limit: number): Promise<void> => {
    const executing = new Set<Promise<void>>(); // Set de promesas en ejecución

    for (const task of tasks) {
      // Crear una promesa que se resuelve cuando la tarea termina
      const promise = task().then(() => {
        executing.delete(promise); // Eliminar la promesa del conjunto cuando termine
      });

      executing.add(promise); // Añadir la promesa al conjunto

      // Si se alcanza el límite de concurrencia, esperar a que alguna promesa termine
      if (executing.size >= limit) {
        await Promise.race(executing); // Esperar a que la primera promesa termine
      }
    }

    // Esperar a que todas las promesas restantes terminen
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
    const versions = await fetchVersions();
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
        await downloadChaptersInParallel(version.version, book);

        // Actualizar progreso
        currentChapter += book.chapters;
        const progress = Math.floor((currentChapter / totalChapters) * 100);
        setProgress(progress); // Llamada al callback para actualizar el progreso
      }
    }

    console.log("Toda la Biblia ha sido descargada y almacenada en el caché.");
  } catch (error) {
    console.error("Error durante la precarga de la Biblia:", error);
  }
}

// Función para verificar si toda la Biblia está descargada
export async function isBibleFullyDownloaded(): Promise<boolean> {
  try {
    const versions = await fetchVersions();
    for (const version of versions) {
      const books = await fetchBooks(version.version);
      for (const book of books) {
        for (let chapter = 1; chapter <= book.chapters; chapter++) {
          const cacheKey = `chapter_${version.version}_${book.abrev}_${chapter}`;
          const cachedData = await getFromIndexedDB(cacheKey);
          if (!cachedData) {
            console.warn(`Falta el capítulo ${chapter} del libro ${book.abrev} en la versión ${version.version}`);
            return false;
          }
        }
      }
    }
    console.log("La Biblia está completamente descargada y almacenada.");
    return true;
  } catch (error) {
    console.error("Error al verificar si la Biblia está descargada:", error);
    return false;
  }
}

// Función para inicializar la aplicación
export async function initializeApp(): Promise<void> {
  console.log("Iniciando la aplicación y precargando la Biblia...");

  // Progreso inicializado
  let progress = 0;

  // Callback para actualizar el progreso
  const setProgress = (value: number): void => {
    progress = value;
    console.log(`Progreso actual: ${progress}%`);
  };

  // Llamada a preloadFullBible con el callback
  await preloadFullBible(setProgress);

  // Verificar que toda la Biblia se descargó correctamente
  const isComplete = await isBibleFullyDownloaded();
  if (isComplete) {
    console.log("Toda la Biblia está descargada y lista.");
  } else {
    console.warn("La descarga terminó, pero algunos datos pueden faltar.");
  }

  console.log("Aplicación lista.");
}


export async function validateDownloadComplete(): Promise<boolean> {
  try {
    const isComplete = await isBibleFullyDownloaded(); // Verifica si todos los datos están en IndexedDB
    if (isComplete) {
      console.log("Validación completa: Toda la Biblia está descargada.");
    } else {
      console.warn("Faltan algunos capítulos. Verifica los datos.");
    }
    return isComplete;
  } catch (error) {
    console.error("Error al validar la descarga:", error);
    return false;
  }
}

