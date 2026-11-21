import { ArrowDownRight, ArrowUpRight, BookmarkCheck, Minus, RotateCcw } from 'lucide-react';
import { DeltaRow } from '../physics/types';

interface DeltaComparisonTableProps {
  rows: DeltaRow[];
  onSetBaseline: () => void;
  onResetDefaults: () => void;
  hasChanges: boolean;
}

export function DeltaComparisonTable({
  rows,
  onSetBaseline,
  onResetDefaults,
  hasChanges,
}: DeltaComparisonTableProps) {
  return (
    <div className="bg-slate-900/85 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Bảng đối chiếu biến thiên thông số (Mốc chuẩn ↔ Hiện tại)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi chính xác mức độ tăng/giảm (Δ và %) của mọi đại lượng hệ quả khi thay đổi thông số.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSetBaseline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            Đặt làm mốc mới
          </button>
          <button
            type="button"
            onClick={onResetDefaults}
            disabled={!hasChanges}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Về mặc định
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400">
              <th className="py-2.5 px-4">Đại lượng vật lí</th>
              <th className="py-2.5 px-3 text-right">Mốc ban đầu</th>
              <th className="py-2.5 px-3 text-right">Giá trị hiện tại</th>
              <th className="py-2.5 px-3 text-right">Độ thay đổi (Δ)</th>
              <th className="py-2.5 px-4 text-right">Tỉ lệ biến thiên</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-sm">
            {rows.map((row) => {
              const trendColor =
                row.trend === 'up'
                  ? 'text-emerald-400'
                  : row.trend === 'down'
                  ? 'text-rose-400'
                  : 'text-slate-400';
              const sign = row.delta > 0 ? '+' : '';
              return (
                <tr key={row.key} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-slate-100">{row.label}</div>
                    <div className="text-xs font-mono text-slate-400">
                      Ký hiệu: {row.symbol} {row.unit ? `· Đơn vị: ${row.unit}` : ''}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-400">
                    {row.baseline.toFixed(row.precision)}
                    {row.unit && <span className="text-xs text-slate-500 ml-1">{row.unit}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-100">
                    {row.current.toFixed(row.precision)}
                    {row.unit && <span className="text-xs text-slate-400 ml-1 font-normal">{row.unit}</span>}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-medium ${trendColor}`}>
                    {row.trend === 'same' ? '0' : `${sign}${row.delta.toFixed(row.precision)}`}
                    {row.unit && row.trend !== 'same' && (
                      <span className="text-xs opacity-80 ml-1">{row.unit}</span>
                    )}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-mono tabular-nums font-medium ${trendColor}`}>
                    <span className="inline-flex items-center justify-end gap-1">
                      {row.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />}
                      {row.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />}
                      {row.trend === 'same' && <Minus className="w-3.5 h-3.5" aria-hidden="true" />}
                      {row.trend === 'same'
                        ? 'Không đổi (1,00×)'
                        : row.percentChange !== null && row.ratio !== null
                        ? `${sign}${row.percentChange.toFixed(1)}% (${row.ratio.toFixed(2)}×)`
                        : row.trend === 'up'
                        ? 'Tăng từ 0'
                        : 'Giảm từ 0'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
