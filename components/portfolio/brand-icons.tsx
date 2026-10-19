import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

/** Apple logo (monochrome, inherits currentColor). */
export function AppleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.365 1.43c0 1.14-.47 2.26-1.22 3.08-.8.88-2.1 1.56-3.17 1.47-.14-1.1.4-2.26 1.15-3.04.84-.9 2.26-1.56 3.24-1.51zM20.5 17.33c-.56 1.3-.83 1.88-1.56 3.03-1.01 1.6-2.44 3.6-4.21 3.61-1.57.02-1.98-1.03-4.11-1.02-2.13.01-2.58 1.04-4.16 1.03-1.77-.02-3.12-1.82-4.13-3.42C-.5 16.07-.79 10.8 1.36 7.99c1.53-2 3.94-3.17 6.2-3.17 2.3 0 3.75 1.27 5.65 1.27 1.85 0 2.97-1.27 5.64-1.27 2.01 0 4.14 1.1 5.66 2.99-4.98 2.73-4.17 9.85-3.99 9.52h-.02z" />
    </svg>
  );
}

/** App Store app icon: blue rounded square with the white "A" mark (full colour). */
export function AppStoreIcon(props: IconProps) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={id} x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1FA5FF" />
          <stop offset="1" stopColor="#0A6CF1" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="5.4" fill={`url(#${id})`} />
      <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.95 6.7 8.55 14.3" />
        <path d="M11.05 6.7 16.9 16.8" />
        <path d="M5.9 14.3h12.2" />
        <path d="M7.75 16.7 7.1 17.8" />
      </g>
    </svg>
  );
}

/** Google Play logo (full colour). */
export function GooglePlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#00A0FF"
        d="M3.61 1.81 13.79 12 3.61 22.19a1.9 1.9 0 0 1-.61-1.4V3.21c0-.55.23-1.05.61-1.4z"
      />
      <path fill="#FF3A44" d="M15.17 13.38l2.9 2.9-11.56 6.57c-.5.28-1.08.33-1.6.17l10.26-9.64z" />
      <path fill="#32A071" d="M15.17 10.62 4.91.98c.52-.16 1.1-.11 1.6.17l11.56 6.57-2.9 2.9z" />
      <path
        fill="#FFD400"
        d="M19.33 9.17l2.38 1.35c1.72.98 1.72 3.08 0 4.06l-2.38 1.35L16.55 12l2.78-2.83z"
      />
    </svg>
  );
}

/** GitHub mark (monochrome). */
export function GitHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.1c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}
