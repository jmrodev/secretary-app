
import React from 'react';
import Modal from '../../../components/molecules/Modal';
import Button from '../../../components/atoms/Button';

/**
 * DeleteFileModal Molecule.
 * Confirmation modal for deleting a file.
 */
const DeleteFileModal = ({
    file,
    onClose,
    onConfirm,
    t
}) => {
    return (
        <Modal
            isOpen={!!file}
            onClose={onClose}
            title={t('confirm_delete')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="danger" onClick={onConfirm}>{t('delete')}</Button>
                </>
            }
        >
            <p>¿Seguro que desea eliminar el archivo <strong>{file?.file_name}</strong>?</p>
        </Modal>
    );
};

export default DeleteFileModal;
