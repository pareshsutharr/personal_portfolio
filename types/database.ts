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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      career_map_steps: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_visible: boolean
          label: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          label: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          label?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          certificate_image: string | null
          created_at: string
          credential_id: string | null
          credential_url: string | null
          description: string | null
          display_order: number
          expiry_date: string | null
          id: string
          is_visible: boolean
          issue_date: string | null
          issuer: string | null
          skills: string[]
          title: string
          updated_at: string
        }
        Insert: {
          certificate_image?: string | null
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          description?: string | null
          display_order?: number
          expiry_date?: string | null
          id?: string
          is_visible?: boolean
          issue_date?: string | null
          issuer?: string | null
          skills?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          certificate_image?: string | null
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          description?: string | null
          display_order?: number
          expiry_date?: string | null
          id?: string
          is_visible?: boolean
          issue_date?: string | null
          issuer?: string | null
          skills?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_logos: {
        Row: {
          created_at: string
          display_mode: string
          display_order: number
          id: string
          is_visible: boolean
          logo_url: string | null
          name: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          display_mode?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          display_mode?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          budget: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          message: string
          name: string
          notes: string | null
          phone: string | null
          priority: Database["public"]["Enums"]["contact_priority"]
          project_type: string | null
          source: string | null
          status: Database["public"]["Enums"]["contact_status"]
          subject: string | null
          timeline: string | null
          updated_at: string
        }
        Insert: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          message: string
          name: string
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["contact_priority"]
          project_type?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string | null
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          message?: string
          name?: string
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["contact_priority"]
          project_type?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string | null
          timeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      education: {
        Row: {
          created_at: string
          degree: string
          description: string | null
          display_order: number
          end_date: string | null
          field: string | null
          grade: string | null
          id: string
          institution: string
          is_visible: boolean
          logo: string | null
          period_label: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          degree: string
          description?: string | null
          display_order?: number
          end_date?: string | null
          field?: string | null
          grade?: string | null
          id?: string
          institution: string
          is_visible?: boolean
          logo?: string | null
          period_label?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          degree?: string
          description?: string | null
          display_order?: number
          end_date?: string | null
          field?: string | null
          grade?: string | null
          id?: string
          institution?: string
          is_visible?: boolean
          logo?: string | null
          period_label?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          achievements: string[]
          company: string
          company_url: string | null
          created_at: string
          description: string | null
          display_order: number
          employment_type: Database["public"]["Enums"]["employment_type"]
          end_date: string | null
          id: string
          is_current: boolean
          is_visible: boolean
          location: string | null
          logo: string | null
          period_label: string | null
          position: string
          responsibilities: string[]
          start_date: string | null
          technologies: string[]
          updated_at: string
        }
        Insert: {
          achievements?: string[]
          company: string
          company_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          employment_type?: Database["public"]["Enums"]["employment_type"]
          end_date?: string | null
          id?: string
          is_current?: boolean
          is_visible?: boolean
          location?: string | null
          logo?: string | null
          period_label?: string | null
          position: string
          responsibilities?: string[]
          start_date?: string | null
          technologies?: string[]
          updated_at?: string
        }
        Update: {
          achievements?: string[]
          company?: string
          company_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          employment_type?: Database["public"]["Enums"]["employment_type"]
          end_date?: string | null
          id?: string
          is_current?: boolean
          is_visible?: boolean
          location?: string | null
          logo?: string | null
          period_label?: string | null
          position?: string
          responsibilities?: string[]
          start_date?: string | null
          technologies?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      industries: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_visible: boolean
          name: string
          project_count: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_visible?: boolean
          name: string
          project_count?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_visible?: boolean
          name?: string
          project_count?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          alt_text: string | null
          bucket: string
          created_at: string
          filename: string
          folder: string
          height: number | null
          id: string
          mime_type: string | null
          path: string
          size_bytes: number | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket?: string
          created_at?: string
          filename: string
          folder?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          path: string
          size_bytes?: number | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          created_at?: string
          filename?: string
          folder?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          path?: string
          size_bytes?: number | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      now_page: {
        Row: {
          current_focus: string | null
          currently_building: string | null
          currently_learning: string | null
          id: string
          is_visible: boolean
          latest_project_id: string | null
          open_to: string | null
          updated_at: string
        }
        Insert: {
          current_focus?: string | null
          currently_building?: string | null
          currently_learning?: string | null
          id?: string
          is_visible?: boolean
          latest_project_id?: string | null
          open_to?: string | null
          updated_at?: string
        }
        Update: {
          current_focus?: string | null
          currently_building?: string | null
          currently_learning?: string | null
          id?: string
          is_visible?: boolean
          latest_project_id?: string | null
          open_to?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "now_page_latest_project_id_fkey"
            columns: ["latest_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about_photo: string | null
          availability_status: Database["public"]["Enums"]["availability_status"]
          availability_text: string | null
          career_summary: string | null
          created_at: string
          cta_primary_text: string | null
          cta_secondary_text: string | null
          current_focus: string | null
          email: string | null
          full_name: string
          hero_keywords: string[]
          hero_kicker: string | null
          hero_line_1: string | null
          hero_line_2: string | null
          hero_photo: string | null
          hero_tagline: string | null
          id: string
          location: string | null
          long_bio: string | null
          looking_for: string | null
          personal_intro: string | null
          philosophy: string | null
          phone: string | null
          professional_title: string
          profile_photo: string | null
          resume_url: string | null
          short_bio: string | null
          updated_at: string
          what_i_build: string | null
          years_experience: string | null
        }
        Insert: {
          about_photo?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          availability_text?: string | null
          career_summary?: string | null
          created_at?: string
          cta_primary_text?: string | null
          cta_secondary_text?: string | null
          current_focus?: string | null
          email?: string | null
          full_name: string
          hero_keywords?: string[]
          hero_kicker?: string | null
          hero_line_1?: string | null
          hero_line_2?: string | null
          hero_photo?: string | null
          hero_tagline?: string | null
          id?: string
          location?: string | null
          long_bio?: string | null
          looking_for?: string | null
          personal_intro?: string | null
          philosophy?: string | null
          phone?: string | null
          professional_title: string
          profile_photo?: string | null
          resume_url?: string | null
          short_bio?: string | null
          updated_at?: string
          what_i_build?: string | null
          years_experience?: string | null
        }
        Update: {
          about_photo?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          availability_text?: string | null
          career_summary?: string | null
          created_at?: string
          cta_primary_text?: string | null
          cta_secondary_text?: string | null
          current_focus?: string | null
          email?: string | null
          full_name?: string
          hero_keywords?: string[]
          hero_kicker?: string | null
          hero_line_1?: string | null
          hero_line_2?: string | null
          hero_photo?: string | null
          hero_tagline?: string | null
          id?: string
          location?: string | null
          long_bio?: string | null
          looking_for?: string | null
          personal_intro?: string | null
          philosophy?: string | null
          phone?: string | null
          professional_title?: string
          profile_photo?: string | null
          resume_url?: string | null
          short_bio?: string | null
          updated_at?: string
          what_i_build?: string | null
          years_experience?: string | null
        }
        Relationships: []
      }
      project_features: {
        Row: {
          description: string | null
          display_order: number
          icon: string | null
          id: string
          project_id: string
          title: string
        }
        Insert: {
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          project_id: string
          title: string
        }
        Update: {
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_features_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_images: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          project_id: string
          type: Database["public"]["Enums"]["project_image_type"]
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          project_id: string
          type?: Database["public"]["Enums"]["project_image_type"]
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          project_id?: string
          type?: Database["public"]["Enums"]["project_image_type"]
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_technologies: {
        Row: {
          id: string
          project_id: string
          technology_id: string
        }
        Insert: {
          id?: string
          project_id: string
          technology_id: string
        }
        Update: {
          id?: string
          project_id?: string
          technology_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_technologies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_technologies_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          app_store_url: string | null
          architecture: string | null
          canonical_url: string | null
          category: string | null
          challenge: string | null
          client: string | null
          client_logo_id: string | null
          company: string | null
          confidential: boolean
          confidential_mode: Database["public"]["Enums"]["confidential_mode"]
          cover_alt: string | null
          cover_frame: string
          cover_image: string | null
          created_at: string
          deleted_at: string | null
          display_order: number
          end_date: string | null
          featured: boolean
          full_description: string | null
          github_url: string | null
          id: string
          impact: string | null
          industry_id: string | null
          live_url: string | null
          meta_description: string | null
          meta_title: string | null
          objective: string | null
          og_image: string | null
          outcome: string | null
          overview: string | null
          platforms: string[]
          play_store_url: string | null
          problem: string | null
          project_type: string | null
          responsibilities: string[]
          results: string | null
          role: string | null
          short_description: string | null
          slug: string
          solution: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          thumbnail: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["project_visibility"]
          year_label: string | null
        }
        Insert: {
          app_store_url?: string | null
          architecture?: string | null
          canonical_url?: string | null
          category?: string | null
          challenge?: string | null
          client?: string | null
          client_logo_id?: string | null
          company?: string | null
          confidential?: boolean
          confidential_mode?: Database["public"]["Enums"]["confidential_mode"]
          cover_alt?: string | null
          cover_frame?: string
          cover_image?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          end_date?: string | null
          featured?: boolean
          full_description?: string | null
          github_url?: string | null
          id?: string
          impact?: string | null
          industry_id?: string | null
          live_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          objective?: string | null
          og_image?: string | null
          outcome?: string | null
          overview?: string | null
          platforms?: string[]
          play_store_url?: string | null
          problem?: string | null
          project_type?: string | null
          responsibilities?: string[]
          results?: string | null
          role?: string | null
          short_description?: string | null
          slug: string
          solution?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          thumbnail?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["project_visibility"]
          year_label?: string | null
        }
        Update: {
          app_store_url?: string | null
          architecture?: string | null
          canonical_url?: string | null
          category?: string | null
          challenge?: string | null
          client?: string | null
          client_logo_id?: string | null
          company?: string | null
          confidential?: boolean
          confidential_mode?: Database["public"]["Enums"]["confidential_mode"]
          cover_alt?: string | null
          cover_frame?: string
          cover_image?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          end_date?: string | null
          featured?: boolean
          full_description?: string | null
          github_url?: string | null
          id?: string
          impact?: string | null
          industry_id?: string | null
          live_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          objective?: string | null
          og_image?: string | null
          outcome?: string | null
          overview?: string | null
          platforms?: string[]
          play_store_url?: string | null
          problem?: string | null
          project_type?: string | null
          responsibilities?: string[]
          results?: string | null
          role?: string | null
          short_description?: string | null
          slug?: string
          solution?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          thumbnail?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["project_visibility"]
          year_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_logo_id_fkey"
            columns: ["client_logo_id"]
            isOneToOne: false
            referencedRelation: "client_logos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      related_projects: {
        Row: {
          project_id: string
          related_project_id: string
        }
        Insert: {
          project_id: string
          related_project_id: string
        }
        Update: {
          project_id?: string
          related_project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "related_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_projects_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings: {
        Row: {
          canonical_url: string | null
          created_at: string
          favicon: string | null
          google_verification: string | null
          id: string
          keywords: string[]
          meta_description: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          site_title: string
          title_template: string
          twitter_handle: string | null
          twitter_image: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          favicon?: string | null
          google_verification?: string | null
          id?: string
          keywords?: string[]
          meta_description?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          site_title?: string
          title_template?: string
          twitter_handle?: string | null
          twitter_image?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          favicon?: string | null
          google_verification?: string | null
          id?: string
          keywords?: string[]
          meta_description?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          site_title?: string
          title_template?: string
          twitter_handle?: string | null
          twitter_image?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          featured: boolean
          icon: string | null
          id: string
          is_visible: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          icon?: string | null
          id?: string
          is_visible?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          icon?: string | null
          id?: string
          is_visible?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          copyright_text: string | null
          created_at: string
          cta_button_text: string | null
          cta_heading: string | null
          cta_subheading: string | null
          favicon_url: string | null
          footer_tagline: string | null
          ga_measurement_id: string | null
          id: string
          location: string | null
          logo_url: string | null
          notification_email: string | null
          show_now_page: boolean
          site_name: string
          theme_accent: string
          updated_at: string
          vercel_analytics_enabled: boolean
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          copyright_text?: string | null
          created_at?: string
          cta_button_text?: string | null
          cta_heading?: string | null
          cta_subheading?: string | null
          favicon_url?: string | null
          footer_tagline?: string | null
          ga_measurement_id?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          notification_email?: string | null
          show_now_page?: boolean
          site_name?: string
          theme_accent?: string
          updated_at?: string
          vercel_analytics_enabled?: boolean
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          copyright_text?: string | null
          created_at?: string
          cta_button_text?: string | null
          cta_heading?: string | null
          cta_subheading?: string | null
          favicon_url?: string | null
          footer_tagline?: string | null
          ga_measurement_id?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          notification_email?: string | null
          show_now_page?: boolean
          site_name?: string
          theme_accent?: string
          updated_at?: string
          vercel_analytics_enabled?: boolean
        }
        Relationships: []
      }
      skill_milestones: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          end_year: number | null
          id: string
          is_visible: boolean
          period_label: string
          start_year: number | null
          technologies: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          end_year?: number | null
          id?: string
          is_visible?: boolean
          period_label: string
          start_year?: number | null
          technologies?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          end_year?: number | null
          id?: string
          is_visible?: boolean
          period_label?: string
          start_year?: number | null
          technologies?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_featured: boolean
          is_visible: boolean
          name: string
          proficiency: number | null
          technology_id: string | null
          updated_at: string
          years: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["skill_category"]
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          name: string
          proficiency?: number | null
          technology_id?: string | null
          updated_at?: string
          years?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          name?: string
          proficiency?: number | null
          technology_id?: string | null
          updated_at?: string
          years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          is_visible: boolean
          platform: string
          updated_at: string
          url: string
          username: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_visible?: boolean
          platform: string
          updated_at?: string
          url: string
          username?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_visible?: boolean
          platform?: string
          updated_at?: string
          url?: string
          username?: string | null
        }
        Relationships: []
      }
      stats: {
        Row: {
          auto_source: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_visible: boolean
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          auto_source?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          label: string
          updated_at?: string
          value: string
        }
        Update: {
          auto_source?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      technologies: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["skill_category"]
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          company: string | null
          created_at: string
          description: string | null
          display_order: number
          duration: string | null
          experience_id: string | null
          id: string
          is_visible: boolean
          playlist: string | null
          playlist_url: string | null
          published_at: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration?: string | null
          experience_id?: string | null
          id?: string
          is_visible?: boolean
          playlist?: string | null
          playlist_url?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          company?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration?: string | null
          experience_id?: string | null
          id?: string
          is_visible?: boolean
          playlist?: string | null
          playlist_url?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      availability_status:
        | "available"
        | "selected_projects"
        | "open_to_opportunities"
        | "not_available"
      confidential_mode: "hidden" | "summary" | "full"
      contact_priority: "low" | "normal" | "high"
      contact_status:
        | "new"
        | "read"
        | "replied"
        | "in_discussion"
        | "converted"
        | "closed"
        | "spam"
      employment_type:
        | "full_time"
        | "part_time"
        | "internship"
        | "contract"
        | "freelance"
      project_image_type:
        | "hero"
        | "screenshot"
        | "dashboard"
        | "mobile"
        | "architecture"
        | "gallery"
      project_status: "draft" | "published" | "archived"
      project_visibility: "public" | "private" | "unlisted"
      skill_category:
        | "frontend"
        | "backend"
        | "mobile"
        | "database"
        | "devops"
        | "cloud"
        | "fintech"
        | "healthcare"
        | "seo"
        | "design"
        | "tools"
        | "services"
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
    Enums: {
      availability_status: [
        "available",
        "selected_projects",
        "open_to_opportunities",
        "not_available",
      ],
      confidential_mode: ["hidden", "summary", "full"],
      contact_priority: ["low", "normal", "high"],
      contact_status: [
        "new",
        "read",
        "replied",
        "in_discussion",
        "converted",
        "closed",
        "spam",
      ],
      employment_type: [
        "full_time",
        "part_time",
        "internship",
        "contract",
        "freelance",
      ],
      project_image_type: [
        "hero",
        "screenshot",
        "dashboard",
        "mobile",
        "architecture",
        "gallery",
      ],
      project_status: ["draft", "published", "archived"],
      project_visibility: ["public", "private", "unlisted"],
      skill_category: [
        "frontend",
        "backend",
        "mobile",
        "database",
        "devops",
        "cloud",
        "fintech",
        "healthcare",
        "seo",
        "design",
        "tools",
        "services",
      ],
    },
  },
} as const
