"use client";

import { useEffect, useRef, useState } from "react";

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
    const [isConnected, setIsConnected] = useState(false);
    const [isChecking, setIsChecking] = useState(true); // Shows a loader while checking DB

    // 1. Add this state near your other states
    const [accountDetails, setAccountDetails] = useState<{
        name: string;
        phone: string;
        profilePicture: string | null;
        qualityRating: string;
    } | null>(null);

    const signupData = useRef<{ waba_id: string | null; phone_number_id: string | null }>({
        waba_id: null,
        phone_number_id: null,
    });

    useEffect(() => {

        const checkConnectionStatus = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/social-auth/check-meta-whatsapp`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                const data = await res.json();
                if (data.connected) {
                    setIsConnected(true);
                    setAccountDetails(data.accountDetails); // 👈 Save the real Meta data
                }
            } catch (error) {
                console.error("Failed to check connection status:", error);
            } finally {
                setIsChecking(false);
            }
        };

        checkConnectionStatus();

        window.fbAsyncInit = function () {
            window.FB.init({
                appId: process.env.NEXT_PUBLIC_META_APP_ID || "",
                cookie: true,
                xfbml: true,
                version: "v21.0",
            });
            setIsSdkLoaded(true);
        };

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

        const sessionInfoListener = (event: MessageEvent) => {
            // 🛑 DEBUG FIX: We are removing the strict `allowedOrigins` check temporarily.
            // We want to see EVERYTHING the popup tries to send to this window.

            try {
                const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

                // Only log if it looks like a Meta Embedded Signup event to avoid spam
                if (data?.type === "WA_EMBEDDED_SIGNUP") {
                    console.log("🚨 RAW META EVENT DETECTED:", {
                        origin: event.origin,
                        eventName: data.event,
                        payload: data.data
                    });

                    if (data.event.includes("FINISH")) {
                        console.log("✅ Extracting IDs now...");
                        signupData.current.phone_number_id = data.data?.phone_number_id || null;
                        signupData.current.waba_id = data.data?.waba_id || null;
                    }
                }
            } catch (err) {
                // Ignore parsing errors for non-JSON messages
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

        window.FB.login(
            function (response: any) {
                setTimeout(() => {
                    (async () => {
                        if (response.authResponse?.code) {
                            const code = response.authResponse.code;
                            const { waba_id, phone_number_id } = signupData.current;

                            // 🛑 FIX 2: Only block if WABA ID is entirely missing
                            if (!waba_id) {
                                setIsLoading(false);
                                setMessage({ type: "error", text: "Setup incomplete. Meta did not return a WABA ID." });
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
                    })();
                }, 1000);
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

            {isChecking ? (
                <div className="text-center py-4 text-gray-500">Verifying live connection with Meta...</div>
            ) : isConnected && accountDetails ? (
                <div className="p-6 border rounded-xl bg-white shadow-sm border-gray-200 flex flex-col items-center">

                    {/* Profile Picture */}
                    {accountDetails.profilePicture ? (
                        <img
                            src={accountDetails.profilePicture}
                            alt="WhatsApp Profile"
                            className="w-24 h-24 rounded-full mb-4 border-4 border-green-100 object-cover"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-green-100 mb-4 flex items-center justify-center text-green-700 text-3xl font-bold">
                            {accountDetails.name.charAt(0)}
                        </div>
                    )}

                    {/* Verified Name and Number */}
                    <h2 className="text-xl font-bold text-gray-900">{accountDetails.name}</h2>
                    <p className="text-gray-600 font-medium text-lg mt-1">{accountDetails.phone}</p>

                    {/* Quality Rating Badge */}
                    <span className={`mt-3 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${accountDetails.qualityRating === 'GREEN' ? 'bg-green-100 text-green-800' :
                            accountDetails.qualityRating === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                        }`}>
                        Health: {accountDetails.qualityRating}
                    </span>

                    {/* Verification Footer */}
                    <div className="mt-6 w-full pt-4 border-t border-gray-100 text-center flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-sm text-gray-500 font-medium">Live connection verified by Meta Graph API</p>
                    </div>
                </div>
            ) : (
                <button
                    onClick={handleConnectWhatsApp}
                /* ... keep existing button props ... */
                >
                    {isLoading ? "Connecting..." : "Connect Official WhatsApp"}
                </button>
            )}

            <div className="mt-8 text-sm text-gray-500 border-t pt-4">
                <p><strong>Note:</strong> Ensure your browser allows popups for this site. You will need to verify your business details with Meta during this process.</p>
            </div>
        </div>
    );
}