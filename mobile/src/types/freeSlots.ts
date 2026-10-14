export interface FreeSlot {
    time: string;
    iso: string;
    is_break?: boolean;
    is_out_of_hours?: boolean;
}

export interface FreeSlotDay {
    date: string;
    dayName: string;
    slots: FreeSlot[];
}

export interface NextFreeSlotsResponse {
    results: FreeSlotDay[];
    nextStartDate?: string | null;
}
