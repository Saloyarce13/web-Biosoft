import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { MessageCircle, X, Phone } from 'lucide-react';

export function WhatsAppFloat() {
  const [isOpen, setIsOpen] = useState(false);
  
  const whatsappNumber = "+573001234567"; // Número de WhatsApp de la empresa
  const defaultMessage = "¡Hola! Me interesa conocer más sobre los productos de Bionatural. ¿Podrían brindarme información?";

  const openWhatsApp = (customMessage?: string) => {
    const message = customMessage || defaultMessage;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
  };

  const quickMessages = [
    {
      text: "Consulta sobre productos",
      message: "Hola, me gustaría obtener información sobre sus productos naturales disponibles."
    },
    {
      text: "Precios y ofertas",
      message: "¡Hola! ¿Podrían informarme sobre precios y ofertas especiales?"
    },
    {
      text: "Horarios de atención",
      message: "Hola, quisiera conocer sus horarios de atención y ubicación."
    },
    {
      text: "Soporte técnico",
      message: "Necesito ayuda con mi pedido o una consulta técnica."
    }
  ];

  return (
    <>
      {/* Panel expandido */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in-0 duration-300">
          <Card className="w-80 shadow-2xl border-2 border-green-200">
            <CardContent className="p-0">
              {/* Header */}
              <div className="bg-green-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Bionatural</h3>
                      <p className="text-xs opacity-90">Estamos en línea</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                <div className="text-sm text-gray-600">
                  <p>¡Hola! 👋</p>
                  <p>¿En qué podemos ayudarte hoy?</p>
                </div>

                {/* Quick message buttons */}
                <div className="space-y-2">
                  {quickMessages.map((item, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2 px-3 text-xs"
                      onClick={() => openWhatsApp(item.message)}
                    >
                      {item.text}
                    </Button>
                  ))}
                </div>

                {/* Direct call button */}
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => openWhatsApp()}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Iniciar chat en WhatsApp
                </Button>

                {/* Phone option */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">O llámanos directamente:</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open(`tel:${whatsappNumber}`, '_self')}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    {whatsappNumber}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
        
        {/* Pulse animation when closed */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"></div>
        )}

        {/* Notification badge */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">1</span>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}