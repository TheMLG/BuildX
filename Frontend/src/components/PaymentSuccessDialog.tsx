import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onViewOrder: () => void;
}

const PaymentSuccessDialog = ({
  open,
  onOpenChange,
  orderId,
  onViewOrder,
}: PaymentSuccessDialogProps) => {
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/download-bill`);
      
      if (!response.ok) {
        throw new Error("Failed to download bill");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Invoice downloaded successfully!",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download invoice. Please try again.",
      });
    } finally {
      setDownloadingPDF(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-center text-2xl">Payment Successful!</DialogTitle>
          <DialogDescription className="text-center">
            Your payment has been processed successfully.
            <br />
            <span className="font-medium">Order ID: {orderId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Get your invoice:
          </p>

          <div className="grid gap-3">
            <Button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF || sendingEmail}
              className="w-full"
              variant="default"
            >
              {downloadingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF Invoice
                </>
              )}
            </Button>

          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={onViewOrder} className="w-full" variant="secondary">
            View Order Details
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full"
            variant="ghost"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSuccessDialog;
