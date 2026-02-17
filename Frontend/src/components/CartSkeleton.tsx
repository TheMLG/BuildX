const CartSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card">
        <div className="h-16 w-16 shrink-0 rounded-xl shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 rounded shimmer" />
          <div className="h-4 w-32 rounded shimmer" />
          <div className="h-3 w-12 rounded shimmer" />
        </div>
        <div className="h-8 w-24 rounded-lg shimmer" />
        <div className="h-5 w-16 rounded shimmer" />
      </div>
    ))}
  </div>
);

export default CartSkeleton;
