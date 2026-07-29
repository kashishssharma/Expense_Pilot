const InsightsService = require('./insightsService');
const db = require('../db/pool');

jest.mock('../db/pool');

describe('InsightsService - Rule-Based Financial Insights Engine', () => {
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

  test('should detect high category concentration (>40%)', async () => {
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
});
