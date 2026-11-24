export function EmptyRows({ colSpan }: { colSpan: number }) {
  return (
    <tbody>
      <tr>
        <td
          colSpan={colSpan}
          className="px-3 py-10 text-center text-muted-foreground"
        >
          No topics match these filters. Clear the search or choose another
          filter.
        </td>
      </tr>
    </tbody>
  );
}
