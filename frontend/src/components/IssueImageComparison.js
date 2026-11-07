import React from 'react';

export const IssueImageComparison = ({ beforeImages = [], afterImages = [] }) => {
    // Display if at least one set of images exists
    if (!beforeImages.length && !afterImages.length) return null;

    return (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">Image Evidence</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-2">Before (Reported)</div>
                    <div className="grid grid-cols-2 gap-2">
                        {beforeImages.length > 0 ? (
                            beforeImages.map((photo, idx) => (
                                <img key={`before-${idx}`} src={photo} alt={`Before evidence ${idx + 1}`} className="w-full h-28 object-cover rounded-xl border border-stone-200/60 dark:border-stone-800" />
                            ))
                        ) : (
                            <div className="col-span-2 h-28 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 flex items-center justify-center text-[11px] text-stone-400">No before images</div>
                        )}
                    </div>
                </div>
                <div>
                    <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-2">After (Resolved)</div>
                    <div className="grid grid-cols-2 gap-2">
                        {afterImages.length > 0 ? (
                            afterImages.map((photo, idx) => (
                                <img key={`after-${idx}`} src={photo} alt={`After proof ${idx + 1}`} className="w-full h-28 object-cover rounded-xl border border-stone-200/60 dark:border-stone-800" />
                            ))
                        ) : (
                            <div className="col-span-2 h-28 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 flex items-center justify-center text-[11px] text-stone-400">No after images uploaded</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
