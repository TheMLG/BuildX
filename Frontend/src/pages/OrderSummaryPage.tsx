import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CartItem, TAX_RATE } from "@/types/cart";
import CustomerInfoDialog, { CustomerInfo } from "@/components/CustomerInfoDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingBag, CreditCard, Tag, Receipt, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_your_key_id";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CartResponse {
  success: boolean;
  data: {
    _id: string;
    cartId: string;
    status: string;
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

const OrderSummaryPage = () => {
  const { cartId } = useParams<{ cartId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCartId, setCurrentCartId] = useState<string>("");
  const [customerInfoOpen, setCustomerInfoOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (!cartId) {
      setError("No cart ID provided.");
      setLoading(false);
      return;
    }

    const fetchCart = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/cart/${cartId}`);
        const result: CartResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch cart");
        }

        if (result.data) {
          setCurrentCartId(result.data.cartId);
          const transformedItems: CartItem[] = result.data.items.map((item) => ({
            id: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: "🛒",
            category: "Product",
          }));
          setItems(transformedItems);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [cartId]);

  const { subtotal, itemCount } = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          subtotal: acc.subtotal + item.price * item.quantity,
          itemCount: acc.itemCount + item.quantity,
        }),
        { subtotal: 0, itemCount: 0 }
      ),
    [items]
  );

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handlePaymentSubmit = async (customerInfo: CustomerInfo) => {
    setPaymentLoading(true);

    try {
      // Step 1: Create order in database
      const orderResponse = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: currentCartId,
          customerInfo,
          paymentInfo: { method: "razorpay", status: "pending" },
          notes: "",
        }),
      });

      const orderResult = await orderResponse.json();
      if (!orderResponse.ok || !orderResult.success) {
        throw new Error(orderResult.message || "Failed to create order");
      }

      const createdOrder = orderResult.data;

      // Step 2: Create Razorpay order — use the locally computed total
      // (subtotal + tax) which matches what is shown on the order summary page.
      // Do NOT use createdOrder.totalAmount from the API response to avoid
      // any serialisation / rounding mismatch between the cart subtotal and
      // the tax-inclusive total.
      const rzpOrderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,            // total = subtotal + tax, computed on this page
          currency: "INR",
          receipt: createdOrder.orderId,
          notes: { orderId: createdOrder.orderId, cartId: currentCartId },
        }),
      });

      const rzpOrderResult = await rzpOrderResponse.json();
      if (!rzpOrderResponse.ok || !rzpOrderResult.success) {
        throw new Error(rzpOrderResult.message || "Failed to create payment order");
      }

      const razorpayOrder = rzpOrderResult.data;

      // Step 3: Open Razorpay checkout
      setCustomerInfoOpen(false);

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "BuildX Store",
        description: `Order ${createdOrder.orderId}`,
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
            // Step 4: Verify payment
            const verifyResponse = await fetch(`${API_URL}/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: createdOrder.orderId,
              }),
            });

            const verifyResult = await verifyResponse.json();
            if (!verifyResponse.ok || !verifyResult.success) {
              throw new Error(verifyResult.message || "Payment verification failed");
            }

            toast({ title: "Payment Successful!", description: "Your order has been confirmed." });
            navigate(`/order/${createdOrder.orderId}`);
          } catch (err) {
            toast({
              variant: "destructive",
              title: "Payment Verification Failed",
              description: err instanceof Error ? err.message : "Failed to verify payment",
            });
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone,
        },
        theme: { color: "#4F46E5" },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            toast({ title: "Payment Cancelled", description: "You cancelled the payment process." });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: err instanceof Error ? err.message : "Failed to process checkout",
      });
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading your order…</p>
        </div>
      </div>
    );
  }

  if (error || items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error || "Your cart appears to be empty."}</p>
            <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold leading-tight">Order Summary</h1>
            <p className="text-xs text-muted-foreground">Review your items before paying</p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Cart Items Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              Items in Cart
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                    {item.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ₹{item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-sm shrink-0">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Price Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span className="font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  GST / Tax
                  <span className="text-xs bg-muted rounded px-1 py-0.5">
                    {(TAX_RATE * 100).toFixed(0)}%
                  </span>
                </span>
                <span className="font-medium text-foreground">₹{tax.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-base font-semibold">Total Payable</span>
                <span className="text-xl font-bold text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info Note */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">
          <Receipt className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            A digital invoice will be generated after successful payment. You will need to show it
            to the security guard while exiting.
          </p>
        </div>

        {/* Pay Button */}
        <div className="pt-2 pb-8">
          <Button
            size="lg"
            className="w-full text-base font-semibold h-14 rounded-xl shadow-md"
            onClick={() => setCustomerInfoOpen(true)}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </span>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ₹{total.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </main>

      {/* Customer Info Dialog */}
      <CustomerInfoDialog
        open={customerInfoOpen}
        onOpenChange={setCustomerInfoOpen}
        onSubmit={handlePaymentSubmit}
        isLoading={paymentLoading}
      />
    </div>
  );
};

export default OrderSummaryPage;
