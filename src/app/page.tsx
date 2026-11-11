
"use client";

import Link from "next/link";

import {
  Activity,
  ArrowUp,
  ArrowUpRight,
  Brain,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Dna,
  FileImage,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Scan,
  Zap,
} from "lucide-react";

import HolographicTooth3D from "@/app/components/HolographicTooth3D";

const technologies = [
  "MobileNetV3-Small",
  "PyTorch",
  "Grad-CAM",
  "Computer Vision",
  "Explainable AI",
];

const features = [
  {
    number: "01",
    icon: Camera,
    title: "Oral Image Analysis",
    description:
      "Upload an oral image for research-based AI image analysis.",
    status: "AVAILABLE",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI-Assisted Screening",
    description:
      "Explore an image classification workflow powered by deep learning.",
    status: "MODEL INTEGRATED",
  },
  {
    number: "03",
    icon: Scan,
    title: "Visual Explainability",
    description:
      "Understand model attention through Grad-CAM visual explanations.",
    status: "AVAILABLE",
  },
  {
    number: "04",
    icon: ShieldCheck,
    title: "Research Insights",
    description:
      "Explore model evaluation, limitations and research observations.",
    status: "DASHBOARD AVAILABLE",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white">

      {/* BACKGROUND EFFECTS */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-cyan-400/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 rounded-full bg-purple-600/10 blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,217,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.2) 1px, transparent 1px)",
            backgroundSize: "65px 65px",
          }}
        />
      </div>

      {/* NAVBAR */}
      <header className="relative z-20 border-b border-cyan-400/10 bg-[#020817]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-[1450px] items-center justify-between px-6 py-5 lg:px-12">

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-400/10">
              <Activity className="h-6 w-6 text-cyan-300" />
            </div>

            <div>
              <p className="text-lg font-bold tracking-[0.18em]">
                ORAL<span className="text-cyan-400">NOVA</span>
              </p>
              <p className="text-[9px] tracking-[0.3em] text-slate-500">
                AI RESEARCH PLATFORM
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
            <Link href="/" className="transition hover:text-cyan-300">
              Home
            </Link>

            <a href="#features" className="transition hover:text-cyan-300">
              Features
            </a>

            <a href="#research" className="transition hover:text-cyan-300">
              Research
            </a>

            <a href="#about" className="transition hover:text-cyan-300">
              About
            </a>

            <Link
              href="/dashboard"
              className="font-semibold text-cyan-300 transition hover:text-white"
            >
              Dashboard
              <ArrowUpRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
          >
            Research Dashboard
            <ArrowUpRight className="ml-1 inline h-4 w-4" />
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto grid min-h-[650px] max-w-[1450px] items-center gap-8 px-6 py-16 lg:grid-cols-[0.95fr_1.2fr_0.9fr] lg:px-12 lg:py-12">

        {/* LEFT CONTENT */}
        <div className="relative z-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            <span className="text-[10px] font-semibold tracking-[0.2em] text-cyan-300">
              AI-ASSISTED ORAL IMAGE RESEARCH
            </span>
          </div>

          <h1 className="text-5xl font-bold leading-[1.12] tracking-tight sm:text-6xl xl:text-7xl">
            A NEW
            <br />
            PERSPECTIVE
            <br />
            ON{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              ORAL
            </span>
            <br />
            HEALTH.
          </h1>

          <p className="mt-7 max-w-md text-sm leading-7 text-slate-400">
            Exploring the intersection of artificial intelligence and oral
            image analysis through explainable deep learning research.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="#features"
              className="group flex items-center gap-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.03]"
            >
              Explore Research
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg border border-white/10 px-6 py-3.5 text-sm text-slate-300 transition hover:border-cyan-400/40"
            >
              View Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 flex gap-8 border-t border-white/10 pt-7">
            <div>
              <p className="text-2xl font-bold text-cyan-300">AI</p>
              <p className="mt-1 text-[10px] tracking-wider text-slate-500">
                RESEARCH
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold text-cyan-300">XAI</p>
              <p className="mt-1 text-[10px] tracking-wider text-slate-500">
                EXPLAINABILITY
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold text-cyan-300">CV</p>
              <p className="mt-1 text-[10px] tracking-wider text-slate-500">
                COMPUTER VISION
              </p>
            </div>
          </div>
        </div>

        {/* CENTRE: CLINICAL IMAGE WORKSPACE */}
        <div className="relative mx-auto w-full max-w-[560px]">

          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-bold tracking-[0.22em] text-cyan-300">
                IMAGE ANALYSIS WORKSPACE
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Clinical image research environment
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-[9px] tracking-wider text-slate-400">
                PREVIEW MODE
              </span>
            </div>
          </div>

          <HolographicTooth3D />
        </div>

        {/* RIGHT AI PANEL */}
        <div className="relative">
          <div className="glass-card rounded-2xl border border-cyan-400/20 bg-[#07172b]/80 p-5 shadow-[0_0_50px_rgba(0,217,255,0.08)] backdrop-blur-xl">

            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs font-bold tracking-widest text-white">
                  AI RESEARCH PANEL
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  SYSTEM OVERVIEW
                </p>
              </div>

              <div className="rounded-lg bg-cyan-400/10 p-2">
                <Brain className="h-5 w-5 text-cyan-300" />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Model Architecture
              </span>

              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[9px] text-emerald-300">
                TRAINED
              </span>
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Dna className="h-5 w-5 text-blue-300" />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    MobileNetV3-Small
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Clinical + Histopathology Models
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Sparkles className="h-5 w-5 text-purple-300" />
                </div>

                <div>
                  <p className="text-sm font-semibold">Grad-CAM</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Visual Explainability
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />

                <p className="text-xs font-semibold text-emerald-300">
                  Models Integrated
                </p>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                Clinical and histopathology classification models are
                trained. Grad-CAM visualization is available through
                the research workspace.
              </p>

              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 hover:text-white"
              >
                View Research Dashboard
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="rounded-lg bg-green-400/10 p-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>

            <div>
              <p className="text-xs font-semibold">Research Prototype</p>
              <p className="mt-1 text-[10px] text-slate-500">
                Educational development project
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNOLOGY STRIP */}
      <section className="relative z-10 border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto flex max-w-[1450px] flex-wrap items-center justify-center gap-x-12 gap-y-5 px-6 py-7 lg:px-12">
          {technologies.map((technology) => (
            <span
              key={technology}
              className="text-xs font-medium tracking-wide text-slate-500 transition hover:text-cyan-300"
            >
              {technology}
            </span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-[1450px] px-6 py-24 lg:px-12"
      >
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-cyan-300">
              <Zap className="h-4 w-4" />
              PLATFORM CAPABILITIES
            </p>

            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              RESEARCH-DRIVEN.
              <br />
              <span className="text-slate-500">
                TECHNOLOGY-POWERED.
              </span>
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-7 text-slate-400">
            A modular research platform exploring how AI can support oral
            image analysis and explainable machine learning.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.number}
                className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-2 hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    {feature.number}
                  </span>

                  <Icon className="h-6 w-6 text-cyan-300 transition group-hover:scale-110" />
                </div>

                <h3 className="mt-10 text-lg font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 min-h-[72px] text-xs leading-6 text-slate-400">
                  {feature.description}
                </p>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="text-[9px] font-bold tracking-[0.15em] text-cyan-300">
                    {feature.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RESEARCH */}
      <section
        id="research"
        className="relative z-10 border-y border-white/10 bg-[#071326]/70"
      >
        <div className="mx-auto grid max-w-[1450px] gap-12 px-6 py-24 md:grid-cols-2 lg:px-12">

          <div>
            <p className="mb-4 text-[10px] font-bold tracking-[0.3em] text-cyan-300">
              THE RESEARCH DIRECTION
            </p>

            <h2 className="text-4xl font-bold leading-tight md:text-5xl">
              MAKING AI
              <br />
              <span className="text-cyan-300">MORE</span> EXPLAINABLE.
            </h2>

            <p className="mt-7 max-w-lg text-sm leading-7 text-slate-400">
              ORALNOVA AI explores lightweight deep learning architectures
              and visual explanation techniques for oral image analysis.
              The research aims to make model behaviour easier to inspect
              and understand.
            </p>

            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white"
            >
              Explore research dashboard
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
              <HeartPulse className="h-7 w-7 text-cyan-300" />

              <h3 className="mt-6 text-lg font-semibold">
                Oral Image Research
              </h3>

              <p className="mt-3 text-xs leading-6 text-slate-400">
                Exploring image-based machine learning approaches.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-400/20 bg-purple-400/[0.04] p-6">
              <Stethoscope className="h-7 w-7 text-purple-300" />

              <h3 className="mt-6 text-lg font-semibold">
                Human-Centred Approach
              </h3>

              <p className="mt-3 text-xs leading-6 text-slate-400">
                Keeping research communication clear and responsible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="relative z-10 mx-auto max-w-[1450px] px-6 py-20 lg:px-12"
      >
        <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.08] via-blue-500/[0.04] to-purple-500/[0.08] p-8 md:p-12">

          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="mb-4 text-[10px] font-bold tracking-[0.3em] text-cyan-300">
                ABOUT ORALNOVA AI 2.0
              </p>

              <h2 className="text-3xl font-bold md:text-4xl">
                RESEARCH WITH
                <br />
                RESPONSIBILITY.
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-400">
                An educational research prototype focused on exploring
                artificial intelligence, computer vision and explainable
                deep learning for oral image analysis.
              </p>
            </div>

            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
              <FileImage className="h-12 w-12 text-cyan-300" />
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-white/10 pt-7">
            {[
              "Artificial Intelligence",
              "Computer Vision",
              "Deep Learning",
              "Explainable AI",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="relative z-10 mx-auto max-w-[1450px] px-6 pb-16 lg:px-12">
        <div className="flex gap-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
          <ShieldCheck className="h-5 w-5 shrink-0 text-amber-300" />

          <p className="text-xs leading-6 text-slate-400">
            <strong className="text-amber-300">
              Important Disclaimer:
            </strong>{" "}
            ORALNOVA AI 2.0 is an educational research prototype, not a
            clinically validated medical diagnostic system. It cannot
            diagnose, confirm or rule out oral cancer. Any oral lesion or
            health concern should be evaluated by a qualified dental or
            medical professional.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 bg-[#01050d]">
        <div className="mx-auto flex max-w-[1450px] flex-col justify-between gap-5 px-6 py-8 sm:flex-row sm:items-center lg:px-12">

          <div>
            <p className="text-sm font-bold tracking-[0.2em]">
              ORAL<span className="text-cyan-400">NOVA</span> AI 2.0
            </p>

            <p className="mt-2 text-[10px] text-slate-600">
              Exploring AI-assisted oral image research.
            </p>
          </div>

          <p className="text-[10px] text-slate-600">
            Educational Research Prototype · 2026
          </p>

          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-400 transition hover:text-cyan-300"
          >
            Back to top
            <ArrowUp className="h-4 w-4" />
          </Link>
        </div>
      </footer>

    </main>
  );
}
