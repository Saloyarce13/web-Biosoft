import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

export interface DataTableProps<T> {
  title: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  customActions?: (item: T) => React.ReactNode;
  searchableKeys?: string[];
  extraFilters?: React.ReactNode;
  itemsPerPage?: number;
  isLoading?: boolean;
}

export function DataTable<T>({
  title,
  description,
  data,
  columns,
  searchPlaceholder = 'Buscar...',
  onAdd,
  onEdit,
  onDelete,
  customActions,
  searchableKeys = [],
  extraFilters,
  itemsPerPage = 10,
  isLoading = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchableKeys || searchableKeys.length === 0) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item => 
      searchableKeys.some(key => {
        // Resolver claves anidadas como 'client.name'
        const val = key.includes('.') 
          ? key.split('.').reduce((obj, k) => (obj as any)?.[k], item)
          : (item as any)[key];
        return val && String(val).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, searchTerm, searchableKeys]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[250px] bg-gray-50 border-gray-200 focus:bg-white transition-colors h-9 text-sm"
                style={{ paddingRight: '35px' }}
              />
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {extraFilters}
            {onAdd && (
              <Button size="sm" onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5 h-9">
                <Plus className="w-4 h-4" />
                Nuevo
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 text-xs uppercase font-semibold">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 font-semibold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete || customActions) && (
                <th className="px-6 py-4 text-right">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || customActions ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                    <p className="text-sm font-medium">Cargando datos...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || customActions ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="w-8 h-8 text-gray-300 mb-3" />
                    <p className="text-base font-medium text-gray-900">No se encontraron resultados</p>
                    <p className="text-sm">Intenta ajustar tu búsqueda.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-6 py-4 align-middle ${col.className || ''}`}>
                      {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                  {(onEdit || onDelete || customActions) && (
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center justify-end gap-2">
                        {customActions && customActions(item)}
                        {onEdit && (
                          <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button variant="ghost" size="icon" onClick={() => onDelete(item)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-sm text-gray-500">
        <div>Mostrando {paginatedData.length} de {filteredData.length} registro{filteredData.length !== 1 ? 's' : ''}</div>
        {totalPages > 1 && (
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8">
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8">
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export RefreshCw for loading state
import { RefreshCw } from 'lucide-react';
