import { useState, useEffect, useCallback } from "react";
import { CloseIcon } from "./ui/icons";
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

  const handleSave = useCallback(async () => {
    onUpdate({ model: manualModel, enhanceModel: manualEnhanceModel });
    setSaving(true);
    const res = await onValidate();
    setResult(res);
    setSaving(false);
  }, [manualModel, manualEnhanceModel, onUpdate, onValidate]);

  const statusColor = result
    ? result.valid
      ? "text-success"
      : "text-danger"
    : "text-text-faint";

  return (
    <aside style={{ boxShadow: "var(--shadow-pane)" }} className="scroll-thin w-[320px] shrink-0 h-full border-l border-border bg-surface overflow-y-auto">
      <div className="flex h-14 items-center justify-between border-b border-border px-6">
        <h2 className="font-display text-base font-bold text-text">Settings</h2>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all duration-150 hover:bg-surface-2 hover:text-text btn-tactile"
        >
          <CloseIcon size={18} />
        </button>
      </div>

      <div className="px-6 pt-6 space-y-5">
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

        <button
          onClick={handleSave}
          disabled={!apiKey || saving}
          className="rounded-md bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 text-sm font-bold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile"
        >
          {saving ? "Saving…" : "Save & validate"}
        </button>

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
    </aside>
  );
}
