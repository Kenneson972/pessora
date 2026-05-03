import type { ReactNode } from 'react';

/** Aligné sur le header : même gouttière horizontale sur toutes les pages. */
export const PAGE_GUTTER = 'px-4 md:px-10 lg:px-[72px]';

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className = '' }: PageShellProps) {
  return <div className={`${PAGE_GUTTER} ${className}`.trim()}>{children}</div>;
}
