import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { SettingsPanel } from "./components/SettingsPanel";
import { PromptBar, type PrimaryAction } from "./components/PromptBar";
import { PosterCanvas, type FocusInfo } from "./components/PosterCanvas";
import { HistoryList } from "./components/HistoryList";
import { CodeEditor } from "./components/CodeEditor";
import { StylesPane } from "./components/StylesPane";
import { BackgroundsPane } from "./components/BackgroundsPane";
import { parseBackgroundMeta } from "./backgrounds/parse";
import { getBackground } from "./backgrounds/catalog";
import {
  CloseIcon,
  CodeIcon,
  CompareIcon,
  FullPageIcon,
  ListIcon,
} from "./components/ui/icons";
import type { StyleImportValue } from "./components/StyleImportForm";
import { useProviderConfig } from "./hooks/useProviderConfig";
import { useGeneration } from "./hooks/useGeneration";
import { useFontEmbedding } from "./hooks/useFontEmbedding";
import { useHistory, type HistoryBatch, type HistoryItem } from "./hooks/useHistory";
import { useAssets, type StoredAsset } from "./hooks/useAssets";
import { useStyles } from "./hooks/useStyles";
import { exportPng, downloadHtml } from "./export/poster";
import { sanitizeHTML } from "./utils/sanitize";
import { resolveAssets } from "./utils/assets";
import { STYLES } from "./styles/index";
import type { Style } from "./styles/types";
import type { AspectRatioKey } from "./utils/constants";

