import React from 'react';
import { LayersControl, TileLayer } from 'react-leaflet';

const { BaseLayer } = LayersControl;

// Shared keyless basemaps using official OpenStreetMap and Esri World Imagery (zero API keys required).
export const MapBasemapControl = ({ isDark = false }) => (
  <LayersControl key={isDark ? 'dark-basemap' : 'light-basemap'} position="topright">
    <BaseLayer checked={!isDark} name="Street map">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
    </BaseLayer>
    <BaseLayer checked={isDark} name="Dark detail">
      <TileLayer
        className="map-tiles-dark"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
    </BaseLayer>
    <BaseLayer name="Satellite">
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={19}
      />
    </BaseLayer>
  </LayersControl>
);
