import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Product {
  _id: string;
  productId: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  stock: number;
  nfcTagId: string;
}

const Test = () => {
  const [loading, setLoading] = useState(false);
  const [customCartId, setCustomCartId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const { toast } = useToast();

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      setFetchingProducts(true);
      try {
        const response = await fetch(`${apiUrl}/api/products`);
        const result = await response.json();
        
        if (result.success) {
          setProducts(result.data.products);
        } else {
          throw new Error("Failed to fetch products");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Failed to load products from database",
          variant: "destructive",
        });
      } finally {
        setFetchingProducts(false);
      }
    };

    fetchProducts();
  }, [apiUrl, toast]);

  const addProductToSpecificCart = async (product: Product, cartId: string, quantity: number = 1) => {
    if (!cartId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a cart ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/cart/${cartId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.productId,
          name: product.name,
          price: product.price,
          quantity: quantity,
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: `Added ${product.name} (×${quantity}) to cart ${cartId}`,
        });
      } else {
        throw new Error("Failed to add product");
      }
      
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAllProductsToSpecificCart = async () => {
    if (!customCartId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a cart ID",
        variant: "destructive",
      });
      return;
    }

    if (products.length === 0) {
      toast({
        title: "Error",
        description: "No products available. Please add products in admin panel first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      let successCount = 0;
      
      for (const product of products) {
        const response = await fetch(`${apiUrl}/api/cart/${customCartId}/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.productId,
            name: product.name,
            price: product.price,
            quantity: 1,
          }),
        });
        
        if (response.ok) {
          successCount++;
        } else {
          console.error(`Failed to add ${product.name}`);
        }
      }
      
      toast({
        title: "Success!",
        description: `Added ${successCount} products to cart ${customCartId}`,
      });
      
    } catch (error) {
      console.error("Error adding products:", error);
      toast({
        title: "Error",
        description: "Failed to add products to cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Test Page</h1>
          <p className="text-gray-600">Add products from database to existing carts for testing</p>
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ Note: Carts can only be created by admin. Get a cart ID from the admin panel.
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Add Products to Specific Cart</CardTitle>
              <CardDescription>
                Enter a cart ID (created from admin panel) and add products for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customCartId">Cart ID</Label>
                <Input
                  id="customCartId"
                  value={customCartId}
                  onChange={(e) => setCustomCartId(e.target.value)}
                  placeholder="Enter cart ID (e.g., CART-123456)"
                />
              </div>
              
              <Button 
                onClick={addAllProductsToSpecificCart} 
                disabled={loading || !customCartId.trim() || products.length === 0 || fetchingProducts}
                size="lg"
                className="w-full"
              >
                {loading ? "Adding Products..." : fetchingProducts ? "Loading Products..." : `Add All ${products.length} Products to This Cart`}
              </Button>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Or add products individually:</p>
                {fetchingProducts ? (
                  <p className="text-center py-4 text-gray-500">Loading products...</p>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-2">No products found</p>
                    <p className="text-sm text-gray-500">Add products in the admin panel first</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-3"
                      asChild
                    >
                      <a href="/admin">Go to Admin Panel</a>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    {products.map((product) => (
                      <div 
                        key={product.productId} 
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{product.name}</p>
                            {product.category && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {product.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-gray-600">
                              ${product.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {product.stock}
                            </p>
                            <code className="text-xs bg-gray-200 px-1 rounded">
                              {product.productId}
                            </code>
                          </div>
                        </div>
                        <Button 
                          onClick={() => addProductToSpecificCart(product, customCartId, 1)}
                          disabled={loading || !customCartId.trim()}
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {customCartId && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <a href={`/cart/${customCartId}`}>
                    View Cart: {customCartId}
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to the Admin Panel (login required)</li>
                <li>Add products with NFC tag mappings (if not already added)</li>
                <li>Navigate to Cart QR Generator</li>
                <li>Generate a new cart QR code</li>
                <li>Copy the cart ID</li>
                <li>Come back here and paste the cart ID above</li>
                <li>Add products from database for testing</li>
              </ol>
              <p className="text-xs mt-3 text-blue-700">
                💡 Products shown below are loaded from the database. Make sure to add products in the admin panel first.
              </p>
            </div>
            <div className="flex gap-3 pt-3 border-t border-blue-200">
              <Button variant="outline" asChild>
                <a href="/">Go to Home</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/admin/cart-qr">Admin QR Generator</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Test;
