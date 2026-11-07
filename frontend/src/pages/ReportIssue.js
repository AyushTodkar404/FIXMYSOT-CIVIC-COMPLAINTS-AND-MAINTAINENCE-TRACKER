import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Navbar } from '../components/Navbar';
import { MapContainer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { MapBasemapControl } from '../components/MapBasemapControl';

import { offlineCache } from '../lib/networkResilience';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CATEGORIES = ['Roads', 'Garbage', 'Streetlights', 'Water Supply', 'Sewage', 'Electricity', 'Parks & Public Spaces', 'Traffic & Transport', 'Public Health', 'Other'];

export const ReportIssue = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: { lat: 19.0760, lng: 72.8777 },
    address: '',
    photos: []
  });
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    fetchCategories();
    getUserLocation();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/categories`);
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        offlineCache.set('categories', data);
      }
    } catch {
      const cached = offlineCache.get('categories');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setCategories(cached);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => console.error('Geolocation error:', error)
      );
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      const data = await response.json();
      setFormData(prev => ({ ...prev, address: data.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` }));
    } catch {
      setFormData(prev => ({ ...prev, address: prev.address || `GPS coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
    }
  };

  const LocationMarker = () => {
    const map = useMap();

    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setFormData(prev => ({ ...prev, location: { lat, lng } }));
        reverseGeocode(lat, lng);
      },
    });

    React.useEffect(() => {
      if (formData.location) {
        map.flyTo([formData.location.lat, formData.location.lng], 15, {
          duration: 1.5
        });
      }
    }, [formData.location.lat, formData.location.lng, map]);

    return formData.location ? (
      <Marker position={[formData.location.lat, formData.location.lng]} />
    ) : null;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Adapt dimensions and compression quality according to cellular network condition
          const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
          const isWeak = navigator.onLine === false ||
            ['slow-2g', '2g', '3g'].includes(conn?.effectiveType) ||
            conn?.saveData;
          const maxDim = isWeak ? 900 : 1280;
          const quality = isWeak ? 0.65 : 0.8;

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + formData.photos.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Each file must be under 10MB');
        continue;
      }
      try {
        const compressedBase64 = await compressImage(file);
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, compressedBase64]
        }));
        setImagePreviews(prev => [...prev, compressedBase64]);
      } catch (err) {
        console.error('Image compression error:', err);
        toast.error('Unable to process image');
      }
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await transcribeAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      toast.info('Recording started...');
    } catch (error) {
      toast.error('Could not access microphone');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      toast.success('Recording stopped. Transcribing...');
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const { data } = await axios.post(
        `${BACKEND_URL}/api/voice/transcribe`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );

      setFormData(prev => ({
        ...prev,
        description: prev.description + ' ' + data.text
      }));
      toast.success('Voice transcribed successfully!');
    } catch (error) {
      toast.error('Transcription failed');
      console.error('Transcription error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        `${BACKEND_URL}/api/issues`,
        formData,
        { withCredentials: true }
      );

      toast.success('Issue reported successfully! +10 points earned');
      navigate('/citizen/my-issues');
    } catch (error) {
      toast.error('Failed to report issue');
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10" data-testid="report-issue-page">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-stone-950 dark:text-white tracking-tight">{t('reportIssue')}</h1>
          <p className="text-stone-550 dark:text-stone-400 mt-1 font-medium">Help improve your community by reporting civic issues.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Side */}
          <div className="lg:col-span-5 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">{t('title')}</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-stone-50/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-850 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-800 focus:border-transparent focus:outline-none transition-all duration-200 placeholder-stone-400"
                  placeholder="Brief description of the issue"
                  data-testid="issue-title-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">{t('category')}</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-stone-50/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-850 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-800 focus:border-transparent focus:outline-none transition-all duration-200 cursor-pointer"
                  data-testid="category-select"
                >
                  <option value="" className="dark:bg-stone-900">{t('selectCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="dark:bg-stone-900">{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">{t('description')}</label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 bg-stone-50/50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-850 rounded-xl text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-800 focus:border-transparent focus:outline-none transition-all duration-200 placeholder-stone-400"
                  placeholder="Detailed description of the issue"
                  data-testid="issue-description-input"
                />
              </div>

              {/* Voice recorder action button */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 border transition-all duration-300 ${
                    recording
                      ? 'bg-red-600 dark:bg-red-750 text-white border-red-500 hover:bg-red-700 dark:hover:bg-red-700'
                      : 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-800 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                  }`}
                  data-testid="voice-record-button"
                >
                  <PhosphorIcons.Microphone size={20} weight={recording ? 'fill' : 'regular'} className={recording ? 'microphone-pulse' : ''} />
                  <span>{recording ? 'Stop Recording' : t('recordVoice')}</span>
                </button>
              </div>

              {/* Image Uploader input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">Upload Photos (Max 5)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-xs rounded-xl transition-all duration-200 flex items-center space-x-2">
                    <PhosphorIcons.Camera size={16} weight="bold" />
                    <span>Take Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="camera-upload"
                    />
                  </label>
                  <label className="cursor-pointer px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900 font-bold text-xs rounded-xl transition-all duration-200 flex items-center space-x-2">
                    <PhosphorIcons.Image size={16} weight="bold" />
                    <span>Choose Gallery</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="image-upload"
                    />
                  </label>
                  <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">{formData.photos.length} of 5 uploaded</span>
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group w-12 h-12">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl border border-stone-200 dark:border-stone-800" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1.5 -right-1.5 bg-red-650 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                        >
                          <PhosphorIcons.X size={10} weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">{t('location')}</label>
                <input
                  type="text"
                  value={formData.address}
                  readOnly
                  className="w-full px-4 py-3 bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl text-stone-605 dark:text-stone-400 text-sm font-semibold select-all"
                  placeholder="Click on the map to select location"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-3 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 font-bold transition-all duration-200"
                  data-testid="cancel-button"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-emerald-800 dark:bg-emerald-700 text-white rounded-xl hover:bg-emerald-900 dark:hover:bg-emerald-600 font-bold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                  data-testid="submit-issue-button"
                >
                  {submitting ? 'Submitting...' : t('submit')}
                </button>
              </div>
            </form>
          </div>

          {/* Map Side */}
          <div className="lg:col-span-7 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm p-2 relative" style={{ height: '600px' }}>
            <div className="absolute z-[2] left-5 top-5 pointer-events-none rounded-xl border border-white/40 bg-stone-950/80 px-3.5 py-2.5 text-white shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold"><PhosphorIcons.CrosshairSimple size={16} className="text-emerald-300" /> Pin the exact location</div>
              <p className="mt-0.5 text-[11px] text-stone-300">Click the map. Use layers for satellite imagery.</p>
            </div>
            <MapContainer
              center={[formData.location.lat, formData.location.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%', borderRadius: '1.25rem' }}
              data-testid="issue-map"
              className="modern-map"
            >
              <MapBasemapControl isDark={isDark} />
              <LocationMarker />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
