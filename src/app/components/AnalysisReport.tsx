
"use client";

import {
  FileDown,
  FileText,
  ShieldCheck,
} from "lucide-react";

import type { GradCamResponse } from "@/lib/api";

type AnalysisReportProps = {
  analysis: GradCamResponse;
  originalImage: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dimensions: string;
};

export default function AnalysisReport({
  analysis,
  originalImage,
  fileName,
  fileType,
  fileSize,
  dimensions,
}: AnalysisReportProps) {
  const formattedSize =
    fileSize >= 1024 * 1024
      ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB`
      : `${(fileSize / 1024).toFixed(2)} KB`;

  const formatLabel = fileType
    ? fileType.split("/")[1]?.toUpperCase() || "Unknown"
    : "Unknown";

  const handleExport = () => {
    window.print();
  };

  return (
    <>
      {/* EXPORT BUTTON */}
      <button
        onClick={handleExport}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-xs font-bold tracking-wider text-cyan-300 transition hover:bg-cyan-400/20"
      >
        <FileDown className="h-4 w-4" />
        EXPORT ANALYSIS REPORT
      </button>

      {/* PRINT-READY REPORT */}
      <article className="oralnova-print-report">

        <header className="report-header">
          <div>
            <p className="report-brand">
              ORALNOVA AI
            </p>

            <h1>
              Image Analysis Report
            </h1>

            <p className="report-subtitle">
              Educational Research Prototype
            </p>
          </div>

          <div className="report-status">
            RESEARCH OUTPUT
          </div>
        </header>

        <section className="report-section">
          <h2>01. IMAGE INFORMATION</h2>

          <div className="report-details">
            <p><strong>File name:</strong> {fileName}</p>
            <p><strong>Format:</strong> {formatLabel}</p>
            <p><strong>File size:</strong> {formattedSize}</p>
            <p><strong>Dimensions:</strong> {dimensions}</p>
          </div>
        </section>

        <section className="report-section">
          <h2>02. RESEARCH MODEL</h2>

          <div className="report-details">
            <p><strong>Model:</strong> {analysis.model}</p>
            <p><strong>Pipeline:</strong> {analysis.image_type}</p>
            <p><strong>Prediction:</strong> {analysis.prediction}</p>
            <p>
              <strong>Model score:</strong>{" "}
              {(analysis.model_score * 100).toFixed(2)}%
            </p>
          </div>

          <p className="report-note">
            Model score is an experimental model output, not a
            clinically validated probability or diagnostic confidence.
          </p>
        </section>

        <section className="report-section">
          <h2>03. CLASS OUTPUTS</h2>

          <table className="report-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Model output score</th>
              </tr>
            </thead>

            <tbody>
              {Object.entries(analysis.probabilities).map(
                ([label, score]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td>{(score * 100).toFixed(2)}%</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </section>

        <section className="report-section report-images">
          <h2>04. IMAGE AND EXPLAINABILITY</h2>

          <div className="report-image-grid">
            <div>
              <h3>Original Image</h3>

              <img
                src={originalImage}
                alt="Original uploaded image"
              />
            </div>

            {analysis.grad_cam?.overlay && (
              <div>
                <h3>Grad-CAM Visualization</h3>

                <img
                  src={analysis.grad_cam.overlay}
                  alt="Grad-CAM activation visualization"
                />
              </div>
            )}
          </div>

          {analysis.grad_cam && (
            <p className="report-note">
              Method: {analysis.grad_cam.method}. Visualization size:{" "}
              {analysis.grad_cam.width} × {analysis.grad_cam.height} px.
            </p>
          )}

          <p className="report-note">
            Grad-CAM visualizes image regions influencing the model
            output. It does not confirm lesion location.
          </p>
        </section>

        <section className="report-disclaimer">
          <div className="report-disclaimer-title">
            <ShieldCheck size={18} />
            Research Disclaimer
          </div>

          <p>
            ORALNOVA AI is an educational research prototype, not a
            medical diagnostic system. Model predictions, scores and
            Grad-CAM visualizations are experimental. They must not
            be used to diagnose, rule out or guide treatment of oral
            cancer. Clinical interpretation must be performed by
            qualified healthcare professionals.
          </p>
        </section>

        <footer className="report-footer">
          <FileText size={14} />
          ORALNOVA AI · Educational Research Report
        </footer>

      </article>

      <style jsx global>{`
        .oralnova-print-report {
          display: none;
          font-family: Arial, sans-serif;
        }

        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          body * {
            visibility: hidden !important;
          }

          .oralnova-print-report,
          .oralnova-print-report * {
            visibility: visible !important;
          }

          .oralnova-print-report {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            color: #172033 !important;
            background: white !important;
            font-size: 11px !important;
          }

          .oralnova-print-report .report-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            border-bottom: 2px solid #0e7490;
            padding-bottom: 16px;
          }

          .oralnova-print-report .report-brand {
            color: #0e7490;
            font-size: 12px;
            font-weight: bold;
            letter-spacing: 3px;
          }

          .oralnova-print-report h1 {
            margin-top: 8px;
            font-size: 25px;
            font-weight: bold;
          }

          .oralnova-print-report .report-subtitle {
            margin-top: 5px;
            color: #64748b;
          }

          .oralnova-print-report .report-status {
            border: 1px solid #0e7490;
            padding: 7px;
            color: #0e7490;
            font-size: 9px;
            font-weight: bold;
          }

          .oralnova-print-report .report-section {
            margin-top: 22px;
            break-inside: avoid;
          }

          .oralnova-print-report h2 {
            margin-bottom: 12px;
            padding-bottom: 7px;
            border-bottom: 1px solid #cbd5e1;
            color: #0e7490;
            font-size: 12px;
            font-weight: bold;
          }

          .oralnova-print-report .report-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .oralnova-print-report .report-details p {
            overflow-wrap: anywhere;
          }

          .oralnova-print-report .report-table {
            width: 100%;
            border-collapse: collapse;
          }

          .oralnova-print-report .report-table th,
          .oralnova-print-report .report-table td {
            border: 1px solid #cbd5e1;
            padding: 9px;
            text-align: left;
          }

          .oralnova-print-report .report-table th {
            background: #e2e8f0 !important;
            print-color-adjust: exact;
          }

          .oralnova-print-report .report-image-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          .oralnova-print-report .report-image-grid h3 {
            margin-bottom: 8px;
            font-size: 10px;
            font-weight: bold;
          }

          .oralnova-print-report .report-image-grid img {
            width: 100%;
            max-height: 230px;
            object-fit: contain;
            border: 1px solid #cbd5e1;
          }

          .oralnova-print-report .report-note {
            margin-top: 10px;
            color: #475569;
            font-size: 9px;
            line-height: 1.6;
          }

          .oralnova-print-report .report-disclaimer {
            margin-top: 24px;
            padding: 12px;
            border: 1px solid #d97706;
            break-inside: avoid;
          }

          .oralnova-print-report .report-disclaimer-title {
            display: flex;
            align-items: center;
            gap: 7px;
            margin-bottom: 8px;
            color: #92400e;
            font-weight: bold;
          }

          .oralnova-print-report .report-disclaimer p {
            line-height: 1.6;
          }

          .oralnova-print-report .report-footer {
            display: flex;
            align-items: center;
            gap: 7px;
            margin-top: 22px;
            padding-top: 10px;
            border-top: 1px solid #cbd5e1;
            color: #64748b;
            font-size: 9px;
          }
        }
      `}</style>
    </>
  );
}
