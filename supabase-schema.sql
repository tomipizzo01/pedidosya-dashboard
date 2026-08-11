-- ═══════════════════════════════════════════════════════════════
-- SCHEMA COMPLETO — Gestor Finanzas Cadete
-- Ejecutar en: Supabase > SQL Editor > New Query
-- ═══════════════════════════════════════════════════════════════

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLA: USUARIOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(50)  UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  nombre        VARCHAR(100),
  email         VARCHAR(200),
  rol           VARCHAR(20)  DEFAULT 'cadete',
  activo        BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── TABLA: REGISTROS DIARIOS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS registros_diarios (
  id            BIGSERIAL    PRIMARY KEY,
  fecha         DATE         NOT NULL UNIQUE,
  dia_semana    VARCHAR(20),
  saldo_inicial NUMERIC(12,2) DEFAULT 0,
  total_generado NUMERIC(12,2) DEFAULT 0,
  efectivo      NUMERIC(12,2) DEFAULT 0,
  por_app       NUMERIC(12,2) DEFAULT 0,
  nafta         NUMERIC(12,2) DEFAULT 0,
  comida        NUMERIC(12,2) DEFAULT 0,
  otros_gastos  NUMERIC(12,2) DEFAULT 0,
  horas         NUMERIC(4,1),
  pedidos       INTEGER       DEFAULT 0,
  km            NUMERIC(8,1),
  clima         VARCHAR(50),
  temperatura   INTEGER,
  energia       INTEGER       CHECK (energia BETWEEN 1 AND 10),
  notas         TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── VISTA: REGISTROS CON CÁLCULOS ──────────────────────────────
CREATE OR REPLACE VIEW registros_con_calculos AS
SELECT
  *,
  COALESCE(saldo_inicial,0)  + COALESCE(total_generado,0) AS total_dia,
  COALESCE(nafta,0) + COALESCE(comida,0) + COALESCE(otros_gastos,0) AS total_gastos,
  COALESCE(saldo_inicial,0)  + COALESCE(total_generado,0)
    - COALESCE(nafta,0) - COALESCE(comida,0) - COALESCE(otros_gastos,0) AS ganancia_real,
  CASE WHEN NULLIF(horas,0) IS NOT NULL
    THEN ROUND((COALESCE(saldo_inicial,0) + COALESCE(total_generado,0)
      - COALESCE(nafta,0) - COALESCE(comida,0) - COALESCE(otros_gastos,0)) / horas)
  END AS ganancia_por_hora,
  CASE WHEN pedidos IS NOT NULL AND pedidos > 0
    THEN ROUND((COALESCE(saldo_inicial,0) + COALESCE(total_generado,0)
      - COALESCE(nafta,0) - COALESCE(comida,0) - COALESCE(otros_gastos,0)) / pedidos)
  END AS ganancia_por_pedido,
  CASE WHEN km IS NOT NULL AND pedidos IS NOT NULL AND pedidos > 0
    THEN ROUND(km::numeric / pedidos, 1)
  END AS km_por_pedido
FROM registros_diarios;

-- ── TABLA: CONFIGURACIÓN ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion (
  id                          BIGSERIAL     PRIMARY KEY,
  nombre_cadete               VARCHAR(100),
  zona_trabajo                VARCHAR(200),
  meta_diaria                 NUMERIC(12,2) DEFAULT 20000,
  meta_semanal                NUMERIC(12,2) DEFAULT 130000,
  meta_mensual                NUMERIC(12,2) DEFAULT 600000,
  horas_max_dia               NUMERIC(4,1)  DEFAULT 10,
  precio_nafta                NUMERIC(8,2)  DEFAULT 1420,
  capacidad_tanque            NUMERIC(6,2)  DEFAULT 14,
  km_por_litro                NUMERIC(5,1)  DEFAULT 25,
  consumo_l_100km             NUMERIC(4,1)  DEFAULT 5.2,
  vehiculo                    VARCHAR(100)  DEFAULT 'Moto 150cc',
  ciudad                      VARCHAR(100)  DEFAULT 'Tucumán',
  moneda                      VARCHAR(10)   DEFAULT 'ARS',
  email_reporte               VARCHAR(200),
  whatsapp_numero             VARCHAR(30),
  enviar_reporte_automatico   BOOLEAN       DEFAULT FALSE,
  reportes_semanales          BOOLEAN       DEFAULT TRUE,
  reportes_mensuales          BOOLEAN       DEFAULT TRUE,
  updated_at                  TIMESTAMPTZ   DEFAULT NOW()
);

-- Fila única de configuración
INSERT INTO configuracion (ciudad, nombre_cadete)
VALUES ('Tucumán', 'Cadete')
ON CONFLICT DO NOTHING;

-- ── TRIGGERS: updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_registros_updated_at
  BEFORE UPDATE ON registros_diarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_config_updated_at
  BEFORE UPDATE ON configuracion
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────
-- El service_role key (backend) bypasea RLS automáticamente.
-- El anon key NO puede acceder a nada.

ALTER TABLE usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_anon_usuarios"   ON usuarios          FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_registros"  ON registros_diarios FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_config"     ON configuracion     FOR ALL TO anon USING (false);

-- ── ÍNDICES ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros_diarios(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_registros_dia   ON registros_diarios(dia_semana);
