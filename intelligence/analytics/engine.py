"""
Intelligence Engine — Core ML/analytics module.

Provides:
  - Spending pattern analysis (category breakdown, weekly patterns, top merchants)
  - Anomaly detection using Isolation Forest (scikit-learn)
  - Spending predictions using Linear Regression
  - Personalized budget recommendations based on historical data
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
import logging

logger = logging.getLogger(__name__)


class IntelligenceEngine:
    """Stateless analytics engine. All methods take a DataFrame and return dicts."""

    @staticmethod
    def analyze_spending(df):
        """
        Analyze spending patterns across categories, days, and time periods.
        Returns category breakdown, daily averages, weekly patterns, and top merchants.
        """
        if df.empty:
            return {
                'categories': [], 'dailyAverage': 0, 'weeklyPattern': {},
                'totalSpent': 0, 'transactionCount': 0
            }

        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df['amount'] = df['amount'].astype(float)
        total = df['amount'].sum()

        # Category breakdown
        cat_data = df.groupby('category')['amount'].agg(['sum', 'count', 'mean']).round(2)
        categories = []
        for cat, row in cat_data.sort_values('sum', ascending=False).iterrows():
            categories.append({
                'category': cat,
                'total': float(row['sum']),
                'count': int(row['count']),
                'average': float(row['mean']),
                'percentage': round(float(row['sum']) / total * 100, 1) if total > 0 else 0
            })

        # Daily average
        date_range = (df['date'].max() - df['date'].min()).days + 1
        daily_avg = round(float(total) / max(date_range, 1), 2)

        # Weekly spending pattern
        df['day_of_week'] = df['date'].dt.day_name()
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        weekly = df.groupby('day_of_week')['amount'].mean().round(2)
        weekly_pattern = {d: float(weekly.get(d, 0)) for d in day_order}

        return {
            'categories': categories,
            'dailyAverage': daily_avg,
            'weeklyPattern': weekly_pattern,
            'totalSpent': round(float(total), 2),
            'transactionCount': len(df)
        }

    @staticmethod
    def detect_anomalies(df, contamination=0.05):
        """
        Detect unusual transactions using Isolation Forest.
        Flags transactions that are statistical outliers in terms of amount and timing.
        Returns a list of flagged transactions with z-scores and explanations.
        """
        if len(df) < 10:
            return {
                'anomalies': [],
                'message': 'Need at least 10 transactions for anomaly detection.',
                'totalFlagged': 0
            }

        df = df.copy()
        df['amount'] = df['amount'].astype(float)
        df['date'] = pd.to_datetime(df['date'])

        # Build features: amount + day of week
        features = pd.DataFrame({
            'amount': df['amount'],
            'day_of_week': df['date'].dt.dayofweek
        })

        # Run Isolation Forest
        model = IsolationForest(
            contamination=min(0.3, max(0.01, contamination)),
            random_state=42,
            n_estimators=100
        )
        predictions = model.fit_predict(features)

        # Calculate z-scores for context
        mean_amt = df['amount'].mean()
        std_amt = df['amount'].std()

        anomalies = []
        for idx in np.where(predictions == -1)[0]:
            row = df.iloc[idx]
            z = (float(row['amount']) - mean_amt) / std_amt if std_amt > 0 else 0
            anomalies.append({
                'id': str(row.get('id', '')),
                'amount': float(row['amount']),
                'date': str(row['date'].date()) if hasattr(row['date'], 'date') else str(row['date']),
                'category': row.get('category', 'Unknown'),
                'notes': row.get('notes', ''),
                'zScore': round(float(z), 2),
                'reason': 'Unusually high amount' if z > 2 else
                          'Unusually low amount' if z < -2 else
                          'Unusual spending pattern'
            })

        anomalies.sort(key=lambda x: abs(x['zScore']), reverse=True)

        return {
            'anomalies': anomalies,
            'totalFlagged': len(anomalies),
            'averageAmount': round(float(mean_amt), 2),
            'stdDeviation': round(float(std_amt), 2) if not np.isnan(std_amt) else 0
        }

    @staticmethod
    def predict_spending(df, months_ahead=3):
        """
        Predict future monthly spending using Linear Regression on historical trends.
        Also predicts per-category spending. Returns predictions with confidence score.
        """
        if len(df) < 5:
            return {'predictions': [], 'message': 'Need more data for predictions.', 'confidence': 0}

        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df['amount'] = df['amount'].astype(float)
        df['month_num'] = df['date'].dt.year * 12 + df['date'].dt.month

        # Monthly totals
        monthly = df.groupby('month_num')['amount'].sum().reset_index()

        if len(monthly) < 3:
            return {'predictions': [], 'message': 'Need at least 3 months of data.', 'confidence': 0}

        # Fit linear regression
        X = monthly['month_num'].values.reshape(-1, 1)
        y = monthly['amount'].values
        model = LinearRegression()
        model.fit(X, y)

        # Confidence (R² score)
        y_pred = model.predict(X)
        r2 = max(0, float(r2_score(y, y_pred)))

        # Predict future months
        last_month = int(monthly['month_num'].max())
        predictions = []
        for i in range(1, min(months_ahead, 12) + 1):
            future = last_month + i
            predicted = max(0, float(model.predict([[future]])[0]))
            year = future // 12
            month = future % 12 or 12
            if future % 12 == 0:
                year -= 1
            predictions.append({
                'month': f'{year}-{month:02d}',
                'predicted': round(predicted, 2)
            })

        # Per-category predictions
        category_predictions = []
        for cat in df['category'].dropna().unique():
            cat_monthly = df[df['category'] == cat].groupby('month_num')['amount'].sum().reset_index()
            if len(cat_monthly) >= 3:
                X_c = cat_monthly['month_num'].values.reshape(-1, 1)
                y_c = cat_monthly['amount'].values
                m = LinearRegression().fit(X_c, y_c)
                pred = max(0, float(m.predict([[last_month + 1]])[0]))
                category_predictions.append({
                    'category': cat,
                    'predicted': round(pred, 2)
                })

        category_predictions.sort(key=lambda x: x['predicted'], reverse=True)

        return {
            'predictions': predictions,
            'categoryPredictions': category_predictions,
            'confidence': round(r2 * 100, 1),
            'trend': 'increasing' if model.coef_[0] > 0 else 'decreasing',
            'monthlySlope': round(float(model.coef_[0]), 2)
        }

    @staticmethod
    def generate_recommendations(df, budgets_df=None):
        """
        Generate personalized savings recommendations based on spending analysis.
        Considers category concentration, weekend vs weekday spending, trends, and budget adherence.
        """
        if df.empty:
            return {
                'recommendations': [{'type': 'info', 'priority': 'low',
                                     'message': 'Start tracking expenses to get personalized tips!'}],
                'totalPotentialSavings': 0
            }

        df = df.copy()
        df['amount'] = df['amount'].astype(float)
        df['date'] = pd.to_datetime(df['date'])
        total = df['amount'].sum()
        recommendations = []

        # 1. Category concentration warning
        cat_spending = df.groupby('category')['amount'].sum()
        if not cat_spending.empty:
            top_cat = cat_spending.idxmax()
            top_pct = (cat_spending.max() / total * 100) if total > 0 else 0
            if top_pct > 40:
                saving = round(float(cat_spending.max() * 0.1), 2)
                recommendations.append({
                    'type': 'high_concentration',
                    'priority': 'high',
                    'message': f'"{top_cat}" takes {top_pct:.0f}% of your spending. Try to reduce it by 10% to save ${saving}/month.',
                    'potentialSavings': saving
                })

        # 2. Weekend vs weekday
        df['is_weekend'] = df['date'].dt.dayofweek >= 5
        weekend_avg = df[df['is_weekend']]['amount'].mean()
        weekday_avg = df[~df['is_weekend']]['amount'].mean()
        if not np.isnan(weekend_avg) and not np.isnan(weekday_avg) and weekend_avg > weekday_avg * 1.5:
            saving = round(float((weekend_avg - weekday_avg) * 8), 2)
            recommendations.append({
                'type': 'weekend_spending',
                'priority': 'medium',
                'message': f'Weekend spending (${weekend_avg:.0f} avg) is {weekend_avg/weekday_avg:.1f}x higher than weekdays. Planning ahead could save ${saving}/month.',
                'potentialSavings': saving
            })

        # 3. Spending trend
        df['month_period'] = df['date'].dt.to_period('M')
        monthly = df.groupby('month_period')['amount'].sum()
        if len(monthly) >= 3:
            recent = monthly.iloc[-2:].mean()
            older = monthly.iloc[:-2].mean()
            if recent > older * 1.2:
                pct = ((recent / older - 1) * 100)
                saving = round(float(recent - older), 2)
                recommendations.append({
                    'type': 'spending_increase',
                    'priority': 'medium',
                    'message': f'Spending is up {pct:.0f}% recently. Reverting to your earlier average could save ${saving}/month.',
                    'potentialSavings': saving
                })

        # 4. Budget adherence
        if budgets_df is not None and not budgets_df.empty:
            budgets_df['monthly_limit'] = budgets_df['monthly_limit'].astype(float)
            budgets_df['current_spent'] = budgets_df['current_spent'].astype(float)
            over = budgets_df[budgets_df['current_spent'] > budgets_df['monthly_limit']]
            for _, b in over.iterrows():
                overage = b['current_spent'] - b['monthly_limit']
                recommendations.append({
                    'type': 'over_budget',
                    'priority': 'high',
                    'message': f'Over budget for "{b["category"]}" by ${overage:.2f}. Reduce spending to stay within your ${b["monthly_limit"]:.0f} limit.',
                    'potentialSavings': round(float(overage), 2)
                })

        # 5. If everything looks good
        if not recommendations:
            recommendations.append({
                'type': 'on_track',
                'priority': 'low',
                'message': 'Great job! Your spending looks healthy. Keep it up!'
            })

        # Sort by priority
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        recommendations.sort(key=lambda x: priority_order.get(x['priority'], 3))

        total_savings = sum(r.get('potentialSavings', 0) for r in recommendations)

        return {
            'recommendations': recommendations,
            'totalPotentialSavings': round(total_savings, 2)
        }
