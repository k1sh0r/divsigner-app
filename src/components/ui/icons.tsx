import type { SVGProps } from "react";

/**
 * Shared icon set. One visual language across the whole app: 24×24 viewBox,
 * 1.75 stroke, round caps/joins, inherits `currentColor`. Use these instead of
 * inline <svg> or text glyphs (← ✕ + i ✓ ▾) so stroke weight and sizing stay
 * consistent. Size with the `size` prop (defaults to 16).
 */
type IconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & {
  size?: number;
};

function Icon({ size = 16, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);

export const BackIcon = (p: IconProps) => (
  <Icon {...p}><path d="M15 6l-6 6 6 6" /></Icon>
);

export const InfoIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5h.01" /></Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 13l4 4L19 7" /></Icon>
);

export const CopyIcon = (p: IconProps) => (
  <Icon {...p}><rect x="9" y="9" width="11" height="11" rx="1" /><path d="M5 15V5a2 2 0 012-2h10" /></Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" /></Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" />
    <circle cx="15" cy="6" r="2" /><circle cx="7" cy="12" r="2" /><circle cx="12" cy="18" r="2" />
  </Icon>
);

export const CompareIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="4" width="7" height="16" rx="1" /><rect x="14" y="4" width="7" height="16" rx="1" /></Icon>
);

export const CodeIcon = (p: IconProps) => (
  <Icon {...p}><path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13 6l-2 12" /></Icon>
);

export const ImportIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></Icon>
);

export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 4v10m0 0l-4-4m4 4l4-4M5 18h14" /></Icon>
);

export const SparkleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    <path d="M18.5 15.5l.7 2 .8-2 2-.7-2-.8-.8-2-.7 2-2 .8z" />
  </Icon>
);

export const WandIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 2.5l-11 11" />
    <path d="M13 6l7-4-4 7z" />
    <path d="M8 13l-4 7 7-4z" />
  </Icon>
);

export const FullPageIcon = (p: IconProps) => (
  <Icon {...p}><rect x="4" y="4" width="16" height="16" rx="1" /></Icon>
);

export const ListIcon = (p: IconProps) => (
  <Icon {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></Icon>
);

export const PauseIcon = (p: IconProps) => (
  <Icon {...p}><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></Icon>
);

export const PlayIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 4l14 8-14 8V4z" /></Icon>
);
