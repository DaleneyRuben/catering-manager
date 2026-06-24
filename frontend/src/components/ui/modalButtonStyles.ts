// Design specifies modal-footer button padding that's a few px smaller than Button's
// default md size (20px/12px) — these overrides apply the exact design values without
// changing Button's shared default, which is correct for page-level action buttons.
export const MODAL_CANCEL_STYLE = { padding: '10px 16px', fontSize: '13.5px' };
export const MODAL_CONFIRM_STYLE = { padding: '11px 18px', fontSize: '13.5px' };

// Destructive confirm dialogs (Finalizar plan, Eliminar cliente/plan) use a slightly
// wider confirm button than regular form modals.
export const CONFIRM_DIALOG_STYLE = { padding: '11px 20px', fontSize: '13.5px' };
