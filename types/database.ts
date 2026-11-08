// Tipos gerados pelo Supabase (generate_typescript_types) em 08/11/2026.
// Depois de qualquer mudança no banco, gere de novo e substitua este arquivo:
//   npx supabase gen types typescript --project-id tzmvxismprraeawibbbw > types/database.ts
//
// Cuidado: "concluida" em ocorrencias_mensais aparece como gravável, mas é uma
// coluna calculada pelo banco. Nunca envie esse campo em insert/update.

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
      eventos: {
        Row: {
          arquivado: boolean
          criado_em: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          link_externo: string | null
          marca_id: string
          nome: string
          observacao: string | null
          tipo: string
        }
        Insert: {
          arquivado?: boolean
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          link_externo?: string | null
          marca_id: string
          nome: string
          observacao?: string | null
          tipo?: string
        }
        Update: {
          arquivado?: boolean
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          link_externo?: string | null
          marca_id?: string
          nome?: string
          observacao?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_orcamento: {
        Row: {
          criado_em: string
          evento_id: string
          fornecedor: string | null
          id: string
          link_externo: string | null
          observacao: string | null
          ordem: number
          prazo_nf: string | null
          servico: string
          status_nf: string
          valor_orcado: number | null
          valor_real: number | null
        }
        Insert: {
          criado_em?: string
          evento_id: string
          fornecedor?: string | null
          id?: string
          link_externo?: string | null
          observacao?: string | null
          ordem?: number
          prazo_nf?: string | null
          servico: string
          status_nf?: string
          valor_orcado?: number | null
          valor_real?: number | null
        }
        Update: {
          criado_em?: string
          evento_id?: string
          fornecedor?: string | null
          id?: string
          link_externo?: string | null
          observacao?: string | null
          ordem?: number
          prazo_nf?: string | null
          servico?: string
          status_nf?: string
          valor_orcado?: number | null
          valor_real?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_orcamento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      marcas: {
        Row: {
          ativa: boolean
          criado_em: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativa?: boolean
          criado_em?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativa?: boolean
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      notas_recorrentes: {
        Row: {
          ativa: boolean
          criado_em: string
          dia_vencimento: number
          id: string
          marca_id: string
          nome: string
          observacao: string | null
          valor_previsto: number | null
        }
        Insert: {
          ativa?: boolean
          criado_em?: string
          dia_vencimento: number
          id?: string
          marca_id: string
          nome: string
          observacao?: string | null
          valor_previsto?: number | null
        }
        Update: {
          ativa?: boolean
          criado_em?: string
          dia_vencimento?: number
          id?: string
          marca_id?: string
          nome?: string
          observacao?: string | null
          valor_previsto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_recorrentes_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias_mensais: {
        Row: {
          check_marcado: boolean
          concluida: boolean | null
          criado_em: string
          id: string
          mes_referencia: string
          nome: string
          nota_recorrente_id: string
          observacao: string | null
          valor_previsto: number | null
          valor_real: number | null
          vencimento: string
        }
        Insert: {
          check_marcado?: boolean
          concluida?: boolean | null
          criado_em?: string
          id?: string
          mes_referencia: string
          nome: string
          nota_recorrente_id: string
          observacao?: string | null
          valor_previsto?: number | null
          valor_real?: number | null
          vencimento: string
        }
        Update: {
          check_marcado?: boolean
          concluida?: boolean | null
          criado_em?: string
          id?: string
          mes_referencia?: string
          nome?: string
          nota_recorrente_id?: string
          observacao?: string | null
          valor_previsto?: number | null
          valor_real?: number | null
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_mensais_nota_recorrente_id_fkey"
            columns: ["nota_recorrente_id"]
            isOneToOne: false
            referencedRelation: "notas_recorrentes"
            referencedColumns: ["id"]
          },
        ]
      }
      secoes: {
        Row: {
          criado_em: string
          evento_id: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          criado_em?: string
          evento_id: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          criado_em?: string
          evento_id?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "secoes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      subtarefas: {
        Row: {
          concluida: boolean
          concluida_em: string | null
          criado_em: string
          descricao: string
          id: string
          observacao: string | null
          ordem: number
          prazo: string | null
          tarefa_id: string
        }
        Insert: {
          concluida?: boolean
          concluida_em?: string | null
          criado_em?: string
          descricao: string
          id?: string
          observacao?: string | null
          ordem?: number
          prazo?: string | null
          tarefa_id: string
        }
        Update: {
          concluida?: boolean
          concluida_em?: string | null
          criado_em?: string
          descricao?: string
          id?: string
          observacao?: string | null
          ordem?: number
          prazo?: string | null
          tarefa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtarefas_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          concluida: boolean
          concluida_em: string | null
          criado_em: string
          descricao: string
          id: string
          link_externo: string | null
          observacao: string | null
          ordem: number
          prazo: string | null
          secao_id: string
        }
        Insert: {
          concluida?: boolean
          concluida_em?: string | null
          criado_em?: string
          descricao: string
          id?: string
          link_externo?: string | null
          observacao?: string | null
          ordem?: number
          prazo?: string | null
          secao_id: string
        }
        Update: {
          concluida?: boolean
          concluida_em?: string | null
          criado_em?: string
          descricao?: string
          id?: string
          link_externo?: string | null
          observacao?: string | null
          ordem?: number
          prazo?: string | null
          secao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_secao_id_fkey"
            columns: ["secao_id"]
            isOneToOne: false
            referencedRelation: "secoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_pendencias: {
        Row: {
          data: string | null
          detalhe: string | null
          evento_id: string | null
          evento_nome: string | null
          falta_valor_real: boolean | null
          id: string | null
          marca_id: string | null
          marca_nome: string | null
          tipo: string | null
          titulo: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      gerar_ocorrencias: { Args: { p_mes: string }; Returns: undefined }
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
