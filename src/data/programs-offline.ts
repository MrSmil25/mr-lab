import type { CurriculumCourse } from "@/data/curriculum";

/**
 * Bundled curriculum master data, so program detection works even before the
 * shared cloud catalog is available.
 */

export type OfflineProgram = {
  id: string;
  code: string;
  name: string;
  faculty: string;
  university: string;
  degree: string;
  curriculumYear: number;
  totalSks: number;
};

export const accountingProgram: OfflineProgram = {
  id: "fallback-s1-ak-ui",
  code: "S1-AK-UI",
  name: "Akuntansi",
  faculty: "Fakultas Ekonomi dan Bisnis",
  university: "Universitas Indonesia",
  degree: "Sarjana (S1)",
  curriculumYear: 2024,
  totalSks: 144,
};

/** Kurikulum 2024 — S1 Akuntansi, FEB Universitas Indonesia. */
export const accountingCurriculum: CurriculumCourse[] = [
  // Semester 1
  { code: "UIGE600004", name: "MPK Agama", sks: 2, group: "MKWU", semester: 1, prereq: [] },
  { code: "UIGE600003", name: "MPK Bahasa Inggris", sks: 2, group: "MKWU", semester: 1, prereq: [] },
  { code: "ECAC600001", name: "Pengantar Akuntansi", sks: 3, group: "MKWF", semester: 1, prereq: [] },
  { code: "ECEE600001", name: "Pengantar Ekonomi 1", sks: 3, group: "MKWF", semester: 1, prereq: [] },
  { code: "ECEE600002", name: "Matematika Dasar untuk Bisnis dan Ekonomi", sks: 3, group: "MKWF", semester: 1, prereq: [] },
  { code: "ECMN600001", name: "Pengantar Bisnis", sks: 2, group: "MKWF", semester: 1, prereq: [] },
  { code: "ECCL600001", name: "Literasi dalam Bahasa Inggris", sks: 2, group: "MKWF", semester: 1, prereq: [] },

  // Semester 2
  { code: "UIGE600007", name: "MPK Terintegrasi (MPKT)", sks: 6, group: "MKWU", semester: 2, prereq: [] },
  { code: "ECAC600002", name: "Akuntansi Keuangan 1", sks: 3, group: "MKWP", semester: 2, prereq: ["ECAC600001"] },
  { code: "ECEE600003", name: "Statistika Ekonomi dan Bisnis", sks: 3, group: "MKWF", semester: 2, prereq: [] },
  { code: "ECEE600004", name: "Pengantar Ekonomi 2", sks: 3, group: "MKWF", semester: 2, prereq: ["ECEE600001"] },
  { code: "ECMN600003", name: "Pengantar Manajemen", sks: 2, group: "MKWF", semester: 2, prereq: [] },
  { code: "ECCL600004", name: "Teknik Penulisan Akademik dan Pengantar Komunikasi Bisnis", sks: 2, group: "MKWF", semester: 2, prereq: ["ECCL600001"] },

  // Semester 3
  { code: "ECAC600003", name: "Akuntansi Keuangan 2", sks: 3, group: "MKWP", semester: 3, prereq: ["ECAC600002"] },
  { code: "ECAC600004", name: "Akuntansi Biaya", sks: 3, group: "MKWP", semester: 3, prereq: ["ECAC600001"] },
  { code: "ECAC600005", name: "Sistem Informasi Akuntansi", sks: 3, group: "MKWP", semester: 3, prereq: ["ECAC600001"] },
  { code: "ECMN600004", name: "Pengantar Hukum Bisnis", sks: 3, group: "MKWP", semester: 3, prereq: ["ECMN600001"] },
  { code: "ECMN600006", name: "Manajemen Keuangan", sks: 3, group: "MKWF", semester: 3, prereq: ["ECMN600001", "ECMN600003"] },
  { code: "ECCL600002", name: "Pengantar Kewirausahaan", sks: 2, group: "MKWF", semester: 3, prereq: [] },

  // Semester 4
  { code: "ECAC600006", name: "Akuntansi Keuangan Lanjutan", sks: 3, group: "MKWP", semester: 4, prereq: ["ECAC600003"] },
  { code: "ECAC600007", name: "Akuntansi Manajemen", sks: 3, group: "MKWP", semester: 4, prereq: ["ECAC600004"] },
  { code: "ECAC600008", name: "Perpajakan", sks: 3, group: "MKWP", semester: 4, prereq: ["ECAC600002"] },
  { code: "ECAC600009", name: "Pengauditan 1", sks: 3, group: "MKWP", semester: 4, prereq: ["ECAC600003", "ECAC600005"] },
  { code: "ECEE600007", name: "Mikroekonomi 1", sks: 3, group: "MKWP", semester: 4, prereq: ["ECEE600001", "ECEE600004"] },
  { code: "ECMN600007", name: "Manajemen Pemasaran", sks: 3, group: "MKWF", semester: 4, prereq: ["ECMN600003"] },

  // Semester 5
  { code: "ECAC600010", name: "Pengauditan 2", sks: 3, group: "MKWP", semester: 5, prereq: ["ECAC600009"] },
  { code: "ECAC600011", name: "Akuntansi Perpajakan", sks: 3, group: "MKWP", semester: 5, prereq: ["ECAC600008"] },
  { code: "ECAC600012", name: "Analisis Laporan Keuangan", sks: 3, group: "MKWP", semester: 5, prereq: ["ECAC600003", "ECMN600006"] },
  { code: "ECAC600013", name: "Akuntansi Sektor Publik", sks: 3, group: "MKWP", semester: 5, prereq: ["ECAC600002"] },
  { code: "ECAC600014", name: "Metode Riset Akuntansi", sks: 3, group: "MKWP", semester: 5, prereq: ["ECEE600003"] },
  { code: "ECAC600015", name: "Tata Kelola dan Etika Profesi Akuntan", sks: 3, group: "MKWP", semester: 5, prereq: ["ECAC600009"] },

  // Semester 6 — peminatan
  { code: "ECAC600020", name: "Akuntansi Keberlanjutan", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECAC600003"] },
  { code: "ECAC600021", name: "Audit Internal", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECAC600009"] },
  { code: "ECAC600022", name: "Akuntansi Forensik", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECAC600009"] },
  { code: "ECAC600023", name: "Sistem Pengendalian Manajemen", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECAC600007"] },
  { code: "ECAC600024", name: "Analitika Data Akuntansi", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECAC600005", "ECEE600003"] },
  { code: "ECAC600025", name: "Perpajakan Internasional", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECAC600008"] },

  // Semester 7
  { code: "ECAC600030", name: "Teori Akuntansi", sks: 3, group: "MKWP", semester: 7, prereq: ["ECAC600006"] },
  { code: "ECAC600031", name: "Seminar Akuntansi Keuangan", sks: 3, group: "MKWP", semester: 7, prereq: ["ECAC600006", "ECAC600014"] },
  { code: "ECAC600032", name: "Praktikum Audit", sks: 3, group: "MKWP", semester: 7, prereq: ["ECAC600010"] },
  { code: "ECMN600032", name: "Tanggung Jawab Sosial dan Etika Bisnis", sks: 2, group: "MKWP", semester: 7, prereq: ["ECMN600001"] },
  { code: "ECMN600029", name: "Manajemen Stratejik", sks: 3, group: "MKWP", semester: 7, prereq: ["ECMN600006", "ECMN600007"] },

  // Semester 8
  { code: "ECAC600040", name: "Skripsi", sks: 6, group: "Tugas Akhir", semester: 8, prereq: ["ECAC600014"], note: "Pilih salah satu jalur tugas akhir" },
  { code: "ECAC600041", name: "Magang Karya Akhir", sks: 6, group: "Tugas Akhir", semester: 8, prereq: ["ECAC600014"], note: "Pilih salah satu jalur tugas akhir" },
  { code: "ECAC600042", name: "Studi Mandiri + 1 Mata Kuliah Pengganti", sks: 6, group: "Tugas Akhir", semester: 8, prereq: ["ECAC600014"], note: "Pilih salah satu jalur tugas akhir" },
];
