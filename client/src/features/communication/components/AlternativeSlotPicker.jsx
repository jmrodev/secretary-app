import React, { useEffect } from 'react';
import SlotExplorerDropdown from '@/features/appointments/components/ui/SlotExplorerDropdown';
import { useNextFreeSlot } from '@/features/appointments/hooks/useNextFreeSlot';

/**
 * AlternativeSlotPicker Molecule.
 * Thin wrapper around SlotExplorerDropdown with its OWN useNextFreeSlot
 * instance (design decision), so Suggest Alternative always offers fresh
 * slots for the pending booking's doctor. Fetches on open; hands the chosen
 * slot iso to the queue via onSubmit.
 */
export const AlternativeSlotPicker = ({ item, onClose, onSubmit }) => {
    const nextSlot = useNextFreeSlot(item?.doctor_id);

    // React 19 Effect Event: stable poll callback that always reads the
    // latest fetchNextFreeSlots (its identity changes as nextSlotData grows).
    const onOpen = React.useEffectEvent(() => {
        nextSlot.fetchNextFreeSlots();
    });

    useEffect(() => {
        if (item) onOpen();
    }, [item]);

    return (
        <SlotExplorerDropdown
            isOpen={!!item}
            onClose={onClose}
            loading={nextSlot.loading}
            nextSlotData={nextSlot.nextSlotData}
            includeOutOfHours={nextSlot.includeOutOfHours}
            onToggleOutOfHours={nextSlot.setIncludeOutOfHours}
            slotsPage={nextSlot.slotsPage}
            setSlotsPage={nextSlot.setSlotsPage}
            slotPages={nextSlot.slotPages}
            onSelect={(iso) => onSubmit(iso)}
            onWhatsApp={() => {}}
            jumpToMonth={nextSlot.jumpToMonth}
            fetchNextFreeSlots={nextSlot.fetchNextFreeSlots}
            hasNextGroup={nextSlot.hasNextGroup}
        />
    );
};
