// Archivo vacío funcional: Este solo registra un Service Worker válido
self.addEventListener("install", () => {
  console.log("Service Worker instalado.");
});

self.addEventListener("activate", () => {
  console.log("Service Worker activado.");
});
