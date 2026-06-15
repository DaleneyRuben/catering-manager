import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Field, inputCls } from '../../components/ui/Field';
import type { AppUser, UserDraft, UserUpdateDraft } from '../../hooks/useUsers';
import type { UserRole } from '../../contexts/AuthContext';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'delivery', label: 'Delivery' },
];

type CreateProps = {
  mode: 'create';
  onSave: (draft: UserDraft) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
};

type EditProps = {
  mode: 'edit';
  user: AppUser;
  onSave: (draft: UserUpdateDraft) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
};

type Props = CreateProps | EditProps;

export function UserModal(props: Props) {
  const { mode, onClose, isSaving } = props;
  const initial = mode === 'edit' ? (props as EditProps).user : null;

  const [username, setUsername] = useState(initial?.username ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(initial?.role ?? 'manager');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canSave = mode === 'create' ? !!username && !!password : !!username;

  const handleSave = async () => {
    if (mode === 'create') {
      await (props as CreateProps).onSave({ username, password, role });
    } else {
      const draft: UserUpdateDraft = { username, role };
      if (password) draft.password = password;
      await (props as EditProps).onSave(draft);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (mode === 'edit') {
      await (props as EditProps).onDelete();
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[rgba(20,40,6,0.32)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-cream border border-rule-2 rounded-[10px] w-[min(480px,92vw)] shadow-[0_20px_60px_rgba(20,40,6,0.25)]"
      >
        <div className="flex items-center gap-2.5 px-[22px] py-[18px] border-b border-rule">
          <Icon name="users" size={16} />
          <p className="flex-1 font-serif text-[20px] leading-tight text-ink">
            {mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-[34px] h-[34px] flex items-center justify-center border border-rule rounded-md bg-paper hover:bg-cream-2 transition-colors"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="p-[22px] flex flex-col gap-4">
          <Field label="Usuario" htmlFor="username" required>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls()}
              autoComplete="off"
            />
          </Field>

          <Field
            label={mode === 'edit' ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            htmlFor="password"
            required={mode === 'create'}
          >
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls()} pr-9`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                tabIndex={-1}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={15} />
              </button>
            </div>
          </Field>

          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">Rol</p>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={[
                    'flex-1 py-2 text-[12px] font-medium rounded-md border transition-colors',
                    role === r.value
                      ? 'bg-olive-800 text-white border-olive-800'
                      : 'bg-paper text-ink border-rule hover:bg-cream-2',
                  ].join(' ')}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 mt-1">
            {mode === 'edit' && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={isSaving}
                className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-warn hover:bg-cream-2 transition-colors disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
            {mode === 'edit' && confirmDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2.5 text-[13px] font-semibold border border-alert rounded-md text-alert hover:bg-alert-bg transition-colors disabled:opacity-50"
              >
                ¿Confirmar?
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !canSave}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Icon name="check" size={14} />
              )}
              {mode === 'create' ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
