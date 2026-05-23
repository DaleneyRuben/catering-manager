import { useState, useEffect } from 'react';
import { Icon } from '../components/ui/Icon';
import api from '../services/api';

type Status = 'loading' | 'ok' | 'error';

export function HealthPage() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const check = async () => {
      try {
        await api.get('/health');
        setStatus('ok');
      } catch {
        setStatus('error');
      }
    };
    check();
  }, []);

  return (
    <div className="p-8 max-w-sm">
      <h1 className="font-serif text-3xl text-ink mb-6">Health</h1>
      <div className="flex items-center gap-4 p-4 rounded-lg border border-rule bg-paper">
        {status === 'loading' && (
          <>
            <Icon name="refresh" size={20} className="text-muted animate-spin" />
            <span className="text-muted text-sm">Verificando...</span>
          </>
        )}
        {status === 'ok' && (
          <>
            <div className="w-8 h-8 rounded-full bg-ok-bg flex items-center justify-center shrink-0">
              <Icon name="check" size={16} className="text-ok" />
            </div>
            <div>
              <p className="font-semibold text-ink text-sm">Conectado</p>
              <p className="text-muted text-xs">Backend respondiendo correctamente</p>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-8 h-8 rounded-full bg-alert-bg flex items-center justify-center shrink-0">
              <Icon name="alert" size={16} className="text-alert" />
            </div>
            <div>
              <p className="font-semibold text-ink text-sm">Sin conexión</p>
              <p className="text-muted text-xs">No se pudo conectar al backend</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
