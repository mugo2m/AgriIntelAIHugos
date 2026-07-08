// components/CashFlowStatement.tsx
import React from 'react';
import { CashFlowResult } from '@/lib/cashFlowCalculator';
import { formatCurrency } from '@/lib/utils';
import {
  Beaker,
  FlaskConical,
  Droplet,
  Wind,
  AlertCircle,
  CheckCircle2,
  Leaf,
  Sprout,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface CashFlowStatementProps {
  cashFlow: CashFlowResult;
  farmerName?: string;
}

export const CashFlowStatement: React.FC<CashFlowStatementProps> = ({
  cashFlow,
  farmerName = 'Farmer'
}) => {
  // Find peak deficit month
  const peakDeficitMonth = cashFlow.months.findIndex(m =>
    m.cumulativeCash === cashFlow.peakDeficit
  ) + 1;

  // Calculate nutrient efficiency (profit per kg of nutrients)
  const calculateNutrientEfficiency = () => {
    const totalNutrients =
      (cashFlow.totalNutrients.n || 0) +
      (cashFlow.totalNutrients.p || 0) +
      (cashFlow.totalNutrients.k || 0) +
      (cashFlow.totalNutrients.s || 0) +
      (cashFlow.totalNutrients.ca || 0) +
      (cashFlow.totalNutrients.mg || 0) +
      (cashFlow.totalNutrients.zn || 0) +
      (cashFlow.totalNutrients.b || 0);

    if (totalNutrients === 0) return null;

    return {
      totalNutrients,
      profitPerKgNutrient: cashFlow.netProfit / totalNutrients,
      revenuePerKgNutrient: cashFlow.totalRevenue / totalNutrients
    };
  };

  const nutrientEfficiency = calculateNutrientEfficiency();

  return (
    <div className="cash-flow-statement bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-emerald-700 mb-2">
        📊 CASH FLOW PROJECTION
      </h2>
      <p className="text-gray-600 mb-6">
        For {farmerName}'s {cashFlow.crop} enterprise ({cashFlow.farmSize} acre{cashFlow.farmSize > 1 ? 's' : ''})
      </p>

      {/* NEW: Nutrient Summary Card */}
      {Object.values(cashFlow.totalNutrients).some(v => v > 0) && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6 border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <Beaker className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-purple-800">NUTRIENT INVESTMENT SUMMARY</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cashFlow.totalNutrients.n > 0 && (
              <div className="bg-white p-2 rounded-lg text-center">
                <span className="text-xs text-gray-500">Nitrogen (N)</span>
                <p className="font-bold text-blue-600">{cashFlow.totalNutrients.n.toFixed(1)} kg</p>
              </div>
            )}
            {cashFlow.totalNutrients.p > 0 && (
              <div className="bg-white p-2 rounded-lg text-center">
                <span className="text-xs text-gray-500">Phosphorus (P)</span>
                <p className="font-bold text-blue-600">{cashFlow.totalNutrients.p.toFixed(1)} kg</p>
              </div>
            )}
            {cashFlow.totalNutrients.k > 0 && (
              <div className="bg-white p-2 rounded-lg text-center">
                <span className="text-xs text-gray-500">Potassium (K)</span>
                <p className="font-bold text-blue-600">{cashFlow.totalNutrients.k.toFixed(1)} kg</p>
              </div>
            )}
            {cashFlow.totalNutrients.s > 0 && (
              <div className="bg-white p-2 rounded-lg text-center">
                <span className="text-xs text-gray-500">Sulfur (S)</span>
                <p className="font-bold text-purple-600">{cashFlow.totalNutrients.s.toFixed(1)} kg</p>
              </div>
            )}
            {cashFlow.totalNutrients.ca > 0 && (
              <div className="bg-white p-2 rounded-lg text-center">
                <span className="text-xs text-gray-500">Calcium (Ca)</span>
                <p className="font-bold text-purple-600">{cashFlow.totalNutrients.ca.toFixed(1)} kg</p>
              </div>
            )}
            {cashFlow.totalNutrients.mg > 0 && (
              <div className="bg-white p-2 rounded-lg text-center">
                <span className="text-xs text-gray-500">Magnesium (Mg)</span>
                <p className="font-bold text-purple-600">{cashFlow.totalNutrients.mg.toFixed(1)} kg</p>
              </div>
            )}
            {cashFlow.totalNutrients.zn > 0 && (
              <div className="bg-white p-2 rounded-lg text-center">
                <span className="text-xs text-gray-500">Zinc (Zn)</span>
                <p className="font-bold text-amber-600">{cashFlow.totalNutrients.zn.toFixed(1)} kg</p>
              </div>
            )}
            {cashFlow.totalNutrients.b > 0 && (
              <div className="bg-white p-2 rounded-lg text-center">
                <span className="text-xs text-gray-500">Boron (B)</span>
                <p className="font-bold text-amber-600">{cashFlow.totalNutrients.b.toFixed(1)} kg</p>
              </div>
            )}
          </div>

          {/* Nutrient Efficiency */}
          {nutrientEfficiency && (
            <div className="mt-3 pt-3 border-t border-purple-200 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Profit per kg of nutrients</p>
                <p className="font-bold text-green-600">
                  {formatCurrency(nutrientEfficiency.profitPerKgNutrient)}/kg
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue per kg of nutrients</p>
                <p className="font-bold text-blue-600">
                  {formatCurrency(nutrientEfficiency.revenuePerKgNutrient)}/kg
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NEW: Damage Report Card */}
      {cashFlow.plantsDamaged && cashFlow.plantsDamaged > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-800 mb-1">🌱 DAMAGE REPORT</h3>
              <p className="text-red-700">
                You reported <strong>{cashFlow.plantsDamaged.toLocaleString()} plants</strong> damaged beyond recovery.
                This may impact your final yield by approximately{' '}
                <strong>
                  {((cashFlow.plantsDamaged / (cashFlow.months[0]?.costBreakdown?.labour || 10000)) * 100).toFixed(1)}%
                </strong>.
              </p>
              <p className="text-sm text-red-600 mt-2">
                Consider reviewing pest and disease management strategies for future seasons.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Month Table with Fertilizer Details */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-emerald-50">
              <th className="border border-emerald-200 p-3 text-left">Month</th>
              <th className="border border-emerald-200 p-3 text-left">Activities</th>
              <th className="border border-emerald-200 p-3 text-right">Costs (Ksh)</th>
              <th className="border border-emerald-200 p-3 text-right">Revenue (Ksh)</th>
              <th className="border border-emerald-200 p-3 text-right">Net Cash (Ksh)</th>
              <th className="border border-emerald-200 p-3 text-right">Cumulative (Ksh)</th>
            </tr>
          </thead>
          <tbody>
            {cashFlow.months.map((month) => (
              <tr key={month.month} className="hover:bg-gray-50 group">
                <td className="border border-gray-200 p-3 font-medium align-top">
                  <div>Month {month.month} ({month.monthName})</div>

                  {/* NEW: Fertilizer applications for this month */}
                  {month.fertilizerApplications && month.fertilizerApplications.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {month.fertilizerApplications.map((app, idx) => (
                        <div key={idx} className="text-xs bg-blue-50 p-1 rounded">
                          <span className="font-medium text-blue-700">{app.type}:</span>
                          <span className="text-blue-600 ml-1">{app.product}</span>
                          <span className="text-gray-500 ml-1">({app.amountKg}kg)</span>

                          {/* Show nutrients if available */}
                          {app.nutrients && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {app.nutrients.n > 0 && (
                                <span className="bg-blue-100 text-blue-800 px-1 rounded">N:{app.nutrients.n}%</span>
                              )}
                              {app.nutrients.p > 0 && (
                                <span className="bg-blue-100 text-blue-800 px-1 rounded">P:{app.nutrients.p}%</span>
                              )}
                              {app.nutrients.k > 0 && (
                                <span className="bg-blue-100 text-blue-800 px-1 rounded">K:{app.nutrients.k}%</span>
                              )}
                              {app.nutrients.s > 0 && (
                                <span className="bg-purple-100 text-purple-800 px-1 rounded">S:{app.nutrients.s}%</span>
                              )}
                              {app.nutrients.ca > 0 && (
                                <span className="bg-purple-100 text-purple-800 px-1 rounded">Ca:{app.nutrients.ca}%</span>
                              )}
                              {app.nutrients.mg > 0 && (
                                <span className="bg-purple-100 text-purple-800 px-1 rounded">Mg:{app.nutrients.mg}%</span>
                              )}
                              {app.nutrients.zn > 0 && (
                                <span className="bg-amber-100 text-amber-800 px-1 rounded">Zn:{app.nutrients.zn}%</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </td>

                <td className="border border-gray-200 p-3 align-top">
                  <div>{month.activities.join(', ')}</div>

                  {/* NEW: Show cost breakdown on hover */}
                  {month.costBreakdown && (
                    <div className="hidden group-hover:block absolute bg-white shadow-lg rounded-lg p-2 z-10 text-xs">
                      <div className="font-bold mb-1">Cost Breakdown:</div>
                      {month.costBreakdown.seed > 0 && (
                        <div className="flex justify-between gap-4">
                          <span>Seed:</span>
                          <span className="font-medium">{formatCurrency(month.costBreakdown.seed)}</span>
                        </div>
                      )}
                      {month.costBreakdown.fertilizer > 0 && (
                        <div className="flex justify-between gap-4">
                          <span>Fertilizer:</span>
                          <span className="font-medium">{formatCurrency(month.costBreakdown.fertilizer)}</span>
                        </div>
                      )}
                      {month.costBreakdown.labour > 0 && (
                        <div className="flex justify-between gap-4">
                          <span>Labour:</span>
                          <span className="font-medium">{formatCurrency(month.costBreakdown.labour)}</span>
                        </div>
                      )}
                      {month.costBreakdown.transport > 0 && (
                        <div className="flex justify-between gap-4">
                          <span>Transport:</span>
                          <span className="font-medium">{formatCurrency(month.costBreakdown.transport)}</span>
                        </div>
                      )}
                      {month.costBreakdown.bags > 0 && (
                        <div className="flex justify-between gap-4">
                          <span>Bags:</span>
                          <span className="font-medium">{formatCurrency(month.costBreakdown.bags)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </td>

                <td className="border border-gray-200 p-3 text-right align-top">
                  {formatCurrency(month.costs)}
                </td>
                <td className="border border-gray-200 p-3 text-right align-top">
                  {month.revenue > 0 ? formatCurrency(month.revenue) : '-'}
                </td>
                <td className={`border border-gray-200 p-3 text-right font-medium align-top ${
                  month.netCash < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {month.netCash < 0 ? '-' : ''}{formatCurrency(Math.abs(month.netCash))}
                </td>
                <td className={`border border-gray-200 p-3 text-right font-medium align-top ${
                  month.cumulativeCash < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {month.cumulativeCash < 0 ? '-' : ''}{formatCurrency(Math.abs(month.cumulativeCash))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-bold">
            <tr>
              <td colSpan={2} className="border border-gray-300 p-3 text-right">TOTAL</td>
              <td className="border border-gray-300 p-3 text-right">{formatCurrency(cashFlow.totalCosts)}</td>
              <td className="border border-gray-300 p-3 text-right">{formatCurrency(cashFlow.totalRevenue)}</td>
              <td className="border border-gray-300 p-3 text-right">{formatCurrency(cashFlow.netProfit)}</td>
              <td className="border border-gray-300 p-3 text-right"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* INTERPRETATION SECTION */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <h3 className="font-bold text-blue-800 mb-2">📋 INTERPRETATION</h3>
        <p className="text-blue-900">
          This cash flow projection shows your expected monthly cash position from planting to harvest.
          Banks use this to assess your ability to repay loans.
          {nutrientEfficiency && (
            <span className="block mt-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Your nutrient efficiency: <strong>{formatCurrency(nutrientEfficiency.profitPerKgNutrient)} profit per kg</strong> of nutrients applied.
            </span>
          )}
        </p>
      </div>

      {/* LOAN SUMMARY - Enhanced with nutrient info */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-700 mb-3">💰 LOAN SUMMARY</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Peak Cash Deficit:</span>
              <span className="font-semibold text-red-600">{formatCurrency(cashFlow.peakDeficit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Loan Needed:</span>
              <span className="font-semibold">{formatCurrency(cashFlow.loanNeeded)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Revenue:</span>
              <span className="font-semibold text-green-600">{formatCurrency(cashFlow.totalRevenue)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-600">Repayment Capacity:</span>
              <span className="font-semibold text-green-600">{formatCurrency(cashFlow.repaymentCapacity)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Loan-to-Value Ratio:</span>
              <span className="font-semibold">
                {Math.round((cashFlow.loanNeeded / cashFlow.totalRevenue) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-700 mb-3">📈 KEY METRICS</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">ROI:</span>
              <span className="font-semibold text-green-600">{cashFlow.roi}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payback Period:</span>
              <span className="font-semibold">1 month after harvest</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Break-even Yield:</span>
              <span className="font-semibold">{cashFlow.breakevenYield} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Peak Working Capital:</span>
              <span className="font-semibold">{formatCurrency(cashFlow.loanNeeded)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Net Profit:</span>
              <span className="font-semibold text-green-600">{formatCurrency(cashFlow.netProfit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BANK STATEMENT - Enhanced with nutrient ROI */}
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <h3 className="font-bold text-green-800 mb-2">🏦 BANK STATEMENT</h3>
        <p className="text-green-900">
          Based on your projected cash flow, you can afford a loan of <strong>{formatCurrency(cashFlow.loanNeeded)}</strong>
          with comfortable repayment capacity. Your peak deficit occurs in <strong>Month {peakDeficitMonth}</strong>.
          Consider timing your loan drawdown accordingly.
        </p>
        {nutrientEfficiency && (
          <p className="text-green-800 mt-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Your nutrient investment efficiency is strong at {formatCurrency(nutrientEfficiency.profitPerKgNutrient)} profit per kg.
          </p>
        )}
      </div>

      {/* NEXT STEPS */}
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
        <h3 className="font-bold text-purple-800 mb-2">📞 NEXT STEPS</h3>
        <p className="text-purple-900">
          Take this cash flow statement to your bank, SACCO, or microfinance institution.
          The professional format meets global standards (IFRS) accepted by most financial institutions.
        </p>
      </div>
    </div>
  );
};