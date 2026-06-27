import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { SettingsPanel } from "./components/SettingsPanel";
import { PromptBar, type PrimaryAction } from "./components/PromptBar";
import { TopNav } from "./components/TopNav";
import { RightPane, SectionIcons, type Section } from "./components/RightPane";
import { PropertiesPane } from "./components/panes/PropertiesPane";
import { AssetsPane } from "./components/panes/AssetsPane";
import { InfoPane } from "./components/panes/InfoPane";
import { PaneHeader } from "./components/panes/PaneHeader";
import { PosterCanvas, type FocusInfo, type PosterCanvasHandle } from "./components/PosterCanvas";
import { HistoryList } from "./components/HistoryList";
import { CodeEditor } from "./components/CodeEditor";
import { StylesPane } from "./components/StylesPane";
import { BackgroundsPane } from "./components/BackgroundsPane";
import { parseBackgroundMeta, injectBackgroundMeta } from "./backgrounds/parse";
import { getBackground } from "./backgrounds/catalog";
import { DEFAULT_GLOBAL_PARAMS } from "./backgrounds/types";
import type { StyleImportValue } from "./components/StyleImportForm";
import { useProviderConfig } from "./hooks/useProviderConfig";
import { useModelList } from "./hooks/useModelList";
import { useGeneration } from "./hooks/useGeneration";
import { useFontEmbedding } from "./hooks/useFontEmbedding";
import { useHistory, type HistoryBatch, type HistoryItem } from "./hooks/useHistory";
import { useAssets, type StoredAsset } from "./hooks/useAssets";
import { useStyles } from "./hooks/useStyles";
import { exportPng, downloadHtml } from "./export/poster";
import { sanitizeHTML } from "./utils/sanitize";
import { resolveAssets } from "./utils/assets";
import { readBgColor, writeBgColor } from "./utils/bgColor";
import { STYLES } from "./styles/index";
import type { Style } from "./styles/types";
import type { AspectRatioKey } from "./utils/constants";

function RedDot() {
  return (
    <span
      style={{
        position: "absolute",
        top: 4,
        right: 4,
        width: 7,
        height: 7,
        borderRadius: "999px",
        background: "var(--danger)",
        boxShadow: "0 0 0 2px var(--glass-1), 0 0 6px rgba(242,62,99,0.7)",
      }}
    />
  );
}

