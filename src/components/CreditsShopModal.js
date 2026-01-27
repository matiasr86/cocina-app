import React from "react";
import "./CreditsShopModal.css";

export default function CreditsShopModal({
  open,
  onClose,
  packs = [
    {
      id: "p3",
      title: "Pack 3 créditos",
      cost: 'USD 3,00 + IVA',
      blurb:
        "Ideal para probar el flujo. 3 llamados a render; cada uno devuelve 3 imágenes.",
    },
    {
      id: "p10",
      title: "Pack 10 créditos",
      cost: 'USD 8,00 + IVA',
      blurb:
        "Para sesiones de trabajo más largas o varios proyectos chicos.",
    },
    {
      id: "p20",
      title: "Pack 20 créditos",
      cost: 'USD 12,00 + IVA',
      blurb:
        "Excelente relación para equipos chicos o una tanda de propuestas.",
    },
    {
      id: "p50",
      title: "Pack 50 créditos",
      cost: 'USD 24,00 + IVA',
      blurb:
        "Pensado para producción intensiva o estudios con varios clientes.",
    },
  ],
}) {
  if (!open) return null;

  return (
    <div
      className="shopOverlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Packs de créditos"
    >
      <div className="shopModal" onClick={(e) => e.stopPropagation()}>
        <header className="shopHeader">
          <strong>Packs de créditos</strong>
          <button className="btn" onClick={onClose}>Cerrar</button>
        </header>
      

        <p className="shopIntro">
          Cada crédito te permite ejecutar 1 render con IA: obtendrás <b>3 imágenes</b> para
          elegir la <b>más fiel</b> a tu diseño.
        </p>

        <div className="shopGrid">
          {packs.map((p) => (
            <article key={p.id} className="shopCard">
              <h3 className="shopCard__title">{p.title}</h3>
              <h7 className="shopCard__cost">{p.cost}</h7>
              <p className="shopCard__desc">{p.blurb}</p>
              <div className="shopCard__actions">
                {/* Botón en solo-lectura hasta abrir Odoo */}
                <button
                  className="btn primary"
                  disabled
                  aria-disabled="true"
                  title="Próximamente"
                >
                  Comprar
                </button>
                <span className="pill pill--muted">Próximamente</span>
              </div>
            </article>
          ))}
        </div>

        <footer className="shopFootnote">
          Cuando habilitemos la tienda, el botón “Comprar” te redirigirá.
        </footer>
      </div>
    </div>
  );
}
