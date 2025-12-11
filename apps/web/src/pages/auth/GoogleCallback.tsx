import { useEffect } from "react";

export default function GoogleCallback() {
  useEffect(() => {
    // Extract token from URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    if (accessToken && window.opener) {
      // Send token to parent window
      window.opener.postMessage(
        { type: "google-oauth", token: accessToken },
        window.location.origin
      );
      window.close();
    } else {
      // No token or no opener, redirect to login
      window.location.href = "/login";
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Processando login...</p>
    </div>
  );
}
