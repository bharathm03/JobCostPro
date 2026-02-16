import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Eye } from 'lucide-react'
import { useNavigation } from '@/stores/navigation'

export function ReportsPage() {
  const { navigate } = useNavigation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground">
          Generate and view production and costing reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cost Summary Report
            </CardTitle>
            <CardDescription>
              Comprehensive cost breakdown with machine-wise details and customer sub-totals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('report-cost-summary')}>
              <Eye className="mr-2 h-4 w-4" />
              View Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Customer-wise Report
            </CardTitle>
            <CardDescription>All jobs for a specific customer with totals</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('report-customer-wise')}>
              <Eye className="mr-2 h-4 w-4" />
              View Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Machine Detail Report
            </CardTitle>
            <CardDescription>
              Jobs grouped by machine type with custom field summaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('report-machine-detail')}>
              <Eye className="mr-2 h-4 w-4" />
              View Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Employee Detail Report
            </CardTitle>
            <CardDescription>
              Jobs grouped by employee with date range filtering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('report-employee-detail')}>
              <Eye className="mr-2 h-4 w-4" />
              View Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Waste Report
            </CardTitle>
            <CardDescription>
              Waste analysis by job and machine with summary totals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('report-waste')}>
              <Eye className="mr-2 h-4 w-4" />
              View Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
