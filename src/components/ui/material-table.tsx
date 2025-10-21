// Material React Table component for advanced table features

import React from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_TableOptions,
} from "material-react-table";

interface CommonTableProps<T extends object> {
  columns: MRT_ColumnDef<T>[];
  data: T[];
  options?: Partial<MRT_TableOptions<T>>;
}

function MaterialTable<T extends object>({ columns, data }: CommonTableProps<T>) {
  const table = useMaterialReactTable({
    columns,
    data: data || [], // Ensure data is never undefined
    enableRowSelection: false,
    enableMultiSort: true,
    enableBottomToolbar: true,
    enableTopToolbar: true,
    enableColumnActions: true,
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: true,
    enableColumnResizing: true,
    enableHiding: true,
    enablePinning: true,
    enableRowNumbers: true,
    enableStickyHeader: true,
    enableStickyFooter: true,
    // Add empty state handling
    renderEmptyRowsFallback: () => (
      <tr>
        <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem' }}>
          No data available
        </td>
      </tr>
    ),
    muiTableBodyCellProps: {
      style: {
        textAlign: "center",
        boxShadow: "none",
        border: "1px solid #e2e8f0", // Add right border to cells
      },
    },

    muiTableHeadCellProps: {
      style: {
        border: "1px solid #e2e8f0",
        borderBottom: "none",
        boxShadow: "none",
        fontWeight: "bold",
      },
    },
    muiTableHeadRowProps: {
      style: {
        boxShadow: "none",
      },
    },
    muiTableContainerProps: {
      style: {
        boxShadow: "none",
        border: "none",
      },
    },
    muiTableBodyProps: {
      style: {
        boxShadow: "none",
        borderBottom: "none",
      },
    },
    muiTablePaperProps: {
      style: {
        boxShadow: "none",
        backgroundColor: "#fff",
        overflow: "auto",
        borderRadius: "8px",
      },
    },

    initialState: {
      columnVisibility: {
        id: false, // Hide the ID column by default
      },
    },
  });
  return <MaterialReactTable table={table} />;
}

export default MaterialTable;
