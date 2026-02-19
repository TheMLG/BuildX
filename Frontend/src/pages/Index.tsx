import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CartHeader from "@/components/CartHeader";
import CartItemCard from "@/components/CartItemCard";
import OrderSummary from "@/components/OrderSummary";
import EmptyCart from "@/components/EmptyCart";
import CartSkeleton from "@/components/CartSkeleton";
import CheckoutDialog, { CustomerInfo } from "@/components/CheckoutDialog";
import PaymentSuccessDialog from "@/components/PaymentSuccessDialog";
import { CartItem } from "@/data/cartData";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_your_key_id";

// Razorpay type declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CartResponse {
  success: boolean;
  statusCode: number;
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

const Index = () => {
  const { cartId } = useParams<{ cartId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCartId, setCurrentCartId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentSuccessDialogOpen, setPaymentSuccessDialogOpen] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const previousItemsCountRef = useRef<number>(0);

  // If no cartId in URL, show error message
  useEffect(() => {
    if (!cartId) {
      setLoading(false);
      setError("No cart ID provided. Please scan a valid QR code or contact admin.");
    }
  }, [cartId, navigate]);

  // Fetch cart data from backend
  useEffect(() => {
    if (!cartId) return;

    const fetchCart = async (isPolling = false) => {
      if (!isPolling) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      try {
        const response = await fetch(`${API_URL}/api/cart/${cartId}`);
        
        const result: CartResponse = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to fetch cart');
        }

        if (result.data) {
          setCurrentCartId(result.data.cartId);
          
          // Transform backend items to frontend CartItem format
          const transformedItems: CartItem[] = result.data.items.map((item) => ({
            id: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: "🛒", // Default emoji, could be enhanced
            category: "Product", // Default category
          }));
          
          // Check if items have changed (new items added)
          if (isPolling && transformedItems.length > previousItemsCountRef.current) {
            toast({
              title: "Cart Updated",
              description: "New items have been added to your cart!",
            });
          }
          
          previousItemsCountRef.current = transformedItems.length;
          setItems(transformedItems);
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
        if (!isPolling) {
          setError(err instanceof Error ? err.message : "Failed to load cart");
        }
      } finally {
        if (!isPolling) {
          setLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    };

    // Initial fetch
    fetchCart(false);

    // Set up polling interval (refresh every 3 seconds)
    const pollingInterval = setInterval(() => {
      fetchCart(true);
    }, 3000);

    // Cleanup interval on unmount or cartId change
    return () => {
      clearInterval(pollingInterval);
    };
  }, [cartId, toast]);

  const updateQuantity = async (id: string, delta: number) => {
    const item = items.find((item) => item.id === id);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    // Optimistically update UI
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, newQuantity) } : item
        )
        .filter((item) => item.quantity > 0)
    );

    try {
      if (newQuantity <= 0) {
        // Remove item if quantity becomes 0 or less
        await fetch(`${API_URL}/api/cart/${currentCartId}/items/${id}`, {
          method: "DELETE",
        });
        
        toast({
          title: "Item removed",
          description: `${item.name} has been removed from your cart.`,
        });
      } else {
        // Update quantity
        const response = await fetch(`${API_URL}/api/cart/${currentCartId}/items/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: newQuantity }),
        });

        if (!response.ok) {
          throw new Error("Failed to update cart");
        }
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      
      // Revert optimistic update on error
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - delta } : item
        )
      );

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update cart. Please try again.",
      });
    }
  };

  const removeItem = async (id: string) => {
    const item = items.find((item) => item.id === id);
    if (!item) return;

    // Optimistically update UI
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const response = await fetch(`${API_URL}/api/cart/${currentCartId}/items/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      toast({
        title: "Item removed",
        description: `${item.name} has been removed from your cart.`,
      });
    } catch (error) {
      console.error("Error removing item:", error);
      
      // Revert optimistic update on error
      setItems((prev) => [...prev, item]);

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove item. Please try again.",
      });
    }
  };

  const handleCheckoutClick = () => {
    setCheckoutDialogOpen(true);
  };

  const handleCheckoutSubmit = async (customerInfo: CustomerInfo) => {
    setCheckoutLoading(true);
    setCustomerEmail(customerInfo.email);
    
    try {
      // Step 1: Create order in database
      const orderResponse = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartId: currentCartId,
          customerInfo,
          paymentInfo: {
            method: "razorpay",
            status: "pending",
          },
          notes: "",
        }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok || !orderResult.success) {
        throw new Error(orderResult.message || "Failed to create order");
      }

      const createdOrder = orderResult.data;

      // Step 2: Create Razorpay order
      const razorpayOrderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: createdOrder.totalAmount,
          currency: "INR",
          receipt: createdOrder.orderId,
          notes: {
            orderId: createdOrder.orderId,
            cartId: currentCartId,
          },
        }),
      });

      const razorpayOrderResult = await razorpayOrderResponse.json();

      if (!razorpayOrderResponse.ok || !razorpayOrderResult.success) {
        throw new Error(razorpayOrderResult.message || "Failed to create Razorpay order");
      }

      const razorpayOrder = razorpayOrderResult.data;

      // Step 3: Open Razorpay checkout
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
              headers: {
                "Content-Type": "application/json",
              },
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

            // Close checkout dialog
            setCheckoutDialogOpen(false);
            setCheckoutLoading(false);

            // Show payment success dialog
            setCompletedOrderId(createdOrder.orderId);
            setPaymentSuccessDialogOpen(true);

            toast({
              title: "Payment Successful!",
              description: "Your order has been confirmed.",
            });
          } catch (error) {
            console.error("Payment verification error:", error);
            toast({
              variant: "destructive",
              title: "Payment Verification Failed",
              description: error instanceof Error ? error.message : "Failed to verify payment",
            });
            setCheckoutLoading(false);
          }
        },
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone,
        },
        theme: {
          color: "#4F46E5",
        },
        modal: {
          ondismiss: function () {
            setCheckoutLoading(false);
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Error during checkout:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to process checkout",
      });
      setCheckoutLoading(false);
    }
  };

  const { subtotal, itemCount } = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + item.price * item.quantity,
        itemCount: acc.itemCount + item.quantity,
      }),
      { subtotal: 0, itemCount: 0 }
    );
  }, [items]);

  return (
    <div className="min-h-screen bg-background pb-[180px] md:pb-0">
      <CartHeader cartId={currentCartId || "Loading..."} isConnected={true} />

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        
        <div className="grid gap-6 md:gap-8 lg:grid-cols-[1fr_340px]">
          {/* Items */}
          <section>
            <div className="mb-3 md:mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Cart Items
                </h2>
                {!loading && (
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${isRefreshing ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`} />
                    <span className="text-[10px] text-muted-foreground">Live</span>
                  </div>
                )}
              </div>
              {!loading && items.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 sm:px-2.5 text-[10px] sm:text-xs font-semibold text-primary">
                  {itemCount} items
                </span>
              )}
            </div>

            {loading ? (
              <CartSkeleton />
            ) : items.length === 0 ? (
              <EmptyCart cartId={currentCartId} />
            ) : (
              <div className="space-y-2 md:space-y-3">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Summary */}
          {!loading && items.length > 0 && (
            <aside className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm p-3 shadow-lg md:relative md:border-0 md:bg-transparent md:backdrop-blur-none md:p-0 md:shadow-none lg:sticky lg:top-8 lg:self-start">
              <OrderSummary 
                subtotal={subtotal} 
                itemCount={itemCount} 
                onCheckout={handleCheckoutClick}
              />
            </aside>
          )}
        </div>
      </main>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutDialogOpen}
        onOpenChange={setCheckoutDialogOpen}
        onSubmit={handleCheckoutSubmit}
        isLoading={checkoutLoading}
      />

      {/* Payment Success Dialog */}
      <PaymentSuccessDialog
        open={paymentSuccessDialogOpen}
        onOpenChange={setPaymentSuccessDialogOpen}
        orderId={completedOrderId}
        customerEmail={customerEmail}
        onViewOrder={() => {
          setPaymentSuccessDialogOpen(false);
          navigate(`/order/${completedOrderId}`);
        }}
      />
    </div>
  );
};

export default Index;
