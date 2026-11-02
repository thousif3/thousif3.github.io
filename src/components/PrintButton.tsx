"use client";

export default function PrintButton() {
  return (
    <button type="button" className="btn-s" onClick={() => window.print()}>
      Print / save as PDF
    </button>
  );
}
