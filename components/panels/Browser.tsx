'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '@/state/store';
import {
  loadSampleLibrary,
  getCategoryNames,
  getSubcategoryNames,
  getSamplesByCategory,
  formatCategoryName,
  type SampleLibrary,
  type SampleMetadata
} from '@/lib/audio/SampleLibrary';
import { WaveformCanvas, WaveformZoomControl } from '@/components/common/WaveformCanvas';

type BrowserTab = 'patterns' | 'samples' | 'presets';
type SampleView = 'library' | 'user';

export default function Browser() {
  const [activeTab, setActiveTab] = useState<BrowserTab>('patterns');
  const [sampleView, setSampleView] = useState<SampleView>('library');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sampleLibrary, setSampleLibrary] = useState<SampleLibrary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('drums');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [waveformZoom, setWaveformZoom] = useState(1);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dragActiveRef = useRef(false);
  const suppressClickRef = useRef(false);

  const {
    project,
    selectPattern,
    selectedPatternId,
    addPattern,
    duplicatePatternAction,
    deletePattern,
    addAudioAsset,
    deleteAudioAsset,
    getAudioAssetData,
  } = useStore();

  const patterns = project?.patterns ?? [];
  const userSamples = project?.assets ?? [];

  // Load sample library on mount
  useEffect(() => {
    loadSampleLibrary().then(library => {
      if (library) {
        setSampleLibrary(library);
      }
    });
  }, []);

  const startDrag = useCallback((e: React.DragEvent, payload: unknown) => {
    dragActiveRef.current = true;
    suppressClickRef.current = true;
    const data = JSON.stringify(payload);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', data);
    e.dataTransfer.setData('text/plain', data);
  }, []);

  const endDrag = useCallback(() => {
    dragActiveRef.current = false;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, []);

  const playPreview = useCallback((url: string | null) => {
    if (!url) return;
    const audio = previewAudioRef.current ?? new Audio();
    previewAudioRef.current = audio;
    audio.pause();
    audio.currentTime = 0;
    audio.src = url;
    audio.play().catch(() => { });
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const previewSample = useCallback((sample: AudioAsset) => {
    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If clicking the same sample, just stop
    if (playingSampleId === sample.id) {
      setPlayingSampleId(null);
      return;
    }

    // Create and play new audio
    try {
      const audio = new Audio(sample.storageUrl);
      audioRef.current = audio;
      setPlayingSampleId(sample.id);

      audio.play();

      audio.onended = () => {
        setPlayingSampleId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        console.error('Error playing sample:', sample.name);
        setPlayingSampleId(null);
        audioRef.current = null;
      };
    } catch (error) {
      console.error('Error creating audio element:', error);
      setPlayingSampleId(null);
    }
  }, [playingSampleId]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      try {
        for (const file of Array.from(files)) {
          // Validate file type
          if (!file.type.startsWith('audio/')) {
            alert(`${file.name} is not an audio file`);
            continue;
          }

          // Validate file size (max 50MB)
          if (file.size > 50 * 1024 * 1024) {
            alert(`${file.name} is too large (max 50MB)`);
            continue;
          }

          await addAudioAsset(file);
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        alert('Failed to upload audio files');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [addAudioAsset]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      setIsUploading(true);
      try {
        for (const file of files) {
          if (!file.type.startsWith('audio/')) {
            continue;
          }

          if (file.size > 50 * 1024 * 1024) {
            alert(`${file.name} is too large (max 50MB)`);
            continue;
          }

          await addAudioAsset(file);
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        alert('Failed to upload audio files');
      } finally {
        setIsUploading(false);
      }
    },
    [addAudioAsset]
  );

  return (
    <div className="h-full flex flex-col" data-panel="browser">
      {/* Tabs */}
      <div className="flex border-b border-ps-bg-600">
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === 'patterns'
            ? 'bg-ps-bg-700 text-ps-accent-primary border-b-2 border-ps-accent-primary'
            : 'text-ps-text-secondary hover:text-ps-text-primary'
            }`}
          onClick={() => setActiveTab('patterns')}
        >
          Patterns
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === 'samples'
            ? 'bg-ps-bg-700 text-ps-accent-primary border-b-2 border-ps-accent-primary'
            : 'text-ps-text-secondary hover:text-ps-text-primary'
            }`}
          onClick={() => setActiveTab('samples')}
        >
          Samples
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === 'presets'
            ? 'bg-ps-bg-700 text-ps-accent-primary border-b-2 border-ps-accent-primary'
            : 'text-ps-text-secondary hover:text-ps-text-primary'
            }`}
          onClick={() => setActiveTab('presets')}
        >
          Presets
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        {activeTab === 'patterns' && (
          <div className="space-y-1">
            {/* Add Pattern Button */}
            <button
              className="w-full btn btn-ghost text-left text-xs py-2 px-3 flex items-center gap-2"
              onClick={() => addPattern()}
            >
              <svg className="w-4 h-4 text-ps-accent-primary" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Pattern
            </button>

            {/* Pattern List */}
            {patterns.map((pattern) => (
              <div
                key={pattern.id}
                draggable
                onDragStart={(e) => {
                  startDrag(e, {
                    type: 'pattern',
                    patternId: pattern.id,
                  });
                }}
                onDragEnd={endDrag}
                className={`group flex items-center gap-2 px-3 py-2 rounded cursor-grab active:cursor-grabbing transition-colors ${selectedPatternId === pattern.id
                  ? 'bg-ps-bg-600'
                  : 'hover:bg-ps-bg-700'
                  }`}
                onClick={(e) => {
                  if (suppressClickRef.current || e.defaultPrevented) {
                    return;
                  }
                  if (!dragActiveRef.current) {
                    selectPattern(pattern.id);
                  }
                }}
              >
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-sm shrink-0 pointer-events-none"
                  style={{ backgroundColor: pattern.color }}
                />

                {/* Pattern name */}
                <span className="flex-1 text-xs truncate pointer-events-none">{pattern.name}</span>

                {/* Info */}
                <span className="text-2xs text-ps-text-muted pointer-events-none">
                  {pattern.lengthInSteps} steps
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                  <button
                    className="btn btn-ghost btn-icon p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      duplicatePatternAction(pattern.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Duplicate"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                      <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                    </svg>
                  </button>
                  {patterns.length > 1 && (
                    <button
                      className="btn btn-ghost btn-icon p-1 text-ps-accent-red"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        deletePattern(pattern.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      title="Delete"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'samples' && (
          <div className="flex flex-col h-full space-y-2">
            {/* View Switcher */}
            <div className="flex gap-2 px-2">
              <button
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${sampleView === 'library'
                  ? 'bg-ps-accent-primary text-white'
                  : 'bg-ps-bg-700 text-ps-text-secondary hover:text-ps-text-primary'
                  }`}
                onClick={() => setSampleView('library')}
              >
                📚 Library
              </button>
              <button
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${sampleView === 'user'
                  ? 'bg-ps-accent-primary text-white'
                  : 'bg-ps-bg-700 text-ps-text-secondary hover:text-ps-text-primary'
                  }`}
                onClick={() => setSampleView('user')}
              >
                📁 My Samples
              </button>
            </div>

            {/* Library View */}
            {sampleView === 'library' && sampleLibrary && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Category Tabs */}
                <div className="flex gap-1 px-2 pb-2 border-b border-ps-bg-600 overflow-x-auto">
                  {getCategoryNames(sampleLibrary).map((category) => (
                    <button
                      key={category}
                      className={`px-3 py-1.5 text-2xs font-medium rounded whitespace-nowrap transition-colors ${selectedCategory === category
                        ? 'bg-ps-bg-700 text-ps-accent-primary'
                        : 'text-ps-text-secondary hover:text-ps-text-primary'
                        }`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setSelectedSubcategory(null);
                      }}
                    >
                      {formatCategoryName(category)}
                    </button>
                  ))}
                </div>

                {/* Subcategory Pills */}
                {selectedCategory && (
                  <div className="flex flex-wrap gap-1 px-2 py-2 border-b border-ps-bg-600">
                    <button
                      className={`px-2 py-1 text-2xs rounded transition-colors ${!selectedSubcategory
                        ? 'bg-ps-accent-secondary text-white'
                        : 'bg-ps-bg-700 text-ps-text-secondary hover:text-ps-text-primary'
                        }`}
                      onClick={() => setSelectedSubcategory(null)}
                    >
                      All
                    </button>
                    {getSubcategoryNames(sampleLibrary, selectedCategory).map((sub) => (
                      <button
                        key={sub}
                        className={`px-2 py-1 text-2xs rounded transition-colors ${selectedSubcategory === sub
                          ? 'bg-ps-accent-secondary text-white'
                          : 'bg-ps-bg-700 text-ps-text-secondary hover:text-ps-text-primary'
                          }`}
                        onClick={() => setSelectedSubcategory(sub)}
                      >
                        {formatCategoryName(sub)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sample Grid */}
                <div className="flex-1 overflow-auto p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {getSamplesByCategory(
                      sampleLibrary,
                      selectedCategory,
                      selectedSubcategory || undefined
                    ).map((sample: SampleMetadata) => (
                      <div
                        key={sample.id}
                        draggable
                        onDragStart={(e) => {
                          startDrag(e, {
                            type: 'library-sample',
                            sample: sample,
                          });
                        }}
                        onDragEnd={endDrag}
                        onClick={() => {
                          if (suppressClickRef.current || dragActiveRef.current) return;
                          playPreview(sample.path);
                        }}
                        className="group p-2 rounded bg-ps-bg-700 hover:bg-ps-bg-600 cursor-grab active:cursor-grabbing transition-colors"
                        title={sample.name}
                      >
                        <div className="flex items-start gap-2 pointer-events-none">
                          <svg
                            className="w-8 h-8 text-ps-accent-secondary shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <div className="text-2xs font-medium truncate">{sample.name}</div>
                            <div className="text-2xs text-ps-text-muted">
                              {formatDuration(sample.duration)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Library Loading/Empty State */}
            {sampleView === 'library' && !sampleLibrary && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-ps-text-muted">
                  <p className="text-xs">Sample library not loaded</p>
                  <p className="text-2xs mt-1">Run download-samples.js to populate</p>
                </div>
              </div>
            )}

            {/* User Samples View */}
            {sampleView === 'user' && (
              <div className="flex-1 flex flex-col space-y-2">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragging
                    ? 'border-ps-accent-primary bg-ps-accent-primary/10'
                    : 'border-ps-bg-600 hover:border-ps-bg-500'
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {isUploading ? (
                    <>
                      <div className="loading-spinner w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs text-ps-text-secondary">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-12 h-12 mx-auto mb-2 opacity-30"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-xs text-ps-text-muted">
                        Drag audio files here
                      </p>
                      <p className="text-2xs text-ps-text-muted mt-1">
                        or click to browse
                      </p>
                      <p className="text-2xs text-ps-text-muted mt-2">
                        Supports: WAV, MP3, OGG, M4A
                      </p>
                    </>
                  )}
                </div>

                {/* User Sample List */}
                {userSamples.length > 0 && (
                  <div className="flex-1 overflow-auto space-y-1">
                    {/* Header with zoom control */}
                    <div className="flex items-center justify-between px-2 py-1">
                      <div className="text-xs text-ps-text-secondary font-medium">
                        My Samples ({userSamples.length})
                      </div>
                      <WaveformZoomControl
                        zoom={waveformZoom}
                        onZoomChange={setWaveformZoom}
                        min={0.5}
                        max={4}
                      />
                    </div>

                    {userSamples.map((sample) => {
                      const audioData = getAudioAssetData(sample.id);
                      return (
                        <div
                          key={sample.id}
                          draggable
                          onDragStart={(e) => {
                            startDrag(e, {
                              type: 'user-sample',
                              assetId: sample.id,
                            });
                          }}
                          onDragEnd={endDrag}
                          onClick={() => {
                            if (suppressClickRef.current || dragActiveRef.current) return;
                            const previewUrl = audioData || sample.storageUrl || null;
                            playPreview(previewUrl);
                          }}
                          className="group px-3 py-2 rounded hover:bg-ps-bg-700 cursor-grab active:cursor-grabbing"
                        >
                          {/* Top row: icon, name, actions */}
                          <div className="flex items-center gap-2">
                            {/* Audio icon */}
                            <svg
                              className="w-4 h-4 text-ps-accent-secondary shrink-0 pointer-events-none"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                            </svg>

                            {/* Sample info */}
                            <div className="flex-1 min-w-0 pointer-events-none">
                              <div className="text-xs truncate">{sample.name}</div>
                              <div className="text-2xs text-ps-text-muted">
                                {formatDuration(sample.duration)} • {formatFileSize(sample.size)}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                              <button
                                className="btn btn-ghost btn-icon p-1 text-ps-accent-red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  deleteAudioAsset(sample.id);
                                }}
                                title="Delete"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Waveform display */}
                          {audioData && (
                            <div className="mt-2 ml-6 pointer-events-none">
                              <WaveformCanvas
                                assetId={sample.id}
                                audioData={audioData}
                                width={Math.floor(180 * waveformZoom)}
                                height={32}
                                zoom={waveformZoom}
                                compact
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="space-y-2">
            <div className="text-xs text-ps-text-secondary px-2 py-1 font-medium">
              Synth Presets
            </div>
            {['Default', 'Pad', 'Lead', 'Bass', 'Pluck'].map((preset) => (
              <div
                key={preset}
                className="px-3 py-2 rounded hover:bg-ps-bg-700 cursor-pointer text-xs"
              >
                {preset}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

