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

// Interfaz para los datos de búsqueda
export interface SearchData {
  data: Array<{
    book: string; // Nombre del libro
    chapter: number; // Número del capítulo
    number: number; // Número del versículo
    verse: string; // Texto del versículo
    id: number; // ID único del versículo
    study?: string; // Estudio opcional
  }>;
  total: number; // Total de resultados
  page: number; // Página actual
  take: number; // Cantidad de resultados por página
}

// Función para obtener las versiones de la Biblia
export async function fetchVersions(): Promise<Version[]> {
  const url = 'https://bible-api.deno.dev/api/versions';
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Error al obtener las versiones: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
  } catch (error) {
    console.error("Error en fetchVersions:", error);
    throw error;
  }
}

// Función para obtener los libros de una versión
export async function fetchBooks(version: string): Promise<Book[]> {
  if (!version) throw new Error("El parámetro 'version' es obligatorio.");

  const url = `https://bible-api.deno.dev/api/books?version=${version}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Error al obtener los libros de la versión "${version}": ${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
  } catch (error) {
    console.error("Error en fetchBooks:", error);
    throw error;
  }
}

// Función para obtener los versículos de un capítulo
export async function fetchChapter(version: string, book: string, chapter: number): Promise<ChapterData> {
  if (!version || !book || !chapter) {
    throw new Error("Los parámetros 'version', 'book' y 'chapter' son obligatorios.");
  }

  const url = `https://bible-api.deno.dev/api/read/${version}/${book}/${chapter}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(
        `Error al obtener el capítulo ${chapter} del libro "${book}" en la versión "${version}": ${resp.status} ${resp.statusText}`
      );
    }
    return await resp.json();
  } catch (error) {
    console.error("Error en fetchChapter:", error);
    throw error;
  }
}

// Función para realizar búsquedas
export async function fetchSearch(version: string, query: string, take: number = 10, page: number = 1): Promise<SearchData> {
  if (!version || !query) {
    throw new Error("Los parámetros 'version' y 'query' son obligatorios.");
  }

  const url = `https://bible-api.deno.dev/api/read/${version}/search?q=${encodeURIComponent(query)}&take=${take}&page=${page}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Error al realizar la búsqueda: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
  } catch (error) {
    console.error("Error en fetchSearch:", error);
    throw error;
  }
}
