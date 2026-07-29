/**
 * Financial Insights Service — Core Business Logic & SQL Aggregations.
 * Provides financial metrics, weekly patterns, and rule-based savings insights.
 */
const db = require('../db/pool');

class InsightsService {
  /**
   * Get overall high-level statistics for the user's dashboard.
   */
  static async getOverviewStats(userId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Current month total spend
    const currentRes = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
      FROM expenses
      WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, currentMonth, currentYear]);

    // Previous month total spend
    const lastRes = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, lastMonth, lastYear]);

    // Category breakdown for current month
    const categoryRes = await db.query(`
      SELECT category, SUM(amount) AS total, COUNT(*) AS count
      FROM expenses
      WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
      GROUP BY category
      ORDER BY total DESC
    `, [userId, currentMonth, currentYear]);

    const monthlyTotal = parseFloat(currentRes.rows[0].total);
    const lastMonthTotal = parseFloat(lastRes.rows[0].total);
    const transactionCount = parseInt(currentRes.rows[0].count, 10);

    const categories = categoryRes.rows.map(row => ({
      category: row.category,
      total: parseFloat(row.total),
      count: parseInt(row.count, 10),
      percentage: monthlyTotal > 0 ? parseFloat((parseFloat(row.total) / monthlyTotal * 100).toFixed(1)) : 0
    }));

    const changePercentage = lastMonthTotal > 0
      ? parseFloat(((monthlyTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1))
      : 0;

    return {
      monthlyTotal,
      lastMonthTotal,
      changePercentage,
      transactionCount,
      topCategory: categories.length > 0 ? categories[0] : null,
      categoryBreakdown: categories
    };
  }

  /**
   * Get weekly spending patterns by day of the week.
   */
  static async getWeeklyPattern(userId) {
    const res = await db.query(`
      SELECT 
        TRIM(TO_CHAR(date, 'Day')) AS day_name,
        EXTRACT(ISODOW FROM date) AS day_num,
        AVG(amount) AS average_amount,
        SUM(amount) AS total_amount
      FROM expenses
      WHERE user_id = $1
      GROUP BY day_name, day_num
      ORDER BY day_num ASC
    `, [userId]);

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklyPattern = {};
    dayNames.forEach(day => { weeklyPattern[day] = 0; });

    res.rows.forEach(row => {
      const day = row.day_name.trim();
      if (weeklyPattern.hasOwnProperty(day)) {
        weeklyPattern[day] = parseFloat(parseFloat(row.average_amount).toFixed(2));
      }
    });

    return { weeklyPattern };
  }

  /**
   * Financial Insights Engine — Generates actionable spending advice using business rules.
   */
  static async generateInsights(userId) {
    const insights = [];
    
    // Fetch user expenses
    const expensesRes = await db.query(`
      SELECT amount, category, date
      FROM expenses
      WHERE user_id = $1
      ORDER BY date DESC
    `, [userId]);

    if (expensesRes.rows.length === 0) {
      return {
        insights: [{
          type: 'info',
          priority: 'low',
          message: 'Start logging your expenses to unlock personalized financial insights!'
        }],
        totalPotentialSavings: 0
      };
    }

    const expenses = expensesRes.rows.map(r => ({
      amount: parseFloat(r.amount),
      category: r.category,
      date: new Date(r.date)
    }));

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Rule 1: High Category Concentration Warning (>40% of total spend in 1 category)
    const categoryTotals = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const FIXED_CATEGORIES = ['Rent', 'Housing', 'Bills', 'Utilities', 'Healthcare', 'Education', 'EMI'];

    // Rule 1: High Discretionary Spending Concentration (>30% of total spend in 1 variable category)
    let topDiscretionaryCategory = null;
    let topDiscretionaryAmount = 0;

    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (!FIXED_CATEGORIES.includes(cat) && amt > topDiscretionaryAmount) {
        topDiscretionaryAmount = amt;
        topDiscretionaryCategory = cat;
      }
    }

    if (topDiscretionaryCategory && totalSpent > 0) {
      const concentrationPct = (topDiscretionaryAmount / totalSpent) * 100;
      if (concentrationPct >= 15) {
        const potentialSaving = parseFloat((topDiscretionaryAmount * 0.10).toFixed(2));
        insights.push({
          type: 'high_concentration',
          priority: 'high',
          message: `Discretionary category "${topDiscretionaryCategory}" accounts for ${concentrationPct.toFixed(0)}% of your total spending. A 10% reduction could save ₹${potentialSaving}/month.`,
          potentialSavings: potentialSaving
        });
      }
    }

    // Informational note for high fixed commitment (e.g. Rent taking >50%)
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (FIXED_CATEGORIES.includes(cat)) {
        const pct = (amt / totalSpent) * 100;
        if (pct >= 50) {
          insights.push({
            type: 'fixed_expense_info',
            priority: 'low',
            message: `Fixed commitment "${cat}" accounts for ${pct.toFixed(0)}% of your monthly budget (₹${amt.toFixed(2)}).`,
            potentialSavings: 0
          });
        }
      }
    }

    // Rule 2: Weekend vs Weekday Spending Multiplier (>1.5x)
    const weekendExpenses = expenses.filter(e => e.date.getDay() === 0 || e.date.getDay() === 6);
    const weekdayExpenses = expenses.filter(e => e.date.getDay() !== 0 && e.date.getDay() !== 6);

    const weekendAvg = weekendExpenses.length > 0 
      ? weekendExpenses.reduce((sum, e) => sum + e.amount, 0) / weekendExpenses.length 
      : 0;
    const weekdayAvg = weekdayExpenses.length > 0 
      ? weekdayExpenses.reduce((sum, e) => sum + e.amount, 0) / weekdayExpenses.length 
      : 0;

    if (weekdayAvg > 0 && weekendAvg > weekdayAvg * 1.5) {
      const potentialSaving = parseFloat(((weekendAvg - weekdayAvg) * 8).toFixed(2));
      insights.push({
        type: 'weekend_spending',
        priority: 'medium',
        message: `Your weekend average (₹${weekendAvg.toFixed(0)}) is ${(weekendAvg / weekdayAvg).toFixed(1)}x higher than weekdays. Planning ahead could save ₹${potentialSaving}/month.`,
        potentialSavings: potentialSaving
      });
    }

    // Rule 3: Budget Overrun Warnings
    const budgetsRes = await db.query(`
      SELECT 
        b.category,
        b.monthly_limit,
        COALESCE(SUM(e.amount), 0) AS current_spent
      FROM budgets b
      LEFT JOIN expenses e 
        ON b.category = e.category 
        AND b.user_id = e.user_id
        AND EXTRACT(MONTH FROM e.date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM e.date) = EXTRACT(YEAR FROM CURRENT_DATE)
      WHERE b.user_id = $1
      GROUP BY b.id, b.category, b.monthly_limit
    `, [userId]);

    budgetsRes.rows.forEach(b => {
      const limit = parseFloat(b.monthly_limit);
      const spent = parseFloat(b.current_spent);
      if (spent > limit) {
        const overage = parseFloat((spent - limit).toFixed(2));
        insights.push({
          type: 'over_budget',
          priority: 'high',
          message: `Over budget in "${b.category}" by ₹${overage}. Trim spending to stay under your ₹${limit} limit.`,
          potentialSavings: overage
        });
      }
    });

    // Fallback if no issues detected
    if (insights.length === 0) {
      insights.push({
        type: 'on_track',
        priority: 'low',
        message: 'Great job! Your spending is well-balanced and within budget.'
      });
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

    const totalPotentialSavings = insights.reduce((sum, r) => sum + (r.potentialSavings || 0), 0);

    return {
      insights,
      totalPotentialSavings: parseFloat(totalPotentialSavings.toFixed(2))
    };
  }
}

module.exports = InsightsService;
