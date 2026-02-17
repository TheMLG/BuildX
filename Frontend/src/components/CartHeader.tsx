import { Wifi } from "lucide-react";

interface CartHeaderProps {
  cartId: string;
  isConnected: boolean;
}

const CartHeader = ({ cartId, isConnected }: CartHeaderProps) => (
  <header className="flex items-center justify-between border-b border-border bg-card/80 px-3 py-3 sm:px-6 sm:py-4 backdrop-blur-sm">
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary/10">
        <Wifi className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
      </div>
      <div>
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">SmartCart</h1>
        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{cartId}</p>
      </div>
    </div>

    <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-secondary px-2 py-1 sm:px-3 sm:py-1.5">
      <span
        className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${
          isConnected ? "bg-success animate-pulse-dot" : "bg-muted-foreground"
        }`}
      />
      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground hidden xs:inline">
        {isConnected ? "Connected" : "Offline"}
      </span>
    </div>
  </header>
);

export default CartHeader;
