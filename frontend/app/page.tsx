"use client";

import { useState, type FormEvent } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

interface AnalyzeResult {
  repository: {
    name: string;
    description: string | null;
    url: string;
    stars: number;
    language: string | null;
  };
  readiness_score: number;
  maximum_score: number;
  file_checks: Record<string, boolean>;
  readme_analysis: {
    score: number;
    maximum_score: number;
    checks?: Record<string, boolean>;
  };
  link_analysis?: {
    total_links: number;
    checked_links: number;
    working: number;
    broken: number;
    inaccessible: number;
    note?: string;
  };
  recommendations: string[];
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );
}

function StatusIcon({ passed }: { passed: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${passed
          ? "bg-emerald-400/10 text-emerald-400"
          : "bg-rose-400/10 text-rose-400"
        }`}
    >
      {passed ? "✓" : "×"}
    </span>
  );
}

export default function Home() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!repositoryUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repository_url: repositoryUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to analyze this repository."
        );
      }

      setResult(data as AnalyzeResult);
    } catch (err) {
      if (err instanceof Error) {
        setError(
          err.message === "Failed to fetch"
            ? "Could not connect to RepoReady. Check that your backend is running and its CORS settings allow the frontend."
            : err.message
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const scorePercent = result
    ? Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (result.readiness_score / (result.maximum_score || 100)) * 100
        )
      )
    )
    : 0;

  const checkEntries = result ? Object.entries(result.file_checks) : [];

  return (
    <div className="min-h-screen bg-[#080B14] text-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/[0.07] bg-[#0B0F1A] px-5 py-7 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-lg font-black text-[#07111D] shadow-lg shadow-cyan-500/20">
              R
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Repo<span className="text-cyan-400">Ready</span>
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                Developer toolkit
              </p>
            </div>
          </div>

          <div className="mt-12">
            <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              Workspace
            </p>

            <div className="flex items-center gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] px-3 py-3 text-sm font-medium text-cyan-300">
              <span className="text-lg">⌕</span>
              Repository analyzer
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">
                Local workspace
              </span>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Analyze public GitHub repositories and discover ways to make
              them easier to contribute to.
            </p>
          </div>

          <p className="mt-5 px-2 text-[10px] text-slate-700">
            RepoReady · Built for contributors
          </p>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="flex h-[72px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-9">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="lg:hidden font-bold text-slate-100">
                Repo<span className="text-cyan-400">Ready</span>
              </span>
              <span className="hidden lg:inline">Workspace</span>
              <span className="hidden lg:inline text-slate-700">/</span>
              <span className="hidden lg:inline text-slate-300">
                Repository analyzer
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-medium text-slate-400">
                Analysis engine ready
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-5 py-10 sm:px-9 sm:py-14">
            {/* Page heading */}
            <div className="mb-9 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Open-source intelligence
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Make your repository
                <br />
                <span className="text-cyan-400">contributor-ready.</span>
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                Analyze GitHub repositories, identify documentation gaps,
                check external links, and discover what could make your
                project more welcoming to contributors.
              </p>
            </div>

            {/* Repository input */}
            <section className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#101725] p-5 shadow-2xl shadow-black/20 sm:p-7">
              <div className="pointer-events-none absolute -right-16 -top-28 h-64 w-64 rounded-full bg-cyan-500/[0.06] blur-3xl" />

              <div className="relative">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-cyan-400">⌘</span>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Analyze a GitHub repository
                  </h3>
                </div>

                <form
                  onSubmit={handleAnalyze}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <div className="relative min-w-0 flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      ↗
                    </span>
                    <input
                      type="url"
                      value={repositoryUrl}
                      onChange={(event) => setRepositoryUrl(event.target.value)}
                      placeholder="https://github.com/owner/repository"
                      className="h-13 w-full rounded-xl border border-white/[0.1] bg-[#090E18] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-13 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 text-sm font-bold text-[#07111D] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07111D]/30 border-t-[#07111D]" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze repository
                        <span className="text-base">→</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    Enter the URL of a public GitHub repository.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setRepositoryUrl("https://github.com/fastapi/fastapi")
                    }
                    className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
                  >
                    Try an example →
                  </button>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-300"
                  >
                    {error}
                  </div>
                )}
              </div>
            </section>

            {/* Results or empty state */}
            {result ? (
              <section className="mt-9 space-y-6">
                {/* Repository information */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      Analysis report
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-white">
                      {result.repository.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {result.repository.description ||
                        "No repository description provided."}
                    </p>
                  </div>
                  <a
                    href={result.repository.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
                  >
                    View on GitHub ↗
                  </a>
                </div>

                {/* Score and repository details */}
                <div className="grid gap-5 md:grid-cols-[1fr_1.5fr]">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#101725] p-6">
                    <p className="text-sm font-semibold text-slate-300">
                      Contributor-readiness score
                    </p>

                    <div className="mt-7 flex items-center justify-center">
                      <div
                        className="flex h-40 w-40 items-center justify-center rounded-full"
                        style={{
                          background: `conic-gradient(#22d3ee ${scorePercent}%, #253041 ${scorePercent}% 100%)`,
                        }}
                      >
                        <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#101725]">
                          <span className="text-4xl font-bold tracking-tight text-white">
                            {result.readiness_score}
                          </span>
                          <span className="mt-1 text-xs text-slate-500">
                            out of {result.maximum_score}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                      A heuristic score based on repository documentation
                      and contributor resources.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#101725] p-6">
                    <p className="text-sm font-semibold text-slate-300">
                      Repository overview
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/[0.035] p-4">
                        <p className="text-xs text-slate-500">GitHub stars</p>
                        <p className="mt-2 text-2xl font-bold text-white">
                          {Number(result.repository.stars || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/[0.035] p-4">
                        <p className="text-xs text-slate-500">Language</p>
                        <p className="mt-2 text-xl font-bold text-white">
                          {result.repository.language || "Unknown"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/[0.035] p-4">
                        <p className="text-xs text-slate-500">README score</p>
                        <p className="mt-2 text-2xl font-bold text-white">
                          {result.readme_analysis.score}
                          <span className="ml-1 text-sm font-medium text-slate-500">
                            / {result.readme_analysis.maximum_score}
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/[0.035] p-4">
                        <p className="text-xs text-slate-500">
                          Resources present
                        </p>
                        <p className="mt-2 text-2xl font-bold text-white">
                          {checkEntries.filter(([, value]) => value).length}
                          <span className="ml-1 text-sm font-medium text-slate-500">
                            / {checkEntries.length}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File checks */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#101725] p-6">
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-white">
                      Contributor-readiness checks
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Repository resources detected by RepoReady.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {checkEntries.map(([name, passed]) => (
                      <div
                        key={name}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                      >
                        <StatusIcon passed={passed} />
                        <span className="text-sm text-slate-300">
                          {formatLabel(name)}
                        </span>
                        <span
                          className={`ml-auto text-[10px] font-semibold uppercase ${passed ? "text-emerald-400" : "text-rose-400"
                            }`}
                        >
                          {passed ? "Present" : "Missing"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* README quality analysis */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#101725] p-6">
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-white">
                      README quality analysis
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Documentation sections detected in your repository README.
                    </p>
                  </div>

                  <div className="mb-5 flex items-end gap-2">
                    <span className="text-3xl font-bold text-white">
                      {result.readme_analysis.score}
                    </span>
                    <span className="mb-1 text-sm text-slate-500">
                      / {result.readme_analysis.maximum_score} points
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(result.readme_analysis.checks ?? {}).map(
                      ([name, passed]) => (
                        <div
                          key={name}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                        >
                          <StatusIcon passed={passed} />
                          <span className="text-sm text-slate-300">
                            {formatLabel(name)}
                          </span>
                          <span
                            className={`ml-auto text-[10px] font-semibold uppercase ${passed ? "text-emerald-400" : "text-rose-400"
                              }`}
                          >
                            {passed ? "Present" : "Missing"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                {/* Link analysis */}
                {result.link_analysis && (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#101725] p-6">
                    <h3 className="text-sm font-semibold text-white">
                      Documentation link analysis
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Results from external links detected in the README.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        {
                          label: "Detected",
                          value: result.link_analysis.total_links,
                          color: "text-white",
                        },
                        {
                          label: "Checked",
                          value: result.link_analysis.checked_links,
                          color: "text-cyan-300",
                        },
                        {
                          label: "Working",
                          value: result.link_analysis.working,
                          color: "text-emerald-400",
                        },
                        {
                          label: "Broken",
                          value: result.link_analysis.broken,
                          color: "text-rose-400",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl bg-white/[0.035] p-4"
                        >
                          <p className="text-xs text-slate-500">
                            {item.label}
                          </p>
                          <p
                            className={`mt-2 text-2xl font-bold ${item.color}`}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 text-xs text-slate-500">
                      {result.link_analysis.inaccessible} inaccessible links.
                      Some websites block automated checks; inaccessible
                      does not necessarily mean broken.
                    </p>

                    {result.link_analysis.note && (
                      <p className="mt-2 text-xs text-slate-600">
                        {result.link_analysis.note}
                      </p>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                <div className="rounded-2xl border border-cyan-400/10 bg-[#101725] p-6">
                  <h3 className="text-sm font-semibold text-white">
                    Recommended improvements
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Actionable suggestions based on the analysis.
                  </p>

                  {result.recommendations.length > 0 ? (
                    <div className="mt-5 space-y-3">
                      {result.recommendations.map((recommendation, index) => (
                        <div
                          key={`${index}-${recommendation}`}
                          className="flex items-start gap-3 rounded-xl bg-white/[0.025] p-3"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-xs font-bold text-cyan-300">
                            {index + 1}
                          </span>
                          <p className="text-sm leading-6 text-slate-300">
                            {recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-emerald-400">
                      No recommendations were returned for this repository.
                    </p>
                  )}
                </div>
              </section>
            ) : (
              <section className="mt-9">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">
                      What RepoReady analyzes
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      A practical overview of your repository's contributor
                      experience.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    {
                      icon: "01",
                      title: "README quality",
                      description:
                        "Check project descriptions, installation instructions, usage examples, and documentation sections.",
                    },
                    {
                      icon: "02",
                      title: "Contributor resources",
                      description:
                        "Look for contribution guides, licenses, codes of conduct, and GitHub templates.",
                    },
                    {
                      icon: "03",
                      title: "Documentation links",
                      description:
                        "Check external README links and identify broken or inaccessible destinations.",
                    },
                    {
                      icon: "04",
                      title: "Readiness score",
                      description:
                        "Get a heuristic score based on documentation and contributor-friendly resources.",
                    },
                    {
                      icon: "05",
                      title: "Actionable feedback",
                      description:
                        "Receive practical recommendations for improving the contributor experience.",
                    },
                    {
                      icon: "06",
                      title: "Repository overview",
                      description:
                        "Review public repository metadata, language, stars, and detected resources.",
                    },
                  ].map((feature) => (
                    <div
                      key={feature.icon}
                      className="rounded-2xl border border-white/[0.07] bg-[#101725] p-5 transition hover:border-cyan-400/20 hover:bg-[#121C2D]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/15 bg-cyan-400/[0.06] text-xs font-bold text-cyan-300">
                        {feature.icon}
                      </span>
                      <h4 className="mt-4 text-sm font-semibold text-slate-200">
                        {feature.title}
                      </h4>
                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] px-5 py-8 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/[0.08] text-xl text-cyan-300">
                    ↗
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-200">
                    Your next repository report starts here
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
                    Paste a public GitHub repository URL above to generate
                    your first RepoReady analysis.
                  </p>
                </div>
              </section>
            )}

            {/* Footer */}
            <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-white/[0.07] pt-6 text-xs text-slate-600 sm:flex-row">
              <p>RepoReady · Helping developers build contributor-friendly projects.</p>
              <p>Scores are heuristic estimates, not official GitHub ratings.</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}