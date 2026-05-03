import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Segment } from '@heroui-pro/react';
import { getSubNavForPath, type SubNavItem } from '../../data/headerNav';

/** Mapping label de sous-nav → id d'ancre pour la page d'ensemble */
const ANCHOR_MAP: Record<string, string> = {
  Wellness: 'collection-wellness',
  Sport: 'collection-sport',
  Skin: 'collection-skin',
};

function getActiveKey(pathname: string, items: SubNavItem[]): string {
  for (const item of items) {
    if (pathname === item.href) return item.label;
  }
  return items[0]?.label ?? '';
}

export default function HeaderSubNav({ items }: { items: SubNavItem[] }) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeKey = getActiveKey(location.pathname, items);

  const onSelectionChange = useCallback(
    (key: string | number | null) => {
      if (!key) return;
      const item = items.find((i) => i.label === key);
      if (!item) return;

      // Si on est sur la page d'ensemble, scroll vers l'ancre de la section
      if (location.pathname === '/nos-produits' && ANCHOR_MAP[key]) {
        const el = document.getElementById(ANCHOR_MAP[key]);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }

      navigate(item.href);
    },
    [items, location.pathname, navigate],
  );

  return (
    <div className="border-b border-noir/[0.06] bg-white px-4 py-3 md:px-10 lg:px-[72px]">
      <div className="flex justify-center">
        <Segment
          size="sm"
          selectedKey={activeKey}
          onSelectionChange={onSelectionChange}
          aria-label="Navigation secondaire"
        >
          {items.map((item) => (
            <Segment.Item key={item.label} id={item.label}>
              <Segment.Separator />
              {item.label}
            </Segment.Item>
          ))}
        </Segment>
      </div>
    </div>
  );
}

export function HeaderSubNavSmart() {
  const location = useLocation();
  const items = getSubNavForPath(location.pathname);
  if (!items) return null;
  return <HeaderSubNav items={items} />;
}
