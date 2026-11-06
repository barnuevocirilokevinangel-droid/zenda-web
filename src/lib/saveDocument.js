/** Tiempo máximo de espera al guardar antes de considerar que falló. */
const SAVE_TIMEOUT_MS = 8000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Tiempo de espera agotado (${ms} ms).`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Guarda un documento en Firestore con `createdAt` (serverTimestamp).
 * Firebase se carga bajo demanda para no aumentar el bundle inicial.
 *
 * - Sin credenciales en desarrollo: simula el guardado (para poder probar el flujo).
 * - Sin credenciales en producción, o ante cualquier fallo: lanza un Error para que
 *   la interfaz muestre el problema y permita reintentar (no se pierde información en silencio).
 */
export async function saveDocument(collectionName, data) {
  const [{ db }, { addDoc, collection, serverTimestamp }] = await Promise.all([
    import('../firebase.js'),
    import('firebase/firestore'),
  ]);

  if (!db) {
    if (import.meta.env.DEV) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      console.info(`[Zenda] Documento simulado en "${collectionName}" (Firebase no configurado):`, data);
      return { simulated: true };
    }
    throw new Error('Firestore no está inicializado.');
  }

  await withTimeout(
    addDoc(collection(db, collectionName), { ...data, createdAt: serverTimestamp() }),
    SAVE_TIMEOUT_MS,
  );
  return { simulated: false };
}
