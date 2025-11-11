// // React code for Beneficiaires and ProductDetail pages
// // Assuming React Router + basic CSS classes

// import { useState } from "react";

// export default function App() {
//   return (
//     <div className="app">
//       <BeneficiairesPage />
//       {/* <ProductDetailPage /> */}
//     </div>
//   );
// }

// function BeneficiairesPage() {
//   const tabs = ["Tous", "Favoris"];
//   const [activeTab, setActiveTab] = useState("Tous");

//   const contacts = [
//     { initial: "M", name: "MOUPEPIDI", id: "1000CCHQ00000031002", bank: "La Peyie EMF", amount: "50 000 XAF", time: "il y a 2 jours", favorite: true },
//     { initial: "D", name: "DERLY", id: "1000CCHQ00000031003", bank: "La Peyie EMF", amount: "125 000 XAF", time: "il y a 1 semaine", favorite: true },
//     { initial: "MK", name: "MARIE KOUASSI", id: "2000EFQ00000045001", bank: "Autre Banque", amount: "30 000 XAF", time: "il y a 1 mois", favorite: false },
//     { initial: "JT", name: "JEAN TRAORE", id: "1000CCHQ00000031004", bank: "La Peyie EMF", amount: "70 000 XAF", time: "il y a 3 semaines", favorite: false },
//   ];

//   return (
//     <div className="page beneficiaries-page">
//       <header className="header">
//         <div>
//           <h2>Bénéficiaires</h2>
//           <span>5 contacts</span>
//         </div>
//         <button className="btn-circle">+</button>
//       </header>

//       <div className="stats-row">
//         <StatCard icon="⭐" label="Favoris" value="3" />
//         <StatCard icon="💵" label="Transféré" value="300k" />
//         <StatCard icon="👥" label="Total" value="5" />
//       </div>

//       <h4 className="section-title">Accès rapide</h4>

//       <div className="quick-access-row">
//         <QuickUser initial="M" name="MOUPEPIDI" />
//         <QuickUser initial="D" name="DERLY" />
//         <QuickUser initial="JT" name="JEAN" />
//       </div>

//       <input className="search-input" placeholder="Rechercher un bénéficiaire..." />

//       <div className="tabs-row">
//         {tabs.map((tab) => (
//           <button
//             key={tab}
//             className={`tab-btn ${activeTab === tab ? "active" : ""}`}
//             onClick={() => setActiveTab(tab)}
//           >
//             {tab} ({tab === "Tous" ? contacts.length : contacts.filter(c => c.favorite).length})
//           </button>
//         ))}
//       </div>

//       <div className="contacts-list">
//         {contacts
//           .filter(c => (activeTab === "Favoris" ? c.favorite : true))
//           .map((c, index) => (
//             <ContactCard key={index} contact={c} />
//           ))}
//       </div>
//     </div>
//   );
// }

// function StatCard({ icon, value, label }) {
//   return (
//     <div className="stat-card">
//       <div className="icon-circle">{icon}</div>
//       <h3>{value}</h3>
//       <span>{label}</span>
//     </div>
//   );
// }

// function QuickUser({ initial, name }) {
//   return (
//     <div className="quick-user">
//       <div className="initial-circle">{initial}</div>
//       <span>{name}</span>
//     </div>
//   );
// }

// function ContactCard({ contact }) {
//   return (
//     <div className="contact-card">
//       <div className="left">
//         <div className="initial-circle large">{contact.initial}</div>
//         <div className="info">
//           <h4>{contact.name}</h4>
//           <small>{contact.id}</small>
//           <div className="bank">🏦 {contact.bank}</div>
//           <div className="amount">💰 {contact.amount}</div>
//         </div>
//       </div>

//       <div className="right">
//         <span className="time">{contact.time}</span>
//         <button className="action-btn">➡️</button>
//         {contact.favorite && <span className="star">⭐</span>}
//       </div>
//     </div>
//   );
// }