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
    <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-[#2a3045] flex flex-col gap-1">
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
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">Gestor de Finanzas</h1>
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
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#8B0000] disabled:opacity-50"
            >
              {refreshing ? "⏳ Actualizando…" : "🔄 Actualizar"}
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
    { id: "mundial", label: "⚽ Mundial" },
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

function SectionMundial({ mundial }) {
  const mw = mundial || [];
  const hoy = new Date();
  const parseDate = (s) => { const [d, m, a] = String(s).split('/'); return new Date(a, m - 1, d); };
  const trabajados = mw.filter(m => m.trabajo && String(m.trabajo).toUpperCase().includes('SI'));
  const ganTotal = trabajados.reduce((a, m) => a + (m.ganancia || 0), 0);

  return (
    <div>
      <SectionTitle emoji="⚽" title="Mundial 2026 — Argentina" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card label="Partidos de Argentina" value={mw.length} color="text-blue-400" />
        <Card label="Días trabajados" value={`${trabajados.length} / ${mw.length}`} color="text-emerald-400" />
        <Card label="Ganancia período" value={pesos(ganTotal || null)} color="text-yellow-400" />
      </div>

      <div className="space-y-3">
        {mw.map((m, i) => {
          let fechaObj;
          try { fechaObj = parseDate(m.fecha); } catch { fechaObj = null; }
          const esFuturo = fechaObj ? fechaObj > hoy : false;
          const esFinal = String(m.fase || '').toUpperCase().includes('FINAL');
          const hayResultado = m.resultadoOficial && m.resultadoOficial !== '—' && m.resultadoOficial !== '';

          return (
            <div key={i} className={`rounded-2xl border p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3
              ${esFinal ? "border-yellow-500 bg-yellow-900/10" : "border-[#2a3045] bg-[#1a1f2e]"}`}>
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[70px]">
                  <div className="text-slate-400 text-xs">{m.dia}</div>
                  <div className="text-white font-bold">{String(m.fecha || '').slice(0, 5)}</div>
                  <div className="text-brand text-sm font-semibold">{m.hora}</div>
                </div>
                <div>
                  <div className={`font-bold text-lg ${esFinal ? "text-yellow-400" : "text-white"}`}>{m.partido}</div>
                  <div className="text-slate-400 text-sm">{m.fase}</div>
                  <div className="text-slate-500 text-xs">{m.sede}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {hayResultado ? (
                  <div className="bg-emerald-900/40 border border-emerald-700 rounded-xl px-4 py-2 text-center">
                    <div className="text-xs text-slate-400">Resultado</div>
                    <div className="text-emerald-400 font-bold">{m.resultadoOficial}</div>
                  </div>
                ) : esFuturo ? (
                  <Badge ok={null}>Próximo 📅</Badge>
                ) : (
                  <Badge ok={null}>Sin resultado</Badge>
                )}
                {m.ganancia != null && (
                  <div className="bg-[#13161f] rounded-xl px-3 py-2 text-center">
                    <div className="text-xs text-slate-400">Ganancia</div>
                    <div className="text-emerald-400 font-semibold">{pesos(m.ganancia)}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────

const VALID_TABS = ["dashboard", "turnos", "ranking", "proyecciones", "eficiencia", "mantenimiento", "mundial"];

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
    mundial: <SectionMundial mundial={data?.mundial} />,
  };

  return (
    <div className="min-h-screen">
      <Header lastUpdated={data?.lastUpdated} refreshing={refreshing} onRefresh={() => fetchData(true)} />
      <NavTabs active={tab} setActive={setTab} />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="bg-red-900/20 border border-red-700 rounded-2xl p-6 text-center">
            <div className="text-red-400 font-bold text-lg mb-2">⚠️ Error al cargar los datos</div>
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
