import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | string;
  ticketNumber: string;
  onSuccess?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketNumber,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Silakan pilih rating terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`tickets/${ticketId}/feedback`, {
        rating,
        feedback_text: feedbackText || null,
      });

      toast.success('Terima kasih atas feedback Anda!');
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      toast.error(error?.response?.data?.message || 'Gagal mengirim feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setFeedbackText('');
    onClose();
  };

  const handleSkip = () => {
    if (rating === 0 && !feedbackText.trim()) {
      toast.warning('Anda belum mengisi feedback. Tiket sudah ditutup, Anda bisa mengisi feedback nanti melalui tombol "Isi Feedback"', {
        duration: 4000,
      });
    }
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Berikan Feedback</DialogTitle>
          <DialogDescription>
            Bagaimana pengalaman Anda dengan layanan perbaikan untuk tiket{' '}
            <span className="font-semibold text-foreground">{ticketNumber}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rating Kepuasan <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && 'Sangat Tidak Puas'}
                {rating === 2 && 'Tidak Puas'}
                {rating === 3 && 'Cukup'}
                {rating === 4 && 'Puas'}
                {rating === 5 && 'Sangat Puas'}
              </p>
            )}
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <label htmlFor="feedback-text" className="text-sm font-medium">
              Komentar Tambahan (Opsional)
            </label>
            <Textarea
              id="feedback-text"
              placeholder="Ceritakan pengalaman Anda dengan layanan kami..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              maxLength={1000}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {feedbackText.length}/1000 karakter
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            Lewati
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              'Kirim Feedback'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
