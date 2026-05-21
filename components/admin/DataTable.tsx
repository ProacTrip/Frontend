// components/admin/DataTable.tsx
// Tabla reutilizable con paginación, filtros y ordenación — ceepii clean style

'use client';

import { ChevronLeft, ChevronRight, ChevronUp, Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  loading?: boolean;
  paginationMode?: 'offset' | 'cursor';
  limit?: number;
  offset?: number;
  onPageChange?: (offset: number) => void;
  onLimitChange?: (limit: number) => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  data,
  total,
  loading = false,
  paginationMode = 'offset',
  limit = 20,
  offset = 0,
  onPageChange,
  onLimitChange,
  hasNext,
  hasPrev,
  onNextPage,
  onPrevPage,
  onSort,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
}: DataTableProps<T>) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleSort = (key: string) => {
    if (!onSort) return;
    onSort(key, 'asc');
  };

  const startItem = total === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + limit, total);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-5 py-3.5 font-medium text-neutral-500 text-[11px] uppercase tracking-wider
                    ${col.sortable ? 'cursor-pointer hover:text-neutral-900 select-none transition-colors' : ''}
                    ${col.width || ''}
                  `}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <ChevronUp className="w-3 h-3 text-neutral-300" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-14 text-center">
                  <div className="flex justify-center">
                    <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
                  </div>
                  <p className="text-neutral-400 mt-2 text-sm">Cargando...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-14 text-center">
                  <Search className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                  <p className="text-neutral-400 text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    ${onRowClick ? 'cursor-pointer hover:bg-neutral-50' : ''}
                    transition-colors duration-100
                  `}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5 text-neutral-600 whitespace-nowrap">
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — offset */}
      {total > 0 && paginationMode === 'offset' && (
        <div className="px-5 py-3 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">
              <span className="font-medium text-neutral-600">{startItem}</span>–{''}
              <span className="font-medium text-neutral-600">{endItem}</span> de{' '}
              <span className="font-medium text-neutral-600">{total}</span>
            </span>

            {onLimitChange && (
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="text-sm border border-neutral-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange?.(offset - limit)}
              disabled={currentPage <= 1}
              className={`
                p-1.5 rounded-lg border transition-all duration-150
                ${currentPage <= 1
                  ? 'border-neutral-100 text-neutral-200 cursor-not-allowed'
                  : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300'
                }
              `}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm text-neutral-400 px-2">
              <span className="font-medium text-neutral-600">{currentPage}</span> /{' '}
              <span className="text-neutral-500">{totalPages}</span>
            </span>

            <button
              onClick={() => onPageChange?.(offset + limit)}
              disabled={currentPage >= totalPages}
              className={`
                p-1.5 rounded-lg border transition-all duration-150
                ${currentPage >= totalPages
                  ? 'border-neutral-100 text-neutral-200 cursor-not-allowed'
                  : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300'
                }
              `}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pagination — cursor */}
      {total > 0 && paginationMode === 'cursor' && (
        <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-sm text-neutral-400">
            {data.length} resultado{data.length !== 1 ? 's' : ''} en esta página
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrevPage}
              disabled={!hasPrev || loading}
              className={`
                p-1.5 rounded-lg border transition-all duration-150
                ${(!hasPrev || loading)
                  ? 'border-neutral-100 text-neutral-200 cursor-not-allowed'
                  : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300'
                }
              `}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm text-neutral-400 px-2">
              <span className="font-medium text-neutral-600">{data.length}</span> resultados
            </span>

            <button
              onClick={onNextPage}
              disabled={!hasNext || loading}
              className={`
                p-1.5 rounded-lg border transition-all duration-150
                ${(!hasNext || loading)
                  ? 'border-neutral-100 text-neutral-200 cursor-not-allowed'
                  : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300'
                }
              `}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
