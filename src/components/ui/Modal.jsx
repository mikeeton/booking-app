import { useEffect, useRef } from "react";
import "./ui.css";

export default function Modal({ open, title, children, footer, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Simple focus trap: cycle Tab within the modal while open
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key !== "Tab") return;
      const el = modalRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        (last).focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        (first).focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    let prevOverflow;
    if (open) {
      // focus the modal for screen-reader users and keyboard navigation
      setTimeout(() => modalRef.current?.focus?.(), 0);
      // lock background scrolling
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      // restore scroll
      if (prevOverflow !== undefined) document.body.style.overflow = prevOverflow;
      else document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="uiModalOverlay" onMouseDown={onClose}>
      <div
        className="uiModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="uiModalTitle"
        ref={modalRef}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="uiModalHeader">
          <div id="uiModalTitle" className="uiModalTitle">{title}</div>
          <button type="button" className="uiIconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="uiModalBody">{children}</div>

        {footer && <div className="uiModalFooter">{footer}</div>}
      </div>
    </div>
  );
}
