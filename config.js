/* AXION · Configuración de la app.
 * API_URL: pegue aquí la URL de su implementación de Apps Script (termina en /exec).
 * Vacío = servidor de prueba local (node dev/servidor_local.js).
 */
window.AXION_CONFIG = {
  // Servidor de producción (Apps Script "AXION Servidor", cuenta del administrador). Vacío = pruebas locales.
  API_URL: (location.hostname === 'localhost' || location.protocol === 'file:') ? ''
    : 'https://script.google.com/macros/s/AKfycbwSNJcSc5tSLn6To36y1uLgimKfVLEnB8nNllA__DBBwOo8FXaRKPdhnQSq5Yx4sRLj0A/exec'
};
