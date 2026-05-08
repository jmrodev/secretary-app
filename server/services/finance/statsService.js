const { nowLocalSQL } = require('../../utils/dateUtils');
const transactionRepository = require('../../repositories/transactionRepository');
const statsRepository = require('../../repositories/statsRepository');
const medicalRequestRepository = require('../../repositories/medicalRequestRepository');
const appointmentRepository = require('../../repositories/appointmentRepository');

/**
 * Finance Stats Service
 * 
 * Centralizes the complex calculation logic for financial reports.
 * Adheres to the MVC separation (Controller -> Service -> DB).
 */

exports.getDetailedStats = async (doctor_id) => {
    try {
        const nowString = nowLocalSQL(); // "YYYY-MM-DD HH:mm:ss"
        const todayStr = nowString.split(' ')[0];
        const monthStr = todayStr.slice(0, 7) + '-01';
        const yearStr = todayStr.slice(0, 4) + '-01-01';

        console.log(`🔍 StatsService: today=${todayStr}, month=${monthStr}, year=${yearStr} | doctor_id=${doctor_id}`);

        // 1. Transaction Aggregates (Income & Withdrawals)
        const finStats = await statsRepository.getAggregatedFinancialStats(todayStr, monthStr, yearStr, doctor_id);

        // 2. Expense Aggregates
        const expenseStats = await statsRepository.getExpenseAggregates(todayStr, monthStr, yearStr, doctor_id);

        // 3. Request Breakdowns (Optimized)
        const types = ['prescription', 'license', 'certificate'];
        const requestData = {};

        // Initialize with default values to handle types that might not have any records
        for (const type of types) {
            requestData[type] = {
                today: { count: 0, paid: 0, debt: 0, bonified: 0 },
                month: { count: 0, paid: 0, debt: 0, bonified: 0 },
                year: { count: 0, paid: 0, debt: 0, bonified: 0 }
            };
        }

        // Fetch aggregates for all types in parallel for the three timeframes
        const [todayAggs, monthAggs, yearAggs] = await Promise.all([
            medicalRequestRepository.getAllTypesRequestAggregates(types, 'created_at', todayStr, true, doctor_id),
            medicalRequestRepository.getAllTypesRequestAggregates(types, 'created_at', monthStr, false, doctor_id),
            medicalRequestRepository.getAllTypesRequestAggregates(types, 'created_at', yearStr, false, doctor_id)
        ]);

        // Helper to populate the data
        const populateData = (aggs, period) => {
            for (const row of aggs) {
                if (requestData[row.type]) {
                    requestData[row.type][period] = {
                        count: Number(row.count || 0),
                        paid: Number(row.paid || 0),
                        debt: Number(row.debt || 0),
                        bonified: Number(row.bonified || 0)
                    };
                }
            }
        };

        populateData(todayAggs, 'today');
        populateData(monthAggs, 'month');
        populateData(yearAggs, 'year');

        // 4. Appointment Results
        const apptToday = await statsRepository.getAppointmentSummaryStats('appointment_date', todayStr, true, doctor_id);
        const apptMonth = await statsRepository.getAppointmentSummaryStats('appointment_date', monthStr, false, doctor_id);
        const apptYear = await statsRepository.getAppointmentSummaryStats('appointment_date', yearStr, false, doctor_id);
        const apptDebt = await statsRepository.getAppointmentDebt(doctor_id);

        const totalDebtVal = await statsRepository.getTotalDebt(doctor_id);

        // Aggregate All Data into the final structure expected by the controller
        return {
            todayCash: Number(finStats.todayCash || 0),
            todayTransfer: Number(finStats.todayTransfer || 0),
            todayWithdrawal: Number(finStats.todayWithdrawalCash || 0) + Number(finStats.todayWithdrawalTransfer || 0),
            todayWithdrawalCash: Number(finStats.todayWithdrawalCash || 0),
            todayWithdrawalTransfer: Number(finStats.todayWithdrawalTransfer || 0),
            expenseToday: Number(expenseStats.today || 0),
            expenseTodayCash: Number(finStats.todayExpenseCash || 0),
            expenseTodayTransfer: Number(finStats.todayExpenseTransfer || 0),

            monthCash: Number(finStats.monthCash || 0),
            monthTransfer: Number(finStats.monthTransfer || 0),
            monthWithdrawal: Number(finStats.monthCashWithdrawal || 0) + Number(finStats.monthTransferWithdrawal || 0),
            monthCashWithdrawal: Number(finStats.monthCashWithdrawal || 0),
            monthTransferWithdrawal: Number(finStats.monthTransferWithdrawal || 0),
            expenseMonth: Number(expenseStats.month || 0),
            expenseMonthCash: Number(finStats.monthExpenseCash || 0),
            expenseMonthTransfer: Number(finStats.monthExpenseTransfer || 0),

            yearCash: Number(finStats.yearCash || 0),
            yearTransfer: Number(finStats.yearTransfer || 0),
            yearWithdrawal: Number(finStats.yearWithdrawalCash || 0) + Number(finStats.yearWithdrawalTransfer || 0),
            yearWithdrawalCash: Number(finStats.yearWithdrawalCash || 0),
            yearWithdrawalTransfer: Number(finStats.yearWithdrawalTransfer || 0),
            expenseYear: Number(expenseStats.year || 0),
            expenseYearCash: Number(finStats.yearExpenseCash || 0),
            expenseYearTransfer: Number(finStats.yearExpenseTransfer || 0),

            appointments: {
                today: {
                    count: Number(apptToday.count || 0),
                    paid: Number(apptToday.paid || 0),
                    bonified: Number(apptToday.bonified || 0)
                },
                month: {
                    count: Number(apptMonth.count || 0),
                    paid: Number(apptMonth.paid || 0),
                    bonified: Number(apptMonth.bonified || 0)
                },
                year: {
                    count: Number(apptYear.count || 0),
                    paid: Number(apptYear.paid || 0),
                    bonified: Number(apptYear.bonified || 0)
                },
                debt: Number(apptDebt || 0)
            },
            prescriptions: requestData.prescription,
            licenses: requestData.license,
            certificates: requestData.certificate,
            totalDebt: Number(totalDebtVal || 0)
        };

    } catch (err) {
        console.error("[StatsService] Error:", err);
        throw err;
    }
};
