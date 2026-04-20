import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { toast } from 'sonner';
import { getTransactions } from '../../../lib/api';
import {
  ArrowUpDown,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Truck,
  User,
  Calendar,
  Hash,
  AlertTriangle,
} from 'lucide-react';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
  user?: { id: number; name: string; email: string } | null;
  purchase?: { id: number; status: string } | null;
  sale?: { id: number; status: string } | null;
}

const TRANSACTION_TYPES = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'SALE', label: 'Venta' },
  { value: 'REFUND', label: 'Reembolso' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
];

const TYPE_COLORS: Record<string, string> = {
  PURCHASE: 'bg-blue-100 text-blue-800',
  SALE: 'bg-green-100 text-green-800',
  REFUND: 'bg-red-100 text-red-800',
  ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
};

const TYPE_LABELS: Record<string, string> = {
  PURCHASE: 'Compra',
  SALE: 'Venta',
  REFUND: 'Reembolso',
  ADJUSTMENT: 'Ajuste',
};

const ITEMS_PER_PAGE = 10;

export function TransactionManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTransactions({ limit: 200 });
      if (res.success) setTransactions(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones');
      toast.error('Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let filtered = transactions.filter(t => {
      const matchesSearch =
        String(t.id).includes(searchTerm) ||
        (t.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
    });

    return filtered;
  }, [transactions, searchTerm, typeFilter, sortOrder]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filteredAndSorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const totalAmount = filteredAndSorted.reduce((sum, t) => sum + (t.amount || 0), 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('es-CO', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Cargando transacciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadTransactions} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <ArrowUpDown className="h-6 w-6" />
            Transacciones
          </h2>
          <p className="text-muted-foreground">
            Historial completo de movimientos financieros ({filteredAndSorted.length} registros)
          </p>
        </div>
        <Button variant="outline" onClick={loadTransactions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total registros</p>
              <p className="text-2xl font-semibold">{filteredAndSorted.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monto total</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última transacción</p>
              <p className="text-sm font-medium">
                {transactions.length > 0 ? formatDate(transactions[0].createdAt) : 'Sin datos'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, usuario o descripción..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === 'desc' ? 'Más recientes' : 'Más antiguos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>
            Mostrando {paginated.length} de {filteredAndSorted.length} transacciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron transacciones
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">#{transaction.id}</TableCell>
                    <TableCell>
                      <Badge className={TYPE_COLORS[transaction.type] || 'bg-gray-100 text-gray-800'}>
                        {TYPE_LABELS[transaction.type] || transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount || 0)}
                    </TableCell>
                    <TableCell>
                      {transaction.user ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{transaction.user.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.sale ? (
                        <div className="flex items-center gap-1 text-sm">
                          <ShoppingCart className="h-3 w-3 text-green-600" />
                          <span>Venta #{transaction.sale.id}</span>
                        </div>
                      ) : transaction.purchase ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Truck className="h-3 w-3 text-blue-600" />
                          <span>Compra #{transaction.purchase.id}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedTransaction(transaction); setIsDetailOpen(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Detalle de Transacción #{selectedTransaction?.id}
            </DialogTitle>
            <DialogDescription>
              Información completa del movimiento financiero
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge className={TYPE_COLORS[selectedTransaction.type] || 'bg-gray-100 text-gray-800'}>
                    {TYPE_LABELS[selectedTransaction.type] || selectedTransaction.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monto</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedTransaction.amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="text-sm">{formatDate(selectedTransaction.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usuario</p>
                  <p className="text-sm">{selectedTransaction.user?.name || '—'}</p>
                </div>
                {selectedTransaction.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Descripción</p>
                    <p className="text-sm">{selectedTransaction.description}</p>
                  </div>
                )}
                {selectedTransaction.sale && (
                  <div>
                    <p className="text-sm text-muted-foreground">Venta asociada</p>
                    <p className="text-sm">#{selectedTransaction.sale.id} — {selectedTransaction.sale.status}</p>
                  </div>
                )}
                {selectedTransaction.purchase && (
                  <div>
                    <p className="text-sm text-muted-foreground">Compra asociada</p>
                    <p className="text-sm">#{selectedTransaction.purchase.id} — {selectedTransaction.purchase.status}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
