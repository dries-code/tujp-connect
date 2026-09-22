"use client";

import { useEffect } from "react";

const PORTAL_ID = "26582701";
const FORM_ID = "027e03a9-17aa-4406-9cbf-de9f728fb909";
const REGION = "eu1";

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (opts: {
          portalId: string;
          formId: string;
          region: string;
          target: string;
        }) => void;
      };
    };
  }
}

/** Passes ?event=... from the visited URL through to the hidden "event_source" field,
 *  once that field exists on the HubSpot form. */
function wireEventSource() {
  const params = new URLSearchParams(window.location.search);
  const event = params.get("event");
  if (!event) return;
  const tryFill = setInterval(() => {
    const field = document.querySelector<HTMLInputElement>('input[name="event_source"]');
    if (field) {
      field.value = event;
      clearInterval(tryFill);
    }
  }, 300);
  setTimeout(() => clearInterval(tryFill), 10000);
}

export default function HubSpotForm() {
  useEffect(() => {
    const scriptId = "hs-forms-embed";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    const create = () => {
      window.hbspt?.forms.create({
        portalId: PORTAL_ID,
        formId: FORM_ID,
        region: REGION,
        target: "#hsFormSlot",
      });
      wireEventSource();
    };

    if (window.hbspt) {
      create();
      return;
    }

    if (existing) {
      existing.addEventListener("load", create);
      return () => existing.removeEventListener("load", create);
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://js-eu1.hsforms.net/forms/embed/v2.js";
    script.charset = "utf-8";
    script.addEventListener("load", create);
    document.body.appendChild(script);
  }, []);

  return <div id="hsFormSlot" />;
}
