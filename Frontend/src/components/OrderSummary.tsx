import { TAX_RATE } from "@/data/cartData";

interface OrderSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout: () => void;
}

const OrderSummary = ({ subtotal, itemCount, onCheckout }: OrderSummaryProps) => {
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <div className="rounded-2xl md:bg-card md:p-6 md:shadow-card animate-fade-in">
      {/* Mobile: Compact horizontal layout */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {itemCount} items • Tax: ${tax.toFixed(2)}
            </p>
          </div>
          <button 
            onClick={onCheckout}
            className="ml-3 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Desktop: Full vertical layout */}
      <div className="hidden md:block">
        <h2 className="mb-5 text-lg font-semibold text-card-foreground">Order Summary</h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal ({itemCount} items)</span>
            <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
            <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
          </div>

          <div className="my-4 h-px bg-border" />

          <div className="flex justify-between text-base">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={onCheckout}
          className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-200 hover:opacity-90 hover:shadow-elevated active:scale-[0.98]"
        >
          Checkout
        </button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Secure payment powered by SmartCart
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;
