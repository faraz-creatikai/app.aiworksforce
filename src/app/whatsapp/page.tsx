"use client";

import { useEffect, useRef, useState } from "react";

// 1. Tell TypeScript about the global Facebook SDK variables
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export default function WhatsAppIntegrationPage() {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // 2. We use a ref to store these IDs because Meta sends them via window.postMessage 
  // before the FB.login callback finishes.
  const signupData = useRef<{ waba_id: string | null; phone_number_id: string | null }>({
    waba_id: null,
    phone_number_id: null,
  });

  useEffect(() => {
    // 3. Initialize Facebook SDK
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID || "",
        cookie: true,
        xfbml: true,
        version: "v21.0",
      });
      setIsSdkLoaded(true);
    };

    // Load the SDK script asynchronously
    (function (d, s, id) {
      let js: any, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    })(document, "script", "facebook-jssdk");

    // 4. Listen for the Embedded Signup data injected by Meta's popup
    const sessionInfoListener = (event: MessageEvent) => {
      // Security check: ensure the message is actually from Meta
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP" && data.event === "FINISH") {
          console.log("✅ Received WhatsApp IDs from Meta popup:", data.data);
          signupData.current.phone_number_id = data.data.phone_number_id;
          signupData.current.waba_id = data.data.waba_id;
        }
      } catch (err) {
        // Ignore non-JSON messages (browser extensions often send these)
      }
    };

    window.addEventListener("message", sessionInfoListener);
    return () => window.removeEventListener("message", sessionInfoListener);
  }, []);

const handleConnectWhatsApp = () => {
    if (!window.FB) {
      setMessage({ type: "error", text: "Facebook SDK is not loaded yet." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // 5. Trigger the Meta Login Popup
    window.FB.login(
      function (response: any) { // 👈 FIX: Changed from async to standard function
        
        // Wrap your async logic inside this self-executing function
        (async () => {
          if (response.authResponse?.code) {
            const code = response.authResponse.code;
            const { waba_id, phone_number_id } = signupData.current;

            if (!waba_id || !phone_number_id) {
              setIsLoading(false);
              setMessage({ type: "error", text: "Setup incomplete. Did you finish the WhatsApp wizard?" });
              return;
            }

            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/social-auth/connect-meta-whatsapp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ code, waba_id, phone_number_id }),
              });

              const data = await res.json();
              if (!res.ok) throw new Error(data.message || "Failed to connect to backend.");

              setMessage({ type: "success", text: data.message || "WhatsApp Connected!" });
            } catch (error: any) {
              console.error("Backend Error:", error);
              setMessage({ type: "error", text: error.message || "Failed to connect to backend." });
            }
          } else {
            setMessage({ type: "error", text: "Facebook login was cancelled or failed." });
          }
          setIsLoading(false);
        })(); // 👈 Execute the async wrapper
      },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "whatsapp_business_app_onboarding",
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-8 mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-2">WhatsApp Channel Setup</h1>
      <p className="text-gray-600 mb-6">
        Connect your Official WhatsApp Business account to sync incoming messages and send bulk broadcasts.
      </p>

      {message && (
        <div className={`p-4 mb-6 rounded ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message.text}
        </div>
      )}

      <button
        onClick={handleConnectWhatsApp}
        disabled={!isSdkLoaded || isLoading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-[#25D366] hover:bg-[#128C7E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {isLoading ? "Connecting..." : "Connect Official WhatsApp"}
      </button>

      <div className="mt-8 text-sm text-gray-500 border-t pt-4">
        <p><strong>Note:</strong> Ensure your browser allows popups for this site. You will need to verify your business details with Meta during this process.</p>
      </div>
    </div>
  );
}