export type LibraryEntry = { id: number; title: string; type: string; course: string; detail: string };

export const libraryIndex: LibraryEntry[] = [
  { id: 1, title: "Core textbook — selected chapters", type: "Books", course: "Akuntansi Manajemen untuk Bisnis", detail: "PDF · 8.2 MB" },
  { id: 2, title: "Lecture slides — Week 5", type: "Lecture Slides", course: "Akuntansi Manajemen untuk Bisnis", detail: "PPTX · 4.1 MB" },
  { id: 3, title: "Weekly practice set", type: "Practice Questions", course: "Akuntansi Manajemen untuk Bisnis", detail: "PDF · 640 KB" },
  { id: 4, title: "Industry case reference", type: "Articles", course: "Manajemen Produk dan Harga", detail: "hbr.org" },
  { id: 5, title: "FEB UI digital collection", type: "External References", course: "All courses", detail: "lib.ui.ac.id" },
  { id: 6, title: "Pricing ladder case pack", type: "Practice Questions", course: "Manajemen Produk dan Harga", detail: "PDF · 1.2 MB" },
  { id: 7, title: "Market entry comparison table", type: "Books", course: "Bisnis Internasional", detail: "PDF · 2.4 MB" },
  { id: 8, title: "Defense question bank", type: "Practice Questions", course: "Metode Riset Bisnis", detail: "PDF · 380 KB" },
  { id: 9, title: "Research methods handbook", type: "Books", course: "Metode Riset Bisnis", detail: "PDF · 11.6 MB" },
];
