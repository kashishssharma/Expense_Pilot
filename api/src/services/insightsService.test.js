const InsightsService = require('./insightsService');
const db = require('../db/pool');

jest.mock('../db/pool');

describe('InsightsService - Financial Insights Engine', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return low priority fallback when user has no expenses', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await InsightsService.generateInsights('user-123');

    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].type).toBe('info');
    expect(result.totalPotentialSavings).toBe(0);
  });

  test('should detect high discretionary category concentration (>15%)', async () => {
    const mockExpenses = [
      { amount: '500.00', category: 'Food', date: '2026-07-01' },
      { amount: '100.00', category: 'Transport', date: '2026-07-02' }
    ];

    db.query
      .mockResolvedValueOnce({ rows: mockExpenses }) // expenses query
      .mockResolvedValueOnce({ rows: [] });           // budgets query

    const result = await InsightsService.generateInsights('user-123');

    const highConcentrationRec = result.insights.find(r => r.type === 'high_concentration');
    expect(highConcentrationRec).toBeDefined();
    expect(highConcentrationRec.priority).toBe('high');
    expect(highConcentrationRec.message).toContain('Food');
  });

  test('should classify Rent as a fixed commitment and not suggest 10% reduction', async () => {
    const mockExpenses = [
      { amount: '20000.00', category: 'Rent', date: '2026-07-01' },
      { amount: '3550.00', category: 'Shopping', date: '2026-07-02' }
    ];

    db.query
      .mockResolvedValueOnce({ rows: mockExpenses }) // expenses query
      .mockResolvedValueOnce({ rows: [] });           // budgets query

    const result = await InsightsService.generateInsights('user-123');

    // Rent should be flagged as an informational fixed commitment note
    const rentFixedNote = result.insights.find(r => r.type === 'fixed_expense_info');
    expect(rentFixedNote).toBeDefined();
    expect(rentFixedNote.message).toContain('Fixed commitment "Rent"');
    expect(rentFixedNote.potentialSavings).toBe(0);

    // Reduction advice should target variable discretionary category (Shopping)
    const shoppingRec = result.insights.find(r => r.type === 'high_concentration');
    expect(shoppingRec).toBeDefined();
    expect(shoppingRec.message).toContain('Shopping');
  });

  test('should compute overview stats and return topCategory object', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '600.00', count: '2' }] }) // current month total
      .mockResolvedValueOnce({ rows: [{ total: '400.00' }] })            // last month total
      .mockResolvedValueOnce({ rows: [{ category: 'Food', total: '500.00', count: '1' }] }); // category breakdown

    const stats = await InsightsService.getOverviewStats('user-123');

    expect(stats.monthlyTotal).toBe(600);
    expect(stats.lastMonthTotal).toBe(400);
    expect(stats.topCategory).toEqual({
      category: 'Food',
      total: 500,
      count: 1,
      percentage: 83.3
    });
  });
});
