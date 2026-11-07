import React from 'react';
import { LayersControl, TileLayer } from 'react-leaflet';

const { BaseLayer } = LayersControl;

// Shared layers keep every interactive map consistent without exposing a map API key.
export const MapBasemapControl = ({ isDark = false }) => (
  <LayersControl position="topright">
    <BaseLayer checked={!isDark} name="Street map">
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" maxZoom={20} />
    </BaseLayer>
    <BaseLayer checked={isDark} name="Dark detail">
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" maxZoom={20} />
    </BaseLayer>
    <BaseLayer name="Satellite">
      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" maxZoom={19} />
    </BaseLayer>
  </LayersControl>
);
