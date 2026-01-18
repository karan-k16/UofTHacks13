'use client';

import { useState, useCallback } from 'react';
import {
  Mosaic,
  MosaicWindow,
  MosaicNode,
  MosaicBranch,
} from 'react-mosaic-component';
import 'react-mosaic-component/react-mosaic-component.css';

import Browser from '@/components/panels/Browser';
import ChannelRack from '@/components/panels/ChannelRack';
import Playlist from '@/components/panels/Playlist';
import PianoRoll from '@/components/panels/PianoRoll';
import Mixer from '@/components/panels/Mixer';

// Panel types
type PanelType = 'browser' | 'channelRack' | 'playlist' | 'pianoRoll' | 'mixer';

// Panel titles
const PANEL_TITLES: Record<PanelType, string> = {
  browser: 'Browser',
  channelRack: 'Channel Rack',
  playlist: 'Playlist',
  pianoRoll: 'Piano Roll',
  mixer: 'Mixer',
};

// Panel components
const PANEL_COMPONENTS: Record<PanelType, React.FC> = {
  browser: Browser,
  channelRack: ChannelRack,
  playlist: Playlist,
  pianoRoll: PianoRoll,
  mixer: Mixer,
};

// Default layout - Piano Roll is now a modal, not embedded
const DEFAULT_LAYOUT: MosaicNode<PanelType> = {
  direction: 'row',
  first: {
    direction: 'column',
    first: 'browser',
    second: 'channelRack',
    splitPercentage: 40,
  },
  second: {
    direction: 'column',
    first: 'playlist',
    second: 'mixer',
    splitPercentage: 60,
  },
  splitPercentage: 20,
};

export default function DockingLayout() {
  const [layout, setLayout] = useState<MosaicNode<PanelType> | null>(
    DEFAULT_LAYOUT
  );

  const handleChange = useCallback((newLayout: MosaicNode<PanelType> | null) => {
    setLayout(newLayout);
  }, []);

  const renderTile = useCallback((id: PanelType, path: MosaicBranch[]) => {
    const Component = PANEL_COMPONENTS[id];
    const title = PANEL_TITLES[id];

    return (
      <MosaicWindow<PanelType>
        path={path}
        title={title}
        toolbarControls={<PanelToolbar panelId={id} />}
      >
        <div className="h-full w-full bg-ps-bg-800 overflow-hidden">
          <Component />
        </div>
      </MosaicWindow>
    );
  }, []);

  return (
    <div className="h-full w-full">
      <Mosaic<PanelType>
        renderTile={renderTile}
        value={layout}
        onChange={handleChange}
        className="mosaic-blueprint-theme"
      />
    </div>
  );
}

// Panel toolbar component
function PanelToolbar({ panelId }: { panelId: PanelType }) {
  return (
    <div className="flex items-center gap-1">
      <button
        className="btn btn-ghost btn-icon opacity-50 hover:opacity-100"
        title="Panel options"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
    </div>
  );
}

