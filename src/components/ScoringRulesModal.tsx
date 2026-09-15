import React, { useState } from 'react';
import { ScoringWeightsConfig } from '../types';
import { X, Sliders, Check, RotateCcw, Zap } from 'lucide-react';
import { DEFAULT_SCORING_WEIGHTS } from '../services/leadScoring';

interface ScoringRulesModalProps {
  weights: ScoringWeightsConfig;
  onClose: () => void;
  onSaveWeights: (newWeights: ScoringWeightsConfig) => void;
}

export const ScoringRulesModal: React.FC<ScoringRulesModalProps> = ({
  weights,
  onClose,
  onSaveWeights,
}) => {
  const [currentWeights, setCurrentWeights] = useState<ScoringWeightsConfig>({ ...weights });

  const handleReset = () => {
    setCurrentWeights({ ...DEFAULT_SCORING_WEIGHTS });
  };

  const handleSave = () => {
    onSaveWeights(currentWeights);
    onClose();
  };

  return (
    <div 
      id="scoring-rules-modal-overlay" 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-lg p-4 shadow-xl text-slate-900 cursor-default"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              <Sliders className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Konfigurasi Bobot Lead Scoring Otomatis
              </h3>
              <p className="text-[10px] text-slate-500">
                Atur bobot poin untuk aktivitas prospek di GoApp &amp; Web Upper West
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Weights Sliders */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin text-xs">
          
          {/* Site Visit Request */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <div className="flex justify-between font-semibold mb-1 text-[11px]">
              <span>Request Show Unit / Site Visit (Paling Kritis)</span>
              <span className="text-amber-700 font-bold">+{currentWeights.siteVisitRequestPoints} Pts</span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              value={currentWeights.siteVisitRequestPoints}
              onChange={(e) => setCurrentWeights({ ...currentWeights, siteVisitRequestPoints: Number(e.target.value) })}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* WhatsApp Fast Reply */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <div className="flex justify-between font-semibold mb-1 text-[11px]">
              <span>Responsif Chat WhatsApp GoApp</span>
              <span className="text-emerald-700 font-bold">+{currentWeights.whatsappFastReplyPoints} Pts</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={currentWeights.whatsappFastReplyPoints}
              onChange={(e) => setCurrentWeights({ ...currentWeights, whatsappFastReplyPoints: Number(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* High Budget Bonus */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <div className="flex justify-between font-semibold mb-1 text-[11px]">
              <span>Kesesuaian Budget Premium (&gt; Rp 4 Miliar)</span>
              <span className="text-amber-700 font-bold">+{currentWeights.highBudgetBonusPoints} Pts</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={currentWeights.highBudgetBonusPoints}
              onChange={(e) => setCurrentWeights({ ...currentWeights, highBudgetBonusPoints: Number(e.target.value) })}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Brochure Download */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <div className="flex justify-between font-semibold mb-1 text-[11px]">
              <span>Download E-Brochure &amp; Floorplan PDF</span>
              <span className="text-blue-700 font-bold">+{currentWeights.brochureDownloadPoints} Pts</span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              value={currentWeights.brochureDownloadPoints}
              onChange={(e) => setCurrentWeights({ ...currentWeights, brochureDownloadPoints: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Thresholds */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <label className="text-[10px] text-slate-500 block mb-1 font-semibold">
                Batas Minimum HOT Lead:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="60"
                  max="90"
                  value={currentWeights.hotThreshold}
                  onChange={(e) => setCurrentWeights({ ...currentWeights, hotThreshold: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded p-1 text-center font-bold text-emerald-700 text-xs"
                />
                <span className="text-slate-500 text-[11px]">Pts</span>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <label className="text-[10px] text-slate-500 block mb-1 font-semibold">
                Batas Minimum WARM Lead:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="30"
                  max="59"
                  value={currentWeights.warmThreshold}
                  onChange={(e) => setCurrentWeights({ ...currentWeights, warmThreshold: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded p-1 text-center font-bold text-amber-700 text-xs"
                />
                <span className="text-slate-500 text-[11px]">Pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 cursor-pointer font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="text-[11px] text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] px-3 py-1 rounded transition-colors cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>Terapkan Bobot Baru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
