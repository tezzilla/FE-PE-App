"use client";

import { Icon } from "./Icon";

/** Opens the browser's print dialog, where "Save as PDF" is one of the destinations. */
export function PrintButton() {
  return (
    <button type="button" className="btn" onClick={() => window.print()}>
      <Icon name="doc" size={18} className="mr-2" /> Download PDF
    </button>
  );
}
