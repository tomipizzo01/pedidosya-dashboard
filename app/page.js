"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const INFO = {
  nombre: "Nicolas Acosta",
  plataforma: "PedidosYa",
  ciudad: "Tucumán",
  vehiculo: "Moto",
  inicioRegistro: "15/05/2026",
  saldoInicial: 50000,
  metaMensual: 600000,
};

const REFRESH_INTERVAL = 60 * 1000; // 60 segundos

// ── Helpers ────────────────────────────────────────────────────────────────

const pesos = (v) =>
  v == null ? "—" : "$" + Number(v).toLocaleString("es-AR", { minimumFractionDigits: 0 });

const pct = (v) => (v == null ? "—" : Number(v).toFixed(1) + "%");

function fmt(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

// ── UI primitives ──────────────────────────────────────────────────────────

function Badge({ ok, children }) {
  const base = "inline-block px-2 py-0.5 rounded text-xs font-semibold";
  if (ok === true) return <span className={`${base} bg-emerald-900 text-emerald-300`}>{children}</span>;
  if (ok === false) return <span className={`${base} bg-red-900 text-red-300`}>{children}</span>;
  return <span className={`${base} bg-slate-700 text-slate-300`}>{children}</span>;
}

function SectionTitle({ emoji, title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-8 rounded bg-brand" />
      <h2 className="text-xl font-bold text-white">{emoji} {title}</h2>
    </div>
  );
}

function Card({ label, value, sub, color }) {
  return (
    <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-[#2a3045] flex flex-col gap-1 transition-colors duration-150 hover:border-[#3a4060] hover:bg-[#1e2438]">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${color || "text-brand"}`}>{value}</span>
      {sub && <span className="text-xs text-slate-500 mt-1">{sub}</span>}
    </div>
  );
}

function TableWrapper({ children }) {
  return (
    <div className="overflow-x-auto scrollbar-thin rounded-xl border border-[#2a3045]">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

const Th = ({ children, className = "" }) => (
  <th className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap ${className}`}>
    {children}
  </th>
);
const Td = ({ children, className = "", title }) => (
  <td className={`px-4 py-3 text-sm text-slate-200 whitespace-nowrap tabular-nums ${className}`} title={title}>{children}</td>
);
const Tr = ({ children }) => (
  <tr className="border-t border-[#2a3045] hover:bg-[#1e2540] transition-colors">{children}</tr>
);
const EmptyRow = ({ cols, msg = "Sin datos registrados aún" }) => (
  <tr><td colSpan={cols} className="px-4 py-8 text-center text-slate-500 italic">{msg}</td></tr>
);

// ── BarChart (dataviz skill) ───────────────────────────────────────────────
// Forma: barras verticales — ideal para comparar magnitudes entre categorías.
// Colores: categorical fijo (#FA0050 brand + tonos del sistema).
// Hover: tooltip nativo sobre cada barra.
// Accesibilidad: la tabla preexistente actúa como fallback de datos.

function BarChart({ data, formatValue = (v) => String(v), height = 140, barColor = "#FA0050" }) {
  const [hovered, setHovered] = useState(null);
  const values = data.map(d => d.value ?? 0);
  const max = Math.max(...values, 1);

  return (
    <div className="relative select-none" style={{ height }} aria-hidden="true">
      <div className="flex items-end gap-[3px] h-full pt-6">
        {data.map((d, i) => {
          const pct = (Math.max(d.value ?? 0, 0) / max) * 100;
          const isHov = hovered === i;
          const hasValue = (d.value ?? 0) > 0;
          return (
            <div
              key={i}
              className="flex flex-col items-center flex-1 h-full justify-end relative"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHov && hasValue && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-[#0e1118] border border-[#2a3045] text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10 font-bold shadow-xl pointer-events-none">
                  {formatValue(d.value)}
                </div>
              )}
              <div
                className="w-full rounded-t-[3px] transition-all duration-150 ease-out cursor-default"
                style={{
                  height: hasValue ? `${Math.max(pct, 1.5)}%` : "2px",
                  backgroundColor: isHov ? "#ff3060" : barColor,
                  opacity: hasValue ? (isHov ? 1 : 0.78) : 0.2,
                }}
              />
              <div className="text-[9px] text-slate-500 mt-1 text-center leading-tight truncate w-full px-[1px]">
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
      {/* Línea base */}
      <div className="absolute bottom-[18px] left-0 right-0 h-px bg-[#2a3045]" />
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none space-y-4" aria-hidden="true">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-[#1a1f2e] rounded-2xl h-24 border border-[#2a3045]" />
        ))}
      </div>
      <div className="bg-[#1a1f2e] rounded-2xl h-40 border border-[#2a3045]" />
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────

function Header({ lastUpdated, refreshing, onRefresh }) {
  return (
    <header className="bg-gradient-to-r from-[#E31837] to-[#8B0000] px-6 py-8 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl" aria-hidden="true">🛵</div>
            <span className="text-white/80 text-sm font-medium tracking-widest uppercase">PedidosYa · Tucumán</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight" style={{ textWrap: "balance" }}>Gestor de Finanzas</h1>
          <p className="text-white/70 mt-1 text-sm">
            Cadete: <span className="text-white font-semibold">{INFO.nombre}</span> · Desde {INFO.inicioRegistro}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 rounded-xl px-4 py-3 text-center min-w-[120px]">
            <div className="text-white/60 text-xs uppercase">Saldo inicial/día</div>
            <div className="text-white font-bold text-lg">{pesos(INFO.saldoInicial)}</div>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 text-center min-w-[120px]">
            <div className="text-white/60 text-xs uppercase">Meta mensual</div>
            <div className="text-white font-bold text-lg">{pesos(INFO.metaMensual)}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              aria-label={refreshing ? "Actualizando datos…" : "Actualizar datos ahora"}
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#8B0000] disabled:opacity-50"
            >
              <span aria-hidden="true">{refreshing ? "⏳" : "🔄"}</span> {refreshing ? "Actualizando…" : "Actualizar"}
            </button>
            <span className="text-white/50 text-xs tabular-nums" aria-live="polite">
              {lastUpdated ? `Actualizado: ${fmt(lastUpdated)}` : ""}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────

function NavTabs({ active, setActive }) {
  const tabs = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "turnos", label: "📋 Turnos" },
    { id: "ranking", label: "🏆 Ranking" },
    { id: "proyecciones", label: "🎯 Proyecciones" },
    { id: "eficiencia", label: "⚡ Eficiencia" },
    { id: "mantenimiento", label: "🔧 Mantenimiento" },
    { id: "guia",         label: "📬 Guía de Correos" },
  ];
  return (
    <nav className="bg-[#13161f] border-b border-[#2a3045] sticky top-0 z-30" aria-label="Secciones del panel">
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-thin">
        <div className="flex gap-1 py-2 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              aria-current={active === t.id ? "page" : undefined}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#13161f] ${
                active === t.id ? "bg-brand text-white" : "text-slate-400 hover:text-white hover:bg-[#1e2433]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ── Secciones ──────────────────────────────────────────────────────────────

function SectionDashboard({ resumen, registroDiario }) {
  const r = resumen || {};
  const gananciaTotal = r.gananciaTotal ?? 0;
  const pctMeta = Math.min((gananciaTotal / INFO.metaMensual) * 100, 100);

  return (
    <div>
      <SectionTitle emoji="📊" title="Dashboard General" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Card label="Días trabajados" value={r.diasTrabajados ?? "—"} sub="Con datos registrados" color="text-blue-400" />
        <Card label="Ganancia real total" value={pesos(r.gananciaTotal)} sub="Período completo" color="text-emerald-400" />
        <Card label="Total gastos" value={pesos(r.gastoTotal)} sub="Nafta + Comida + Otros" color="text-red-400" />
        <Card label="Total pedidos" value={r.pedidosTotal ?? "—"} sub="Registro diario" color="text-purple-400" />
        <Card label="KM recorridos" value={r.kmTotal != null ? r.kmTotal + " km" : "—"} sub="Distancia acumulada" color="text-yellow-400" />
        <Card label="Horas trabajadas" value={r.horasTotal != null ? r.horasTotal + " hs" : "—"} sub="Tiempo total en calle" color="text-orange-400" />
        <Card label="Horas especiales ⭐" value={r.hrsEspeciales != null ? r.hrsEspeciales + " hs" : "—"} sub="Meta semana: 13 hs" color="text-pink-400" />
        <Card label="% Aceptación prom." value={pct(r.acepProm)} sub="Meta: 100%" color="text-teal-400" />
      </div>

      {/* Progreso meta mensual */}
      <div className="bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-6 mb-6">
        <div className="flex justify-between mb-3">
          <div>
            <div className="text-slate-400 text-xs uppercase">Progreso meta mensual</div>
            <div className="text-white font-bold text-xl">{pesos(gananciaTotal)} / {pesos(INFO.metaMensual)}</div>
          </div>
          <div className="text-right">
            <div className="text-brand font-bold text-2xl">{pctMeta.toFixed(1)}%</div>
            <div className="text-slate-500 text-xs">alcanzado</div>
          </div>
        </div>
        <div className="w-full bg-[#13161f] rounded-full h-4 overflow-hidden">
          <div className="h-4 rounded-full bg-gradient-to-r from-brand to-orange-500 transition-[width] duration-700 motion-reduce:transition-none"
            style={{ width: `${pctMeta}%` }} />
        </div>
      </div>

      {/* Lógica de ingresos */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-[#2a3045] p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">ℹ️ Lógica de ingresos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          {[
            ["💵 Saldo Inicial Diario", `${pesos(INFO.saldoInicial)} / día`],
            ["➕ Total Generado", "Lo que generaste en la app"],
            ["💰 Total Día", "Saldo Inicial + Total Generado"],
            ["💰 Ganancia Real", "Total Día − Gastos (nafta + comida + otros)"],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#13161f] rounded-xl p-3">
              <div className="text-slate-400 text-xs mb-1">{k}</div>
              <div className="text-white font-medium">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart: ganancia últimos 14 días */}
      {registroDiario && registroDiario.length > 0 && (
        <div className="bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-5 mb-6">
          <h3 className="text-slate-300 font-semibold mb-1 text-sm">📈 Ganancia real — últimos días</h3>
          <p className="text-slate-500 text-xs mb-4">Pasá el cursor sobre las barras para ver el monto exacto</p>
          <BarChart
            height={130}
            data={[...registroDiario].slice(-14).map(r => ({
              label: r.fecha ? r.fecha.split('/').slice(0,2).join('/') : "—",
              value: r.gananciaReal ?? 0,
            }))}
            formatValue={pesos}
          />
        </div>
      )}

      {/* Últimos registros */}
      {registroDiario && registroDiario.length > 0 && (
        <div className="mt-6">
          <h3 className="text-slate-300 font-semibold mb-3">📅 Últimos días registrados</h3>
          <TableWrapper>
            <thead className="bg-[#13161f]">
              <tr>
                <Th>Fecha</Th><Th>Día</Th><Th>Saldo Inicial</Th><Th>Generado</Th>
                <Th>Efectivo</Th><Th>Por App</Th><Th>Gastos</Th><Th>Ganancia Real</Th>
                <Th>Horas</Th><Th>Pedidos</Th><Th>KM</Th><Th>$/Hora</Th>
              </tr>
            </thead>
            <tbody className="bg-[#1a1f2e]">
              {[...registroDiario].reverse().slice(0, 10).map((r, i) => (
                <Tr key={i}>
                  <Td className="font-medium text-white">{r.fecha}</Td>
                  <Td className="text-slate-400">{r.dia}</Td>
                  <Td>{pesos(r.saldoInicial)}</Td>
                  <Td className="text-emerald-400">{pesos(r.totalGenerado)}</Td>
                  <Td>{pesos(r.efectivo)}</Td>
                  <Td>{pesos(r.porApp)}</Td>
                  <Td className="text-red-400">{pesos(r.totalGastos)}</Td>
                  <Td className={`font-bold ${(r.gananciaReal || 0) >= 20000 ? "text-emerald-400" : "text-red-400"}`}>
                    {pesos(r.gananciaReal)}
                  </Td>
                  <Td>{r.horas ?? "—"}</Td>
                  <Td>{r.pedidos ?? "—"}</Td>
                  <Td>{r.km ?? "—"}</Td>
                  <Td>{pesos(r.xHora)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrapper>
        </div>
      )}
    </div>
  );
}

function SectionTurnos({ turnos }) {
  const t = turnos || [];
  const presentes = t.filter(x => x.presento);
  const hrsEsp = t.filter(x => x.especial && x.presento).reduce((a, x) => a + (x.hrsEspecial || 0), 0);
  const pedidos = presentes.filter(x => x.pedidos).reduce((a, x) => a + x.pedidos, 0);
  const aceps = t.filter(x => x.aceptacion != null).map(x => x.aceptacion);
  const acepProm = aceps.length ? (aceps.reduce((a, b) => a + b, 0) / aceps.length).toFixed(1) : null;

  return (
    <div>
      <SectionTitle emoji="📋" title="Registro de Turnos" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card label="Turnos completados" value={`${presentes.length} / ${t.length}`} color="text-blue-400" />
        <Card label="Hs. especiales ⭐" value={hrsEsp.toFixed(1) + " hs"} sub="Meta: 13 hs/semana" color="text-orange-400" />
        <Card label="Total pedidos" value={pedidos} color="text-purple-400" />
        <Card label="Aceptación prom." value={acepProm ? acepProm + "%" : "—"} sub="Meta: 100%" color="text-teal-400" />
      </div>
      <TableWrapper>
        <thead className="bg-[#13161f]">
          <tr>
            <Th>Fecha</Th><Th>N°</Th><Th>Inicio</Th><Th>Fin</Th><Th>Duración</Th>
            <Th>Zona</Th><Th>Especial</Th><Th>Hs. especial</Th><Th>Asistió</Th>
            <Th>Pedidos</Th><Th>Aceptación</Th><Th>Nota</Th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1f2e]">
          {t.length === 0 ? <EmptyRow cols={12} /> : t.map((x, i) => (
            <Tr key={i}>
              <Td className="font-medium text-white">{x.fecha}</Td>
              <Td>{x.n}</Td>
              <Td>{x.inicio}</Td>
              <Td>{x.fin}</Td>
              <Td>{x.duracion} hs</Td>
              <Td>{x.zona}</Td>
              <Td>{x.especial ? <Badge ok={true}>⭐ Sí</Badge> : <span className="text-slate-500">No</span>}</Td>
              <Td>{x.hrsEspecial ? x.hrsEspecial + " hs" : "—"}</Td>
              <Td>{x.presento ? <Badge ok={true}>✅ Sí</Badge> : <Badge ok={false}>❌ No</Badge>}</Td>
              <Td>{x.pedidos ?? "—"}</Td>
              <Td>
                {x.aceptacion != null ? (
                  <span className={x.aceptacion === 100 ? "text-emerald-400 font-semibold" : x.aceptacion >= 95 ? "text-yellow-400" : "text-red-400"}>
                    {x.aceptacion}%
                  </span>
                ) : "—"}
              </Td>
              <Td className="text-slate-500 max-w-[220px] truncate" title={x.nota || undefined}>{x.nota || "—"}</Td>
            </Tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  );
}

function SectionRanking({ ranking }) {
  const rk = ranking || [];
  return (
    <div>
      <SectionTitle emoji="🏆" title="Ranking Semanal" />
      {rk.length === 0 ? (
        <p className="text-slate-500 italic">Sin semanas registradas aún.</p>
      ) : rk.map((s, i) => (
        <div key={i} className="bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <span className="text-slate-400 text-sm">Semana {s.n}</span>
              <h3 className="text-white font-bold text-lg">{s.desde} → {s.hasta}</h3>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="bg-[#13161f] rounded-xl px-4 py-2 text-center">
                <div className="text-xs text-slate-400">Grupo estimado</div>
                <div className="text-yellow-400 font-bold">{s.grupoEstimado || "—"}</div>
              </div>
              {s.grupoReal && (
                <div className="bg-emerald-900/40 border border-emerald-700 rounded-xl px-4 py-2 text-center">
                  <div className="text-xs text-slate-400">Grupo real (app)</div>
                  <div className="text-emerald-400 font-bold">{s.grupoReal}</div>
                </div>
              )}
              {s.dia && (
                <div className="bg-[#13161f] rounded-xl px-4 py-2 text-center">
                  <div className="text-xs text-slate-400">Sacar turnos</div>
                  <div className="text-white font-bold">{s.dia} {s.hora}</div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Pedidos", val: s.pedidos ?? "—", meta: s.metaPedidos, ok: s.pedidos != null && s.pedidos >= (s.metaPedidos || 190) },
              { label: "Hs. especiales ⭐", val: s.hrsEspecial != null ? s.hrsEspecial + " hs" : "—", meta: (s.metaHrs || 13) + " hs", ok: s.hrsEspecial != null && s.hrsEspecial >= (s.metaHrs || 13) },
              { label: "Aceptación %", val: pct(s.aceptacion), meta: pct(s.metaAcep || 100), ok: s.aceptacion != null && s.aceptacion >= (s.metaAcep || 100) },
              { label: "No presentaciones", val: s.noPresent ?? "—", meta: s.metaNoPresent ?? 0, ok: s.noPresent != null && s.noPresent <= (s.metaNoPresent || 0) },
              { label: "Hs. real vs plan", val: s.hrsRealVsPlan || "—", meta: "—", ok: null },
            ].map(({ label, val, meta, ok }) => (
              <div key={label} className="bg-[#13161f] rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-2">{label}</div>
                <div className={`text-xl font-bold ${ok === true ? "text-emerald-400" : ok === false ? "text-red-400" : "text-white"}`}>{val}</div>
                <div className="text-xs text-slate-500 mt-1">Meta: {meta}</div>
                {ok !== null && <div className="mt-2">{ok ? <Badge ok={true}>OK ✅</Badge> : <Badge ok={false}>Bajo ⚠️</Badge>}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionProyecciones({ registroDiario }) {
  const rd = registroDiario || [];
  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const anioActual = hoy.getFullYear();
  const parseDate = (s) => { const [d, m, a] = String(s).split('/'); return new Date(a, m - 1, d); };

  const registrosMes = rd.filter(r => {
    try { const d = parseDate(r.fecha); return d.getMonth() === mesActual && d.getFullYear() === anioActual; } catch { return false; }
  });

  const ganAcumulada = registrosMes.reduce((a, r) => a + (r.gananciaReal || 0), 0);
  const diasTrabMes = registrosMes.filter(r => r.gananciaReal != null).length;
  const promDia = diasTrabMes ? ganAcumulada / diasTrabMes : null;
  const diasRestantes = new Date(anioActual, mesActual + 1, 0).getDate() - hoy.getDate();
  const proyeccion = promDia != null ? ganAcumulada + promDia * diasRestantes : null;
  const pctMeta = (ganAcumulada / INFO.metaMensual) * 100;

  return (
    <div>
      <SectionTitle emoji="🎯" title="Proyecciones y Metas" />
      <div className="bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <div className="text-slate-400 text-sm">Ganancia acumulada este mes</div>
            <div className="text-emerald-400 font-bold text-2xl">{pesos(ganAcumulada)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-sm">Meta mensual</div>
            <div className="text-white font-bold text-2xl">{pesos(INFO.metaMensual)}</div>
          </div>
        </div>
        <div className="w-full bg-[#13161f] rounded-full h-4 overflow-hidden">
          <div className="h-4 rounded-full bg-gradient-to-r from-brand to-orange-500 transition-[width] duration-700 motion-reduce:transition-none"
            style={{ width: `${Math.min(pctMeta, 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>{pctMeta.toFixed(1)}% alcanzado</span>
          <span>{diasRestantes} días restantes del mes</span>
        </div>
      </div>

      <TableWrapper>
        <thead className="bg-[#13161f]">
          <tr><Th>Indicador</Th><Th>Valor</Th><Th>Detalle</Th></tr>
        </thead>
        <tbody className="bg-[#1a1f2e]">
          {[
            ["📅 Días trabajados este mes", diasTrabMes, "Días con ganancia registrada"],
            ["💹 Ganancia acumulada ($)", pesos(ganAcumulada), "Suma del mes actual"],
            ["📈 Promedio ganancia/día", pesos(promDia), "Diario promedio del mes"],
            ["🔮 Proyección fin de mes", pesos(proyeccion), "Si mantiene el ritmo actual"],
            ["🎯 Meta mensual", pesos(INFO.metaMensual), ""],
            ["✅ Avance sobre la meta", pct(pctMeta), ""],
            ["📆 Días restantes", diasRestantes, "Hasta fin del mes"],
          ].map(([ind, val, det]) => (
            <Tr key={ind}>
              <Td className="text-slate-300 font-medium">{ind}</Td>
              <Td className="text-white font-semibold">{val}</Td>
              <Td className="text-slate-400">{det}</Td>
            </Tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  );
}

function SectionEficiencia({ registroDiario }) {
  const rd = registroDiario || [];

  // Agrupar por clima
  const byClima = {};
  const byDia = { Lunes: [], Martes: [], Miércoles: [], Jueves: [], Viernes: [], Sábado: [], Domingo: [] };
  const byEnergia = { 1: [], 2: [], 3: [], 4: [], 5: [] };

  rd.forEach(r => {
    if (r.clima) {
      if (!byClima[r.clima]) byClima[r.clima] = [];
      byClima[r.clima].push(r);
    }
    if (r.dia && byDia[r.dia]) byDia[r.dia].push(r);
    if (r.energia && byEnergia[r.energia]) byEnergia[r.energia].push(r);
  });

  const avg = (arr, key) => {
    const vals = arr.map(r => r[key]).filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  return (
    <div className="space-y-8">
      <SectionTitle emoji="⚡" title="Análisis de Eficiencia" />

      {/* Chart: ganancia por día de semana */}
      <div className="bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-5">
        <h3 className="text-slate-300 font-semibold mb-1 text-sm">📅 Ganancia promedio por día de semana</h3>
        <p className="text-slate-500 text-xs mb-4">Promedio histórico de ganancia real por cada día</p>
        <BarChart
          height={130}
          data={Object.entries(byDia).map(([dia, rows]) => ({
            label: dia.slice(0, 3),
            value: avg(rows, 'gananciaReal') ?? 0,
          }))}
          formatValue={pesos}
        />
      </div>

      {/* Por día de semana */}
      <div>
        <h3 className="text-slate-300 font-semibold mb-3">📅 Rendimiento por día de semana</h3>
        <TableWrapper>
          <thead className="bg-[#13161f]">
            <tr>
              <Th>Día</Th><Th>Días trab.</Th><Th>Gan. prom. ($)</Th>
              <Th>Pedidos prom.</Th><Th>KM prom.</Th><Th>Hs. prom.</Th><Th>$/Hora prom.</Th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1f2e]">
            {Object.entries(byDia).map(([dia, rows]) => (
              <Tr key={dia}>
                <Td className="font-medium">{dia}</Td>
                <Td>{rows.length > 0 ? <span className="text-brand font-bold">{rows.length}</span> : 0}</Td>
                <Td>{pesos(avg(rows, 'gananciaReal'))}</Td>
                <Td>{avg(rows, 'pedidos')?.toFixed(1) ?? "—"}</Td>
                <Td>{avg(rows, 'km')?.toFixed(1) ?? "—"}</Td>
                <Td>{avg(rows, 'horas')?.toFixed(1) ?? "—"}</Td>
                <Td>{pesos(avg(rows, 'xHora'))}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>

      {/* Chart: ganancia por clima */}
      {Object.keys(byClima).length > 0 && (
        <div className="bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-5">
          <h3 className="text-slate-300 font-semibold mb-1 text-sm">🌤️ Ganancia promedio por clima</h3>
          <p className="text-slate-500 text-xs mb-4">Impacto del clima en la ganancia diaria promedio</p>
          <BarChart
            height={110}
            barColor="#3b82f6"
            data={Object.entries(byClima).map(([clima, rows]) => ({
              label: clima.slice(0, 4),
              value: avg(rows, 'gananciaReal') ?? 0,
            }))}
            formatValue={pesos}
          />
        </div>
      )}

      {/* Por clima */}
      {Object.keys(byClima).length > 0 && (
        <div>
          <h3 className="text-slate-300 font-semibold mb-3">🌤️ Rendimiento por clima</h3>
          <TableWrapper>
            <thead className="bg-[#13161f]">
              <tr>
                <Th>Clima</Th><Th>Días</Th><Th>Gan. prom. ($)</Th>
                <Th>Pedidos prom.</Th><Th>KM prom.</Th>
              </tr>
            </thead>
            <tbody className="bg-[#1a1f2e]">
              {Object.entries(byClima).map(([clima, rows]) => (
                <Tr key={clima}>
                  <Td className="font-medium">{clima}</Td>
                  <Td>{rows.length}</Td>
                  <Td>{pesos(avg(rows, 'gananciaReal'))}</Td>
                  <Td>{avg(rows, 'pedidos')?.toFixed(1) ?? "—"}</Td>
                  <Td>{avg(rows, 'km')?.toFixed(1) ?? "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrapper>
        </div>
      )}

      {/* Por energía */}
      <div>
        <h3 className="text-slate-300 font-semibold mb-3">⚡ Rendimiento por nivel de energía</h3>
        <TableWrapper>
          <thead className="bg-[#13161f]">
            <tr>
              <Th>Nivel</Th><Th>Días</Th><Th>Gan. prom. ($)</Th><Th>Pedidos prom.</Th><Th>KM prom.</Th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1f2e]">
            {[["1 — Muy bajo", 1], ["2 — Bajo", 2], ["3 — Normal", 3], ["4 — Bueno", 4], ["5 — Excelente", 5]].map(([label, key]) => {
              const rows = byEnergia[key] || [];
              return (
                <Tr key={key}>
                  <Td>{label}</Td>
                  <Td>{rows.length}</Td>
                  <Td>{pesos(avg(rows, 'gananciaReal'))}</Td>
                  <Td>{avg(rows, 'pedidos')?.toFixed(1) ?? "—"}</Td>
                  <Td>{avg(rows, 'km')?.toFixed(1) ?? "—"}</Td>
                </Tr>
              );
            })}
          </tbody>
        </TableWrapper>
      </div>

      {/* Umbrales */}
      <div className="bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-5">
        <h3 className="text-slate-300 font-semibold mb-4">⚙️ Umbrales de alertas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[["⏰ Horas máx./día", "14 hs"], ["💸 Ganancia mín./día", "$20.000"], ["💵 KM máx./día", "180 km"], ["📦 Pedidos mín./día", "2"]].map(([l, v]) => (
            <div key={l} className="bg-[#13161f] rounded-xl p-3">
              <div className="text-slate-400 text-xs mb-1">{l}</div>
              <div className="text-white font-bold">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionMantenimiento({ mantenimiento }) {
  const mt = mantenimiento || [];
  const totalGastado = mt.reduce((a, r) => a + (r.costo || 0), 0);
  const ultimo = mt[mt.length - 1];
  const proximoKm = mt.map(r => r.proximoKm).filter(Boolean).sort((a, b) => a - b)[0];

  return (
    <div>
      <SectionTitle emoji="🔧" title="Mantenimiento de Moto" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card label="💸 Total gastado" value={pesos(totalGastado || null)} color="text-red-400" />
        <Card label="📍 Próximo service (KM)" value={proximoKm ?? "—"} color="text-yellow-400" />
        <Card label="🔢 Servicios registrados" value={mt.length} color="text-blue-400" />
        <Card label="🔩 Último tipo" value={ultimo?.tipo ?? "—"} color="text-slate-300" />
        <Card label="📆 Fecha último service" value={ultimo?.fecha ?? "—"} color="text-slate-300" />
        <Card label="📅 Costo promedio/mes" value={mt.length ? pesos(totalGastado / Math.max(1, mt.length)) : "—"} color="text-orange-400" />
      </div>
      <TableWrapper>
        <thead className="bg-[#13161f]">
          <tr>
            <Th>Fecha</Th><Th>Tipo</Th><Th>Descripción</Th>
            <Th>KM al momento</Th><Th>Costo ($)</Th><Th>Próximo KM</Th><Th>Notas</Th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1f2e]">
          {mt.length === 0 ? <EmptyRow cols={7} msg="Sin servicios de mantenimiento registrados aún." /> : mt.map((m, i) => (
            <Tr key={i}>
              <Td className="font-medium text-white">{m.fecha}</Td>
              <Td><Badge ok={null}>{m.tipo}</Badge></Td>
              <Td>{m.descripcion}</Td>
              <Td>{m.km ?? "—"} km</Td>
              <Td className="text-red-400">{pesos(m.costo)}</Td>
              <Td>{m.proximoKm ?? "—"} km</Td>
              <Td className="text-slate-400 max-w-[220px] truncate" title={m.notas || undefined}>{m.notas || "—"}</Td>
            </Tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  );
}

// ── Sección Guía de Correos ────────────────────────────────────────────────

function GuiaEmailCard({ icon, iconBg, tag, tagColor, title, freq, desc, items }) {
  return (
    <div className="bg-[#1a1f2e] rounded-2xl border border-[#2a3045] overflow-hidden mb-4">
      <div className="flex items-start gap-4 p-5 border-b border-[#2a3045]">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${iconBg}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded-full mb-1 ${tagColor}`}>{tag}</span>
          <div className="text-white font-bold text-sm mb-0.5">{title}</div>
          <div className="text-slate-500 text-xs">{freq}</div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-slate-300 text-sm leading-relaxed mb-4">{desc}</p>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-start bg-[#13161f] rounded-xl p-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.dot}`} />
              <div>
                <div className="text-white text-xs font-semibold mb-0.5">{item.title}</div>
                <div className="text-slate-400 text-xs leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GuiaScenario({ title, children }) {
  return (
    <div className="bg-[#1a1f2e] border border-[#2a3045] border-l-4 border-l-brand rounded-xl p-4 mb-3">
      <div className="text-white text-sm font-bold mb-2">{title}</div>
      <div className="text-slate-300 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function GuiaFaq() {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q: "¿Cuándo llegan los correos?", a: "Todos los correos son semanales y automáticos. Se envían el lunes a la mañana con los datos de la semana anterior. No hay que hacer nada — siempre que haya datos cargados en la planilla, los correos llegan solos." },
    { q: "¿Qué pasa si una semana no trabajé?", a: "El sistema envía el correo igual, pero con los totales en cero. Los promedios históricos toman en cuenta solo las semanas con datos reales, así que una semana sin datos no arruina los análisis anteriores." },
    { q: "¿Qué hago si veo un número que me parece incorrecto?", a: "Primero revisá la planilla de Google Sheets para ese período. El correo muestra exactamente lo que está cargado. Si hay un error, corregís el dato en la planilla y el próximo correo ya va a reflejar la corrección." },
    { q: "¿Por qué algunas filas del correo muestran $0?", a: "Si ves $0 en una sección (por ejemplo 'Clima: Tormenta — $0'), significa que esa semana no hubo registros con ese dato. Si todos los días registraste 'Soleado', la fila de Tormenta va a ser $0. Es correcto, no es un error." },
    { q: "¿Qué significa el 'nivel de energía' y cómo lo elijo?", a: "Es una escala del 1 al 5 que completás al registrar el turno, según cómo te sentiste: 1 = muy cansado, 3 = día normal, 5 = con toda la energía. No hay respuesta correcta — solo importa que sea honesto, porque así el análisis tiene valor real." },
    { q: "¿Por qué Emilia recibe correos de los turnos de Nico?", a: "Porque la economía del hogar depende del trabajo de Nico, y la transparencia fortalece la planificación familiar. Emilia recibe versiones adaptadas — no todos los datos técnicos, sino los que le permiten planificar gastos y estar alineada con la situación financiera real." },
    { q: "¿Cuánto tiempo hay que usar el sistema para que los datos sean útiles?", a: "Los primeros correos ya muestran datos útiles desde la primera semana. Pero los análisis más valiosos — detectar patrones de días, correlaciones de clima o energía — necesitan al menos 3 o 4 semanas de datos para ser confiables. Después de un mes de uso consistente, los insights son imposibles de ver a ojo." },
    { q: "¿Qué pasa si me olvido de registrar datos de un día?", a: "Podés cargarlos después — la planilla acepta entradas con fechas pasadas. Lo ideal es hacerlo antes del lunes para que el correo de esa semana ya los incluya. Si los cargás después del envío, no afectan el correo ya enviado, pero quedan en el historial para análisis futuros." },
    { q: "¿Puedo pedir que se cambie algo en los correos?", a: "Sí. Los correos son configurables. Si una sección no es útil, si querés agregar un tipo de análisis, o si el lenguaje de alguna parte no se entiende, podés pedirle al administrador del sistema que lo modifique." },
  ];
  return (
    <div className="flex flex-col gap-2">
      {faqs.map((f, i) => (
        <div key={i} className="bg-[#1a1f2e] rounded-xl border border-[#2a3045] overflow-hidden">
          <button
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-white hover:bg-[#1e2540] transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span>{f.q}</span>
            <span
              aria-hidden="true"
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-200 ${open === i ? "bg-brand text-white rotate-180" : "bg-[#2a3045] text-slate-400"}`}
            >▼</span>
          </button>
          <div
            className="overflow-hidden transition-all duration-200 ease-out"
            style={{ maxHeight: open === i ? "400px" : "0px" }}
          >
            <div className="px-4 pb-4 text-slate-300 text-sm leading-relaxed border-t border-[#2a3045] pt-3">
              {f.a}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionGuia() {
  const [subTab, setSubTab] = useState("nico");
  const subTabs = [
    { id: "nico",   label: "Para Nicolás" },
    { id: "emilia", label: "Para Emilia" },
    { id: "datos",  label: "Por qué registrar" },
    { id: "faq",    label: "Preguntas frecuentes" },
  ];

  return (
    <div>
      <SectionTitle emoji="📬" title="Guía de Correos" />

      {/* Sub-nav */}
      <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-thin pb-1">
        {subTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              subTab === t.id ? "bg-brand text-white" : "text-slate-400 hover:text-white hover:bg-[#1e2433] bg-[#1a1f2e] border border-[#2a3045]"
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Para Nicolás ── */}
      {subTab === "nico" && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Card label="Correos por semana" value="3" color="text-brand" />
            <Card label="Métricas analizadas" value="20+" color="text-emerald-400" />
            <Card label="Automáticos" value="100%" color="text-blue-400" />
          </div>
          <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-3.5 mb-5 text-blue-300 text-sm leading-relaxed">
            <strong className="text-blue-200">¿De dónde vienen estos correos?</strong> El sistema analiza automáticamente todos los datos que cargás en la planilla de Google Sheets y te envía un resumen cada semana. Con solo registrar tus turnos, el análisis se genera solo.
          </div>
          <GuiaEmailCard
            icon="📊" iconBg="bg-red-500/15"
            tag="Solo para Nicolás" tagColor="bg-red-500/15 text-red-400"
            title='Análisis de eficiencia · [fecha al fecha]'
            freq="Semanal · Todos los lunes con el resumen de la semana anterior"
            desc="El correo más completo. Analiza tus patrones de trabajo para identificar cuándo, en qué condiciones y bajo qué circunstancias ganás más. No solo dice cuánto ganaste — explica por qué."
            items={[
              { dot: "bg-red-500",    title: "Rendimiento por Día de la Semana", desc: "Muestra cuánto ganaste cada día con un gráfico de barras. Detecta automáticamente tu mejor y peor día: ej. 'Mejor día: Lunes ($135.000) / Peor día: Domingo ($0)'." },
              { dot: "bg-emerald-500",title: "Rendimiento Histórico Diario", desc: "Tabla con ganancia promedio y pedidos por día de la semana. Útil para ver si hay días que sistemáticamente rinden mejor a lo largo del tiempo." },
              { dot: "bg-blue-500",   title: "Distribución por Franja Horaria", desc: "Divide tu ganancia en Mañana, Tarde y Noche. Si ganás más a la noche pero trabajás más a la tarde, el sistema te lo señala para re-organizar tus horarios." },
              { dot: "bg-yellow-500", title: "Impacto de las Variables del Clima", desc: "Compara ganancia y pedidos según el clima registrado: Soleado, Nublado, Lluvia o Tormenta. Descubrís si vale la pena salir en días de lluvia o si tormenta = más pedidos pero mismo dinero." },
              { dot: "bg-red-500",    title: "Nivel de Energía Personal vs Ganancia", desc: "Cruza el nivel de energía que declaraste (1 a 5) con tu ganancia real. Si los días de energía 5 ganaste el doble que en días de energía 1, el sistema te lo muestra en números concretos." },
              { dot: "bg-emerald-500",title: "Insights Accionables", desc: "3 o 4 recomendaciones concretas derivadas de tus propios datos de esa semana. No son consejos genéricos — son específicos para vos." },
            ]}
          />
          <GuiaEmailCard
            icon="📈" iconBg="bg-emerald-500/15"
            tag="Solo para Nicolás" tagColor="bg-red-500/15 text-red-400"
            title="Reporte mensual de Nico"
            freq="Semanal · Se envía junto con el de eficiencia"
            desc="Mira hacia adelante y hacia atrás: muestra cómo vas en el mes actual y proyecta cuánto podrías cerrar el mes si seguís al ritmo de las últimas semanas."
            items={[
              { dot: "bg-emerald-500", title: "Desempeño Gráfico", desc: "Gráfico visual de tu rendimiento semanal. Permite ver si estás en una tendencia ascendente o descendente." },
              { dot: "bg-blue-500",    title: "Perspectiva de Estabilidad Familiar", desc: "Proyección del ingreso mensual estimado. Le da a Emilia una idea de cuánto dinero va a entrar ese mes para planificar los gastos del hogar." },
            ]}
          />
          <GuiaEmailCard
            icon="🔧" iconBg="bg-yellow-500/15"
            tag="Solo para Nicolás" tagColor="bg-red-500/15 text-red-400"
            title="Estado de tu moto · [fecha]"
            freq="Semanal · Resumen del estado y gastos de la moto"
            desc="Tu moto es tu herramienta de trabajo. Este correo registra todos los gastos de mantenimiento, los compara con tu ganancia y te advierte si los costos están comiendo demasiado de tu ingreso."
            items={[
              { dot: "bg-yellow-500", title: "Estado del Mantenimiento", desc: "Lista todos los gastos de la moto registrados en la semana: nafta, aceite, reparaciones, neumáticos. Cada gasto con fecha y monto." },
              { dot: "bg-red-500",    title: "Deducción sobre Ganancia", desc: "Calcula qué porcentaje de tu ganancia bruta se fue en mantenimiento. Si ganaste $200.000 y gastaste $40.000 en la moto, ese número es el 20%. Te ayuda a entender cuánto ganás realmente (neto)." },
              { dot: "bg-emerald-500",title: "Previsión de Fondos", desc: "Proyección de cuánto queda disponible después de descontar los gastos de la moto. La base para planificar el mes." },
            ]}
          />
        </div>
      )}

      {/* ── Para Emilia ── */}
      {subTab === "emilia" && (
        <div>
          <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-3.5 mb-5 text-blue-300 text-sm leading-relaxed">
            <strong className="text-blue-200">Para Emilia:</strong> Recibís correos diseñados específicamente para vos — resúmenes financieros del hogar con lenguaje claro, sin jerga técnica. La idea es que puedas planificar los gastos del mes con información real y actualizada cada semana.
          </div>
          <GuiaEmailCard
            icon="📋" iconBg="bg-blue-500/15"
            tag="Solo para Emilia" tagColor="bg-blue-500/15 text-blue-400"
            title="Eficiencia de Nico · [fecha al fecha]"
            freq="Semanal · Versión simplificada del análisis de eficiencia"
            desc="Es la versión del análisis de eficiencia adaptada para que lo entiendas sin ser del rubro. Te muestra lo más importante: cuánto ganó Nico, cuáles fueron sus mejores momentos y qué factores influyeron."
            items={[
              { dot: "bg-blue-500",    title: "Resumen de la Semana", desc: "Ganancia total, pedidos totales y promedio diario. Los tres números clave para entender cómo fue la semana de un vistazo." },
              { dot: "bg-emerald-500", title: "Mejor y Peor Momento", desc: "Te indica en qué día y horario Nico rindió mejor. Útil para planificar actividades familiares en los días de menor actividad." },
              { dot: "bg-yellow-500",  title: "Factores que Afectaron el Desempeño", desc: "Resumen del impacto del clima y la energía personal. Si hubo una semana mala, podés ver si fue por lluvia, energía baja, o simplemente pocos pedidos en la zona." },
            ]}
          />
          <GuiaEmailCard
            icon="💰" iconBg="bg-yellow-500/15"
            tag="Solo para Emilia" tagColor="bg-blue-500/15 text-blue-400"
            title="Gastos de la moto · [fecha]"
            freq="Semanal · Resumen financiero del hogar"
            desc="El correo más importante para la economía del hogar. Muestra cuánto se gastó en la moto esa semana y cuánto dinero queda disponible para el hogar después de esos gastos."
            items={[
              { dot: "bg-yellow-500", title: "Detalle de Gastos", desc: "Lista de cada gasto registrado en la moto con fecha y monto. Transparencia total — podés ver exactamente en qué se gastó." },
              { dot: "bg-red-500",    title: "Deducción sobre Ganancia", desc: "El porcentaje de la ganancia bruta que se fue en mantenimiento. Si este número sube semana a semana, puede ser señal de que la moto necesita un service preventivo." },
              { dot: "bg-emerald-500",title: "Previsión de Fondos del Hogar", desc: "La ganancia neta estimada disponible para el hogar. Este es el número con el que planificar el mes: alquiler, comida, servicios, ahorro." },
            ]}
          />
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3.5 mb-5 text-yellow-300 text-sm leading-relaxed">
            <strong className="text-yellow-200">Tip para Emilia:</strong> Si ves que el porcentaje de deducción fue mayor al 20%, es buen momento para hablar con Nico sobre ese gasto. Mejor gastar $10.000 en mantenimiento preventivo que $80.000 en una reparación de emergencia.
          </div>
          <p className="text-white font-bold mb-1">Ejemplo real: cómo usar estos correos</p>
          <p className="text-slate-400 text-sm mb-3">Situación típica de una semana para Emilia</p>
          <GuiaScenario title="Emilia planifica los gastos del mes">
            Emilia recibe el lunes el correo "Gastos de la moto". Ve que Nico ganó{" "}
            <span className="bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded text-xs">$320.000 brutos</span>{" "}
            esa semana, pero hubo un gasto de{" "}
            <span className="bg-red-500/20 text-red-400 font-semibold px-1.5 py-0.5 rounded text-xs">$45.000 en neumáticos</span>.
            Le quedan disponibles{" "}
            <span className="bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded text-xs">$275.000 netos</span>.
            <br /><br />
            Con ese dato puede decidir cuánto destinar al supermercado sin esperar que Nico cuente el efectivo.
            <strong className="text-white"> Sin el correo</strong>: dependería de que Nico recuerde contarle el gasto, o lo descubriría cuando ya es tarde.
          </GuiaScenario>
        </div>
      )}

      {/* ── Por qué registrar datos ── */}
      {subTab === "datos" && (
        <div>
          <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-3.5 mb-5 text-blue-300 text-sm leading-relaxed">
            <strong className="text-blue-200">La regla de oro:</strong> El sistema solo puede analizar lo que existe. Si no registrás el clima, la columna de clima aparece vacía. Si no registrás la energía, no hay análisis de energía.{" "}
            <strong className="text-blue-200">Cada campo que no completás es un análisis que no podés leer.</strong>
          </div>
          <p className="text-white font-bold mb-1">¿Qué datos hay que registrar?</p>
          <p className="text-slate-400 text-sm mb-3">Por cada turno que hacés, el sistema necesita esta información</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {[
              { label: "Fecha", val: "📅 El día del turno", why: "Permite separar por día de semana y calcular totales semanales/mensuales." },
              { label: "Ganancia", val: "💵 Monto en pesos", why: "El número más importante. Sin él, ningún análisis financiero es posible." },
              { label: "Pedidos", val: "📦 Cantidad", why: "Permite calcular ganancia por pedido y detectar si bajan los pedidos o el valor de cada uno." },
              { label: "Franja Horaria", val: "🕐 Mañana / Tarde / Noche", why: "El análisis de franja solo funciona si registrás en qué horario trabajaste." },
              { label: "Clima", val: "🌤 Soleado/Nublado/Lluvia/Tormenta", why: "Sin este dato, la tabla de 'Impacto del Clima' no puede mostrarte si la lluvia te beneficia o perjudica." },
              { label: "Nivel de Energía", val: "⚡ Del 1 al 5", why: "Revela si hay correlación entre cómo te sentís y cuánto rendís. Información que no existe en ningún otro lado." },
            ].map((d, i) => (
              <div key={i} className="bg-[#1a1f2e] rounded-xl border border-[#2a3045] p-4">
                <div className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-1">{d.label}</div>
                <div className="text-white font-semibold text-sm mb-1">{d.val}</div>
                <div className="text-slate-400 text-xs leading-relaxed">{d.why}</div>
              </div>
            ))}
          </div>

          <p className="text-white font-bold mb-1">¿Qué pasa si no registrás?</p>
          <p className="text-slate-400 text-sm mb-3">La diferencia entre un correo completo y uno con datos faltantes</p>

          {[
            {
              theme: "Clima",
              bad: ["La columna 'Volumen Pedidos' muestra {PED_LLUVIA} en lugar de números", "No podés saber si conviene salir en días de lluvia", "El análisis de clima queda vacío o con ceros"],
              good: ["La tabla muestra pedidos reales por cada tipo de clima", "El sistema detecta que lluvia = más pedidos pero menos ganancia por pedido", "Podés decidir si vale la pena mojarse con datos reales"],
            },
            {
              theme: "Nivel de energía",
              bad: ["La sección 'Energía vs Ganancia' queda con todos ceros", "No sabés si los días que te sentís mal realmente rendís menos", "No podés planificar tus días fuertes estratégicamente"],
              good: ["El sistema muestra que en días de energía 5 ganás $80.000 más en promedio", "Sabés que si te sentís mal, mejor hacer un turno corto", "Podés reservar los días de mayor demanda para cuando estés en tu mejor estado"],
            },
          ].map((c, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-red-500/8 border border-red-500/25 rounded-xl p-4">
                <div className="text-xs font-bold tracking-widest uppercase text-red-400 mb-3">❌ Sin datos de {c.theme}</div>
                {c.bad.map((b, j) => <div key={j} className="text-slate-300 text-xs py-1.5 border-b border-[#2a3045] last:border-b-0">{b}</div>)}
              </div>
              <div className="bg-emerald-500/8 border border-emerald-500/25 rounded-xl p-4">
                <div className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-3">✅ Con datos de {c.theme}</div>
                {c.good.map((g, j) => <div key={j} className="text-slate-300 text-xs py-1.5 border-b border-[#2a3045] last:border-b-0">{g}</div>)}
              </div>
            </div>
          ))}

          <p className="text-white font-bold mt-6 mb-1">Situaciones de ejemplo</p>
          <p className="text-slate-400 text-sm mb-3">Para entender el valor real de cada dato registrado</p>

          <GuiaScenario title="Escenario 1: ¿Me conviene salir cuando llueve?">
            Nicolás nota que cuando llueve tiene más trabajo pero llega agotado. ¿Vale la pena?
            <br /><br />
            Después de 4 semanas registrando el clima, el correo le muestra:{" "}
            <span className="bg-red-500/20 text-red-400 font-semibold px-1.5 py-0.5 rounded text-xs">Lluvia: 18 pedidos · $11.500/pedido</span>{" "}
            vs{" "}
            <span className="bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded text-xs">Soleado: 12 pedidos · $13.200/pedido</span>.
            <br /><br />
            Con ese dato podés decidir si salir en lluvia es una elección personal, no económica.
          </GuiaScenario>

          <GuiaScenario title="Escenario 2: Los viernes me parece que rindo mejor">
            Nicolás siempre sintió que los viernes eran sus mejores días, pero no tenía forma de probarlo.
            <br /><br />
            El correo le muestra:{" "}
            <span className="bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded text-xs">Viernes: $145.000 promedio</span>{" "}
            vs{" "}
            <span className="bg-red-500/20 text-red-400 font-semibold px-1.5 py-0.5 rounded text-xs">Miércoles: $67.000 promedio</span>.
            Ahora puede decidir más horas los viernes, y tomarse los miércoles más tranquilo sin culpa.
          </GuiaScenario>

          <GuiaScenario title="Escenario 3: La moto come demasiado del sueldo">
            Emilia nota que esa semana la deducción fue del{" "}
            <span className="bg-red-500/20 text-red-400 font-semibold px-1.5 py-0.5 rounded text-xs">28%</span>{" "}
            cuando normalmente es del 10-12%. Abre el correo y ve una reparación de frenos de $60.000.
            <br /><br />
            Con ese dato, pueden charlar sobre armar un fondo de mantenimiento mensual para que estos gastos inesperados no desequilibren la economía del hogar.
          </GuiaScenario>

          <GuiaScenario title="Escenario 4: La energía personal como dato laboral">
            Nicolás registra su energía por un mes. El sistema le muestra que en días de energía 1-2, gana{" "}
            <span className="bg-red-500/20 text-red-400 font-semibold px-1.5 py-0.5 rounded text-xs">$42.000 promedio</span>.
            En días de energía 4-5:{" "}
            <span className="bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded text-xs">$98.000 promedio</span>.
            <br /><br />
            Conclusión: salir a trabajar mal descansado no solo es agotador, <strong className="text-white">es económicamente ineficiente</strong>. Descansar un día que te sentís mal puede ser más rentable que insistir.
          </GuiaScenario>
        </div>
      )}

      {/* ── FAQ ── */}
      {subTab === "faq" && (
        <div>
          <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-3.5 mb-5 text-blue-300 text-sm leading-relaxed">
            Si tu pregunta no está acá, cualquier duda sobre los correos o el sistema se puede resolver directamente con quien configuró el gestor.
          </div>
          <p className="text-white font-bold mb-1">Preguntas Frecuentes</p>
          <p className="text-slate-400 text-sm mb-4">Las dudas más comunes de Nicolás y Emilia</p>
          <GuiaFaq />
        </div>
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────

const VALID_TABS = ["dashboard", "turnos", "ranking", "proyecciones", "eficiencia", "mantenimiento", "guia"];

function DashboardApp() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("seccion");
  const [tab, setTabState] = useState(VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "dashboard");

  const setTab = useCallback((id) => {
    setTabState(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("seccion", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Si el usuario navega con atrás/adelante, sincronizamos el tab con la URL
  useEffect(() => {
    if (VALID_TABS.includes(tabFromUrl) && tabFromUrl !== tab) {
      setTabState(tabFromUrl);
    }
  }, [tabFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const sections = {
    dashboard: <SectionDashboard resumen={data?.resumen} registroDiario={data?.registroDiario} />,
    turnos: <SectionTurnos turnos={data?.turnos} />,
    ranking: <SectionRanking ranking={data?.ranking} />,
    proyecciones: <SectionProyecciones registroDiario={data?.registroDiario} />,
    eficiencia: <SectionEficiencia registroDiario={data?.registroDiario} />,
    mantenimiento: <SectionMantenimiento mantenimiento={data?.mantenimiento} />,
    guia: <SectionGuia />,
  };

  return (
    <div className="min-h-screen">
      {/* Skip link — accesibilidad teclado */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-brand focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Ir al contenido principal
      </a>
      <Header lastUpdated={data?.lastUpdated} refreshing={refreshing} onRefresh={() => fetchData(true)} />
      <NavTabs active={tab} setActive={setTab} />
      <main id="main-content" className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {tab === "guia" ? (
          <SectionGuia />
        ) : loading ? (
          <Skeleton />
        ) : error ? (
          <div className="bg-red-900/20 border border-red-700 rounded-2xl p-6 text-center" role="alert" aria-live="assertive">
            <div className="text-red-400 font-bold text-lg mb-2"><span aria-hidden="true">⚠️</span> Error al cargar los datos</div>
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <button onClick={() => fetchData()} className="bg-brand text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#13161f]">
              Reintentar
            </button>
          </div>
        ) : (
          sections[tab]
        )}
      </main>
      <footer className="border-t border-[#2a3045] mt-12 py-6 text-center text-slate-600 text-xs">
        Gestor de Finanzas — PedidosYa · {INFO.nombre} · {INFO.ciudad} · Datos sincronizados con Google Sheets cada 60 segundos
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Skeleton />}>
      <DashboardApp />
    </Suspense>
  );
}
