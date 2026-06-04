"use client";

// ─────────────────────────────────────────────
//  DATA (sincronizada con la planilla de Nico)
// ─────────────────────────────────────────────
const INFO = {
  nombre: "Nicolas Acosta",
  plataforma: "PedidosYa",
  ciudad: "Tucumán",
  vehiculo: "Moto",
  inicioRegistro: "15/05/2026",
  saldoInicial: 50000,
  metaMensual: 600000,
};

const TURNOS = [
  { fecha: "02/06/2026", n: 1, inicio: "09:30", fin: "12:30", duracion: 3.0, zona: "Centro", especial: false, hrsEspecial: 0, presento: true, pedidos: 18, aceptacion: 100, nota: "" },
  { fecha: "02/06/2026", n: 2, inicio: "15:00", fin: "19:30", duracion: 4.5, zona: "Norte", especial: false, hrsEspecial: 0, presento: true, pedidos: 15, aceptacion: 100, nota: "" },
  { fecha: "04/05/2026", n: 1, inicio: "15:00", fin: "19:00", duracion: 4.0, zona: "Sur", especial: false, hrsEspecial: 0, presento: false, pedidos: null, aceptacion: null, nota: "" },
  { fecha: "05/06/2026", n: 1, inicio: "20:00", fin: "00:30", duracion: 4.5, zona: "Centro", especial: true, hrsEspecial: 4.5, presento: true, pedidos: 22, aceptacion: 98, nota: "—" },
  { fecha: "06/06/2026", n: 1, inicio: "20:00", fin: "00:30", duracion: 4.5, zona: "Centro", especial: true, hrsEspecial: 4.5, presento: true, pedidos: 20, aceptacion: 98, nota: "—" },
  { fecha: "06/06/2026", n: 2, inicio: "20:00", fin: "00:00", duracion: 4.0, zona: "Yerba Buena", especial: true, hrsEspecial: 4.0, presento: true, pedidos: 19, aceptacion: 95, nota: "—" },
  { fecha: "07/06/2026", n: 1, inicio: "20:00", fin: "00:00", duracion: 4.0, zona: "Norte", especial: true, hrsEspecial: 4.0, presento: true, pedidos: 20, aceptacion: 100, nota: "—" },
];

const RANKING = [
  {
    n: 1, desde: "01/06/2026", hasta: "07/06/2026",
    pedidos: 0, metaPedidos: 190,
    hrsEspecial: 17.0, metaHrs: 13,
    aceptacion: 98.2, metaAcep: 100,
    noPresent: 0, metaNoPresent: 0,
    hrsRealVsPlan: "0%",
    grupoEstimado: "GRUPO 3", grupoReal: "GRUPO 1",
    dia: "Miércoles", hora: "09:00",
  },
];

const MUNDIAL = [
  { fecha: "16/06/2026", dia: "Martes", hora: "22:00", fase: "Grupos - Grupo J", partido: "🇦🇷 Argentina vs Algeria 🇩🇿", sede: "Arrowhead Stadium, Kansas City", resultado: null },
  { fecha: "22/06/2026", dia: "Lunes", hora: "14:00", fase: "Grupos - Grupo J", partido: "🇦🇷 Argentina vs Austria 🇦🇹", sede: "AT&T Stadium, Arlington TX", resultado: null },
  { fecha: "27/06/2026", dia: "Sábado", hora: "23:00", fase: "Grupos - Grupo J", partido: "Jordan 🇯🇴 vs Argentina 🇦🇷", sede: "AT&T Stadium, Arlington TX", resultado: null },
  { fecha: "03/07/2026", dia: "Viernes", hora: "TBD", fase: "Octavos de Final", partido: "🇦🇷 Argentina vs Por definir", sede: "Por definir", resultado: null },
  { fecha: "11/07/2026", dia: "Sábado", hora: "TBD", fase: "Cuartos de Final", partido: "🇦🇷 Argentina vs Por definir", sede: "Por definir", resultado: null },
  { fecha: "15/07/2026", dia: "Miércoles", hora: "TBD", fase: "Semifinal", partido: "🇦🇷 Argentina vs Por definir", sede: "Por definir", resultado: null },
  { fecha: "19/07/2026", dia: "Domingo", hora: "TBD", fase: "🏆 FINAL", partido: "Final — Por definir", sede: "MetLife Stadium, New Jersey", resultado: null },
];