export default function App() {
  const { config, updateConfig, validate } = useProviderConfig();
  const {
    generate,
    retry,
    stop,
    enhancePrompt,
    jobs,
    loadingCount,
    maxConcurrent,
    error,
    setActiveVariant,
    setJobHtml,
    markRecorded,
    loadVariant,
  } = useGeneration(config);
  const [enhancing, setEnhancing] = useState(false);
  const { fontEmbedCSS } = useFontEmbedding();
  const {
    batches,
    addBatch,
    removeBatch,
    updateItem,
    clear: clearHistory,
  } = useHistory();
  const { addAsset, map: assetMap } = useAssets();
  const { customStyles, addStyle, updateStyle, removeStyle } = useStyles();

  const [selectedPreset, setSelectedPreset] = useState<Style>(STYLES[0]!);
  const [stylesPaneOpen, setStylesPaneOpen] = useState(false);
  const [backgroundsPaneOpen, setBackgroundsPaneOpen] = useState(false);
  // Global pause for all background layers — stops animations and prevents crashing
  // backgrounds from consuming resources. Controlled by the pause button in BackgroundsPane.
  const [bgPaused, setBgPaused] = useState(false);

  const allStyles = useMemo(() => [...STYLES, ...customStyles], [customStyles]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>("1:1");
  const [userPrompt, setUserPrompt] = useState("");
  const [count, setCount] = useState(1);
  const [pendingRefs, setPendingRefs] = useState<string[]>([]);
  const [pendingAssets, setPendingAssets] = useState<StoredAsset[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorWidth, setEditorWidth] = useState(460);
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [view, setView] = useState<"full" | "list">("full");
  const [compare, setCompare] = useState(false);
  const [focus, setFocus] = useState<FocusInfo>({ kind: "new" });

  // Drag-to-resize the editor pane.
  const rowRef = useRef<HTMLDivElement>(null);
  const startResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const onMove = (ev: PointerEvent) => {
      const rect = rowRef.current?.getBoundingClientRect();
      if (!rect) return;
      const w = rect.right - ev.clientX;
      setEditorWidth(Math.max(320, Math.min(rect.width - 360, w)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  // Iterate the design the user is focused on; fresh when on the "New" slide.
  const iterating = focus.kind === "design";

  const handleGenerate = useCallback(() => {
    const baseHtml = focus.kind === "design" ? focus.html : undefined;
    generate(selectedPreset, aspectRatio, userPrompt, {
      count,
      referenceImages: pendingRefs,
      assets: pendingAssets,
      baseHtml,
    });
  }, [
    generate,
    selectedPreset,
    aspectRatio,
    userPrompt,
    count,
    pendingRefs,
    pendingAssets,
    focus,
  ]);

  const handleAttachReference = useCallback(
    (dataUrl: string) => setPendingRefs((r) => [...r, dataUrl]),
    [],
  );
  const handleAttachAsset = useCallback(
    (dataUrl: string, name: string) => {
      const asset = addAsset(name, dataUrl); // persist so its token resolves
      setPendingAssets((a) => [...a, asset]);
    },
    [addAsset],
  );

  // Record each finished job into history once (so it persists after the
  // job slide is gone). Jobs opened from history already carry a
  // recordedBatchId and are skipped; all-error jobs are skipped (they stay
  // as their own slide but have nothing to persist).
  useEffect(() => {
    for (const job of jobs) {
      if (job.loading || job.recordedBatchId) continue;
      const items: HistoryItem[] = job.variants
        .filter((v) => v.status === "done" && v.html)
        .map((v) => ({ html: v.html }));
      if (items.length === 0) continue;
      const id = addBatch({
        items,
        aspectRatio: job.aspectRatio,
        prompt: job.prompt,
        presetId: job.presetId,
      });
      if (id) markRecorded(job.id, id);
    }
  }, [jobs, addBatch, markRecorded]);

  const handleUseHistory = useCallback(
    (batch: HistoryBatch, html: string) => {
      setAspectRatio(batch.aspectRatio);
      setView("full");
      // excludeBatchId suppresses this batch in the history list so it isn't
      // double-shown alongside the job slide.
      loadVariant(html, html, batch.id, batch.aspectRatio);
    },
    [loadVariant],
  );

  const handleOpenFromList = useCallback(
    (batch: HistoryBatch, item: HistoryItem) => handleUseHistory(batch, item.html),
    [handleUseHistory],
  );

  const handleImportHtml = useCallback(
    (html: string) => {
      const clean = sanitizeHTML(html);
      setView("full");
      // No excludeBatchId: the recording effect above will persist this as a
      // new history batch.
      loadVariant(clean, clean, undefined, aspectRatio);
    },
    [loadVariant, aspectRatio],
  );

  const handleExport = useCallback(
    async (html: string, ar: AspectRatioKey) => {
      setExporting(true);
      try {
        await exportPng(resolveAssets(html, assetMap), ar, fontEmbedCSS);
      } catch (err) {
        console.error("Export failed:", err);
      } finally {
        setExporting(false);
      }
    },
    [fontEmbedCSS, assetMap],
  );

  const handleDownload = useCallback(
    (html: string, ar: AspectRatioKey) =>
      downloadHtml(resolveAssets(html, assetMap), ar),
    [assetMap],
  );

  // Batches already represented as a job slide (recorded or the imported/
  // from-history working job) are excluded from the history rail so they
  // aren't shown twice.
  const excludeBatchIds = new Set(
    jobs
      .map((j) => j.recordedBatchId)
      .filter((id): id is string => Boolean(id)),
  );

  const canGenerate = Boolean(config.apiKey && userPrompt.trim());

  // The job + variant the user is currently focused on (if any).
  const focusedJob = (() => {
    if (focus.kind !== "design") return null;
    const ref = focus.ref;
    if (ref.kind !== "job") return null;
    return jobs.find((j) => j.id === ref.jobId) ?? null;
  })();
  const focusedVariant = focusedJob?.variants[focusedJob.activeIndex] ?? null;
  const canCompare = focusedJob ? focusedJob.variants.length > 1 : false;

  // Contextual primary button, driven by the focused slide:
  //   New slide            -> Generate
  //   streaming job        -> Stop (that job)
  //   error job (no html)  -> Retry (that job)
  //   done design (job/history) -> Iterate (new parallel job on that html)
  const capReached = loadingCount >= maxConcurrent;
  const primaryAction: PrimaryAction = focusedJob
    ? focusedJob.loading
      ? { kind: "stop" }
      : focusedVariant?.status === "error" && !focusedVariant.html
        ? { kind: "retry" }
        : focusedVariant?.html
          ? { kind: "iterate", disabled: !canGenerate || capReached }
          : { kind: "generate", disabled: !canGenerate || capReached }
    : focus.kind === "design"
      ? { kind: "iterate", disabled: !canGenerate || capReached }
      : { kind: "generate", disabled: !canGenerate || capReached };

  const handlePrimaryAction = useCallback(() => {
    if (primaryAction.kind === "stop" && focusedJob) stop(focusedJob.id);
    else if (primaryAction.kind === "retry" && focusedJob) retry(focusedJob.id);
    else if (primaryAction.kind === "generate" || primaryAction.kind === "iterate")
      handleGenerate();
  }, [primaryAction, focusedJob, stop, retry, handleGenerate]);

  // The editor edits whichever design is currently focused (the slide you've
  // scrolled to), so the code follows the canvas.
  const focusedDesign = focus.kind === "design" ? focus : null;

  // Get current background info for the PromptBar button
  const currentBackgroundInfo = (() => {
    if (!focusedDesign) return null;
    const spec = parseBackgroundMeta(focusedDesign.html);
    if (!spec) return null;
    const def = getBackground(spec.id);
    return def ? { id: spec.id, name: def.name } : null;
  })();
  const editorValue = (() => {
    if (!focusedDesign) return "";
    const ref = focusedDesign.ref;
    if (ref.kind === "job") {
      const job = jobs.find((j) => j.id === ref.jobId);
      return job?.variants[job.activeIndex]?.rawHtml ?? focusedDesign.html;
    }
    return (
      batches.find((b) => b.id === ref.batchId)?.items[ref.index]?.html ??
      focusedDesign.html
    );
  })();

  const handleEditorChange = useCallback(
    (v: string) => {
      if (focus.kind !== "design") return;
      const ref = focus.ref;
      if (ref.kind === "job") setJobHtml(ref.jobId, v);
      else updateItem(ref.batchId, ref.index, v);
    },
    [focus, setJobHtml, updateItem],
  );

  const openEditor = () => {
    setEditorOpen((o) => !o);
    setShowSettings(false);
    setStylesPaneOpen(false);
  };
  const toggleSettings = () => {
    setShowSettings((s) => !s);
    setEditorOpen(false);
    setStylesPaneOpen(false);
  };
  const openStylesPane = () => {
    setStylesPaneOpen((o) => !o);
    setEditorOpen(false);
    setShowSettings(false);
    setBackgroundsPaneOpen(false);
  };

  const openBackgroundsPane = () => {
    setBackgroundsPaneOpen((o) => !o);
    setEditorOpen(false);
    setShowSettings(false);
    setStylesPaneOpen(false);
  };

  // Stable handlers for the Backgrounds panel. Without these, the panel (and
  // its live WebGL preview) would re-render on every streamed token while a
  // generation runs, causing the backgrounds to flicker/restart.
  const closeBackgroundsPane = useCallback(
    () => setBackgroundsPaneOpen(false),
    [],
  );
  const toggleBgPause = useCallback(() => setBgPaused((p) => !p), []);
  const handleBackgroundUpdateHtml = useCallback(
    (newHtml: string) => {
      if (focus.kind !== "design") return;
      const ref = focus.ref;
      if (ref.kind === "job") setJobHtml(ref.jobId, newHtml);
      else updateItem(ref.batchId, ref.index, newHtml);
    },
    [focus, setJobHtml, updateItem],
  );

  // Stable handlers for the Styles panel — keep the memoized StylesPane from
  // re-rendering (and remounting its preview iframes) on prompt typing /
  // generation, which otherwise made the style list flicker.
  const closeStylesPane = useCallback(() => setStylesPaneOpen(false), []);
  const handleSelectStyle = useCallback((s: Style) => {
    setSelectedPreset(s);
    setStylesPaneOpen(false);
  }, []);
  const handleSaveStyle = useCallback(
    (v: StyleImportValue) =>
      addStyle({
        name: v.name,
        description: v.summary || "Imported custom style",
        summary: v.summary || undefined,
        designMd: v.designMd,
        origin: v.origin,
      }),
    [addStyle],
  );
  const handleUpdateStyle = useCallback(
    (id: string, v: StyleImportValue) =>
      updateStyle(id, {
        name: v.name,
        description: v.summary || "Imported custom style",
        summary: v.summary || undefined,
        designMd: v.designMd,
        origin: v.origin,
      }),
    [updateStyle],
  );

  // One toolbar-button treatment, shared by every top-bar control.
  const toolBtn = (active: boolean) =>
    `flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile ${
      active
        ? "border-accent bg-accent/15 text-text shadow-[0_0_12px_rgba(107,87,238,0.15)]"
        : "border-border bg-surface-2 text-text-muted hover:border-border-strong hover:text-text hover:bg-surface-3"
    }`;
  // Segmented control inside the view switcher.
  const segBtn = (sel: boolean) =>
    `flex h-7 items-center gap-1.5 rounded-sm px-2.5 text-sm font-medium transition-all duration-150 btn-tactile ${
      sel ? "bg-surface-3 text-text shadow-sm" : "text-text-muted hover:text-text"
    }`;

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text">
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
          {/* Brand wordmark */}
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Divsigner" width="28" height="28" className="h-7 w-7 rounded-md" />

            <span className="font-display text-[15px] font-bold tracking-tight text-text">
              Div<span className="text-accent-soft">signer</span>
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="ml-3 flex min-w-0 items-center gap-2 rounded-md border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs text-danger animate-[fadeIn_200ms_ease]"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger animate-pulse" />
              <span className="truncate">{error}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {canCompare && (
              <button
                onClick={() => setCompare((c) => !c)}
                title="Compare variants side by side"
                className={toolBtn(compare)}
              >
                <CompareIcon />
                Compare
              </button>
            )}

            <div className="flex rounded-md border border-border bg-surface-2 p-0.5">
              <button onClick={() => setView("full")} className={segBtn(view === "full")} title="Full page">
                <FullPageIcon size={14} />
                Full
              </button>
              <button onClick={() => setView("list")} className={segBtn(view === "list")} title="List view">
                <ListIcon size={14} />
                List
              </button>
            </div>

            <button onClick={openEditor} title="Edit the HTML manually" className={toolBtn(editorOpen)}>
              <CodeIcon />
              Edit code
            </button>
          </div>
        </header>

        <div ref={rowRef} className="flex min-h-0 flex-1">
          <div className="min-h-0 min-w-0 flex-1">
            {view === "list" ? (
              <HistoryList
                batches={batches}
                fontEmbedCSS={fontEmbedCSS}
                assets={assetMap}
                onOpen={handleOpenFromList}
                onDelete={removeBatch}
                onClear={clearHistory}
              />
            ) : (
              <PosterCanvas
                jobs={jobs}
                batches={batches}
                excludeBatchIds={excludeBatchIds}
                newSlideAspect={aspectRatio}
                exporting={exporting}
                onExport={handleExport}
                onDownload={handleDownload}
                fontEmbedCSS={fontEmbedCSS}
                assets={assetMap}
                compare={compare}
                onFocusChange={setFocus}
                onSelectVariant={setActiveVariant}
                bgPaused={bgPaused}
              />
            )}
          </div>

          {editorOpen && (
            <>
              <div
                onPointerDown={startResize}
                className="w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-accent"
              />
              <div
                style={{ width: editorWidth, boxShadow: "var(--shadow-pane)" }}
                className="flex min-h-0 shrink-0 flex-col bg-surface animate-[slideInRight_200ms_cubic-bezier(0.16,1,0.3,1)]"
              >
                <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
                  <span className="section-label">Code</span>
                  <button
                    onClick={() => setEditorOpen(false)}
                    aria-label="Close editor"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all duration-150 hover:bg-surface-2 hover:text-text btn-tactile"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  {focusedDesign ? (
                    <CodeEditor value={editorValue} onChange={handleEditorChange} />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-text-faint animate-[fadeIn_300ms_ease]">
                      Scroll to a design to edit its code, or generate/import
                      one.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {showSettings && (
            <div className="panel-enter flex shrink-0">
              <SettingsPanel
                providerId={config.providerId}
                apiKey={config.apiKey}
                model={config.model}
                enhanceModel={config.enhanceModel}
                customBaseUrl={config.customBaseUrl}
                onUpdate={updateConfig}
                onValidate={validate}
                onClose={() => setShowSettings(false)}
              />
            </div>
          )}

          {stylesPaneOpen && (
            <div className="panel-enter flex shrink-0">
              <StylesPane
                styles={allStyles}
                selectedId={selectedPreset.id}
                fontEmbedCSS={fontEmbedCSS}
                config={config}
                onSelect={handleSelectStyle}
                onSaveStyle={handleSaveStyle}
                onUpdateStyle={handleUpdateStyle}
                onDeleteCustom={removeStyle}
                onClose={closeStylesPane}
              />
            </div>
          )}

          {backgroundsPaneOpen && focusedDesign && (
            <div className="panel-enter flex shrink-0">
              <BackgroundsPane
                html={focusedDesign.html}
                onUpdateHtml={handleBackgroundUpdateHtml}
                onClose={closeBackgroundsPane}
                paused={bgPaused}
                onTogglePause={toggleBgPause}
              />
            </div>
          )}
        </div>

        <PromptBar
          value={userPrompt}
          onChange={setUserPrompt}
          selectedStyle={selectedPreset}
          onBrowseStyles={openStylesPane}
          selectedBackground={currentBackgroundInfo}
          onBrowseBackgrounds={focusedDesign ? openBackgroundsPane : undefined}
          aspectRatio={aspectRatio}
          onAspectChange={setAspectRatio}
          count={count}
          onCountChange={setCount}
          references={pendingRefs}
          assets={pendingAssets}
          onAttachReference={handleAttachReference}
          onAttachAsset={handleAttachAsset}
          onRemoveReference={(i) =>
            setPendingRefs((r) => r.filter((_, idx) => idx !== i))
          }
          onRemoveAsset={(id) =>
            setPendingAssets((a) => a.filter((x) => x.id !== id))
          }
          onImportHtml={handleImportHtml}
          onToggleSettings={toggleSettings}
          onEnhancePrompt={async () => {
            if (!userPrompt.trim() || !config.apiKey) return;
            setEnhancing(true);
            try {
              const enhanced = await enhancePrompt(userPrompt);
              setUserPrompt(enhanced);
            } catch (err) {
              console.error("Enhancement failed:", err);
            } finally {
              setEnhancing(false);
            }
          }}
          enhancing={enhancing}
          primaryAction={primaryAction}
          onPrimaryAction={handlePrimaryAction}
          canEnhance={Boolean(config.apiKey && userPrompt.trim())}
          mode={iterating && focusedVariant?.html ? "iterate" : "new"}
        />

      </main>
    </div>
  );
}
