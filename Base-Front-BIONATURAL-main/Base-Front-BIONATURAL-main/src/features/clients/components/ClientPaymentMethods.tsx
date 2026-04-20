import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  CreditCard,
  Plus,
  Edit3,
  Trash2,
  Shield,
  CheckCircle,
  ArrowLeft,
  Leaf,
  Wallet,
  Star
} from 'lucide-react';

interface ClientPaymentMethodsProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  onBack: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit' | 'paypal' | 'bank_transfer';
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  provider: string;
  isDefault: boolean;
  lastUsed?: Date;
}

const SAMPLE_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: '1',
    type: 'credit',
    cardNumber: '**** **** **** 4532',
    cardHolder: 'Juan Pérez García',
    expiryDate: '12/25',
    provider: 'Visa',
    isDefault: true,
    lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    type: 'debit',
    cardNumber: '**** **** **** 8901',
    cardHolder: 'Juan Pérez García',
    expiryDate: '08/27',
    provider: 'Mastercard',
    isDefault: false,
    lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    type: 'paypal',
    cardNumber: 'juan.perez@email.com',
    cardHolder: 'Juan Pérez García',
    expiryDate: '',
    provider: 'PayPal',
    isDefault: false,
    lastUsed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
];

const getCardIcon = (provider: string) => {
  return CreditCard; // En un caso real, aquí iríamos iconos específicos de cada proveedor
};

const getCardTypeLabel = (type: string) => {
  switch (type) {
    case 'credit':
      return 'Tarjeta de Crédito';
    case 'debit':
      return 'Tarjeta de Débito';
    case 'paypal':
      return 'PayPal';
    case 'bank_transfer':
      return 'Transferencia Bancaria';
    default:
      return 'Método de Pago';
  }
};

const validateCardNumber = (cardNumber: string): boolean => {
  // Implementación básica del algoritmo de Luhn
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleanNumber)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

const validateExpiryDate = (expiryDate: string): boolean => {
  const [month, year] = expiryDate.split('/');
  if (!month || !year) return false;
  
  const monthNum = parseInt(month);
  const yearNum = parseInt(`20${year}`);
  
  if (monthNum < 1 || monthNum > 12) return false;
  
  const now = new Date();
  const expiry = new Date(yearNum, monthNum - 1);
  
  return expiry > now;
};

const formatCardNumber = (value: string): string => {
  const cleanValue = value.replace(/\s/g, '');
  const groups = cleanValue.match(/.{1,4}/g) || [];
  return groups.join(' ').substr(0, 19); // Máximo 16 dígitos + 3 espacios
};

const maskCardNumber = (cardNumber: string): string => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (cleanNumber.length < 4) return cardNumber;
  const lastFour = cleanNumber.slice(-4);
  return `**** **** **** ${lastFour}`;
};

