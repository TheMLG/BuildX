import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CartHeader from "@/components/CartHeader";
import CartItemCard from "@/components/CartItemCard";
import OrderSummary from "@/components/OrderSummary";
import EmptyCart from "@/components/EmptyCart";
import CartSkeleton from "@/components/CartSkeleton";
import CheckoutDialog, { CustomerInfo } from "@/components/CheckoutDialog";
import { CartItem } from "@/data/cartData";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

    const fetchCart = async () => {
      setLoading(true);
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
          
          setItems(transformedItems);
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
        setError(err instanceof Error ? err.message : "Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [cartId]);

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckoutClick = () => {
    setCheckoutDialogOpen(true);
  };

  const handleCheckoutSubmit = async (customerInfo: CustomerInfo) => {
    setCheckoutLoading(true);
    
    try {
      // Create order with customer info
      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartId: currentCartId,
          customerInfo,
          paymentInfo: {
            method: "cash", // Default payment method
            status: "pending",
          },
          notes: "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create order");
      }

      // Close dialog
      setCheckoutDialogOpen(false);

      // Show success toast
      toast({
        title: "Order Created!",
        description: `Your order ${result.data.orderId} has been created successfully.`,
      });

      // Navigate to order confirmation page
      navigate(`/order/${result.data.orderId}`);
    } catch (err) {
      console.error("Error creating order:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create order",
      });
    } finally {
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
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Cart Items
              </h2>
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
    </div>
  );
};

export default Index;
