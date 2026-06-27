import { useState, useEffect, useCallback } from "react";
import { PaneHeader } from "./panes/PaneHeader";
import type { ProviderId, ProviderConfig } from "../providers/types";
import { PROVIDERS } from "../providers/config";
import type { ValidationResult } from "../providers/validation";
import { useModelList } from "../hooks/useModelList";

interface SettingsPanelProps {
  providerId: ProviderId;
  apiKey: string;
  model: string;
  enhanceModel?: string;
  customBaseUrl?: string;
  onUpdate: (partial: {
    providerId?: ProviderId;
    apiKey?: string;
    model?: string;
    enhanceModel?: string;
    customBaseUrl?: string;
  }) => void;
  onValidate: () => Promise<ValidationResult>;
  onClose: () => void;
}

const fieldClass =
  "w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:border-accent focus-glow transition-all duration-150";

const labelClass = "block text-sm font-bold text-text mb-2";

export function SettingsPanel({
  providerId,
  apiKey,
  model,
  enhanceModel,
  customBaseUrl,
  onUpdate,
  onValidate,
  onClose,
}: SettingsPanelProps) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const { models: availableModels, loading: loadingModels, supportsEndpoint } = useModelList({
    providerId,
    apiKey,
    customBaseUrl,
  } as ProviderConfig);
  const [manualModel, setManualModel] = useState(model);
  const [manualEnhanceModel, setManualEnhanceModel] = useState(enhanceModel || "");

  const def = PROVIDERS[providerId];

  useEffect(() => setManualModel(model), [model]);
  useEffect(() => setManualEnhanceModel(enhanceModel || ""), [enhanceModel]);

  const handleValidate = useCallback(async () => {
    setSaving(true);
    const res = await onValidate();
    setResult(res);
    setSaving(false);
  }, [onValidate]);

  const handleSaveAndClose = useCallback(() => {
    onUpdate({ model: manualModel, enhanceModel: manualEnhanceModel });
    onClose();
  }, [manualModel, manualEnhanceModel, onUpdate, onClose]);

  const statusColor = result
    ? result.valid
      ? "text-success"
      : "text-danger"
    : "text-text-faint";

  return (
    <aside className="flex w-full h-full flex-col" style={{ background: "var(--glass-3)", backdropFilter: "var(--blur-lg)", WebkitBackdropFilter: "var(--blur-lg)" }}>
      <PaneHeader title="Settings" onClose={onClose} />

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-6 space-y-5">
        <div>
          <label className={labelClass}>Provider</label>
          <select
            value={providerId}
            onChange={(e) => {
              onUpdate({ providerId: e.target.value as ProviderId });
              setResult(null);
            }}
            className={fieldClass}
          >
            {Object.values(PROVIDERS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {providerId === "custom" && (
          <div>
            <label className={labelClass}>Base URL</label>
            <input
              type="url"
              value={customBaseUrl ?? ""}
              onChange={(e) => onUpdate({ customBaseUrl: e.target.value })}
              placeholder="https://your-llm.example.com/v1"
              className={fieldClass}
            />
          </div>
        )}

        <div>
          <label className={labelClass}>API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              onUpdate({ apiKey: e.target.value });
              setResult(null);
            }}
            placeholder={def.keyPlaceholder}
            className={`${fieldClass} font-mono`}
          />
        </div>

        {result && (
          <p className={`text-xs ${statusColor} break-words animate-[fadeIn_200ms_ease]`}>
            {result.valid
              ? result.skipped
                ? "Saved. Key assumed valid (no /models endpoint)."
                : `Saved · ${availableModels.length} models available.`
              : `Invalid key: ${result.error}`}
          </p>
        )}

        {/* Models are shown whenever we have a key + a /models endpoint,
            not only after an explicit Save. */}
        {apiKey && supportsEndpoint && (
          <>
            <div>
              <label className={labelClass}>
                Generation model
                {loadingModels && (
                  <span className="ml-2 text-xs font-normal text-text-muted">
                    Loading models…
                  </span>
                )}
              </label>
              {availableModels.length > 0 ? (
                <select
                  value={model}
                  onChange={(e) => onUpdate({ model: e.target.value })}
                  className={fieldClass}
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={manualModel}
                  onChange={(e) => setManualModel(e.target.value)}
                  onBlur={() => onUpdate({ model: manualModel })}
                  placeholder={def.defaultModel || "model-name"}
                  className={`${fieldClass} font-mono`}
                />
              )}
            </div>

            <div>
              <label className={labelClass}>Enhancement model</label>
              <p className="text-xs text-text-muted mb-2">
                Used for the "Enhance prompt" feature. Falls back to generation model if empty.
              </p>
              {availableModels.length > 0 ? (
                <select
                  value={enhanceModel || ""}
                  onChange={(e) => onUpdate({ enhanceModel: e.target.value || undefined })}
                  className={fieldClass}
                >
                  <option value="">Same as generation model</option>
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={manualEnhanceModel}
                  onChange={(e) => setManualEnhanceModel(e.target.value)}
                  onBlur={() => onUpdate({ enhanceModel: manualEnhanceModel || undefined })}
                  placeholder={def.defaultModel || "model-name"}
                  className={`${fieldClass} font-mono`}
                />
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex shrink-0 gap-3 border-t border-border px-4 py-4">
        <button
          onClick={handleValidate}
          disabled={!apiKey || saving}
          className="rounded-md bg-surface-2 border border-border hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 text-sm font-bold text-text transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile"
        >
          {saving ? "Validating…" : "Validate"}
        </button>
        <button
          onClick={handleSaveAndClose}
          disabled={!apiKey}
          className="flex-1 rounded-md bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 text-sm font-bold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile"
        >
          Save & close
        </button>
      </div>
    </aside>
  );
}
