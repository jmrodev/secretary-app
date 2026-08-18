import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './DocumentViewerModal.module.css';

/**
 * DocumentViewerModal Molecule Component.
 * Follows AGENTS.md: Functional component, Named Export, BEM + CSS Modules.
 * Renders an interactive modal for viewing documents and images with Zoom, Rotation, Download controls, and List Navigation.
 */
export const DocumentViewerModal = ({
    isOpen,
    onClose,
    file,
    filesList = [],
    onSelectFile
}) => {
    const { t } = useLanguage();
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    // Calculate current index within filesList
    const activeIndex = filesList.findIndex(
        f => (f.id && file?.id && f.id === file.id) || (f.file_url && file?.file_url && f.file_url === file.file_url)
    );
    const hasMultipleFiles = filesList.length > 1 && activeIndex !== -1;
    const hasPrev = hasMultipleFiles && activeIndex > 0;
    const hasNext = hasMultipleFiles && activeIndex < filesList.length - 1;

    // Reset zoom and rotation whenever a new file is opened
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setRotation(0);
        }
    }, [isOpen, file]);

    const handlePrevFile = useCallback(() => {
        if (hasPrev && onSelectFile) {
            onSelectFile(filesList[activeIndex - 1]);
        }
    }, [hasPrev, onSelectFile, filesList, activeIndex]);

    const handleNextFile = useCallback(() => {
        if (hasNext && onSelectFile) {
            onSelectFile(filesList[activeIndex + 1]);
        }
    }, [hasNext, onSelectFile, filesList, activeIndex]);

    // Keyboard navigation (ArrowLeft & ArrowRight)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                handlePrevFile();
            } else if (e.key === 'ArrowRight') {
                handleNextFile();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handlePrevFile, handleNextFile]);

    if (!isOpen || !file) return null;

    const fileUrl = file.file_url || file.url || '';
    const fileName = file.file_name || file.name || t('medical_documents') || 'Documento';
    const isImage = file.file_type?.includes('image') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileUrl);
    const isPdf = file.file_type?.includes('pdf') || /\.pdf$/i.test(fileUrl);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleRotateRight = () => setRotation(prev => (prev + 90) % 360);
    const handleRotateLeft = () => setRotation(prev => (prev - 90 + 360) % 360);
    const handleReset = () => {
        setZoom(1);
        setRotation(0);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${fileName}`}
            size="xl"
            className={styles.modalContent}
        >
            <div className={styles.root}>
                {/* Control Toolbar */}
                <header className={styles.toolbar}>
                    {/* List Navigation Group */}
                    {hasMultipleFiles && (
                        <div className={styles.controlsGroup}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handlePrevFile}
                                disabled={!hasPrev}
                                title={t('previous') || 'Anterior (←)'}
                                icon={<Icon name="chevron_left" size="1.2rem" />}
                            >
                                {t('prev') || 'Anterior'}
                            </Button>
                            <span className={styles.counterLabel}>
                                {activeIndex + 1} / {filesList.length}
                            </span>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleNextFile}
                                disabled={!hasNext}
                                title={t('next') || 'Siguiente (→)'}
                                iconRight={<Icon name="chevron_right" size="1.2rem" />}
                            >
                                {t('next') || 'Siguiente'}
                            </Button>
                        </div>
                    )}

                    {/* Image Controls Group */}
                    <div className={styles.controlsGroup}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomIn}
                            title={t('zoom_in') || 'Acercar (+)'}
                            icon={<Icon name="zoom_in" size="1.2rem" />}
                            disabled={!isImage}
                        />
                        <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomOut}
                            title={t('zoom_out') || 'Alejar (-)'}
                            icon={<Icon name="zoom_out" size="1.2rem" />}
                            disabled={!isImage}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            title={t('reset_view') || 'Restablecer'}
                            icon={<Icon name="restart_alt" size="1.2rem" />}
                            disabled={!isImage}
                        />
                    </div>

                    {/* Rotation Controls Group */}
                    <div className={styles.controlsGroup}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRotateLeft}
                            title={t('rotate_left') || 'Girar a la izquierda'}
                            icon={<Icon name="rotate_left" size="1.2rem" />}
                            disabled={!isImage}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRotateRight}
                            title={t('rotate_right') || 'Girar a la derecha'}
                            icon={<Icon name="rotate_right" size="1.2rem" />}
                            disabled={!isImage}
                        />
                    </div>

                    {/* External Actions Group */}
                    <div className={styles.controlsGroup}>
                        <Button
                            to={fileUrl}
                            target="_blank"
                            variant="ghost"
                            size="sm"
                            title={t('open_in_new_tab') || 'Abrir en pestaña nueva'}
                            icon={<Icon name="open_in_new" size="1.2rem" />}
                        />
                        <Button
                            to={fileUrl}
                            target="_blank"
                            variant="secondary"
                            size="sm"
                            icon={<Icon name="download" size="1.2rem" />}
                        >
                            {t('download') || 'Descargar'}
                        </Button>
                    </div>
                </header>

                {/* Viewport Display Area */}
                <main className={styles.viewport}>
                    {/* Floating Side Nav Arrows */}
                    {hasPrev && (
                        <button
                            type="button"
                            className={`${styles.navArrow} ${styles.navArrowLeft}`}
                            onClick={handlePrevFile}
                            aria-label="Archivo anterior"
                        >
                            <Icon name="chevron_left" size="2.5rem" />
                        </button>
                    )}

                    {hasNext && (
                        <button
                            type="button"
                            className={`${styles.navArrow} ${styles.navArrowRight}`}
                            onClick={handleNextFile}
                            aria-label="Archivo siguiente"
                        >
                            <Icon name="chevron_right" size="2.5rem" />
                        </button>
                    )}

                    {isImage && (
                        <div className={styles.imageContainer}>
                            <img
                                src={fileUrl}
                                alt={fileName}
                                className={styles.previewImage}
                                style={{
                                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                    transition: 'transform 0.2s ease-in-out'
                                }}
                            />
                        </div>
                    )}

                    {isPdf && (
                        <div className={styles.pdfContainer}>
                            <iframe
                                src={fileUrl}
                                title={fileName}
                                className={styles.pdfIframe}
                            />
                        </div>
                    )}

                    {!isImage && !isPdf && (
                        <div className={styles.genericFileBox}>
                            <Icon name="description" size="4rem" />
                            <h4>{fileName}</h4>
                            <p>{file.description || t('no_description') || 'Sin descripción'}</p>
                            <Button to={fileUrl} target="_blank" variant="primary" size="md" icon={<Icon name="download" size="1.2rem" />}>
                                {t('download_file') || 'Descargar Archivo'}
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </Modal>
    );
};
