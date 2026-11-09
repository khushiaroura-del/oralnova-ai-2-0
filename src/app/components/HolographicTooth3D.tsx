
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload,
  FileImage,
  Scan,
  ImagePlus,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { uploadImageToBackend } from "@/lib/api";

export default function HolographicTooth3D() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be below 10 MB.");
      return;
    }

    setIsUploading(true);

    try {
      // Send image to Python backend
      const result = await uploadImageToBackend(file);

      // Keep the image available for local preview
      const imageUrl = URL.createObjectURL(file);

      // Pass backend response and image details
      const params = new URLSearchParams({
        image: imageUrl,
        name: result.filename,
        type: file.type,
        size: String(result.size_bytes),
        width: String(result.width),
        height: String(result.height),
        backendStatus: result.status,
      });

      router.push(`/analysis?${params.toString()}`);

    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to connect to the Python backend.";

      setError(message);

    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#071321] shadow-[0_0_45px_rgba(0,217,255,0.07)]">

      <div className="flex items-center justify-between border-b border-cyan-400/15 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-400/10 p-2">
            <Scan className="h-5 w-5 text-cyan-400" />
          </div>

          <div>
            <p className="text-sm font-semibold tracking-wide text-white">
              CLINICAL IMAGE VIEWER
            </p>
            <p className="text-xs text-slate-400">
              ORAL IMAGE UPLOAD
            </p>
          </div>
        </div>

        <span className="rounded-full border border-cyan-400/20 px-3 py-1 text-[10px] tracking-widest text-cyan-300">
          RESEARCH
        </span>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        className={`m-5 flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition ${
          isDragging
            ? "border-cyan-300 bg-cyan-400/10"
            : "border-cyan-400/25 bg-[#091b2d]"
        }`}
      >
        <div className="mb-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
          <ImagePlus className="h-9 w-9 text-cyan-300" />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-white">
          Upload Oral Image
        </h3>

        <p className="mb-6 max-w-xs text-sm leading-6 text-slate-400">
          Select an image for technical validation through the Python backend.
        </p>

        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              UPLOADING...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              SELECT IMAGE
              <ArrowUpRight className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="mt-4 text-xs text-slate-500">
          JPEG, PNG or WEBP · Maximum 10 MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={isUploading}
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      {error && (
        <div className="mx-5 mb-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-start gap-3 border-t border-cyan-400/15 px-5 py-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />

        <p className="text-xs leading-5 text-slate-400">
          Images are sent to the local research backend for technical
          validation. No AI diagnosis or prediction is currently performed.
        </p>
      </div>
    </section>
  );
}
