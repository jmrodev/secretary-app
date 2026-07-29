import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentSelector } from '../SegmentSelector';

describe('SegmentSelector', () => {
    const defaultProps = {
        segmentType: '',
        dateRange: { startDate: '', endDate: '' },
        onSegmentTypeChange: vi.fn(),
        onDateRangeChange: vi.fn(),
        onLoadPatients: vi.fn(),
        loading: false,
        patients: [],
        error: null
    };

    const getLoadButton = () => screen.getByRole('button');

    it('should render segment type select with placeholder', () => {
        render(<SegmentSelector {...defaultProps} />);
        expect(screen.getByText('outreach_segment_placeholder')).toBeInTheDocument();
    });

    it('should show 6 segment options', () => {
        render(<SegmentSelector {...defaultProps} />);
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        // 1 placeholder + 6 options = 7 option elements
        expect(select.options.length).toBe(7);
    });

    it('should call onSegmentTypeChange when selecting a segment', () => {
        const onSegmentTypeChange = vi.fn();
        render(<SegmentSelector {...defaultProps} onSegmentTypeChange={onSegmentTypeChange} />);

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'this_week' } });
        expect(onSegmentTypeChange).toHaveBeenCalledWith('this_week');
    });

    it('should show date range inputs for date_range type', () => {
        render(<SegmentSelector {...defaultProps} segmentType="date_range" />);

        expect(screen.getByLabelText('outreach_segment_start_date')).toBeInTheDocument();
        expect(screen.getByLabelText('outreach_segment_end_date')).toBeInTheDocument();
    });

    it('should show date range inputs for custom type', () => {
        render(<SegmentSelector {...defaultProps} segmentType="custom" />);

        expect(screen.getByLabelText('outreach_segment_start_date')).toBeInTheDocument();
        expect(screen.getByLabelText('outreach_segment_end_date')).toBeInTheDocument();
    });

    it('should call onDateRangeChange when start date changes', () => {
        const onDateRangeChange = vi.fn();
        render(
            <SegmentSelector
                {...defaultProps}
                segmentType="date_range"
                onDateRangeChange={onDateRangeChange}
            />
        );

        fireEvent.change(screen.getByLabelText('outreach_segment_start_date'), {
            target: { value: '2024-01-01' }
        });
        expect(onDateRangeChange).toHaveBeenCalledWith('2024-01-01', '');
    });

    it('should call onDateRangeChange when end date changes', () => {
        const onDateRangeChange = vi.fn();
        render(
            <SegmentSelector
                {...defaultProps}
                segmentType="date_range"
                dateRange={{ startDate: '2024-01-01', endDate: '' }}
                onDateRangeChange={onDateRangeChange}
            />
        );

        fireEvent.change(screen.getByLabelText('outreach_segment_end_date'), {
            target: { value: '2024-12-31' }
        });
        expect(onDateRangeChange).toHaveBeenCalledWith('2024-01-01', '2024-12-31');
    });

    it('should hide date inputs when segment type does not require dates', () => {
        render(<SegmentSelector {...defaultProps} segmentType="this_week" />);

        expect(screen.queryByLabelText('outreach_segment_start_date')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('outreach_segment_end_date')).not.toBeInTheDocument();
    });

    it('should call onLoadPatients when load button is clicked', () => {
        const onLoadPatients = vi.fn();
        render(
            <SegmentSelector
                {...defaultProps}
                segmentType="this_week"
                onLoadPatients={onLoadPatients}
            />
        );

        fireEvent.click(getLoadButton());
        expect(onLoadPatients).toHaveBeenCalledTimes(1);
    });

    it('should disable load button when no segment is selected', () => {
        render(<SegmentSelector {...defaultProps} segmentType="" />);

        expect(getLoadButton()).toBeDisabled();
    });

    it('should show loading state on button', () => {
        render(<SegmentSelector {...defaultProps} segmentType="this_week" loading={true} />);

        expect(screen.getByText('outreach_segment_loading')).toBeInTheDocument();
    });

    it('should display patient count when patients are loaded', () => {
        const patients = [
            { id: 1, full_name: 'John Doe', phone: '5491111111111' },
            { id: 2, full_name: 'Jane Smith', phone: '5492222222222' }
        ];
        render(<SegmentSelector {...defaultProps} segmentType="this_week" patients={patients} />);

        // The count element is rendered with a data-count attribute
        const countEl = screen.getByRole('status');
        expect(countEl).toHaveAttribute('data-count', '2');
    });

    it('should display empty state when no patients found', () => {
        render(<SegmentSelector {...defaultProps} segmentType="this_week" patients={[]} fetched={true} />);

        expect(screen.getByText('outreach_segment_empty')).toBeInTheDocument();
    });

    it('should display error message when error is set', () => {
        render(<SegmentSelector {...defaultProps} segmentType="this_week" error="Network error" />);

        expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should disable load button when date_range is selected but dates are missing', () => {
        render(<SegmentSelector {...defaultProps} segmentType="date_range" />);

        expect(getLoadButton()).toBeDisabled();
    });

    it('should enable load button when date_range has both dates', () => {
        render(
            <SegmentSelector
                {...defaultProps}
                segmentType="date_range"
                dateRange={{ startDate: '2024-01-01', endDate: '2024-12-31' }}
            />
        );

        expect(getLoadButton()).not.toBeDisabled();
    });
});
