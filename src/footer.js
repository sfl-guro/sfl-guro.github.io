import { toast } from "./calculator.js";

export function initFooter() {
  document.addEventListener("click", e => {
    const btn = e.target.closest ? e.target.closest("[data-gf-copy]") : null;
    if (!btn) return;
    e.stopPropagation();
    const text = btn.getAttribute("data-gf-copy");
    const done = () => {
      btn.classList.add("is-done");
      toast("Copied!");
      setTimeout(() => btn.classList.remove("is-done"), 1200);
    };
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch (err) {}
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else fallback();
  });
}
