// Polyfill para Node < 22 requerido por Expo SDK 58 (@expo/cli)
if (typeof URL !== 'undefined' && !URL.parse) {
  URL.parse = function (url, base) {
    try {
      return new URL(url, base);
    } catch {
      return null;
    }
  };
}


