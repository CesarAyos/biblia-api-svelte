
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        console.log("Service Worker registrado con éxito.");
      })
      .catch((error) => {
        console.error("Error al registrar el Service Worker:", error);
      });
  }

  import type { HandleClientError } from '@sveltejs/kit';

  export const handleError: HandleClientError = ({ error, event }) => {
      // Narrow down the 'error' type
      if (error instanceof Error) {
          console.error('Error capturado:', error.message);
          return {
              message: error.message,
              code: error.name || 'UNKNOWN'
          };
      } else {
          console.error('Error desconocido:', error);
          return {
              message: 'Ocurrió un error inesperado.',
              code: 'UNKNOWN'
          };
      }
  };

  const init = () => {
    console.log("Initialization");
};

export { init };

  


  
  