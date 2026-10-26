"use client";

import { ApiResponse, PlatformModuleConfig, SocialPost } from "../../page";
import {
  getLinkedinAuthUrl,
  disconnectLinkedin,
  getLinkedinPosts,
  getLinkedinStatus,
  handleLinkedinCallback 
} from "@/store/linkedin/linkedin"; 

export function createLinkedinModule(): PlatformModuleConfig {
  
  const fetchPosts = async (): Promise<ApiResponse> => {
    // 0. MAGIC CALLBACK HANDLER
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");

      if (code && state) {
        await handleLinkedinCallback({ code, state });
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: newUrl }, "", newUrl);
      }
    }

    // 1. GATEKEEPER
    const statusRes = await getLinkedinStatus();
    
    if (!statusRes?.success || !statusRes.data?.isConnected) {
      return { success: false, posts: [] }; 
    }

    // 2. FETCH POSTS
    const res = await getLinkedinPosts("page=1&limit=50");
    let mappedPosts: SocialPost[] = [];
    
    if (res?.success && res.data) {
      mappedPosts = res.data.map((post: any) => ({
        id: post.id,
        caption: post.content,
        media_url: post.imageUrl || "", 
        media_type: "IMAGE", 
        timestamp: post.createdAt,
        permalink: post.externalUrl || `https://linkedin.com`, 
      }));
    }

    return { success: true, posts: mappedPosts };
  };

  const connect = async () => {
    const res = await getLinkedinAuthUrl();
    if (res?.success && res.data?.url) window.location.href = res.data.url;
  };

  const disconnect = async (): Promise<boolean> => {
    const res = await disconnectLinkedin();
    return !!res?.success;
  };

  return {
    id: "linkedin",
    name: "LinkedIn",
    defaultStatus: "not_connected",
    color: "linear-gradient(135deg,#0a66c2,#004182)",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    setupSteps: [
      {
        number: 1,
        title: "Create a LinkedIn App",
        description: "Go to LinkedIn Developer Portal → My Apps → Create App.",
      },
      {
        number: 2,
        title: "Add Products",
        description: "Request access to 'Sign In with LinkedIn using OpenID Connect' and 'Share on LinkedIn'.",
      },
      {
        number: 3,
        title: "Configure OAuth Redirect URI",
        description: "Set your callback URL under Auth settings.",
      },
      {
        number: 4,
        title: "Connect Account",
        description: "Click Connect below to authorize posting permissions.",
      },
    ],
    fetchPosts,
    connect,
    disconnect,
    // Note: No schedulerKey or schedulePost provided, ensuring separation.
  };
}