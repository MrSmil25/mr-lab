export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_milestones: {
        Row: {
          course_code: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          milestone_type: string
          starts_at: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_code?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          milestone_type?: string
          starts_at: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          course_code?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          milestone_type?: string
          starts_at?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
        }
        Relationships: []
      }
      course_files: {
        Row: {
          course_id: string
          created_at: string | null
          file_name: string
          file_type: string
          id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          file_name: string
          file_type: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          file_name?: string
          file_type?: string
          id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_files_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_files_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_library_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_files_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_files_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "library_courses_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_files_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_files_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_files_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_notes: {
        Row: {
          content: string | null
          course_id: string
          created_at: string | null
          file_url: string | null
          id: string
          note_type: string
          title: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          note_type: string
          title: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          note_type?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_notes_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_notes_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_library_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_notes_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_notes_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "library_courses_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_notes_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_notes_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_notes_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_resources: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          resource_type: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          resource_type: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          resource_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_resources_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_resources_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_library_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_resources_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_resources_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "library_courses_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_resources_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_resources_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_resources_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_schedules: {
        Row: {
          academic_year: number | null
          course_id: string
          created_at: string | null
          day_of_week: string
          end_time: string
          id: string
          lecturer: string | null
          room: string | null
          semester: number | null
          start_time: string
          student_id: string
        }
        Insert: {
          academic_year?: number | null
          course_id: string
          created_at?: string | null
          day_of_week: string
          end_time: string
          id?: string
          lecturer?: string | null
          room?: string | null
          semester?: number | null
          start_time: string
          student_id: string
        }
        Update: {
          academic_year?: number | null
          course_id?: string
          created_at?: string | null
          day_of_week?: string
          end_time?: string
          id?: string
          lecturer?: string | null
          room?: string | null
          semester?: number | null
          start_time?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_library_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "library_courses_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["course_id"]
          },
        ]
      }
      courses_master: {
        Row: {
          category: string | null
          course_code: string | null
          course_group: string | null
          course_name: string | null
          course_type: string | null
          created_at: string | null
          credits: number | null
          curriculum_version_id: string
          description: string | null
          id: string
          prerequisite_course_id: string | null
          prerequisite_text: string | null
          recommended_semester: number | null
        }
        Insert: {
          category?: string | null
          course_code?: string | null
          course_group?: string | null
          course_name?: string | null
          course_type?: string | null
          created_at?: string | null
          credits?: number | null
          curriculum_version_id?: string
          description?: string | null
          id?: string
          prerequisite_course_id?: string | null
          prerequisite_text?: string | null
          recommended_semester?: number | null
        }
        Update: {
          category?: string | null
          course_code?: string | null
          course_group?: string | null
          course_name?: string | null
          course_type?: string | null
          created_at?: string | null
          credits?: number | null
          curriculum_version_id?: string
          description?: string | null
          id?: string
          prerequisite_course_id?: string | null
          prerequisite_text?: string | null
          recommended_semester?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_master_curriculum_version_id_fkey"
            columns: ["curriculum_version_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["curriculum_version_id"]
          },
          {
            foreignKeyName: "courses_master_curriculum_version_id_fkey"
            columns: ["curriculum_version_id"]
            isOneToOne: false
            referencedRelation: "admin_curriculum_management_view"
            referencedColumns: ["curriculum_id"]
          },
          {
            foreignKeyName: "courses_master_curriculum_version_id_fkey"
            columns: ["curriculum_version_id"]
            isOneToOne: false
            referencedRelation: "curriculum_summary_view"
            referencedColumns: ["curriculum_id"]
          },
          {
            foreignKeyName: "courses_master_curriculum_version_id_fkey"
            columns: ["curriculum_version_id"]
            isOneToOne: false
            referencedRelation: "curriculum_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "course_library_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "courses_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "library_courses_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["course_id"]
          },
        ]
      }
      curriculum_versions: {
        Row: {
          created_at: string | null
          curriculum_year: number | null
          id: string
          is_active: boolean | null
          program_id: string
        }
        Insert: {
          created_at?: string | null
          curriculum_year?: number | null
          id?: string
          is_active?: boolean | null
          program_id?: string
        }
        Update: {
          created_at?: string | null
          curriculum_year?: number | null
          id?: string
          is_active?: boolean | null
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_versions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "curriculum_versions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "curriculum_summary_view"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "curriculum_versions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_courses: {
        Row: {
          course_name: string
          created_at: string | null
          credits: number | null
          faculty: string | null
          grade: string | null
          id: string
          semester_taken: number | null
          status: string | null
          student_id: string
          university: string | null
        }
        Insert: {
          course_name: string
          created_at?: string | null
          credits?: number | null
          faculty?: string | null
          grade?: string | null
          id?: string
          semester_taken?: number | null
          status?: string | null
          student_id: string
          university?: string | null
        }
        Update: {
          course_name?: string
          created_at?: string | null
          credits?: number | null
          faculty?: string | null
          grade?: string | null
          id?: string
          semester_taken?: number | null
          status?: string | null
          student_id?: string
          university?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "custom_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_academic_progress"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "custom_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "custom_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_dashboard_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "custom_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_home_dashboard_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "custom_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "custom_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      graduation_requirements: {
        Row: {
          created_at: string | null
          curriculum_year: number
          id: string
          minimum_elective_credit: number | null
          minimum_graduation_credit: number
          program_id: string
        }
        Insert: {
          created_at?: string | null
          curriculum_year: number
          id?: string
          minimum_elective_credit?: number | null
          minimum_graduation_credit: number
          program_id: string
        }
        Update: {
          created_at?: string | null
          curriculum_year?: number
          id?: string
          minimum_elective_credit?: number | null
          minimum_graduation_credit?: number
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduation_requirements_program_fk"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "graduation_requirements_program_fk"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "curriculum_summary_view"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "graduation_requirements_program_fk"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      management_semester_mapping: {
        Row: {
          course_code: string | null
          course_name_excel: string | null
          credits_excel: number | null
          prerequisite_name: string | null
          recommended_semester: string | null
        }
        Insert: {
          course_code?: string | null
          course_name_excel?: string | null
          credits_excel?: number | null
          prerequisite_name?: string | null
          recommended_semester?: string | null
        }
        Update: {
          course_code?: string | null
          course_name_excel?: string | null
          credits_excel?: number | null
          prerequisite_name?: string | null
          recommended_semester?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          priority: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type?: string
          priority?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          priority?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string | null
          curriculum_year: number | null
          faculty: string | null
          id: string
          minimum_graduation_credit: number | null
          program_name: string | null
          university: string
        }
        Insert: {
          created_at?: string | null
          curriculum_year?: number | null
          faculty?: string | null
          id?: string
          minimum_graduation_credit?: number | null
          program_name?: string | null
          university: string
        }
        Update: {
          created_at?: string | null
          curriculum_year?: number | null
          faculty?: string | null
          id?: string
          minimum_graduation_credit?: number | null
          program_name?: string | null
          university?: string
        }
        Relationships: []
      }
      student_course_bookmarks: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          note: string | null
          priority: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          note?: string | null
          priority?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          note?: string | null
          priority?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_course_bookmarks_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_library_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "library_courses_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_academic_progress"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_dashboard_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_home_dashboard_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_course_bookmarks_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      student_courses: {
        Row: {
          class_section: string | null
          course_id: string
          course_status: string | null
          created_at: string | null
          grade: string | null
          id: string
          lecturer: string | null
          room: string | null
          schedule: string | null
          semester_taken: number | null
          status: string | null
          student_id: string
          taken_semester: number | null
        }
        Insert: {
          class_section?: string | null
          course_id: string
          course_status?: string | null
          created_at?: string | null
          grade?: string | null
          id?: string
          lecturer?: string | null
          room?: string | null
          schedule?: string | null
          semester_taken?: number | null
          status?: string | null
          student_id: string
          taken_semester?: number | null
        }
        Update: {
          class_section?: string | null
          course_id?: string
          course_status?: string | null
          created_at?: string | null
          grade?: string | null
          id?: string
          lecturer?: string | null
          room?: string | null
          schedule?: string | null
          semester_taken?: number | null
          status?: string | null
          student_id?: string
          taken_semester?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_courses_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_courses_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_library_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_courses_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_courses_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "library_courses_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_courses_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_courses_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_courses_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_academic_progress"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_dashboard_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_home_dashboard_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_courses_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      student_krs_plan: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          planned_semester: number
          student_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          planned_semester: number
          student_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          planned_semester?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_krs_plan_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_krs_plan_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_library_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_krs_plan_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_krs_plan_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "library_courses_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_krs_plan_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_krs_plan_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_krs_plan_course_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_academic_progress"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_dashboard_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_home_dashboard_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profile: {
        Row: {
          avatar_path: string | null
          completed_credits: number | null
          current_semester: number | null
          curriculum_version_id: string | null
          entry_year: number | null
          full_name: string
          id: string
          program_id: string | null
          student_number: string | null
          target_graduation: number | null
        }
        Insert: {
          avatar_path?: string | null
          completed_credits?: number | null
          current_semester?: number | null
          curriculum_version_id?: string | null
          entry_year?: number | null
          full_name: string
          id?: string
          program_id?: string | null
          student_number?: string | null
          target_graduation?: number | null
        }
        Update: {
          avatar_path?: string | null
          completed_credits?: number | null
          current_semester?: number | null
          curriculum_version_id?: string | null
          entry_year?: number | null
          full_name?: string
          id?: string
          program_id?: string | null
          student_number?: string | null
          target_graduation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profile_curriculum_version_id_fkey"
            columns: ["curriculum_version_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["curriculum_version_id"]
          },
          {
            foreignKeyName: "student_profile_curriculum_version_id_fkey"
            columns: ["curriculum_version_id"]
            isOneToOne: false
            referencedRelation: "admin_curriculum_management_view"
            referencedColumns: ["curriculum_id"]
          },
          {
            foreignKeyName: "student_profile_curriculum_version_id_fkey"
            columns: ["curriculum_version_id"]
            isOneToOne: false
            referencedRelation: "curriculum_summary_view"
            referencedColumns: ["curriculum_id"]
          },
          {
            foreignKeyName: "student_profile_curriculum_version_id_fkey"
            columns: ["curriculum_version_id"]
            isOneToOne: false
            referencedRelation: "curriculum_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profile_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "student_profile_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "curriculum_summary_view"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "student_profile_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      student_tasks: {
        Row: {
          category: string | null
          course_code: string | null
          course_name: string | null
          created_at: string
          description: string | null
          done: boolean
          due_at: string | null
          id: string
          priority: string
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          course_code?: string | null
          course_name?: string | null
          created_at?: string
          description?: string | null
          done?: boolean
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          course_code?: string | null
          course_name?: string | null
          created_at?: string
          description?: string | null
          done?: boolean
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_app_state: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_course_management_view: {
        Row: {
          category: string | null
          course_code: string | null
          course_group: string | null
          course_id: string | null
          course_name: string | null
          course_type: string | null
          created_at: string | null
          credits: number | null
          curriculum_version_id: string | null
          curriculum_year: number | null
          description: string | null
          prerequisite_course_code: string | null
          prerequisite_course_id: string | null
          prerequisite_course_name: string | null
          prerequisite_text: string | null
          program_id: string | null
          program_name: string | null
          recommended_semester: number | null
          total_files: number | null
          total_notes: number | null
          total_resources: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "course_library_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "courses_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "library_courses_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["course_id"]
          },
        ]
      }
      admin_curriculum_management_view: {
        Row: {
          curriculum_id: string | null
          curriculum_year: number | null
          program_name: string | null
          total_courses: number | null
          total_sks: number | null
        }
        Relationships: []
      }
      admin_dashboard_view: {
        Row: {
          generated_at: string | null
          total_admin_actions: number | null
          total_courses: number | null
          total_curriculums: number | null
          total_files: number | null
          total_notes: number | null
          total_programs: number | null
          total_resources: number | null
          total_students: number | null
        }
        Relationships: []
      }
      course_library_view: {
        Row: {
          course_code: string | null
          course_id: string | null
          course_name: string | null
          course_type: string | null
          credits: number | null
          curriculum_year: number | null
          program_name: string | null
          recommended_semester: number | null
          total_notes: number | null
          total_resources: number | null
        }
        Relationships: []
      }
      curriculum_summary_view: {
        Row: {
          catalog_total_courses: number | null
          catalog_total_sks: number | null
          curriculum_id: string | null
          curriculum_year: number | null
          elective_available_sks: number | null
          elective_courses: number | null
          program_id: string | null
          program_name: string | null
          required_courses: number | null
          required_sks: number | null
        }
        Relationships: []
      }
      graduation_requirement_view: {
        Row: {
          curriculum_year: number | null
          id: string | null
          minimum_elective_credit: number | null
          minimum_graduation_credit: number | null
          program_name: string | null
        }
        Relationships: []
      }
      library_courses_view: {
        Row: {
          course_code: string | null
          course_id: string | null
          course_name: string | null
          course_type: string | null
          credits: number | null
          curriculum_year: number | null
          prerequisite_course_id: string | null
          program_name: string | null
          recommended_semester: number | null
          total_files: number | null
          total_notes: number | null
          total_resources: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "course_library_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "courses_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "library_courses_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["course_id"]
          },
        ]
      }
      notification_summary_view: {
        Row: {
          total_notifications: number | null
          unread_notifications: number | null
          user_id: string | null
        }
        Relationships: []
      }
      smart_krs_recommendation_view: {
        Row: {
          course_code: string | null
          course_id: string | null
          course_name: string | null
          course_type: string | null
          credits: number | null
          recommendation_reason: string | null
          recommendation_status: string | null
          recommended_semester: number | null
          student_id: string | null
        }
        Relationships: []
      }
      student_academic_progress: {
        Row: {
          completed_credits: number | null
          curriculum_year: number | null
          full_name: string | null
          minimum_graduation_credit: number | null
          ongoing_credits: number | null
          program_name: string | null
          student_id: string | null
          student_number: string | null
          total_taken_credits: number | null
        }
        Relationships: []
      }
      student_activity_timeline_view: {
        Row: {
          activity_month: string | null
          activity_type: string | null
          created_at: string | null
          description: string | null
          id: string | null
          reference_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          activity_month?: never
          activity_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          reference_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          activity_month?: never
          activity_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          reference_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_course_recommendation_view: {
        Row: {
          course_code: string | null
          course_id: string | null
          course_name: string | null
          course_type: string | null
          credits: number | null
          reason: string | null
          recommendation_status: string | null
          recommended_semester: number | null
          student_id: string | null
        }
        Relationships: []
      }
      student_dashboard_view: {
        Row: {
          bookmarked_courses: number | null
          completed_credits: number | null
          current_semester: number | null
          curriculum_year: number | null
          full_name: string | null
          graduation_percentage: number | null
          program_name: string | null
          remaining_credits: number | null
          student_id: string | null
          student_number: string | null
          target_graduation: number | null
          total_courses_taken: number | null
        }
        Relationships: []
      }
      student_home_dashboard_view: {
        Row: {
          bookmarked_courses: number | null
          completed_courses: number | null
          completed_credits: number | null
          current_semester: number | null
          curriculum_year: number | null
          full_name: string | null
          graduation_percentage: number | null
          locked_courses: number | null
          ongoing_courses: number | null
          planned_courses: number | null
          planned_sks: number | null
          program_name: string | null
          recommended_courses: number | null
          remaining_credits: number | null
          student_id: string | null
          student_number: string | null
          target_graduation: number | null
        }
        Relationships: []
      }
      student_krs_summary_view: {
        Row: {
          planned_semester: number | null
          planner_status: string | null
          student_id: string | null
          total_courses: number | null
          total_sks: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_academic_progress"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_dashboard_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_home_dashboard_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_krs_plan_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      student_prerequisite_check_view: {
        Row: {
          course_code: string | null
          course_id: string | null
          course_name: string | null
          credits: number | null
          eligibility: string | null
          prerequisite_course_id: string | null
          prerequisite_course_name: string | null
          reason: string | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "admin_course_management_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "course_library_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "courses_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "library_courses_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "smart_krs_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "student_course_recommendation_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_master_prerequisite_fk"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "student_prerequisite_check_view"
            referencedColumns: ["course_id"]
          },
        ]
      }
    }
    Functions: {
      admin_create_course: {
        Args: {
          p_category?: string
          p_course_code: string
          p_course_group?: string
          p_course_name: string
          p_course_type?: string
          p_credits: number
          p_curriculum_version_id: string
          p_description?: string
          p_prerequisite_course_id?: string
          p_prerequisite_text?: string
          p_recommended_semester?: number
        }
        Returns: string
      }
      admin_create_file: {
        Args: {
          p_course_id: string
          p_file_name: string
          p_file_type: string
          p_storage_path: string
        }
        Returns: string
      }
      admin_create_resource: {
        Args: {
          p_course_id: string
          p_description?: string
          p_external_url?: string
          p_file_url?: string
          p_resource_type: string
          p_title: string
        }
        Returns: string
      }
      admin_delete_course: { Args: { p_course_id: string }; Returns: boolean }
      admin_delete_file: { Args: { p_file_id: string }; Returns: boolean }
      admin_delete_resource: {
        Args: { p_resource_id: string }
        Returns: boolean
      }
      admin_update_course: {
        Args: {
          p_category?: string
          p_course_code: string
          p_course_group?: string
          p_course_id: string
          p_course_name: string
          p_course_type?: string
          p_credits: number
          p_description?: string
          p_prerequisite_course_id?: string
          p_prerequisite_text?: string
          p_recommended_semester?: number
        }
        Returns: boolean
      }
      admin_update_resource: {
        Args: {
          p_description?: string
          p_external_url?: string
          p_file_url?: string
          p_resource_id: string
          p_title: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_user_admin: { Args: { check_user_id: string }; Returns: boolean }
      require_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
