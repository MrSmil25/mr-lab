export type StudentProfile = {
  name: string;
  initials: string;
  program: string;
  faculty: string;
  university: string;
  entryYear: number;
  currentSemester: number;
  semesterLabel: string;
  targetGpa: number;
  targetSks: number;
};

export const studentProfile: StudentProfile = {
  name: "",
  initials: "",
  program: "",
  faculty: "",
  university: "",
  entryYear: new Date().getFullYear(),
  currentSemester: 1,
  semesterLabel: "Semester berjalan",
  targetGpa: 0,
  targetSks: 144,
};


export const profileLine = `${studentProfile.program} ${studentProfile.faculty.replace("Fakultas Ekonomi dan Bisnis", "FEB")} ${studentProfile.university.replace("Universitas Indonesia", "UI")}`;
