// src/pages/admin/AdminProduitsGammes.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@heroui/react';
import { DashPageHeader } from '../../components/dashboard/primitives';
import AdminProduits from './AdminProduits';
import AdminGammes from './AdminGammes';

const TABS = [
  { id: 'produits', label: 'Produits' },
  { id: 'gammes', label: 'Gammes' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const AdminProduitsGammes = () => {
  useEffect(() => { document.title = 'Produits & Gammes — Admin PessÓra'; }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: TabId =
    (TABS.find((t) => t.id === searchParams.get('tab'))?.id as TabId) ?? 'produits';

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Produits & Gammes"
        subtitle="Catalogue du bar et produits Sport / Skin / Wellness"
      />
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setSearchParams({ tab: key as TabId })}
        aria-label="Sections produits et gammes"
        className="px-5 md:px-8"
      >
        <Tabs.List>
          {TABS.map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel id="produits">
          <AdminProduits />
        </Tabs.Panel>
        <Tabs.Panel id="gammes">
          <AdminGammes />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default AdminProduitsGammes;