export default function App() {
  const { config, updateConfig, validate } = useProviderConfig();
  const { models: modelOptions, loading: modelLoading } = useModelList(config);
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
  // Global pause for all background layers — stops animations and prevents crashing
  // backgrounds from consuming resources. Controlled by the pause button in BackgroundsPane.
  const [bgPaused, setBgPaused] = useState(false);

  const allStyles = useMemo(() => [...STYLES, ...customStyles], [customStyles]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>("1:1");
  const [userPrompt, setUserPrompt] = useState("");
  const [count, setCount] = useState(1);
  const [pendingRefs, setPendingRefs] = useState<string[]>([]);
  const [pendingAssets, setPendingAssets] = useState<StoredAsset[]>([]);
  const [exporting, setExporting] = useState(false);
  const [view, setView] = useState<"full" | "list">("full");
  const [compare, setCompare] = useState(false);
  const [focus, setFocus] = useState<FocusInfo>({ kind: "new" });

  // Imperative handle into PosterCanvas — used by the nav "New" button to
  // scroll the slide deck back to the "New design" slide.
  const posterCanvasRef = useRef<PosterCanvasHandle>(null);

  // Right pane state machine (Photoshop-style collapsible inspector).
  const [paneExpanded, setPaneExpanded] = useState(false);
  const [openSection, setOpenSection] = useState<Section | null>(null);

  // Hidden HTML file input — Import lives in the nav now (lifted out of
  // PromptBar so the tree stays green between commits).
  const htmlRef = useRef<HTMLInputElement>(null);
  // Hidden asset file input — triggered from Assets pane.
  const assetRef = useRef<HTMLInputElement>(null);

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

  // Assets pane: hidden file input → handleAttachAsset.
  const handleAssetFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        handleAttachAsset(reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [handleAttachAsset],
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

  // Nav Import: open the hidden HTML file picker; on file, run the existing
  // import flow.
  const handleHtmlFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => handleImportHtml(reader.result as string);
      reader.readAsText(file);
      e.target.value = "";
    },
    [handleImportHtml],
  );

  // Nav actions.
  const handleNew = useCallback(() => {
    setFocus({ kind: "new" });
    setView("full");
    // If the canvas is already mounted, scroll it to the New slide now.
    // If we just switched out of the History list, PosterCanvas remounts and
    // its own mount effect centers on the New slide, so the no-op is fine.
    posterCanvasRef.current?.scrollToNew();
  }, []);
  const handleHistory = useCallback(
    () => setView((v) => (v === "list" ? "full" : "list")),
    [],
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

  // Info pane: prompt/preferences + live model thinking/output for the
  // focused job/variant. Updates live as tokens stream.
  const info = focusedJob && focusedVariant ? {
    prompt: focusedJob.prompt,
    styleName: allStyles.find((s) => s.id === focusedJob.presetId)?.name ?? focusedJob.presetId,
    aspectRatio: focusedJob.aspectRatio,
    count: focusedJob.variants.length,
    thinking: focusedVariant.thinking,
    output: focusedVariant.rawHtml,
  } : null;

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

  // Background color for the Properties pane. When a background layer is
  // applied the poster body is made transparent, so the visible bg color is
  // the layer's `backgroundColor` — that's the single source of truth we
  // surface here. Otherwise it's the poster body's own background.
  const focusedBg = (() => {
    if (!focusedDesign) return null;
    const spec = parseBackgroundMeta(focusedDesign.html);
    if (spec) {
      const layerColor =
        (spec.params.backgroundColor as string | undefined) ??
        DEFAULT_GLOBAL_PARAMS.backgroundColor;
      const hex = layerColor.replace(/^#/, "").toUpperCase();
      return { hex, opacity: 100, isLayer: true };
    }
    return { ...readBgColor(focusedDesign.html), isLayer: false };
  })();
  const handleBgChange = useCallback(
    (hex: string, opacity: number) => {
      if (focus.kind !== "design") return;
      const ref = focus.ref;
      const writeBack = (newHtml: string) => {
        if (ref.kind === "job") setJobHtml(ref.jobId, newHtml);
        else updateItem(ref.batchId, ref.index, newHtml);
      };
      const spec = parseBackgroundMeta(focus.html);
      if (spec) {
        // Layer applied: update the layer's backgroundColor in the meta.
        const newSpec = {
          ...spec,
          params: { ...spec.params, backgroundColor: `#${hex}` },
        };
        writeBack(injectBackgroundMeta(focus.html, newSpec));
      } else {
        writeBack(writeBgColor(focus.html, hex, opacity));
      }
    },
    [focus, setJobHtml, updateItem],
  );

  // Nav export handlers (use the focused design).
  const handleExportPng = useCallback(() => {
    if (!focusedDesign) return;
    handleExport(focusedDesign.html, focusedDesign.aspectRatio);
  }, [focusedDesign, handleExport]);
  const handleExportHtmlNav = useCallback(() => {
    if (!focusedDesign) return;
    handleDownload(focusedDesign.html, focusedDesign.aspectRatio);
  }, [focusedDesign, handleDownload]);

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

  const openStylesPane = () => setOpenSection((s) => (s === "styles" ? null : "styles"));
  const openBackgroundsPane = () => setOpenSection((s) => (s === "bg" ? null : "bg"));
  const closePane = useCallback(() => setOpenSection(null), []);

  // Stable handlers for the Backgrounds panel. Without these, the panel (and
  // its live WebGL preview) would re-render on every streamed token while a
  // generation runs, causing the backgrounds to flicker/restart.
  const closeBackgroundsPane = useCallback(() => setOpenSection(null), []);
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
  const closeStylesPane = useCallback(() => setOpenSection(null), []);
  const handleSelectStyle = useCallback((s: Style) => {
    setSelectedPreset(s);
    setOpenSection(null);
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

  return (
    <div className="ds-canvas flex h-screen overflow-hidden text-text">
      <main className="flex min-w-0 flex-1 flex-col">
        <TopNav
          onNew={handleNew}
          onImport={() => htmlRef.current?.click()}
          onHistory={handleHistory}
          historyActive={view === "list"}
          onExportPng={handleExportPng}
          onExportHtml={handleExportHtmlNav}
          canExport={Boolean(focusedDesign)}
          exporting={exporting}
          error={error}
        />
        <input
          ref={htmlRef}
          type="file"
          accept=".html,.htm,text/html"
          onChange={handleHtmlFile}
          className="hidden"
        />
        <input
          ref={assetRef}
          type="file"
          accept="image/*"
          onChange={handleAssetFile}
          className="hidden"
        />

        <div className="relative flex min-h-0 flex-1">
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
                ref={posterCanvasRef}
                jobs={jobs}
                batches={batches}
                excludeBatchIds={excludeBatchIds}
                newSlideAspect={aspectRatio}
                fontEmbedCSS={fontEmbedCSS}
                assets={assetMap}
                compare={compare}
                onFocusChange={setFocus}
                onSelectVariant={setActiveVariant}
                bgPaused={bgPaused}
              />
            )}
          </div>

          <RightPane
            expanded={paneExpanded}
            openSection={openSection}
            onToggleExpanded={() => setPaneExpanded((e) => !e)}
            onOpenSection={setOpenSection}
            sections={[
              {
                id: "html",
                label: "Edit HTML",
                icon: SectionIcons.html,
                body: focusedDesign ? (
                  <CodeEditor value={editorValue} onChange={handleEditorChange} onClose={closePane} />
                ) : (
                  <div className="flex h-full flex-col">
                    <PaneHeader title="Edit HTML" onClose={closePane} />
                    <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-sm text-text-faint animate-[fadeIn_300ms_ease]">
                      Scroll to a design to edit its code, or generate/import one.
                    </div>
                  </div>
                ),
              },
              {
                id: "properties",
                label: "Properties",
                icon: SectionIcons.properties,
                body: (
                  <PropertiesPane
                    count={count}
                    onCountChange={setCount}
                    aspectRatio={aspectRatio}
                    onAspectChange={setAspectRatio}
                    bg={focusedBg}
                    onBgChange={handleBgChange}
                    onClose={closePane}
                  />
                ),
              },
              {
                id: "styles",
                label: "Styles",
                icon: SectionIcons.styles,
                body: (
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
                ),
              },
              {
                id: "assets",
                label: "Assets",
                icon: SectionIcons.assets,
                body: (
                  <AssetsPane
                    assets={pendingAssets}
                    onAdd={() => assetRef.current?.click()}
                    onRemove={(id) => setPendingAssets((a) => a.filter((x) => x.id !== id))}
                    onClose={closePane}
                  />
                ),
              },
              {
                id: "bg",
                label: "BG",
                icon: SectionIcons.bg,
                body: focusedDesign ? (
                  <BackgroundsPane
                    html={focusedDesign.html}
                    onUpdateHtml={handleBackgroundUpdateHtml}
                    onClose={closeBackgroundsPane}
                    paused={bgPaused}
                    onTogglePause={toggleBgPause}
                  />
                ) : (
                  <div className="flex h-full flex-col">
                    <PaneHeader title="Backgrounds" onClose={closePane} />
                    <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-sm text-text-faint animate-[fadeIn_300ms_ease]">
                      Focus a design to browse backgrounds.
                    </div>
                  </div>
                ),
              },
              {
                id: "info",
                label: "Info",
                icon: SectionIcons.info,
                body: <InfoPane info={info} onClose={closePane} />,
              },
              {
                id: "settings",
                label: "Settings",
                icon: SectionIcons.settings,
                badge: !config.apiKey ? <RedDot /> : null,
                body: (
                  <SettingsPanel
                    providerId={config.providerId}
                    apiKey={config.apiKey}
                    model={config.model}
                    enhanceModel={config.enhanceModel}
                    customBaseUrl={config.customBaseUrl}
                    onUpdate={updateConfig}
                    onValidate={validate}
                    onClose={closePane}
                  />
                ),
              },
            ]}
          />
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
          showCompare={canCompare}
          compareActive={compare}
          onToggleCompare={() => setCompare((c) => !c)}
          model={config.model}
          onModelChange={(m) => updateConfig({ model: m })}
          modelOptions={modelOptions}
          modelLoading={modelLoading}
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
