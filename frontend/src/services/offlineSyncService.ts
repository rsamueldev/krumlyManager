import { obtenerVentasOffline, eliminarVentaOffline, vaciarVentasOffline } from './offlineStorage';
import { syncVentasOfflineApi } from './ventasService';

export async function ejecutarSincronizacionOffline(manual: boolean = false): Promise<number> {
  if (!navigator.onLine) {
    if (manual) {
      throw new Error('No hay conexión a internet disponible. Conéctate a una red para sincronizar.');
    }
    return 0;
  }

  try {
    const pendientes = await obtenerVentasOffline();
    if (pendientes.length === 0) {
      return 0;
    }

    const payloads = pendientes.map((item) => ({
      ...item.payload,
      codigoVenta: item.codigoTemp,
      fechaVenta: new Date(item.timestamp).toISOString(),
    }));

    const synced = await syncVentasOfflineApi(payloads);

    if (synced && Array.isArray(synced) && synced.length > 0) {
      const codigosExitosos = new Set(synced.map((s) => s.codigoVenta));
      let eliminadas = 0;

      for (const item of pendientes) {
        if (codigosExitosos.has(item.codigoTemp)) {
          await eliminarVentaOffline(item.id);
          eliminadas++;
        }
      }

      // Si se sincronizaron todas, limpiar completamente el almacén
      if (eliminadas >= pendientes.length) {
        await vaciarVentasOffline();
      }

      return synced.length;
    }

    if (manual && (!synced || synced.length === 0)) {
      throw new Error('El servidor no pudo sincronizar las ventas pendientes. Revisa el registro de auditoría.');
    }
  } catch (err: any) {
    if (manual) {
      throw err;
    }
    console.warn('Intento de sincronización offline en segundo plano omitido:', err);
  }

  return 0;
}

