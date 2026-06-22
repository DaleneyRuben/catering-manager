import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Field, inputCls } from '../../components/ui/Field';
import type { AppUser, UserDraft, UserUpdateDraft } from '../../hooks/useUsers';
import { ROLES, type UserRole } from '../../constants/roles';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: ROLES.SUPER_ADMIN, label: 'Super admin' },
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.KITCHEN, label: 'Cocina' },
  { value: ROLES.DELIVERY, label: 'Delivery' },
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
  isSelf?: boolean;
  onSave: (draft: UserUpdateDraft) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
};

type Props = CreateProps | EditProps;

export function UserModal(props: Props) {
  const { mode, onClose, isSaving } = props;
  const isSelf = mode === 'edit' ? ((props as EditProps).isSelf ?? false) : false;
  const initial = mode === 'edit' ? (props as EditProps).user : null;

  const [username, setUsername] = useState(initial?.username ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(initial?.role ?? ROLES.ADMIN);
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
    <Modal onClose={onClose} className="rounded-[10px] w-[min(480px,92vw)]">
      <div className="flex items-center gap-2.5 px-[22px] py-[18px] border-b border-rule">
        <Icon name="users" size={16} />
        <p className="flex-1 font-serif text-[20px] leading-tight text-ink">
          {mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-[34px] h-[34px] flex items-center justify-center border border-rule rounded-md bg-paper text-faint hover:text-ink-2 hover:bg-cream-2 transition-colors"
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink-2 transition-colors"
              tabIndex={-1}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={15} />
            </button>
          </div>
        </Field>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">Rol</p>
          <div className="flex gap-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={[
                  'flex-1 py-2 text-[12.5px] rounded-md border transition-colors',
                  role === r.value
                    ? 'bg-olive-800 text-olive-50 font-semibold border-olive-800'
                    : 'bg-white text-muted font-medium border-rule hover:bg-cream-2',
                ].join(' ')}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2.5 mt-1">
          {mode === 'edit' && !isSelf && !confirmDelete && (
            <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={isSaving}>
              Eliminar
            </Button>
          )}
          {mode === 'edit' && !isSelf && confirmDelete && (
            <Button variant="alert" onClick={handleDelete} disabled={isSaving}>
              ¿Confirmar?
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !canSave}
            loading={isSaving}
            leftIcon="check"
          >
            {mode === 'create' ? 'Crear' : 'Guardar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
