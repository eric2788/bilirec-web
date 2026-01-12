/* Minimal StreamSaver service worker loader.
   This worker delegates to the official StreamSaver MITM script hosted on unpkg.
   It keeps the worker tiny and avoids bundling the whole mitm into the repo.
   NOTE: Using the CDN means the worker must be reachable; for maximum reliability you
   can vendor the mitm script here instead.
*/

importScripts('https://unpkg.com/streamsaver@2.0.5/mitm.min.js');

/* No extra code required; the imported script handles incoming requests. */
