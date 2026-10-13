import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

function Header({ title, onBack }) {
  return (
    <LinearGradient colors={['#0D1F35', COLORS.background]} style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </LinearGradient>
  );
}

function SectionTitle({ label }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.faqItem, open && styles.faqItemOpen]}
      onPress={() => setOpen(!open)}
      activeOpacity={0.8}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQ, open && { color: COLORS.primary }]}>{q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={open ? COLORS.primary : COLORS.textMuted}
        />
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
}

function ContactCard({ icon, iconColor, bgColor, label, value, onPress }) {
  return (
    <TouchableOpacity style={styles.contactCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.contactIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
      <Ionicons name="open-outline" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const FAQS = [
  {
    q: 'Bagaimana cara melaporkan barang hilang?',
    a: 'Buka halaman Beranda, klik tombol "+" di tengah, pilih "Barang Hilang", isi detail barang termasuk foto dan lokasi terakhir ditemukan.',
  },
  {
    q: 'Bagaimana jika ada yang mengklaim barang saya?',
    a: 'Kamu akan mendapat notifikasi. Verifikasi klaim dengan mencocokkan ciri-ciri barang, lalu hubungi melalui fitur pesan untuk mengatur penyerahan.',
  },
  {
    q: 'Berapa lama laporan aktif?',
    a: 'Laporan aktif selama 30 hari. Setelah itu akan diarsip otomatis, namun kamu bisa mengaktifkan kembali dari menu profil.',
  },
  {
    q: 'Apakah data saya aman?',
    a: 'Ya. Data login tersimpan terenkripsi menggunakan Keychain/Keystore perangkat. Kami tidak pernah menyimpan password dalam format plain text.',
  },
  {
    q: 'Bagaimana cara menghubungi penemu barang?',
    a: 'Klik laporan temuan yang relevan, lalu tekan tombol "Hubungi". Chat langsung tersedia setelah admin memverifikasi klaim.',
  },
  {
    q: 'Siapa yang bisa menggunakan JejaKampus?',
    a: 'JejaKampus hanya untuk sivitas akademika UMM — mahasiswa, dosen, dan karyawan dengan email resmi UMM (@umm.ac.id).',
  },
];

export default function HelpFaqScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Header title="Bantuan & FAQ" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

        {/* Search placeholder */}
        <View style={styles.searchHero}>
          <LinearGradient colors={[COLORS.primary + '15', COLORS.accent + '08']} style={styles.searchHeroInner}>
            <Ionicons name="help-buoy" size={36} color={COLORS.primary} />
            <Text style={styles.searchHeroTitle}>Apa yang bisa kami bantu?</Text>
            <Text style={styles.searchHeroDesc}>
              Temukan jawaban dari pertanyaan yang sering diajukan di bawah ini
            </Text>
          </LinearGradient>
        </View>

        {/* FAQ List */}
        <SectionTitle label="PERTANYAAN UMUM" />
        <View style={styles.faqCard}>
          {FAQS.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </View>

        {/* Panduan Cepat */}
        <SectionTitle label="PANDUAN CEPAT" />
        <View style={styles.guideGrid}>
          {[
            { icon: 'add-circle', color: COLORS.primary, label: 'Buat Laporan', desc: 'Cara melaporkan barang' },
            { icon: 'search', color: COLORS.accent, label: 'Cari Barang', desc: 'Temukan laporan yang cocok' },
            { icon: 'chatbubbles', color: '#BF5AF2', label: 'Kirim Pesan', desc: 'Hubungi penemu/pemilik' },
            { icon: 'map', color: '#FF9F0A', label: 'Lihat Peta', desc: 'Titik lokasi laporan' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.guideCard} activeOpacity={0.8}>
              <View style={[styles.guideIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={26} color={item.color} />
              </View>
              <Text style={styles.guideLabel}>{item.label}</Text>
              <Text style={styles.guideDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Kontak */}
        <SectionTitle label="HUBUNGI KAMI" />
        <View style={styles.contactList}>
          <ContactCard
            icon="mail" iconColor={COLORS.primary} bgColor={COLORS.primary + '20'}
            label="Email Dukungan" value="support@jejakampus.umm.ac.id"
            onPress={() => Linking.openURL('mailto:support@jejakampus.umm.ac.id')}
          />
          <ContactCard
            icon="logo-whatsapp" iconColor={COLORS.found} bgColor={COLORS.found + '20'}
            label="WhatsApp Admin" value="+62 812-3456-7890"
            onPress={() => Linking.openURL('https://wa.me/6281234567890')}
          />
          <ContactCard
            icon="globe-outline" iconColor="#FF9F0A" bgColor="#FF9F0A20"
            label="Website UMM" value="www.umm.ac.id"
            onPress={() => Linking.openURL('https://www.umm.ac.id')}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 55, paddingBottom: SPACING.md, paddingHorizontal: SPACING.base,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.sizes.lg, color: COLORS.textPrimary,
  },

  searchHero: { padding: SPACING.base, paddingTop: SPACING.lg },
  searchHeroInner: {
    alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.xl, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchHeroTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.sizes.lg, color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  searchHeroDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 20,
  },

  sectionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textMuted, letterSpacing: 1,
    marginTop: SPACING.xl, marginBottom: SPACING.sm,
    marginLeft: SPACING.base + 4,
  },

  faqCard: {
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  faqItem: {
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  faqItemOpen: { backgroundColor: COLORS.primary + '05' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACING.sm },
  faqQ: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary,
    flex: 1, lineHeight: 22,
  },
  faqA: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary,
    marginTop: SPACING.sm, lineHeight: 20,
  },

  guideGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: SPACING.base, gap: SPACING.sm,
  },
  guideCard: {
    width: '47.5%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, alignItems: 'center', gap: 6,
  },
  guideIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  guideLabel: { fontFamily: TYPOGRAPHY.fontFamily.semiBold, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary },
  guideDesc: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.textMuted, textAlign: 'center' },

  contactList: { marginHorizontal: SPACING.base, gap: SPACING.sm },
  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.md,
  },
  contactIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contactInfo: { flex: 1 },
  contactLabel: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: TYPOGRAPHY.sizes.base, color: COLORS.textPrimary },
  contactValue: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
});
