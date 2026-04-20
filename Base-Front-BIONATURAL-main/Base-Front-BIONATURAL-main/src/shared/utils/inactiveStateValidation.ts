/**
 * Utilidades para validación y manejo de estados inactivos (activo/inactivo)
 * Permite deshabilitación visual de items inactivos en tablas y formularios
 */

export interface IInactiveItem {
  status?: 'Activo' | 'Inactivo' | 'Descontinuado';
  isActive?: boolean;
  active?: boolean; // algunos componentes pueden usar este campo
}

/**
 * Verifica si un item está inactivo
 * Valida múltiples campos posibles según la estructura del item
 * 
 * @param item - Item a verificar
 * @returns true si el item está inactivo, false si está activo
 */
export function isItemInactive(item: IInactiveItem | any): boolean {
  if (!item) return false;

  // Prioridad: verificar `status` primero
  if (item.status) {
    return item.status === 'Inactivo' || item.status === 'Descontinuado';
  }

  // Luego verificar `isActive`
  if (typeof item.isActive === 'boolean') {
    return !item.isActive;
  }

  // Verificar `active` como alternativa
  if (typeof item.active === 'boolean') {
    return !item.active;
  }

  // Por defecto, asumir que es activo
  return false;
}

/**
 * Obtiene el mensaje de error para un item inactivo
 * @returns Mensaje de error estandarizado
 */
export function getInactiveItemDisabledMessage(): string {
  return 'Este elemento está inactivo. No se puede realizar acciones sobre elementos inactivos.';
}

/**
 * Obtiene clases Tailwind para mostrar un item inactivo de forma visual
 * Aplica opacidad, filtro grayscale y un fondo atenuado
 * 
 * @param options - Opciones de personalización
 * @returns String de clases Tailwind
 * 
 * @example
 * className={`${baseClass} ${getInactiveItemClassName({ disabled: isInactive })}`}
 */
export function getInactiveItemClassName(options?: {
  disabled?: boolean;
  showOpacity?: boolean;
  showGrayscale?: boolean;
  showBackground?: boolean;
}): string {
  const {
    disabled = false,
    showOpacity = true,
    showGrayscale = true,
    showBackground = true,
  } = options || {};

  if (!disabled) {
    return '';
  }

  const classes = [];

  if (showOpacity) {
    classes.push('opacity-60'); // Reduce opacity y hace el item más suave
  }

  if (showGrayscale) {
    classes.push('grayscale'); // Convierte a escala de grises
  }

  if (showBackground) {
    classes.push('bg-muted/70'); // Fondo atenuado para filas inactivas
  }

  classes.push('cursor-not-allowed'); // Cursor deshabilitado

  return classes.join(' ');
}

/**
 * Hook para obtener estado de deshabilitación visual de un item
 * Retorna objeto con propiedades necesarias para deshabilitación
 * 
 * @param item - Item a analizar
 * @returns Objeto con propiedades de deshabilitación
 * 
 * @example
 * const { isDisabled, disabledClassName, tooltipMessage } = useInactiveItemDisable(product);
 * 
 * <Button disabled={isDisabled} className={disabledClassName} title={tooltipMessage}>
 *   Editar
 * </Button>
 */
export interface UseInactiveItemDisableResult {
  isDisabled: boolean;
  disabledClassName: string;
  tooltipMessage: string;
  shouldShowInactive: boolean;
}

export function getInactiveItemDisableState(
  item: IInactiveItem | any
): UseInactiveItemDisableResult {
  const isDisabled = isItemInactive(item);

  return {
    isDisabled,
    disabledClassName: getInactiveItemClassName({ disabled: isDisabled }),
    tooltipMessage: getInactiveItemDisabledMessage(),
    shouldShowInactive: isDisabled,
  };
}

/**
 * Obtiene el texto de estado para mostrar en badges o labels
 * @param item - Item a analizar
 * @returns Texto del estado (ej: "Inactivo", "Descontinuado", "Activo")
 */
export function getItemStatusText(item: IInactiveItem | any): string {
  if (!item) return 'Desconocido';

  if (item.status) {
    return item.status; // Retorna "Activo", "Inactivo", "Descontinuado"
  }

  if (typeof item.isActive === 'boolean') {
    return item.isActive ? 'Activo' : 'Inactivo';
  }

  if (typeof item.active === 'boolean') {
    return item.active ? 'Activo' : 'Inactivo';
  }

  return 'Activo';
}

/**
 * Obtiene el color del badge según el estado
 * @param item - Item a analizar
 * @returns Clase de color Tailwind para el badge
 */
export function getStatusBadgeVariant(item: IInactiveItem | any): 'default' | 'secondary' | 'destructive' | 'outline' {
  const status = getItemStatusText(item);

  switch (status) {
    case 'Activo':
      return 'default'; // Verde
    case 'Inactivo':
      return 'secondary'; // Gris
    case 'Descontinuado':
      return 'destructive'; // Rojo
    default:
      return 'default';
  }
}

/**
 * Filtra items activando acuitomente solo los activos
 * @param items - Lista de items
 * @returns Lista filtrada solo con items activos
 */
export function filterActiveItems(items: (IInactiveItem & any)[]): typeof items {
  return items.filter(item => !isItemInactive(item));
}

/**
 * Grupo de items por estado
 * @param items - Lista de items
 * @returns Objeto agrupado { active: [...], inactive: [...], discontinued: [...] }
 */
export function groupItemsByStatus(items: (IInactiveItem & any)[]): {
  active: typeof items;
  inactive: typeof items;
  discontinued: typeof items;
} {
  return {
    active: items.filter(item => item.status === 'Activo' || (item.isActive === true && item.status !== 'Descontinuado')),
    inactive: items.filter(item => item.status === 'Inactivo' || item.isActive === false),
    discontinued: items.filter(item => item.status === 'Descontinuado'),
  };
}
