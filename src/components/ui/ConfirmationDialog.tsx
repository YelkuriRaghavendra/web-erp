import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  title?: string;
  titleKey?: string;
  titleDefault?: string;
  description?: string;
  descriptionKey?: string;
  descriptionDefault?: string;
  cancelText?: string;
  cancelTextKey?: string;
  cancelTextDefault?: string;
  confirmText?: string;
  confirmTextKey?: string;
  confirmTextDefault?: string;
  savingText?: string;
  savingTextKey?: string;
  savingTextDefault?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  title,
  titleKey = 'editCompany.confirmDialog.title',
  titleDefault = '¿Estás seguro que quieres guardar estos cambios?',
  description,
  descriptionKey = 'editCompany.confirmDialog.description',
  descriptionDefault = 'Para finalizar, haz clic en Guardar o puedes cancelar si quieres seguir editando.',
  cancelText,
  cancelTextKey = 'editCompany.buttons.cancel',
  cancelTextDefault = 'Cancelar',
  confirmText,
  confirmTextKey = 'editCompany.buttons.save',
  confirmTextDefault = 'Guardar',
  savingText,
  savingTextKey = 'editCompany.buttons.saving',
  savingTextDefault = 'Guardando...',
}) => {
  const { t } = useTranslation();

  const displayTitle = title || t(titleKey, { defaultValue: titleDefault });
  const displayDescription =
    description || t(descriptionKey, { defaultValue: descriptionDefault });
  const displayCancelText =
    cancelText || t(cancelTextKey, { defaultValue: cancelTextDefault });
  const displayConfirmText =
    confirmText || t(confirmTextKey, { defaultValue: confirmTextDefault });
  const displaySavingText =
    savingText || t(savingTextKey, { defaultValue: savingTextDefault });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[380px] p-6'>
        <DialogHeader className='text-center space-y-2 pb-6'>
          <DialogTitle className='text-lg font-medium text-gray-900 text-center mt-4'>
            {displayTitle}
          </DialogTitle>
          <DialogDescription className='text-sm text-gray-600 leading-relaxed px-4 text-center'>
            {displayDescription}
          </DialogDescription>
        </DialogHeader>
        <div className='flex items-center justify-center gap-4 pt-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className='w-[108px] h-[41px]'
          >
            {displayCancelText}
          </Button>
          <Button
            type='button'
            onClick={onConfirm}
            disabled={isPending}
            className='w-[108px] h-[41px] bg-gray-900 hover:bg-black'
          >
            {isPending ? displaySavingText : displayConfirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
