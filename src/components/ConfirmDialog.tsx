import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#EF4444]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3
          id="confirm-dialog-title"
          className="mt-4 font-display text-base font-semibold text-[#0F172A]"
        >
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[#64748B]">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isBusy}
            onClick={onCancel}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#DC2626] disabled:opacity-50"
          >
            {isBusy ? 'Removing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
