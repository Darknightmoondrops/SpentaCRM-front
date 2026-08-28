"use client";

import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./icons";

export function Modal({
  open,
  title,
  eyebrow,
  children,
  onClose,
  footer,
  size = "md",
}: {
  open: boolean;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-panel modal-${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-head">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow} ──</div>}
            <h2 id="modal-title">{title}</h2>
          </div>
          <button className="icon-button modal-close" type="button" aria-label="Close dialog" onClick={onClose}><CloseIcon /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      eyebrow="Confirmation"
      size="sm"
      footer={<>
        <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
        <button className={danger ? "danger-button" : "primary-button"} type="button" onClick={onConfirm}>{confirmLabel}</button>
      </>}
    >
      <p className="confirm-copy">{description}</p>
    </Modal>
  );
}

export function Toast({ message, tone = "success", onClose }: { message: string; tone?: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`toast toast-${tone}`} role="status">
      <span className="status-dot" />
      <span>{message}</span>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}><CloseIcon /></button>
    </div>
  );
}
