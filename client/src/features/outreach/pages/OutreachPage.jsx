import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { MainLayout } from '@/components/templates/MainLayout';
import { useOutreach } from '@/features/outreach/hooks/useOutreach';
import { SegmentSelector } from '@/features/outreach/components/SegmentSelector';
import { MessageComposer } from '@/features/outreach/components/MessageComposer';
import { VariantPreview } from '@/features/outreach/components/VariantPreview';
import styles from '../OutreachPage.module.css';

const STEP_KEYS = ['outreach_step_1', 'outreach_step_2', 'outreach_step_3'];

/**
 * OutreachPage — 3-step broadcast flow orchestrator.
 *
 * Step 1: Select patient segment and load patients.
 * Step 2: Compose message body and generate 3 variants.
 * Step 3: Preview variants and send broadcast.
 */
export const OutreachPage = () => {
    const { t } = useLanguage();
    const {
        segmentType,
        dateRange,
        patients,
        body,
        variants,
        sendProgress,
        sendResult,
        loading,
        error,
        setSegmentType,
        setDateRange,
        setPatients,
        fetchPatients,
        setBody,
        generateVariants,
        sendBroadcast
    } = useOutreach();

    const [currentStep, setCurrentStep] = React.useState(1);
    const [showEmptyError, setShowEmptyError] = React.useState(false);

    const hasPatients = patients.length > 0;
    const hasVariants = variants.length > 0;

    // Step 1: Load patients
    const handleLoadPatients = async () => {
        const { startDate, endDate } = dateRange;
        await fetchPatients(segmentType, startDate || undefined, endDate || undefined);
        setCurrentStep(2);
    };

    // Step 2: Generate variants
    const handleGenerateVariants = () => {
        if (!body || !body.trim()) {
            setShowEmptyError(true);
            return;
        }
        setShowEmptyError(false);
        generateVariants();
        setCurrentStep(3);
    };

    // Step 3: Send broadcast
    const handleSend = async () => {
        await sendBroadcast();
    };

    // When body changes, clear the empty error
    const handleBodyChange = (newBody) => {
        setBody(newBody);
        if (showEmptyError) setShowEmptyError(false);
    };

    // When segment type changes, reset to step 1 patients
    const handleSegmentTypeChange = (type) => {
        setSegmentType(type);
        setPatients([]);
    };

    // Step indicator click handler
    const goToStep = (step) => {
        // Can only go forward or to a step that has prerequisites
        if (step === 1) setCurrentStep(1);
        if (step === 2 && (hasPatients || segmentType)) setCurrentStep(2);
        if (step === 3 && hasVariants) setCurrentStep(3);
    };

    return (
        <MainLayout title={t('outreach_title')}>
            <section className={styles.OutreachPage__container}>
                <h1 className={styles['OutreachPage__outreach__title']}>
                    {t('outreach_title')}
                </h1>

                {/* Step Indicator */}
                <nav className={styles['OutreachPage__outreach__steps']} aria-label={t('progress')}>
                    {STEP_KEYS.map((key, i) => {
                        const stepNum = i + 1;
                        const isActive = currentStep === stepNum;
                        const isCompleted = stepNum < currentStep;
                        return (
                            <button
                                key={key}
                                type="button"
                                className={[
                                    styles['OutreachPage__outreach__step'],
                                    isActive ? styles['OutreachPage__outreach__step--active'] : '',
                                    isCompleted ? styles['OutreachPage__outreach__step--completed'] : ''
                                ].filter(Boolean).join(' ')}
                                onClick={() => goToStep(stepNum)}
                                disabled={stepNum > currentStep}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                <span className={styles['OutreachPage__outreach__step-number']}>
                                    {isCompleted ? '✓' : stepNum}
                                </span>
                                <span className={styles['OutreachPage__outreach__step-label']}>
                                    {t(key)}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* Step Content */}
                <div className={styles['OutreachPage__outreach__content']}>
                    {currentStep === 1 && (
                        <SegmentSelector
                            segmentType={segmentType}
                            dateRange={dateRange}
                            onSegmentTypeChange={handleSegmentTypeChange}
                            onDateRangeChange={setDateRange}
                            onLoadPatients={handleLoadPatients}
                            loading={loading}
                            patients={patients}
                            error={error}
                            fetched={true}
                        />
                    )}

                    {currentStep === 2 && (
                        <>
                            <SegmentSelector
                                segmentType={segmentType}
                                dateRange={dateRange}
                                onSegmentTypeChange={handleSegmentTypeChange}
                                onDateRangeChange={setDateRange}
                                onLoadPatients={handleLoadPatients}
                                loading={loading}
                                patients={patients}
                                error={error}
                                fetched={true}
                            />
                            <MessageComposer
                                body={body}
                                onBodyChange={handleBodyChange}
                                onGenerateVariants={handleGenerateVariants}
                                hasVariants={hasVariants}
                                showEmptyError={showEmptyError}
                            />
                        </>
                    )}

                    {currentStep === 3 && (
                        <>
                            <MessageComposer
                                body={body}
                                onBodyChange={handleBodyChange}
                                onGenerateVariants={handleGenerateVariants}
                                hasVariants={hasVariants}
                                showEmptyError={showEmptyError}
                            />
                            <VariantPreview
                                variants={variants}
                                patients={patients}
                                onSend={handleSend}
                                sending={loading}
                                sendResult={sendResult}
                            />
                        </>
                    )}
                </div>

                {/* Send Progress Bar */}
                {sendProgress !== null && sendProgress < 100 && (
                    <div className={styles['OutreachPage__outreach__progress']} role="progressbar" aria-valuenow={sendProgress}>
                        <div
                            className={styles['OutreachPage__outreach__progress-bar']}
                            style={{ width: `${sendProgress}%` }}
                        />
                    </div>
                )}
            </section>
        </MainLayout>
    );
};
