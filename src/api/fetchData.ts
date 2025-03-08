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
    const request = store.put({ key, data, timestamp: Date.now() });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`Guardado en IndexedDB: clave=${key}`, data);
        resolve();
      };
      transaction.onerror = () => {
        console.error("Error en la transacción de IndexedDB:", transaction.error);
        reject(transaction.error);
      };
      request.onerror = () => {
        console.error("Error guardando en IndexedDB:", request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Error inesperado guardando en IndexedDB:", error);
    throw error;
  }
}

// Función para recuperar datos de IndexedDB
async function getFromIndexedDB(key: string): Promise<any | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(CONFIG.cacheObjectStore, "readonly");
    const store = transaction.objectStore(CONFIG.cacheObjectStore);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`Recuperado de IndexedDB (clave=${key}):`, request.result);
        resolve(request.result ? request.result.data : null); // Devuelve solo los datos
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error recuperando de IndexedDB:", error);
    throw error;
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
  return fetchAndCache<ChapterData>(`chapter_${version}_${book}_${chapter}`, url);
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

// Función principal para cargar toda la Biblia en IndexedDB
export async function preloadFullBible(): Promise<void> {
  const versions = await fetchVersions();

  for (const version of versions) {
    console.log(`Descargando libros para la versión: ${version.name}`);
    const books = await fetchBooks(version.version);

    for (const book of books) {
      console.log(`Descargando capítulos para el libro: ${book.abrev}`);

      for (let chapter = 1; chapter <= book.chapters; chapter++) {
        try {
          await fetchChapter(version.version, book.abrev, chapter);
          console.log(`Capítulo guardado: ${version.version} - ${book.abrev} - Capítulo ${chapter}`);
        } catch (error) {
          console.error(`Error al descargar el capítulo ${chapter} del libro ${book.abrev}:`, error);
        }
      }
    }
  }

  console.log("Toda la Biblia ha sido precargada y almacenada en IndexedDB.");
}

// Función para verificar si toda la Biblia está descargada
export async function isBibleFullyDownloaded(): Promise<boolean> {
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
}
