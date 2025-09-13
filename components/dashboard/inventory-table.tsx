'use client';

interface Sku {
  id: string;
  name: string;
  inventory: number;
}

interface InventoryTableProps {
  inventory: Sku[];
  loading: boolean;
  error: string | null;
}

export default function InventoryTable({ inventory, loading, error }: InventoryTableProps) {

  if (loading) {
    return <p>Loading inventory...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="w-full bg-gray-100 text-left">
            <th className="p-4">SKU</th>
            <th className="p-4">Name</th>
            <th className="p-4">Inventory</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((sku) => (
            <tr key={sku.id} className="border-b">
              <td className="p-4">{sku.id}</td>
              <td className="p-4">{sku.name}</td>
              <td className="p-4">{sku.inventory}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
