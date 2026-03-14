'use client';

export default function Table({ columns, data, keyField = '_id' }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-700 bg-slate-800/50">
          <tr>
            {columns.map((col) => (
              <th key={col.id} className="px-4 py-3 font-medium text-slate-300">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                No data
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row[keyField]} className="hover:bg-slate-800/30">
                {columns.map((col) => (
                  <td key={col.id} className="px-4 py-3 text-slate-200">
                    {col.render ? col.render(row) : row[col.id]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
