import { HelpSupportFaqItem, HelpSupportScreenConfig } from '../config/localDb';

function buildServiceableAreasSummary(db: any): string {
  const locations = (db.serviceable_locations || []).filter(
    (loc: any) => loc.is_serviceable,
  );
  if (!locations.length) return '';

  const byCity = new Map<string, string[]>();
  for (const loc of locations) {
    const city = String(loc.city || '').trim();
    const area = String(loc.area_name || '').trim();
    if (!city) continue;
    if (!byCity.has(city)) byCity.set(city, []);
    if (area) byCity.get(city)!.push(area);
  }

  return Array.from(byCity.entries())
    .map(([city, areas]) => {
      if (!areas.length) return city;
      return `${city} (${areas.join(', ')})`;
    })
    .join('; ');
}

function resolveFaqAnswer(
  faq: HelpSupportFaqItem,
  config: HelpSupportScreenConfig,
  areasSummary: string,
): string {
  if (faq.answer?.trim()) return faq.answer.trim();

  const template = faq.answer_template?.trim() || '';
  if (!template) return '';

  if (template === '{delivery_areas}') {
    return config.delivery_areas_answer_template.replace('{areas}', areasSummary);
  }

  return template.replace(/\{areas\}/g, areasSummary);
}

export function enrichHelpSupportScreen(db: any): HelpSupportScreenConfig {
  const base = db.help_support_screen as HelpSupportScreenConfig;
  const areasSummary = buildServiceableAreasSummary(db);

  const faqs = (base.faqs || []).map((faq) => ({
    ...faq,
    answer: resolveFaqAnswer(faq, base, areasSummary),
  }));

  return {
    ...base,
    faqs,
  };
}
