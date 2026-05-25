// src/pages/admin/AdminContenu.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@heroui/react';
import { DashPageHeader } from '../../components/dashboard/primitives';
import AdminInfosBar from './AdminInfosBar';
import AdminCarousel from './AdminCarousel';
import AdminSplitGammes from './AdminSplitGammes';

const TABS = [
  { id: 'infos-bar', label: 'Infos bar' },
  { id: 'carrousel', label: 'Carrousel' },
  { id: 'moments', label: 'Moments' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const AdminContenu = () => {
  useEffect(() => { document.title = 'Contenu — Admin PessÓra'; }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: TabId =
    (TABS.find((t) => t.id === searchParams.get('tab'))?.id as TabId) ?? 'infos-bar';

  return (
    <div>
      <DashPageHeader
        breadcrumb="Administration"
        title="Contenu"
        subtitle="Infos bar, carrousel éditorial et sections moments"
      />
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setSearchParams({ tab: key as TabId })}
        aria-label="Sections contenu"
        className="px-5 md:px-8"
      >
        <Tabs.List>
          {TABS.map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel id="infos-bar">
          <AdminInfosBar />
        </Tabs.Panel>
        <Tabs.Panel id="carrousel">
          <AdminCarousel />
        </Tabs.Panel>
        <Tabs.Panel id="moments">
          <AdminSplitGammes />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default AdminContenu;
