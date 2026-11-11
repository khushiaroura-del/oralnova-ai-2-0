
"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Brain,
  Database,
  FileBarChart,
  Microscope,
  ShieldAlert,
  FlaskConical,
  Layers3,
  Target,
  GraduationCap,
  ChartNoAxesCombined,
  Info,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Clock,
  Loader2,
  AlertCircle,
  Server,
  Cpu,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

type ClassMetric = {
  precision: number;
  recall: number;
  "f1-score": number;
  support: number;
};

type Evaluation = {
  available: boolean;
  accuracy: number | null;
  classification_report: Record<string, ClassMetric | number> | null;
  confusion_matrix: number[][] | null;
  cancer_sensitivity: number | null;
  non_cancer_specificity: number | null;
  message: string | null;
};

type Dataset = {
  available: boolean;
  total_images: number | null;
  split_counts: Record<string, number>;
  class_counts: Record<string, number>;
  message: string | null;
};

type ResearchModel = {
  model_type: string;
  model_name: string;
  architecture: string;
  num_classes: number;
  class_mapping: Record<string, number>;
  input_resolution: number;
  checkpoint: {
    available: boolean;
    loaded_in_memory: boolean;
    path: string;
  };
  dataset: Dataset;
  evaluation: Evaluation;
};

type TrainingConfig = {
  device: string;
  batch_size: number;
  maximum_epochs: number;
  learning_rate: number;
  weight_decay: number;
  early_stopping_patience: number;
  num_workers: number;
  normalization: {
    mean: number[];
    std: number[];
  };
  augmentation: Record<string, number>;
  completed_epochs: number | null;
  best_epoch: number | null;
  best_validation_loss: number | null;
  training_history_available: boolean;
  training_history_note: string;
};

type ResearchSummary = {
  status: string;
  project: string;
  version: string;
  generated_at: string;
  overview: {
    total_processed_images: number | null;
    clinical_images: number | null;
    histopathology_images: number | null;
    number_of_models: number;
    device: string;
  };
  datasets: {
    clinical: Dataset;
    histopathology: Dataset;
  };
  models: {
    clinical: ResearchModel;
    histopathology: ResearchModel;
  };
  training: {
    clinical: TrainingConfig;
    histopathology: TrainingConfig;
    histopathology_high_resolution: {
      image_size: number;
      checkpoint_path: string;
      checkpoint_available: boolean;
      note: string;
    };
  };
  research_configuration: {
    random_seed: number;
    device: string;
    batch_size: number;
    maximum_epochs: number;
    learning_rate: number;
    weight_decay: number;
    early_stopping_patience: number;
    num_workers: number;
    normalization: {
      mean: number[];
      std: number[];
    };
  };
  limitations: string[];
  disclaimer: string;
};

type HistoryRecord = {
  id: number;
  image_type: "clinical" | "histopathology";
  model_name: string;
  filename: string;
  prediction: string;
  model_score: number;
  probabilities: Record<string, number>;
  analysis_type: string;
  created_at: string;
};

type HistoryStats = {
  status: string;
  total_analyses: number;
  clinical_analyses: number;
  histopathology_analyses: number;
  prediction_analyses: number;
  gradcam_analyses: number;
  recent_analyses: HistoryRecord[];
};

type HistoryResponse = {
  status: string;
  total: number;
  limit: number;
  offset: number;
  history: HistoryRecord[];
};

const BAR_COLORS = [
  "bg-cyan-400",
  "bg-blue-500",
  "bg-violet-400",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-indigo-400",
];

const GRADIENT_COLORS = [
  "from-cyan-400 to-blue-500",
  "from-violet-400 to-purple-500",
];

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString();
}

