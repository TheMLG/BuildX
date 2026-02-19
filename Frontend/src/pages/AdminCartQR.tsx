import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

interface GeneratedCart {
  cartId: string;
  url: string;
  createdAt: Date;
}

const AdminCartQR = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [generatedCarts, setGeneratedCarts] = useState<GeneratedCart[]>([]);
  const [customCartId, setCustomCartId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);

  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || "admin";
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
  const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5173";
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    // Check if already logged in
    const loggedIn = sessionStorage.getItem("adminAuthenticated");
    if (loggedIn === "true") {
      setIsAuthenticated(true);
      loadCartsFromDatabase();
    } else {
      // Redirect to admin page if not logged in
      window.location.href = "/admin";
    }
  }, []);

  const loadCartsFromDatabase = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/cart`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Handle non-JSON responses (like 404 HTML pages)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Backend endpoint not available, starting with empty cart list");
        setGeneratedCarts([]);
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        const carts = result.data.map((cart: any) => ({
          cartId: cart.cartId,
          url: `${baseUrl}/cart/${cart.cartId}`,
          createdAt: new Date(cart.createdAt),
        }));
        setGeneratedCarts(carts);
      } else {
        setGeneratedCarts([]);
      }
    } catch (error) {
      console.error("Error loading carts:", error);
      // Don't show error toast, just start with empty list
      setGeneratedCarts([]);
    }
  };

  const generateCartId = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CART-${timestamp}-${random}`;
  };

  const handleGenerateCart = async () => {
    const cartId = customCartId || generateCartId();
    const url = `${baseUrl}/cart/${cartId}`;

    // Check if cart ID already exists
    if (generatedCarts.some(cart => cart.cartId === cartId)) {
      toast({
        title: "Error",
        description: "This cart ID already exists",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create cart in database
      const response = await fetch(`${apiUrl}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to create cart");
      }

      // Add cart to local state
      const newCart: GeneratedCart = {
        cartId,
        url,
        createdAt: new Date(),
      };

      const updatedCarts = [newCart, ...generatedCarts];
      setGeneratedCarts(updatedCarts);
      setCustomCartId("");

      toast({
        title: "Success",
        description: "Cart created and QR code generated successfully",
      });
    } catch (error: any) {
      console.error("Error creating cart:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create cart in database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (cartId: string) => {
    const svg = document.getElementById(`qr-${cartId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `cart-qr-${cartId}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const downloadQRCodeSVG = (cartId: string) => {
    const svg = document.getElementById(`qr-${cartId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cart-qr-${cartId}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const deleteCart = async (cartId: string) => {
    if (!confirm("Are you sure you want to delete this QR code and cart?")) return;

    try {
      // Delete cart from database
      const response = await fetch(`${apiUrl}/api/cart/${cartId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to delete cart");
      }

      // Remove from local state
      const updatedCarts = generatedCarts.filter(cart => cart.cartId !== cartId);
      setGeneratedCarts(updatedCarts);

      toast({
        title: "Deleted",
        description: "Cart and QR code deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting cart:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete cart from database",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Cart QR Code Generator</h1>
            <p className="text-gray-600">Generate QR codes for shopping carts</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <a href="/admin">Back to Admin</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/">Go to Home</a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Generate New Cart</CardTitle>
                <CardDescription>Create a QR code for a new shopping cart</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cartId">Custom Cart ID (Optional)</Label>
                  <Input
                    id="cartId"
                    value={customCartId}
                    onChange={(e) => setCustomCartId(e.target.value)}
                    placeholder="Leave empty for auto-generate"
                  />
                  <p className="text-xs text-gray-500">
                    If empty, a unique ID will be generated automatically
                  </p>
                </div>
                <Button onClick={handleGenerateCart} className="w-full" disabled={loading}>
                  {loading ? "Creating Cart..." : "Generate QR Code"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Carts Grid */}
          <div className="lg:col-span-2">
            {generatedCarts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">No QR codes generated yet</p>
                    <p className="text-sm">Generate your first cart QR code to get started</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedCarts.map((cart) => (
                  <Card key={cart.cartId}>
                    <CardHeader>
                      <CardTitle className="text-lg font-mono">{cart.cartId}</CardTitle>
                      <CardDescription>
                        {cart.createdAt.toLocaleDateString()} {cart.createdAt.toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* QR Code Display */}
                      <div className="flex justify-center p-4 bg-white rounded-lg border">
                        <QRCodeSVG
                          id={`qr-${cart.cartId}`}
                          value={cart.url}
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                      </div>

                      {/* URL Display */}
                      <div className="space-y-2">
                        <Label className="text-xs">Cart URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={cart.url}
                            readOnly
                            className="text-xs bg-gray-50 font-mono"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(cart.url)}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadQRCode(cart.cartId)}
                        >
                          Download PNG
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadQRCodeSVG(cart.cartId)}
                        >
                          Download SVG
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={cart.url} target="_blank" rel="noopener noreferrer">
                            Open Cart
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteCart(cart.cartId)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        {generatedCarts.length > 0 && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800">
              <ul className="list-disc list-inside space-y-1">
                <li>Download the QR code in PNG or SVG format</li>
                <li>Print the QR code and place it in your store</li>
                <li>Customers scan the QR code to access their shopping cart</li>
                <li>Each cart has a unique ID and maintains its state</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminCartQR;
