import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, CAMPUS_LOCATIONS } from '../../constants/theme';

const INITIAL_LAT = -7.9215;
const INITIAL_LNG = 112.5980;

export default function MapScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const webViewRef = useRef(null);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'active');
      
    if (!error && data) {
      setReports(data.map(d => ({
        ...d,
        locationId: d.location_id,
        locationName: d.location_name
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
    
    const channel = supabase.channel('public:reports_map')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
         fetchReports();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredReports = reports.filter(r => activeFilter === 'all' || r.type === activeFilter);

  const getLocationCoords = (locationId) => {
    const loc = CAMPUS_LOCATIONS.find(l => l.id === locationId);
    if (!loc) return null;
    return {
      latitude: loc.lat + (Math.random() - 0.5) * 0.0003,
      longitude: loc.lng + (Math.random() - 0.5) * 0.0003,
    };
  };

  const campusMarkersData = CAMPUS_LOCATIONS.map(loc => ({
    lat: loc.lat, lng: loc.lng, name: loc.name, isDropOff: loc.isDropOff, type: 'campus',
  }));
  const reportMarkersData = filteredReports.map(report => {
    const coords = getLocationCoords(report.locationId);
    if (!coords) return null;
    return { lat: coords.latitude, lng: coords.longitude, title: report.title, location: report.locationName, type: report.type, id: report.id };
  }).filter(Boolean);

  const initialDataJson = JSON.stringify({
    campusMarkers: campusMarkersData,
    reportMarkers: reportMarkersData,
  });

  useEffect(() => {
    if (webViewRef.current) {
      const payload = JSON.stringify({ campusMarkers: campusMarkersData, reportMarkers: reportMarkersData });
      if (Platform.OS === 'web') {
        webViewRef.current.contentWindow?.postMessage(payload, '*');
      } else {
        webViewRef.current.postMessage(payload);
      }
    }
  }, [filteredReports]);

  const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body,#map { width:100%; height:100%; background:#0d1117; }
    .leaflet-tile { filter: brightness(0.75) saturate(0.8); }
    .cp { width:28px;height:28px;border-radius:50%;background:#388bfd;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:13px; }
    .dp { background:#f78166; }
    .lp { width:32px;height:32px;border-radius:50%;background:#ff453a;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:15px; }
    .fp { width:32px;height:32px;border-radius:50%;background:#30d158;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:15px; }
    .pb { background:#161b22;border:1px solid #30363d;border-radius:10px;padding:10px;min-width:150px;color:white;font-family:sans-serif; }
    .pt { display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:bold;margin-bottom:6px; }
    .pti { font-size:13px;font-weight:600;color:#e6edf3;margin-bottom:4px; }
    .pl { font-size:11px;color:#8b949e; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map',{zoomControl:true}).setView([-7.9215,112.5980],17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'OSM',maxZoom:19}).addTo(map);
    let cl=L.layerGroup().addTo(map), rl=L.layerGroup().addTo(map);
    function mi(html){return L.divIcon({html,className:'',iconSize:[32,32],iconAnchor:[16,16]});}
    function update(d){
      if(!d)return;
      cl.clearLayers(); rl.clearLayers();
      (d.campusMarkers||[]).forEach(m=>{
        const ic=mi('<div class="cp'+(m.isDropOff?' dp':'')+'">'+( m.isDropOff?'🛡':'🏛')+'</div>');
        L.marker([m.lat,m.lng],{icon:ic}).bindPopup('<div class="pb"><div class="pti">'+m.name+'</div></div>').addTo(cl);
      });
      (d.reportMarkers||[]).forEach(m=>{
        const lost=m.type==='lost';
        const ic=mi('<div class="'+(lost?'lp':'fp')+'">'+(lost?'🔍':'✅')+'</div>');
        const pc=lost?'#ff453a':'#30d158';
        const pop='<div class="pb"><span class="pt" style="background:'+pc+'">'+(lost?'HILANG':'DITEMUKAN')+'</span><div class="pti">'+m.title+'</div><div class="pl">📍 '+(m.location||'')+'</div></div>';
        L.marker([m.lat,m.lng],{icon:ic}).bindPopup(pop).addTo(rl);
      });
    }
    update(${initialDataJson});
    function handle(e){
      try{
        const d=typeof e.data==='string'?JSON.parse(e.data):e.data;
        update(d);
      }catch(e){console.error(e);}
    }
    document.addEventListener('message',handle);
    window.addEventListener('message',handle);
  <\/script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺 Peta Lokasi</Text>
        <Text style={styles.subtitle}>Titik barang hilang & ditemukan di kampus UMM</Text>
      </View>
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'Semua', color: COLORS.primary },
          { id: 'lost', label: '🔴 Hilang', color: COLORS.lost },
          { id: 'found', label: '🟢 Ditemukan', color: COLORS.found },
        ].map(f => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterBtn, activeFilter === f.id && { backgroundColor: f.color, borderColor: f.color }]}
            onPress={() => setActiveFilter(f.id)}
          >
            <Text style={[styles.filterText, activeFilter === f.id && { color: 'white' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat peta...</Text>
        </View>
      ) : Platform.OS === 'web' ? (
        <iframe
          ref={webViewRef}
          srcDoc={mapHtml}
          style={{ border: 'none', width: '100%', height: '100%', flex: 1, backgroundColor: '#0d1117' }}
          title="OpenStreetMap"
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          onLoad={() => {
            webViewRef.current?.postMessage(JSON.stringify({ campusMarkers: campusMarkersData, reportMarkers: reportMarkersData }));
          }}
        />
      )}
      <View style={styles.legend}>
        <LegendItem color={COLORS.lost} label="Hilang" />
        <LegendItem color={COLORS.found} label="Ditemukan" />
        <LegendItem color={COLORS.accent} label="Pos Satpam" />
        <Text style={styles.legendCount}>{filteredReports.length} titik</Text>
      </View>
    </View>
  );
}

const LegendItem = ({ color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.base, paddingTop: 55, paddingBottom: SPACING.md, backgroundColor: COLORS.background },
  title: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: TYPOGRAPHY.sizes.xl, color: COLORS.textPrimary },
  subtitle: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.base, gap: SPACING.sm, marginBottom: SPACING.sm },
  filterBtn: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  map: { flex: 1, backgroundColor: '#0d1117' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textSecondary },
  legend: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, paddingBottom: 30, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.base },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  legendCount: { marginLeft: 'auto', fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.primary },
});
