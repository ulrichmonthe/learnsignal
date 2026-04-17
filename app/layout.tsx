import type { Metadata } from "next";
import "./globals.css";
import "./manifesto.css";

export const metadata: Metadata = {
  title: "LearnSignal",
  description:
    "LearnSignal is a training platform built around putting the PM inside the decision before revealing the answer.",
  metadataBase: new URL("https://learnsignal.ai"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        {/* If React never hydrates, Next can leave body display:none — reveal after a short delay */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  function reveal(){
    try {
      var b=document.body;
      if(!b) return;
      if(window.getComputedStyle(b).display==='none'){
        b.style.display='block';
        var s=document.querySelector('style[data-next-hide-fouc]');
        if(s&&s.parentNode) s.parentNode.removeChild(s);
      }
    } catch(e) {}
  }
  if(document.readyState==='complete') setTimeout(reveal,1500);
  else window.addEventListener('load', function(){ setTimeout(reveal,1500); });
})();
            `.trim(),
          }}
        />
      </body>
    </html>
  );
}