const EFICIENCIA_CLIMA = [
  { clima: "☀️ Soleado", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0, energiaProm: 0 },
  { clima: "⛅ Nublado", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0, energiaProm: 0 },
  { clima: "🌧️ Lluvia", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0, energiaProm: 0 },
  { clima: "⛈️ Tormenta", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0, energiaProm: 0 },
  { clima: "🌡️ Calor extremo", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0, energiaProm: 0 },
];

const EFICIENCIA_FRANJA = [
  { franja: "🌅 Mañana (6:00 - 12:00)", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0, hsProm: 0 },
  { franja: "☀️ Tarde (12:00 - 18:00)", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0, hsProm: 0 },
  { franja: "🌙 Noche (18:00 - 00:00)", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0, hsProm: 0 },
];

const EFICIENCIA_DIA = [
  { dia: "Lunes", diasTrab: 0, genTotal: null, ganProm: null, pedidos: 0, kmProm: 0, hsProm: 0, xHoraProm: null },
  { dia: "Martes", diasTrab: 0, genTotal: null, ganProm: null, pedidos: 0, kmProm: 0, hsProm: 0, xHoraProm: null },
  { dia: "Miércoles", diasTrab: 1, genTotal: null, ganProm: null, pedidos: 0, kmProm: 0, hsProm: 0, xHoraProm: null },
  { dia: "Jueves", diasTrab: 0, genTotal: null, ganProm: null, pedidos: 0, kmProm: 0, hsProm: 0, xHoraProm: null },
  { dia: "Viernes", diasTrab: 0, genTotal: null, ganProm: null, pedidos: 0, kmProm: 0, hsProm: 0, xHoraProm: null },
  { dia: "Sábado", diasTrab: 0, genTotal: null, ganProm: null, pedidos: 0, kmProm: 0, hsProm: 0, xHoraProm: null },
  { dia: "Domingo", diasTrab: 0, genTotal: null, ganProm: null, pedidos: 0, kmProm: 0, hsProm: 0, xHoraProm: null },
];

const EFICIENCIA_ENERGIA = [
  { nivel: "1 — Muy bajo", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0 },
  { nivel: "2 — Bajo", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0 },
  { nivel: "3 — Normal", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0 },
  { nivel: "4 — Bueno", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0 },
  { nivel: "5 — Excelente", dias: 0, ganProm: null, pedidosProm: 0, kmProm: 0 },
];

const MANTENIMIENTO = [];

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const pesos = (v) =>
  v == null ? "—" : "$" + Number(v).toLocaleString("es-AR", { minimumFractionDigits: 0 });

const pct = (v) =>
  v == null ? "—" : v.toFixed(1) + "%";

// ─────────────────────────────────────────────
//  SUB-COMPONENTES
// ─────────────────────────────────────────────

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
      <h2 className="text-xl font-bold text-white">
        {emoji} {title}
      </h2>
    </div>
  );
}

