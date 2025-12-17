import { useTranslation } from 'react-i18next';

type Item = {
    id: string;
    name: string;
    vintage: number | null;
    quantity: number;
    unit: string;
}

type Props = {
    items: Item[];
    onSelect: (id: string) => void;
}

export const InventoryList = ({ items, onSelect }: Props) => {
    const { t } = useTranslation('inventory');

    return (
        <div className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <table className="min-w-full block w-full md:table">
                {/* Header: PC only */}
                <thead className="hidden md:table-header-group bg-gray-50 border-b border-border">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                            {t('list.vintage')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                            {t('list.name')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                            {t('list.stock')}
                        </th>
                    </tr>
                </thead>

                <tbody className="block w-full md:table-row-group md:divide-y md:divide-gray-100 p-4 md:p-0">
                    {items.map((item) => (
                        <tr
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className="
                /* Mobile: Card Style */
                block relative w-full mb-4 md:mb-0 p-4 md:p-0
                border border-border md:border-none rounded-xl md:rounded-none
                bg-white md:bg-white
                cursor-pointer group hover:bg-gray-50
                active:bg-tanavent-blue-light transition-colors duration-200
                
                /* Desktop: Table Row Style */
                md:table-row
              "
                        >
                            {/* Vintage Cell */}
                            <td
                                data-label={t('list.vintage')}
                                className="
                  /* Mobile */
                  block w-full px-2 py-2 text-right border-b border-dashed border-border last:border-0
                  relative text-tanavent-navy font-mono
                  before:content-[attr(data-label)] before:absolute before:left-2 before:text-text-muted before:text-xs before:font-bold
                  
                  /* Desktop */
                  md:table-cell md:w-auto md:px-6 md:py-4 md:text-left md:border-none md:before:content-none
                "
                            >
                                {item.vintage || 'NV'}
                            </td>

                            {/* Name Cell */}
                            <td
                                data-label={t('list.name')}
                                className="
                  block w-full px-2 py-2 text-right border-b border-dashed border-border last:border-0
                  relative font-bold text-text-main
                  before:content-[attr(data-label)] before:absolute before:left-2 before:text-text-muted before:text-xs before:font-bold
                  
                  md:table-cell md:w-auto md:px-6 md:py-4 md:text-left md:border-none md:before:content-none
                "
                            >
                                {item.name}
                            </td>

                            {/* Stock Cell */}
                            <td
                                data-label={t('list.stock')}
                                className="
                  block w-full px-2 py-2 text-right
                  relative font-mono font-bold text-tanavent-blue text-lg
                  before:content-[attr(data-label)] before:absolute before:left-2 before:text-text-muted before:text-xs before:font-bold
                  
                  md:table-cell md:w-auto md:px-6 md:py-4 md:text-right md:before:content-none
                "
                            >
                                {item.quantity} <span className="text-sm text-text-muted font-normal">{item.unit}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
