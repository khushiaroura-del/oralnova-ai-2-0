
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ScanEye,
  ShieldCheck,
  FileImage,
  Microscope,
  Maximize2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Scan,
  Activity,
  Play,
  Loader2,
  Columns2,
  Layers,
  Printer,
} from "lucide-react";

import {
  generateGradCam,
  type GradCamResponse,
  type ImageType,
} from "@/lib/api";

type Check = {
  label: string;
  passed: boolean;
  detail: string;
};

type ViewerMode = "overlay" | "comparison";

export default function AnalysisPage() {
  const router = useRouter();

  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [dimensions, setDimensions] = useState("Calculating...");
  const [zoom, setZoom] = useState(100);
  const [checks, setChecks] = useState<Check[]>([]);
  const [validationReady, setValidationReady] = useState(false);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<ImageType>("clinical");
  const [analysis, setAnalysis] = useState<GradCamResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [viewerMode, setViewerMode] = useState<ViewerMode>("overlay");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const imageUrl = params.get("image") || "";
    const name = params.get("name") || "Uploaded image";
    const type = params.get("type") || "";
    const size = Number(params.get("size")) || 0;

    setImage(imageUrl);
    setFileName(name);
    setFileType(type);
    setFileSize(size);

    if (!imageUrl) {
      setDimensions("Not available");
      setChecks([
        {
          label: "Image received",
          passed: false,
          detail: "No image was received.",
        },
      ]);
      setValidationReady(true);
      return;
    }

    const img = new window.Image();

    img.onload = async () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      setDimensions(`${width} × ${height} px`);

      const supportedFormats = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      const formatValid = supportedFormats.includes(type);
      const sizeValid = size > 0 && size <= 10 * 1024 * 1024;
      const dimensionsValid = width >= 224 && height >= 224;

      setChecks([
        {
          label: "Image readability",
          passed: true,
          detail: "Image loaded successfully.",
        },
        {
          label: "File format",
          passed: formatValid,
          detail: formatValid
            ? `${type.split("/")[1].toUpperCase()} is supported.`
            : "Supported formats: JPEG, PNG and WEBP.",
        },
        {
          label: "File size",
          passed: sizeValid,
          detail: sizeValid
            ? "Image is within the 10 MB limit."
            : "Image size is missing or exceeds 10 MB.",
        },
        {
          label: "Image dimensions",
          passed: dimensionsValid,
          detail: dimensionsValid
            ? `${width} × ${height} pixels meets the minimum 224 × 224 requirement.`
            : "Minimum required dimensions: 224 × 224 pixels.",
        },
      ]);

      setValidationReady(true);

      try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
          throw new Error("Could not retrieve the uploaded image.");
        }

        const blob = await response.blob();

        const reconstructedFile = new File(
          [blob],
          name,
          { type: blob.type || type || "image/jpeg" }
        );

        setSourceFile(reconstructedFile);
      } catch {
        setAnalysisError(
          "The uploaded image could not be prepared for AI analysis. Please upload it again."
        );
      }
    };

    img.onerror = () => {
      setDimensions("Unable to read dimensions");

      setChecks([
        {
          label: "Image readability",
          passed: false,
          detail: "The browser could not read this image.",
        },
      ]);

      setValidationReady(true);
    };

    img.src = imageUrl;
  }, []);

  const handleAnalysis = async () => {
    if (!sourceFile) {
      setAnalysisError(
        "Image is not ready. Please upload the image again."
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);
    setOverlayOpacity(50);
    setViewerMode("overlay");
    setZoom(100);

    try {
      const result = await generateGradCam(
        sourceFile,
        imageType
      );

      setAnalysis(result);
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "AI analysis failed. Check whether the backend is running."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportReport = () => {
    if (!analysis) {
      setAnalysisError(
        "Run AI analysis before exporting the report."
      );
      return;
    }

    setAnalysisError("");
    window.print();
  };

  const formattedSize =
    fileSize >= 1024 * 1024
      ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB`
      : fileSize >= 1024
        ? `${(fileSize / 1024).toFixed(2)} KB`
        : fileSize > 0
          ? `${fileSize} bytes`
          : "Not available";

  const formatName = fileType
    ? fileType.split("/")[1]?.toUpperCase() || "Unknown"
    : "Unknown";

  const passedCount = checks.filter((check) => check.passed).length;
  const allPassed = checks.length > 0 && passedCount === checks.length;

  const modelScore = analysis
    ? `${(analysis.model_score * 100).toFixed(2)}%`
    : "Not available";

  return (
    <main className="min-h-screen bg-[#020817] text-white">

      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#020817]/90 backdrop-blur-xl print:hidden">
        <div className="flex items-center justify-between px-5 py-4 lg:px-8">

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 text-sm text-slate-400 transition hover:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to ORALNOVA
          </button>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2">
              <Brain className="h-5 w-5 text-cyan-300" />
            </div>

            <div>
              <p className="text-sm font-bold tracking-widest">
                ORAL<span className="text-cyan-400">NOVA</span>
              </p>
              <p className="text-[9px] tracking-widest text-slate-500">
                ANALYSIS WORKSPACE
              </p>
            </div>
          </div>

          <span className="hidden rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[9px] font-semibold tracking-wider text-amber-300 sm:block">
            RESEARCH PREVIEW
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 py-8 lg:px-8">

        {/* PAGE HEADING */}
        <div className="mb-8 print:hidden">
          <p className="text-[10px] font-bold tracking-[0.3em] text-cyan-300">
            IMAGE ANALYSIS / WORKSPACE
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Clinical Image Analysis
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Explore model predictions and Grad-CAM visualizations.
          </p>

          {analysis && (
            <button
              onClick={handleExportReport}
              className="mt-5 flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-xs font-bold tracking-wider text-cyan-300 transition hover:bg-cyan-400/20"
            >
              <Printer className="h-4 w-4" />
              EXPORT ANALYSIS REPORT
            </button>
          )}
        </div>

        {/* MODEL SELECTION */}
        <section className="mb-6 rounded-2xl border border-cyan-400/20 bg-[#071321] p-5 print:hidden">

          <div className="flex items-center gap-3">
            <Microscope className="h-5 w-5 text-cyan-300" />

            <div>
              <h2 className="text-xs font-bold tracking-wider">
                SELECT RESEARCH PIPELINE
              </h2>

              <p className="mt-1 text-[10px] text-slate-500">
                Choose the model appropriate for the uploaded image.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            <button
              onClick={() => {
                setImageType("clinical");
                setAnalysis(null);
                setAnalysisError("");
              }}
              disabled={isAnalyzing}
              className={`rounded-xl border p-4 text-left transition ${
                imageType === "clinical"
                  ? "border-cyan-400/50 bg-cyan-400/10"
                  : "border-white/10 bg-black/20 hover:border-white/25"
              }`}
            >
              <p className={`text-xs font-bold ${
                imageType === "clinical" ? "text-cyan-300" : "text-slate-200"
              }`}>
                Clinical Image Model
              </p>

              <p className="mt-2 text-[10px] leading-5 text-slate-500">
                For oral cavity photographs, lips and tongue images.
              </p>

              <p className="mt-3 text-[9px] tracking-wider text-slate-400">
                2 CLASS RESEARCH MODEL
              </p>
            </button>

            <button
              onClick={() => {
                setImageType("histopathology");
                setAnalysis(null);
                setAnalysisError("");
              }}
              disabled={isAnalyzing}
              className={`rounded-xl border p-4 text-left transition ${
                imageType === "histopathology"
                  ? "border-purple-400/50 bg-purple-400/10"
                  : "border-white/10 bg-black/20 hover:border-white/25"
              }`}
            >
              <p className={`text-xs font-bold ${
                imageType === "histopathology" ? "text-purple-300" : "text-slate-200"
              }`}>
                Histopathology Model
              </p>

              <p className="mt-2 text-[10px] leading-5 text-slate-500">
                For H&E-stained oral tissue histopathology images.
              </p>

              <p className="mt-3 text-[9px] tracking-wider text-slate-400">
                5 CLASS RESEARCH MODEL
              </p>
            </button>

          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">

            <div>
              <p className="text-xs font-semibold text-slate-200">
                {imageType === "clinical"
                  ? "Clinical MobileNetV3-Small"
                  : "Histopathology MobileNetV3-Small"}
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                {sourceFile ? "Image ready for analysis" : "Waiting for image"}
              </p>
            </div>

            <button
              onClick={handleAnalysis}
              disabled={!sourceFile || isAnalyzing}
              className="flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-xs font-bold tracking-wider text-[#02111e] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  ANALYZING...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  RUN AI ANALYSIS
                </>
              )}
            </button>

          </div>

          {analysisError && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-400/20 bg-red-400/5 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

              <p className="text-xs leading-5 text-red-300">
                {analysisError}
              </p>
            </div>
          )}

        </section>

        <div className="grid gap-6 xl:grid-cols-[1.65fr_0.75fr] print:hidden">

          {/* IMAGE VIEWER */}
          <section className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#071321]">

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">

              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-cyan-300" />

                <div>
                  <p className="text-xs font-bold tracking-wider">
                    IMAGE VIEWER
                  </p>

                  <p className="mt-1 text-[10px] text-slate-500">
                    {analysis
                      ? "Compare original image and model activation visualization"
                      : "Original uploaded image"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">

                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="rounded-lg border border-white/10 p-2 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-300"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <span className="min-w-12 text-center text-xs text-slate-400">
                  {zoom}%
                </span>

                <button
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  className="rounded-lg border border-white/10 p-2 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-300"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setZoom(100)}
                  className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

              </div>
            </div>

            {/* VIEW MODE SWITCHER */}
            {analysis?.grad_cam?.overlay && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">

                <p className="text-[10px] font-semibold tracking-wider text-slate-400">
                  VISUALIZATION MODE
                </p>

                <div className="flex rounded-lg border border-white/10 bg-black/30 p-1">

                  <button
                    onClick={() => setViewerMode("overlay")}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-[10px] font-semibold transition ${
                      viewerMode === "overlay"
                        ? "bg-cyan-400/15 text-cyan-300"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    OVERLAY
                  </button>

                  <button
                    onClick={() => setViewerMode("comparison")}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-[10px] font-semibold transition ${
                      viewerMode === "comparison"
                        ? "bg-purple-400/15 text-purple-300"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Columns2 className="h-3.5 w-3.5" />
                    SIDE BY SIDE
                  </button>

                </div>
              </div>
            )}

            {/* VIEWER CONTENT */}
            <div className="flex min-h-[420px] items-center justify-center overflow-auto bg-[#030a13] p-5 md:min-h-[580px]">

              {image ? (
                analysis?.grad_cam?.overlay && viewerMode === "comparison" ? (

                  <div
                    className="grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-2"
                    style={{ transform: `scale(${zoom / 100})` }}
                  >

                    <div className="min-w-0">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-bold tracking-wider text-cyan-300">
                          ORIGINAL IMAGE
                        </p>

                        <span className="text-[9px] text-slate-500">
                          SOURCE
                        </span>
                      </div>

                      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-cyan-400/20 bg-black/40 p-2">
                        <img
                          src={image}
                          alt="Original uploaded research image"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-bold tracking-wider text-purple-300">
                          GRAD-CAM VISUALIZATION
                        </p>

                        <span className="text-[9px] text-slate-500">
                          MODEL OUTPUT
                        </span>
                      </div>

                      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-purple-400/20 bg-black/40 p-2">
                        <img
                          src={analysis.grad_cam.overlay}
                          alt="Grad-CAM model activation visualization"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] leading-5 text-slate-500 md:col-span-2">
                      The Grad-CAM image shows regions that influenced the model output. It does not confirm lesion location.
                    </p>

                  </div>

                ) : (

                  <div
                    className="relative inline-block max-w-full overflow-hidden rounded-lg transition-transform duration-200"
                    style={{ transform: `scale(${zoom / 100})` }}
                  >
                    <img
                      src={image}
                      alt="Original uploaded research image"
                      className="block max-h-[650px] max-w-full object-contain"
                    />

                    {analysis?.grad_cam?.overlay && (
                      <img
                        src={analysis.grad_cam.overlay}
                        alt="Grad-CAM model activation overlay"
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ opacity: overlayOpacity / 100 }}
                      />
                    )}
                  </div>

                )
              ) : (
                <div className="text-center">
                  <FileImage className="mx-auto h-12 w-12 text-slate-600" />

                  <p className="mt-4 text-sm font-semibold text-slate-300">
                    No image received
                  </p>

                  <button
                    onClick={() => router.push("/")}
                    className="mt-5 rounded-lg bg-cyan-500 px-5 py-3 text-xs font-bold text-[#02111e]"
                  >
                    BACK TO HOME
                  </button>
                </div>
              )}

            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-4">

              <p className="max-w-[70%] truncate text-[10px] text-slate-500">
                <FileImage className="mr-2 inline h-3.5 w-3.5" />
                {fileName}
              </p>

              <span className="text-[9px] tracking-wider text-cyan-300">
                {analysis?.grad_cam?.overlay
                  ? viewerMode === "comparison"
                    ? "SIDE-BY-SIDE COMPARISON"
                    : `OVERLAY ${overlayOpacity}%`
                  : "ORIGINAL IMAGE"}
              </span>

            </div>
          </section>

          {/* RIGHT PANEL */}
          <aside className="space-y-5">

            {/* IMAGE INFORMATION */}
            <section className="rounded-2xl border border-white/10 bg-[#071321] p-5">

              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <FileImage className="h-5 w-5 text-cyan-300" />

                <div>
                  <h2 className="text-xs font-bold tracking-wider">
                    IMAGE INFORMATION
                  </h2>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Uploaded file details
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5">

                <div>
                  <p className="text-[10px] text-slate-500">FILE NAME</p>
                  <p className="mt-2 break-all text-xs text-slate-200">
                    {fileName || "Not available"}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-[10px] text-slate-500">FILE FORMAT</p>
                  <p className="mt-2 text-xs text-slate-200">{formatName}</p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-[10px] text-slate-500">FILE SIZE</p>
                  <p className="mt-2 text-xs text-slate-200">{formattedSize}</p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-[10px] text-slate-500">IMAGE DIMENSIONS</p>
                  <p className="mt-2 text-xs text-slate-200">{dimensions}</p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-[10px] text-slate-500">IMAGE STATUS</p>

                  <p className="mt-2 flex items-center gap-2 text-xs text-cyan-300">
                    <CheckCircle2 className="h-4 w-4" />
                    {image ? "Loaded for preview" : "Waiting for image"}
                  </p>
                </div>

              </div>
            </section>

            {/* IMAGE VALIDATION */}
            <section className="rounded-2xl border border-cyan-400/20 bg-[#071321] p-5">

              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">

                <div className="flex items-center gap-3">
                  <Scan className="h-5 w-5 text-cyan-300" />

                  <div>
                    <h2 className="text-xs font-bold tracking-wider">
                      IMAGE VALIDATION
                    </h2>

                    <p className="mt-1 text-[10px] text-slate-500">
                      Technical file checks
                    </p>
                  </div>
                </div>

                <span className="text-[9px] text-cyan-300">
                  {validationReady ? "COMPLETED" : "CHECKING"}
                </span>

              </div>

              <div className="mt-5 space-y-4">

                {checks.map((check) => (
                  <div key={check.label} className="flex items-start gap-3">

                    {check.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    )}

                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {check.label}
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        {check.detail}
                      </p>
                    </div>

                  </div>
                ))}

              </div>

              {validationReady && (
                <div className="mt-5 border-t border-white/10 pt-4">

                  <div className="flex items-center gap-2">

                    {allPassed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    )}

                    <p className={`text-xs font-semibold ${
                      allPassed ? "text-emerald-400" : "text-amber-300"
                    }`}>
                      {passedCount} / {checks.length} checks passed
                    </p>

                  </div>
                </div>
              )}

            </section>

            {/* AI MODEL STATUS */}
            <section className="rounded-2xl border border-white/10 bg-[#071321] p-5">

              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Microscope className="h-5 w-5 text-blue-300" />

                <div>
                  <h2 className="text-xs font-bold tracking-wider">
                    AI MODEL STATUS
                  </h2>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Research pipeline
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  MobileNetV3-Small
                </span>

                <span className={`rounded-full border px-2 py-1 text-[9px] ${
                  analysis
                    ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
                    : "border-amber-400/20 bg-amber-400/5 text-amber-300"
                }`}>
                  {analysis ? "ANALYSIS COMPLETED" : "WAITING"}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">Grad-CAM</span>

                <span className={`rounded-full border px-2 py-1 text-[9px] ${
                  analysis?.grad_cam_status === "Generated"
                    ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
                    : "border-amber-400/20 bg-amber-400/5 text-amber-300"
                }`}>
                  {analysis?.grad_cam_status === "Generated"
                    ? "GENERATED"
                    : "WAITING"}
                </span>
              </div>

            </section>

            {/* MODEL RESULTS */}
            <section className="rounded-2xl border border-cyan-400/20 bg-[#071321] p-5">

              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Activity className="h-5 w-5 text-cyan-300" />

                <div>
                  <h2 className="text-xs font-bold tracking-wider">
                    MODEL OUTPUT
                  </h2>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Research prediction result
                  </p>
                </div>
              </div>

              {analysis ? (
                <div className="mt-5 space-y-5">

                  <div>
                    <p className="text-[10px] text-slate-500">
                      MODEL PREDICTION
                    </p>

                    <p className="mt-2 text-lg font-bold text-cyan-300">
                      {analysis.prediction}
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-[10px] text-slate-500">
                      MODEL SCORE
                    </p>

                    <p className="mt-2 text-2xl font-bold text-white">
                      {modelScore}
                    </p>

                    <p className="mt-1 text-[9px] leading-5 text-slate-500">
                      Model output score, not a clinically validated probability.
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-[10px] text-slate-500">
                      CLASS OUTPUTS
                    </p>

                    <div className="mt-3 space-y-3">

                      {Object.entries(analysis.probabilities).map(
                        ([label, score]) => (
                          <div key={label}>

                            <div className="mb-1 flex justify-between gap-3">
                              <span className="text-[10px] text-slate-300">
                                {label}
                              </span>

                              <span className="text-[10px] text-slate-400">
                                {(score * 100).toFixed(2)}%
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-cyan-400"
                                style={{
                                  width: `${Math.max(0, Math.min(100, score * 100))}%`,
                                }}
                              />
                            </div>

                          </div>
                        )
                      )}

                    </div>
                  </div>

                  <p className="text-[9px] leading-5 text-amber-300/80">
                    These are model outputs from a research prototype, not diagnostic results.
                  </p>

                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/20 p-5 text-center">

                  <Brain className="mx-auto h-7 w-7 text-slate-600" />

                  <p className="mt-3 text-xs font-semibold text-slate-300">
                    No model output yet
                  </p>

                  <p className="mt-2 text-[10px] leading-5 text-slate-500">
                    Select a research pipeline and run AI analysis.
                  </p>

                </div>
              )}

            </section>

            {/* GRAD-CAM WORKSPACE */}
            <section className="rounded-2xl border border-purple-400/20 bg-purple-400/[0.035] p-5">

              <div className="flex items-center gap-3">
                <ScanEye className="h-5 w-5 text-purple-300" />

                <h2 className="text-xs font-bold tracking-wider">
                  GRAD-CAM WORKSPACE
                </h2>
              </div>

              {analysis?.grad_cam?.overlay ? (
                <div className="mt-5">

                  <div className="overflow-hidden rounded-xl border border-purple-400/20 bg-black/30">
                    <img
                      src={analysis.grad_cam.overlay}
                      alt="Grad-CAM model activation visualization"
                      className="h-auto w-full object-contain"
                    />
                  </div>

                  <p className="mt-3 text-xs font-semibold text-purple-300">
                    Grad-CAM visualization generated
                  </p>

                  <p className="mt-2 text-[10px] leading-5 text-slate-500">
                    {analysis.grad_cam.method} ·{" "}
                    {analysis.grad_cam.width} × {analysis.grad_cam.height} px
                  </p>

                  <div className="mt-5 border-t border-white/10 pt-4">

                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="overlay-opacity"
                        className="text-xs font-semibold text-slate-300"
                      >
                        OVERLAY OPACITY
                      </label>

                      <span className="text-xs font-bold text-purple-300">
                        {overlayOpacity}%
                      </span>
                    </div>

                    <input
                      id="overlay-opacity"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={overlayOpacity}
                      onChange={(event) =>
                        setOverlayOpacity(Number(event.target.value))
                      }
                      disabled={viewerMode === "comparison"}
                      className="mt-4 w-full cursor-pointer accent-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                    />

                    <div className="mt-2 flex justify-between text-[9px] text-slate-500">
                      <span>ORIGINAL IMAGE</span>
                      <span>FULL HEATMAP</span>
                    </div>

                    <p className="mt-4 text-[10px] leading-5 text-slate-400">
                      The opacity slider controls the overlay in Overlay View. Side-by-Side View displays the generated Grad-CAM image separately.
                    </p>

                  </div>

                  <p className="mt-4 text-[10px] leading-5 text-slate-400">
                    This heatmap visualizes image regions influencing the model output. It is not a confirmed lesion location or clinical interpretation.
                  </p>

                </div>
              ) : (
                <div className="mt-5 flex min-h-[130px] flex-col items-center justify-center rounded-xl border border-dashed border-purple-400/20 bg-black/20 p-4 text-center">

                  <Maximize2 className="h-7 w-7 text-purple-300/60" />

                  <p className="mt-3 text-xs font-semibold text-slate-300">
                    Explainability layer
                  </p>

                  <p className="mt-2 text-[10px] leading-5 text-slate-500">
                    {isAnalyzing
                      ? "Generating Grad-CAM visualization..."
                      : "Run AI analysis to generate the activation map."}
                  </p>

                </div>
              )}

            </section>

          </aside>
        </div>

        {/* PRINT REPORT */}
        {analysis && (
          <section className="hidden print-report">

            <div className="report-header">
              <h1>ORALNOVA AI</h1>
              <h2>AI-Assisted Oral Image Analysis Report</h2>
              <p>Educational Research Prototype</p>
              <p>Generated: {new Date().toLocaleString()}</p>
            </div>

            <hr />

            <div className="report-section">
              <h2>1. Image Information</h2>
              <p>File name: {fileName}</p>
              <p>File format: {formatName}</p>
              <p>File size: {formattedSize}</p>
              <p>Dimensions: {dimensions}</p>
            </div>

            <div className="report-section">
              <h2>2. Research Pipeline</h2>
              <p>
                {imageType === "clinical"
                  ? "Clinical MobileNetV3-Small"
                  : "Histopathology MobileNetV3-Small"}
              </p>
            </div>

            <div className="report-section report-original">
              <h2>3. Original Uploaded Image</h2>

              {image && (
                <img
                  src={image}
                  alt="Original uploaded research image"
                  className="report-image"
                />
              )}
            </div>

            {/* GRAD-CAM SECTION: KEEP TOGETHER */}
            <div className="report-section report-gradcam">
              <h2>4. Grad-CAM Visualization</h2>

              {analysis.grad_cam?.overlay && (
                <img
                  src={analysis.grad_cam.overlay}
                  alt="Grad-CAM model activation visualization"
                  className="report-image"
                />
              )}

              <p>
                Grad-CAM visualizes image regions influencing the model output.
                It does not confirm lesion location.
              </p>
            </div>

            <div className="report-section">
              <h2>5. Model Output</h2>
              <p>Prediction: {analysis.prediction}</p>
              <p>Model score: {modelScore}</p>
              <p>
                Model score is not a clinically validated probability.
              </p>

              <h3>Class Outputs</h3>

              {Object.entries(analysis.probabilities).map(([label, score]) => (
                <p key={label}>
                  {label}: {(score * 100).toFixed(2)}%
                </p>
              ))}
            </div>

            <div className="report-section">
              <h2>6. Technical Validation</h2>

              {checks.map((check) => (
                <p key={check.label}>
                  {check.passed ? "PASS" : "CHECK"}: {check.label} - {check.detail}
                </p>
              ))}
            </div>

            <hr />

            <div className="report-section">
              <h2>Research Disclaimer</h2>

              <p>
                ORALNOVA AI is an educational research prototype, not a medical
                diagnostic system. Model outputs and Grad-CAM visualizations are
                experimental. They must not be used to diagnose, rule out, or
                guide treatment of oral cancer. Grad-CAM does not confirm lesion
                location.
              </p>
            </div>

          </section>
        )}

        {/* DISCLAIMER */}
        <div className="mt-6 flex gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.035] p-4 print:hidden">

          <ShieldCheck className="h-5 w-5 shrink-0 text-amber-300" />

          <p className="text-[10px] leading-6 text-slate-400">
            <strong className="text-amber-300">Research notice:</strong>{" "}
            ORALNOVA AI is an educational research prototype, not a medical
            diagnostic system. Model outputs and Grad-CAM visualizations
            are experimental and must not be used to diagnose, rule out
            or guide treatment of oral cancer. Grad-CAM does not confirm
            lesion location.
          </p>

        </div>

      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 16mm;
          }

          html,
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden !important;
          }

          .print-report,
          .print-report * {
            visibility: visible !important;
          }

          .print-report {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            padding: 10px;
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif;
            font-size: 11px;
          }

          .print-report h1 {
            font-size: 25px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #111 !important;
          }

          .print-report h2 {
            font-size: 16px;
            font-weight: bold;
            margin-top: 18px;
            margin-bottom: 10px;
            color: #111 !important;
          }

          .print-report h3 {
            font-size: 13px;
            font-weight: bold;
            margin-top: 12px;
            color: #111 !important;
          }

          .print-report p {
            margin: 6px 0;
            line-height: 1.5;
            color: #222 !important;
          }

          .report-header {
            margin-bottom: 20px;
            break-after: avoid;
            page-break-after: avoid;
          }

          .report-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .report-section h2 {
            break-after: avoid;
            page-break-after: avoid;
          }

          .report-image {
            display: block;
            width: auto;
            max-width: 100%;
            max-height: 360px;
            object-fit: contain;
            margin: 12px auto;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .report-original {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .report-gradcam {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .report-gradcam h2 {
            break-after: avoid;
            page-break-after: avoid;
          }

          .report-gradcam .report-image {
            max-height: 360px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-report hr {
            border: 0;
            border-top: 1px solid #999;
            margin: 16px 0;
          }
        }
      `}</style>

    </main>
  );
}
