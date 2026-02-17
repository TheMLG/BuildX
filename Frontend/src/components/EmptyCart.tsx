import { ShoppingCart } from "lucide-react";

interface EmptyCartProps {
  cartId?: string;
}

const EmptyCart = ({ cartId }: EmptyCartProps) => (
  <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
      <ShoppingCart className="h-10 w-10 text-muted-foreground" />
    </div>
    <h3 className="mb-2 text-xl font-semibold text-foreground">Your cart is empty</h3>
    <p className="text-sm text-muted-foreground">
      Items added to the smart cart will appear here
    </p>
    {cartId && (
      <p className="mt-3 text-xs text-muted-foreground/80">
        Cart ID: <span className="font-mono font-semibold">{cartId}</span>
      </p>
    )}
  </div>
);

export default EmptyCart;
