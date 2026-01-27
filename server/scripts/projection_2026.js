const { pool } = require('../db');

async function calculateProjection() {
    let conn;
    try {
        conn = await pool.getConnection();

        // 1. Get January Count (Baseline)
        const baseStart = '2026-01-01 00:00:00';
        const baseEnd = '2026-02-01 00:00:00';
        const resBase = await conn.query(
            "SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= ? AND appointment_date < ? AND patient_id IS NOT NULL",
            [baseStart, baseEnd]
        );
        const baselineCount = Number(resBase[0].count);

        // Costs Configuration
        const COST_MONOTRIBUTO = 49436; // Cat C
        const TAX_IIBB_PCT = 0.035;
        const COST_FIXED_OPS = 150000;

        // Secretary Salaries Jan 2026 (Full Time Base)
        const SALARY_CAT_2_FULL = 1100963;
        const SALARY_CAT_3_FULL = 1070828;

        // 5 Hours Proportional (62.5%)
        const FACTOR_HRS = 0.625;

        // Cat 3 (Standard Secretary)
        const SEC_GROSS_CAT3 = SALARY_CAT_3_FULL * FACTOR_HRS;
        const SEC_LOADS_CAT3 = SEC_GROSS_CAT3 * 0.40;
        const SEC_TOTAL_CAT3 = SEC_GROSS_CAT3 + SEC_LOADS_CAT3;

        // Cat 2 (Senior/Specialized)
        const SEC_GROSS_CAT2 = SALARY_CAT_2_FULL * FACTOR_HRS;
        const SEC_LOADS_CAT2 = SEC_GROSS_CAT2 * 0.40;
        const SEC_TOTAL_CAT2 = SEC_GROSS_CAT2 + SEC_LOADS_CAT2;

        const TOTAL_REV = 4350000; // Jan 2026 Fixed Revenue
        const EXP_OPS = COST_MONOTRIBUTO + (TOTAL_REV * TAX_IIBB_PCT) + COST_FIXED_OPS;

        console.log('--- Análisis Costo Secretaria Enero 2026 (5hs) ---');
        console.log(`Ingresos Brutos Enero: $${TOTAL_REV.toLocaleString('es-AR')}`);
        console.log(`Gastos Operativos (Mono+IIBB+Fijos): $${Math.round(EXP_OPS).toLocaleString('es-AR')}\n`);

        console.log(`OPCIÓN A: Secretaria Categoría 3 (Administrativa General)`);
        console.log(`- Basico Proporcional: $${Math.round(SEC_GROSS_CAT3).toLocaleString('es-AR')}`);
        console.log(`- Costo Total Empleador: $${Math.round(SEC_TOTAL_CAT3).toLocaleString('es-AR')}`);
        console.log(`-> Neto de Bolsillo Enero: $${(TOTAL_REV - EXP_OPS - SEC_TOTAL_CAT3).toLocaleString('es-AR')}\n`);

        console.log(`OPCIÓN B: Secretaria Categoría 2 (Administrativa Primera)`);
        console.log(`- Basico Proporcional: $${Math.round(SEC_GROSS_CAT2).toLocaleString('es-AR')}`);
        console.log(`- Costo Total Empleador: $${Math.round(SEC_TOTAL_CAT2).toLocaleString('es-AR')}`);
        console.log(`-> Neto de Bolsillo Enero: $${(TOTAL_REV - EXP_OPS - SEC_TOTAL_CAT2).toLocaleString('es-AR')}\n`);

        console.log('--- Análisis Comparativo Salarial: No Docente Univ (Cat 6, 17 años, Secundario) ---');
        // Based on Dec 2024 Basic $648,018 + Estimated 2025 Inflation Adjustments (conservative ~40% annual increase projected for calculation base)
        // Let's assume Jan 2026 Base is approx $900,000 for estimation given 2025 context.

        const BASE_UNIV_CAT6 = 900000; // Estimated for Jan 2026 based on Dec 2024 $648k
        const SENIORITY_YRS = 17;
        const SENIORITY_PCT = 0.02 * SENIORITY_YRS; // 2% per year = 34%
        const TITLE_SEC_PCT = 0.175; // 17.5% of Cat 1 (approx standard bonus) or fixed. Usually ~15-20% of basic. Let's use 20% estimate of basic for simplicity if exact % not found, but standard is often fixed sum. Let's estimate $50k or %
        // Actually CCT 366/06 Title Secondary is often around ~17.5% of Category 7 Basic.
        // Let's use a simpler estimation: Additional +34% antiquity + ~10% title.

        const SALARY_GROSS_UNIV = BASE_UNIV_CAT6 * (1 + SENIORITY_PCT + 0.10);
        const DISCOUNTS_UNIV = 0.195; // 11% Jub + 3% OS + 3% 19032 + 2% Gremio + 0.5% Seguro
        const SALARY_NET_UNIV = SALARY_GROSS_UNIV * (1 - DISCOUNTS_UNIV);

        console.log(`Basico Est. Enero 2026: $${BASE_UNIV_CAT6.toLocaleString('es-AR')}`);
        console.log(`Antigüedad (17 años - 34%): $${(BASE_UNIV_CAT6 * SENIORITY_PCT).toLocaleString('es-AR')}`);
        console.log(`Adicional Título (Est): $${(BASE_UNIV_CAT6 * 0.10).toLocaleString('es-AR')}`);
        console.log(`Sueldo Bruto Est: $${SALARY_GROSS_UNIV.toLocaleString('es-AR')}`);
        console.log(`Descuentos de Ley (~19.5%): -$${(SALARY_GROSS_UNIV * DISCOUNTS_UNIV).toLocaleString('es-AR')}`);
        console.log(`-> EN MANO (Neto): $${SALARY_NET_UNIV.toLocaleString('es-AR')}`);

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

calculateProjection();
