"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function CopyButton({
  value,
  label = "Copied!",
  size = 16,
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(label);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy to clipboard"
      className={`inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg transition-colors ${
        copied
          ? "bg-accent text-bg"
          : "bg-accent/10 hover:bg-accent/20 text-accent"
      } ${className}`}
      title="Copy"
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  );
}