function formatPrediction(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${(value * 100).toFixed(2)}%`;
}

function formatMetric(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return value.toLocaleString();
}

function getSplitLabel(value: string) {
  const labels: Record<string, string> = {
    train: "Training",
    validation: "Validation",
    val: "Validation",
    test: "Testing",
  };

  return labels[value.toLowerCase()] || formatPrediction(value);
}

function getClassMetrics(
  report: Record<string, ClassMetric | number> | null
): {
  name: string;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}[] {
  if (!report) return [];

  const excluded = [
    "accuracy",
    "macro avg",
    "weighted avg",
  ];

  return Object.entries(report)
    .filter(
      ([name, value]) =>
        !excluded.includes(name) &&
        typeof value === "object" &&
        value !== null
    )
    .map(([name, value]) => {
      const metric = value as ClassMetric;

      return {
        name,
        precision: metric.precision,
        recall: metric.recall,
        f1: metric["f1-score"],
        support: metric.support,
      };
    });
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#11151d] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        <Icon size={19} className="text-cyan-400" />
      </div>

      <h3 className="mt-5 text-3xl font-semibold tracking-tight text-white">
        {value}
      </h3>

      <p className="mt-2 text-xs text-gray-500">{detail}</p>
    </div>
  );
}

function SplitCard({
  title,
  dataset,
}: {
  title: string;
  dataset: Dataset;
}) {
  const splits = Object.entries(dataset.split_counts || {});
  const total = dataset.total_images || 0;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-medium text-gray-200">{title}</h3>
        <span className="text-sm text-gray-400">
          {formatNumber(dataset.total_images)} images
        </span>
      </div>

      {splits.length === 0 || total === 0 ? (
        <p className="text-sm text-gray-500">
          Split information unavailable.
        </p>
      ) : (
        <>
          <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
            {splits.map(([name, count], index) => (
              <div
                key={name}
                className={BAR_COLORS[index % BAR_COLORS.length]}
                style={{
                  width: `${(count / total) * 100}%`,
                }}
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {splits.map(([name, count], index) => (
              <div key={name}>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      BAR_COLORS[index % BAR_COLORS.length]
                    }`}
                  />
                  <span className="text-xs text-gray-500">
                    {getSplitLabel(name)}
                  </span>
                </div>

                <p className="mt-1 text-lg font-semibold text-white">
                  {count}
                </p>

                <p className="text-xs text-gray-600">
                  {((count / total) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CompositionBar({
  title,
  dataset,
}: {
  title: string;
  dataset: Dataset;
}) {
  const items = Object.entries(dataset.class_counts || {});
  const total = dataset.total_images || 0;

  return (
    <div>
      <div className="mb-3 flex justify-between gap-3 text-sm">
        <span className="text-gray-300">{title}</span>
        <span className="text-gray-400">
          {formatNumber(dataset.total_images)} images
        </span>
      </div>

      {items.length === 0 || total === 0 ? (
        <p className="text-sm text-gray-500">
          Class composition unavailable.
        </p>
      ) : (
        <>
          <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
            {items.map(([name, count], index) => (
              <div
                key={name}
                className={BAR_COLORS[index % BAR_COLORS.length]}
                style={{
                  width: `${(count / total) * 100}%`,
                }}
              />
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {items.map(([name, count], index) => (
              <div
                key={name}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    BAR_COLORS[index % BAR_COLORS.length]
                  }`}
                />
                <span className="text-gray-500">
                  {name}:
                </span>
                <span className="text-gray-300">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ModelPerformanceCard({
  model,
  index,
}: {
  model: ResearchModel;
  index: number;
}) {
  const metrics = getClassMetrics(
    model.evaluation.classification_report
  );

  const accuracy = model.evaluation.accuracy;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12 }}
      className="rounded-2xl border border-white/[0.08] bg-[#11151d] p-5 md:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">
            {model.model_type === "clinical"
              ? "Clinical Image Model"
              : "Histopathology Model"}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {model.num_classes}-class classification · {model.architecture}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs ${
            model.checkpoint.available && model.evaluation.available
              ? "border-emerald-400/20 text-emerald-300"
              : "border-amber-400/20 text-amber-300"
          }`}
        >
          {model.checkpoint.available && model.evaluation.available
            ? "Checkpoint & Evaluation Available"
            : "Incomplete"}
        </span>
      </div>

      <div className="mt-8 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Test Accuracy
          </p>

          <p className="mt-2 text-4xl font-semibold tracking-tight">
            {formatPercent(accuracy)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Test images</p>
          <p className="mt-1 text-xl font-medium">
            {formatNumber(
              model.evaluation.classification_report &&
              typeof model.evaluation.classification_report["accuracy"] === "number"
                ? model.evaluation.classification_report["accuracy"] !== undefined
                  ? Object.values(
                      model.evaluation.classification_report
                    )
                      .filter(
                        (item): item is ClassMetric =>
                          typeof item === "object" && item !== null
                      )
                      .reduce((sum, item) => sum + item.support, 0)
                  : null
                : null
            )}
          </p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${
            GRADIENT_COLORS[index % GRADIENT_COLORS.length]
          }`}
          style={{
            width: `${accuracy !== null ? accuracy * 100 : 0}%`,
          }}
        />
      </div>

      <div className="mt-8 overflow-x-auto">
        {metrics.length === 0 ? (
          <p className="text-sm text-gray-500">
            Class evaluation metrics unavailable.
          </p>
        ) : (
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-500">
                <th className="pb-3 font-medium">Class</th>
                <th className="pb-3 text-right font-medium">Precision</th>
                <th className="pb-3 text-right font-medium">Recall</th>
                <th className="pb-3 text-right font-medium">F1</th>
                <th className="pb-3 text-right font-medium">N</th>
              </tr>
            </thead>

            <tbody>
              {metrics.map((item) => (
                <tr
                  key={item.name}
                  className="border-b border-white/[0.05]"
                >
                  <td className="py-3 pr-2 text-gray-300">
                    {item.name}
                  </td>

                  <td className="py-3 text-right text-gray-300">
                    {formatMetric(item.precision)}
                  </td>

                  <td className="py-3 text-right text-gray-300">
                    {formatMetric(item.recall)}
                  </td>

                  <td className="py-3 text-right text-gray-300">
                    {formatMetric(item.f1)}
                  </td>

                  <td className="py-3 text-right text-gray-500">
                    {item.support}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-xs text-gray-500">
        <span>Input: {model.input_resolution} × {model.input_resolution}</span>
        <span>Classes: {model.num_classes}</span>
        <span>
          Checkpoint: {model.checkpoint.available ? "Available" : "Missing"}
        </span>
      </div>

      {model.evaluation.confusion_matrix && (
        <div className="mt-6 border-t border-white/[0.07] pt-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            Confusion Matrix
          </p>

          <div className="overflow-x-auto">
            <table className="border-collapse text-center text-xs">
              <tbody>
                {model.evaluation.confusion_matrix.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((value, columnIndex) => (
                      <td
                        key={columnIndex}
                        className="min-w-12 border border-white/10 px-3 py-2 text-gray-200"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-[11px] text-gray-600">
            Matrix order follows the model&apos;s class-index mapping.
          </p>
        </div>
      )}
    </motion.article>
  );
}

function TrainingCard({
  title,
  training,
}: {
  title: string;
  training: TrainingConfig;
}) {
  const details = [
    ["Device", training.device],
    ["Batch size", String(training.batch_size)],
    ["Maximum epochs", String(training.maximum_epochs)],
    ["Learning rate", String(training.learning_rate)],
    ["Weight decay", String(training.weight_decay)],
    ["Early stopping patience", String(training.early_stopping_patience)],
    ["Workers", String(training.num_workers)],
    ["Completed epochs", formatNumber(training.completed_epochs)],
    ["Best epoch", formatNumber(training.best_epoch)],
    [
      "Best validation loss",
      training.best_validation_loss === null
        ? "Not recorded"
        : training.best_validation_loss.toFixed(4),
    ],
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#11151d] p-6">
      <h3 className="font-semibold text-white">{title}</h3>

      <div className="mt-6 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-3 border-b border-white/[0.06] py-3 text-sm"
          >
            <span className="text-gray-500">{label}</span>
            <span className="text-right text-gray-200">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-lg bg-white/[0.025] p-3 text-xs leading-5 text-gray-500">
        <Info size={15} className="mt-0.5 shrink-0 text-cyan-400" />
        {training.training_history_available
          ? "Saved training history is available."
          : training.training_history_note}
      </div>
    </div>
  );
}

function ConfusionNote({
  limitations,
}: {
  limitations: string[];
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-start gap-2 text-xs leading-5 text-gray-500">
        <Info size={15} className="mt-0.5 shrink-0 text-cyan-400" />
        <div className="space-y-2">
          {limitations.map((limitation, index) => (
            <p key={index}>{limitation}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [summary, setSummary] = useState<ResearchSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadDashboardData = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [
        statsResponse,
        historyResponse,
        summaryResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/history/stats`, {
          cache: "no-store",
        }),

        fetch(`${API_BASE_URL}/history?limit=10&offset=0`, {
          cache: "no-store",
        }),

        fetch(`${API_BASE_URL}/research/summary`, {
          cache: "no-store",
        }),
      ]);

      if (!statsResponse.ok) {
        throw new Error("Unable to load analysis statistics.");
      }

      if (!historyResponse.ok) {
        throw new Error("Unable to load analysis history.");
      }

      if (!summaryResponse.ok) {
        throw new Error("Unable to load research summary.");
      }

      const statsData: HistoryStats = await statsResponse.json();
      const historyData: HistoryResponse = await historyResponse.json();
      const summaryData: ResearchSummary = await summaryResponse.json();

      if (summaryData.status !== "success") {
        throw new Error("Research summary returned an invalid response.");
      }

      setStats(statsData);
      setHistory(historyData.history || []);
      setSummary(summaryData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this history record?"
    );

    if (!confirmed) return;

    setDeleteId(id);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/history/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete this history record.");
      }

      await loadDashboardData(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "History deletion failed."
      );
    } finally {
      setDeleteId(null);
    }
  };

  const clinicalDataset = summary?.datasets.clinical;
  const histopathDataset = summary?.datasets.histopathology;

  const clinicalTraining = summary?.training.clinical;
  const histopathTraining = summary?.training.histopathology;

  const clinicalModel = summary?.models.clinical;
  const histopathModel = summary?.models.histopathology;

  const liveMetrics = [
    {
      label: "Total Analyses",
      value: stats?.total_analyses ?? 0,
      icon: Activity,
      detail: "Saved in SQLite history",
    },
    {
      label: "Clinical Analyses",
      value: stats?.clinical_analyses ?? 0,
      icon: Microscope,
      detail: "Clinical image pipeline",
    },
    {
      label: "Histopathology Analyses",
      value: stats?.histopathology_analyses ?? 0,
      icon: Brain,
      detail: "Tissue image pipeline",
    },
    {
      label: "Grad-CAM Analyses",
      value: stats?.gradcam_analyses ?? 0,
      icon: FileBarChart,
      detail: "Saved Grad-CAM requests",
    },
  ];

  const models = [
    clinicalModel,
    histopathModel,
  ].filter((model): model is ResearchModel => Boolean(model));

  return (
    <main className="min-h-screen bg-[#080b11] px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"
        >
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Research Environment
            </div>

            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Research Dashboard<span className="text-cyan-400">.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
              A research overview of ORALNOVA AI model performance, dataset
              composition, training experiments and live analysis history.
            </p>
          </div>

          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-300 transition hover:bg-white/[0.08] disabled:opacity-50 md:self-auto"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh Data
          </button>
        </motion.header>

        {/* BACKEND STATUS */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-[#11151d] px-4 py-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              error
                ? "bg-red-400"
                : loading
                  ? "bg-amber-400"
                  : "bg-emerald-400"
            }`}
          />

          <span className="text-sm text-gray-300">
            {error
              ? "Backend connection issue"
              : loading
                ? "Connecting to backend..."
                : "Research API and database connected"}
          </span>

          <span className="text-xs text-gray-600">
            FastAPI · SQLite · Research Summary API
          </span>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-medium">
                Dashboard data could not be loaded
              </p>

              <p className="mt-1 text-red-300/70">{error}</p>

              <p className="mt-2 text-xs text-gray-500">
                Make sure the FastAPI backend is running on port 8000.
              </p>
            </div>
          </div>
        )}

        {/* LIVE ANALYTICS */}
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <Activity className="text-emerald-400" size={21} />

            <div>
              <h2 className="text-xl font-semibold">
                Live Analysis Overview
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Values fetched directly from the SQLite database
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {liveMetrics.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
              >
                <MetricCard
                  label={item.label}
                  value={loading ? "..." : String(item.value)}
                  detail={item.detail}
                  icon={item.icon}
                />
              </motion.div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.08] bg-[#11151d] p-5">
              <p className="text-sm text-gray-400">
                Prediction Analyses
              </p>

              <p className="mt-3 text-2xl font-semibold">
                {loading ? "..." : stats?.prediction_analyses ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#11151d] p-5">
              <p className="text-sm text-gray-400">
                Database Records
              </p>

              <p className="mt-3 text-2xl font-semibold">
                {loading ? "..." : stats?.total_analyses ?? 0}
              </p>
            </div>
          </div>
        </section>

        {/* RECENT HISTORY */}
        <section className="mb-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Clock className="text-cyan-400" size={21} />

              <div>
                <h2 className="text-xl font-semibold">
                  Recent Analysis History
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Latest records stored by the backend
                </p>
              </div>
            </div>

            <span className="text-xs text-gray-500">
              Showing latest {history.length} records
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11151d]">
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-sm text-gray-400">
                <Loader2 className="animate-spin" size={18} />
                Loading analysis history...
              </div>
            ) : history.length === 0 ? (
              <div className="p-12 text-center">
                <Database className="mx-auto text-gray-600" size={30} />

                <p className="mt-4 text-sm text-gray-300">
                  No analysis records yet
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Run an analysis to see its record here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-gray-500">
                      <th className="px-5 py-4 font-medium">ID</th>
                      <th className="px-5 py-4 font-medium">Image</th>
                      <th className="px-5 py-4 font-medium">Pipeline</th>
                      <th className="px-5 py-4 font-medium">Prediction</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Model Score
                      </th>
                      <th className="px-5 py-4 font-medium">Analysis Type</th>
                      <th className="px-5 py-4 font-medium">Date</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-white/[0.05] transition hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4 text-gray-500">
                          #{record.id}
                        </td>

                        <td className="max-w-[190px] truncate px-5 py-4 text-gray-300">
                          {record.filename}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-1 text-xs text-cyan-300">
                            {record.image_type}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-gray-200">
                          {formatPrediction(record.prediction)}
                        </td>

                        <td className="px-5 py-4 text-right tabular-nums text-gray-300">
                          {(record.model_score * 100).toFixed(2)}%
                        </td>

                        <td className="px-5 py-4 text-gray-400">
                          {record.analysis_type}
                        </td>

                        <td className="px-5 py-4 text-xs text-gray-500">
                          {formatDate(record.created_at)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDelete(record.id)}
                            disabled={deleteId === record.id}
                            title="Delete history record"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-red-400/10 hover:text-red-400 disabled:opacity-40"
                          >
                            {deleteId === record.id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs leading-5 text-gray-600">
            Model scores are model outputs, not clinically validated
            probabilities or diagnostic confidence.
          </p>
        </section>

        {/* DYNAMIC DATASET OVERVIEW */}
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <Database className="text-cyan-400" size={21} />

            <div>
              <h2 className="text-xl font-semibold">
                Research Dataset Overview
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Counts fetched from processed dataset manifests
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Clinical Images"
              value={loading ? "..." : formatNumber(
                summary?.overview.clinical_images
              )}
              detail="Processed clinical dataset"
              icon={Activity}
            />

            <MetricCard
              label="Histopathology Images"
              value={loading ? "..." : formatNumber(
                summary?.overview.histopathology_images
              )}
              detail="Processed tissue dataset"
              icon={Microscope}
            />

            <MetricCard
              label="Total Dataset"
              value={loading ? "..." : formatNumber(
                summary?.overview.total_processed_images
              )}
              detail="Across both pipelines"
              icon={Database}
            />

            <MetricCard
              label="AI Models"
              value={loading ? "..." : String(
                summary?.overview.number_of_models ?? 0
              )}
              detail="Configured model pipelines"
              icon={Brain}
            />
          </div>
        </section>

        {/* MODEL PERFORMANCE */}
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <FileBarChart className="text-cyan-400" size={21} />

            <div>
              <h2 className="text-xl font-semibold">
                Model Performance
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Evaluation metrics fetched from saved evaluation JSON files
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#11151d] p-10 text-center text-sm text-gray-500">
              Loading evaluation metrics...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {models.map((model, index) => (
                <ModelPerformanceCard
                  key={model.model_type}
                  model={model}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>

        {/* TRAINING SUMMARY */}
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <GraduationCap className="text-cyan-400" size={22} />

            <div>
              <h2 className="text-xl font-semibold">
                Training Summary
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Values from the actual backend training configuration
              </p>
            </div>
          </div>

          {loading || !clinicalTraining || !histopathTraining ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#11151d] p-8 text-sm text-gray-500">
              Loading training configuration...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <TrainingCard
                title="Clinical Model"
                training={clinicalTraining}
              />

              <TrainingCard
                title="Histopathology Model"
                training={histopathTraining}
              />
            </div>
          )}

          {summary && (
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#11151d] p-5">
              <div className="flex items-center gap-2">
                <Microscope size={18} className="text-violet-400" />
                <h3 className="font-medium text-gray-200">
                  High-Resolution Experiment
                </h3>
              </div>

              <div className="mt-4 flex flex-wrap gap-5 text-sm">
                <span className="text-gray-500">
                  Input resolution:{" "}
                  <span className="text-gray-200">
                    {summary.training.histopathology_high_resolution.image_size}
                    {" × "}
                    {summary.training.histopathology_high_resolution.image_size}
                  </span>
                </span>

                <span className="text-gray-500">
                  Checkpoint:{" "}
                  <span className="text-gray-200">
                    {summary.training.histopathology_high_resolution.checkpoint_available
                      ? "Available"
                      : "Not available"}
                  </span>
                </span>
              </div>
            </div>
          )}
        </section>

        {/* DATASET COMPOSITION */}
        <section className="mb-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-[#11151d] p-6">
            <div className="mb-7 flex items-center gap-3">
              <Layers3 className="text-cyan-400" size={20} />
              <h2 className="font-semibold">Dataset Composition</h2>
            </div>

            {loading || !clinicalDataset || !histopathDataset ? (
              <p className="text-sm text-gray-500">
                Loading dataset composition...
              </p>
            ) : (
              <div className="space-y-8">
                <CompositionBar
                  title="Clinical dataset"
                  dataset={clinicalDataset}
                />

                <CompositionBar
                  title="Histopathology dataset"
                  dataset={histopathDataset}
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#11151d] p-6">
            <div className="mb-5 flex items-center gap-3">
              <FlaskConical className="text-violet-400" size={20} />
              <h2 className="font-semibold">Research Configuration</h2>
            </div>

            {summary ? (
              <div className="space-y-4 text-sm">
                {[
                  ["Architecture", "MobileNetV3-Small"],
                  [
                    "Input resolution",
                    `${clinicalModel?.input_resolution ?? "N/A"} × ${clinicalModel?.input_resolution ?? "N/A"}`,
                  ],
                  ["Pretrained weights", "ImageNet"],
                  ["Training device", summary.research_configuration.device],
                  ["Random seed", String(summary.research_configuration.random_seed)],
                  ["Split strategy", "Stratified 70 / 15 / 15"],
                  [
                    "Clinical test set",
                    formatNumber(clinicalDataset?.split_counts.test),
                  ],
                  [
                    "Histopathology test set",
                    formatNumber(histopathDataset?.split_counts.test),
                  ],
                  [
                    "Optimizer learning rate",
                    String(summary.research_configuration.learning_rate),
                  ],
                  [
                    "Batch size",
                    String(summary.research_configuration.batch_size),
                  ],
                  [
                    "Weight decay",
                    String(summary.research_configuration.weight_decay),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"
                  >
                    <span className="text-gray-500">{label}</span>
                    <span className="text-right text-gray-200">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Loading research configuration...
              </p>
            )}
          </div>
        </section>

        {/* DATASET SPLITS */}
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <Database className="text-cyan-400" size={21} />

            <div>
              <h2 className="text-xl font-semibold">
                Dataset Split Statistics
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Dynamic image-level distribution from processed manifests
              </p>
            </div>
          </div>

          {clinicalDataset && histopathDataset ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SplitCard
                title="Clinical dataset"
                dataset={clinicalDataset}
              />

              <SplitCard
                title="Histopathology dataset"
                dataset={histopathDataset}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-[#11151d] p-6 text-sm text-gray-500">
              Dataset split information unavailable.
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-xs leading-5 text-gray-500">
            <Info size={15} className="mt-0.5 shrink-0 text-cyan-400" />

            Splits are image-level. Patient-level independence has not been
            established, so patient-level data leakage cannot be ruled out.
          </div>
        </section>

        {/* MODEL COMPARISON */}
        <section className="mb-10 rounded-2xl border border-white/[0.08] bg-[#11151d] p-6">
          <div className="mb-6 flex items-center gap-3">
            <ChartNoAxesCombined className="text-cyan-400" size={21} />

            <div>
              <h2 className="text-xl font-semibold">
                Model Comparison
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Test accuracy within each model&apos;s own classification task
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {models.map((model, index) => {
              const accuracy = model.evaluation.accuracy;

              return (
                <div key={model.model_type}>
                  <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                    <span className="text-gray-300">
                      {model.model_type === "clinical"
                        ? "Clinical Model"
                        : "Histopathology Model"}
                    </span>

                    <span className="font-medium text-white">
                      {formatPercent(accuracy)}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        GRADIENT_COLORS[index % GRADIENT_COLORS.length]
                      }`}
                      style={{
                        width: `${accuracy !== null ? accuracy * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-xs leading-5 text-gray-500">
            These models perform different classification tasks on different
            datasets. Their accuracy values should not be interpreted as a
            direct clinical comparison.
          </p>
        </section>

        {/* MODEL STATUS */}
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <Server className="text-cyan-400" size={21} />

            <div>
              <h2 className="text-xl font-semibold">Model Infrastructure</h2>
              <p className="mt-1 text-xs text-gray-500">
                Checkpoint availability and model loading state
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {models.map((model) => (
              <div
                key={model.model_type}
                className="rounded-xl border border-white/[0.08] bg-[#11151d] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-gray-200">
                    {model.model_type === "clinical"
                      ? "Clinical Model"
                      : "Histopathology Model"}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      model.checkpoint.available
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-red-400/10 text-red-300"
                    }`}
                  >
                    {model.checkpoint.available
                      ? "Checkpoint Available"
                      : "Checkpoint Missing"}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Cpu size={15} />
                  {model.architecture}
                </div>

                <p className="mt-3 break-all text-xs leading-5 text-gray-600">
                  {model.checkpoint.path}
                </p>

                <div className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-gray-500">
                  Loaded in memory:{" "}
                  <span className="text-gray-300">
                    {model.checkpoint.loaded_in_memory ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RESEARCH INSIGHTS */}
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <Target className="text-cyan-400" size={21} />

            <div>
              <h2 className="text-xl font-semibold">Research Insights</h2>

              <p className="mt-1 text-xs text-gray-500">
                Observations derived from current evaluation data
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.08] bg-[#11151d] p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Clinical evaluation
              </p>

              <p className="mt-3 text-2xl font-semibold text-cyan-400">
                {formatNumber(
                  clinicalModel?.evaluation.classification_report
                    ? Object.values(
                        clinicalModel.evaluation.classification_report
                      )
                        .filter(
                          (item): item is ClassMetric =>
                            typeof item === "object" && item !== null
                        )
                        .reduce((sum, item) => sum + item.support, 0)
                    : null
                )}{" "}
                images
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                The clinical test set is small. Its reported metrics are
                preliminary and may vary with additional data.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#11151d] p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Histopathology evaluation
              </p>

              <p className="mt-3 text-2xl font-semibold text-violet-400">
                {formatNumber(
                  histopathModel?.evaluation.classification_report?.[
                    "Ameloblastoma (Plexiform)"
                  ] &&
                  typeof histopathModel.evaluation.classification_report[
                    "Ameloblastoma (Plexiform)"
                  ] === "object"
                    ? (
                        histopathModel.evaluation.classification_report[
                          "Ameloblastoma (Plexiform)"
                        ] as ClassMetric
                      ).support
                    : null
                )}{" "}
                images
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Ameloblastoma test support is small, making its reported
                class-specific metrics unstable.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#11151d] p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                External validation
              </p>

              <p className="mt-3 text-2xl font-semibold text-amber-400">
                Not performed
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                External-institution testing and independent clinical
                validation have not been performed.
              </p>
            </div>
          </div>
        </section>

        {/* LIMITATIONS */}
        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5 md:p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert
              className="mt-1 shrink-0 text-amber-400"
              size={22}
            />

            <div className="min-w-0">
              <h2 className="font-semibold text-amber-200">
                Research Limitations & Important Disclaimer
              </h2>

              {summary ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-400">
                  {summary.limitations.map((limitation, index) => (
                    <li key={index}>{limitation}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  Loading research limitations...
                </p>
              )}

              <p className="mt-5 border-t border-amber-400/10 pt-4 text-sm leading-6 text-amber-100/80">
                {summary?.disclaimer ||
                  "ORALNOVA AI is an educational research prototype. It is not a medical diagnostic system."}
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-white/[0.07] pt-5 text-xs text-gray-600 sm:flex-row">
          <span>ORALNOVA AI 2.0 · Research Dashboard</span>

          <span>
            {summary?.generated_at
              ? `Last research sync: ${formatDate(summary.generated_at)}`
              : "Research data not synchronized"}
          </span>
        </footer>
      </div>
    </main>
  );
}
