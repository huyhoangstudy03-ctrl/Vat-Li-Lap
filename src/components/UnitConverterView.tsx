import { useMemo, useState } from 'react';
import { ArrowLeftRight, Check, Copy, Search, Sparkles } from 'lucide-react';
import {
  convertToAllUnits,
  convertUnitValue,
  describeConversionFormula,
  DOMAIN_LABELS,
  formatPhysicsNumber,
  SI_PREFIXES,
  THPTQG_UNIT_SHORTCUTS,
  UNIT_CATEGORIES,
  UNIT_CATEGORY_BY_ID,
  UnitDomain,
} from '../physics/unitConverter';
import { MathText } from './MathText';

const QUICK_INPUTS = [
  { label: '1', value: '1' },
  { label: '10', value: '10' },
  { label: '100', value: '100' },
  { label: '10⁻³', value: '0.001' },
  { label: '10⁻⁶', value: '0.000001' },
  { label: '10³', value: '1000' },
];

export function UnitConverterView() {
  const [domainFilter, setDomainFilter] = useState<'all' | UnitDomain>('all');
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('speed');
  const [fromUnitId, setFromUnitId] = useState<string>('km_h');
  const [toUnitId, setToUnitId] = useState<string>('m_s');
  const [rawInput, setRawInput] = useState<string>('100');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refTab, setRefTab] = useState<'shortcuts' | 'prefixes'>('shortcuts');

  const activeCategory = UNIT_CATEGORY_BY_ID[selectedCatId] ?? UNIT_CATEGORIES[0];

  const handleSelectCategory = (catId: string, customFrom?: string, customTo?: string) => {
    const cat = UNIT_CATEGORY_BY_ID[catId];
    if (!cat) return;
    setSelectedCatId(cat.id);
    setFromUnitId(customFrom ?? cat.defaultFrom);
    setToUnitId(customTo ?? cat.defaultTo);
    if (cat.id === 'temperature') {
      setRawInput('27');
    } else if (!rawInput.trim() || Number.isNaN(Number(rawInput))) {
      setRawInput('1');
    }
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return UNIT_CATEGORIES.filter((cat) => {
      if (domainFilter !== 'all' && cat.domain !== domainFilter) return false;
      if (!q) return true;
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.baseUnitSymbol.toLowerCase().includes(q) ||
        cat.units.some(
          (u) =>
            u.symbol.toLowerCase().includes(q) ||
            u.name.toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q)
        )
      );
    });
  }, [domainFilter, search]);

  const matchedUnitShortcuts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const matches: Array<{ catId: string; catName: string; unitId: string; symbol: string; name: string }> = [];
    for (const cat of UNIT_CATEGORIES) {
      for (const u of cat.units) {
        if (
          u.symbol.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.id.toLowerCase() === q
        ) {
          matches.push({
            catId: cat.id,
            catName: cat.name,
            unitId: u.id,
            symbol: u.symbol,
            name: u.name,
          });
        }
      }
    }
    return matches.slice(0, 8);
  }, [search]);

  const numericValue = useMemo(() => {
    const normalized = rawInput.trim().replace(',', '.');
    if (!normalized) return NaN;
    return Number(normalized);
  }, [rawInput]);

  const convertedValue = useMemo(
    () => convertUnitValue(activeCategory.id, fromUnitId, toUnitId, numericValue),
    [activeCategory.id, fromUnitId, toUnitId, numericValue]
  );

  const allConversions = useMemo(
    () => convertToAllUnits(activeCategory.id, fromUnitId, numericValue),
    [activeCategory.id, fromUnitId, numericValue]
  );

  const fromUnit = activeCategory.units.find((u) => u.id === fromUnitId) ?? activeCategory.units[0];
  const toUnit = activeCategory.units.find((u) => u.id === toUnitId) ?? activeCategory.units[0];
  const formattedResult = formatPhysicsNumber(convertedValue);
  const relationFormula = describeConversionFormula(activeCategory.id, fromUnitId, toUnitId);

  const totalUnitsCount = useMemo(
    () => UNIT_CATEGORIES.reduce((sum, cat) => sum + cat.units.length, 0),
    []
  );

  const handleSwap = () => {
    setFromUnitId(toUnitId);
    setToUnitId(fromUnitId);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-sky-400">
            Hệ thống đơn vị SI & CGS chuẩn Vật lí phổ thông · {UNIT_CATEGORIES.length} nhóm đại lượng · {totalUnitsCount} đơn vị
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 tracking-tight">
            Quy đổi tất cả đơn vị Vật lí
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Nhập một giá trị bất kỳ để quy đổi tức thời sang toàn bộ các đơn vị cùng loại (Cơ, Nhiệt, Quang, Điện, Từ trường, Hạt nhân), hiển thị đồng thời dạng thập phân và ký hiệu khoa học.
          </p>
        </div>

        {/* Global unit search */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <label htmlFor="unit-global-search" className="sr-only">
            Tìm nhanh mọi đơn vị hoặc đại lượng vật lí
          </label>
          <input
            id="unit-global-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm nhanh mọi đơn vị (vd: eV, atm, µF, Ci, km/h, °C)..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Quick unit jump suggestions when searching */}
      {matchedUnitShortcuts.length > 0 && (
        <div className="p-3 bg-slate-900/90 border border-sky-500/30 rounded-xl flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1">Chuyển nhanh tới đơn vị:</span>
          {matchedUnitShortcuts.map((m) => (
            <button
              key={`${m.catId}-${m.unitId}`}
              type="button"
              onClick={() => {
                const cat = UNIT_CATEGORY_BY_ID[m.catId];
                const fallbackTarget =
                  cat.units.find((u) => u.id !== m.unitId)?.id ?? m.unitId;
                handleSelectCategory(m.catId, m.unitId, fallbackTarget);
                setSearch('');
              }}
              className="px-2.5 py-1 text-xs font-medium text-sky-200 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 rounded-lg transition-colors cursor-pointer"
            >
              <span className="font-mono font-bold">{m.symbol}</span> · {m.name}{' '}
              <span className="text-slate-400">({m.catName})</span>
            </button>
          ))}
        </div>
      )}

      {/* Domain filter bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { id: 'all', label: `Tất cả (${UNIT_CATEGORIES.length})` },
            { id: 'mechanics', label: DOMAIN_LABELS.mechanics },
            { id: 'thermo-geo', label: DOMAIN_LABELS['thermo-geo'] },
            { id: 'waves-angle', label: DOMAIN_LABELS['waves-angle'] },
            { id: 'electromagnetism', label: DOMAIN_LABELS.electromagnetism },
            { id: 'nuclear', label: DOMAIN_LABELS.nuclear },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setDomainFilter(tab.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              domainFilter === tab.id
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/45'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-100 hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Split Workspace: Left Category Selector + Right Live Converter & All-Units Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: 24 Physical Quantity Categories */}
        <aside
          className="lg:col-span-4 xl:col-span-3 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden"
          aria-label="Danh mục đại lượng vật lí"
        >
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Chọn đại lượng ({filteredCategories.length})
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Chuẩn SI</span>
          </div>
          <div className="max-h-[540px] overflow-y-auto divide-y divide-slate-800/70">
            {filteredCategories.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Không tìm thấy đại lượng phù hợp. Thử xóa từ khóa tìm kiếm.
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = cat.id === activeCategory.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/15 text-sky-200 border-l-2 border-l-sky-400'
                        : 'hover:bg-slate-800/60 text-slate-300 border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className={`text-sm truncate ${isSelected ? 'font-bold text-sky-100' : 'font-medium'}`}>
                        {cat.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {cat.units.length} đơn vị · SI: <span className="font-mono text-slate-300">{cat.baseUnitSymbol}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Active Unit Converter + Simultaneous All-Units Table */}
        <section className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* Primary Converter Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <div className="text-[11px] font-medium text-sky-400">
                  {DOMAIN_LABELS[activeCategory.domain]} · Đơn vị chuẩn SI: {activeCategory.baseUnitSymbol}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-50 mt-0.5">
                  {activeCategory.name}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_INPUTS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setRawInput(preset.value)}
                    className="px-2 py-1 text-[11px] font-mono font-semibold text-slate-300 bg-slate-950 border border-slate-800 hover:border-sky-500/60 hover:text-sky-300 rounded-md transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input + From / Swap / To */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4 space-y-1.5">
                <label htmlFor="unit-value-input" className="block text-xs font-semibold text-slate-300">
                  Giá trị cần quy đổi
                </label>
                <input
                  id="unit-value-input"
                  type="text"
                  inputMode="decimal"
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="Nhập số (vd: 100 hoặc 1.6e-19)"
                  className="w-full px-3.5 py-2.5 text-base font-mono font-bold tabular-nums bg-slate-950 border border-slate-700 text-slate-50 rounded-lg focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label htmlFor="unit-from-select" className="block text-xs font-semibold text-slate-300">
                  Từ đơn vị
                </label>
                <select
                  id="unit-from-select"
                  value={fromUnitId}
                  onChange={(e) => setFromUnitId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  {activeCategory.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.symbol} — {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  aria-label="Đảo chiều đơn vị quy đổi"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Đảo chiều
                </button>
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label htmlFor="unit-to-select" className="block text-xs font-semibold text-slate-300">
                  Sang đơn vị
                </label>
                <select
                  id="unit-to-select"
                  value={toUnitId}
                  onChange={(e) => setToUnitId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-950 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  {activeCategory.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.symbol} — {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Big Highlighted Conversion Result */}
            <div
              className="p-4 sm:p-5 rounded-xl bg-[#070b14] border border-sky-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              data-testid="unit-primary-result"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="text-xs text-slate-400 font-mono">
                  {Number.isFinite(numericValue) ? rawInput.trim() : '—'} {fromUnit.symbol} =
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-sky-300 break-all">
                  {formattedResult.standard}{' '}
                  <span className="text-lg font-bold text-slate-200">{toUnit.symbol}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                  <span>Ký hiệu khoa học: {formattedResult.scientific} {toUnit.symbol}</span>
                  <span className="text-emerald-400">Hệ thức: {relationFormula}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy('primary', `${formattedResult.standard} ${toUnit.symbol}`)}
                disabled={!Number.isFinite(convertedValue)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 cursor-pointer"
              >
                {copiedId === 'primary' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép kết quả
                  </>
                )}
              </button>
            </div>

            {activeCategory.examTip && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm text-amber-200 leading-relaxed">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  <strong className="text-amber-100">Ghi nhớ thi THPTQG:</strong> {activeCategory.examTip}
                </span>
              </div>
            )}
          </div>

          {/* Simultaneous All-Units Output Grid */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-100">
                Bảng quy đổi đồng loạt sang tất cả {activeCategory.units.length} đơn vị ({activeCategory.name})
              </h3>
              <span className="text-xs text-slate-400">Nhấn vào bất kỳ hàng nào để đặt làm đơn vị đích</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/50">
                    <th className="py-2.5 px-4 font-semibold">Đơn vị</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Giá trị quy đổi</th>
                    <th className="py-2.5 px-4 font-semibold text-right hidden sm:table-cell">Dạng khoa học</th>
                    <th className="py-2.5 px-4 font-semibold hidden md:table-cell">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {allConversions.map(({ unit, value }) => {
                    const fmt = formatPhysicsNumber(value);
                    const isSource = unit.id === fromUnitId;
                    const isTarget = unit.id === toUnitId;
                    return (
                      <tr
                        key={unit.id}
                        onClick={() => setToUnitId(unit.id)}
                        className={`transition-colors cursor-pointer ${
                          isTarget
                            ? 'bg-sky-500/15'
                            : isSource
                              ? 'bg-emerald-500/10'
                              : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sky-300 min-w-[3.5rem]">
                              {unit.symbol}
                            </span>
                            <span className="text-slate-200 text-xs sm:text-sm">{unit.name}</span>
                            {isSource && (
                              <span className="text-[10px] font-semibold text-emerald-300 font-mono">
                                [Đầu vào]
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold tabular-nums text-slate-100">
                          {fmt.standard}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-xs tabular-nums text-slate-400 hidden sm:table-cell">
                          {fmt.scientific}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-slate-400 hidden md:table-cell">
                          {unit.note ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Reference Card: SI Prefixes & THPTQG Unit Shortcuts */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-slate-100">
            Cẩm nang đổi đơn vị nhanh & Bảng bội ước chuẩn SI
          </h2>
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setRefTab('shortcuts')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                refTab === 'shortcuts'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-100 border border-transparent'
              }`}
            >
              Mẹo đổi đơn vị THPTQG (6)
            </button>
            <button
              type="button"
              onClick={() => setRefTab('prefixes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                refTab === 'prefixes'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-100 border border-transparent'
              }`}
            >
              Bảng tiền tố SI (10⁻¹⁵ → 10¹²)
            </button>
          </div>
        </div>

        {refTab === 'shortcuts' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THPTQG_UNIT_SHORTCUTS.map((item) => (
              <div
                key={item.title}
                className="p-4 rounded-xl bg-[#070b14] border border-slate-800 space-y-2.5"
              >
                <h3 className="text-xs font-bold text-sky-300">{item.title}</h3>
                <div className="overflow-x-auto text-xs text-slate-100 py-1">
                  <MathText latex={item.formula} display />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.tip}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {SI_PREFIXES.map((p) => (
              <div
                key={p.symbol}
                className="p-3 rounded-lg bg-[#070b14] border border-slate-800 space-y-1"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-mono font-extrabold text-sky-300">{p.symbol}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{p.factorLabel}</span>
                </div>
                <div className="text-xs font-semibold text-slate-200">{p.prefix}</div>
                <div className="text-[11px] font-mono text-slate-400">{p.example}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
