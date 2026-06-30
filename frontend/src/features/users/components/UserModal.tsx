import { useState } from 'react';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Field, inputCls } from '@ui/Field';
import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { ConfirmModal } from '@ui/ConfirmModal';
import { MODAL_CANCEL_STYLE, MODAL_CONFIRM_STYLE } from '@ui/modalButtonStyles';
import { ROLES, type UserRole } from '@/constants/roles';
import type { AppUser, UserDraft, UserUpdateDraft } from '@/features/users/hooks/useUsers';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  if (showDeleteConfirm && mode === 'edit') {
    return (
      <ConfirmModal
        title="Eliminar usuario"
        message={
          <>
            ¿Seguro que querés eliminar a{' '}
            <span className="font-semibold">{(props as EditProps).user.username}</span>? Esta acción
            no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    );
  }

  return (
    <Modal onClose={onClose} className="w-[min(480px,92vw)]">
      <div className="flex items-center gap-3 px-[28px] py-[22px] border-b border-hairline">
        <span className="w-[34px] h-[34px] rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="users" size={17} stroke={1.6} />
        </span>
        <p className="flex-1 font-serif font-semibold text-[23px] leading-none text-ink">
          {mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
        </p>
        <IconButton
          icon="x"
          label="Cerrar"
          onClick={onClose}
          size={20}
          stroke={1.8}
          className="p-1 text-faint hover:text-ink-2"
        />
      </div>

      <div className="px-[28px] py-[22px] flex flex-col gap-[18px]">
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
              className={`${inputCls()} pr-[42px]`}
              autoComplete="new-password"
            />
            <IconButton
              icon={showPassword ? 'eye-off' : 'eye'}
              label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPassword((v) => !v)}
              size={17}
              className="absolute right-[8px] top-1/2 -translate-y-1/2 p-[5px] text-faint hover:text-ink-2"
              tabIndex={-1}
            />
          </div>
        </Field>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">Rol</p>
          <div className="flex gap-2">
            {ROLE_OPTIONS.map((r) => (
              <Button
                key={r.value}
                variant="bare"
                onClick={() => setRole(r.value)}
                className={[
                  'flex-1 border-[1.5px] transition-colors whitespace-nowrap',
                  role === r.value
                    ? 'font-semibold bg-olive-800 text-olive-50 border-olive-800'
                    : 'font-medium bg-white text-muted border-rule hover:bg-cream-2',
                ].join(' ')}
                style={{
                  padding: '9px 6px',
                  fontSize: '12.5px',
                  borderRadius: '8px',
                  lineHeight: 'normal',
                }}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-[10px] px-[28px] py-4 border-t border-hairline">
        {mode === 'edit' && !isSelf && (
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} disabled={isSaving}>
            Eliminar
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="secondary" onClick={onClose} style={MODAL_CANCEL_STYLE}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !canSave}
          loading={isSaving}
          leftIcon="check"
          style={MODAL_CONFIRM_STYLE}
        >
          {mode === 'create' ? 'Crear' : 'Guardar'}
        </Button>
      </div>
    </Modal>
  );
}
