const CartSkeleton = () => (
  <div className="space-y-2 md:space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-2xl bg-card p-3 sm:p-4 shadow-card">
        {/* Mobile skeleton matches mobile CartItemCard layout */}
        <div className="flex md:hidden gap-3">
          <div className="h-20 w-20 shrink-0 rounded-xl shimmer" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="space-y-1.5 flex-1">
                <div className="h-2.5 w-14 rounded shimmer" />
                <div className="h-4 w-28 rounded shimmer" />
              </div>
              <div className="h-10 w-10 rounded-lg shimmer" />
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="h-3.5 w-12 rounded shimmer" />
              <div className="flex items-center gap-1.5">
                <div className="h-11 w-11 rounded-lg shimmer" />
                <div className="h-4 w-6 rounded shimmer" />
                <div className="h-11 w-11 rounded-lg shimmer" />
              </div>
              <div className="h-4 w-14 rounded shimmer" />
            </div>
          </div>
        </div>

        {/* Desktop skeleton */}
        <div className="hidden md:flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-xl shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-16 rounded shimmer" />
            <div className="h-4 w-32 rounded shimmer" />
            <div className="h-3 w-12 rounded shimmer" />
          </div>
          <div className="h-8 w-24 rounded-lg shimmer" />
          <div className="h-5 w-16 rounded shimmer" />
        </div>
      </div>
    ))}
  </div>
);

export default CartSkeleton;

