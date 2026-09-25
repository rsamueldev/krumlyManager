import { VentaPayload } from './ventasService';

const DB_NAME = 'KrumlyOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'ventas_offline';

export interface VentaOfflineRecord {
  id: string;
  codigoTemp: string;
  timestamp: number;
  payload: VentaPayload;
}

function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB no está soportado en este navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result as IDBDatabase);
    };

    request.onerror = (event: any) => {
      reject(event.target.error || new Error('Error al abrir IndexedDB'));
    };
  });
}

/**
 * Guarda un ticket de venta en el almacenamiento local IndexedDB cuando no hay conexión.
 */
export async function guardarVentaOffline(payload: VentaPayload): Promise<VentaOfflineRecord> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const codigoTemp = `VNT-OFFLINE-${randomSuffix}`;
    const id = `off_${Date.now()}_${randomSuffix}`;

    const record: VentaOfflineRecord = {
      id,
      codigoTemp,
      timestamp: Date.now(),
      payload: {
        ...payload,
        estadoSincronizacion: 'offline_pending',
      },
    };

    const request = store.add(record);

    request.onsuccess = () => {
      resolve(record);
    };

    request.onerror = (event: any) => {
      reject(event.target.error || new Error('Error al guardar venta en IndexedDB'));
    };
  });
}

/**
 * Obtiene todas las ventas pendientes almacenadas en IndexedDB.
 */
export async function obtenerVentasOffline(): Promise<VentaOfflineRecord[]> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = (event: any) => {
      reject(event.target.error || new Error('Error al consultar ventas offline'));
    };
  });
}

/**
 * Elimina una venta específica de IndexedDB tras ser sincronizada exitosamente.
 */
export async function eliminarVentaOffline(id: string): Promise<void> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event: any) => {
      reject(event.target.error || new Error('Error al eliminar venta offline'));
    };
  });
}

/**
 * Vacía todas las ventas offline almacenadas de IndexedDB.
 */
export async function vaciarVentasOffline(): Promise<void> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event: any) => {
      reject(event.target.error || new Error('Error al vaciar almacén offline'));
    };
  });
}
