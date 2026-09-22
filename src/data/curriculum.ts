export type CurriculumGroup = "MKWU" | "MKWF" | "MKWP" | "Peminatan" | "Tugas Akhir";

export type CurriculumCourse = {
  code: string;
  name: string;
  sks: number;
  group: CurriculumGroup;
  semester: number;
  prereq: string[];
  note?: string;
};

/** Kurikulum 2024 — S1 Manajemen, FEB Universitas Indonesia. */
const baseCurriculum: CurriculumCourse[] = [
  // Semester 1
  { code: "UIGE600004", name: "MPK Agama", sks: 2, group: "MKWU", semester: 1, prereq: [] },
  { code: "UIGE600003", name: "MPK Bahasa Inggris", sks: 2, group: "MKWU", semester: 1, prereq: [] },
  { code: "ECMN600001", name: "Pengantar Bisnis", sks: 2, group: "MKWF", semester: 1, prereq: [] },
  { code: "ECCL600001", name: "Literasi dalam Bahasa Inggris", sks: 2, group: "MKWF", semester: 1, prereq: [] },
  { code: "ECMN600002", name: "Pengantar Teknologi Informasi", sks: 3, group: "MKWP", semester: 1, prereq: [] },
  { code: "ECEE600002", name: "Matematika Dasar untuk Bisnis dan Ekonomi", sks: 3, group: "MKWF", semester: 1, prereq: [] },
  { code: "ECEE600001", name: "Pengantar Ekonomi 1", sks: 3, group: "MKWF", semester: 1, prereq: [] },
  { code: "ECAC600001", name: "Pengantar Akuntansi", sks: 3, group: "MKWF", semester: 1, prereq: [] },

  // Semester 2
  { code: "UIGE600007", name: "MPK Terintegrasi (MPKT)", sks: 6, group: "MKWU", semester: 2, prereq: [] },
  { code: "ECEE600003", name: "Statistika Ekonomi dan Bisnis", sks: 3, group: "MKWF", semester: 2, prereq: [] },
  { code: "ECEE600004", name: "Pengantar Ekonomi 2", sks: 3, group: "MKWF", semester: 2, prereq: ["ECEE600001"] },
  { code: "ECMN600003", name: "Pengantar Manajemen", sks: 2, group: "MKWF", semester: 2, prereq: [] },
  { code: "ECCL600004", name: "Teknik Penulisan Akademik dan Pengantar Komunikasi Bisnis", sks: 2, group: "MKWF", semester: 2, prereq: ["ECCL600001"] },
  { code: "ECMN600004", name: "Pengantar Hukum Bisnis", sks: 3, group: "MKWP", semester: 2, prereq: ["ECMN600001", "ECMN600003"] },

  // Semester 3
  { code: "ECCL600002", name: "Pengantar Kewirausahaan", sks: 2, group: "MKWF", semester: 3, prereq: [], note: "Pilih salah satu dengan Dasar-dasar Kepemimpinan" },
  { code: "ECCL600006", name: "Dasar-dasar Kepemimpinan", sks: 2, group: "MKWF", semester: 3, prereq: ["ECMN600003"], note: "Pilih salah satu dengan Pengantar Kewirausahaan" },
  { code: "ECCL600003", name: "Koperasi", sks: 2, group: "MKWF", semester: 3, prereq: [] },
  { code: "ECCL600005", name: "Manusia sebagai Pelaku Ekonomi dan Bisnis", sks: 2, group: "MKWF", semester: 3, prereq: [] },
  { code: "ECMN600005", name: "Pengantar Manajemen Sains", sks: 3, group: "MKWP", semester: 3, prereq: ["ECEE600002", "ECEE600003"] },
  { code: "ECMN600006", name: "Manajemen Keuangan", sks: 3, group: "MKWF", semester: 3, prereq: ["ECMN600001", "ECMN600003"] },
  { code: "ECMN600007", name: "Manajemen Pemasaran", sks: 3, group: "MKWP", semester: 3, prereq: ["ECMN600001", "ECMN600003"] },
  { code: "ECMN600008", name: "Perilaku Keorganisasian", sks: 3, group: "MKWP", semester: 3, prereq: ["ECMN600001", "ECMN600003"] },
  { code: "ECAC600055", name: "Akuntansi Biaya untuk Manajemen", sks: 2, group: "MKWP", semester: 3, prereq: ["ECAC600001"] },

  // Semester 4
  { code: "ECMN600009", name: "Manajemen Sumber Daya Manusia", sks: 3, group: "MKWP", semester: 4, prereq: ["ECMN600001", "ECMN600003", "ECMN600008"] },
  { code: "ECEE600007", name: "Mikroekonomi 1", sks: 3, group: "MKWP", semester: 4, prereq: ["ECEE600001", "ECEE600004"] },
  { code: "ECMN600010", name: "Manajemen Operasi", sks: 3, group: "MKWP", semester: 4, prereq: ["ECMN600001", "ECMN600003"] },
  { code: "ECMN600011", name: "Manajemen Informasi Perusahaan", sks: 3, group: "MKWP", semester: 4, prereq: ["ECMN600003", "ECMN600002"] },
  { code: "ECMN600012", name: "Pasar dan Lembaga Keuangan", sks: 3, group: "MKWP", semester: 4, prereq: ["ECMN600006", "ECMN600004"] },
  { code: "ECMN600013", name: "Struktur dan Proses Organisasi", sks: 2, group: "MKWP", semester: 4, prereq: ["ECMN600001", "ECMN600003", "ECMN600008"] },
  { code: "ECEE600005", name: "Statistik Lanjutan", sks: 3, group: "MKWP", semester: 4, prereq: ["ECEE600003"], note: "Pilih salah satu kelompok pilihan semester 4" },
  { code: "ECMN600014", name: "Perilaku Konsumen", sks: 3, group: "MKWP", semester: 4, prereq: ["ECMN600007"], note: "Pilih salah satu kelompok pilihan semester 4" },
  { code: "ECMN600015", name: "Analitika Data untuk Manajemen", sks: 3, group: "MKWP", semester: 4, prereq: ["ECMN600002", "ECEE600003", "ECMN600005"], note: "Pilih salah satu kelompok pilihan semester 4" },
  { code: "ECMN600016", name: "Dinamika Kelompok", sks: 3, group: "MKWP", semester: 4, prereq: ["ECMN600008"], note: "Pilih salah satu kelompok pilihan semester 4" },

  // Semester 5
  { code: "ECMN600017", name: "Pengambilan Keputusan Manajerial", sks: 3, group: "MKWP", semester: 5, prereq: ["ECMN600005"] },
  { code: "ECMN600018", name: "Metode Riset Bisnis", sks: 3, group: "MKWP", semester: 5, prereq: ["ECEE600003"] },
  { code: "ECAC600056", name: "Akuntansi Manajemen untuk Bisnis", sks: 2, group: "MKWP", semester: 5, prereq: ["ECAC600055"] },
  { code: "ECMN600019", name: "Pengelolaan Risiko Usaha", sks: 2, group: "MKWP", semester: 5, prereq: ["ECMN600001", "ECMN600003"] },
  { code: "ECMN600020", name: "Bisnis Internasional", sks: 3, group: "MKWP", semester: 5, prereq: ["ECMN600003"] },
  { code: "ECMN600021", name: "Analisis Laporan Keuangan", sks: 3, group: "MKWP", semester: 5, prereq: ["ECMN600006"], note: "Pilih salah satu kelompok pilihan semester 5" },
  { code: "ECMN600022", name: "Hubungan Industrial", sks: 3, group: "MKWP", semester: 5, prereq: ["ECMN600009", "ECMN600008"], note: "Pilih salah satu kelompok pilihan semester 5" },
  { code: "ECMN600023", name: "Perencanaan Pemasaran", sks: 3, group: "MKWP", semester: 5, prereq: ["ECMN600007", "ECMN600014"], note: "Pilih salah satu kelompok pilihan semester 5" },
  { code: "ECMN600024", name: "Manajemen Rantai Pasok", sks: 3, group: "MKWP", semester: 5, prereq: ["ECMN600010"], note: "Pilih salah satu kelompok pilihan semester 5" },

  // Semester 6 — peminatan (contoh jalur Pemasaran)
  { code: "ECMN600036", name: "Manajemen Distribusi", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECMN600007"] },
  { code: "ECMN600037", name: "Pemasaran Internasional", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECMN600007", "ECMN600020"] },
  { code: "ECMN600038", name: "Komunikasi Pemasaran", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECMN600007"] },
  { code: "ECMN600039", name: "Pemasaran Jasa", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECMN600007"] },
  { code: "ECMN600040", name: "Manajemen Produk dan Harga", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECMN600007"] },
  { code: "ECMN600041", name: "Pemasaran Relasional", sks: 3, group: "Peminatan", semester: 6, prereq: ["ECMN600007", "ECMN600014"] },

  // Semester 7
  { code: "ECMN600029", name: "Manajemen Stratejik", sks: 3, group: "MKWP", semester: 7, prereq: ["ECMN600006", "ECMN600007", "ECMN600010", "ECMN600009"] },
  { code: "ECMN600030", name: "Kewirausahaan", sks: 3, group: "MKWP", semester: 7, prereq: ["ECMN600001", "ECMN600003"] },
  { code: "ECMN600031", name: "Bisnis dan Ekonomi Indonesia", sks: 3, group: "MKWP", semester: 7, prereq: ["ECEE600007"] },
  { code: "ECMN600032", name: "Tanggung Jawab Sosial dan Etika Bisnis", sks: 2, group: "MKWP", semester: 7, prereq: ["ECMN600001"] },
  { code: "ECMN600026", name: "Praktikum Riset Pemasaran", sks: 3, group: "MKWP", semester: 7, prereq: ["ECMN600018", "ECMN600014", "ECMN600007"], note: "Pilih praktikum riset sesuai peminatan" },
  { code: "ECMN600025", name: "Praktikum Riset Keuangan", sks: 3, group: "MKWP", semester: 7, prereq: ["ECMN600018", "ECEE600005", "ECMN600021"], note: "Pilih praktikum riset sesuai peminatan" },
  { code: "ECMN600027", name: "Praktikum Riset Sumber Daya Manusia", sks: 3, group: "MKWP", semester: 7, prereq: ["ECMN600018", "ECMN600008", "ECMN600009"], note: "Pilih praktikum riset sesuai peminatan" },
  { code: "ECMN600028", name: "Praktikum Riset Manajemen Operasi", sks: 3, group: "MKWP", semester: 7, prereq: ["ECMN600018", "ECMN600010"], note: "Pilih praktikum riset sesuai peminatan" },

  // Semester 8
  { code: "ECMN600033", name: "Skripsi", sks: 6, group: "Tugas Akhir", semester: 8, prereq: ["ECMN600026"], note: "Pilih salah satu jalur tugas akhir" },
  { code: "ECMN600034", name: "Magang Karya Akhir", sks: 6, group: "Tugas Akhir", semester: 8, prereq: ["ECMN600026"], note: "Pilih salah satu jalur tugas akhir" },
  { code: "ECMN600035", name: "Studi Mandiri + 1 Mata Kuliah Pengganti", sks: 6, group: "Tugas Akhir", semester: 8, prereq: ["ECMN600026"], note: "Pilih salah satu jalur tugas akhir" },
];

export const baseStructure = [
  { label: "Wajib Universitas", sks: 10 },
  { label: "Wajib Fakultas", sks: 32 },
  { label: "Wajib Program Studi", sks: 67 },
  { label: "Pilihan", sks: 29 },
  { label: "Tugas Akhir", sks: 6 },
];

export const CURRENT_SEMESTER = 5;
export { baseCurriculum };

/**
 * Active curriculum for the signed-in student. Defaults to the bundled
 * Management 2024 data and is replaced once their program's curriculum
 * version is loaded from the shared catalog.
 */
export let curriculum: CurriculumCourse[] = baseCurriculum;
export let TOTAL_SKS = 145;
export let curriculumStructure = baseStructure;
export let courseByCode = new Map(baseCurriculum.map((course) => [course.code, course]));

export function applyActiveCurriculum(next: {
  courses: CurriculumCourse[];
  totalSks: number;
  structure: { label: string; sks: number }[];
}) {
  curriculum = next.courses;
  TOTAL_SKS = next.totalSks;
  curriculumStructure = next.structure;
  courseByCode = new Map(next.courses.map((course) => [course.code, course]));
}
