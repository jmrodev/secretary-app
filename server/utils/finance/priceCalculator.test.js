const { calculatePrice } = require('./priceCalculator');

describe('priceCalculator - calculatePrice', () => {
    let mockPool;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };
        jest.clearAllMocks();
    });

    it('should query the database function and return the calculated price', async () => {
        mockPool.query.mockResolvedValue([{ price: 1500.00 }]);

        const result = await calculatePrice(mockPool, 1, 2, 'consultation', 3);

        expect(mockPool.query).toHaveBeenCalledWith(
            "SELECT fn_calculate_service_price(?, ?, ?, ?) as price",
            [1, 2, 'consultation', 3]
        );
        expect(result).toEqual({
            price: 1500.00,
            explanation: "Calculated via Centralized DB Engine (fn_calculate_service_price)"
        });
    });

    it('should default price to 0 if database returns null or no rows', async () => {
        mockPool.query.mockResolvedValue([]);

        const result = await calculatePrice(mockPool, 1, 2, 'consultation', null);

        expect(result.price).toBe(0);
    });

    it('should throw error if query fails', async () => {
        const error = new Error('Database Error');
        mockPool.query.mockRejectedValue(error);

        await expect(calculatePrice(mockPool, 1, 2, 'consultation', null)).rejects.toThrow('Database Error');
    });
});
