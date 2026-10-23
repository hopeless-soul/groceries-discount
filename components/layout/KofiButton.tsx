"use client";

import Script from "next/script";
import { useState } from "react";

interface KofiWidget {
  init: (text: string, color: string, id: string) => void;
  getHTML: () => string;
}

// Ko-fi's CSS uses !important, so overrides need ! too. Matches the h-8 header buttons; icon-only below lg.
const overrides = [
  "[&_.btn-container]:flex! max-lg:[&_.btn-container]:min-w-0!",
  "[&_.kofi-button]:flex! [&_.kofi-button]:h-8! [&_.kofi-button]:items-center! [&_.kofi-button]:justify-center! [&_.kofi-button]:py-0! [&_.kofi-button]:[box-shadow:none]!",
  "max-lg:[&_.kofi-button]:w-8! max-lg:[&_.kofi-button]:min-w-0! max-lg:[&_.kofi-button]:px-0!",
  "[&_.kofitext]:flex! [&_.kofitext]:items-center! [&_.kofitext]:leading-none! [&_.kofitext]:text-black! [&_.kofitext]:text-shadow-none!",
  // the label is a bare text node, so font-size 0 is the only way to hide it
  "max-lg:[&_.kofitext]:text-[0px]!",
  "[&_.kofiimg]:mb-0! max-lg:[&_.kofiimg]:mr-0!",
].join(" ");

export function KofiButton() {
  const [html, setHtml] = useState("");

  return (
    <>
      <Script
        src="https://storage.ko-fi.com/cdn/widget/Widget_2.js"
        onReady={() => {
          // draw() uses document.writeln, which blanks the page after load; render getHTML() instead
          const kofi = (window as unknown as { kofiwidget2?: KofiWidget }).kofiwidget2;
          if (!kofi) return;
          kofi.init("Buy me a coffee", "#ebd9bf", "F5W729A98H");
          setHtml(kofi.getHTML());
        }}
      />
      {html && <div className={overrides} dangerouslySetInnerHTML={{ __html: html }} />}
    </>
  );
}
