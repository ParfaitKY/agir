/**
 * Utilitaires de normalisation des réponses API.
 * Centralise la logique commune de parsing des réponses serveur.
 */

/**
 * Normalise une réponse API en extrayant le premier objet de données,
 * quelle que soit la structure de la réponse (tableau, objet imbriqué, etc.)
 */
export const normalize = (raw: any): Record<string, any> => {
  const d = raw?.data ?? raw;
  if (Array.isArray(d)) return d[0] ?? {};
  if (Array.isArray(d?.data)) return d.data[0] ?? {};
  if (Array.isArray(d?.result)) return d.result[0] ?? {};
  if (Array.isArray(d?.payload)) return d.payload[0] ?? {};
  if (d?.data && typeof d.data === "object") return d.data;
  return d ?? {};
};

/**
 * Recherche une valeur dans un objet en comparant les clés de façon
 * insensible à la casse et aux underscores.
 * Exemple : pick(obj, ["CL_TELEPHONE"]) trouve aussi "cl_telephone", "CLTELEPHONE"
 */
export const pick = (obj: any, patterns: string[]): any => {
  if (!obj) return undefined;
  const keys = Object.keys(obj);
  for (const p of patterns) {
    const np = p.toLowerCase().replace(/_/g, "");
    for (const k of keys) {
      const nk = k.toLowerCase().replace(/_/g, "");
      if (nk === np) return obj[k];
    }
  }
  return undefined;
};
