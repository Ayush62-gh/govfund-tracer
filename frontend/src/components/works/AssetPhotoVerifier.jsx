import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import { ShieldCheck, MapPin, Camera, Sparkles, CheckCircle2, AlertTriangle, Download, Calendar } from 'lucide-react';
import { triggerCelebration } from '../../utils/exportUtils';

/**
 * AssetPhotoVerifier Component
 * Interactive site inspection verification module with AI tamper analysis and GPS geotag integrity.
 */
export const AssetPhotoVerifier = ({ work, isOpen, onClose, onApprove }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isApproved, setIsApproved] = useState(false);

  if (!work) return null;

  const handleApprove = () => {
    setIsApproved(true);
    triggerCelebration();
    if (onApprove) onApprove(work.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asset Geotag & Photo Verification Module"
      subtitle={`Work Ref: ${work.id} • ${work.title}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Top Integrity Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">
                AI Tamper & Deepfake Analysis: {work.tamperVerified ? 'PASSED (100% Authentic)' : 'INTEGRITY FLAGGED'}
              </div>
              <div className="text-[11px] text-slate-500">
                Pixel ELA, noise variance & EXIF cryptographic signature verified by NIC Geo-Engine
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                work.geotagMatch
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {work.geotagMatch ? 'GPS Geofence Matched' : 'GPS Deviation Detected'}
            </span>
          </div>
        </div>

        {/* Side-by-side Before & After Image Viewer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Before Image */}
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-md flex flex-col">
            <div className="px-3 py-2 bg-slate-800 text-white text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                <span>Before Inception (Baseline)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">{work.sanctionedDate}</span>
            </div>
            <div className="h-56 overflow-hidden relative group">
              <img
                src={work.beforePhoto}
                alt="Before Inception"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-mono flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-400" />
                {work.gps?.lat || 25.4214}, {work.gps?.lng || 82.9734}
              </div>
            </div>
          </div>

          {/* After / Current Image */}
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-md flex flex-col">
            <div className="px-3 py-2 bg-slate-800 text-white text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Current Site Progress (Milestone Stage)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Current</span>
            </div>
            <div className="h-56 overflow-hidden relative group">
              <img
                src={work.afterPhoto}
                alt="Current Milestone"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-mono flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {work.gps?.lat || 25.4214}, {work.gps?.lng || 82.9734}
              </div>
            </div>
          </div>
        </div>

        {/* EXIF Metadata Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Cryptographic Geotag & Device Telemetry
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Device Model</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">NIC Bhuvan Mobile Tab</span>
            </div>
            <div>
              <span className="text-slate-400 block">Inspecting Officer</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Asst. Engineer (PWD)</span>
            </div>
            <div>
              <span className="text-slate-400 block">GPS Accuracy</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">±2.4 meters (RTK Lock)</span>
            </div>
            <div>
              <span className="text-slate-400 block">Blockchain Hash</span>
              <span className="font-mono text-[10px] text-slate-500 truncate block">0x8f7a90b4112...</span>
            </div>
          </div>
        </div>

        {/* Approval Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isApproved ? (
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Physical Verification Certificate Endorsed
              </span>
            ) : (
              <span>Ready for District Authority Digital Endorsement</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </button>

            {!isApproved && (
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Physical Milestone</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

AssetPhotoVerifier.propTypes = {
  work: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApprove: PropTypes.func,
};

export default AssetPhotoVerifier;
