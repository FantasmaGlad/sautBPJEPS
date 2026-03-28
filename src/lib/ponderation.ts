export const PONDERATION_HOMMES: Record<string, number> = {
  "Senior (Absolu)": 0,
  "U23": -1,
  "U20": -6.5,
  "U18": -7.5,
  "M35": -5,
  "M40": -11,
  "M45": -19,
  "M50": -24,
  "M55": -28,
  "M60": -30,
  "M65": -40,
  "M70": -43,
  "M75": -47,
  "M80": -51,
};

export const PONDERATION_FEMMES: Record<string, number> = {
  "Senior (Absolu)": 0,
  "U23": -1,
  "U20": -5,
  "U18": -8,
  "M35": -7,
  "M40": -12,
  "M45": -24,
  "M50": -26,
  "M55": -30,
  "M60": -37,
  "M65": -39,
  "M70": -44,
  "M75": -49,
  "M80": -59,
};

/**
 * Calcule le score pondéré en Points selon la différence stipulée par la catégorie d'âge et le genre.
 * @param rawScore Le score brut en cm.
 * @param gender "Homme", "H", "Femme", ou "F".
 * @param ageCategory La catégorie d'âge (ex: "U18", "M35").
 * @returns Le score pondéré (arrondi à l'entier près).
 */
export function getWeightedScore(rawScore: number, gender: string, ageCategory: string): number {
  if (!rawScore) return 0;
  
  const isMale = gender === "Homme" || gender === "H";
  const dict = isMale ? PONDERATION_HOMMES : PONDERATION_FEMMES;
  
  const diffPercent = dict[ageCategory] || 0;
  
  // Exemple: Femme M35 (-7%) -> diffPercent est de -7.
  // Le multiplicateur est 1 + Math.abs(-7)/100 = 1.07
  const multiplier = 1 + Math.abs(diffPercent) / 100;
  
  return Math.round(rawScore * multiplier);
}
