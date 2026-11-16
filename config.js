/* AXION · Configuración de la app.
 * API_URL: pegue aquí la URL de su implementación de Apps Script (termina en /exec).
 * Vacío = servidor de prueba local (node dev/servidor_local.js).
 */
window.AXION_CONFIG = {
  // Servidor de producción (Apps Script "AXION Servidor", cuenta amdplanner@gmail.com desde el 16/11/2026). Vacío = pruebas locales.
  // El servidor de la cuenta anterior (AKfycbwSNJ…) reenvía aquí todo lo que le llegue.
  API_URL: (location.hostname === 'localhost' || location.protocol === 'file:') ? ''
    : 'https://script.google.com/macros/s/AKfycbx7R2nkiSYpJZEP5B9bX8JdZvL-rGs3FGNAOUT_oQFqLh3Q1eq_G8B6ginLNUXWd3Jd/exec'
};
