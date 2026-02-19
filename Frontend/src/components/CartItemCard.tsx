import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem as CartItemType } from "@/types/cart";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

const CartItemCard = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
  return (
    <div className="group rounded-2xl bg-card p-3 sm:p-4 shadow-card transition-all duration-200 hover:shadow-soft animate-fade-in">
      {/* Mobile Layout */}
      <div className="flex md:hidden gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-secondary text-3xl overflow-hidden">
          {item.image.startsWith("http") ? (
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            item.image
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {item.category}
              </p>
              <h3 className="font-semibold text-sm text-card-foreground line-clamp-2">{item.name}</h3>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm font-medium text-primary">₹{item.price.toFixed(2)}</p>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onUpdateQuantity(item.id, -1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-7 text-center text-sm font-semibold text-foreground">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, 1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-base font-bold text-foreground min-w-[56px] text-right">
              ₹{(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary text-3xl overflow-hidden">
          {item.image.startsWith("http") ? (
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            item.image
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {item.category}
          </p>
          <h3 className="font-semibold text-card-foreground truncate">{item.name}</h3>
          <p className="text-sm font-medium text-primary">₹{item.price.toFixed(2)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.id, -1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-foreground">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="w-20 text-right font-semibold text-foreground">
          ₹{(item.price * item.quantity).toFixed(2)}
        </p>

        <button
          onClick={() => onRemove(item.id)}
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CartItemCard;
