import { apiRequest } from './client'

async function getReportsSummary(range) {
  return apiRequest('/reports/summary', { query: { range: range || '' } })
}

async function getZReport(date) {
  return apiRequest('/reports/z-report', { query: { date: date || '' } })
}

export { getReportsSummary, getZReport }

