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
function openDatabase(dbName: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("cache")) {
        db.createObjectStore("cache", { keyPath: "key" });
        console.log("Almacén de objetos 'cache' creado");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Función para guardar datos en IndexedDB
async function saveToIndexedDB(dbName: string, key: string, data: any): Promise<void> {
  try {
    const db = await openDatabase(dbName, 1);
    const transaction = db.transaction("cache", "readwrite");
    const store = transaction.objectStore("cache");
    store.put({ key, data, timestamp: Date.now() });
    console.log(`Guardado en IndexedDB: clave=${key}`, data);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error("Error guardando en IndexedDB:", error);
    throw error;
  }
}

// Función para recuperar datos de IndexedDB
async function getFromIndexedDB(dbName: string, key: string): Promise<any | null> {
  try {
    const db = await openDatabase(dbName, 1);
    const transaction = db.transaction("cache", "readonly");
    const store = transaction.objectStore("cache");
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`Recuperado de IndexedDB (clave=${key}):`, request.result);
        resolve(request.result ? request.result : null);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error recuperando de IndexedDB:", error);
    throw error;
  }
}

// Función para verificar expiración del caché
function isCacheExpired(timestamp: number, expirationInHours: number): boolean {
  const isExpired = Date.now() > timestamp + expirationInHours * 60 * 60 * 1000;
  console.log(`¿Caché expirado? ${isExpired} (timestamp=${timestamp})`);
  return isExpired;
}

// Función para obtener las versiones de la Biblia
export async function fetchVersions(): Promise<Version[]> {
  const dbName = "BibleCache";
  const cacheKey = "bible_versions";

  const cached = await getFromIndexedDB(dbName, cacheKey);
  if (cached && !isCacheExpired(cached.timestamp, 24)) {
    return cached.data; // Retornar datos desde caché
  }

  const url = "https://bible-api.deno.dev/api/versions";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener las versiones: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  await saveToIndexedDB(dbName, cacheKey, data);
  return data;
}

// Función para obtener los libros de una versión
export async function fetchBooks(version: string): Promise<Book[]> {
  const dbName = "BibleCache";
  const cacheKey = `books_${version}`;

  const cached = await getFromIndexedDB(dbName, cacheKey);
  if (cached && !isCacheExpired(cached.timestamp, 24)) {
    return cached.data; // Retornar datos desde caché
  }

  const url = `https://bible-api.deno.dev/api/books?version=${version}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener los libros: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  await saveToIndexedDB(dbName, cacheKey, data);
  return data;
}

// Función para obtener un capítulo
export async function fetchChapter(version: string, book: string, chapter: number): Promise<ChapterData> {
  const dbName = "BibleCache";
  const cacheKey = `chapter_${version}_${book}_${chapter}`;

  const cached = await getFromIndexedDB(dbName, cacheKey);
  if (cached && !isCacheExpired(cached.timestamp, 24)) {
    return cached.data; // Retornar datos desde caché
  }

  const url = `https://bible-api.deno.dev/api/read/${version}/${book}/${chapter}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener el capítulo: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  await saveToIndexedDB(dbName, cacheKey, data);
  return data;
}

// Función para realizar búsquedas
export async function fetchSearch(version: string, query: string, take: number = 10, page: number = 1): Promise<SearchData> {
  if (!version || !query) {
    throw new Error("Los parámetros 'version' y 'query' son obligatorios.");
  }

  const url = `https://bible-api.deno.dev/api/read/${version}/search?q=${encodeURIComponent(query)}&take=${take}&page=${page}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error al realizar la búsqueda: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
