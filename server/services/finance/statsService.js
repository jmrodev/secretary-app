const { nowLocalSQL } = require('../../utils/dateUtils');
const transactionRepository = require('../../repositories/transactionRepository');
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
        const finStats = await transactionRepository.getAggregatedFinancialStats(todayStr, monthStr, yearStr, doctor_id);

        // 2. Expense Aggregates
        const expenseStats = await transactionRepository.getExpenseAggregates(todayStr, monthStr, yearStr, doctor_id);

        // 3. Request Breakdowns
        const types = ['prescription', 'license', 'certificate'];
        const requestData = {};

        for (const type of types) {
            requestData[type] = {
                today: await medicalRequestRepository.getRequestAggregates(type, 'created_at', todayStr, true, doctor_id),
                month: await medicalRequestRepository.getRequestAggregates(type, 'created_at', monthStr, false, doctor_id),
                year: await medicalRequestRepository.getRequestAggregates(type, 'created_at', yearStr, false, doctor_id)
            };
        }

        // 4. Appointment Results
        const apptToday = await appointmentRepository.getAppointmentSummaryStats('appointment_date', todayStr, true, doctor_id);
        const apptMonth = await appointmentRepository.getAppointmentSummaryStats('appointment_date', monthStr, false, doctor_id);
        const apptYear = await appointmentRepository.getAppointmentSummaryStats('appointment_date', yearStr, false, doctor_id);
        const apptDebt = await appointmentRepository.getAppointmentDebt(doctor_id);

        const totalDebtVal = await appointmentRepository.getTotalDebt(doctor_id);

        // Aggregate All Data into the final structure expected by the controller
        return {
            todayCash: Number(finStats.todayCash || 0),
            todayTransfer: Number(finStats.todayTransfer || 0),
            todayWithdrawal: Number(finStats.todayWithdrawalCash || 0) + Number(finStats.todayWithdrawalTransfer || 0),
            todayWithdrawalCash: Number(finStats.todayWithdrawalCash || 0),
            todayWithdrawalTransfer: Number(finStats.todayWithdrawalTransfer || 0),
            expenseToday: Number(expenseStats.today || 0),

            monthCash: Number(finStats.monthCash || 0),
            monthTransfer: Number(finStats.monthTransfer || 0),
            monthWithdrawal: Number(finStats.monthCashWithdrawal || 0) + Number(finStats.monthTransferWithdrawal || 0),
            monthCashWithdrawal: Number(finStats.monthCashWithdrawal || 0),
            monthTransferWithdrawal: Number(finStats.monthTransferWithdrawal || 0),
            expenseMonth: Number(expenseStats.month || 0),

            yearCash: Number(finStats.yearCash || 0),
            yearTransfer: Number(finStats.yearTransfer || 0),
            yearWithdrawal: Number(finStats.yearWithdrawalCash || 0) + Number(finStats.yearWithdrawalTransfer || 0),
            yearWithdrawalCash: Number(finStats.yearWithdrawalCash || 0),
            yearWithdrawalTransfer: Number(finStats.yearWithdrawalTransfer || 0),
            expenseYear: Number(expenseStats.year || 0),

            appointments: {
                today: { count: Number(apptToday.count || 0), paid: Number(apptToday.paid || 0) },
                month: { count: Number(apptMonth.count || 0), paid: Number(apptMonth.paid || 0) },
                year: { count: Number(apptYear.count || 0), paid: Number(apptYear.paid || 0) },
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
