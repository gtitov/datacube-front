// @ts-nocheck
import { useState, StrictMode } from 'react';
import {
  IconEyeglass,
  IconDeviceDesktopAnalytics,
  IconTopologyStar3,
  // IconAB,
} from '@tabler/icons-react';

import { Viewer } from './Viewer';
import { Hand } from './Hand';
import { Machine } from './Machine';

const avaliableTabs = [
  { icon: IconEyeglass, label: 'Просмотр' },
  { icon: IconDeviceDesktopAnalytics, label: 'Ручная оценка' },
  { icon: IconTopologyStar3, label: 'Машинная оценка' },
  // { icon: IconAB, label: 'Сравнение' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Просмотр');

  return (
    <StrictMode>
      {activeTab === 'Просмотр' &&
        <Viewer avaliableTabs={avaliableTabs} activeTab={activeTab} setActiveTab={setActiveTab} />}
      {activeTab === 'Ручная оценка' &&
        <Hand avaliableTabs={avaliableTabs} activeTab={activeTab} setActiveTab={setActiveTab} />}
      {activeTab === 'Машинная оценка' &&
        <Machine avaliableTabs={avaliableTabs} activeTab={activeTab} setActiveTab={setActiveTab} />}
    </StrictMode>
  );
}
