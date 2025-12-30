import  { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (opts: {
    mode: "same" | "edit";
    validityDays: number;
  }) => void;
};

export default function ReIssueModal({ open, onClose, onConfirm }: Props) {
  const [mode, setMode] = useState<"same" | "edit">("same");
  const [validityDays, setValidityDays] = useState(30);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[420px] p-6 space-y-5">
        <h3 className="text-base font-semibold text-gray-800">
          Re-Issue Quotation
        </h3>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={mode === "same"}
              onChange={() => setMode("same")}
            />
            Re-issue with same details
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={mode === "edit"}
              onChange={() => setMode("edit")}
            />
            Re-issue and edit details
          </label>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Validity (days)
          </label>
          <input
            type="number"
            min={1}
            value={validityDays}
            onChange={(e) => setValidityDays(+e.target.value)}
            className="w-full h-10 rounded-lg border px-3 text-sm"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ mode, validityDays })}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg"
          >
            Re-Issue
          </button>
        </div>
      </div>
    </div>
  );
}
