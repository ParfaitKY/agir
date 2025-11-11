import { useState } from "react";

export function ProductDetailPage() {
  const [activeTab, setActiveTab] = useState("Avantages");
  const advantages = [
    "Carte bancaire gratuite incluse",
    "Virements illimités sans frais",
    "Relevés mensuels détaillés",
    "Application mobile performante",
    "Service client dédié 7j/7",
  ];

  return (
    <div className="page product-detail-page">
      <header className="header-line">
        <button className="back-btn">←</button>
        <h3>Détail du produit</h3>
      </header>

      <div className="product-card">
        <div className="icon-wrapper">📘</div>
        <h2>Compte Courant</h2>
        <span className="subtitle">Gestion quotidienne</span>
        <span className="status">🟢 Disponible</span>
      </div>

      <div className="description-card">
        <h4>Description</h4>
        <p>Gérez vos opérations quotidiennes en toute simplicité</p>
        <p>
          Le compte courant La Peyie vous offre une solution complète pour gérer vos finances au quotidien. Profitez de services bancaires modernes avec une application mobile intuitive.
        </p>
      </div>

      <div className="tabs-row">
        {"Avantages,Conditions".split(",").map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Avantages" && (
        <div className="advantages-card">
          {advantages.map((adv, i) => (
            <div key={i} className="adv-item">✅ {adv}</div>
          ))}
        </div>
      )}

      <button className="subscribe-btn">Souscrire maintenant</button>
    </div>
  );
}