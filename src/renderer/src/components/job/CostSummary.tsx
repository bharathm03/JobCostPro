import type { CostBreakdown } from '@/hooks/useJobCostCalculator'
import { formatINR } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

interface CostSummaryProps {
  breakdown: CostBreakdown
}

export function CostSummary({ breakdown }: CostSummaryProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cost Component</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Base Amount (Qty x Rate)</TableCell>
          <TableCell className="text-right">{formatINR(breakdown.baseAmount)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Cooly (Labor)</TableCell>
          <TableCell className="text-right">{formatINR(breakdown.coolyAmount)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Waste</TableCell>
          <TableCell className="text-right">{formatINR(breakdown.wasteAmount)}</TableCell>
        </TableRow>
        {breakdown.machineName && (
          <TableRow>
            <TableCell>{breakdown.machineName}</TableCell>
            <TableCell className="text-right">
              {formatINR(breakdown.machineCost + breakdown.machineWasteAmount)}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-semibold">Total</TableCell>
          <TableCell className="text-right font-semibold">
            {formatINR(breakdown.grandTotal)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
