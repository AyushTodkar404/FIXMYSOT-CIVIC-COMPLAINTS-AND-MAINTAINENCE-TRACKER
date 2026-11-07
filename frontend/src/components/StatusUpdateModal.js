import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import * as PhosphorIcons from '@phosphor-icons/react';
import { STATUS_LIST, getStatusMeta } from '../utils/statusUtils';

export const StatusUpdateModal = ({ issue, onClose, onSuccess }) => {
  const [status, setStatus] = useState(issue?.status || 'Submitted');
  const [remark, setRemark] = useState('');
  const [assignedTo, setAssignedTo] = useState(issue?.assigned_to || '');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState(issue?.estimated_completion_date || '');
  const [afterPhotos, setAfterPhotos] = useState(issue?.after_photos || []);
  const [afterPhotoPreviews, setAfterPhotoPreviews] = useState(issue?.after_photos || []);
  const [submitting, setSubmitting] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const requiresProof = useMemo(() => ['Work Completed', 'Citizen Verification Pending', 'Closed', 'resolved', 'resolved'].includes(status), [status]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + afterPhotos.length > 5) {
      toast.error('Maximum 5 proof images allowed');
      return;
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Each image must be under 10MB');
        continue;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        continue;
      }

      try {
        const compressed = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const maxDim = 1280;
              let { width, height } = img;
              if (width > height && width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              canvas.getContext('2d').drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
            img.src = event.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setAfterPhotos((prev) => [...prev, compressed]);
        setAfterPhotoPreviews((prev) => [...prev, compressed]);
      } catch (err) {
        console.error('Image processing error:', err);
        toast.error('Failed to process image');
      }
    }
  };

  const removeAfterPhoto = (index) => {
    setAfterPhotos((prev) => prev.filter((_, i) => i !== index));
    setAfterPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status) {
      toast.error('Please select a status');
      return;
    }

    // Validate estimated completion date is in the future
    if (estimatedCompletionDate && new Date(estimatedCompletionDate) < new Date()) {
      toast.error('Estimated completion date must be in the future');
      return;
    }

    setSubmitting(true);
    try {
      await axios.patch(
        `${BACKEND_URL}/api/issues/${issue.id}`,
        {
          status,
          remark: remark.trim(),
          assigned_to: assignedTo.trim() || null,
          estimated_completion_date: estimatedCompletionDate || null,
          after_photos: afterPhotos
        },
        { withCredentials: true }
      );

      toast.success(`Complaint status updated to ${status}`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      const msg = error.response?.data?.detail ? String(error.response.data.detail) : 'Failed to update status';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const currentMeta = getStatusMeta(status);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
      data-testid="status-update-modal"
    >
      <div
        className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-3xl max-w-lg w-full p-4 shadow-2xl overflow-y-auto max-h-[85vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 mb-3 border-b border-stone-150 dark:border-stone-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Municipal Officer Action
            </span>
            <h2 className="text-lg font-black text-stone-950 dark:text-white leading-tight">
              Update Complaint Lifecycle
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 transition-colors"
            data-testid="close-status-modal-btn"
          >
            <PhosphorIcons.X size={18} weight="bold" />
          </button>
        </div>

        {/* Issue Title Preview */}
        <div className="bg-stone-50 dark:bg-stone-950/60 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-850 mb-3">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Target Issue</p>
          <p className="text-xs font-extrabold text-stone-900 dark:text-stone-100 truncate">{issue?.title}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Status Dropdown */}
          <div>
            <label className="block text-xs font-extrabold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              New Lifecycle Status <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-250 dark:border-stone-800 rounded-lg text-stone-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-800 focus:outline-none transition-all cursor-pointer"
                data-testid="status-select"
              >
                {STATUS_LIST.map((st) => (
                  <option key={st} value={st} className="dark:bg-stone-900 font-semibold py-1">
                    {st}
                  </option>
                ))}
              </select>
            </div>
            {currentMeta.description && (
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-medium italic">
                {currentMeta.description}
              </p>
            )}
          </div>

          {/* Assigned Officer / Crew */}
          <div>
            <label className="block text-xs font-extrabold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Assigned Department / Officer
            </label>
            <div className="relative">
              <PhosphorIcons.User size={18} className="absolute left-3.5 top-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="e.g. Ward 4 Team"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-250 dark:border-stone-800 rounded-lg text-stone-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-emerald-800 focus:outline-none transition-all placeholder-stone-400"
                data-testid="assigned-to-input"
              />
            </div>
          </div>

          {/* Estimated Completion Date */}
          <div>
            <label className="block text-xs font-extrabold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Estimated Completion Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={estimatedCompletionDate}
                onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-250 dark:border-stone-800 rounded-lg text-stone-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-emerald-800 focus:outline-none transition-all cursor-pointer"
                data-testid="estimated-date-input"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-extrabold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Officer Remarks / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Brief notes..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-250 dark:border-stone-800 rounded-lg text-stone-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-800 focus:outline-none transition-all placeholder-stone-400"
              data-testid="remark-textarea"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Completion Proof Images (After Photos)
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <label className="cursor-pointer px-2.5 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-250 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900 font-bold text-[10px] rounded-lg transition-all duration-200 flex items-center space-x-1.5">
                <PhosphorIcons.Camera size={12} weight="bold" />
                <span>Upload</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="after-photo-upload"
                />
              </label>
              <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">{afterPhotos.length}/5</span>
            </div>
            {afterPhotoPreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 max-h-20">
                {afterPhotoPreviews.map((preview, index) => (
                  <div key={`${preview}-${index}`} className="relative group">
                    <img src={preview} alt="After proof" className="w-full h-16 object-cover rounded-lg border border-stone-200 dark:border-stone-800" />
                    <button
                      type="button"
                      onClick={() => removeAfterPhoto(index)}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                    >
                      <PhosphorIcons.X size={10} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 font-medium">
              {requiresProof
                ? 'These proof images are optional for closure, but they will appear as After photos when the complaint is viewed.'
                : 'Upload completion images when work is finished to attach proof to the complaint.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg font-bold text-xs transition-all"
              data-testid="cancel-status-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 px-3 bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white rounded-lg font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 disabled:opacity-50"
              data-testid="submit-status-btn"
            >
              {submitting ? (
                <>
                  <PhosphorIcons.CircleNotch size={14} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <PhosphorIcons.Check size={14} weight="bold" />
                  <span>Confirm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
