/**
 * [LAYER: INFRASTRUCTURE]
 */
import { AdminTaxonomy } from '@ui/pages/admin/AdminTaxonomy';

export const metadata = {
  title: 'Product Organization · ShopMore Admin',
  description: 'Manage categories and product types.',
};

export default function TaxonomyPage() {
  return <AdminTaxonomy />;
}