function Card({ label, value, sub, color }) {
  const accent = color || "text-brand";
  return (
    <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-[#2a3045] flex flex-col gap-1">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold ${accent}`}>{value}</span>
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

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 text-sm text-slate-200 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}

function Tr({ children, className = "" }) {
  return (
    <tr className={`border-t border-[#2a3045] hover:bg-[#1e2540] transition-colors ${className}`}>
      {children}
    </tr>
  );
}

function EmptyRow({ cols, msg = "Sin datos registrados aún" }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center text-slate-500 italic">
        {msg}
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
//  SECCIONES
// ─────────────────────────────────────────────

function Header() {
  return (
    <header className="bg-gradient-to-r from-[#E31837] to-[#8B0000] px-6 py-8 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🛵</div>
            <span className="text-white/80 text-sm font-medium tracking-widest uppercase">PedidosYa · Tucumán</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Gestor de Finanzas
          </h1>
          <p className="text-white/70 mt-1 text-sm">
            Cadete: <span className="text-white font-semibold">{INFO.nombre}</span> · Desde {INFO.inicioRegistro}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-white/10 rounded-xl px-4 py-3 text-center min-w-[120px]">
            <div className="text-white/60 text-xs uppercase">Saldo inicial/día</div>
            <div className="text-white font-bold text-lg">{pesos(INFO.saldoInicial)}</div>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 text-center min-w-[120px]">
            <div className="text-white/60 text-xs uppercase">Meta mensual</div>
            <div className="text-white font-bold text-lg">{pesos(INFO.metaMensual)}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

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
    <nav className="bg-[#13161f] border-b border-[#2a3045] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-thin">
        <div className="flex gap-1 py-2 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                active === t.id
                  ? "bg-brand text-white"
                  : "text-slate-400 hover:text-white hover:bg-[#1e2433]"
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

function SectionDashboard() {
  const totalPedidosTurnos = TURNOS.filter((t) => t.presento && t.pedidos).reduce((a, t) => a + t.pedidos, 0);
  const totalHrsTurnos = TURNOS.filter((t) => t.presento).reduce((a, t) => a + t.duracion, 0);
  const hrsEspeciales = TURNOS.filter((t) => t.especial && t.presento).reduce((a, t) => a + t.hrsEspecial, 0);
  const presentaciones = TURNOS.filter((t) => t.presento).length;
  const totalTurnos = TURNOS.length;
  const acepVals = TURNOS.filter((t) => t.aceptacion != null).map((t) => t.aceptacion);
  const acepProm = acepVals.length ? (acepVals.reduce((a, b) => a + b, 0) / acepVals.length).toFixed(1) : null;

  return (
    <div>
      <SectionTitle emoji="📊" title="Dashboard General" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Card label="Saldo inicial diario" value={pesos(INFO.saldoInicial)} sub="Aporte de Emilia" color="text-emerald-400" />
        <Card label="Meta mensual" value={pesos(INFO.metaMensual)} sub="Objetivo del período" color="text-yellow-400" />
        <Card label="Total pedidos (turnos)" value={totalPedidosTurnos} sub="Entregas registradas" color="text-blue-400" />
        <Card label="Horas trabajadas" value={totalHrsTurnos.toFixed(1) + " hs"} sub="En turnos completados" color="text-purple-400" />
        <Card label="Horas especiales ⭐" value={hrsEspeciales.toFixed(1) + " hs"} sub="Meta semana: 13 hs" color="text-orange-400" />
        <Card label="Presentaciones" value={`${presentaciones} / ${totalTurnos}`} sub="Turnos asistidos" color="text-teal-400" />
        <Card label="% Aceptación prom." value={acepProm ? pct(+acepProm) : "—"} sub="Meta: 100%" color="text-pink-400" />
        <Card label="Ciudad" value={INFO.ciudad} sub={`Vehículo: ${INFO.vehiculo}`} color="text-slate-300" />
      </div>

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
    </div>
  );
}

function SectionTurnos() {
  return (
    <div>
      <SectionTitle emoji="📋" title="Registro de Turnos" />
      <TableWrapper>
        <thead className="bg-[#13161f]">
          <tr>
            <Th>Fecha</Th>
            <Th>N°</Th>
            <Th>Inicio</Th>
            <Th>Fin</Th>
            <Th>Duración</Th>
            <Th>Zona</Th>
            <Th>Especial</Th>
            <Th>Hs. especial</Th>
            <Th>Asistió</Th>
            <Th>Pedidos</Th>
            <Th>Aceptación</Th>
            <Th>Nota</Th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1f2e]">
          {TURNOS.length === 0 ? (
            <EmptyRow cols={12} />
          ) : (
            TURNOS.map((t, i) => (
              <Tr key={i}>
                <Td>{t.fecha}</Td>
                <Td>{t.n}</Td>
                <Td>{t.inicio}</Td>
                <Td>{t.fin}</Td>
                <Td>{t.duracion} hs</Td>
                <Td>{t.zona}</Td>
                <Td>{t.especial ? <Badge ok={true}>⭐ Sí</Badge> : <span className="text-slate-500">No</span>}</Td>
                <Td>{t.hrsEspecial > 0 ? t.hrsEspecial + " hs" : "—"}</Td>
                <Td>
                  {t.presento ? (
                    <Badge ok={true}>✅ Sí</Badge>
                  ) : (
                    <Badge ok={false}>❌ No</Badge>
                  )}
                </Td>
                <Td>{t.pedidos ?? "—"}</Td>
                <Td>
                  {t.aceptacion != null ? (
                    <span className={t.aceptacion === 100 ? "text-emerald-400 font-semibold" : t.aceptacion >= 95 ? "text-yellow-400" : "text-red-400"}>
                      {t.aceptacion}%
                    </span>
                  ) : "—"}
                </Td>
                <Td className="text-slate-500">{t.nota || "—"}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableWrapper>

      {/* Resumen turnos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {(() => {
          const presentados = TURNOS.filter(t => t.presento);
          const hrsEsp = TURNOS.filter(t => t.especial && t.presento).reduce((a,t) => a+t.hrsEspecial, 0);
          const pedidos = presentados.filter(t=>t.pedidos).reduce((a,t)=>a+t.pedidos,0);
          const aceps = TURNOS.filter(t=>t.aceptacion!=null).map(t=>t.aceptacion);
          const acepProm = aceps.length ? (aceps.reduce((a,b)=>a+b,0)/aceps.length).toFixed(1) : null;
          return [
            ["Turnos completados", `${presentados.length} / ${TURNOS.length}`],
            ["Hs. especiales ⭐", hrsEsp.toFixed(1) + " hs"],
            ["Total pedidos", pedidos],
            ["Aceptación prom.", acepProm ? acepProm + "%" : "—"],
          ];
        })().map(([label, val]) => (
          <div key={label} className="bg-[#1a1f2e] border border-[#2a3045] rounded-xl p-4">
            <div className="text-slate-400 text-xs uppercase mb-1">{label}</div>
            <div className="text-white font-bold text-xl">{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionRanking() {
  return (
    <div>
      <SectionTitle emoji="🏆" title="Ranking Semanal" />
      <div className="space-y-4">
        {RANKING.length === 0 ? (
          <p className="text-slate-500 italic">Sin semanas registradas aún.</p>
        ) : (
          RANKING.map((s, i) => (
            <div key={i} className="bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-5">
                <div>
                  <span className="text-slate-400 text-sm">Semana {s.n}</span>
                  <h3 className="text-white font-bold text-lg">{s.desde} → {s.hasta}</h3>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div className="bg-[#13161f] rounded-xl px-4 py-2 text-center">
                    <div className="text-xs text-slate-400">Grupo estimado</div>
                    <div className="text-yellow-400 font-bold">{s.grupoEstimado}</div>
                  </div>
                  <div className="bg-emerald-900/40 border border-emerald-700 rounded-xl px-4 py-2 text-center">
                    <div className="text-xs text-slate-400">Grupo real (app)</div>
                    <div className="text-emerald-400 font-bold">{s.grupoReal}</div>
                  </div>
                  <div className="bg-[#13161f] rounded-xl px-4 py-2 text-center">
                    <div className="text-xs text-slate-400">Sacar turnos</div>
                    <div className="text-white font-bold">{s.dia} {s.hora}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Pedidos", val: s.pedidos, meta: s.metaPedidos, ok: s.pedidos >= s.metaPedidos },
                  { label: "Hs. especiales ⭐", val: s.hrsEspecial + " hs", meta: s.metaHrs + " hs", ok: s.hrsEspecial >= s.metaHrs },
                  { label: "Aceptación %", val: pct(s.aceptacion), meta: pct(s.metaAcep), ok: s.aceptacion >= s.metaAcep },
                  { label: "No presentaciones", val: s.noPresent, meta: s.metaNoPresent, ok: s.noPresent <= s.metaNoPresent },
                  { label: "Hs. real vs plan", val: s.hrsRealVsPlan, meta: "—", ok: null },
                ].map(({ label, val, meta, ok }) => (
                  <div key={label} className="bg-[#13161f] rounded-xl p-3">
                    <div className="text-xs text-slate-400 mb-2">{label}</div>
                    <div className={`text-xl font-bold ${ok === true ? "text-emerald-400" : ok === false ? "text-red-400" : "text-white"}`}>
                      {val}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Meta: {meta}</div>
                    {ok !== null && <div className="mt-2">{ok ? <Badge ok={true}>OK ✅</Badge> : <Badge ok={false}>Bajo ⚠️</Badge>}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SectionProyecciones() {
  const diasRestantes = 27;
  const metaMensual = INFO.metaMensual;
  const avance = 0;
  const ganAcumulada = 0;
  const pctAvance = (ganAcumulada / metaMensual) * 100;

  return (
    <div>
      <SectionTitle emoji="🎯" title="Proyecciones y Metas" />

      {/* Progreso meta mensual */}
      <div className="bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <div className="text-slate-400 text-sm">Meta mensual</div>
            <div className="text-white font-bold text-2xl">{pesos(metaMensual)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-sm">Ganancia acumulada</div>
            <div className="text-emerald-400 font-bold text-2xl">{pesos(ganAcumulada)}</div>
          </div>
        </div>
        <div className="w-full bg-[#13161f] rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-brand to-orange-500 transition-all"
            style={{ width: `${Math.min(pctAvance, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>{pctAvance.toFixed(1)}% alcanzado</span>
          <span>{diasRestantes} días restantes del mes</span>
        </div>
      </div>

      {/* Tabla indicadores */}
      <TableWrapper>
        <thead className="bg-[#13161f]">
          <tr>
            <Th>Indicador</Th>
            <Th>Valor</Th>
            <Th>Detalle</Th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1f2e]">
          {[
            ["📅 Días trabajados este mes", "—", "Días con ganancia registrada"],
            ["💹 Ganancia acumulada ($)", pesos(ganAcumulada), "Suma de ganancias reales del mes"],
            ["📈 Promedio ganancia / día", "—", "Ganancia diaria promedio del mes"],
            ["🔮 Proyección fin de mes", "—", "Si mantiene el promedio actual"],
            ["🎯 Meta mensual", pesos(metaMensual), "Configurada en la planilla"],
            ["✅ Avance sobre la meta", pct(pctAvance), "% de la meta ya alcanzado"],
            ["📆 Días restantes del mes", diasRestantes, "Días que quedan hasta fin de mes"],
            ["📆 Días necesarios para la meta", "—", "Con el ritmo actual"],
          ].map(([ind, val, det]) => (
            <Tr key={ind}>
              <Td className="font-medium text-slate-300">{ind}</Td>
              <Td className="text-white font-semibold">{val}</Td>
              <Td className="text-slate-400">{det}</Td>
            </Tr>
          ))}
        </tbody>
      </TableWrapper>

      {/* Semana actual vs anterior */}
      <div className="mt-6">
        <h3 className="text-slate-300 font-semibold mb-3">📊 Semana actual vs. semana anterior</h3>
        <TableWrapper>
          <thead className="bg-[#13161f]">
            <tr>
              <Th>Métrica</Th>
              <Th>Semana actual</Th>
              <Th>Semana anterior</Th>
              <Th>Diferencia ($)</Th>
              <Th>Diferencia (%)</Th>
              <Th>Tendencia</Th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1f2e]">
            {[
              ["💹 Ganancia real ($)", "—", "—", "—", "0.0%", "➡ Igual"],
              ["📦 Pedidos entregados", "0", "0", "0", "0.0%", "➡ Igual"],
              ["💵 KM recorridos", "0.00", "0.00", "0.00", "0.0%", "➡ Igual"],
              ["⏱️ Horas trabajadas", "0.00", "0.00", "0.00", "0.0%", "➡ Igual"],
            ].map(([met, ac, ant, dif, pct2, tend]) => (
              <Tr key={met}>
                <Td className="text-slate-300">{met}</Td>
                <Td>{ac}</Td>
                <Td className="text-slate-400">{ant}</Td>
                <Td>{dif}</Td>
                <Td>{pct2}</Td>
                <Td className="text-slate-400">{tend}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>

      {/* Alertas de rendimiento */}
      <div className="mt-6 bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-5">
        <h3 className="text-slate-300 font-semibold mb-4">🚨 Alertas de rendimiento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "⏳ Días bajo $20.000 (últimos 7)", val: 0 },
            { label: "🔥 Mejor racha sobre meta diaria", val: 0 },
            { label: "📊 % días sobre meta diaria", val: "0.0%" },
          ].map(({ label, val }) => (
            <div key={label} className="bg-[#13161f] rounded-xl p-4">
              <div className="text-slate-400 text-xs mb-2">{label}</div>
              <div className="text-white font-bold text-2xl">{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionEficiencia() {
  return (
    <div className="space-y-8">
      <SectionTitle emoji="⚡" title="Análisis de Eficiencia" />

      {/* Por clima */}
      <div>
        <h3 className="text-slate-300 font-semibold mb-3">🌤️ Rendimiento por clima</h3>
        <TableWrapper>
          <thead className="bg-[#13161f]">
            <tr>
              <Th>Clima</Th>
              <Th>Días</Th>
              <Th>Gan. prom. ($)</Th>
              <Th>Pedidos prom.</Th>
              <Th>KM prom.</Th>
              <Th>Energía prom.</Th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1f2e]">
            {EFICIENCIA_CLIMA.map((r, i) => (
              <Tr key={i}>
                <Td className="font-medium">{r.clima}</Td>
                <Td>{r.dias}</Td>
                <Td>{r.ganProm != null ? pesos(r.ganProm) : "—"}</Td>
                <Td>{r.pedidosProm.toFixed(1)}</Td>
                <Td>{r.kmProm.toFixed(1)}</Td>
                <Td>{r.energiaProm.toFixed(1)}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>

      {/* Por franja horaria */}
      <div>
        <h3 className="text-slate-300 font-semibold mb-3">🕐 Rendimiento por franja horaria</h3>
        <TableWrapper>
          <thead className="bg-[#13161f]">
            <tr>
              <Th>Franja</Th>
              <Th>Días</Th>
              <Th>Gan. prom. ($)</Th>
              <Th>Pedidos prom.</Th>
              <Th>KM prom.</Th>
              <Th>Hs. prom.</Th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1f2e]">
            {EFICIENCIA_FRANJA.map((r, i) => (
              <Tr key={i}>
                <Td className="font-medium">{r.franja}</Td>
                <Td>{r.dias}</Td>
                <Td>{r.ganProm != null ? pesos(r.ganProm) : "—"}</Td>
                <Td>{r.pedidosProm.toFixed(1)}</Td>
                <Td>{r.kmProm.toFixed(1)}</Td>
                <Td>{r.hsProm.toFixed(1)}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>

      {/* Por día de semana */}
      <div>
        <h3 className="text-slate-300 font-semibold mb-3">📅 Rendimiento por día de semana</h3>
        <TableWrapper>
          <thead className="bg-[#13161f]">
            <tr>
              <Th>Día</Th>
              <Th>Días trab.</Th>
              <Th>Generado total ($)</Th>
              <Th>Gan. prom. ($)</Th>
              <Th>Pedidos</Th>
              <Th>KM prom.</Th>
              <Th>Hs. prom.</Th>
              <Th>$/Hora prom.</Th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1f2e]">
            {EFICIENCIA_DIA.map((r, i) => (
              <Tr key={i} className={r.diasTrab > 0 ? "bg-[#1e2540]" : ""}>
                <Td className="font-medium">{r.dia}</Td>
                <Td>{r.diasTrab > 0 ? <span className="text-brand font-bold">{r.diasTrab}</span> : r.diasTrab}</Td>
                <Td>{r.genTotal != null ? pesos(r.genTotal) : "—"}</Td>
                <Td>{r.ganProm != null ? pesos(r.ganProm) : "—"}</Td>
                <Td>{r.pedidos}</Td>
                <Td>{r.kmProm.toFixed(1)}</Td>
                <Td>{r.hsProm.toFixed(1)}</Td>
                <Td>{r.xHoraProm != null ? pesos(r.xHoraProm) : "—"}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>

      {/* Por nivel de energía */}
      <div>
        <h3 className="text-slate-300 font-semibold mb-3">⚡ Rendimiento por nivel de energía</h3>
        <TableWrapper>
          <thead className="bg-[#13161f]">
            <tr>
              <Th>Nivel</Th>
              <Th>Días</Th>
              <Th>Gan. prom. ($)</Th>
              <Th>Pedidos prom.</Th>
              <Th>KM prom.</Th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1f2e]">
            {EFICIENCIA_ENERGIA.map((r, i) => (
              <Tr key={i}>
                <Td className="font-medium">{r.nivel}</Td>
                <Td>{r.dias}</Td>
                <Td>{r.ganProm != null ? pesos(r.ganProm) : "—"}</Td>
                <Td>{r.pedidosProm.toFixed(1)}</Td>
                <Td>{r.kmProm.toFixed(1)}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>

      {/* Contexto Mundial */}
      <div>
        <h3 className="text-slate-300 font-semibold mb-3">⚽ Rendimiento por contexto (partidos)</h3>
        <TableWrapper>
          <thead className="bg-[#13161f]">
            <tr>
              <Th>Contexto</Th>
              <Th>Días</Th>
              <Th>Gan. prom. ($)</Th>
              <Th>Pedidos prom.</Th>
              <Th>KM prom.</Th>
              <Th>Hs. prom.</Th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1f2e]">
            {[
              { ctx: "🇦🇷 Jugó Argentina", dias: 0 },
              { ctx: "⚽ Hubo partido (otro)", dias: 0 },
              { ctx: "⚪ Sin partido", dias: 0 },
            ].map((r, i) => (
              <Tr key={i}>
                <Td className="font-medium">{r.ctx}</Td>
                <Td>{r.dias}</Td>
                <Td>—</Td>
                <Td>0.00</Td>
                <Td>0.00</Td>
                <Td>0.00</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>

      {/* Umbrales de alerta */}
      <div className="bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-5">
        <h3 className="text-slate-300 font-semibold mb-4">⚙️ Umbrales de alertas configurados</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["⏰ Horas máx./día", "14 hs"],
            ["💸 Ganancia mín./día", "$20,000"],
            ["💵 KM máx./día", "180 km"],
            ["📦 Pedidos mín./día", "2"],
          ].map(([label, val]) => (
            <div key={label} className="bg-[#13161f] rounded-xl p-3">
              <div className="text-slate-400 text-xs mb-1">{label}</div>
              <div className="text-white font-bold">{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionMantenimiento() {
  return (
    <div>
      <SectionTitle emoji="🔧" title="Mantenimiento de Moto" />

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          ["💸 Total gastado", "—"],
          ["📍 Próximo service (KM)", "0"],
          ["🔢 Servicios registrados", "0"],
          ["📅 Costo mensual promedio", "—"],
          ["🔩 Último tipo de servicio", "—"],
          ["📆 Fecha último servicio", "—"],
        ].map(([label, val]) => (
          <div key={label} className="bg-[#1a1f2e] border border-[#2a3045] rounded-xl p-4">
            <div className="text-slate-400 text-xs mb-1">{label}</div>
            <div className="text-white font-bold text-lg">{val}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <TableWrapper>
        <thead className="bg-[#13161f]">
          <tr>
            <Th>Fecha</Th>
            <Th>Tipo</Th>
            <Th>Descripción</Th>
            <Th>KM al momento</Th>
            <Th>Costo ($)</Th>
            <Th>Próximo service (KM)</Th>
            <Th>Notas</Th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1f2e]">
          {MANTENIMIENTO.length === 0 ? (
            <EmptyRow cols={7} msg="Sin servicios de mantenimiento registrados aún." />
          ) : (
            MANTENIMIENTO.map((m, i) => (
              <Tr key={i}>
                <Td>{m.fecha}</Td>
                <Td>{m.tipo}</Td>
                <Td>{m.descripcion}</Td>
                <Td>{m.km}</Td>
                <Td>{pesos(m.costo)}</Td>
                <Td>{m.proximoKm}</Td>
                <Td className="text-slate-400">{m.notas || "—"}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableWrapper>

      <div className="mt-4 text-xs text-slate-500">
        ✏️ Cómo usar: completá en la planilla Fecha · Tipo · Descripción · KM al momento · Costo · Próximo service KM · Notas
      </div>
    </div>
  );
}

function SectionMundial() {
  const hoy = new Date("2026-06-03");

  return (
    <div>
      <SectionTitle emoji="⚽" title="Mundial 2026 — Argentina" />
      <p className="text-slate-400 text-sm mb-5">
        Seguimiento de los partidos de Argentina en el Mundial México · EE.UU. · Canadá 2026
      </p>

      <div className="space-y-3">
        {MUNDIAL.map((m, i) => {
          const fechaPartido = new Date(m.fecha.split("/").reverse().join("-"));
          const esFuturo = fechaPartido > hoy;
          const esHoy = fechaPartido.toDateString() === hoy.toDateString();
          const esFinal = m.fase.includes("FINAL");

          return (
            <div
              key={i}
              className={`rounded-2xl border p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-all
                ${esFinal ? "border-yellow-500 bg-yellow-900/10" : "border-[#2a3045] bg-[#1a1f2e]"}
                ${esHoy ? "ring-2 ring-brand" : ""}
              `}
            >
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[70px]">
                  <div className="text-slate-400 text-xs">{m.dia}</div>
                  <div className="text-white font-bold">{m.fecha.slice(0, 5)}</div>
                  <div className="text-brand text-sm font-semibold">{m.hora}</div>
                </div>
                <div>
                  <div className={`font-bold text-lg ${esFinal ? "text-yellow-400" : "text-white"}`}>
                    {m.partido}
                  </div>
                  <div className="text-slate-400 text-sm">{m.fase}</div>
                  <div className="text-slate-500 text-xs">{m.sede}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.resultado ? (
                  <div className="bg-emerald-900/40 border border-emerald-700 rounded-xl px-4 py-2 text-center">
                    <div className="text-xs text-slate-400">Resultado</div>
                    <div className="text-emerald-400 font-bold">{m.resultado}</div>
                  </div>
                ) : esFuturo ? (
                  <Badge ok={null}>Próximo 📅</Badge>
                ) : (
                  <Badge ok={null}>Sin resultado</Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen período mundial */}
      <div className="mt-8">
        <h3 className="text-slate-300 font-semibold mb-3">📊 Estadísticas período Mundial (11/06 – 19/07/2026)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            ["📅 Días trabajados", "0 / 39"],
            ["💹 Ganancia total", "$0"],
            ["📦 Pedidos entregados", "0"],
            ["💵 KM recorridos", "0"],
            ["⏱️ Horas trabajadas", "0"],
            ["📈 Ganancia/día prom.", "$0"],
          ].map(([label, val]) => (
            <div key={label} className="bg-[#1a1f2e] border border-[#2a3045] rounded-xl p-4">
              <div className="text-slate-400 text-xs mb-1">{label}</div>
              <div className="text-white font-bold text-lg">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Días Argentina vs resto */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "🇦🇷 Días que jugó Argentina", data: [["Gan. prom.", "$0"], ["Pedidos prom.", "0"], ["KM prom.", "0"], ["Hs. prom.", "0"]] },
          { title: "⚪ Días sin partido de Argentina", data: [["Gan. prom.", "$0"], ["Pedidos prom.", "0"], ["KM prom.", "0"], ["Hs. prom.", "0"]] },
        ].map(({ title, data }) => (
          <div key={title} className="bg-[#1a1f2e] border border-[#2a3045] rounded-2xl p-5">
            <h4 className="text-white font-semibold mb-3">{title}</h4>
            <div className="grid grid-cols-2 gap-3">
              {data.map(([label, val]) => (
                <div key={label} className="bg-[#13161f] rounded-xl p-3">
                  <div className="text-slate-400 text-xs">{label}</div>
                  <div className="text-white font-bold">{val}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Clima durante el mundial */}
      <div className="mt-6">
        <h3 className="text-slate-300 font-semibold mb-3">🌤️ Clima durante el Mundial</h3>
        <TableWrapper>
          <thead className="bg-[#13161f]">
            <tr>
              <Th>Clima</Th>
              <Th>Días</Th>
              <Th>Gan. prom. ($)</Th>
              <Th>Pedidos prom.</Th>
              <Th>KM prom.</Th>
              <Th>Energía prom.</Th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1f2e]">
            {[
              ["☀️ Soleado", 0], ["⛅ Nublado", 0], ["🌧️ Lluvia", 0], ["⛈️ Tormenta", 0], ["🌡️ Calor extremo", 0],
            ].map(([clima, dias]) => (
              <Tr key={clima}>
                <Td>{clima}</Td>
                <Td>{dias}</Td>
                <Td>$0</Td>
                <Td>0</Td>
                <Td>0</Td>
                <Td>0</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PÁGINA PRINCIPAL
// ─────────────────────────────────────────────
import { useState } from "react";

export default function Home() {
  const [tab, setTab] = useState("dashboard");

  const sections = {
    dashboard: <SectionDashboard />,
    turnos: <SectionTurnos />,
    ranking: <SectionRanking />,
    proyecciones: <SectionProyecciones />,
    eficiencia: <SectionEficiencia />,
    mantenimiento: <SectionMantenimiento />,
    mundial: <SectionMundial />,
  };

  return (
    <div className="min-h-screen">
      <Header />
      <NavTabs active={tab} setActive={setTab} />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {sections[tab]}
      </main>
      <footer className="border-t border-[#2a3045] mt-12 py-6 text-center text-slate-600 text-xs">
        Gestor de Finanzas — PedidosYa · {INFO.nombre} · {INFO.ciudad} · Actualizado con datos de la planilla Google Sheets
      </footer>
    </div>
  );
}
