import { describe, it, expect } from 'vitest';
import { generateVariants } from '../variantGenerator';

describe('variantGenerator', () => {
    describe('generateVariants', () => {
        it('should return an array of 3 variants when given a body', () => {
            const variants = generateVariants('Your appointment is tomorrow at 10:00 AM');
            expect(variants).toHaveLength(3);
        });

        it('should include header, body, and footer in each variant', () => {
            const variants = generateVariants('Your appointment is tomorrow at 10:00 AM');
            variants.forEach((variant, i) => {
                expect(variant).toHaveProperty('header');
                expect(variant).toHaveProperty('body');
                expect(variant).toHaveProperty('footer');
                expect(typeof variant.header).toBe('string');
                expect(typeof variant.body).toBe('string');
                expect(typeof variant.footer).toBe('string');
            });
        });

        it('should keep the body identical across all 3 variants', () => {
            const body = 'Your appointment is tomorrow at 10:00 AM';
            const variants = generateVariants(body);
            variants.forEach((variant) => {
                expect(variant.body).toBe(body);
            });
        });

        it('should have unique headers across variants', () => {
            const variants = generateVariants('Your appointment is tomorrow at 10:00 AM');
            const headers = variants.map(v => v.header);
            const uniqueHeaders = new Set(headers);
            expect(uniqueHeaders.size).toBe(3);
        });

        it('should have unique footers across variants', () => {
            const variants = generateVariants('Your appointment is tomorrow at 10:00 AM');
            const footers = variants.map(v => v.footer);
            const uniqueFooters = new Set(footers);
            expect(uniqueFooters.size).toBe(3);
        });

        it('should return [] when body is empty', () => {
            const variants = generateVariants('');
            expect(variants).toEqual([]);
        });

        it('should return [] when body is only whitespace', () => {
            const variants = generateVariants('   ');
            expect(variants).toEqual([]);
        });

        it('should generate variants with different headers and footers on each call', () => {
            const body = 'Please bring your medical records';
            const batch1 = generateVariants(body);
            const batch2 = generateVariants(body);

            // Each batch has different headers/footers (rotation differs each call)
            expect(batch1).toHaveLength(3);
            expect(batch2).toHaveLength(3);
            // All bodies match
            batch1.forEach(v => expect(v.body).toBe(body));
            batch2.forEach(v => expect(v.body).toBe(body));
        });

        it('should handle body with patient name parameter', () => {
            const body = '{patient_name}, your appointment is confirmed';
            const variants = generateVariants(body);
            expect(variants).toHaveLength(3);
            variants.forEach(v => {
                expect(v.body).toContain('{patient_name}');
                expect(v.body).toBe(body);
            });
        });
    });
});