export function ClientPaymentMethods({ user, onBack }: ClientPaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(SAMPLE_PAYMENT_METHODS);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'credit' as const,
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    provider: 'Visa',
    isDefault: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (method: typeof newPaymentMethod) => {
    const newErrors: Record<string, string> = {};

    if (!method.cardHolder.trim()) {
      newErrors.cardHolder = 'El nombre del titular es requerido';
    }

    if (method.type !== 'paypal') {
      if (!method.cardNumber.trim()) {
        newErrors.cardNumber = 'El número de tarjeta es requerido';
      } else if (!validateCardNumber(method.cardNumber)) {
        newErrors.cardNumber = 'Número de tarjeta inválido';
      }

      if (!method.expiryDate.trim()) {
        newErrors.expiryDate = 'La fecha de vencimiento es requerida';
      } else if (!validateExpiryDate(method.expiryDate)) {
        newErrors.expiryDate = 'Fecha de vencimiento inválida';
      }
    } else {
      if (!method.cardNumber.includes('@')) {
        newErrors.cardNumber = 'Email inválido para PayPal';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPaymentMethod = () => {
    if (!validateForm(newPaymentMethod)) return;

    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      ...newPaymentMethod,
      cardNumber: newPaymentMethod.type === 'paypal' 
        ? newPaymentMethod.cardNumber 
        : maskCardNumber(newPaymentMethod.cardNumber)
    };

    // Si es el primer método o se marca como predeterminado
    if (paymentMethods.length === 0 || newPaymentMethod.isDefault) {
      setPaymentMethods(prev => [
        ...prev.map(method => ({ ...method, isDefault: false })),
        { ...newMethod, isDefault: true }
      ]);
    } else {
      setPaymentMethods(prev => [...prev, newMethod]);
    }

    setNewPaymentMethod({
      type: 'credit',
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      provider: 'Visa',
      isDefault: false
    });
    setIsAddingNew(false);
    toast.success('Método de pago agregado exitosamente');
  };

  const handleEditPaymentMethod = () => {
    if (!editingMethod || !validateForm({
      type: editingMethod.type,
      cardNumber: editingMethod.cardNumber,
      cardHolder: editingMethod.cardHolder,
      expiryDate: editingMethod.expiryDate,
      provider: editingMethod.provider,
      isDefault: editingMethod.isDefault
    })) return;

    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === editingMethod.id ? editingMethod : method
      )
    );
    setEditingMethod(null);
    toast.success('Método de pago actualizado exitosamente');
  };

  const handleDeletePaymentMethod = (id: string) => {
    const methodToDelete = paymentMethods.find(m => m.id === id);
    if (methodToDelete?.isDefault && paymentMethods.length > 1) {
      // Si se elimina el método predeterminado, hacer predeterminado al siguiente
      const remainingMethods = paymentMethods.filter(m => m.id !== id);
      remainingMethods[0].isDefault = true;
      setPaymentMethods(remainingMethods);
    } else {
      setPaymentMethods(prev => prev.filter(method => method.id !== id));
    }
    toast.success('Método de pago eliminado');
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
    toast.success('Método de pago predeterminado actualizado');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <h1>Mis Métodos de Pago</h1>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Método
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold">{paymentMethods.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Star className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Predeterminado</p>
                  <p className="text-xl font-semibold">
                    {paymentMethods.find(m => m.isDefault)?.provider || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seguridad</p>
                  <p className="text-xl font-semibold">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Métodos de Pago Guardados
            </CardTitle>
            <CardDescription>
              Gestiona tus métodos de pago de forma segura
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No tienes métodos de pago</h3>
                <p className="text-muted-foreground mb-4">
                  Agrega tu primer método de pago para realizar compras fácilmente.
                </p>
                <Button onClick={() => setIsAddingNew(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Método de Pago
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => {
                  const CardIcon = getCardIcon(method.provider);
                  
                  return (
                    <Card key={method.id} className={`${method.isDefault ? 'border-primary bg-primary/5' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                              <CardIcon className="h-6 w-6 text-gray-600" />
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium">{getCardTypeLabel(method.type)}</h3>
                                {method.isDefault && (
                                  <Badge className="bg-primary text-primary-foreground text-xs">
                                    Predeterminado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {method.cardNumber} • {method.provider}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {method.cardHolder}
                              </p>
                              {method.expiryDate && (
                                <p className="text-xs text-muted-foreground">
                                  Vence: {method.expiryDate}
                                </p>
                              )}
                              {method.lastUsed && (
                                <p className="text-xs text-muted-foreground">
                                  Último uso: {method.lastUsed.toLocaleDateString('es-ES')}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!method.isDefault && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSetDefault(method.id)}
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Predeterminado
                              </Button>
                            )}
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingMethod(method)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar método de pago?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El método de pago será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePaymentMethod(method.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium">Tus datos están protegidos</p>
                <p className="text-sm text-muted-foreground">
                  Utilizamos encriptación de nivel bancario para proteger toda tu información de pago. 
                  Nunca almacenamos los números completos de tarjeta ni códigos de seguridad.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Method Dialog */}
      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Método de Pago</DialogTitle>
            <DialogDescription>
              Agrega un nuevo método de pago de forma segura
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Tipo de Método</Label>
              <Select 
                value={newPaymentMethod.type} 
                onValueChange={(value: any) => setNewPaymentMethod(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="debit">Tarjeta de Débito</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cardHolder">Titular</Label>
              <Input
                id="cardHolder"
                placeholder="Nombre del titular"
                value={newPaymentMethod.cardHolder}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cardHolder: e.target.value }))}
                className={errors.cardHolder ? 'border-red-500' : ''}
              />
              {errors.cardHolder && (
                <p className="text-red-500 text-sm mt-1">{errors.cardHolder}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cardNumber">
                {newPaymentMethod.type === 'paypal' ? 'Email de PayPal' : 'Número de Tarjeta'}
              </Label>
              <Input
                id="cardNumber"
                placeholder={newPaymentMethod.type === 'paypal' ? 'email@ejemplo.com' : '1234 5678 9012 3456'}
                value={newPaymentMethod.cardNumber}
                onChange={(e) => {
                  const value = newPaymentMethod.type === 'paypal' 
                    ? e.target.value 
                    : formatCardNumber(e.target.value);
                  setNewPaymentMethod(prev => ({ ...prev, cardNumber: value }));
                }}
                className={errors.cardNumber ? 'border-red-500' : ''}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
              )}
            </div>

            {newPaymentMethod.type !== 'paypal' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Vencimiento</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={newPaymentMethod.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.substr(0, 2) + '/' + value.substr(2, 2);
                      }
                      setNewPaymentMethod(prev => ({ ...prev, expiryDate: value }));
                    }}
                    maxLength={5}
                    className={errors.expiryDate ? 'border-red-500' : ''}
                  />
                  {errors.expiryDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="provider">Proveedor</Label>
                  <Select 
                    value={newPaymentMethod.provider} 
                    onValueChange={(value) => setNewPaymentMethod(prev => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Visa">Visa</SelectItem>
                      <SelectItem value="Mastercard">Mastercard</SelectItem>
                      <SelectItem value="American Express">American Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {newPaymentMethod.type === 'paypal' && (
              <div>
                <Label htmlFor="provider">Proveedor</Label>
                <Input
                  value="PayPal"
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={newPaymentMethod.isDefault}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isDefault" className="text-sm">
                Usar como método predeterminado
              </Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsAddingNew(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPaymentMethod}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Method Dialog */}
      <Dialog open={!!editingMethod} onOpenChange={() => setEditingMethod(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Método de Pago</DialogTitle>
            <DialogDescription>
              Actualiza la información de tu método de pago
            </DialogDescription>
          </DialogHeader>
          
          {editingMethod && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-cardHolder">Titular</Label>
                <Input
                  id="edit-cardHolder"
                  value={editingMethod.cardHolder}
                  onChange={(e) => setEditingMethod(prev => prev ? ({ ...prev, cardHolder: e.target.value }) : null)}
                />
              </div>

              {editingMethod.type !== 'paypal' && (
                <div>
                  <Label htmlFor="edit-expiryDate">Vencimiento</Label>
                  <Input
                    id="edit-expiryDate"
                    placeholder="MM/YY"
                    value={editingMethod.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.substr(0, 2) + '/' + value.substr(2, 2);
                      }
                      setEditingMethod(prev => prev ? ({ ...prev, expiryDate: value }) : null);
                    }}
                    maxLength={5}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isDefault"
                  checked={editingMethod.isDefault}
                  onChange={(e) => setEditingMethod(prev => prev ? ({ ...prev, isDefault: e.target.checked }) : null)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-isDefault" className="text-sm">
                  Usar como método predeterminado
                </Label>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditingMethod(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEditPaymentMethod}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}